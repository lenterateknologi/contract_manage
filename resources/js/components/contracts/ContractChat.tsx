import { contractApi } from '@/lib/contract-api';
import { Contract, ContractMessage } from '@/types/contracts';
import React, { useEffect, useRef, useState } from 'react';
import { Avatar } from './ui';
import { MessageSquare, Calendar, Send, Clock, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Props {
    contract: Contract;
    meId: string;
    onNewMessage: (c: Contract) => void;
}

import { FileIcon, Paperclip, X } from 'lucide-react';

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
                ? <span key={i} className="bg-amber-300 text-black font-bold px-0.5 rounded shadow-sm">{part}</span> 
                : part
        );
    };

    return (
        <div className={cn("mb-1 flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-300", isMe ? "items-end" : "items-start")}>
            <div className={cn("flex items-center gap-1.5 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                <span className={cn("text-[10px] font-black uppercase tracking-tight", isMe ? "text-slate-900" : "text-slate-700")}>
                    {isMe ? "You" : name}
                </span>
                {role && (
                    <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        {role}
                    </span>
                )}
            </div>
            <div className={cn("group relative max-w-[85%] min-w-[100px]", isMe ? "text-right" : "text-left")}>
                <div
                    className={cn(
                        "p-1.5 shadow-sm select-text",
                        isMe 
                            ? "bg-slate-900 text-white rounded-[24px_24px_4px_24px]" 
                            : "bg-white text-slate-900 border border-slate-100 rounded-[24px_24px_24px_4px]"
                    )}
                >
                    {/* Image Preview - Mini Compact style */}
                    {attachmentUrl && isImage && (
                        <div className="relative mb-2 rounded-[14px] overflow-hidden bg-slate-100/10 max-w-[220px] max-h-[160px] border border-white/5 shadow-inner flex items-center justify-center group/img mx-auto">
                            <img 
                                src={attachmentUrl} 
                                alt={attachmentName || 'Image preview'} 
                                className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-110 cursor-alias"
                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                                <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Quick Preview</span>
                            </div>
                        </div>
                    )}

                    <div className="px-3 py-2">
                        {msg.message && (
                            <div className={cn(
                                "text-[13px] font-medium leading-relaxed",
                                (attachmentUrl && !isImage) ? "mb-3 pb-2 border-b border-white/10" : ""
                            )}>
                                {renderMessage(msg.message, highlight)}
                            </div>
                        )}
                        
                        {attachmentUrl && !isImage && (
                            <div 
                                onClick={() => onPreview(attachmentUrl, attachmentName)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] active:scale-95 cursor-pointer group/file",
                                    isMe 
                                        ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" 
                                        : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-900 shadow-sm"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                    isMe ? "bg-white/20 text-white" : "bg-white border border-slate-200 text-slate-400"
                                )}>
                                    <FileIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="text-[11px] font-black truncate uppercase tracking-tight leading-none mb-1">{attachmentName}</div>
                                    <div className="text-[9px] font-bold opacity-60 uppercase tracking-widest">
                                        {attachmentName?.toLowerCase().includes('pdf') || attachmentName?.toLowerCase().includes('doc') ? 'Preview in New Tab' : 'Download File'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* If it's an image and there's also a file card (optional, but we usually show image directly, but we want the name too) */}
                        {attachmentUrl && isImage && (
                            <div className={cn(
                                "text-[9px] font-black mt-1 uppercase tracking-widest opacity-40 px-1 flex items-center gap-2",
                                isMe ? "text-white" : "text-slate-900"
                            )}>
                                <Clock size={10} /> {attachmentName}
                            </div>
                        )}
                    </div>
                </div>
                <div className={cn(
                    "absolute -bottom-4 z-10 rounded border border-slate-200 bg-white px-2 py-0.5 text-[8px] font-black text-slate-400 opacity-0 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 uppercase tracking-widest",
                    isMe ? "right-0" : "left-0"
                )}>
                    {msg.created_at}
                </div>
            </div>
            <div className={cn("mt-1 flex items-center gap-1 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                <span className="text-[10px] font-bold text-slate-300">{time}</span>
            </div>
        </div>
    );
}

import DocumentPreviewModal from './DocumentPreviewModal';

export default function ContractChat({ contract, meId, onNewMessage }: Props) {
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [previewTarget, setPreviewTarget] = useState<{url: string, name: string} | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const msgs = contract.messages ?? [];
    const isFirstRender = useRef(true);

    const matchCount = search.trim() ? msgs.filter(m => m.message.toLowerCase().includes(search.toLowerCase())).length : 0;

    useEffect(() => {
        if (!isFirstRender.current) {
            endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        isFirstRender.current = false;
    }, [msgs.length]);

    useEffect(() => {
        return () => { isFirstRender.current = true; };
    }, []);

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
        <div className="flex flex-col h-[70vh] min-h-[600px] animate-in fade-in duration-500">
            {/* Header - Advanced Search Integration */}
            <div className="pb-4 border-b border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-black tracking-[0.2em] text-slate-900 uppercase">
                         Discussion Channel
                    </h3>
                </div>

                <div className="flex-1 max-w-md relative flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <input 
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kata kunci dalam diskusi..."
                            className="w-full h-8 bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 text-[11px] font-bold text-slate-900 focus:bg-white focus:border-slate-300 focus:ring-0 transition-all outline-none"
                        />
                    </div>
                    {search.trim() && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-50 border border-amber-100 animate-in zoom-in-95 duration-200">
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{matchCount} Matches</span>
                            <button onClick={() => setSearch('')} className="text-amber-400 hover:text-amber-600">
                                <Send size={10} className="rotate-45" /> 
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                    {msgs.length} Messages
                </div>
            </div>

            {/* Discussion Area */}
            <ScrollArea className="flex-1 px-2 py-6">
                <div className="flex flex-col gap-6">
                    {msgs.length === 0 ? (
                        <div className="pt-20 text-center flex flex-col items-center justify-center gap-3 opacity-20">
                            <MessageSquare size={48} strokeWidth={1} className="text-slate-900" />
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-900">Belum ada diskusi</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([day, dayMessages]) => (
                            <div key={day} className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">
                                        {day}
                                    </span>
                                    <div className="h-px flex-1 bg-slate-100" />
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

            {/* Input area - Integrated style with Attachment */}
            <div className="pt-4 border-t border-border flex flex-col gap-3">
                {selectedFile && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                                <FileIcon size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{selectedFile.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB Ready to send</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedFile(null)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-400 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-3 group">
                    <div className="flex-1 relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:border-slate-900 focus-within:bg-white transition-all">
                        <input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                            title="Unggah Lampiran"
                        >
                            <Paperclip size={18} />
                        </button>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tulis pesan diskusi atau unggah file..."
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] font-medium resize-none py-2.5 px-0 min-h-[44px] max-h-[150px] transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <Button 
                        variant="default"
                        className={cn(
                            "h-[44px] px-6 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shrink-0",
                            (input.trim() || selectedFile) ? "bg-slate-900 text-white shadow-xl hover:bg-slate-800" : "bg-slate-100 text-slate-300"
                        )}
                        onClick={send}
                        disabled={(!input.trim() && !selectedFile) || sending}
                    >
                        <Send size={14} className="mr-2" /> {sending ? 'MENGIRIM...' : 'KIRIM'}
                    </Button>
                </div>
            </div>

            {/* Document Preview Modal Integration */}
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
