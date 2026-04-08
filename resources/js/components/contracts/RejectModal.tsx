import React, { useState } from 'react';

interface Props { open: boolean; onClose: () => void; onSubmit: (reason: string) => Promise<void>; }

export default function RejectModal({ open, onClose, onSubmit }: Props) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    if (!open) return null;

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        try { await onSubmit(reason); onClose(); setReason(''); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-xl w-[400px] max-w-[95vw] shadow-xl" style={{ animation: 'modal-in .18s ease' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h6 className="text-[14px] font-semibold text-red-600 flex items-center gap-2">
                        <i className="fa-solid fa-circle-xmark text-[13px]" /> Tolak Kontrak
                    </h6>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 text-[13px]">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="p-5">
                    <p className="text-[12px] text-gray-500 mb-3">Berikan alasan penolakan agar initiator dapat melakukan revisi.</p>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Alasan Penolakan *</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Jelaskan alasan penolakan..."
                        className="w-full text-[12px] border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-red-400 resize-none placeholder-gray-300" />
                </div>
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
                    <button onClick={onClose} className="px-3 py-1.5 text-[12px] font-medium border border-gray-200 rounded-md hover:bg-gray-50">Batal</button>
                    <button onClick={handleSubmit} disabled={loading || !reason.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[12px] font-medium rounded-md transition-colors disabled:opacity-50">
                        <i className="fa-solid fa-xmark text-[11px]" /> {loading ? 'Mengirim...' : 'Konfirmasi Tolak'}
                    </button>
                </div>
            </div>
        </div>
    );
}
