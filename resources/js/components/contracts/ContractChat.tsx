import { contractApi } from '@/lib/contract-api';
import { Contract, ContractMessage } from '@/types/contracts';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Avatar } from './ui';
import { MessageSquare, Calendar, Send, Clock, User, Search, FileIcon, Paperclip, X, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/base/Button';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { Badge } from '@/components/ui/base/Badge';
import { ScrollArea } from '@/components/ui/base/ScrollArea';
import { cn } from '@/lib/utils';
import DocumentPreviewModal from './DocumentPreviewModal';

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
    const attachmentUrl = (msg as any).attachment_url;
    const attachmentName = (msg as any).attachment_name;
    const isImage = attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || attachmentName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

    const renderMessage = (text: string, term?: string) => {
        let content: any = text;

        if (term && term.trim()) {
            const parts = text.split(new RegExp(`(${term})`, 'gi'));
            content = parts.map((part, i) =>
                part.toLowerCase() === term.toLowerCase() ? (
                    <span key={i} className="rounded px-0.5 font-bold text-black shadow-sm dark:text-white">
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
                        <span key={i} className="font-bold tracking-tight text-blue-500 underline underline-offset-2 dark:text-blue-400">
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
                                    className="font-bold tracking-tight text-blue-500 underline underline-offset-2 dark:text-blue-400"
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
        <div className={cn('mb-4 flex flex-col gap-1 animate-in slide-in-from-bottom-1 duration-300', isMe ? 'items-end' : 'items-start')}>
            <div className={cn('flex items-center gap-1.5 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                <span className={cn('text-[10px] font-bold', isMe ? 'text-black dark:text-white' : 'text-black/60 dark:text-white/60')}>
                    {isMe ? 'Anda' : name}
                </span>
                {role && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[8px] font-bold text-black/40 uppercase tracking-tight dark:bg-white/5 dark:text-white/40">
                        {role}
                    </span>
                )}
                <span className="text-[9px] tabular-nums text-black/20 dark:text-white/20">{time}</span>
            </div>

            <div className={cn('group relative max-w-[85%] min-w-[60px]', isMe ? 'text-right' : 'text-left')}>
                <div
                    className={cn(
                        'rounded-2xl shadow-sm transition-all duration-300',
                        isMe ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-black/[0.03] text-black dark:bg-white/[0.03] dark:text-white',
                    )}
                >
                    {attachmentUrl && isImage && (
                        <div className="group/img relative overflow-hidden rounded-t-2xl border-b border-inherit bg-black/5 dark:bg-white/5">
                            <img
                                src={attachmentUrl}
                                alt={attachmentName || 'Image'}
                                className="h-auto max-h-[250px] w-full cursor-pointer object-cover transition-transform duration-500 group-hover/img:scale-105"
                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                            />
                        </div>
                    )}

                    <div className="p-3">
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
                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                                className={cn(
                                    'group/file flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 transition-all',
                                    isMe
                                        ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                                        : 'border-black/5 bg-black/[0.03] text-black hover:bg-black/[0.06] dark:border-white/5 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform group-hover/file:scale-110',
                                        isMe
                                            ? 'border-white/10 bg-white/10 text-white'
                                            : 'border-black/10 bg-white text-black/40 dark:border-white/10 dark:bg-sidebar dark:text-white/40',
                                    )}
                                >
                                    <FileIcon size={14} />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <div className="mb-0.5 truncate text-[10px] font-bold leading-none tracking-tight uppercase">
                                        {attachmentName}
                                    </div>
                                    <div className="text-[8px] font-bold tracking-widest opacity-40 uppercase">PREVIEW</div>
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
    const [previewTarget, setPreviewTarget] = useState<{url: string, name: string} | null>(null);
    
    const [mentionSearch, setMentionSearch] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const endRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const msgs = contract.messages ?? [];
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (!isFirstRender.current) {
            endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        isFirstRender.current = false;
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
        if (!mentionSearch) return users.slice(0, 5);
        const s = mentionSearch.toLowerCase();
        return users.filter(u => u.name.toLowerCase().includes(s)).slice(0, 5);
    }, [users, mentionSearch]);

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
                setMentionIndex(prev => (prev + 1) % filteredUsers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
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

    const groupedMessages = msgs.reduce((acc, msg) => {
        const date = msg.created_at.split(' ')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {} as Record<string, ContractMessage[]>);

    return (
        <div className="relative flex h-[550px] flex-col p-5 animate-in fade-in duration-500">
            <div className="mb-1 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                <div className="flex-1">
                    <SearchInput
                        placeholder="CARI NAMA / ROLE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 text-[10px] tracking-widest uppercase"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden items-center border-r border-black/10 px-3 h-7 dark:border-white/10 sm:flex">
                        <span className="text-[8px] font-black text-black/40 uppercase tracking-[0.2em] tabular-nums dark:text-white/40">
                            {msgs.length} LOGS
                        </span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 text-black/40 shadow-sm transition-all hover:bg-black/5 hover:text-black active:scale-90 dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white',
                            refreshing && 'animate-spin border-black text-black shadow-lg dark:border-white dark:text-white',
                        )}
                    >
                        <RefreshCw size={12} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <ScrollArea className="flex-1 px-1">
                <div className="flex flex-col py-3">
                    {msgs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 pt-20 text-center opacity-40">
                            <MessageSquare size={24} strokeWidth={1.5} />
                            <p className="text-[13px]">No discussion yet</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([day, dayMessages]) => (
                            <div key={day} className="flex flex-col">
                                <div className="my-2 h-px flex-1 bg-black/5 dark:bg-white/5" />
                                <span className="px-2 text-[10px] text-black/40 dark:text-white/40">{day}</span>
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
            </ScrollArea>

            <div className="border-t border-black/5 pt-3 dark:border-white/5">
                {selectedFile && (
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-zinc-100 p-2.5 animate-in slide-in-from-bottom-1 duration-300 dark:bg-zinc-800">
                        <div className="flex items-center gap-2.5">
                            <FileIcon size={14} strokeWidth={2.5} />
                            <div className="flex flex-col">
                                <span className="mb-1 text-[9px] font-black leading-none tracking-tight uppercase">
                                    {selectedFile?.name}
                                </span>
                                <span className="text-[7.5px] font-black opacity-40 uppercase tracking-widest tabular-nums">
                                    {((selectedFile?.size || 0) / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:bg-black/5 active:scale-90 dark:hover:bg-white/5"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                <div className="group relative flex items-end gap-2">
                    {showMentions && filteredUsers.length > 0 && (
                        <div className="absolute bottom-full left-0 z-50 mb-2 w-52 overflow-hidden rounded-lg border border-black/10 bg-white shadow-2xl animate-in slide-in-from-bottom-1 duration-200 dark:border-white/10 dark:bg-[#18181b]">
                            <div className="border-b border-black/10 bg-black p-2 dark:border-white/10 dark:bg-white">
                                <span className="text-[7.5px] font-black text-white uppercase tracking-widest dark:text-black">
                                    MENTION
                                </span>
                            </div>
                            <div className="max-h-[180px] overflow-y-auto">
                                {filteredUsers.map((u: any, i: number) => (
                                    <button
                                        key={u.id}
                                        onClick={() => insertMention(u)}
                                        onMouseEnter={() => setMentionIndex(i)}
                                        className={cn(
                                            'flex w-full items-center gap-2 p-2 text-left transition-all',
                                            i === mentionIndex
                                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]',
                                        )}
                                    >
                                        <Avatar user={u} size="sm" />
                                        <div className="flex min-w-0 flex-col">
                                            <span
                                                className={cn(
                                                    'truncate text-[9.5px] font-black uppercase tracking-tight',
                                                    i === mentionIndex ? 'text-inherit' : 'text-black dark:text-white',
                                                )}
                                            >
                                                {u.name}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[7px] font-bold opacity-40 uppercase tracking-widest',
                                                    i === mentionIndex ? 'text-inherit' : 'text-black dark:text-white',
                                                )}
                                            >
                                                {u.role || 'Member'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative flex flex-1 items-end rounded-2xl border border-black/5 bg-black/[0.02] transition-all duration-300 focus-within:border-black/10 focus-within:bg-black/[0.04] dark:border-white/5 dark:bg-white/5 dark:focus-within:border-white/10 dark:focus-within:bg-white/10">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
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
                            className="min-h-[40px] max-h-[120px] flex-1 resize-none bg-transparent py-2.5 pr-4 text-[13px] font-medium leading-relaxed tracking-tight text-black outline-none transition-all placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30"
                        />
                    </div>
                    <button
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all',
                            input.trim() || selectedFile
                                ? 'bg-black text-white shadow-lg active:scale-95 dark:bg-white dark:text-black'
                                : 'bg-black/5 text-black/20 dark:bg-white/5 dark:text-white/20',
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
