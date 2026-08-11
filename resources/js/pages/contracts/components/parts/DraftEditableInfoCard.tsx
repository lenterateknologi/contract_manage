import { Avatar } from '@/pages/contracts/components/ui/ui';
import { Contract, ContractType } from '@/pages/contracts/types';
import { Check, ChevronDown, ChevronUp, Info, Loader2, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContractInfoForm, MetaBadge } from './ContractInfoForm';
import { TaxToggle } from './TaxToggle';

export interface FormTemplateInfo {
    id: string;
    name: string;
    description: string;
    document_type?: string;
    contract_type_id: string | null;
    contract_type_name: string | null;
    fields_count: number;
}

interface DraftEditableInfoCardProps {
    selected: Contract;
    types: ContractType[];
    submissionTypes: any[];
    vendors: any[];
    formTemplates: FormTemplateInfo[];
    canUpdate: boolean;
    onUpdate: (data: any) => Promise<any> | void;
    processing: boolean;
    setPreviewTitle: (v: string) => void;
    setPreviewUrl: (v: string) => void;
    setPreviewHasFile: (v: boolean) => void;
    setPreviewOpen: (v: boolean) => void;
    meId?: string;
    onStateChange?: (hasChanges: boolean, saving: boolean) => void;
    saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
    resetRef?: React.MutableRefObject<(() => void) | null>;
}

export function DraftEditableInfoCard({
    selected,
    types,
    submissionTypes = [],
    vendors = [],
    formTemplates,
    canUpdate,
    onUpdate,
    processing,
    setPreviewTitle,
    setPreviewUrl,
    setPreviewHasFile,
    setPreviewOpen,
    meId,
    onStateChange,
    saveRef,
    resetRef,
}: DraftEditableInfoCardProps) {
    const isDraft = selected.allow_info_edit !== false && (selected.can_approve || selected.created_by === meId);
    const [title, setTitle] = useState(selected.title);
    const [description, setDescription] = useState(selected.description || '');
    const [typeId, setTypeId] = useState(() => {
        if (selected.contract_type_id) return String(selected.contract_type_id);
        const t = types.find((x) => x.name === selected.contract_type);
        return t ? String(t.id) : '';
    });
    const [vendorId, setVendorId] = useState(selected.vendor_id || '');
    const [submissionTypeId, setSubmissionTypeId] = useState(selected.submission_type_id || '');
    const [kopSubTopik, setKopSubTopik] = useState((selected as any).kop_sub_topik || '');
    const [contractNo, setContractNo] = useState(selected.contract_no || '');
    const [price, setPrice] = useState(() => {
        const p = selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price;
        return p !== undefined && p !== null ? String(p) : '';
    });
    const [minimized, setMinimized] = useState(false);
    const [taxRequired, setTaxRequired] = useState<boolean>(() => !!selected.metadata?.tax_required);

    useEffect(() => {
        setTaxRequired(!!selected.metadata?.tax_required);
    }, [selected.metadata?.tax_required]);

    useEffect(() => {
        setTitle(selected.title);
        setDescription(selected.description || '');
        const typeVal = selected.contract_type_id
            ? String(selected.contract_type_id)
            : types.find((x) => x.name === selected.contract_type)?.id
                ? String(types.find((x) => x.name === selected.contract_type)?.id)
                : '';
        setTypeId(typeVal);
        setVendorId(selected.vendor_id || '');
        setSubmissionTypeId(selected.submission_type_id || '');
        setKopSubTopik((selected as any).kop_sub_topik || '');
        setContractNo(selected.contract_no || '');
        const p = selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price;
        setPrice(p !== undefined && p !== null ? String(p) : '');
        setTaxRequired(!!selected.metadata?.tax_required);
    }, [
        selected.id,
        selected.title,
        selected.description,
        selected.contract_type,
        selected.contract_type_id,
        selected.vendor_id,
        selected.submission_type_id,
        selected.transaction_type,
        (selected as any).kop_sub_topik,
        selected.metadata,
        types,
    ]);

    const [saving, setSaving] = useState(false);

    const hasChanges = useMemo(() => {
        const origTypeId = selected.contract_type_id
            ? String(selected.contract_type_id)
            : types.find((x) => x.name === selected.contract_type)?.id
                ? String(types.find((x) => x.name === selected.contract_type)?.id)
                : '';
        const origPrice = selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price;
        const origPriceStr = origPrice !== undefined && origPrice !== null ? String(origPrice) : '';
        return (
            title !== selected.title ||
            description !== (selected.description || '') ||
            typeId !== origTypeId ||
            vendorId !== (selected.vendor_id || '') ||
            submissionTypeId !== (selected.submission_type_id || '') ||
            kopSubTopik !== ((selected as any).kop_sub_topik || '') ||
            contractNo !== (selected.contract_no || '') ||
            price !== origPriceStr ||
            taxRequired !== !!selected.metadata?.tax_required
        );
    }, [title, description, typeId, vendorId, submissionTypeId, kopSubTopik, contractNo, price, taxRequired, selected, types]);

    const handleManualSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            const cleanPrice = price ? parseFloat(price.replace(/[^\d.]/g, '')) : null;
            await onUpdate({
                title,
                description,
                contract_type_id: typeId || null,
                vendor_id: vendorId || null,
                submission_type_id: submissionTypeId || null,
                kop_sub_topik: kopSubTopik,
                contract_no: contractNo || null,
                metadata: {
                    ...selected.metadata,
                    tax_required: taxRequired,
                    meta_harga: cleanPrice ?? selected.metadata?.meta_harga,
                    f2_price: cleanPrice !== null ? String(cleanPrice) : selected.metadata?.f2_price,
                },
            });
        } finally {
            setSaving(false);
        }
    };

    const handleResetChanges = () => {
        setTitle(selected.title);
        setDescription(selected.description || '');
        const typeVal = selected.contract_type_id
            ? String(selected.contract_type_id)
            : types.find((x) => x.name === selected.contract_type)?.id
                ? String(types.find((x) => x.name === selected.contract_type)?.id)
                : '';
        setTypeId(typeVal);
        setVendorId(selected.vendor_id || '');
        setSubmissionTypeId(selected.submission_type_id || '');
        setKopSubTopik((selected as any).kop_sub_topik || '');
        setContractNo(selected.contract_no || '');
        const p = selected.metadata?.meta_harga ?? selected.metadata?.f2_price ?? selected.meta?.f2_price;
        setTaxRequired(!!selected.metadata?.tax_required);
    };

    useEffect(() => {
        if (saveRef) saveRef.current = handleManualSave;
        if (resetRef) resetRef.current = handleResetChanges;
    });

    useEffect(() => {
        onStateChange?.(hasChanges, saving);
    }, [hasChanges, saving, onStateChange]);

    const inputCls =
        'w-full bg-surface-base border-surface-border rounded-lg px-3 py-2 text-sm font-medium text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs placeholder:text-text-soft/30';

    const f2Version = selected.versions?.filter((x) => x.document_type === 'f2').sort((a, b) => b.version_no - a.version_no)[0];

    const filterTypeId = isDraft ? typeId : selected.contract_type_id ? String(selected.contract_type_id) : '';
    const tpl = formTemplates.find(
        (ft) => ft.document_type === 'f1' && (ft.contract_type_id === filterTypeId || ft.contract_type_name === selected.contract_type),
    );

    return (
        <div className="flex flex-col gap-4 relative">

            {/* Card 1: Informasi Kontrak */}
            <div className="bg-surface-base text-text-main border-surface-border rounded-xl border shadow-xs">
                <div className="bg-primary rounded-t-xl flex h-11 items-center justify-between border-b border-primary/80 px-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-primary-foreground">
                        <Info size={16} className="text-primary-foreground/80" /> Informasi Kontrak
                    </div>
                    <div className="flex items-center gap-2">
                        {isDraft && hasChanges && (
                            <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                                <button
                                    type="button"
                                    onClick={handleResetChanges}
                                    disabled={saving}
                                    className="px-2.5 py-1 text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground rounded-lg hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleManualSave}
                                    disabled={saving || !title.trim()}
                                    className="px-3 py-1 text-xs font-semibold text-primary bg-white hover:bg-white/90 active:scale-95 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin text-primary" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={12} className="text-primary" />
                                            <span>Simpan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        <button onClick={() => setMinimized(!minimized)} className="text-primary-foreground transition-all hover:opacity-80 active:scale-95 cursor-pointer p-0.5 ml-1">
                            {minimized ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                        </button>
                    </div>
                </div>

                {!minimized && (
                    <div className="p-3.5 flex flex-col gap-3">
                        <ContractInfoForm
                            isDraft={isDraft}
                            title={title}
                            setTitle={setTitle}
                            contractNo={contractNo}
                            setContractNo={setContractNo}
                            price={price}
                            setPrice={setPrice}
                            typeId={typeId}
                            setTypeId={setTypeId}
                            submissionTypeId={submissionTypeId}
                            setSubmissionTypeId={setSubmissionTypeId}
                            vendorId={vendorId}
                            setVendorId={setVendorId}
                            types={types}
                            submissionTypes={submissionTypes}
                            vendors={vendors}
                            selected={selected}
                            inputCls={inputCls}
                            taxRequired={taxRequired}
                            onTaxRequiredChange={(newVal) => {
                                setTaxRequired(newVal);
                            }}
                        />

                        {isDraft && hasChanges && (
                            <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                    Ada perubahan belum disimpan
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleResetChanges}
                                        disabled={saving}
                                        className="px-3 py-1.5 text-xs font-medium text-text-soft hover:text-text-main rounded-lg hover:bg-surface-muted transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleManualSave}
                                        disabled={saving || !title.trim()}
                                        className="px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 active:scale-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 size={13} className="animate-spin" />
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={13} />
                                                <span>Simpan Perubahan</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Card 2: Informasi Pengaju */}
            <RequesterInfoCard selected={selected} />
        </div>
    );
}

export function RequesterInfoCard({ selected }: { selected: Contract }) {
    const [minimized, setMinimized] = useState(false);
    const user = selected.initiator || selected.creator;

    return (
        <div className="bg-surface-base text-text-main border-surface-border rounded-xl border shadow-xs">
            <div className="bg-primary rounded-t-xl flex h-11 items-center justify-between border-b border-primary/80 px-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-primary-foreground">
                    <User size={16} className="text-primary-foreground/80" /> Informasi Pengaju
                </div>
                <button
                    onClick={() => setMinimized(!minimized)}
                    className="text-primary-foreground transition-all hover:opacity-80 active:scale-95 cursor-pointer p-0.5"
                >
                    {minimized ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                </button>
            </div>

            {!minimized && (
                <div className="grid grid-cols-1 gap-3.5 p-3.5">
                    {/* Data Pengaju / Creator Detail */}
                    <div className="flex flex-col gap-2 border-b border-surface-border/60 pb-3">
                        <div className="text-foreground text-[10.5px] font-extrabold tracking-wider uppercase">
                            Diajukan Oleh
                        </div>
                        <div className="flex items-start gap-2.5">
                            <Avatar user={user} size="sm" className="mt-0.5 shrink-0" />
                            <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                                <span className="text-text-main text-xs font-bold truncate">
                                    {user?.name || '-'}
                                </span>
                                {user?.email && (
                                    <span className="text-text-soft text-[11px] font-medium truncate">
                                        {user.email}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Hierarki Organisasi Pengaju */}
                        <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-surface-muted/40 p-2.5 border border-surface-border/50 text-[11px]">
                            <div className="flex items-center justify-between gap-2 border-b border-surface-border/40 pb-1.5">
                                <span className="text-foreground font-semibold uppercase text-[9.5px]">Departemen</span>
                                <span className="text-text-main font-bold truncate">{user?.department_name || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-b border-surface-border/40 pb-1.5">
                                <span className="text-foreground font-semibold uppercase text-[9.5px]">Divisi</span>
                                <span className="text-text-main font-bold truncate">{user?.division_name || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-b border-surface-border/40 pb-1.5">
                                <span className="text-foreground font-semibold uppercase text-[9.5px]">Perusahaan (PT)</span>
                                <span className="text-text-main font-bold truncate">{user?.company_name || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-foreground font-semibold uppercase text-[9.5px]">Company Group</span>
                                <span className="text-text-main font-bold truncate">{user?.company_group_name || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <div className="text-foreground text-[10.5px] font-extrabold tracking-wider uppercase">
                                Tgl Dibuat
                            </div>
                            <MetaBadge name="created_at" />
                        </div>
                        <span className="text-text-main text-xs font-bold">{selected.created_at}</span>
                    </div>

                    <div className="border-surface-border mt-1 border-t pt-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1">
                                <div className="text-foreground text-[10.5px] font-extrabold tracking-wider uppercase">
                                    Disetujui Oleh
                                </div>
                                {selected.assigned_by ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar user={selected.assigned_by} size="sm" />
                                        <span className="text-text-main text-xs font-bold">{selected.assigned_by.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-text-soft text-[11px] font-medium italic opacity-60">Belum disetujui manager</span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="text-foreground text-[10.5px] font-extrabold tracking-wider uppercase">
                                    Ditugaskan
                                </div>
                                {selected.assigned_pic ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar user={selected.assigned_pic} size="sm" />
                                        <span className="text-text-main text-xs font-bold">{selected.assigned_pic.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-text-soft text-[11px] font-medium italic opacity-60">Belum ditugaskan</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
