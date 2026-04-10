import React, { useEffect, useRef, useState } from 'react';
import { Contract } from '@/types/contracts';
import { contractApi } from '@/lib/contract-api';
import { Avatar } from './ui';

interface Props { contracts: Contract[]; meId: string; onContractUpdated: (c: Contract) => void; }

function MsgBubble({ msg, isMe }: { msg: any; isMe: boolean }) {
    const time = msg.created_at?.split(' ')[1] ?? '';
    if (isMe) return (
        <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] text-gray-400 mr-1">{msg.user?.name}</span>
            <div className="px-3 py-2 text-[12px] max-w-[85%]" style={{ background: '#2563eb', color: '#fff', borderRadius: '14px 14px 4px 14px' }}>{msg.message}</div>
            <span className="text-[10px] text-gray-400 mr-1">{time}</span>
        </div>
    );
    return (
        <div className="flex items-end gap-2">
            <Avatar user={msg.user} size="sm" />
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400">{msg.user?.name}</span>
                <div className="px-3 py-2 text-[12px] max-w-[85%]" style={{ background: '#f3f4f6', color: '#111827', borderRadius: '14px 14px 14px 4px' }}>{msg.message}</div>
                <span className="text-[10px] text-gray-400">{time}</span>
            </div>
        </div>
    );
}

export default function FloatingChat({ contracts, meId, onContractUpdated }: Props) {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [searchList, setSearchList] = useState('');
    const [searchThread, setSearchThread] = useState('');
    const [showSearchThread, setShowSearchThread] = useState(false);
    const [sending, setSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const totalUnread = contracts.reduce((sum, c) =>
        sum + (c.messages ?? []).filter(m => !m.read_by.includes(meId)).length, 0);

    const filteredContracts = contracts.filter(c => 
        c.contract_no.toLowerCase().includes(searchList.toLowerCase()) || 
        c.title?.toLowerCase().includes(searchList.toLowerCase())
    );

    const active = activeId ? contracts.find(c => c.id === activeId) : null;
    const msgs = active?.messages ?? [];
    const filteredMsgs = searchThread.trim() 
        ? msgs.filter(m => m.message.toLowerCase().includes(searchThread.toLowerCase())) 
        : msgs;

    useEffect(() => { !showSearchThread && endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, activeId, showSearchThread]);

    const toggleChat = () => {
        if (!open) { setActiveId(null); }
        setOpen(o => !o);
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
        } finally { setSending(false); }
    };

    return (
        <>
            {/* FAB — always shows fa-comments icon; badge shows when unread > 0 */}
            <button onClick={toggleChat}
                className="fixed bottom-5 right-5 z-[200] w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
                style={{ position: 'fixed' }}>
                <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-comments'} text-[18px]`} />
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                        style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20 }}>
                        {totalUnread}
                    </span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="fixed bottom-20 right-5 z-[199]" style={{ width: 340, animation: 'slide-up .2s ease' }}>
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: 480 }}>

                        {/* Panel header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    {activeId && (
                                        <button onClick={showList}
                                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 text-[13px] transition-colors">
                                            <i className="fa-solid fa-arrow-left" />
                                        </button>
                                    )}
                                    <span className="text-[13px] font-semibold truncate">{active ? active.contract_no : 'Diskusi Kontrak'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                                {activeId && !showSearchThread && (
                                    <button onClick={() => setShowSearchThread(true)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 text-[12px] transition-colors">
                                        <i className="fa-solid fa-magnifying-glass" />
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)}
                                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 text-[13px] transition-colors">
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            </div>
                        </div>

                        {/* Search Sub-header for Thread */}
                        {activeId && showSearchThread && (
                            <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                                <i className="fa-solid fa-magnifying-glass text-gray-400 text-[10px]" />
                                <input autoFocus value={searchThread} onChange={e => setSearchThread(e.target.value)} placeholder="Cari pesan..." className="flex-1 bg-transparent border-none outline-none text-[11px] placeholder-gray-400" />
                                <button onClick={() => { setShowSearchThread(false); setSearchThread(''); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <i className="fa-solid fa-xmark text-[10px]" />
                                </button>
                            </div>
                        )}

                        {/* Search header for List view */}
                        {!activeId && (
                            <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2">
                                <i className="fa-solid fa-magnifying-glass text-gray-300 text-[11px]" />
                                <input value={searchList} onChange={e => setSearchList(e.target.value)} placeholder="Cari kontrak..." className="flex-1 bg-transparent border-none outline-none text-[12px] placeholder-gray-300" />
                                {searchList && <button onClick={() => setSearchList('')} className="text-gray-300 hover:text-gray-500"><i className="fa-solid fa-xmark text-[11px]" /></button>}
                            </div>
                        )}

                        {/* List view */}
                        {!activeId && (
                            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                {filteredContracts.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 text-[12px]">
                                        <i className="fa-solid fa-magnifying-glass block text-2xl mb-2 opacity-20" />
                                        Kontrak tidak ditemukan
                                    </div>
                                ) : filteredContracts.map(c => {
                                    const unread = (c.messages ?? []).filter(m => !m.read_by.includes(meId)).length;
                                    const last = c.messages?.at(-1);
                                    return (
                                        <div key={c.id} onClick={() => openThread(c.id)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                            style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                                <i className="fa-solid fa-file-lines text-blue-400 text-[13px]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[12px] font-semibold text-gray-800 truncate">{c.contract_no}</span>
                                                    {last && <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{last.created_at.split(' ')[1]}</span>}
                                                </div>
                                                <div className="text-[11px] text-gray-400 truncate mt-0.5">{c.title}</div>
                                                {last
                                                    ? <div className="text-[11px] text-gray-500 truncate mt-0.5"><span className="font-medium">{last.user?.name?.split(' ')[0]}:</span> {last.message}</div>
                                                    : <div className="text-[11px] text-gray-300 italic mt-0.5">Belum ada pesan</div>}
                                            </div>
                                            {unread > 0 && <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{unread}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Message view */}
                        {activeId && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5" style={{ scrollbarWidth: 'thin' }}>
                                    {filteredMsgs.length === 0
                                        ? <div className="text-center text-gray-400 text-[12px] pt-8"><i className="fa-solid fa-comments text-2xl block mb-2" />{searchThread ? 'Pesan tidak ditemukan.' : 'Belum ada pesan.'}</div>
                                        : filteredMsgs.map(m => <MsgBubble key={m.id} msg={m} isMe={m.user_id === meId} />)}
                                    <div ref={endRef} />
                                </div>
                                <div className="px-3 pb-3 pt-2 border-t border-gray-100 flex gap-2">
                                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Tulis pesan..."
                                        className="flex-1 text-[12px] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 placeholder-gray-300" />
                                    <button onClick={send} disabled={sending || !input.trim()} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] transition-colors disabled:opacity-50">
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
