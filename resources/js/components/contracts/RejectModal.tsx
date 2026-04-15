import { useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
}

export default function RejectModal({ open, onClose, onSubmit }: Props) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    if (!open) return null;

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        try {
            await onSubmit(reason);
            onClose();
            setReason('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-[400px] max-w-[95vw] rounded-xl bg-white shadow-xl" style={{ animation: 'modal-in .18s ease' }}>
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h6 className="flex items-center gap-2 text-[14px] font-semibold text-red-600">
                        <i className="fa-solid fa-circle-xmark text-[13px]" /> Tolak Kontrak
                    </h6>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] text-gray-400 hover:bg-gray-100"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="p-5">
                    <p className="mb-3 text-[12px] text-gray-500">Berikan alasan penolakan agar initiator dapat melakukan revisi.</p>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Alasan Penolakan *</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Jelaskan alasan penolakan..."
                        className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-[12px] placeholder-gray-300 outline-none focus:border-red-400"
                    />
                </div>
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
                    <button onClick={onClose} className="rounded-md border border-gray-200 px-3 py-1.5 text-[12px] font-medium hover:bg-gray-50">
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                        <i className="fa-solid fa-xmark text-[11px]" /> {loading ? 'Mengirim...' : 'Konfirmasi Tolak'}
                    </button>
                </div>
            </div>
        </div>
    );
}
