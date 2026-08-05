import axios from 'axios';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/user/Avatar';
import {
    Bubble,
    BubbleContent,
    BubbleGroup,
    BubbleReactions,
    Marker,
    MarkerContent,
    Message,
    MessageAvatar,
    MessageContent,
    MessageFooter,
    MessageHeader,
} from '@/components/ui/user/Message';

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
    const pageProps = usePage().props;
    const currentUserId = (pageProps.auth as any)?.user?.id;
    const [localReactions, setLocalReactions] = useState<any[]>((msg as any).reactions || []);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalReactions((msg as any).reactions || []);
    }, [(msg as any).reactions]);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowReactionPicker(false);
            }
        };
        if (showReactionPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showReactionPicker]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowReactionPicker((prev) => !prev);
    };

    const computedReactions = useMemo(() => {
        const counts: Record<string, number> = {};
        if (Array.isArray(localReactions)) {
            localReactions.forEach((r: any) => {
                if (r && r.emoji) {
                    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
                }
            });
        }
        return counts;
    }, [localReactions]);

    const toggleReaction = async (emoji: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Optimistic UI Update: Update localReactions immediately
        setLocalReactions((prev) => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const existingIdx = copy.findIndex((r: any) => r && (r.is_me || r.user_id === currentUserId));

            if (existingIdx >= 0) {
                if (copy[existingIdx].emoji === emoji) {
                    // Clicked same emoji -> Unset / remove reaction
                    copy.splice(existingIdx, 1);
                } else {
                    // Clicked different emoji -> Replace existing reaction with new emoji
                    copy[existingIdx] = {
                        ...copy[existingIdx],
                        emoji,
                        is_me: true,
                    };
                }
            } else {
                // First reaction from user
                copy.push({
                    emoji,
                    user_id: currentUserId || 'me',
                    is_me: true,
                    user: { name: 'Anda' },
                });
            }
            return copy;
        });

        try {
            const res = await axios.post(`/admin/chat/messages/${msg.id}/reaction`, { emoji });
            if (res.data && Array.isArray(res.data.reactions)) {
                setLocalReactions(res.data.reactions);
            }
        } catch (err) {
            console.error('Failed to toggle reaction', err);
        }
    };

    const time = msg.created_at.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    let attachmentUrl = (msg as any).attachment_url || (msg as any).attachment_path;
    if (attachmentUrl && !attachmentUrl.startsWith('http') && !attachmentUrl.startsWith('/')) {
        attachmentUrl = `/storage/${attachmentUrl}`;
    }
    const attachmentName = (msg as any).attachment_name || (msg as any).file_name || 'Berkas';

    let upload_configs: any = null;
    try {
        upload_configs = usePage().props;
    } catch (e) {
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
        let formatted = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        formatted = formatted.replace(/(?:^|\n)[-*]\s+(.*)/g, '<ul><li>$1</li></ul>');
        formatted = formatted.replace(/(?:^|\n)\d+\.\s+(.*)/g, '<ol><li>$1</li></ol>');

        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs">$1</code>');

        formatted = formatted.replace(
            /(@[\w\s.-]+(?:\s|$))/g,
            `<span class="${isMe ? 'text-primary-foreground font-semibold underline' : 'text-primary font-semibold underline'}">$1</span>`,
        );

        if (term && term.trim()) {
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            formatted = formatted.replace(
                new RegExp(`(${escapedTerm})`, 'gi'),
                '<mark class="bg-yellow-300 text-slate-900 font-semibold px-1 rounded shadow-xs">$1</mark>',
            );
        }

        return (
            <div
                className="prose dark:prose-invert max-w-none break-words text-[13px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1 [&_li]:my-0.5"
                dangerouslySetInnerHTML={{ __html: formatted }}
            />
        );
    };

    const activeReactions = Object.entries(computedReactions).filter(([_, count]) => count > 0);

    return (
        <Message align={isMe ? 'end' : 'start'} className="mb-4 group/msg">
            <MessageAvatar>
                <Avatar className="h-8 w-8 border border-border shadow-2xs">
                    <AvatarImage src={msg.user?.avatar || ''} alt={name} />
                    <AvatarFallback className={isMe ? 'bg-primary text-white text-[10px] font-bold' : 'bg-muted text-foreground text-[10px] font-bold'}>
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </MessageAvatar>
            <MessageContent className="max-w-[80%] relative">
                <MessageHeader className={isMe ? 'justify-end' : 'justify-start'}>
                    <span className="font-semibold text-foreground text-xs">{isMe ? 'Anda' : name}</span>
                    {role && (
                        <span className="bg-primary/10 border border-primary/20 text-primary rounded-full px-2 py-0.2 text-[9px] font-bold tracking-tight uppercase">
                            {role}
                        </span>
                    )}
                    <span className="text-[10px] text-muted-foreground tabular-nums">{time}</span>
                </MessageHeader>

                <div className="relative">
                    <BubbleGroup>
                        <Bubble
                            variant={isMe ? 'default' : 'muted'}
                            className="relative cursor-pointer select-none"
                            onContextMenu={handleContextMenu}
                        >
                            {attachmentUrl && isImage && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        onPreview(attachmentUrl, attachmentName);
                                    }}
                                    className="group/img bg-black/5 relative cursor-pointer overflow-hidden rounded-xl border border-inherit mb-2"
                                >
                                    <img
                                        src={attachmentUrl}
                                        alt={attachmentName || 'Image'}
                                        className="h-auto max-h-[250px] w-full cursor-pointer object-cover transition-transform duration-500 group-hover/img:scale-105"
                                    />
                                </div>
                            )}

                            {msg.message && (
                                <BubbleContent>
                                    {renderMessage(msg.message, highlight)}
                                </BubbleContent>
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
                                        'group/file flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 transition-all mt-1',
                                        isMe
                                            ? 'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                                            : 'border-border bg-background text-foreground hover:bg-muted',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-transform group-hover/file:scale-105',
                                            isMe ? 'border-primary-foreground/20 bg-primary-foreground/20 text-primary-foreground' : 'border-border bg-muted text-primary',
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
                        </Bubble>

                        {/* Reaction badges — di luar Bubble, flow normal */}
                        {activeReactions.length > 0 && (
                            <div className={cn("flex flex-wrap items-center gap-1 mt-1 px-1", isMe ? "justify-end" : "justify-start")}>
                                {activeReactions.map(([emoji, count]) => {
                                    const reactingUsers = Array.isArray(localReactions)
                                        ? localReactions.filter((r: any) => r.emoji === emoji).map((r: any) => r.user?.name || (r.is_me ? 'Anda' : 'User'))
                                        : [];
                                    const userNames = reactingUsers.join(', ');
                                    const hasMyReaction = Array.isArray(localReactions) && localReactions.some((r: any) => r.emoji === emoji && (r.is_me || r.user_id === currentUserId));

                                    return (
                                        <div key={emoji} className="group/react relative flex items-center cursor-pointer">
                                            {/* Hover Popover */}
                                            <div className={cn(
                                                "pointer-events-none absolute bottom-full mb-2 opacity-0 group-hover/react:opacity-100 transition-all duration-200 z-50 flex flex-col",
                                                isMe ? "items-end right-0" : "items-start left-0"
                                            )}>
                                                <div className="rounded-lg border border-border/80 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-[11px] font-medium whitespace-nowrap shadow-xl flex items-center gap-1.5">
                                                    <span className="text-xs">{emoji}</span>
                                                    <span className="font-semibold tracking-tight">{userNames || '1 Orang'}</span>
                                                </div>
                                                <div className={cn("w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 -mt-1 shadow-sm", isMe ? "mr-2" : "ml-2")}></div>
                                            </div>

                                            <BubbleReactions
                                                onClick={(e) => toggleReaction(emoji, e)}
                                                className={cn(
                                                    "static transition-all shadow-xs gap-1 px-2 py-0.5 select-none",
                                                    hasMyReaction
                                                        ? "border-primary bg-primary text-primary-foreground font-bold ring-2 ring-primary/30"
                                                        : "bg-background text-foreground border-border hover:bg-muted"
                                                )}
                                            >
                                                <span>{emoji}</span>
                                                <span className="text-[10px] font-semibold">{count}</span>
                                            </BubbleReactions>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </BubbleGroup>

                    {/* Right-Click Context Menu Reaction Selector Bar */}
                    {showReactionPicker && (
                        <div
                            ref={pickerRef}
                            className={cn(
                                "absolute -top-10 z-40 flex items-center gap-1 rounded-full border border-border/80 bg-white dark:bg-zinc-900 px-2 py-1 shadow-xl animate-in fade-in zoom-in-95 duration-150",
                                isMe ? "right-2" : "left-2"
                            )}
                        >
                            {['👍', '❤️', '😂', '🔥', '🎉'].map((emoji) => {
                                const isSelected = Array.isArray(localReactions) && localReactions.some((r: any) => r.emoji === emoji && (r.is_me || r.user_id === currentUserId));
                                return (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={(e) => {
                                            toggleReaction(emoji, e);
                                            setShowReactionPicker(false);
                                        }}
                                        className={cn(
                                            "p-1 rounded-full transition-all text-sm cursor-pointer hover:scale-125",
                                            isSelected
                                                ? "bg-primary/20 text-primary font-bold scale-110 ring-1 ring-primary/40"
                                                : "hover:bg-muted opacity-80 hover:opacity-100"
                                        )}
                                        title={isSelected ? `Hapus Reaksi ${emoji}` : `Reaksi ${emoji}`}
                                    >
                                        {emoji}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {isMe && (
                    <MessageFooter className="justify-end mt-0.5">
                        {msg.read_by && msg.read_by.length > 0 ? (
                            <span title="Dibaca" className="text-sky-500 text-[10px] font-bold tracking-tighter leading-none">✓✓</span>
                        ) : (
                            <span title="Terkirim" className="text-slate-400 text-[10px] leading-none">✓</span>
                        )}
                    </MessageFooter>
                )}
            </MessageContent>
        </Message>
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
                onNewMessage(updated, true); // silent: hanya update state, tanpa router.reload()
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
            // Gunakan innerText untuk validasi (stripping HTML tags seperti <br>, <div>)
            // sehingga tombol Kirim disable dengan benar saat field kosong
            const plainText = editorRef.current.innerText?.replace(/\n/g, '').trim() ?? '';
            setInput(plainText);
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
        // Ambil plaintext dari DOM langsung untuk akurasi (bukan dari state yang mungkin stale)
        const rawText = editorRef.current?.innerHTML ?? '';
        const text = rawText.replace(/<br\s*\/?>/gi, '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
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
                onNewMessage(updated, true); // silent: hanya update state, tanpa router.reload()
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
                        "group relative flex flex-col gap-2 rounded-2xl border bg-white p-2.5 shadow-sm dark:bg-zinc-900 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/10",
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
                        <div className="flex items-center gap-1.5 relative">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
                                title="Lampirkan Dokumen"
                            >
                                <Paperclip size={14} className="text-slate-500" />
                                <span>Lampiran</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                className={cn(
                                    "flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95",
                                    showEmojiPicker
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                )}
                                title="Pilih Emoji"
                            >
                                <Smile size={14} className={showEmojiPicker ? "text-primary" : "text-amber-500"} />
                                <span>Emoji</span>
                            </button>

                            {showEmojiPicker && (
                                <div className="absolute bottom-11 left-0 z-50 animate-in fade-in zoom-in-95 duration-150 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white p-3 shadow-2xl dark:bg-zinc-900 w-72">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 dark:border-zinc-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pilih Emoji</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(false)}
                                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-1">
                                        {['👍', '❤️', '😂', '🔥', '🎉', '👏', '🙏', '😊', '✅', '🚀', '💡', '🤔', '👀', '💯', '🤝', '🙌', '⭐', '📌', '⚠️', '❌', '👌', '💬', '📝', '⚡', '🤩', '😎', '💪', '🎯', '✨', '👋'].map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => {
                                                    if (editorRef.current) {
                                                        editorRef.current.focus();
                                                        document.execCommand('insertText', false, emoji);
                                                        setInput(editorRef.current.innerHTML);
                                                    }
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-base hover:bg-slate-100 dark:hover:bg-zinc-800 transition-transform active:scale-125 cursor-pointer"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
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
