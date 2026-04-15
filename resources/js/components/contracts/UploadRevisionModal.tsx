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
        try {
            await onSubmit(fd);
            onClose();
            setFile(null);
            setChangelog('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-background border-border w-[440px] max-w-full overflow-hidden rounded-xl border shadow-xl"
                style={{ animation: 'modal-in .18s ease' }}
            >
                <div className="border-border/50 flex items-center justify-between border-b px-5 py-4">
                    <div className="flex flex-col">
                        <h6 className="flex items-center gap-2 text-[14px] font-semibold">
                            <i className="fa-solid fa-file-arrow-up text-muted-foreground text-[13px]" /> Upload Revisi{' '}
                            {type === 'f1' ? 'Form F1' : 'Form F2'}
                        </h6>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground flex h-7 w-7 items-center justify-center rounded-md text-[13px] hover:bg-gray-100"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div>
                        <label className="text-muted-foreground mb-2 block text-[11px] font-semibold tracking-wider uppercase">Jenis Dokumen</label>
                        <div className="bg-muted border-border flex gap-2 rounded-lg border p-1">
                            {(['f1', 'f2'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`flex-1 rounded-md py-1.5 text-[11px] font-medium transition-all ${type === t ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground/80'}`}
                                >
                                    {t === 'f1' ? 'F1 (Utama)' : 'F2'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-muted-foreground mb-2 block text-[11px] font-semibold tracking-wider uppercase">Pilih File Baru</label>
                        <div className="group relative">
                            <input
                                type="file"
                                accept=".docx,.doc,.pdf"
                                onChange={handleFile}
                                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            />
                            <div
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all ${file ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/50 group-hover:border-gray-300'}`}
                            >
                                <i
                                    className={`fa-solid ${file ? 'fa-file-circle-check text-blue-500' : 'fa-cloud-arrow-up text-muted-foreground'} text-2xl`}
                                />
                                <div className="text-muted-foreground max-w-full truncate px-4 text-[11px] font-medium">
                                    {file ? file.name : 'Mendukung .docx, .doc, .pdf'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-muted-foreground mb-1 block text-[11px] font-semibold">Changelog *</label>
                        <input
                            value={changelog}
                            onChange={(e) => setChangelog(e.target.value)}
                            placeholder="Apa yang berubah pada versi ini?"
                            className="border-border placeholder:text-muted-foreground/30 w-full rounded-md border px-3 py-2 text-[12px] outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="border-border/50 flex justify-end gap-2 border-t px-5 py-3">
                    <button onClick={onClose} className="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-[12px] font-medium">
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !changelog.trim()}
                        className="bg-primary hover:bg-primary/90 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-colors disabled:opacity-50"
                    >
                        <i className="fa-solid fa-upload text-[11px]" /> {loading ? 'Mengupload...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}
