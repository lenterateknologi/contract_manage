import { cn } from '@/lib/utils';
import { Avatar } from '@/pages/contracts/components/ui/ui';
import { Contract, ContractType } from '@/pages/contracts/types';
import { Building2, Check, ChevronDown, ChevronUp, ExternalLink, Info, Loader2, User } from 'lucide-react';
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
    const [contractDate, setContractDate] = useState(() => {
        if (!selected.contract_date) return '';
        return String(selected.contract_date).split('T')[0].split(' ')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        if (!selected.end_date) return '';
        return String(selected.end_date).split('T')[0].split(' ')[0];
    });
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
        setContractDate(selected.contract_date ? String(selected.contract_date).split('T')[0].split(' ')[0] : '');
        setEndDate(selected.end_date ? String(selected.end_date).split('T')[0].split(' ')[0] : '');
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
        selected.contract_date,
        selected.end_date,
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
        const origContractDate = selected.contract_date ? String(selected.contract_date).split('T')[0].split(' ')[0] : '';
        const origEndDate = selected.end_date ? String(selected.end_date).split('T')[0].split(' ')[0] : '';
        return (
            title !== selected.title ||
            description !== (selected.description || '') ||
            typeId !== origTypeId ||
            vendorId !== (selected.vendor_id || '') ||
            submissionTypeId !== (selected.submission_type_id || '') ||
            kopSubTopik !== ((selected as any).kop_sub_topik || '') ||
            contractNo !== (selected.contract_no || '') ||
            contractDate !== origContractDate ||
            endDate !== origEndDate ||
            price !== origPriceStr ||
            taxRequired !== !!selected.metadata?.tax_required
        );
    }, [title, description, typeId, vendorId, submissionTypeId, kopSubTopik, contractNo, contractDate, endDate, price, taxRequired, selected, types]);

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
                contract_date: contractDate || null,
                end_date: endDate || null,
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
        setContractDate(selected.contract_date ? String(selected.contract_date).split('T')[0].split(' ')[0] : '');
        setEndDate(selected.end_date ? String(selected.end_date).split('T')[0].split(' ')[0] : '');
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
            <div className="flex flex-col gap-3">
                <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <Info size={15} className="text-primary-foreground/90" /> Informasi Kontrak
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMinimized(!minimized)}
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                        >
                            {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        </button>
                    </div>
                </div>

                {!minimized && (
                    <div className="bg-surface-base text-text-main border border-surface-border rounded-xl shadow-xs p-4 flex flex-col gap-3">
                        <ContractInfoForm
                            isDraft={isDraft}
                            title={title}
                            setTitle={setTitle}
                            contractNo={contractNo}
                            setContractNo={setContractNo}
                            contractDate={contractDate}
                            setContractDate={setContractDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
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
                    </div>
                )}
            </div>
        </div>
    );
}

export function RequesterInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const user = selected.initiator || selected.creator;

    const content = (
        <div className="grid grid-cols-1 gap-4 p-5">
            {/* Data Pengaju / Creator Detail */}
            <div className="flex flex-col gap-3 border-b border-surface-border/60 pb-4">
                <div className="text-foreground text-[11px] font-extrabold tracking-wider uppercase">
                    Diajukan Oleh
                </div>
                <div className="flex items-start gap-3">
                    <Avatar user={user} size="md" className="mt-0.5 shrink-0" />
                    <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                        <span className="text-text-main text-sm font-bold truncate">
                            {user?.name || '-'}
                        </span>
                        {user?.email && (
                            <span className="text-text-soft text-xs font-medium truncate">
                                {user.email}
                            </span>
                        )}
                    </div>
                </div>

                {/* Hierarki Organisasi Pengaju */}
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-wrap items-baseline gap-1.5 border-b border-dashed border-slate-200/80 dark:border-slate-800/80 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">Departemen :</span>
                        <span className="text-slate-900 dark:text-slate-100 font-normal">{user?.department_name || '—'}</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 border-b border-dashed border-slate-200/80 dark:border-slate-800/80 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">Divisi :</span>
                        <span className="text-slate-900 dark:text-slate-100 font-normal">{user?.division_name || '—'}</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 border-b border-dashed border-slate-200/80 dark:border-slate-800/80 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">Perusahaan (PT) :</span>
                        <span className="text-slate-900 dark:text-slate-100 font-normal">{user?.company_name || '—'}</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 border-b border-dashed border-slate-200/80 dark:border-slate-800/80 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">Company Group :</span>
                        <span className="text-slate-900 dark:text-slate-100 font-normal">{user?.company_group_name || '—'}</span>
                    </div>
                </div>
                <div className="leading-relaxed pt-1">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider inline-block mr-1.5">Alamat Kantor / Pihak I :</span>
                    <span className="text-slate-900 dark:text-slate-100 font-normal text-xs break-words">
                        {(user as any)?.address || selected.metadata?.meta_p1_alamat || 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-1 pt-1 border-b border-surface-border/60 pb-3">
                <div className="flex items-center justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        Tgl Dibuat :
                    </div>
                    <MetaBadge name="created_at" />
                </div>
                <span className="text-slate-900 dark:text-slate-100 text-xs font-normal">{selected.created_at}</span>
            </div>

            <div className="pt-1">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1 items-start">
                        <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                            Disetujui Oleh :
                        </div>
                        {selected.assigned_by ? (
                            <div className="flex items-center gap-2">
                                <Avatar user={selected.assigned_by} size="sm" />
                                <span className="text-slate-900 dark:text-slate-100 text-xs font-normal">{selected.assigned_by.name}</span>
                            </div>
                        ) : (
                            <span className="text-slate-400 text-xs font-medium italic opacity-60">Belum disetujui manager</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 items-start">
                        <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                            Ditugaskan :
                        </div>
                        {selected.assigned_pic ? (
                            <div className="flex items-center gap-2">
                                <Avatar user={selected.assigned_pic} size="sm" />
                                <span className="text-slate-900 dark:text-slate-100 text-xs font-normal">{selected.assigned_pic.name}</span>
                            </div>
                        ) : (
                            <span className="text-slate-400 text-xs font-medium italic opacity-60">Belum ditugaskan</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isTabView) {
        return (
            <div className="flex flex-col flex-1 p-3 lg:p-4 gap-3">
                <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] shrink-0 items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <User size={15} className="text-primary-foreground/90" /> Informasi Pengaju
                    </div>
                </div>
                <div className="rounded-xl border border-surface-border bg-surface-base flex-1 overflow-y-auto custom-scrollbar">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                    <User size={15} className="text-primary-foreground/90" /> Informasi Pengaju
                </div>
                <button
                    type="button"
                    onClick={() => setMinimized(!minimized)}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                >
                    {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
            </div>

            {!minimized && (
                <div className="bg-surface-base text-text-main border border-surface-border rounded-xl shadow-xs">
                    {content}
                </div>
            )}
        </div>
    );
}

export function VendorInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const vendor = (selected as any)?.vendor;
    const vendorName = vendor?.name || vendor?.vendor_name || selected.metadata?.meta_p2_entity || '—';
    const picName = vendor?.pic_name || vendor?.detail?.pic || selected.metadata?.meta_p2_signer || '—';
    const picPosition = vendor?.pic_position || vendor?.detail?.pic_position || selected.metadata?.meta_p2_signer_position || '—';
    const address = vendor?.address || vendor?.detail?.address || selected.metadata?.meta_p2_alamat || '—';

    const content = (
        <div className="grid grid-cols-1 gap-4 p-5">
            <div className="flex flex-wrap items-baseline gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-wider uppercase shrink-0">
                    Nama Vendor / Pihak II :
                </span>
                <span className="text-slate-900 dark:text-slate-100 text-sm font-bold truncate">{vendorName}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex flex-wrap items-baseline gap-1.5 border-b border-dashed border-slate-200/80 dark:border-slate-800/80 pb-2">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">Nama PIC :</span>
                    <span className="text-slate-900 dark:text-slate-100 font-normal truncate">{picName}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-1.5 border-b border-dashed border-slate-200/80 dark:border-slate-800/80 pb-2">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">Jabatan PIC :</span>
                    <span className="text-slate-900 dark:text-slate-100 font-normal truncate">{picPosition}</span>
                </div>
            </div>
            <div className="leading-relaxed pt-1">
                <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider inline-block mr-1.5">Alamat Resmi :</span>
                <span className="text-slate-900 dark:text-slate-100 font-normal text-xs break-words">{address}</span>
            </div>

            {vendor?.id && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <a
                        href={`/admin/core/vendors/${vendor.id}/document`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                        <span>Lihat Dokumen Legalitas Vendor Lengkap</span>
                        <ExternalLink size={14} />
                    </a>
                </div>
            )}
        </div>
    );

    if (isTabView) {
        return (
            <div className="flex flex-col flex-1 p-3 lg:p-4 gap-3">
                <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] shrink-0 items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <Building2 size={15} className="text-primary-foreground/90" /> Detail Pihak Kedua / Vendor
                    </div>
                    {vendor?.id && (
                        <a
                            href={`/admin/core/vendors/${vendor.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white transition-all active:scale-95 cursor-pointer"
                            title="Buka Dokumen Resmi Vendor"
                        >
                            <span>Detail Dokumen</span>
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>
                <div className="rounded-xl border border-surface-border bg-surface-base flex-1 overflow-y-auto custom-scrollbar">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                    <Building2 size={15} className="text-primary-foreground/90" /> Detail Pihak Kedua / Vendor
                </div>
                <div className="flex items-center gap-1.5">
                    {vendor?.id && (
                        <a
                            href={`/admin/core/vendors/${vendor.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 px-2 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all active:scale-95 cursor-pointer"
                            title="Buka Dokumen Resmi Vendor"
                        >
                            <span>Dokumen</span>
                            <ExternalLink size={11} />
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => setMinimized(!minimized)}
                        className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                    >
                        {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                    </button>
                </div>
            </div>

            {!minimized && (
                <div className="bg-surface-base text-text-main border border-surface-border rounded-xl shadow-xs">
                    {content}
                </div>
            )}
        </div>
    );
}
