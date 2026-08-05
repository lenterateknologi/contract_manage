import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Contract, ContractMessage } from '@/pages/contracts/types';
import {
    ArrowDown,
    Bold,
    ChevronDown,
    ChevronUp,
    Code,
    Download,
    Eye,
    FileIcon,
    Heading1,
    Heading2,
    Italic,
    Link,
    List,
    ListOrdered,
    MessageSquare,
    Paperclip,
    Quote,
    RefreshCw,
    Save,
    Send,
    Smile,
    Strikethrough,
    Table,
    X,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DocumentPreviewModal from '../modals/DocumentPreviewModal';
import { MentionDropdown } from '../parts/MentionDropdown';
import { useToast } from '@/components/ui/feedback/Toast';

interface Props {
    contract: Contract;
    meId: string;
    users?: any[];
    onNewMessage: (c: Contract) => void;
}

function MsgBubble({
    msg,
    isMe,
    highlight,
    onPreview,
}: {
    msg: ContractMessage;
    isMe: boolean;
    highlight?: string;
    onPreview: (url: string, name: string) => void;
}) {
    const time = msg.created_at.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';
    let attachmentUrl = (msg as any).attachment_url || (msg as any).attachment_path;
    if (attachmentUrl && !attachmentUrl.startsWith('http') && !attachmentUrl.startsWith('/')) {
        attachmentUrl = `/storage/${attachmentUrl}`;
    }
    const attachmentName = (msg as any).attachment_name || (msg as any).file_name || 'Berkas';
    
    let upload_configs: any = null;
    try {
        upload_configs = usePage().props;
    } catch (e) {
        // Safe fallback for standalone previews (like Cosmos)
        upload_configs = null;
    }

    const imageMimes = upload_configs?.upload_configs?.user_avatar?.allowed_mimes ?? ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    const getExtension = (path: string) => {
        if (!path) return '';
        const parts = path.split('.');
        return parts.length > 1 ? parts.pop()?.toLowerCase() ?? '' : '';
    };

    const ext = getExtension(attachmentUrl);
    const isImage = imageMimes.includes(ext);
    const isPdf = ext === 'pdf';

    const renderMessage = (text: string, term?: string) => {
        // ponytail: Clean HTML/Markdown parsing with native list support
        let formatted = text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

        // Ensure raw markdown list symbols are parsed to HTML tags
        formatted = formatted.replace(/(?:^|\n)[-*]\s+(.*)/g, '<ul><li>$1</li></ul>');
        formatted = formatted.replace(/(?:^|\n)\d+\.\s+(.*)/g, '<ol><li>$1</li></ol>');

        // Basic formatting
        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">$1</code>');

        // Mentions
        formatted = formatted.replace(/(@[\w\s.-]+(?:\s|$))/g, `<span class="${isMe ? 'text-primary-foreground font-semibold underline' : 'text-primary font-semibold underline'}">$1</span>`);

        // Highlight
        if (term && term.trim()) {
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            formatted = formatted.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<mark class="bg-yellow-300 text-slate-900 font-semibold px-1 rounded shadow-xs">$1</mark>');
        }

        return (
            <div 
                className="prose dark:prose-invert max-w-none break-words text-[13px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1 [&_li]:my-0.5"
                dangerouslySetInnerHTML={{ __html: formatted }}
            />
        );
    };

    return (
        <div className={cn('animate-in slide-in-from-bottom-1 mb-4 flex flex-col gap-1.5 duration-300', isMe ? 'items-end' : 'items-start')}>
            <div className={cn('flex items-center gap-2 px-1 mb-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                <span className="text-text-main text-xs font-bold">{isMe ? 'Anda' : name}</span>
                {role && (
                    <span className="bg-primary/10 border border-primary/20 text-primary rounded-full px-2.5 py-0.5 text-[9.5px] font-bold tracking-tight uppercase">
                        {role}
                    </span>
                )}
                <span className="text-text-soft text-[10.5px] font-semibold tabular-nums">{time}</span>
            </div>

            <div className={cn('group relative max-w-[82%] min-w-[65px]', isMe ? 'text-right' : 'text-left')}>
                <div
                    className={cn(
                        'rounded-2xl shadow-xs transition-all duration-300',
                        isMe ? 'bg-primary text-primary-foreground font-medium' : 'bg-surface-base border border-surface-border text-text-main font-medium shadow-xs',
                    )}
                >
                    {attachmentUrl && isImage && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onPreview(attachmentUrl, attachmentName);
                            }}
                            className="group/img bg-surface-muted/40 relative cursor-pointer overflow-hidden rounded-t-2xl border-b border-inherit"
                        >
                            <img
                                src={attachmentUrl}
                                alt={attachmentName || 'Image'}
                                className="h-auto max-h-[250px] w-full cursor-pointer object-cover transition-transform duration-500 group-hover/img:scale-105"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onPreview(attachmentUrl, attachmentName);
                                }}
                            />
                        </div>
                    )}

                    <div className="p-3.5">
                        {msg.message && (
                            <div
                                className={cn(
                                    'text-xs leading-relaxed tracking-tight font-medium',
                                    attachmentUrl && !isImage ? 'mb-2 border-b border-inherit pb-2 opacity-80' : '',
                                )}
                            >
                                {renderMessage(msg.message, highlight)}
                            </div>
                        )}

                        {attachmentUrl && !isImage && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (isPdf) {
                                        onPreview(attachmentUrl, attachmentName);
                                    } else {
                                        const link = document.createElement('a');
                                        link.href = attachmentUrl;
                                        link.setAttribute('download', attachmentName);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }
                                }}
                                className={cn(
                                    'group/file flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 transition-all',
                                    isMe
                                        ? 'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                                        : 'border-surface-border bg-surface-muted/60 text-text-main hover:bg-surface-muted',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform group-hover/file:scale-110',
                                        isMe ? 'border-primary-foreground/20 bg-primary-foreground/20 text-primary-foreground' : 'border-surface-border bg-surface-base text-primary',
                                    )}
                                >
                                    <FileIcon size={14} />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <div className="mb-0.5 truncate text-[10px] leading-none font-bold tracking-tight uppercase">
                                        {attachmentName}
                                    </div>
                                    <div className="text-[8.5px] font-extrabold uppercase tracking-wider opacity-70">
                                        {isPdf ? 'PREVIEW' : 'DOWNLOAD'}
                                    </div>
                                </div>
                                <Download size={12} className="opacity-60 transition-opacity group-hover/file:opacity-100" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ContractChat({ contract, meId, users = [], onNewMessage }: Props) {
    const { showToast } = useToast();
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');
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
            contractApi.messages.list(contract.id)
                .then((newMsgs) => {
                    setMessages((prev) => {
                        if (JSON.stringify(prev) === JSON.stringify(newMsgs)) {
                            return prev;
                        }
                        return newMsgs;
                    });
                })
                .catch(() => null);
        }
    }, [contract.id]);

    useEffect(() => {
        contractApi.getUsers().then(setAllUsers).catch(console.error);
    }, []);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const msgs = messages;

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
    const matchRefs = useRef<(HTMLDivElement | null)[]>([]);

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
                contractApi.get(contract.id).catch(() => null)
            ]);
            if (fetchedMsgs) {
                setMessages(fetchedMsgs);
            }
            if (updated) {
                onNewMessage(updated);
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

    const filteredUsers = useMemo(() => {
        if (!mentionSearch) return allUsers;
        const s = mentionSearch.toLowerCase();
        return allUsers.filter((u) => u.name.toLowerCase().includes(s));
    }, [allUsers, mentionSearch]);

    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

    const updateActiveFormats = () => {
        if (!editorRef.current) return;
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            strikethrough: document.queryCommandState('strikeThrough'),
            unorderedList: document.queryCommandState('insertUnorderedList'),
            orderedList: document.queryCommandState('insertOrderedList'),
            h1: document.queryCommandValue('formatBlock') === 'h1',
            h2: document.queryCommandValue('formatBlock') === 'h2',
            blockquote: document.queryCommandValue('formatBlock') === 'blockquote',
            code: document.queryCommandValue('formatBlock') === 'pre',
        });
    };



    // ponytail: Rich Text Formatting helper for contentEditable (WYSIWYG)
    const execFormat = (command: string, value: string | undefined = undefined) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, value);
        setInput(editorRef.current.innerHTML);
        updateActiveFormats();
    };

    const insertMention = (user: any) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, `@${user.name} `);
            setInput(editorRef.current.innerHTML);
        }
        setShowMentions(false);
        setMentionSearch('');
    };

    // LocalStorage draft key for this contract
    const draftKey = `chat_draft_${contract.id}`;
    const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

    // Load draft on mount or contract change
    useEffect(() => {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            setInput(savedDraft);
            if (editorRef.current) {
                editorRef.current.innerHTML = savedDraft;
            }
            setDraftSavedTime('Draf tersimpan');
        } else {
            setInput('');
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
            setDraftSavedTime(null);
        }
    }, [contract.id, draftKey]);

    // Auto save draft whenever input content changes
    useEffect(() => {
        if (input.trim()) {
            localStorage.setItem(draftKey, input);
            setDraftSavedTime('Tersimpan otomatis');
        } else {
            localStorage.removeItem(draftKey);
            setDraftSavedTime(null);
        }
    }, [input, draftKey]);

    // Manual Save Draft function
    const saveDraft = () => {
        if (!input.trim()) {
            localStorage.removeItem(draftKey);
            setDraftSavedTime(null);
            showToast('Draf kosong dihapus.', 'info');
            return;
        }
        localStorage.setItem(draftKey, input);
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setDraftSavedTime(`Tersimpan ${timeStr}`);
        showToast('Draf pesan berhasil disimpan.', 'success');
    };

    const handleContentEditableInput = () => {
        if (editorRef.current) {
            const val = editorRef.current.innerHTML;
            setInput(val);
            updateActiveFormats();

            const textContent = editorRef.current.innerText || '';
            const parts = textContent.split(' ');
            const lastPart = parts[parts.length - 1];

            if (lastPart.startsWith('@')) {
                setMentionSearch(lastPart.substring(1));
                setShowMentions(true);
                setMentionIndex(0);
            } else {
                setShowMentions(false);
            }
        }
    };

    const send = async () => {
        const text = input.trim();
        if (!text && selectedFiles.length === 0) return;
        if (sending) return;

        setSending(true);
        try {
            if (selectedFiles.length > 0) {
                for (let i = 0; i < selectedFiles.length; i++) {
                    const msgText = i === 0 ? text : '';
                    await contractApi.messages.send(contract.id, msgText, selectedFiles[i]);
                }
            } else {
                await contractApi.messages.send(contract.id, text);
            }

            const [fetchedMsgs, updated] = await Promise.all([
                contractApi.messages.list(contract.id).catch(() => null),
                contractApi.get(contract.id).catch(() => null)
            ]);
            if (fetchedMsgs) {
                setMessages(fetchedMsgs);
            }
            if (updated) {
                onNewMessage(updated);
            }
            setInput('');
            if (editorRef.current) editorRef.current.innerHTML = '';
            setSelectedFiles([]);
            localStorage.removeItem(draftKey);
            setDraftSavedTime(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Gagal mengirim pesan.';
            showToast(errMsg, 'error');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && filteredUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(filteredUsers[mentionIndex]);
            } else if (e.key === 'Escape') {
                setShowMentions(false);
            }
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const sortedMsgs = useMemo(() => {
        return [...msgs].sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            if (timeA !== timeB) return timeA - timeB;
            return a.id.localeCompare(b.id);
        });
    }, [msgs]);

    const groupedMessages = useMemo(() => {
        return sortedMsgs.reduce(
            (acc, msg) => {
                const date = msg.created_at ? msg.created_at.split(' ')[0] : 'Lainnya';
                if (!acc[date]) acc[date] = [];
                acc[date].push(msg);
                return acc;
            },
            {} as Record<string, ContractMessage[]>,
        );
    }, [sortedMsgs]);

    return (
        <div className="animate-in fade-in relative flex h-full flex-col p-5 duration-500">
            <div className="border-surface-border mb-1 flex items-center justify-between gap-3 border-b pb-3">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1">
                        <SearchInput
                            placeholder="CARI NAMA / ROLE / PESAN..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 text-[10px]"
                        />
                    </div>
                    {search.trim() !== '' && (
                        <div className="flex items-center gap-1.5 bg-surface-muted/60 border border-surface-border rounded-lg px-2 py-1">
                            <span className="text-[11px] font-semibold text-text-soft tabular-nums">
                                {matchingMessages.length > 0 ? `${currentMatchIndex + 1}/${matchingMessages.length}` : '0/0'}
                            </span>
                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={handlePrevMatch}
                                    disabled={matchingMessages.length === 0}
                                    title="Pesan Sebelumnya (Up)"
                                    className="p-1 rounded hover:bg-surface-border text-text-soft hover:text-text-main disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextMatch}
                                    disabled={matchingMessages.length === 0}
                                    title="Pesan Selanjutnya (Down)"
                                    className="p-1 rounded hover:bg-surface-border text-text-soft hover:text-text-main disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                >
                                    <ChevronDown size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="border-surface-border hidden h-7 items-center border-r px-3 sm:flex">
                        <span className="text-text-main text-[8px] font-normal tracking-[0.2em] uppercase tabular-nums">{msgs.length} LOGS</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={cn(
                            'border-surface-border text-text-main hover:bg-surface-muted hover:text-text-main flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-90',
                            refreshing && 'border-primary text-primary animate-spin shadow-lg',
                        )}
                    >
                        <RefreshCw size={12} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={(e) => {
                    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
                    setShowScrollDown(!isAtBottom);
                }}
                className="flex-1 [scrollbar-width:none] overflow-y-auto px-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                <div className="flex flex-col py-3">
                    {msgs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 pt-20 text-center opacity-40">
                            <MessageSquare size={24} strokeWidth={1.5} />
                            <p className="text-text-main text-[13px]">No discussion yet</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([day, dayMessages]) => (
                            <div key={day} className="flex flex-col">
                                <div className="bg-surface-border my-2 h-px flex-1" />
                                <span className="text-text-main px-2 text-[10px]">{day}</span>
                                {dayMessages.map((m) => (
                                    <div key={m.id} id={`chat-msg-${m.id}`}>
                                        <MsgBubble
                                            msg={m}
                                            isMe={m.user_id === meId}
                                            highlight={search}
                                            onPreview={(url, name) => setPreviewTarget({ url, name })}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                    <div ref={endRef} />
                </div>
            </div>

            {showScrollDown && (
                <button
                    onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
                    className="bg-primary animate-in fade-in slide-in-from-bottom-2 hover:bg-primary/90 absolute right-8 bottom-[105px] z-50 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 active:scale-95"
                >
                    <ArrowDown size={16} />
                </button>
            )}

            <div className="border-surface-border mt-auto border-t pt-3">
                {selectedFiles.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-2">
                        {selectedFiles.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="bg-surface-muted/60 border-surface-border flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs shadow-2xs">
                                <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-bold">
                                    <Paperclip size={12} />
                                </div>
                                <div className="flex flex-col max-w-[180px] overflow-hidden">
                                    <span className="text-text-main truncate text-[11px] font-semibold">{file.name}</span>
                                    <span className="text-text-soft text-[9px]">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="hover:bg-rose-500/10 text-text-soft hover:text-rose-500 ml-1 flex h-5 w-5 items-center justify-center rounded-md transition-all active:scale-90"
                                >
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

                {/* Main Action & Input Wrapper Card */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "group relative flex flex-col gap-2 rounded-2xl border bg-white p-2.5 shadow-sm dark:bg-zinc-900 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/10 overflow-hidden",
                        isDragging
                            ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                            : "border-surface-border focus-within:border-primary/60"
                    )}
                >
                    {isDragging && (
                        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-primary/10 dark:bg-primary/20 backdrop-blur-xs border-2 border-dashed border-primary rounded-2xl animate-in fade-in duration-150 pointer-events-none">
                            <Paperclip size={24} className="text-primary" />
                            <p className="text-xs font-bold text-primary tracking-wide uppercase">Lepaskan berkas untuk melampirkan</p>
                        </div>
                    )}
                    <MentionDropdown
                        isOpen={showMentions}
                        users={filteredUsers}
                        mentionIndex={mentionIndex}
                        setMentionIndex={setMentionIndex}
                        insertMention={insertMention}
                    />

                    {/* Top Toolbar: Rich Text Formatting & Draft Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-surface-border/70 pb-2 px-1">
                        <div className="flex flex-wrap items-center gap-1">
                            {/* Formatting Buttons */}
                            <div className="flex items-center gap-0.5 rounded-lg border border-surface-border bg-slate-50/80 p-0.5 dark:bg-slate-800/40">
                                <button
                                    type="button"
                                    title="Tebal (Bold)"
                                    onClick={() => execFormat('bold')}
                                    className={cn(
                                        "p-1.5 rounded-md text-xs transition-all cursor-pointer",
                                        activeFormats.bold ? "bg-primary text-white font-bold shadow-xs" : "hover:bg-slate-200/60 text-slate-600 dark:text-slate-300"
                                    )}
                                >
                                    <Bold size={13} />
                                </button>
                                <button
                                    type="button"
                                    title="Miring (Italic)"
                                    onClick={() => execFormat('italic')}
                                    className={cn(
                                        "p-1.5 rounded-md text-xs transition-all cursor-pointer",
                                        activeFormats.italic ? "bg-primary text-white font-bold shadow-xs" : "hover:bg-slate-200/60 text-slate-600 dark:text-slate-300"
                                    )}
                                >
                                    <Italic size={13} />
                                </button>
                                <button
                                    type="button"
                                    title="Coret (Strikethrough)"
                                    onClick={() => execFormat('strikeThrough')}
                                    className={cn(
                                        "p-1.5 rounded-md text-xs transition-all cursor-pointer",
                                        activeFormats.strikethrough ? "bg-primary text-white font-bold shadow-xs" : "hover:bg-slate-200/60 text-slate-600 dark:text-slate-300"
                                    )}
                                >
                                    <Strikethrough size={13} />
                                </button>
                                <button
                                    type="button"
                                    title="Kode (Inline Code)"
                                    onClick={() => execFormat('formatBlock', 'pre')}
                                    className={cn(
                                        "p-1.5 rounded-md text-xs transition-all cursor-pointer",
                                        activeFormats.code ? "bg-primary text-white font-bold shadow-xs" : "hover:bg-slate-200/60 text-slate-600 dark:text-slate-300"
                                    )}
                                >
                                    <Code size={13} />
                                </button>
                            </div>

                            {/* Lists Group */}
                            <div className="flex items-center gap-0.5 rounded-lg border border-surface-border bg-slate-50/80 p-0.5 dark:bg-slate-800/40">
                                <button
                                    type="button"
                                    title="Daftar Poin (Bullet List)"
                                    onClick={() => execFormat('insertUnorderedList')}
                                    className={cn(
                                        "p-1.5 rounded-md text-xs transition-all cursor-pointer",
                                        activeFormats.unorderedList ? "bg-primary text-white font-bold shadow-xs" : "hover:bg-slate-200/60 text-slate-600 dark:text-slate-300"
                                    )}
                                >
                                    <List size={13} />
                                </button>
                                <button
                                    type="button"
                                    title="Daftar Angka (Numbered List)"
                                    onClick={() => execFormat('insertOrderedList')}
                                    className={cn(
                                        "p-1.5 rounded-md text-xs transition-all cursor-pointer",
                                        activeFormats.orderedList ? "bg-primary text-white font-bold shadow-xs" : "hover:bg-slate-200/60 text-slate-600 dark:text-slate-300"
                                    )}
                                >
                                    <ListOrdered size={13} />
                                </button>
                            </div>
                        </div>

                        {/* Draft Status & Actions */}
                        <div className="ml-auto flex items-center gap-2">
                            {draftSavedTime && (
                                <span className="text-[10px] font-medium text-slate-400 italic">
                                    {draftSavedTime}
                                </span>
                            )}
                            <button
                                type="button"
                                title="Simpan Draf Pesan"
                                onClick={saveDraft}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-semibold transition-all shadow-2xs cursor-pointer"
                            >
                                <Save size={12} className="text-slate-400" /> Draf
                            </button>
                        </div>
                    </div>

                    {/* Middle: ContentEditable Input Area */}
                    <div className="py-1 px-1">
                        <div
                            ref={editorRef}
                            contentEditable
                            onInput={handleContentEditableInput}
                            onKeyDown={handleKeyDown}
                            data-placeholder="Ketik pesan diskusi..."
                            className="text-text-main min-h-[60px] max-h-[140px] w-full overflow-y-auto text-xs leading-relaxed font-medium tracking-tight outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:ml-1"
                        />
                    </div>

                    {/* Bottom Toolbar: Attachment & Send Controls Outside Input */}
                    <div className="flex items-center justify-between border-t border-surface-border/50 pt-2 px-1">
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
                                title="Lampirkan Dokumen"
                            >
                                <Paperclip size={14} className="text-slate-500" />
                                <span>Lampiran</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm',
                                input.trim() || selectedFiles.length > 0
                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md active:scale-95'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed',
                            )}
                            onClick={send}
                            disabled={(!input.trim() && selectedFiles.length === 0) || sending}
                        >
                            {sending ? (
                                <>
                                    <RefreshCw size={13} className="animate-spin" />
                                    <span>Mengirim...</span>
                                </>
                            ) : (
                                <>
                                    <span>Kirim</span>
                                    <Send size={13} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {previewTarget && (
                <DocumentPreviewModal
                    isOpen={!!previewTarget}
                    onClose={() => setPreviewTarget(null)}
                    url={previewTarget?.url || ''}
                    fileName={previewTarget?.name || ''}
                />
            )}
        </div>
    );
}
