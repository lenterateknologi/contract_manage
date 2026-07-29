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
            <div className={cn('flex items-center gap-2 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                <span className={cn('text-text-main text-[11px] font-normal', isMe ? '' : 'opacity-80')}>{isMe ? 'Anda' : name}</span>
                {role && (
                    <span className="bg-primary/10 text-text-main rounded-full px-2.5 py-0.5 text-[9px] font-normal tracking-tight uppercase">
                        {role}
                    </span>
                )}
                <span className="text-text-main text-[10px] tabular-nums">{time}</span>
            </div>

            <div className={cn('group relative max-w-[82%] min-w-[65px]', isMe ? 'text-right' : 'text-left')}>
                <div
                    className={cn(
                        'rounded-2xl shadow-sm transition-all duration-300',
                        isMe ? 'bg-primary text-primary-foreground' : 'bg-primary/5 border border-primary/10 text-text-main',
                    )}
                >
                    {attachmentUrl && isImage && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onPreview(attachmentUrl, attachmentName);
                            }}
                            className="group/img bg-primary/5 relative cursor-pointer overflow-hidden rounded-t-2xl border-b border-inherit"
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
                                    'text-[13px] leading-relaxed tracking-tight',
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
                                        ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                                        : 'border-surface-border bg-surface-base/50 text-text-main hover:bg-surface-base',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform group-hover/file:scale-110',
                                        isMe ? 'border-white/10 bg-white/10 text-white' : 'border-surface-border bg-surface-base text-text-main',
                                    )}
                                >
                                    <FileIcon size={14} />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <div className="mb-0.5 truncate text-[10px] leading-none font-normal tracking-tight uppercase">
                                        {attachmentName}
                                    </div>
                                    {/* ponytail: dynamically label either preview or download based on type */}
                                    <div className="text-[8px] font-normal uppercase opacity-40">
                                        {isPdf ? 'PREVIEW' : 'DOWNLOAD'}
                                    </div>
                                </div>
                                <Download size={12} className="opacity-0 transition-opacity group-hover/file:opacity-40" />
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    const msgs = contract.messages ?? [];
    const isFirstRender = useRef(true);

    useEffect(() => {
        contractApi.getUsers().then(setAllUsers).catch(console.error);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            endRef.current?.scrollIntoView({ behavior: isFirstRender.current ? 'auto' : 'smooth', block: 'end' });
            isFirstRender.current = false;
        }, 100);
        return () => clearTimeout(timer);
    }, [msgs.length]);

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
            const updated = await contractApi.get(contract.id);
            onNewMessage(updated);
        } finally {
            setRefreshing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                showToast('Ukuran berkas terlalu besar! Batas maksimum adalah 10MB.', 'danger');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setSelectedFile(file);
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

    const handleContentEditableInput = () => {
        if (editorRef.current) {
            setInput(editorRef.current.innerHTML);
            updateActiveFormats();
        }
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
            setDraftSavedTime('Draf tersimpan');
        } else {
            setInput('');
            setDraftSavedTime(null);
        }
    }, [contract.id]);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);

        // Auto save to localStorage
        if (val.trim()) {
            localStorage.setItem(draftKey, val);
            setDraftSavedTime('Tersimpan otomatis');
        } else {
            localStorage.removeItem(draftKey);
            setDraftSavedTime(null);
        }

        const parts = val.split(' ');
        const lastPart = parts[parts.length - 1];

        if (lastPart.startsWith('@')) {
            setMentionSearch(lastPart.substring(1));
            setShowMentions(true);
            setMentionIndex(0);
        } else {
            setShowMentions(false);
        }
    };

    const send = async () => {
        const text = input.trim();
        if (!text && !selectedFile) return;
        if (sending) return;

        setSending(true);
        try {
            await contractApi.messages.send(contract.id, text, selectedFile || undefined);
            const updated = await contractApi.get(contract.id);
            onNewMessage(updated);
            setInput('');
            if (editorRef.current) editorRef.current.innerHTML = '';
            setSelectedFile(null);
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

    const groupedMessages = msgs.reduce(
        (acc, msg) => {
            const date = msg.created_at.split(' ')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(msg);
            return acc;
        },
        {} as Record<string, ContractMessage[]>,
    );

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
                        <div className="flex items-center gap-1.5 bg-surface-muted/60 dark:bg-surface-muted/20 border border-surface-border rounded-lg px-2 py-1">
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                                {matchingMessages.length > 0 ? `${currentMatchIndex + 1}/${matchingMessages.length}` : '0/0'}
                            </span>
                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={handlePrevMatch}
                                    disabled={matchingMessages.length === 0}
                                    title="Pesan Sebelumnya (Up)"
                                    className="p-1 rounded hover:bg-surface-border text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextMatch}
                                    disabled={matchingMessages.length === 0}
                                    title="Pesan Selanjutnya (Down)"
                                    className="p-1 rounded hover:bg-surface-border text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
                {selectedFile && (
                    <div className="bg-primary/5 border border-primary/10 animate-in slide-in-from-bottom-1 mb-3 flex items-center justify-between rounded-lg p-2.5 duration-300">
                        <div className="flex items-center gap-2.5">
                            <FileIcon size={14} strokeWidth={2.5} />
                            <div className="flex flex-col">
                                <span className="text-text-main mb-1 text-[9px] leading-none font-normal tracking-tight uppercase">
                                    {selectedFile?.name}
                                </span>
                                <span className="text-text-main text-[7.5px] font-normal uppercase tabular-nums opacity-40">
                                    {((selectedFile?.size || 0) / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="hover:bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                <div className="group relative flex items-end gap-2">
                    <MentionDropdown
                        isOpen={showMentions}
                        users={filteredUsers}
                        mentionIndex={mentionIndex}
                        setMentionIndex={setMentionIndex}
                        insertMention={insertMention}
                    />

                    <div className="border-surface-border bg-white dark:bg-slate-900 focus-within:border-primary/50 relative flex flex-col flex-1 rounded-2xl border shadow-xs transition-all duration-300 overflow-hidden">
                        {/* Formatting Toolbar (Summernote Style) */}
                        <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60">
                            <div className="flex flex-wrap items-center gap-1">
                            {/* Text Formatting Group */}
                            <div className="flex items-center gap-0.5 border-r border-slate-300 dark:border-slate-700 pr-1.5 mr-0.5">
                                <button
                                    type="button"
                                    title="Tebal (Bold)"
                                    onClick={() => execFormat('bold')}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        activeFormats.bold ? "bg-primary text-white" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    )}
                                >
                                    <Bold size={14} />
                                </button>
                                <button
                                    type="button"
                                    title="Miring (Italic)"
                                    onClick={() => execFormat('italic')}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        activeFormats.italic ? "bg-primary text-white" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    )}
                                >
                                    <Italic size={14} />
                                </button>
                                <button
                                    type="button"
                                    title="Coret (Strikethrough)"
                                    onClick={() => execFormat('strikeThrough')}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        activeFormats.strikethrough ? "bg-primary text-white" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    )}
                                >
                                    <Strikethrough size={14} />
                                </button>
                                <button
                                    type="button"
                                    title="Kode (Inline Code)"
                                    onClick={() => execFormat('formatBlock', 'pre')}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        activeFormats.code ? "bg-primary text-white" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    )}
                                >
                                    <Code size={14} />
                                </button>
                            </div>

                            {/* Lists Group */}
                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    title="Daftar Poin (Bullet List)"
                                    onClick={() => execFormat('insertUnorderedList')}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        activeFormats.unorderedList ? "bg-primary text-white" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    )}
                                >
                                    <List size={14} />
                                </button>
                                <button
                                    type="button"
                                    title="Daftar Angka (Numbered List)"
                                    onClick={() => execFormat('insertOrderedList')}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        activeFormats.orderedList ? "bg-primary text-white" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    )}
                                >
                                    <ListOrdered size={14} />
                                </button>
                            </div>
                            </div>

                            {/* Draft Group */}
                            <div className="ml-auto flex items-center gap-2 border-l border-slate-300 dark:border-slate-700 pl-2">
                                {draftSavedTime && (
                                    <span className="text-[10px] italic text-slate-400 dark:text-slate-500">
                                        {draftSavedTime}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    title="Simpan Draf Pesan"
                                    onClick={saveDraft}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200/80 dark:bg-slate-700 hover:bg-primary/10 hover:text-primary text-slate-700 dark:text-slate-200 text-[10px] font-medium transition-colors"
                                >
                                    <Save size={12} /> Draf
                                </button>
                            </div>
                        </div>

                        <div className="flex items-end min-h-[50px] max-h-[160px]">
                            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-text-main hover:text-primary flex h-10 w-10 shrink-0 items-center justify-center transition-colors"
                            >
                                <Paperclip size={16} />
                            </button>
                            <div
                                ref={editorRef}
                                contentEditable
                                onInput={handleContentEditableInput}
                                onKeyDown={handleKeyDown}
                                data-placeholder="Ketik pesan..."
                                className="text-text-main flex-1 overflow-y-auto py-2.5 pr-4 text-[13px] leading-relaxed font-normal tracking-tight outline-none empty:before:text-text-main/30 empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none min-h-[50px] max-h-[140px] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:ml-1"
                            />
                        </div>
                    </div>
                    <button
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all',
                            input.trim() || selectedFile
                                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg active:scale-95'
                                : 'bg-primary/5 text-text-main/40',
                        )}
                        onClick={send}
                        disabled={(!input.trim() && !selectedFile) || sending}
                    >
                        {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={16} />}
                    </button>
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
