import { MsgBubble } from '@/components/chat/MsgBubble';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Contract, ContractMessage } from '@/pages/contracts/types';
import { ArrowDown, Download, FileIcon, MessageSquare, Paperclip, RefreshCw, Send, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DocumentPreviewModal from '../modals/DocumentPreviewModal';
import { MentionDropdown } from '../parts/MentionDropdown';

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
    const isImage =
        attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ||
        attachmentName?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ||
        (typeof attachmentName === 'string' &&
            ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].some((ext) => attachmentName.toLowerCase().includes(ext)));

    const renderMessage = (text: string, term?: string) => {
        let content: any = text;

        if (term && term.trim()) {
            const parts = text.split(new RegExp(`(${term})`, 'gi'));
            content = parts.map((part, i) =>
                part.toLowerCase() === term.toLowerCase() ? (
                    <span key={i} className="text-primary bg-primary/10 rounded px-0.5 font-bold">
                        {part}
                    </span>
                ) : (
                    part
                ),
            );
        }

        if (typeof content === 'string') {
            const mentionParts = content.split(/(@[\w\s.-]+(?:\s|$))/g);
            return mentionParts.map((part, i) => {
                if (part.startsWith('@')) {
                    return (
                        <span
                            key={i}
                            className={cn('font-bold tracking-tight underline underline-offset-2', isMe ? 'text-primary-foreground' : 'text-primary')}
                        >
                            {part}
                        </span>
                    );
                }
                return part;
            });
        } else if (Array.isArray(content)) {
            return content.map((item, idx) => {
                if (typeof item === 'string') {
                    const subParts = item.split(/(@[\w\s.-]+(?:\s|$))/g);
                    return subParts.map((sp, i) => {
                        if (sp.startsWith('@')) {
                            return (
                                <span
                                    key={`${idx}-${i}`}
                                    className={cn(
                                        'font-bold tracking-tight underline underline-offset-2',
                                        isMe ? 'text-primary-foreground' : 'text-primary',
                                    )}
                                >
                                    {sp}
                                </span>
                            );
                        }
                        return sp;
                    });
                }
                return item;
            });
        }

        return content;
    };

    return (
        <div className={cn('animate-in slide-in-from-bottom-1 mb-4 flex flex-col gap-1.5 duration-300', isMe ? 'items-end' : 'items-start')}>
            <div className={cn('flex items-center gap-2 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                <span className={cn('text-text-main text-[11px] font-bold', isMe ? '' : 'opacity-80')}>{isMe ? 'Anda' : name}</span>
                {role && (
                    <span className="bg-surface-muted text-text-desc rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-tight uppercase">
                        {role}
                    </span>
                )}
                <span className="text-text-soft/60 text-[10px] tabular-nums">{time}</span>
            </div>

            <div className={cn('group relative max-w-[82%] min-w-[65px]', isMe ? 'text-right' : 'text-left')}>
                <div
                    className={cn(
                        'rounded-2xl shadow-sm transition-all duration-300',
                        isMe ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-main',
                    )}
                >
                    {attachmentUrl && isImage && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onPreview(attachmentUrl, attachmentName);
                            }}
                            className="group/img bg-surface-muted relative cursor-pointer overflow-hidden rounded-t-2xl border-b border-inherit"
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
                                    onPreview(attachmentUrl, attachmentName);
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
                                        isMe ? 'border-white/10 bg-white/10 text-white' : 'border-surface-border bg-surface-base text-text-soft',
                                    )}
                                >
                                    <FileIcon size={14} />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <div className="mb-0.5 truncate text-[10px] leading-none font-bold tracking-tight uppercase">
                                        {attachmentName}
                                    </div>
                                    <div className="text-[8px] font-bold uppercase opacity-40">PREVIEW</div>
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!mentionSearch) return allUsers;
        const s = mentionSearch.toLowerCase();
        return allUsers.filter((u) => u.name.toLowerCase().includes(s));
    }, [allUsers, mentionSearch]);

    const insertMention = (user: any) => {
        const parts = input.split(' ');
        const lastPart = parts[parts.length - 1];
        if (lastPart.startsWith('@')) {
            parts[parts.length - 1] = `@${user.name} `;
            setInput(parts.join(' '));
        }
        setShowMentions(false);
        setMentionSearch('');
        textareaRef.current?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);

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
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
            <div className="border-surface-border mb-1 flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                    <SearchInput
                        placeholder="CARI NAMA / ROLE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 text-[10px]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="border-surface-border hidden h-7 items-center border-r px-3 sm:flex">
                        <span className="text-text-soft text-[8px] font-semibold tracking-[0.2em] uppercase tabular-nums">{msgs.length} LOGS</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={cn(
                            'border-surface-border text-text-soft hover:bg-surface-muted hover:text-text-main flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-90',
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
                                <span className="text-text-soft px-2 text-[10px]">{day}</span>
                                {dayMessages.map((m) => (
                                    <MsgBubble
                                        key={m.id}
                                        msg={m}
                                        isMe={m.user_id === meId}
                                        highlight={search}
                                        onPreview={(url, name) => setPreviewTarget({ url, name })}
                                    />
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
                    <div className="bg-surface-muted animate-in slide-in-from-bottom-1 mb-3 flex items-center justify-between rounded-lg p-2.5 duration-300">
                        <div className="flex items-center gap-2.5">
                            <FileIcon size={14} strokeWidth={2.5} />
                            <div className="flex flex-col">
                                <span className="text-text-main mb-1 text-[9px] leading-none font-semibold tracking-tight uppercase">
                                    {selectedFile?.name}
                                </span>
                                <span className="text-text-soft text-[7.5px] font-semibold uppercase tabular-nums opacity-40">
                                    {((selectedFile?.size || 0) / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="hover:bg-surface-muted flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90"
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

                    <div className="border-surface-border bg-surface-muted/30 focus-within:border-primary/30 focus-within:bg-surface-muted relative flex flex-1 items-end rounded-2xl border transition-all duration-300">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-text-soft hover:text-text-main flex h-10 w-10 shrink-0 items-center justify-center transition-colors"
                        >
                            <Paperclip size={16} />
                        </button>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Ketik pesan..."
                            rows={1}
                            className="text-text-main placeholder:text-text-soft/30 max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 pr-4 text-[13px] leading-relaxed font-medium tracking-tight transition-all outline-none"
                        />
                    </div>
                    <button
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all',
                            input.trim() || selectedFile
                                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg active:scale-95'
                                : 'bg-surface-muted text-text-soft/40',
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
