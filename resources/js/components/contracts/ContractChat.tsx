import { contractApi } from '@/lib/contract-api';
import { Contract, ContractMessage } from '@/types/contracts';
import React, { useEffect, useRef, useState } from 'react';
import { Avatar } from './ui';
import { MessageSquare, Calendar, Send, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Props {
    contract: Contract;
    meId: string;
    onNewMessage: (c: Contract) => void;
}

function MsgBubble({ msg, isMe }: { msg: ContractMessage; isMe: boolean }) {
    const time = msg.created_at.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';

    return (
        <div className={cn("mb-1 flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
            <div className={cn("flex items-center gap-1.5 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                <span className={cn("text-[10px] font-bold", isMe ? "text-primary" : "text-foreground")}>
                    {isMe ? "You" : name}
                </span>
                {role && (
                    <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {role}
                    </span>
                )}
            </div>
            <div className={cn("group relative max-w-[85%]", isMe ? "text-right" : "text-left")}>
                <div
                    className={cn(
                        "px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm select-text",
                        isMe 
                            ? "bg-primary text-primary-foreground rounded-[18px_18px_4px_18px]" 
                            : "bg-card text-foreground border border-border rounded-[18px_18px_18px_4px]"
                    )}
                >
                    {msg.message}
                </div>
                <div className={cn(
                    "absolute -bottom-4 z-10 rounded border border-border bg-background/90 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100",
                    isMe ? "right-0" : "left-0"
                )}>
                    {msg.created_at}
                </div>
            </div>
            <div className={cn("mt-0.5 flex items-center gap-1 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                <span className="text-[10px] font-medium text-muted-foreground">{time}</span>
                {isMe && msg.read_by.length > 1 && (
                    <i className="fa-solid fa-check-double text-[9px] text-primary" title={`Dibaca oleh ${msg.read_by.length} orang`} />
                )}
            </div>
        </div>
    );
}

export default function ContractChat({ contract, meId, onNewMessage }: Props) {
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [sending, setSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const msgs = contract.messages ?? [];

    const filteredMsgs = search.trim() ? msgs.filter((m) => m.message.toLowerCase().includes(search.toLowerCase())) : msgs;

    useEffect(() => {
        !showSearch && endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs.length, showSearch]);

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        try {
            await contractApi.messages.send(contract.id, text);
            const updated = await contractApi.get(contract.id);
            onNewMessage(updated);
            setInput('');
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

    const groupedMessages = filteredMsgs.reduce((acc, msg) => {
        const date = msg.created_at.split(' ')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {} as Record<string, ContractMessage[]>);

    return (
        <div className="flex flex-col h-[500px] bg-card border border-border rounded-xl overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-black tracking-[0.2em] text-foreground uppercase flex items-center gap-2">
                         <MessageSquare size={14} className="text-primary" /> Discussion Channel
                    </h3>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold border-border text-muted-foreground uppercase tracking-tighter">
                    {msgs.length} Messages
                </Badge>
            </div>

            {/* Discussion Area */}
            <ScrollArea className="flex-1 p-4 bg-muted/10">
                <div className="flex flex-col gap-6">
                    {filteredMsgs.length === 0 ? (
                        <div className="pt-20 text-center flex flex-col items-center gap-3 opacity-20">
                            <MessageSquare size={48} strokeWidth={1} />
                            <p className="text-sm font-bold uppercase tracking-widest">No conversation yet</p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([day, dayMessages]) => (
                            <div key={day} className="flex flex-col gap-4">
                                {/* Date Separator */}
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-[10px] font-bold text-muted-foreground bg-card border border-border rounded-full px-3 py-1 flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap shadow-sm">
                                        <Calendar size={10} /> {day}
                                    </span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>
                                {dayMessages.map((m) => (
                                    <MsgBubble key={m.id} msg={m} isMe={m.user_id === meId} />
                                ))}
                            </div>
                        ))
                    )}
                    <div ref={endRef} />
                </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-4 border-t border-border bg-card flex items-end gap-2 group">
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pesan diskusi..."
                    rows={1}
                    className="flex-1 bg-muted/50 border-none focus:ring-0 text-sm resize-none py-2.5 px-4 min-h-[44px] max-h-[120px] rounded-xl scrollbar-hide text-foreground placeholder:text-muted-foreground"
                />
                <Button 
                    size="icon" 
                    className={cn(
                        "h-11 w-11 shrink-0 rounded-xl transition-all",
                        input.trim() ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground/30"
                    )}
                    onClick={send}
                    disabled={!input.trim() || sending}
                >
                    <Send size={18} />
                </Button>
            </div>
        </div>
    );
}
