import React, { useRef, useState } from 'react';

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    initialType?: 'contract' | 'f1' | 'f2';
}

export default function UploadRevisionModal({ open, onClose, onSubmit, initialType }: Props) {
    const [changelog, setChangelog] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const [type, setType] = useState<'f1' | 'f2'>(initialType && initialType !== 'contract' ? initialType : 'f1');

    React.useEffect(() => {
        if (open && initialType && initialType !== 'contract') setType(initialType);
    }, [open, initialType]);

    if (!open) return null;

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] ?? null);
    };

    const handleSubmit = async () => {
        if (!file || !changelog.trim()) return;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('changelog', changelog);
        fd.append('document_type', type);
        setLoading(true);
        try { await onSubmit(fd); onClose(); setFile(null); setChangelog(''); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-background border border-border shadow-xl rounded-xl w-[440px] max-w-full shadow-xl overflow-hidden" style={{ animation: 'modal-in .18s ease' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex flex-col">
                        <h6 className="text-[14px] font-semibold flex items-center gap-2">
                            <i className="fa-solid fa-file-arrow-up text-muted-foreground text-[13px]" /> Upload Revisi {type === 'f1' ? 'Form F1' : 'Form F2'}
                        </h6>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-muted-foreground text-[13px]">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Jenis Dokumen</label>
                        <div className="flex gap-2 p-1 bg-muted rounded-lg border border-border">
                            {(['f1', 'f2'] as const).map(t => (
                                <button key={t} onClick={() => setType(t)} className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all ${type === t ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground/80'}`}>
                                    {t === 'f1' ? 'F1 (Utama)' : 'F2'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pilih File Baru</label>
                        <div className="relative group">
                            <input type="file" accept=".docx,.doc,.pdf" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className={`p-6 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 ${file ? 'border-primary/50 bg-primary/5' : 'border-border group-hover:border-gray-300 bg-muted/50'}`}>
                                <i className={`fa-solid ${file ? 'fa-file-circle-check text-blue-500' : 'fa-cloud-arrow-up text-muted-foreground'} text-2xl`} />
                                <div className="text-[11px] font-medium text-muted-foreground truncate max-w-full px-4">
                                    {file ? file.name : 'Mendukung .docx, .doc, .pdf'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Changelog *</label>
                        <input value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="Apa yang berubah pada versi ini?"
                            className="w-full text-[12px] border border-border rounded-md px-3 py-2 outline-none focus:border-blue-500 placeholder:text-muted-foreground/30" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-border/50">
                    <button onClick={onClose} className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-md hover:bg-muted">Batal</button>
                    <button onClick={handleSubmit} disabled={loading || !changelog.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-[12px] font-medium rounded-md transition-colors disabled:opacity-50">
                        <i className="fa-solid fa-upload text-[11px]" /> {loading ? 'Mengupload...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}
