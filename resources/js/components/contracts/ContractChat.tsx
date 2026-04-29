import { contractApi } from '@/lib/contract-api';
import { Contract, ContractMessage } from '@/types/contracts';
import React, { useEffect, useRef, useState } from 'react';
import { Avatar } from './ui';
import { MessageSquare, Calendar, Send, Clock, User, Search, FileIcon, Paperclip, X, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import DocumentPreviewModal from './DocumentPreviewModal';

interface Props {
    contract: Contract;
    meId: string;
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
        if (!term || !term.trim()) return text;
        const parts = text.split(new RegExp(`(${term})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === term.toLowerCase() 
                ? <span key={i} className="bg-amber-100 text-black font-bold px-0.5 rounded">{part}</span> 
                : part
        );
    };

    return (
        <div className={cn("mb-6 flex flex-col gap-2 animate-in slide-in-from-bottom-1 duration-200", isMe ? "items-end" : "items-start")}>
            <div className={cn("flex items-center gap-2 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", isMe ? "text-black dark:text-white" : "text-black/60 dark:text-white/60")}>
                    {isMe ? "Anda" : name}
                </span>
                {role && (
                    <span className="rounded bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[8px] font-bold text-black/40 dark:text-white/40 uppercase tracking-[0.15em]">
                        {role}
                    </span>
                )}
                <span className="text-[9px] font-bold text-black/20 dark:text-white/20 uppercase tracking-tighter">{time}</span>
            </div>
            
            <div className={cn("group relative max-w-[85%] min-w-[60px]", isMe ? "text-right" : "text-left")}>
                <div
                    className={cn(
                        "rounded-xl border transition-all duration-200",
                        isMe 
                            ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xl shadow-black/5" 
                            : "bg-white dark:bg-sidebar text-black dark:text-white border-black/10 dark:border-white/10"
                    )}
                >
                    {attachmentUrl && isImage && (
                        <div className="relative overflow-hidden bg-black/5 dark:bg-white/5 group/img rounded-t-xl border-b border-inherit">
                            <img 
                                src={attachmentUrl} 
                                alt={attachmentName || 'Image'} 
                                className="w-full h-auto max-h-[300px] object-cover transition-transform group-hover/img:scale-105 cursor-pointer"
                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                            />
                        </div>
                    )}

                    <div className="p-3">
                        {msg.message && (
                            <div className={cn(
                                "text-[13px] font-medium leading-relaxed tracking-tight",
                                (attachmentUrl && !isImage) ? "mb-3 pb-2 border-b border-inherit opacity-80" : ""
                            )}>
                                {renderMessage(msg.message, highlight)}
                            </div>
                        )}
                        
                        {attachmentUrl && !isImage && (
                            <div 
                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                                className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer group/file",
                                    isMe 
                                        ? "bg-white/10 border-white/20 text-white" 
                                        : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "h-9 w-9 flex items-center justify-center shrink-0 rounded border",
                                    isMe ? "bg-white/20 border-white/10 text-white" : "bg-white dark:bg-sidebar border-black/10 dark:border-white/10 text-black/40 dark:text-white/40"
                                )}>
                                    <FileIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="text-[10px] font-bold truncate uppercase tracking-widest">{attachmentName}</div>
                                    <div className="text-[8px] opacity-40 uppercase tracking-[0.2em] font-bold">Unduh File</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={cn(
                    "absolute -bottom-5 z-10 px-1 text-[8px] font-bold text-black/20 dark:text-white/20 opacity-0 group-hover:opacity-100 uppercase tracking-widest transition-opacity",
                    isMe ? "right-0" : "left-0"
                )}>
                    {msg.created_at}
                </div>
            </div>
        </div>
    );
}

export default function ContractChat({ contract, meId, onNewMessage }: Props) {
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [previewTarget, setPreviewTarget] = useState<{url: string, name: string} | null>(null);
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
        <div className="flex flex-col h-[650px] animate-in fade-in duration-500 relative">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex-1">
                    <div className="relative max-w-[240px] group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/40 dark:text-white/40" />
                        <input 
                            type="text"
                            placeholder="CARI PESAN..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-[10px] font-bold uppercase tracking-widest outline-none transition-all placeholder:text-black/20 dark:placeholder:text-white/20 focus:bg-white dark:focus:bg-sidebar focus:border-black dark:focus:border-white"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center px-4 h-8 border-r border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-[0.2em]">{msgs.length} PESAN</span>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className={cn(
                            "h-8 w-8 flex items-center justify-center text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors",
                            refreshing && "animate-spin text-black dark:text-white"
                        )}
                    >
                        <RefreshCw size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            <ScrollArea className="flex-1 px-1">
                <div className="flex flex-col py-4">
                    {msgs.length === 0 ? (
                        <div className="pt-20 text-center flex flex-col items-center justify-center gap-3">
                            <MessageSquare size={32} className="text-black/10 dark:text-white/10" />
                            <p className="text-[10px] font-bold tracking-widest text-black/40 dark:text-white/40 uppercase">Belum ada diskusi</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([day, dayMessages]) => (
                            <div key={day} className="flex flex-col">
                                <div className="flex items-center gap-6 my-8">
                                    <div className="h-px flex-1 bg-black/5 dark:bg-white/5" />
                                    <span className="text-[10px] font-bold text-black/20 dark:text-white/20 uppercase tracking-[0.3em] whitespace-nowrap">
                                        {day}
                                    </span>
                                    <div className="h-px flex-1 bg-black/5 dark:bg-white/5" />
                                </div>
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

            <div className="pt-6 border-t border-black/10 dark:border-white/10">
                {selectedFile && (
                    <div className="mb-4 flex items-center justify-between bg-black dark:bg-white text-white dark:text-black p-3 rounded-lg animate-in slide-in-from-bottom-1 duration-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/10 dark:bg-black/10 flex items-center justify-center text-white dark:text-black border border-white/10 dark:border-black/10 rounded-lg">
                                <FileIcon size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase tracking-widest leading-none mb-1.5">{selectedFile.name}</span>
                                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB SIAP DIKIRIM</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedFile(null)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-white/10 dark:hover:bg-black/10 rounded transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-3 group">
                    <div className="flex-1 relative flex items-end bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-xl focus-within:border-black dark:focus-within:border-white focus-within:bg-white dark:focus-within:bg-sidebar transition-all">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-12 w-12 shrink-0 flex items-center justify-center text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <Paperclip size={18} />
                        </button>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="KETIK PESAN..."
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] font-bold resize-none py-3.5 px-0 min-h-[48px] max-h-[150px] transition-all placeholder:text-black/20 dark:placeholder:text-white/20 leading-relaxed uppercase tracking-tight"
                        />
                    </div>
                    <button 
                        className={cn(
                            "h-[48px] px-8 rounded-xl font-bold text-[11px] tracking-[0.2em] uppercase transition-all shrink-0",
                            (input.trim() || selectedFile) ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-90" : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20"
                        )}
                        onClick={send}
                        disabled={(!input.trim() && !selectedFile) || sending}
                    >
                        {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />} 
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
