import { Button } from '@/components/ui/base/Button';
import { FormInput } from '@/components/ui/forms/FormInput';
import { Modal } from '@/components/ui/overlays/Modal';
import { cn } from '@/lib/utils';
import { CloudUpload, FileCheck, FileUp } from 'lucide-react';
import React, { useState } from 'react';

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

    const [type, setType] = useState<'f1' | 'f2'>(initialType && initialType !== 'contract' ? initialType : 'f1');

    React.useEffect(() => {
        if (open && initialType && initialType !== 'contract') setType(initialType);
    }, [open, initialType]);

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
        <Modal
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <FileUp size={18} className="text-muted-foreground" />
                    <span>Upload Revisi {type === 'f1' ? 'Form F1' : 'Form F2'}</span>
                </div>
            }
            footer={
                <div className="flex w-full justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !file || !changelog.trim()} className="min-w-[120px]">
                        {loading ? 'Mengupload...' : 'Upload'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="text-muted-foreground mb-2 block text-[11px] font-bold tracking-wider uppercase">Jenis Dokumen</label>
                    <div className="bg-muted border-border flex gap-2 rounded-xl border p-1">
                        {(['f1', 'f2'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={cn(
                                    'flex-1 rounded-lg py-2 text-[11px] font-black uppercase transition-all',
                                    type === t
                                        ? 'bg-white text-black shadow-sm dark:bg-slate-800 dark:text-white'
                                        : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white',
                                )}
                            >
                                {t === 'f1' ? 'F1 (Utama)' : 'F2'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="group relative">
                    <input
                        type="file"
                        accept=".docx,.DOCX,.doc,.DOC,.pdf,.PDF"
                        onChange={handleFile}
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    />
                    <div
                        className={cn(
                            'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all',
                            file
                                ? 'border-primary bg-primary/[0.02] dark:border-white dark:bg-white/[0.02]'
                                : 'group-hover:border-primary/40 border-black/10 bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/40',
                        )}
                    >
                        {file ? (
                            <FileCheck size={32} className="text-primary dark:text-white" />
                        ) : (
                            <CloudUpload size={32} className="text-black/20 dark:text-white/20" />
                        )}
                        <div className="max-w-full text-center">
                            <div
                                className={cn(
                                    'truncate px-4 text-[11px] font-black uppercase',
                                    file ? 'text-primary dark:text-white' : 'text-black/40 dark:text-white/40',
                                )}
                            >
                                {file ? file.name : 'Pilih file atau drag ke sini'}
                            </div>
                            {!file && <div className="mt-1 text-[10px] font-medium text-black/20">Mendukung .docx, .doc, .pdf</div>}
                        </div>
                    </div>
                </div>

                <FormInput
                    label="Changelog *"
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder="Apa yang berubah pada versi ini?"
                    required
                />
            </div>
        </Modal>
    );
}
