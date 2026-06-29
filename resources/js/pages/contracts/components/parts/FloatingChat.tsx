import { MsgBubble } from '@/components/chat/MsgBubble';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useDebounce } from '@/hooks/use-debounce';
import { contractApi } from '@/pages/contracts/utils';
import { Contract } from '@/pages/contracts/types';
import { X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Avatar } from '../ui/ui';

interface Props {
    contracts: Contract[];
    meId: string;
    onContractUpdated: (c: Contract) => void;
}

function MsgBubble({ msg, isMe }: { msg: any; isMe: boolean }) {
    const time = msg.created_at?.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';

    if (isMe)
        return (
            <div className="mb-1 flex flex-col items-end gap-1">
                <div className="mr-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-black uppercase dark:text-white">You</span>
                    {role && (
                        <span className="px-1.2 py-0.3 rounded-md border border-gray-100 bg-gray-50 text-[10px] font-medium text-gray-400">
                            {role}
                        </span>
                    )}
                </div>
                <div className="group relative max-w-[85%]">
                    <div className="rounded-[14px_14px_4px_14px] bg-black px-3 py-2 text-[12px] leading-relaxed font-medium text-white shadow-lg select-text dark:bg-white dark:text-black">
                        {msg.message}
                    </div>
                </div>
                <div className="mt-0.5 mr-1 flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">{time}</span>
                    {msg.read_by?.length > 1 && <i className="fa-solid fa-check-double text-[9px] text-black/40 dark:text-white/40" />}
                </div>
            </div>
        );

    return (
        <div className="mb-1 flex items-start gap-2">
            <Avatar user={msg.user} size="sm" className="mt-4" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-[10px] font-bold text-gray-700">{name}</span>
                    {role && (
                        <span className="px-1.2 py-0.3 rounded-md border border-gray-100 bg-gray-50 text-[10px] font-medium text-gray-400">
                            {role}
                        </span>
                    )}
                </div>
                <div className="group relative w-fit max-w-[88%]">
                    <div
                        className="rounded-[14px_14px_14px_4px] border border-gray-100 px-3 py-2 text-[12px] leading-relaxed shadow-sm select-text"
                        style={{ background: '#f9fafb', color: '#1f2937' }}
                    >
                        {msg.message}
                    </div>
                </div>
                <span className="mt-0.5 ml-1 text-[10px] text-gray-400">{time}</span>
            </div>
        </div>
    );
}

function DateSeparator({ date }: { date: string }) {
    return (
        <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative rounded-full border border-gray-100 bg-white px-3 py-1 text-[9px] font-bold text-gray-400 uppercase shadow-sm">
                {date}
            </span>
        </div>
    );
}

export default function FloatingChat({ contracts, meId, onContractUpdated }: Props) {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [searchList, setSearchList] = useState('');
    const debouncedSearchList = useDebounce(searchList, 500);
    const [searchThread, setSearchThread] = useState('');
    const debouncedSearchThread = useDebounce(searchThread, 500);
    const [showSearchThread, setShowSearchThread] = useState(false);
    const [sending, setSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    // Draggable state
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: pos.x,
            initialY: pos.y,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPos({
            x: dragRef.current.initialX + dx,
            y: dragRef.current.initialY + dy,
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const totalUnread = contracts.reduce((sum, c) => sum + (c.messages ?? []).filter((m) => !m.read_by.includes(meId)).length, 0);

    const filteredContracts = React.useMemo(() => {
        return contracts.filter(
            (c) =>
                c.contract_no.toLowerCase().includes(debouncedSearchList.toLowerCase()) ||
                c.title?.toLowerCase().includes(debouncedSearchList.toLowerCase()),
        );
    }, [contracts, debouncedSearchList]);

    const active = activeId ? contracts.find((c) => c.id === activeId) : null;
    const msgs = active?.messages ?? [];

    const filteredMsgs = React.useMemo(() => {
        return debouncedSearchThread.trim() ? msgs.filter((m) => m.message.toLowerCase().includes(debouncedSearchThread.toLowerCase())) : msgs;
    }, [msgs, debouncedSearchThread]);

    useEffect(() => {
        !showSearchThread && endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs.length, activeId, showSearchThread]);

    const toggleChat = () => {
        if (!open) {
            setActiveId(null);
        }
        setOpen((o) => !o);
        setSearchList('');
    };

    const openThread = async (id: string) => {
        setActiveId(id);
        setSearchThread('');
        setShowSearchThread(false);
        await contractApi.messages.markRead(id);
        const updated = await contractApi.get(id);
        onContractUpdated(updated);
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
            onContractUpdated(updated);
            setInput('');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* FAB — always shows fa-comments icon; badge shows when unread > 0 */}
            {/* FAB — always shows fa-comments icon; badge shows when unread > 0 */}
            <button
                onClick={(e) => !isDragging && toggleChat()}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="fixed right-5 bottom-[10%] z-[200] flex h-12 w-12 cursor-move items-center justify-center rounded-full bg-black text-white shadow-2xl transition-all select-none hover:opacity-90 active:scale-95 dark:bg-white dark:text-black"
                style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    touchAction: 'none',
                }}
            >
                <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-comments'} text-[18px]`} />
                {totalUnread > 0 && (
                    <span className="pointer-events-none absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-black text-[10px] font-semibold text-white shadow-lg dark:border-black dark:bg-white dark:text-black">
                        {totalUnread}
                    </span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="fixed right-5 z-[199]" style={{ bottom: 'calc(10% + 4rem)', width: 340, animation: 'slide-up .2s ease' }}>
                    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl" style={{ height: 480 }}>
                        {/* Panel header */}
                        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    {activeId && (
                                        <button
                                            onClick={showList}
                                            className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] text-gray-500 transition-colors hover:bg-gray-100"
                                        >
                                            <i className="fa-solid fa-arrow-left" />
                                        </button>
                                    )}
                                    <span className="truncate text-[13px] font-semibold">{active ? active.contract_no : 'Diskusi Kontrak'}</span>
                                </div>
                            </div>
                            <div className="ml-2 flex items-center gap-1">
                                {activeId && !showSearchThread && (
                                    <button
                                        onClick={() => setShowSearchThread(true)}
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] text-gray-400 transition-colors hover:bg-gray-100"
                                    >
                                        <i className="fa-solid fa-magnifying-glass" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] text-gray-400 transition-colors hover:bg-gray-100"
                                >
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>
                        </div>

                        {/* Search Sub-header for Thread */}
                        {activeId && showSearchThread && (
                            <div className="animate-in slide-in-from-top flex items-center gap-2 border-b border-black/5 bg-black/[0.02] px-4 py-2 duration-300 dark:bg-white/[0.02]">
                                <SearchInput
                                    autoFocus
                                    value={searchThread}
                                    onChange={(e) => setSearchThread(e.target.value)}
                                    placeholder="Cari pesan..."
                                    className="h-8 text-[11px]"
                                />
                                <button
                                    onClick={() => {
                                        setShowSearchThread(false);
                                        setSearchThread('');
                                    }}
                                    className="text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Search header for List view */}
                        {!activeId && (
                            <div className="flex items-center gap-2 border-b border-black/5 bg-black/[0.02] px-4 py-3 dark:bg-white/[0.02]">
                                <SearchInput
                                    value={searchList}
                                    onChange={(e) => setSearchList(e.target.value)}
                                    placeholder="Cari kontrak..."
                                    className="h-9 text-[12px]"
                                />
                            </div>
                        )}

                        {/* List view */}
                        {!activeId && (
                            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                {filteredContracts.length === 0 ? (
                                    <div className="py-12 text-center text-[12px] text-gray-400">
                                        <i className="fa-solid fa-magnifying-glass mb-2 block text-2xl opacity-20" />
                                        Kontrak tidak ditemukan
                                    </div>
                                ) : (
                                    filteredContracts.map((c) => {
                                        const unread = (c.messages ?? []).filter((m) => !m.read_by.includes(meId)).length;
                                        const last = c.messages?.at(-1);
                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() => openThread(c.id)}
                                                className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50"
                                                style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
                                            >
                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-black/10 bg-black/5 dark:bg-white/5">
                                                    <i className="fa-solid fa-file-lines text-[13px] text-black dark:text-white" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="truncate text-[12px] font-semibold text-gray-800">{c.contract_no}</span>
                                                        {last && (
                                                            <span className="ml-2 flex-shrink-0 text-[10px] text-gray-400">
                                                                {last.created_at.split(' ')[1]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-0.5 truncate text-[11px] text-gray-400">{c.title}</div>
                                                    {last ? (
                                                        <div className="mt-0.5 truncate text-[11px] text-gray-500">
                                                            <span className="font-medium">{last.user?.name?.split(' ')[0]}:</span> {last.message}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-0.5 text-[11px] text-gray-300 italic">Belum ada pesan</div>
                                                    )}
                                                </div>
                                                {unread > 0 && (
                                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white dark:bg-white dark:text-black">
                                                        {unread}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* Message view */}
                        {activeId && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
                                    {filteredMsgs.length === 0 ? (
                                        <div className="pt-8 text-center text-[12px] text-gray-400">
                                            <i className="fa-solid fa-comments mb-2 block text-2xl" />
                                            {searchThread ? 'Pesan tidak ditemukan.' : 'Belum ada pesan.'}
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
                                <div className="flex gap-2 border-t border-gray-100 px-3 pt-2 pb-3">
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && send()}
                                        placeholder="Tulis pesan..."
                                        className="flex-1 rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-[12px] text-black placeholder-black/30 outline-none focus:border-black dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/30 dark:focus:border-white"
                                    />
                                    <button
                                        onClick={send}
                                        disabled={sending || !input.trim()}
                                        className="rounded-lg bg-black px-3 py-2 text-[12px] text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 dark:bg-white dark:text-black"
                                    >
                                        <i className="fa-solid fa-paper-plane text-[11px]" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
