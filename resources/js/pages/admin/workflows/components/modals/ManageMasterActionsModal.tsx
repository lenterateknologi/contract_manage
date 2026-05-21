import { Modal } from '@/components/ui/overlays/Modal';
import { router } from '@inertiajs/react';
import { Edit2, Loader2, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface ManageMasterActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    masterActions: any[];
    showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export function ManageMasterActionsModal({ isOpen, onClose, masterActions, showToast }: ManageMasterActionsModalProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleEdit = (action: any) => {
        setEditingId(action.id);
        setEditName(action.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleSave = (id: string) => {
        if (!editName.trim()) {
            showToast('Nama aksi tidak boleh kosong', 'danger');
            return;
        }

        setIsProcessing(id);
        router.put(
            route('admin.workflows.master-actions.update', id),
            { name: editName },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showToast('Aksi berhasil diperbarui', 'success');
                    setEditingId(null);
                    setEditName('');
                },
                onError: (errors) => {
                    showToast(errors.name || 'Gagal memperbarui aksi', 'danger');
                },
                onFinish: () => setIsProcessing(null),
            }
        );
    };

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus aksi "${name}"?`)) return;

        setIsProcessing(id);
        router.delete(route('admin.workflows.master-actions.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Aksi berhasil dihapus', 'success');
            },
            onError: () => {
                showToast('Gagal menghapus aksi', 'danger');
            },
            onFinish: () => setIsProcessing(null),
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div>
                    <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Kelola Master Aksi</h3>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Edit atau hapus daftar pilihan nama aksi</p>
                </div>
            }
            maxWidth="md"
        >
            <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {masterActions.length === 0 ? (
                    <div className="text-center py-8 text-[11px] font-medium text-slate-400 uppercase">Belum ada daftar aksi.</div>
                ) : (
                    masterActions.map((ma) => (
                        <div
                            key={ma.id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                        >
                            {editingId === ma.id ? (
                                <div className="flex w-full items-center gap-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-8 w-full rounded-lg border-slate-200 bg-white px-2.5 text-[10px] font-bold uppercase transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSave(ma.id)}
                                        disabled={isProcessing === ma.id}
                                        className="flex h-8 items-center justify-center rounded-lg bg-emerald-500 px-3 text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                                        title="Simpan"
                                    >
                                        {isProcessing === ma.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        disabled={isProcessing === ma.id}
                                        className="flex h-8 items-center justify-center rounded-lg bg-slate-200 px-3 text-slate-600 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                        title="Batal"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <div className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-200">{ma.name}</div>
                                        <div className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{ma.code}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(ma)}
                                            disabled={isProcessing === ma.id}
                                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(ma.id, ma.name)}
                                            disabled={isProcessing === ma.id}
                                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                                        >
                                            {isProcessing === ma.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-6 dark:border-slate-800">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                >
                    Tutup
                </button>
            </div>
        </Modal>
    );
}
