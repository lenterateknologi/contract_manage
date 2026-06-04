import { useToast } from '@/components/ui/feedback/Toast';
import { Button } from '@/components/ui/base/Button';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Modal } from '@/components/ui/overlays/Modal';
import { useForm } from '@inertiajs/react';
import { PlusCircle, Settings2, X } from 'lucide-react';
import React from 'react';

interface CreateSubCategoryModalProps {
    open: boolean;
    onClose: () => void;
    parentId: string;
    parentName: string;
}

export function CreateSubCategoryModal({ open, onClose, parentId, parentName }: CreateSubCategoryModalProps) {
    const { showToast } = useToast();
    const form = useForm({
        code: '',
        name: '',
        description: '',
        parent_id: parentId,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('admin.contract-types.store'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                showToast(`Sub-klasifikasi baru berhasil ditambahkan di bawah ${parentName}`, 'success');
                form.reset();
                onClose();
            },
            onError: (errors: any) => {
                showToast(errors.error || errors.code || errors.name || 'Gagal menambahkan sub-klasifikasi', 'danger');
            }
        });
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                        <PlusCircle size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-tight">Tambah Sub-Klasifikasi</span>
                        <span className="text-[10px] font-bold text-text-desc uppercase tracking-widest mt-0.5">Induk: {parentName}</span>
                    </div>
                </div>
            }
            maxWidth="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 gap-6">
                    <CompactInput
                        label="Kode Sub-Klasifikasi"
                        value={form.data.code}
                        onChange={(e) => form.setData('code', e.target.value)}
                        required
                        placeholder="CONTOH: JASA_KONSULTASI"
                        icon={Settings2}
                    />
                    <CompactInput
                        label="Nama Sub-Klasifikasi"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        required
                        placeholder="CONTOH: Jasa Konsultasi IT"
                        icon={Settings2}
                    />
                    <CompactInput
                        label="Deskripsi Ruang Lingkup"
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        placeholder="Penjelasan singkat peran sub-kategori ini..."
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="text-[10px] font-black uppercase tracking-widest h-10 px-6"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="text-[10px] font-black uppercase tracking-widest h-10 px-8 shadow-lg shadow-primary/20"
                    >
                        {form.processing ? 'Memproses...' : 'Daftarkan Sub-Kategori'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
