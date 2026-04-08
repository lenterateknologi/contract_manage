import React, { useEffect, useRef, useState } from 'react';
import { Contract, ContractMessage } from '@/types/contracts';
import { Avatar } from './ui';
import { contractApi } from '@/lib/contract-api';

interface Props { contract: Contract; meId: string; onNewMessage: (c: Contract) => void; }

function MsgBubble({ msg, isMe }: { msg: ContractMessage; isMe: boolean }) {
    const time = msg.created_at.split(' ')[1] ?? msg.created_at;
    if (isMe) return (
        <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] text-gray-400 mr-1">{msg.user?.name}</span>
            <div className="px-3 py-2 text-[12px] max-w-[85%] text-white rounded-[14px_14px_4px_14px]" style={{ background: '#2563eb' }}>{msg.message}</div>
            <span className="text-[10px] text-gray-400 mr-1">{time}</span>
        </div>
    );
    return (
        <div className="flex items-end gap-2">
            <Avatar user={msg.user} size="sm" />
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400">{msg.user?.name}</span>
                <div className="px-3 py-2 text-[12px] max-w-[85%] rounded-[14px_14px_14px_4px]" style={{ background: '#f3f4f6', color: '#111827' }}>{msg.message}</div>
                <span className="text-[10px] text-gray-400">{time}</span>
            </div>
        </div>
    );
}

export default function ContractChat({ contract, meId, onNewMessage }: Props) {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const msgs = contract.messages ?? [];
    const unread = msgs.filter(m => !m.read_by.includes(meId)).length;

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

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
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
                {msgs.length === 0 ? (
                    <div className="text-center text-gray-400 text-[12px] pt-8">
                        <i className="fa-solid fa-comments text-2xl block mb-2" />
                        Belum ada diskusi untuk kontrak ini.
                    </div>
                ) : msgs.map(m => <MsgBubble key={m.id} msg={m} isMe={m.user_id === meId} />)}
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
