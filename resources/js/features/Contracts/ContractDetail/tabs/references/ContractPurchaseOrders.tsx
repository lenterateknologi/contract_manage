import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { cn } from '@/lib/utils';
import { Contract, ContractPurchaseOrder } from '@/features/Contracts/types';
import { contractApi } from '@/features/Contracts/utils';
import { Edit3, Loader2, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

interface ContractPurchaseOrdersProps {
    contract: Contract;
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<void>;
    processing: boolean;
    meId?: string;
    vendors?: any[];
}

export default function ContractPurchaseOrders({ contract, canUpdate, onUpdate, processing, meId }: ContractPurchaseOrdersProps) {
    // ponytail: workflow configuration is the strict source of truth for PO references
    const allowReference = contract.allow?.reference ?? (contract as any).allow_reference ?? (contract.workflow_step as any)?.meta?.allow_reference;
    const isActor =
        (contract as any).can_approve ||
        (contract as any).is_current_actor ||
        contract.created_by === meId ||
        (contract as any).initiated_by_id === meId;
    const canModify = allowReference === true && (isActor || canUpdate);

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
        <div className="bg-surface-base flex flex-1 flex-col gap-3 overflow-hidden p-3 lg:p-4">
            {/* Compact Header Bar */}
            <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={15} className="text-primary-foreground/90" />
                        <h4 className="text-primary-foreground text-xs font-semibold tracking-tight uppercase">Catatan Purchase Order (PO)</h4>
                        {purchaseOrders.length > 0 && (
                            <span className="py-0.2 rounded border border-white/30 bg-white/20 px-1.5 text-[9px] font-bold text-white">
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
                            className="text-primary flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold shadow-xs transition-all hover:bg-white/90"
                        >
                            <Plus size={13} />
                            <span>Tambah PO</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content List */}
            <div className={cn('custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto p-6', purchaseOrders.length === 0 && 'justify-center')}>
                {purchaseOrders.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {purchaseOrders.map((po) => {
                            return (
                                <div
                                    key={po.id}
                                    className="group border-border/80 bg-card hover:border-primary/40 relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border p-4 shadow-2xs transition-all hover:shadow-xs"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg font-bold">
                                            <ShoppingCart size={17} />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-muted-foreground block font-mono text-[9.5px] font-bold tracking-wider uppercase">
                                                NO. PURCHASE ORDER
                                            </span>
                                            <h5 className="text-foreground truncate font-mono text-sm font-bold select-all">{po.po_number}</h5>
                                        </div>
                                    </div>

                                    {canModify && (
                                        <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditModal(po)}
                                                className="text-muted-foreground hover:text-foreground hover:bg-muted size-7 rounded-lg p-0"
                                                title="Edit No. PO"
                                            >
                                                <Edit3 size={13} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(po.id)}
                                                className="text-muted-foreground size-7 rounded-lg p-0 hover:bg-rose-50 hover:text-rose-600"
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
                        <div className="bg-muted text-muted-foreground mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
                            <ShoppingCart size={24} />
                        </div>
                        <h4 className="text-foreground text-[12px] font-bold uppercase">Belum Ada Nomor Purchase Order (PO)</h4>
                        <p className="text-muted-foreground mt-1 max-w-[320px] text-xs leading-relaxed">
                            Catat nomor PO yang diterbitkan untuk kontrak ini.
                        </p>
                        {canModify && (
                            <Button
                                size="sm"
                                onClick={openCreateModal}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground mt-4 h-8.5 cursor-pointer rounded-xl px-4 text-xs font-bold uppercase shadow-xs"
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

                    <div className="animate-in zoom-in-95 border-border bg-card relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl duration-200">
                        <div className="border-border bg-card flex items-center justify-between border-b px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary rounded-xl p-2">
                                    <ShoppingCart size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
                                        {editingPo ? 'Edit Nomor Purchase Order (PO)' : 'Catat Nomor Purchase Order (PO)'}
                                    </h3>
                                    <p className="text-muted-foreground text-xs font-normal">Masukkan nomor PO yang terkait dengan kontrak ini</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={saving}
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 rounded-xl p-0"
                            >
                                <X size={16} strokeWidth={3} />
                            </Button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4 p-6">
                            {errorMsg && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-600">
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

                            <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={saving}
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-9.5 rounded-xl px-5 text-xs font-bold"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-9.5 cursor-pointer rounded-xl px-6 text-xs font-bold shadow-xs"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={14} className="mr-1.5 animate-spin" /> Menyimpan...
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
