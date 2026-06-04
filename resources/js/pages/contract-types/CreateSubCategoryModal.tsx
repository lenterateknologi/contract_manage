import { Button } from '@/components/ui/base/Button';
import { useToast } from '@/components/ui/feedback/Toast';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Modal } from '@/components/ui/overlays/Modal';
import { useForm } from '@inertiajs/react';
import { PlusCircle, Settings2 } from 'lucide-react';
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
            },
        });
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary rounded-xl p-2">
                        <PlusCircle size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight uppercase">Tambah Sub-Klasifikasi</span>
                        <span className="text-text-desc mt-0.5 text-[10px] font-bold tracking-widest uppercase">Induk: {parentName}</span>
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

                <div className="border-surface-border flex items-center justify-end gap-3 border-t pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="h-10 px-6 text-[10px] font-black tracking-widest uppercase">
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="shadow-primary/20 h-10 px-8 text-[10px] font-black tracking-widest uppercase shadow-lg"
                    >
                        {form.processing ? 'Memproses...' : 'Daftarkan Sub-Kategori'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
