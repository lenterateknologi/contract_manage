import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { ArrowDown, ExternalLink, FileText, MessageSquare, RefreshCw, Search, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contract, ContractMessage } from '@/pages/contracts/types';
import { contractApi } from '@/pages/contracts/utils';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useToast } from '@/components/ui/feedback/Toast';
import DocumentPreviewModal from '@/pages/contracts/components/modals/DocumentPreviewModal';
import { MessageBubble } from './components/MessageBubble';
import { ChatEditor } from './components/ChatEditor';

interface ContractChatProps {
    contract: Contract;
    meId: string;
    users?: any[];
    onNewMessage: (c: Contract, silent?: boolean) => void;
}

export default function ContractChat({ contract, meId, users = [], onNewMessage }: ContractChatProps) {
    const { showToast } = useToast();
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [previewTarget, setPreviewTarget] = useState<{ url: string; name: string } | null>(null);

    const [mentionSearch, setMentionSearch] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<ContractMessage[]>(contract.messages ?? []);
    const isFirstRender = useRef(true);

    useEffect(() => {
        setMessages(contract.messages ?? []);
        isFirstRender.current = true;
    }, [contract.id]);

    useEffect(() => {
        if (contract.id) {
            contractApi.messages
                .list(contract.id)
                .then((newMsgs) => {
                    if (Array.isArray(newMsgs)) {
                        setMessages((prev: ContractMessage[]) => {
                            if (JSON.stringify(prev) === JSON.stringify(newMsgs)) {
                                return prev;
                            }
                            return newMsgs;
                        });
                    }
                })
                .catch(() => null);
        }
    }, [contract.id]);

    useEffect(() => {
        contractApi.getUsers().then(setAllUsers).catch(console.error);
    }, []);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const msgs = messages;

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
        setShowScrollDown(!isNearBottom);
    };

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    useEffect(() => {
        if (isFirstRender.current) {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
            isFirstRender.current = false;
        } else if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [msgs]);

    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

    const matchingMessages = useMemo(() => {
        if (!search.trim()) return [];
        const s = search.toLowerCase();
        return msgs.filter((m) => {
            const name = (m.user?.name ?? '').toLowerCase();
            const role = (m.user?.role ?? '').toLowerCase();
            const text = (m.message ?? '').toLowerCase();
            return name.includes(s) || role.includes(s) || text.includes(s);
        });
    }, [msgs, search]);

    useEffect(() => {
        setCurrentMatchIndex(0);
    }, [search]);

    const scrollToMatch = (index: number) => {
        if (matchingMessages.length === 0) return;
        const targetMsg = matchingMessages[index];
        if (targetMsg) {
            const el = document.getElementById(`chat-msg-${targetMsg.id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleNextMatch = () => {
        if (matchingMessages.length === 0) return;
        const nextIdx = (currentMatchIndex + 1) % matchingMessages.length;
        setCurrentMatchIndex(nextIdx);
        scrollToMatch(nextIdx);
    };

    const handlePrevMatch = () => {
        if (matchingMessages.length === 0) return;
        const prevIdx = (currentMatchIndex - 1 + matchingMessages.length) % matchingMessages.length;
        setCurrentMatchIndex(prevIdx);
        scrollToMatch(prevIdx);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const [fetchedMsgs, updated] = await Promise.all([
                contractApi.messages.list(contract.id).catch(() => null),
                contractApi.get(contract.id).catch(() => null),
            ]);
            if (Array.isArray(fetchedMsgs)) {
                setMessages(fetchedMsgs);
            }
            if (updated) {
                onNewMessage(updated, true);
            }
        } finally {
            setRefreshing(false);
        }
    };

    const [isDragging, setIsDragging] = useState(false);

    const processFiles = (files: FileList | File[]) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const validFiles: File[] = [];
        Array.from(files).forEach((file) => {
            if (file.size > maxSize) {
                showToast(`Berkas "${file.name}" terlalu besar! Maksimum 10MB per berkas.`, 'danger');
            } else {
                validFiles.push(file);
            }
        });
        if (validFiles.length > 0) {
            setSelectedFiles((prev) => [...prev, ...validFiles]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const involvedParticipants = useMemo(() => {
        const map = new Map<string, any>();
        const myIdStr = String(meId || '');
        const pool = users && users.length > 0 ? users : allUsers;

        const addUser = (u: any) => {
            if (!u) return;
            const uid = String(u.id || u.user_id || '');
            if (uid && uid !== myIdStr && !map.has(uid)) {
                map.set(uid, u);
            }
        };

        // 1. Contract Initiator, Creator, Assigned PIC
        if (contract.creator) addUser(contract.creator);
        if (contract.initiator) addUser(contract.initiator);
        if (contract.assigned_pic) addUser(contract.assigned_pic);
        if (contract.assigned_by) addUser(contract.assigned_by);

        if ((contract as any).creator_id) {
            const u = pool.find((p: any) => String(p.id) === String((contract as any).creator_id));
            if (u) addUser(u);
        }
        if ((contract as any).initiator_id) {
            const u = pool.find((p: any) => String(p.id) === String((contract as any).initiator_id));
            if (u) addUser(u);
        }

        // 2. Approvals List
        if (Array.isArray(contract.approvals)) {
            contract.approvals.forEach((a: any) => {
                if (a.approver) addUser(a.approver);
                if (a.user) addUser(a.user);
                const approverId = a.approver_id || a.user_id;
                if (approverId) {
                    const u = pool.find((p: any) => String(p.id) === String(approverId));
                    if (u) {
                        addUser(u);
                    } else if (a.approver_name) {
                        addUser({ id: String(approverId), name: a.approver_name, role: a.role });
                    }
                }
            });
        }

        // 3. Message participants
        if (Array.isArray(messages)) {
            messages.forEach((m) => {
                if (m.user) addUser(m.user);
            });
        }

        const list = Array.from(map.values());
        if (list.length > 0) {
            return list;
        }

        // Fallback to all users excluding self if no specific approvals/involved found
        return pool.filter((u: any) => String(u.id) !== myIdStr);
    }, [contract, messages, meId, users, allUsers]);

    const allKnownUsers = useMemo(() => {
        const pool = users && users.length > 0 ? users : allUsers;
        return pool;
    }, [users, allUsers]);

    const filteredUsers = useMemo(() => {
        const myIdStr = String(meId || '');
        const pool = (allKnownUsers || []).filter((u: any) => String(u.id) !== myIdStr);

        if (!mentionSearch) {
            return involvedParticipants.length > 0 ? involvedParticipants : pool;
        }
        const s = mentionSearch.toLowerCase();
        return pool.filter((u: any) => u.name && u.name.toLowerCase().includes(s));
    }, [involvedParticipants, mentionSearch, allKnownUsers, meId]);

    const draftKey = `chat_draft_${meId || 'guest'}_${contract.id}`;

    const handleEditorInput = () => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText || '';
        const html = editorRef.current.innerHTML;
        setInput(html);

        if (contract.id) {
            if (text.trim() || html.trim()) {
                localStorage.setItem(draftKey, html);
            } else {
                localStorage.removeItem(draftKey);
            }
        }

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const node = range.startContainer;
            const offset = range.startOffset;

            let textBefore = '';
            if (node.nodeType === Node.TEXT_NODE) {
                textBefore = (node.textContent || '').slice(0, offset);
            } else {
                textBefore = (editorRef.current.innerText || '').slice(0, offset);
            }

            const match = textBefore.match(/@([a-zA-Z0-9_.-]*)$/);
            if (match) {
                setMentionSearch(match[1] || '');
                setShowMentions(true);
                setMentionIndex(0);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (showMentions && filteredUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(filteredUsers[mentionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowMentions(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        if (e.clipboardData && e.clipboardData.files.length > 0) {
            e.preventDefault();
            processFiles(e.clipboardData.files);
            return;
        }
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const insertMention = (user: any) => {
        if (!editorRef.current) return;
        editorRef.current.focus();

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const node = range.startContainer;
            const offset = range.startOffset;

            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                const textBefore = text.slice(0, offset);
                const lastAtIdx = textBefore.lastIndexOf('@');

                if (lastAtIdx !== -1) {
                    range.setStart(node, lastAtIdx);
                    range.setEnd(node, offset);
                    range.deleteContents();
                }
            }

            // Create atomic mention badge (cannot type inside contenteditable=false)
            const mentionSpan = document.createElement('span');
            mentionSpan.className = 'mention-tag font-semibold text-primary select-none';
            mentionSpan.setAttribute('contenteditable', 'false');
            mentionSpan.setAttribute('data-mention-id', String(user.id || ''));
            mentionSpan.setAttribute('data-name', user.name);
            mentionSpan.textContent = `@${user.name}`;

            const spaceNode = document.createTextNode('\u00A0'); // trailing non-breaking space

            range.insertNode(spaceNode);
            range.insertNode(mentionSpan);

            // Move caret strictly after the space node
            const newRange = document.createRange();
            newRange.setStartAfter(spaceNode);
            newRange.setEndAfter(spaceNode);
            sel.removeAllRanges();
            sel.addRange(newRange);
        }

        setShowMentions(false);
        setMentionSearch('');

        const html = editorRef.current.innerHTML;
        setInput(html);
        if (contract.id) {
            localStorage.setItem(draftKey, html);
        }
    };

    useEffect(() => {
        if (!contract.id) return;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft && editorRef.current) {
            editorRef.current.innerHTML = savedDraft;
            setInput(savedDraft);
        } else if (editorRef.current) {
            editorRef.current.innerHTML = '';
            setInput('');
        }
    }, [contract.id, meId, draftKey]);

    // Auto-save draft on beforeunload / unmount
    const lastInputRef = useRef(input);
    useEffect(() => {
        lastInputRef.current = input;
    }, [input]);

    useEffect(() => {
        const handleAutoSave = () => {
            if (!contract.id) return;
            const currentVal = lastInputRef.current;
            if (currentVal && currentVal.trim()) {
                localStorage.setItem(draftKey, currentVal);
            }
        };

        window.addEventListener('beforeunload', handleAutoSave);
        return () => {
            window.removeEventListener('beforeunload', handleAutoSave);
            handleAutoSave();
        };
    }, [contract.id, draftKey]);

    const send = async () => {
        const textContent = (editorRef.current?.innerText || '').trim();
        const htmlContent = input.trim();
        if ((!textContent && !htmlContent && selectedFiles.length === 0) || sending) return;

        setSending(true);
        const tempId = `temp_${Date.now()}`;
        const sentContent = textContent || htmlContent;

        const optimisticMsg: ContractMessage = {
            id: tempId,
            contract_id: contract.id,
            user_id: meId,
            message: sentContent,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            read_by: [meId],
            reactions: [],
            user: {
                id: meId,
                name: 'Anda',
                initials: 'ME',
            },
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setInput('');
        if (editorRef.current) editorRef.current.innerHTML = '';
        localStorage.removeItem(draftKey);

        const filesToSend = [...selectedFiles];
        setSelectedFiles([]);

        try {
            if (filesToSend.length > 0) {
                for (let i = 0; i < filesToSend.length; i++) {
                    const file = filesToSend[i];
                    const msgText = i === 0 ? sentContent : '';
                    const fd = new FormData();
                    if (msgText) fd.append('message', msgText);
                    fd.append('attachment', file);

                    const res = await axios.post(`/api/contracts/${contract.id}/messages`, fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    if (i === 0) {
                        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data : m)));
                    } else {
                        setMessages((prev) => [...prev, res.data]);
                    }
                }
            } else {
                const fd = new FormData();
                fd.append('message', sentContent);

                const res = await axios.post(`/api/contracts/${contract.id}/messages`, fd);
                setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data : m)));
            }

            const updatedContract = await contractApi.get(contract.id).catch(() => null);
            if (updatedContract) {
                onNewMessage(updatedContract, true);
            }
        } catch (err: any) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            showToast(err.response?.data?.message || 'Gagal mengirim pesan.', 'danger');
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-col h-full bg-background relative overflow-hidden select-none"
        >
            {/* Drag & Drop Backdrop Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-xs border-2 border-dashed border-primary flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
                    <div className="p-4 rounded-2xl bg-background shadow-2xl border border-border flex flex-col items-center gap-2">
                        <MessageSquare className="h-10 w-10 text-primary animate-bounce" />
                        <span className="text-sm font-bold text-foreground">Lepaskan Berkas untuk Mengunggah</span>
                        <span className="text-xs text-muted-foreground">Mendukung semua format dokumen & gambar</span>
                    </div>
                </div>
            )}

            {/* Discussion Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                        <MessageSquare size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground truncate max-w-[280px] md:max-w-[400px]">
                                {contract.title}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                                {contract.contract_no || contract.form_no || 'DRAFT'}
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                            {involvedParticipants.length} partisipan dalam diskusi ini
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Search in Messages */}
                    {isSearchOpen ? (
                        <div className="flex items-center gap-1 bg-background border border-border rounded-xl px-2 py-0.5 shadow-2xs animate-in fade-in duration-150">
                            <Search size={13} className="text-muted-foreground shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari percakapan..."
                                className="text-xs text-foreground bg-transparent border-none focus:outline-none w-36 md:w-48 py-1"
                            />
                            {matchingMessages.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold px-1">
                                    <span>{currentMatchIndex + 1}/{matchingMessages.length}</span>
                                    <button
                                        type="button"
                                        onClick={handlePrevMatch}
                                        className="hover:text-foreground cursor-pointer"
                                        title="Sebelumnya"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextMatch}
                                        className="hover:text-foreground cursor-pointer"
                                        title="Berikutnya"
                                    >
                                        ▼
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearch('');
                                }}
                                className="text-muted-foreground hover:text-foreground p-1"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setIsSearchOpen(true);
                                setTimeout(() => searchInputRef.current?.focus(), 100);
                            }}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            title="Cari dalam pesan"
                        >
                            <Search size={15} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Segarkan Percakapan"
                    >
                        <RefreshCw size={15} className={cn(refreshing && 'animate-spin text-primary')} />
                    </button>

                    <a
                        href={`/contracts/${contract.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all shadow-2xs cursor-pointer ml-1"
                        title="Buka Halaman Detail Pengajuan Kontrak di Tab Baru"
                    >
                        <FileText size={13} />
                        <span className="hidden sm:inline">Buka Pengajuan</span>
                        <ExternalLink size={11} className="opacity-70" />
                    </a>
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 flex flex-col select-text"
            >
                {msgs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center text-muted-foreground gap-3">
                        <div className="p-4 rounded-full bg-muted/60 text-muted-foreground">
                            <MessageSquare size={28} />
                        </div>
                        <div className="flex flex-col gap-1 max-w-sm">
                            <span className="text-xs font-bold text-foreground">Belum ada diskusi untuk dokumen ini</span>
                            <span className="text-[11px] leading-relaxed">
                                Mulai percakapan untuk berkoordinasi dengan inisiator, pemeriksa, atau reviewer terkait pengajuan ini.
                            </span>
                        </div>
                    </div>
                ) : (
                    msgs.map((m, index) => {
                        const isMe = String(m.user_id) === String(meId);
                        const prevMsg = index > 0 ? msgs[index - 1] : null;
                        const nextMsg = index < msgs.length - 1 ? msgs[index + 1] : null;

                        const isSameSenderAsPrev = prevMsg !== null && String(prevMsg.user_id) === String(m.user_id);
                        const isSameSenderAsNext = nextMsg !== null && String(nextMsg.user_id) === String(m.user_id);

                        const isFirstInGroup = !isSameSenderAsPrev;
                        const isLastInGroup = !isSameSenderAsNext;

                        return (
                            <div id={`chat-msg-${m.id}`} key={m.id}>
                                <MessageBubble
                                    msg={m}
                                    isMe={isMe}
                                    highlight={search}
                                    knownUsers={allKnownUsers && allKnownUsers.length > 0 ? allKnownUsers : involvedParticipants}
                                    onPreview={(url, name) => setPreviewTarget({ url, name })}
                                    isFirstInGroup={isFirstInGroup}
                                    isLastInGroup={isLastInGroup}
                                />
                            </div>
                        );
                    })
                )}
                <div ref={endRef} />
            </div>

            {/* Quick Scroll Down Floating Button */}
            {showScrollDown && (
                <button
                    type="button"
                    onClick={scrollToBottom}
                    className="absolute bottom-44 right-6 z-30 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all cursor-pointer animate-in fade-in zoom-in-90 duration-150"
                    title="Gulir ke Pesan Terbawah"
                >
                    <ArrowDown size={14} />
                </button>
            )}

            {/* Modular Rich Text Chat Editor */}
            <ChatEditor
                input={input}
                setInput={setInput}
                sending={sending}
                onSend={send}
                selectedFiles={selectedFiles}
                onRemoveFile={removeFile}
                onFileSelect={handleFileSelect}
                editorRef={editorRef}
                fileInputRef={fileInputRef}
                filteredUsers={filteredUsers}
                showMentions={showMentions}
                mentionIndex={mentionIndex}
                setMentionIndex={setMentionIndex}
                insertMention={insertMention}
                handleEditorInput={handleEditorInput}
                handleEditorKeyDown={handleEditorKeyDown}
                handlePaste={handlePaste}
            />

            {/* Document / Image Modal Preview */}
            {previewTarget && (
                <DocumentPreviewModal
                    isOpen={!!previewTarget}
                    onClose={() => setPreviewTarget(null)}
                    url={previewTarget.url}
                    fileName={previewTarget.name}
                />
            )}
        </div>
    );
}
