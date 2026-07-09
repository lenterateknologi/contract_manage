import React, { useState } from "react";
import { Trash2, Plus, LayoutTemplate, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialogs/Dialog";
import { TreeSelect } from "@/components/ui/selection/TreeSelect";

interface ContractTypeTableManagerProps {
    title?: string;
    contractTypeIds: string[];
    onChange: (vals: string[]) => void;
    contractTypes: any[];
}

export default function ContractTypeTableManager({
    title = "Jenis Kontrak",
    contractTypeIds,
    onChange,
    contractTypes,
}: ContractTypeTableManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSelectedIds, setModalSelectedIds] = useState<string[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const openModal = () => {
        setEditIndex(null);
        setModalSelectedIds([]);
        setIsModalOpen(true);
    };

    const openEditModal = (idx: number, id: string) => {
        setEditIndex(idx);
        setModalSelectedIds([id]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalSelectedIds([]);
        setEditIndex(null);
    };

    const handleSave = () => {
        if (modalSelectedIds.length > 0) {
            if (editIndex !== null) {
                const updated = [...contractTypeIds];
                updated.splice(editIndex, 1, ...modalSelectedIds);
                onChange(updated);
            } else {
                const updated = [...contractTypeIds, ...modalSelectedIds];
                // Remove duplicates
                onChange(Array.from(new Set(updated)));
            }
        }
        closeModal();
    };

    const handleRemove = (idx: number) => {
        const updated = [...contractTypeIds];
        updated.splice(idx, 1);
        onChange(updated);
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <LayoutTemplate size={14} className="text-primary" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                </div>
                <Button variant="primary" size="sm" onClick={openModal} className="h-8 text-xs">
                    <Plus size={14} className="mr-1" /> Tambah Jenis Kontrak
                </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden overflow-x-auto">
                {contractTypeIds.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        Belum ada jenis kontrak yang dipilih. Semua jenis kontrak akan diizinkan.
                    </div>
                ) : (
                    <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                                <th className="px-3 py-3 font-bold text-slate-500 uppercase tracking-wider w-full">Jenis Kontrak</th>
                                <th className="px-3 py-3 font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {contractTypeIds.map((id, idx) => {
                                const ct = contractTypes.find(t => String(t.id) === String(id));
                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                        <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                                            {ct ? ct.name : id}
                                        </td>
                                        <td className="px-3 py-2.5 text-center flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(idx, id)}
                                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors inline-flex"
                                                title="Edit"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(idx)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors inline-flex"
                                                title="Hapus"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle>{editIndex !== null ? 'Edit Jenis Kontrak' : 'Tambah Jenis Kontrak'}</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4 flex-1 overflow-y-auto">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Pilih Jenis Kontrak</label>
                            <TreeSelect
                                value={modalSelectedIds}
                                onValueChange={setModalSelectedIds}
                                items={contractTypes.map((t: any) => ({
                                    id: t.id,
                                    name: t.name,
                                    parent_id: t.parent_id
                                }))}
                                placeholder="Pilih Jenis Kontrak..."
                                searchPlaceholder="Cari jenis kontrak..."
                                multiple={true}
                                inline={true}
                                defaultExpandAll={true}
                                triggerClassName="min-h-10 rounded-xl"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl h-10 text-xs font-bold">
                            Batal
                        </Button>
                        <Button type="button" variant="primary" onClick={handleSave} className="rounded-xl h-10 text-xs font-bold">
                            {editIndex !== null ? 'Simpan Perubahan' : 'Tambahkan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
