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

function MsgBubble({ msg, isMe, highlight, onPreview }: { msg: ContractMessage; isMe: boolean, highlight?: string, onPreview: (url: string, name: string) => void }) {
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
                part.toLowerCase() === term.toLowerCase() 
                    ? <span key={i} className="bg-black dark:bg-white text-white dark:text-black font-bold px-0.5 rounded shadow-sm">{part}</span> 
                    : part
            );
        }

        if (typeof content === 'string') {
            const mentionParts = content.split(/(@[\w\s.-]+(?:\s|$))/g);
            return mentionParts.map((part, i) => {
                if (part.startsWith('@')) {
                    return <span key={i} className={cn("font-black tracking-tight", isMe ? "text-white dark:text-black underline decoration-white/30 dark:decoration-black/30 underline-offset-2" : "text-black dark:text-white underline decoration-black/30 dark:decoration-white/30 underline-offset-2")}>{part}</span>;
                }
                return part;
            });
        } else if (Array.isArray(content)) {
            return content.map((item, idx) => {
                if (typeof item === 'string') {
                    const subParts = item.split(/(@[\w\s.-]+(?:\s|$))/g);
                    return subParts.map((sp, i) => {
                         if (sp.startsWith('@')) {
                            return <span key={`${idx}-${i}`} className={cn("font-black tracking-tight", isMe ? "text-white dark:text-black underline decoration-white/30 dark:decoration-black/30 underline-offset-2" : "text-black dark:text-white underline decoration-black/30 dark:decoration-white/30 underline-offset-2")}>{sp}</span>;
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
        <div className={cn("mb-4 flex flex-col gap-1 animate-in slide-in-from-bottom-1 duration-300", isMe ? "items-end" : "items-start")}>
            <div className={cn("flex items-center gap-1.5 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                <span className={cn("text-[9px] font-black uppercase tracking-[0.1em]", isMe ? "text-black dark:text-white" : "text-black/60 dark:text-white/60")}>
                    {isMe ? "Anda" : name}
                </span>
                {role && (
                    <span className="rounded-full bg-black/10 dark:bg-white/15 px-2 py-0.5 text-[7px] font-black text-black/60 dark:text-white/80 uppercase tracking-[0.05em] border border-black/5 dark:border-white/5">
                        {role}
                    </span>
                )}
                {msg.user?.department_name && (
                    <span className="rounded-full border border-black/10 dark:border-white/20 px-2 py-0.5 text-[7px] font-black text-black/40 dark:text-white/60 uppercase tracking-[0.05em]">
                        {msg.user.department_name}
                    </span>
                )}
                {!msg.user?.department_name && msg.user?.department?.name && (
                    <span className="rounded-full border border-black/10 dark:border-white/20 px-2 py-0.5 text-[7px] font-black text-black/40 dark:text-white/60 uppercase tracking-[0.05em]">
                        {msg.user.department.name}
                    </span>
                )}
                <span className="text-[7.5px] font-bold text-black/30 dark:text-white/40 uppercase tabular-nums">{time}</span>
            </div>
            
            <div className={cn("group relative max-w-[80%] min-w-[60px]", isMe ? "text-right" : "text-left")}>
                <div
                    className={cn(
                        "rounded-xl transition-all duration-300 shadow-sm",
                        isMe 
                            ? "bg-primary dark:bg-white text-white dark:text-black shadow-primary/10 dark:shadow-white/5" 
                            : "bg-black/[0.03] dark:bg-white/[0.03] text-black dark:text-white"
                    )}
                >
                    {attachmentUrl && isImage && (
                        <div className="relative overflow-hidden bg-black/5 dark:bg-white/5 group/img rounded-t-xl border-b border-inherit">
                            <img 
                                src={attachmentUrl} 
                                alt={attachmentName || 'Image'} 
                                className="w-full h-auto max-h-[250px] object-cover transition-transform duration-500 group-hover/img:scale-105 cursor-pointer"
                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                            />
                        </div>
                    )}

                    <div className="p-2.5">
                        {msg.message && (
                            <div className={cn(
                                "text-[12px] font-medium leading-normal tracking-tight",
                                (attachmentUrl && !isImage) ? "mb-2 pb-2 border-b border-inherit opacity-80" : ""
                            )}>
                                {renderMessage(msg.message, highlight)}
                            </div>
                        )}
                        
                        {attachmentUrl && !isImage && (
                            <div 
                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                                className={cn(
                                    "flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer group/file",
                                    isMe 
                                        ? "bg-white/5 border-white/10 text-white hover:bg-white/10" 
                                        : "bg-black/[0.03] dark:bg-white/[0.03] border-black/5 dark:border-white/5 text-black dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
                                )}
                            >
                                <div className={cn(
                                    "h-7 w-7 flex items-center justify-center shrink-0 rounded-lg border shadow-sm transition-transform group-hover/file:scale-110",
                                    isMe ? "bg-white/10 border-white/10 text-white" : "bg-white dark:bg-sidebar border-black/10 dark:border-white/10 text-black/40 dark:text-white/40"
                                )}>
                                    <FileIcon size={12} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="text-[8.5px] font-black truncate uppercase tracking-widest leading-none mb-0.5">{attachmentName}</div>
                                    <div className="text-[7px] opacity-40 uppercase tracking-[0.2em] font-bold">PREVIEW</div>
                                </div>
                                <Download size={10} className="opacity-0 group-hover/file:opacity-40 transition-opacity" />
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
<div className="flex flex-col h-[550px] animate-in fade-in duration-500 relative p-5">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 mb-1">
                <div className="flex-1">
                    <SearchInput 
                        placeholder="CARI NAMA / ROLE..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 text-[10px] tracking-widest uppercase"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center px-3 h-7 border-r border-black/10 dark:border-white/10">
                        <span className="text-[8px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.2em] tabular-nums">{msgs.length} LOGS</span>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className={cn(
                            "h-7 w-7 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90 shadow-sm",
                            refreshing && "animate-spin text-black dark:text-white border-black dark:border-white shadow-lg"
                        )}
                    >
                        <RefreshCw size={12} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <ScrollArea className="flex-1 px-1">
                <div className="flex flex-col py-3">
                    {msgs.length === 0 ? (
                        <div className="pt-20 text-center flex flex-col items-center justify-center gap-2 opacity-20">
                            <MessageSquare size={24} strokeWidth={1.5} />
                            <p className="text-[9px] font-black tracking-[0.2em] uppercase">Belum ada diskusi</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([day, dayMessages]) => (
                            <div key={day} className="flex flex-col">
                                    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                                    <span className="text-[7.5px] font-black text-black/40 dark:text-white/50 uppercase tracking-[0.3em] whitespace-nowrap">
                                        {day}
                                    </span>
                                    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                                {dayMessages.map((m) => (
                                    <MsgBubble 
                                        key={m.id} 
                                        msg={m} 
                                        isMe={m.user_id === meId} 
                                        highlight={search} 
                                        onPreview={(url, name) => setPreviewTarget({url, name})}
                                    />
                                ))}
                            </div>
                        ))
                    )}
                    <div ref={endRef} />
                </div>
            </ScrollArea>

            <div className="pt-3 border-t border-black/5 dark:border-white/5">
                {selectedFile && (
                    <div className="mb-3 flex items-center justify-between bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-lg animate-in slide-in-from-bottom-1 duration-300 shadow-xl">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 bg-white/10 dark:bg-black/10 flex items-center justify-center text-white dark:text-black border border-white/10 dark:border-black/10 rounded-lg">
                                <FileIcon size={14} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-tight leading-none mb-1">{selectedFile.name}</span>
                                <span className="text-[7.5px] font-black opacity-40 uppercase tracking-widest tabular-nums">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedFile(null)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-white/10 dark:hover:bg-black/10 rounded-lg transition-all active:scale-90"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                <div className="relative flex items-end gap-2 group">
                    {showMentions && filteredUsers.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-52 bg-white dark:bg-[#18181b] border border-black/10 dark:border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-1 duration-200">
                            <div className="bg-black dark:bg-white p-2 border-b border-black/10 dark:border-white/10">
                                <span className="text-[7.5px] font-black text-white dark:text-black uppercase tracking-widest">MENTION</span>
                            </div>
                            <div className="max-h-[180px] overflow-y-auto">
                                {filteredUsers.map((u: any, i: number) => (
                                    <button
                                        key={u.id}
                                        onClick={() => insertMention(u)}
                                        onMouseEnter={() => setMentionIndex(i)}
                                        className={cn(
                                            "w-full flex items-center gap-2 p-2 text-left transition-all",
                                            i === mentionIndex ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                        )}
                                    >
                                        <Avatar user={u} size="sm" />
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn("text-[9.5px] font-black uppercase tracking-tight truncate", i === mentionIndex ? "text-inherit" : "text-black dark:text-white")}>{u.name}</span>
                                            <span className={cn("text-[7px] font-bold uppercase tracking-widest opacity-40", i === mentionIndex ? "text-inherit" : "text-black dark:text-white")}>{u.role || 'Member'}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 relative flex items-end bg-black/[0.05] dark:bg-white/5 rounded-xl focus-within:bg-white dark:focus-within:bg-sidebar transition-all duration-300 shadow-sm border border-black/10 dark:border-white/20">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-[40px] w-[40px] shrink-0 flex items-center justify-center text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <Paperclip size={14} strokeWidth={2.5} />
                        </button>
                        <textarea 
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="TAG DENGAN @..."
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[12px] font-bold resize-none py-2.5 px-0 min-h-[40px] max-h-[120px] transition-all placeholder:text-black/40 dark:placeholder:text-white/40 leading-normal uppercase tracking-tight text-black dark:text-white"
                        />
                    </div>
                    <button 
                        className={cn(
                            "h-[40px] px-5 rounded-xl font-black text-[9px] tracking-[0.15em] uppercase transition-all shrink-0 shadow-sm border",
                            (input.trim() || selectedFile) 
                                ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white hover:scale-95 active:scale-90" 
                                : "bg-black/[0.05] dark:bg-white/20 text-black/20 dark:text-white/30 border-black/10 dark:border-white/20 cursor-not-allowed"
                        )}
                        onClick={send}
                        disabled={(!input.trim() && !selectedFile) || sending}
                    >
                        {sending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={14} strokeWidth={2.5} />} 
                    </button>
                </div>
            </div>

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
