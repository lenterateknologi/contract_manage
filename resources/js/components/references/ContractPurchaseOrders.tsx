import React, { useState } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { cn } from '@/lib/utils';
import { Contract, ContractPurchaseOrder } from '@/pages/contracts/types';
import { contractApi } from '@/pages/contracts/utils';
import {
    Edit3,
    Loader2,
    Plus,
    ShoppingCart,
    Trash2,
    X,
} from 'lucide-react';

interface ContractPurchaseOrdersProps {
    contract: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
    meId?: string;
    vendors?: any[];
}

export default function ContractPurchaseOrders({
    contract,
    canUpdate,
    onUpdate,
    processing,
    meId,
}: ContractPurchaseOrdersProps) {
    const isActor = (contract as any).can_approve || contract.created_by === meId || (contract as any).initiated_by_id === meId;
    const canModify = isActor || canUpdate;

    const purchaseOrders = (contract.purchase_orders || []) as ContractPurchaseOrder[];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPo, setEditingPo] = useState<ContractPurchaseOrder | null>(null);
    const [saving, setSaving] = useState(false);
    const [poNumber, setPoNumber] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const openCreateModal = () => {
        setEditingPo(null);
        setPoNumber('');
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (po: ContractPurchaseOrder) => {
        setEditingPo(po);
        setPoNumber(po.po_number);
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!poNumber.trim()) {
            setErrorMsg('Nomor Purchase Order (PO) wajib diisi.');
            return;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            const payload = {
                po_number: poNumber.trim(),
            };

            let res: any;
            if (editingPo) {
                res = await contractApi.purchaseOrders.update(contract.id, editingPo.id, payload);
            } else {
                res = await contractApi.purchaseOrders.create(contract.id, payload);
            }

            if (res?.contract) {
                await onUpdate(res.contract);
            } else {
                window.location.reload();
            }
            setIsModalOpen(false);
        } catch (err: any) {
            console.error('Failed to save PO', err);
            setErrorMsg(err?.response?.data?.message || 'Gagal menyimpan Purchase Order.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (poId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus nomor PO ini?')) return;
        try {
            const res: any = await contractApi.purchaseOrders.delete(contract.id, poId);
            if (res?.contract) {
                await onUpdate(res.contract);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to delete PO', err);
        }
    };

    return (
        <div className="bg-surface-base flex flex-1 flex-col overflow-hidden p-3 lg:p-4 gap-3">
            {/* Compact Header Bar */}
            <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={15} className="text-primary-foreground/90" />
                        <h4 className="text-xs font-semibold tracking-tight text-primary-foreground uppercase">
                            Catatan Purchase Order (PO)
                        </h4>
                        {purchaseOrders.length > 0 && (
                            <span className="rounded bg-white/20 border border-white/30 px-1.5 py-0.2 text-[9px] font-bold text-white">
                                {purchaseOrders.length} Nomor PO
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canModify && (
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="bg-white text-primary hover:bg-white/90 h-7 px-3 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Plus size={13} />
                            <span>Tambah PO</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content List */}
            <div className={cn('p-6 custom-scrollbar flex-1 overflow-y-auto flex flex-col gap-4', purchaseOrders.length === 0 && 'justify-center')}>
                {purchaseOrders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {purchaseOrders.map((po) => {
                            return (
                                <div
                                    key={po.id}
                                    className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg font-bold">
                                            <ShoppingCart size={17} />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                                                NO. PURCHASE ORDER
                                            </span>
                                            <h5 className="font-mono text-sm font-bold text-foreground truncate select-all">
                                                {po.po_number}
                                            </h5>
                                        </div>
                                    </div>

                                    {canModify && (
                                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditModal(po)}
                                                className="size-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                                                title="Edit No. PO"
                                            >
                                                <Edit3 size={13} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(po.id)}
                                                className="size-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                title="Hapus No. PO"
                                            >
                                                <Trash2 size={13} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl px-6 py-10 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                            <ShoppingCart size={24} />
                        </div>
                        <h4 className="text-foreground text-[12px] font-bold uppercase">
                            Belum Ada Nomor Purchase Order (PO)
                        </h4>
                        <p className="text-muted-foreground mt-1 max-w-[320px] text-xs leading-relaxed">
                            Catat nomor PO yang diterbitkan untuk kontrak ini.
                        </p>
                        {canModify && (
                            <Button
                                size="sm"
                                onClick={openCreateModal}
                                className="bg-primary hover:bg-primary/90 mt-4 h-8.5 rounded-xl px-4 text-xs font-bold text-primary-foreground uppercase shadow-xs cursor-pointer"
                            >
                                <Plus size={14} className="mr-1" /> Catat Nomor PO
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Form Tambah/Edit PO (Khusus Nomor PO) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="animate-in fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-xs duration-300"
                        onClick={() => !saving && setIsModalOpen(false)}
                    />

                    <div className="animate-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-200">
                        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <ShoppingCart size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
                                        {editingPo ? 'Edit Nomor Purchase Order (PO)' : 'Catat Nomor Purchase Order (PO)'}
                                    </h3>
                                    <p className="text-muted-foreground text-xs font-normal">
                                        Masukkan nomor PO yang terkait dengan kontrak ini
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={saving}
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-xl p-0 hover:bg-muted"
                            >
                                <X size={16} strokeWidth={3} />
                            </Button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
                                    {errorMsg}
                                </div>
                            )}

                            <div>
                                <FormInput
                                    autoFocus
                                    label="Nomor Purchase Order (PO)"
                                    required
                                    placeholder="Contoh: PO/2026/09/001"
                                    value={poNumber}
                                    onChange={(e) => setPoNumber(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={saving}
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-xs h-9.5 rounded-xl font-bold px-5"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9.5 rounded-xl font-bold px-6 shadow-xs cursor-pointer"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin mr-1.5" /> Menyimpan...
                                        </>
                                    ) : editingPo ? (
                                        'Simpan Perubahan'
                                    ) : (
                                        'Simpan Nomor PO'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
