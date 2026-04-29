import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowLeft, Search, X, FileText, Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { contractApi } from '@/lib/contract-api';
import { Contract } from '@/types/contracts';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { Avatar } from '@/components/contracts/ui';
import { cn } from '@/lib/utils';

function MsgBubble({ msg, isMe }: { msg: any; isMe: boolean }) {
    const time = msg.created_at?.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';

    if (isMe)
        return (
            <div className="mb-4 flex flex-col items-end gap-1.5 group animate-in slide-in-from-right-2 duration-300">
                <div className="mr-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-sidebar-primary dark:text-blue-400 uppercase tracking-wider">You</span>
                    {role && (
                        <span className="px-1.5 py-0.5 rounded-lg border border-sidebar-border bg-sidebar-accent text-[8px] font-black text-sidebar-foreground/60 uppercase tracking-tighter">
                            {role}
                        </span>
                    )}
                </div>
                <div className="relative max-w-[85%]">
                    <div
                        className="rounded-[16px_16px_4px_16px] px-4 py-2.5 text-[12px] font-medium leading-relaxed text-white select-text bg-sidebar-primary"
                    >
                        {msg.message}
                    </div>
                </div>
                <div className="mt-0.5 mr-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-sidebar-foreground/30 uppercase tracking-tight">{time}</span>
                    {msg.read_by?.length > 1 && <i className="fa-solid fa-check-double text-[9px] text-sidebar-primary dark:text-blue-400" />}
                </div>
            </div>
        );

    return (
        <div className="mb-4 flex items-start gap-3 animate-in slide-in-from-left-2 duration-300">
            <Avatar user={msg.user} size="sm" className="mt-1 ring-1 ring-sidebar-border" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <span className="truncate text-[10px] font-bold text-sidebar-foreground uppercase tracking-wider">{name}</span>
                    {role && (
                        <span className="px-1.5 py-0.5 rounded-lg border border-sidebar-border bg-sidebar-accent text-[8px] font-black text-sidebar-foreground/60 uppercase tracking-tighter">
                            {role}
                        </span>
                    )}
                </div>
                <div className="relative w-fit max-w-[88%]">
                    <div
                        className="rounded-[16px_16px_16px_4px] border border-sidebar-border bg-white dark:bg-sidebar-accent/50 px-4 py-2.5 text-[12px] font-medium leading-relaxed select-text text-sidebar-foreground"
                    >
                        {msg.message}
                    </div>
                </div>
                <span className="mt-0.5 ml-1 text-[9px] font-bold text-sidebar-foreground/30 uppercase tracking-tight">{time}</span>
            </div>
        </div>
    );
}

function DateSeparator({ date }: { date: string }) {
    return (
        <div className="relative my-8 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-sidebar-border/30"></div>
            </div>
            <span className="relative rounded-lg border border-sidebar-border bg-sidebar px-4 py-1.5 text-[9px] font-black tracking-[0.2em] text-sidebar-foreground/40 uppercase">
                {date}
            </span>
        </div>
    );
}

export function HeaderChat() {
    const { auth } = usePage<SharedData>().props;
    const meId = auth.user?.id || '';
    
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [searchList, setSearchList] = useState('');
    const [searchThread, setSearchThread] = useState('');
    const [showSearchThread, setShowSearchThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const data = await contractApi.list({ per_page: 100 });
            setContracts(data.data);
        } catch (error) {
            console.error('Failed to fetch contracts for chat', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchContracts();
        }
    }, [open]);

    const totalUnread = contracts.reduce((sum, c) => sum + (c.messages ?? []).filter((m) => !m.read_by.includes(meId)).length, 0);

    const filteredContracts = contracts.filter(
        (c) => c.contract_no.toLowerCase().includes(searchList.toLowerCase()) || c.title?.toLowerCase().includes(searchList.toLowerCase()),
    );

    const active = activeId ? contracts.find((c) => c.id === activeId) : null;
    const msgs = active?.messages ?? [];
    const filteredMsgs = searchThread.trim() ? msgs.filter((m) => m.message.toLowerCase().includes(searchThread.toLowerCase())) : msgs;

    useEffect(() => {
        if (activeId) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [msgs.length, activeId]);

    const openThread = async (id: string) => {
        setActiveId(id);
        setSearchThread('');
        setShowSearchThread(false);
        await contractApi.messages.markRead(id);
        const updated = await contractApi.get(id);
        setContracts(prev => prev.map(c => c.id === id ? updated : c));
    };

    const showList = () => {
        setActiveId(null);
        setSearchThread('');
        setShowSearchThread(false);
    };

    const send = async () => {
        const text = input.trim();
        if (!text || !activeId || sending) return;
        setSending(true);
        try {
            await contractApi.messages.send(activeId, text);
            const updated = await contractApi.get(activeId);
            setContracts(prev => prev.map(c => c.id === activeId ? updated : c));
            setInput('');
        } finally {
            setSending(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent transition-all group">
                    <MessageSquare className="h-[1.1rem] w-[1.1rem] transition-transform group-hover:scale-110" />
                    {totalUnread > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sidebar-primary opacity-40"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sidebar-primary"></span>
                        </span>
                    )}
                    <span className="sr-only">Chat</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 sm:max-w-[550px] flex flex-col h-full border-l border-sidebar-border bg-sidebar font-sans">
                <SheetHeader className="px-6 py-5 border-b border-sidebar-border bg-sidebar-primary">
                    <div className="flex items-center gap-4">
                        {activeId && (
                            <Button variant="ghost" size="icon" onClick={showList} className="h-9 w-9 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all">
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="flex flex-col text-left min-w-0">
                            <SheetTitle className="text-[13px] font-black uppercase tracking-wider text-white truncate leading-tight">
                                {active ? active.contract_no : 'Diskusi Kontrak'}
                            </SheetTitle>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] truncate">
                                    {active ? active.title : 'Live Messenger'}
                                </p>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Thread Search */}
                    {activeId && showSearchThread && (
                        <div className="flex items-center gap-3 border-b border-sidebar-border bg-sidebar-accent/30 px-6 py-2.5 animate-in slide-in-from-top duration-300">
                            <Search className="h-4 w-4 text-sidebar-primary" />
                            <input
                                autoFocus
                                value={searchThread}
                                onChange={(e) => setSearchThread(e.target.value)}
                                placeholder="Cari pesan..."
                                className="flex-1 border-none bg-transparent text-[12px] font-bold text-sidebar-foreground placeholder:text-sidebar-foreground/30 outline-none"
                            />
                            <Button variant="ghost" size="icon" onClick={() => { setShowSearchThread(false); setSearchThread(''); }} className="h-7 w-7 rounded-md hover:bg-sidebar-accent">
                                <X size={14} className="text-sidebar-foreground/40" />
                            </Button>
                        </div>
                    )}

                    {/* List Search */}
                    {!activeId && (
                        <div className="flex items-center gap-4 border-b border-sidebar-border bg-sidebar-accent/10 px-6 py-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/30 group-focus-within:text-sidebar-primary transition-colors" />
                                <input
                                    value={searchList}
                                    onChange={(e) => setSearchList(e.target.value)}
                                    placeholder="Cari kontrak..."
                                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-sidebar-accent/50 border border-sidebar-border rounded-lg text-[12px] font-bold text-sidebar-foreground placeholder:text-sidebar-foreground/30 outline-none focus:border-sidebar-primary transition-all"
                                />
                                {searchList && (
                                    <Button variant="ghost" size="icon" onClick={() => setSearchList('')} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7">
                                        <X size={14} className="text-sidebar-foreground/30" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* List View */}
                    {!activeId && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading && contracts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-sidebar-primary border-t-transparent" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/40">Loading Database...</p>
                                </div>
                            ) : filteredContracts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-5 opacity-20">
                                    <MessageSquare size={64} strokeWidth={1.5} className="text-sidebar-foreground" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-center px-16 leading-relaxed">No conversations</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-sidebar-border/40">
                                    {filteredContracts.map((c) => {
                                        const unread = (c.messages ?? []).filter((m) => !m.read_by.includes(meId)).length;
                                        const last = c.messages?.at(-1);
                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() => openThread(c.id)}
                                                className="flex cursor-pointer items-center gap-5 px-6 py-5 transition-all hover:bg-sidebar-accent/20 group active:bg-sidebar-accent/30"
                                            >
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-white dark:bg-sidebar-accent group-hover:border-sidebar-primary transition-all duration-300 relative shadow-sm">
                                                    <FileText size={20} className="text-sidebar-primary" />
                                                    {unread > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-sidebar" />}
                                                </div>
                                                <div className="min-w-0 flex-1 flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="truncate text-[12px] font-black text-sidebar-foreground uppercase tracking-tight group-hover:text-sidebar-primary transition-colors">{c.contract_no}</span>
                                                        {last && (
                                                            <span className="ml-2 shrink-0 text-[10px] font-bold text-sidebar-foreground/30 uppercase">
                                                                {last.created_at.split(' ')[1].substring(0, 5)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="truncate text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-wider">{c.title}</div>
                                                    {last ? (
                                                        <div className="mt-1.5 truncate text-[12px] font-bold text-sidebar-foreground/70 leading-none">
                                                            <span className="text-sidebar-primary font-black uppercase text-[10px] tracking-tight">{last.user?.name?.split(' ')[0]}:</span>
                                                            <span className="ml-1.5">{last.message}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-1.5 text-[10px] text-sidebar-foreground/20 italic font-bold uppercase tracking-widest">Initialization...</div>
                                                    )}
                                                </div>
                                                {unread > 0 && (
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-[10px] font-black text-white">
                                                        {unread}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Chat View */}
                    {activeId && (
                        <div className="flex flex-1 flex-col overflow-hidden bg-sidebar-accent/10">
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2 custom-scrollbar">
                                {filteredMsgs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 gap-5 opacity-20">
                                        <MessageSquare size={48} strokeWidth={1.5} className="text-sidebar-primary" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-center">Start a conversation</p>
                                    </div>
                                ) : (
                                    (() => {
                                        let lastDate = '';
                                        return filteredMsgs.map((m) => {
                                            const mDateStr = m.created_at?.split(' ')[0] || '';
                                            let separator = null;
                                            if (mDateStr && mDateStr !== lastDate) {
                                                lastDate = mDateStr;
                                                let label = mDateStr;
                                                const d = new Date(mDateStr);
                                                const now = new Date();
                                                const yesterday = new Date();
                                                yesterday.setDate(now.getDate() - 1);

                                                if (mDateStr === now.toISOString().split('T')[0]) label = 'Hari ini';
                                                else if (mDateStr === yesterday.toISOString().split('T')[0]) label = 'Kemarin';
                                                else label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

                                                separator = <DateSeparator key={`sep-${mDateStr}`} date={label} />;
                                            }
                                            return (
                                                <React.Fragment key={m.id}>
                                                    {separator}
                                                    <MsgBubble msg={m} isMe={m.user_id === meId} />
                                                </React.Fragment>
                                            );
                                        });
                                    })()
                                )}
                                <div ref={endRef} />
                            </div>
                            
                            <div className="p-6 border-t border-sidebar-border bg-white dark:bg-sidebar">
                                <div className="flex items-end gap-3 p-1.5 rounded-xl border border-sidebar-border bg-sidebar-accent/10 focus-within:bg-white dark:focus-within:bg-sidebar-accent/20 focus-within:border-sidebar-primary transition-all duration-300">
                                    <textarea
                                        rows={1}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                                        placeholder="Tulis pesan..."
                                        className="flex-1 bg-transparent px-4 py-3 text-[13px] font-bold text-sidebar-foreground placeholder:text-sidebar-foreground/30 outline-none resize-none min-h-[46px] max-h-[120px]"
                                        style={{ height: 'auto' }}
                                    />
                                    <Button 
                                        size="icon" 
                                        onClick={send} 
                                        disabled={sending || !input.trim()}
                                        className="h-11 w-11 rounded-lg bg-sidebar-primary text-white hover:scale-105 active:scale-95 transition-all shrink-0 mb-0.5"
                                    >
                                        <Send size={20} className="stroke-[2.5px]" />
                                    </Button>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
