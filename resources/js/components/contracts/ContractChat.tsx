import React, { useEffect, useRef, useState } from 'react';
import { Contract, ContractMessage } from '@/types/contracts';
import { Avatar } from './ui';
import { contractApi } from '@/lib/contract-api';

interface Props { contract: Contract; meId: string; onNewMessage: (c: Contract) => void; }

function MsgBubble({ msg, isMe }: { msg: ContractMessage; isMe: boolean }) {
    const time = msg.created_at.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';

    if (isMe) return (
        <div className="flex flex-col items-end gap-1 mb-1">
            <div className="flex items-center gap-1.5 mr-1">
                <span className="text-[10px] font-bold text-blue-600">You</span>
                {role && <span className="text-[10px] text-gray-400 font-medium px-1.5 py-0.5 bg-gray-50 rounded-md border border-gray-100">{role}</span>}
            </div>
            <div className="group relative max-w-[85%]">
                <div className="px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white rounded-[18px_18px_4px_18px] shadow-sm select-text" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    {msg.message}
                </div>
                <div className="absolute right-0 -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-gray-100 z-10 text-[9px] font-bold text-gray-400">
                    {msg.created_at}
                </div>
            </div>
            <div className="flex items-center gap-1 mr-1 mt-0.5">
                <span className="text-[10px] text-gray-400 font-medium">{time}</span>
                {msg.read_by.length > 1 && <i className="fa-solid fa-check-double text-[9px] text-blue-500" title={`Dibaca oleh ${msg.read_by.length} orang`} />}
            </div>
        </div>
    );

    return (
        <div className="flex items-start gap-2.5 mb-1">
            <Avatar user={msg.user} size="sm" className="mt-5" />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-700 truncate">{name}</span>
                    {role && <span className="text-[10px] text-gray-400 font-medium px-1.5 py-0.5 bg-gray-50 rounded-md border border-gray-100">{role}</span>}
                </div>
                <div className="group relative max-w-[88%] w-fit">
                    <div className="px-3.5 py-2.5 text-[12.5px] leading-relaxed rounded-[18px_18px_18px_4px] shadow-sm select-text border border-gray-100" style={{ background: '#f9fafb', color: '#1f2937' }}>
                        {msg.message}
                    </div>
                    <div className="absolute left-0 -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-gray-100 z-10 text-[9px] font-bold text-gray-400">
                        {msg.created_at}
                    </div>
                </div>
                <span className="text-[10px] text-gray-400 font-medium ml-1 mt-0.5">{time}</span>
            </div>
        </div>
    );
}

function DateSeparator({ date }: { date: string }) {
    return (
        <div className="flex items-center justify-center my-6 relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative px-4 py-1.5 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 rounded-full shadow-sm">
                {date}
            </span>
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

    const filteredMsgs = search.trim() 
        ? msgs.filter(m => m.message.toLowerCase().includes(search.toLowerCase())) 
        : msgs;

    useEffect(() => { !showSearch && endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, showSearch]);

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        try {
            await contractApi.messages.send(contract.id, text);
            const updated = await contractApi.get(contract.id);
            onNewMessage(updated);
            setInput('');
        } finally { setSending(false); }
    };

    return (
        <div className="flex flex-col" style={{ height: 340 }}>
            {/* Search Header */}
            <div className="flex items-center justify-between mb-2">
                {showSearch ? (
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 transition-all">
                        <i className="fa-solid fa-magnifying-glass text-gray-400 text-[10px]" />
                        <input 
                            autoFocus
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Cari pesan..." 
                            className="flex-1 bg-transparent border-none outline-none text-[12px] placeholder-gray-400"
                        />
                        <button onClick={() => { setShowSearch(false); setSearch(''); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <i className="fa-solid fa-xmark text-[10px]" />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1" />
                )}
                {!showSearch && (
                    <button onClick={() => setShowSearch(true)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                        <i className="fa-solid fa-magnifying-glass text-[11px]" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
                {filteredMsgs.length === 0 ? (
                    <div className="text-center text-gray-400 text-[12px] pt-8">
                        <i className="fa-solid fa-comments text-2xl block mb-2" />
                        {search ? 'Tidak ada pesan yang cocok.' : 'Belum ada diskusi untuk kontrak ini.'}
                    </div>
                ) : (() => {
                    let lastDate = '';
                    return filteredMsgs.map((m) => {
                        const mDateStr = m.created_at.split(' ')[0];
                        let separator = null;
                        if (mDateStr !== lastDate) {
                            lastDate = mDateStr;
                            let label = mDateStr;
                            const d = new Date(mDateStr);
                            const now = new Date();
                            const yesterday = new Date();
                            yesterday.setDate(now.getDate() - 1);

                            if (mDateStr === now.toISOString().split('T')[0]) label = 'Hari ini';
                            else if (mDateStr === yesterday.toISOString().split('T')[0]) label = 'Kemarin';
                            else label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                            
                            separator = <DateSeparator key={`sep-${mDateStr}`} date={label} />;
                        }
                        return (
                            <React.Fragment key={m.id}>
                                {separator}
                                <MsgBubble msg={m} isMe={m.user_id === meId} />
                            </React.Fragment>
                        );
                    });
                })()}
                <div ref={endRef} />
            </div>
            <div className="pt-3 border-t border-gray-100 flex gap-2 mt-auto">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Tulis pesan..."
                    onKeyDown={e => e.key === 'Enter' && send()}
                    className="flex-1 text-[12px] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 placeholder-gray-300" />
                <button onClick={send} disabled={sending || !input.trim()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] disabled:opacity-50">
                    <i className="fa-solid fa-paper-plane text-[11px]" />
                </button>
            </div>
        </div>
    );
}
