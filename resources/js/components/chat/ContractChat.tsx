import { discussionsApi } from '@/api';
import { useToast } from '@/components/ui/feedback/Toast';
import { cn } from '@/lib/utils';
import DocumentPreviewModal from '@/pages/contracts/components/modals/DocumentPreviewModal';
import { Contract, ContractMessage } from '@/pages/contracts/types';
import { contractApi } from '@/pages/contracts/utils';
import { usePage } from '@inertiajs/react';
import { ArrowDown, MessageSquare, RefreshCw, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatEditor } from './components/ChatEditor';
import { MessageBubble } from './components/MessageBubble';

interface ContractChatProps {
    contract: Contract;
    meId?: string;
    users?: any[];
    onNewMessage: (c: Contract, silent?: boolean) => void;
}

export default function ContractChat({ contract, meId, users = [], onNewMessage }: ContractChatProps) {
    const { showToast } = useToast();
    const { auth } = usePage<any>().props;
    const authUser = auth?.user;

    const currentUserProfile = useMemo(() => {
        const uid = meId || authUser?.id || '';
        const name = authUser?.name || 'Anda';
        let initials = authUser?.initials || '';
        if (!initials && name) {
            const words = name.trim().split(/\s+/);
            initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
        }
        return {
            id: uid,
            name: name,
            initials: initials || 'ME',
            avatar: authUser?.avatar || authUser?.avatar_url || authUser?.image_src || '',
            avatar_url: authUser?.avatar || authUser?.avatar_url || authUser?.image_src || '',
            role: authUser?.role || authUser?.role_name || '',
        };
    }, [meId, authUser]);
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
    const [messages, setMessages] = useState<ContractMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState<boolean>(true);
    const isFirstRender = useRef(true);

    const fetchMessages = useCallback(async () => {
        if (!contract.id) return;
        try {
            setLoadingMessages(true);
            const res: any = await contractApi.discussions.detail(contract.id);
            const fetched = Array.isArray(res) ? res : (res?.messages ?? []);
            setMessages(fetched);
        } catch {
            const fallback: any = await contractApi.messages.list(contract.id).catch(() => []);
            setMessages(Array.isArray(fallback) ? fallback : (fallback?.messages ?? []));
        } finally {
            setLoadingMessages(false);
        }
    }, [contract.id]);

    useEffect(() => {
        fetchMessages();
        isFirstRender.current = true;
    }, [fetchMessages]);

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

        const currentUserId = meId || authUser?.id || '';
        const optimisticMsg: ContractMessage = {
            id: tempId,
            contract_id: contract.id,
            user_id: currentUserId,
            message: sentContent,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            read_by: [currentUserId],
            reactions: [],
            user: currentUserProfile,
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

                    const res = await discussionsApi.messages.send(contract.id, msgText, file);
                    const msgData = (res as any)?.data || res;

                    if (i === 0) {
                        setMessages((prev) => prev.map((m) => (m.id === tempId ? msgData : m)));
                    } else {
                        setMessages((prev) => [...prev, msgData]);
                    }
                }
            } else {
                const res = await discussionsApi.messages.send(contract.id, sentContent);
                const msgData = (res as any)?.data || res;
                setMessages((prev) => prev.map((m) => (m.id === tempId ? msgData : m)));
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
            className="bg-background relative flex h-full flex-col overflow-hidden select-none"
        >
            {/* Drag & Drop Backdrop Overlay */}
            {isDragging && (
                <div className="bg-primary/10 border-primary animate-in fade-in pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center border-2 border-dashed backdrop-blur-xs duration-150">
                    <div className="bg-background border-border flex flex-col items-center gap-2 rounded-2xl border p-4 shadow-2xl">
                        <MessageSquare className="text-primary h-10 w-10 animate-bounce" />
                        <span className="text-foreground text-sm font-bold">Lepaskan Berkas untuk Mengunggah</span>
                        <span className="text-muted-foreground text-xs">Mendukung semua format dokumen & gambar</span>
                    </div>
                </div>
            )}

            {/* Discussion Header */}
            <div className="border-border bg-muted/20 flex items-center justify-between border-b px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="bg-primary/10 text-primary shrink-0 rounded-xl p-2">
                        <MessageSquare size={16} />
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-foreground max-w-[280px] truncate text-xs font-bold md:max-w-[400px]">{contract.title}</span>
                            <span className="py-0.2 bg-muted text-muted-foreground rounded px-1.5 font-mono text-[10px] font-semibold">
                                {contract.contract_no || contract.form_no || 'DRAFT'}
                            </span>
                        </div>
                        <span className="text-muted-foreground mt-0.5 text-[10px]">{involvedParticipants.length} partisipan dalam diskusi ini</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Search in Messages */}
                    {isSearchOpen ? (
                        <div className="bg-background border-border animate-in fade-in flex items-center gap-1 rounded-xl border px-2 py-0.5 shadow-2xs duration-150">
                            <Search size={13} className="text-muted-foreground shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari percakapan..."
                                className="text-foreground w-36 border-none bg-transparent py-1 text-xs focus:outline-none md:w-48"
                            />
                            {matchingMessages.length > 0 && (
                                <div className="text-muted-foreground flex items-center gap-1 px-1 text-[10px] font-semibold">
                                    <span>
                                        {currentMatchIndex + 1}/{matchingMessages.length}
                                    </span>
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
                            className="hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1.5 transition-all"
                            title="Cari dalam pesan"
                        >
                            <Search size={15} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1.5 transition-all"
                        title="Segarkan Percakapan"
                    >
                        <RefreshCw size={15} className={cn(refreshing && 'text-primary animate-spin')} />
                    </button>
                </div>
            </div>

            {/* Messages Scroll Area with Bottom Alignment & Top Headroom */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 pb-3 select-text">
                <div className="flex min-h-full flex-col justify-end pt-8">
                    {/* Top spacer (headroom) to ensure top message reaction & action bar are never cut off */}
                    <div className="h-6 shrink-0" aria-hidden="true" />

                    {loadingMessages && msgs.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <RefreshCw size={24} className="text-primary animate-spin" />
                            <span className="text-xs font-medium">Memuat percakapan diskusi...</span>
                        </div>
                    ) : msgs.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <div className="bg-muted/60 text-muted-foreground rounded-full p-4">
                                <MessageSquare size={28} />
                            </div>
                            <div className="flex max-w-sm flex-col gap-1">
                                <span className="text-foreground text-xs font-bold">Belum ada diskusi untuk dokumen ini</span>
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
            </div>

            {/* Quick Scroll Down Floating Button */}
            {showScrollDown && (
                <button
                    type="button"
                    onClick={scrollToBottom}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 animate-in fade-in zoom-in-90 absolute right-6 bottom-44 z-30 cursor-pointer rounded-full p-2 shadow-lg transition-all duration-150"
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
