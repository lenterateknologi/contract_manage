import React, { useRef, useState } from 'react';

interface Props { open: boolean; onClose: () => void; onSubmit: (data: FormData) => Promise<void>; }

export default function UploadRevisionModal({ open, onClose, onSubmit }: Props) {
    const [changelog, setChangelog] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!changelog.trim()) return;
        const fd = new FormData();
        fd.append('changelog', changelog);
        if (file) fd.append('file', file);
        setLoading(true);
        try { await onSubmit(fd); onClose(); setChangelog(''); setFile(null); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-xl w-[460px] max-w-[95vw] shadow-xl" style={{ animation: 'modal-in .18s ease' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h6 className="text-[14px] font-semibold flex items-center gap-2">
                        <i className="fa-solid fa-file-arrow-up text-gray-400 text-[13px]" /> Upload Versi Baru
                    </h6>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 text-[13px]">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">File Revisi (.docx)</label>
                        <div onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg py-6 text-center cursor-pointer bg-gray-50 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            <i className="fa-regular fa-file-word text-gray-400 text-2xl block mb-2" />
                            <p className="text-[12px] text-gray-500"><span className="text-blue-600 font-semibold">Klik untuk upload</span> file revisi</p>
                        </div>
                        <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        {file && (
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                                <i className="fa-solid fa-file-word text-blue-600" /> {file.name}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Changelog *</label>
                        <input value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="Apa yang berubah pada versi ini?"
                            className="w-full text-[12px] border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-blue-500 placeholder-gray-300" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
                    <button onClick={onClose} className="px-3 py-1.5 text-[12px] font-medium border border-gray-200 rounded-md hover:bg-gray-50">Batal</button>
                    <button onClick={handleSubmit} disabled={loading || !changelog.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-md transition-colors disabled:opacity-50">
                        <i className="fa-solid fa-upload text-[11px]" /> {loading ? 'Mengupload...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}
