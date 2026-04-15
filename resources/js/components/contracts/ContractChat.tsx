import { contractApi } from '@/lib/contract-api';
import { Contract, ContractMessage } from '@/types/contracts';
import React, { useEffect, useRef, useState } from 'react';
import { Avatar } from './ui';

interface Props {
    contract: Contract;
    meId: string;
    onNewMessage: (c: Contract) => void;
}

function MsgBubble({ msg, isMe }: { msg: ContractMessage; isMe: boolean }) {
    const time = msg.created_at.split(' ')[1]?.substring(0, 5) ?? '';
    const name = msg.user?.name ?? 'Unknown';
    const role = msg.user?.role ?? '';

    if (isMe)
        return (
            <div className="mb-1 flex flex-col items-end gap-1">
                <div className="mr-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600">You</span>
                    {role && (
                        <span className="rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                            {role}
                        </span>
                    )}
                </div>
                <div className="group relative max-w-[85%]">
                    <div
                        className="rounded-[18px_18px_4px_18px] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white shadow-sm select-text"
                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                    >
                        {msg.message}
                    </div>
                    <div className="absolute right-0 -bottom-4 z-10 rounded border border-gray-100 bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-gray-400 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                        {msg.created_at}
                    </div>
                </div>
                <div className="mt-0.5 mr-1 flex items-center gap-1">
                    <span className="text-[10px] font-medium text-gray-400">{time}</span>
                    {msg.read_by.length > 1 && (
                        <i className="fa-solid fa-check-double text-[9px] text-blue-500" title={`Dibaca oleh ${msg.read_by.length} orang`} />
                    )}
                </div>
            </div>
        );

    return (
        <div className="mb-1 flex items-start gap-2.5">
            <Avatar user={msg.user} size="sm" className="mt-5" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-[10px] font-bold text-gray-700">{name}</span>
                    {role && (
                        <span className="rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                            {role}
                        </span>
                    )}
                </div>
                <div className="group relative w-fit max-w-[88%]">
                    <div
                        className="rounded-[18px_18px_18px_4px] border border-gray-100 px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm select-text"
                        style={{ background: '#f9fafb', color: '#1f2937' }}
                    >
                        {msg.message}
                    </div>
                    <div className="absolute -bottom-4 left-0 z-10 rounded border border-gray-100 bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-gray-400 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                        {msg.created_at}
                    </div>
                </div>
                <span className="mt-0.5 ml-1 text-[10px] font-medium text-gray-400">{time}</span>
            </div>
        </div>
    );
}

function DateSeparator({ date }: { date: string }) {
    return (
        <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative rounded-full border border-gray-100 bg-white px-4 py-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase shadow-sm">
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

    return (
        <div className="flex flex-col" style={{ height: 340 }}>
            {/* Search Header */}
            <div className="mb-2 flex items-center justify-between">
                {showSearch ? (
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 transition-all">
                        <i className="fa-solid fa-magnifying-glass text-[10px] text-gray-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari pesan..."
                            className="flex-1 border-none bg-transparent text-[12px] placeholder-gray-400 outline-none"
                        />
                        <button
                            onClick={() => {
                                setShowSearch(false);
                                setSearch('');
                            }}
                            className="text-gray-400 transition-colors hover:text-gray-600"
                        >
                            <i className="fa-solid fa-xmark text-[10px]" />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1" />
                )}
                {!showSearch && (
                    <button onClick={() => setShowSearch(true)} className="text-muted-foreground hover:text-primary p-1 transition-colors">
                        <i className="fa-solid fa-magnifying-glass text-[11px]" />
                    </button>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 pb-2" style={{ scrollbarWidth: 'thin' }}>
                {filteredMsgs.length === 0 ? (
                    <div className="pt-8 text-center text-[12px] text-gray-400">
                        <i className="fa-solid fa-comments mb-2 block text-2xl" />
                        {search ? 'Tidak ada pesan yang cocok.' : 'Belum ada diskusi untuk kontrak ini.'}
                    </div>
                ) : (
                    (() => {
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
                    })()
                )}
                <div ref={endRef} />
            </div>
            <div className="mt-auto flex gap-2 border-t border-gray-100 pt-3">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tulis pesan..."
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] placeholder-gray-300 outline-none focus:border-blue-500"
                />
                <button
                    onClick={send}
                    disabled={sending || !input.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    <i className="fa-solid fa-paper-plane text-[11px]" />
                </button>
            </div>
        </div>
    );
}
