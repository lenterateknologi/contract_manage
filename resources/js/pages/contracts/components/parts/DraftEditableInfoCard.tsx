import { cn } from '@/lib/utils';
import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/feedback/Badge';
import { Contract, ContractType } from '@/pages/contracts/types';
import { Building2, Check, ChevronDown, ChevronUp, ExternalLink, Info, Loader2, User, Mail, MapPin, Calendar, CheckCircle2, UserCheck, ShieldCheck, Briefcase, Landmark } from 'lucide-react';
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
                            canEditVendor={selected.allow_vendor_edit !== false}
                            canEditCategory={selected.allow_category_edit !== false}
                            canEditPrice={selected.allow_price_edit !== false}
                            canEditPeriod={selected.allow_period_edit !== false}
                            canEditTaxToggle={selected.allow_tax_toggle_edit !== false}
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
        <div className="flex flex-col gap-6 p-6">
            {/* Header / User Profile Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div className="flex items-center gap-4">
                    <UserAvatarIcon
                        user={user}
                        name={user?.name || 'Inisiator'}
                        size="lg"
                        className="h-14 w-14 ring-2 ring-primary/20 shadow-sm shrink-0 text-base"
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-foreground leading-tight truncate">
                                {user?.name || '-'}
                            </h3>
                            <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5 rounded-md">
                                Inisiator Pengaju
                            </Badge>
                        </div>
                        {user?.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Mail size={13} className="shrink-0" />
                                <span className="truncate">{user.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <div className="flex flex-col sm:items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Calendar size={11} /> Tanggal Dibuat
                        </span>
                        <span className="text-xs font-semibold text-foreground mt-0.5">
                            {selected.created_at || '—'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Organisasi Grid Cards */}
            <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-primary" />
                    <span>Informasi Unit Organisasi</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-col justify-between space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Departemen</span>
                        <span className="text-xs font-semibold text-foreground break-words">{user?.department_name || '—'}</span>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-col justify-between space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Divisi</span>
                        <span className="text-xs font-semibold text-foreground break-words">{user?.division_name || '—'}</span>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-col justify-between space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Perusahaan (PT)</span>
                        <span className="text-xs font-semibold text-foreground break-words">{user?.company_name || '—'}</span>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 flex flex-col justify-between space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Company Group</span>
                        <span className="text-xs font-semibold text-foreground break-words">{user?.company_group_name || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Alamat Pihak I */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Alamat Kantor / Pihak I
                        </span>
                        <span className="text-xs text-foreground mt-1 leading-relaxed">
                            {(user as any)?.address || selected.metadata?.meta_p1_alamat || 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status Penugasan & Approval Manager */}
            <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-primary" />
                    <span>Status Otorisasi & Penugasan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disetujui Oleh (Manager)</span>
                            {selected.assigned_by ? (
                                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                                    Disetujui
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-semibold text-muted-foreground border-border bg-muted/40">
                                    Belum Disetujui
                                </Badge>
                            )}
                        </div>
                        {selected.assigned_by ? (
                            <div className="flex items-center gap-3">
                                <UserAvatarIcon user={selected.assigned_by} size="sm" className="h-8 w-8 ring-1 ring-border shrink-0 text-xs" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground truncate">{selected.assigned_by.name}</span>
                                    {selected.assigned_by.email && (
                                        <span className="text-[10px] text-muted-foreground truncate">{selected.assigned_by.email}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Menunggu persetujuan dari atasan / manager terkait.</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Petugas Ditugaskan (PIC)</span>
                            {selected.assigned_pic ? (
                                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10">
                                    Ditugaskan
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-semibold text-muted-foreground border-border bg-muted/40">
                                    Belum Ada PIC
                                </Badge>
                            )}
                        </div>
                        {selected.assigned_pic ? (
                            <div className="flex items-center gap-3">
                                <UserAvatarIcon user={selected.assigned_pic} size="sm" className="h-8 w-8 ring-1 ring-border shrink-0 text-xs" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-foreground truncate">{selected.assigned_pic.name}</span>
                                    {selected.assigned_pic.email && (
                                        <span className="text-[10px] text-muted-foreground truncate">{selected.assigned_pic.email}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">PIC belum ditugaskan untuk dokumen ini.</p>
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
                <Card className="flex-1 overflow-y-auto custom-scrollbar border-border/80">
                    {content}
                </Card>
            </div>
        );
    }

    return (
        <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-3 bg-primary text-primary-foreground flex flex-row items-center justify-between rounded-t-lg space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-tight text-primary-foreground flex items-center gap-2">
                    <User size={15} className="text-primary-foreground/90" /> Informasi Pengaju
                </CardTitle>
                <button
                    type="button"
                    onClick={() => setMinimized(!minimized)}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 w-6 flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer"
                >
                    {minimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                </button>
            </CardHeader>

            {!minimized && (
                <CardContent className="p-0">
                    {content}
                </CardContent>
            )}
        </Card>
    );
}

export function VendorInfoCard({ selected, isTabView = false }: { selected: Contract; isTabView?: boolean }) {
    const [minimized, setMinimized] = useState(false);
    const vendor = (selected as any)?.vendor || {};
    const detail = (vendor?.vendor_detail || vendor?.detail || {}) as Record<string, any>;
    const tax = (detail.tax || {}) as Record<string, any>;
    const legality = (detail.legality || {}) as Record<string, any>;
    const bankList = (Array.isArray(detail.bank) ? detail.bank : []) as Record<string, any>[];
    const paymentMethods = (Array.isArray(detail.paymentMethod) ? detail.paymentMethod : []) as Record<string, any>[];
    const businessFields = (Array.isArray(detail.businessFields) ? detail.businessFields : []) as Record<string, any>[];

    const vendorName = vendor?.name || vendor?.vendor_name || detail?.name || selected.metadata?.meta_p2_entity || 'Nama Vendor Tidak Tersedia';
    const picName = vendor?.pic_name || detail?.pic || selected.metadata?.meta_p2_signer || '—';
    const picPosition = vendor?.pic_position || detail?.pic_position || detail?.jobTitle || selected.metadata?.meta_p2_signer_position || '—';
    const address = vendor?.address || detail?.address || selected.metadata?.meta_p2_alamat || '—';
    const vendorCode = vendor?.vendor_code || detail?.registrationNumber || '-';

    const renderDocRow = (label: string, value: any, isFile = false) => {
        let display: React.ReactNode = '-';
        const hasValue = value !== null && value !== undefined && value !== '';

        if (hasValue) {
            if (typeof value === 'boolean') {
                display = value ? 'Ya' : 'Tidak';
            } else if (Array.isArray(value)) {
                display = value.length > 0 ? value.join(', ') : '-';
            } else if (isFile || (typeof value === 'string' && (/\.(pdf|png|jpe?g|webp|gif|svg|docx?|xlsx?|pptx?|zip|rar)$/i.test(value) || value.includes('__')))) {
                const valStr = String(value).trim();
                display = (
                    <button
                        type="button"
                        onClick={() => {
                            const fileUrl = valStr.startsWith('http') || valStr.startsWith('/')
                                ? valStr
                                : `/admin/core/vendors/file-download?fileName=${encodeURIComponent(valStr)}`;
                            window.open(fileUrl, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline hover:no-underline transition-all cursor-pointer text-left"
                        title="Klik untuk membuka/preview berkas"
                    >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{valStr}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </button>
                );
            } else {
                display = String(value);
            }
        }

        return (
            <div key={label} className="py-2.5 grid grid-cols-3 gap-4 border-b border-border/60 last:border-none text-xs font-sans">
                <span className="font-semibold text-muted-foreground">{label}</span>
                <span className="col-span-2 font-normal text-foreground break-words">{display}</span>
            </div>
        );
    };

    const fullDocumentContent = (
        <div className="flex flex-col gap-8 p-6 lg:p-8">
            {/* Header Banner */}
            <div className="border-b-2 border-border pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        <Building2 className="w-4 h-4 text-primary" /> Dokumen Rekanan Master (Vendor Profile)
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                        {vendorName}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                        KODE VENDOR: <strong className="text-foreground">{vendorCode}</strong>
                    </p>
                </div>
                {vendor?.id && (
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={`/admin/core/vendors/${vendor.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all active:scale-95"
                            title="Buka Dokumen Resmi Vendor"
                        >
                            <span>Dokumen Lengkap</span>
                            <ExternalLink size={13} className="text-muted-foreground" />
                        </a>
                        <a
                            href={`/admin/core/vendors/${vendor.id}/edit?return_url=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all active:scale-95"
                            title="Buka Halaman Edit Master Vendor"
                        >
                            <span>Buka Master Vendor</span>
                            <ExternalLink size={13} className="text-muted-foreground" />
                        </a>
                    </div>
                )}
            </div>

            {/* Section 1: Profil & Identitas Rekanan */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    I. Profil & Identitas Rekanan
                </h3>
                <div>
                    {renderDocRow('Nama Resmi', detail.name || vendorName)}
                    {renderDocRow('Tipe Bentuk Usaha', detail.businessTypeName)}
                    {renderDocRow('Nama Cabang', detail.branchName)}
                    {renderDocRow('Nomor Registrasi', detail.registrationNumber)}
                    {renderDocRow('Nomor Perjanjian', detail.agreementNumber)}
                    {renderDocRow('Tanggal Perjanjian', detail.agreementDate)}
                    {renderDocRow('Tanggal Disetujui', detail.approvedDate)}
                    {renderDocRow('Total Karyawan', detail.totalEmployees)}
                    {renderDocRow('Cakupan Wilayah (Coverage Area)', detail.coverageArea)}
                    {renderDocRow('Compliance Level', detail.complianceLevel)}
                    {renderDocRow('Integrity Pact', detail.integrityPact)}
                    {renderDocRow('Master Agreement', detail.masterAgreement)}
                    {renderDocRow('Single Vendor', detail.isSingleVendor)}
                </div>
            </div>

            {/* Section 2: Alamat & Kontak Resmi */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    II. Alamat & Kontak Resmi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Alamat Utama</h4>
                        {renderDocRow('Alamat', detail.address || address)}
                        {renderDocRow('Kota', detail.city)}
                        {renderDocRow('Provinsi', detail.region)}
                        {renderDocRow('Negara', detail.country)}
                        {renderDocRow('Kode Pos', detail.postalCode)}
                    </div>
                    <div>
                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Alamat Surat Menyurat</h4>
                        {renderDocRow('Alamat Surat', detail.mailingAddress)}
                        {renderDocRow('Kota Surat', detail.mailingCity)}
                        {renderDocRow('Provinsi Surat', detail.mailingRegion)}
                        {renderDocRow('Negara Surat', detail.mailingCountry)}
                        {renderDocRow('Kode Pos Surat', detail.mailingPostalCode)}
                    </div>
                </div>
            </div>

            {/* Section 3: Informasi Kontak & PIC */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    III. Informasi Kontak & Person in Charge (PIC)
                </h3>
                <div>
                    {renderDocRow('Email Perusahaan', detail.companyEmail)}
                    {renderDocRow('No. Telepon Perusahaan', detail.companyPhone)}
                    {renderDocRow('Fax Perusahaan', detail.companyFax)}
                    {renderDocRow('Email Bagian Keuangan', detail.financeEmail)}
                    {renderDocRow('Email Bagian Perpajakan', detail.taxEmail)}
                    {renderDocRow('Nama PIC', detail.pic || picName)}
                    {renderDocRow('Email PIC', detail.picemail)}
                    {renderDocRow('No. HP / Telepon PIC', detail.picphone)}
                </div>
            </div>

            {/* Section 4: Perpajakan */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    IV. Data Perpajakan
                </h3>
                <div>
                    {renderDocRow('Status NPWP', tax.typeNpwp)}
                    {renderDocRow('Nomor NPWP', tax.npwp)}
                    {renderDocRow('Status PKP', tax.typePkp)}
                    {renderDocRow('Nomor PKP', tax.pkp)}
                    {renderDocRow('Kategori BKP', tax.typeBkp)}
                    {renderDocRow('Tarif PPN', tax.ppn ? `${tax.ppn}%` : null)}
                    {renderDocRow('Deskripsi BKP', tax.bkpDesc)}
                    {renderDocRow('Deskripsi JKP', tax.jkpDesc)}
                    {renderDocRow('Organisasi', tax.isOrganization)}
                    {renderDocRow('SIUJK', tax.isSiujk)}
                    {renderDocRow('Nomor PP23', tax.pp23number)}
                    {renderDocRow('Masa Berlaku PP23', tax.pp23expiredDate)}
                </div>
            </div>

            {/* Section 5: Bidang Usaha & Bank */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                        V. Bidang Usaha
                    </h3>
                    <div className="space-y-2 font-sans">
                        <p className="text-xs font-medium text-muted-foreground">Lokal:</p>
                        <ul className="list-disc list-inside text-xs text-foreground space-y-1">
                            {businessFields.length > 0 ? businessFields.map((bf, idx) => (
                                <li key={idx}>{bf.businessField}</li>
                            )) : <li>-</li>}
                        </ul>
                        {detail.businessFieldsForeign && (
                            <div className="pt-2 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground">Asing:</p>
                                <p className="text-xs text-foreground">{detail.businessFieldsForeign}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                        VI. Perbankan & Pembayaran
                    </h3>
                    <div className="space-y-2 font-sans">
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rekening Bank</p>
                            {bankList.length > 0 ? bankList.map((b, idx) => (
                                <div key={idx} className="text-xs border-b border-border/60 py-1 last:border-none">
                                    <p className="font-semibold text-foreground">{b.bankName}</p>
                                    <p className="text-muted-foreground">No. Rek: <span className="font-mono font-semibold text-foreground">{b.accountNumber}</span> a/n {b.accountName}</p>
                                </div>
                            )) : <p className="text-xs text-muted-foreground">-</p>}
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Metode Pembayaran</p>
                            {paymentMethods.length > 0 ? paymentMethods.map((p, idx) => (
                                <p key={idx} className="text-xs text-foreground">
                                    TOP: <strong>{p.top ?? '-'} hari</strong> | Full Payment: <strong>{p.fullPayment ?? '-'}%</strong>
                                </p>
                            )) : <p className="text-xs text-muted-foreground">-</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 6: Legalitas & Perizinan */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    VII. Perizinan Legalitas
                </h3>
                <div>
                    {renderDocRow('Nomor Induk Berusaha (NIB)', legality.nib)}
                    {renderDocRow('Tgl Kadaluarsa NIB', legality.nibexpiredDate)}
                    {renderDocRow('Izin Usaha (Business Permit)', legality.businessPermit)}
                    {renderDocRow('SIUP', legality.siup)}
                    {renderDocRow('Tgl Kadaluarsa SIUP', legality.siupexpiredDate)}
                    {renderDocRow('TDP', legality.tdp)}
                    {renderDocRow('Tgl Kadaluarsa TDP', legality.tdpexpiredDate)}
                    {renderDocRow('Penandatangan Resmi', legality.signing)}
                    {renderDocRow('Jabatan Penandatangan', legality.jobTitle)}
                    {renderDocRow('Akta Pendirian', legality.memorandumOfAssociation)}
                    {renderDocRow('Surat Keputusan Menkumham', legality.decissionLetterMenkumham)}
                </div>
            </div>

            {/* Section 7: Berkas & Lampiran Dokumen */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1">
                    VIII. Berkas & Lampiran Dokumen
                </h3>
                <div>
                    {renderDocRow('File KTP (ID Card File)', detail.idCardFile, true)}
                    {renderDocRow('File Master Agreement', detail.masterAgreementAttachment, true)}
                    {renderDocRow('File Profile Perusahaan', detail.companyProfileAttachment, true)}
                    {renderDocRow('File Single Vendor', detail.singleVendorFile, true)}
                    {renderDocRow('File Compliance', detail.complianceFile, true)}
                    {renderDocRow('Lampiran NIB', legality.nibattachment, true)}
                    {renderDocRow('Lampiran Izin Usaha', legality.businessPermitAttachment, true)}
                    {renderDocRow('Lampiran SIUP', legality.siupattachment, true)}
                    {renderDocRow('Lampiran TDP', legality.tdpattachment, true)}
                    {renderDocRow('Lampiran Akta Pendirian', legality.memorandumOfAssociationAttachment, true)}
                    {renderDocRow('Lampiran SK Menkumham', legality.decissionLetterMenkumhamAttachment, true)}
                    {renderDocRow('Lampiran Akta Perubahan', legality.memorandumOfAssociationChangingAttachment, true)}
                    {renderDocRow('Lampiran SK Menkumham Perubahan', legality.decissionLetterMenkumhamChangingAttachment, true)}
                    {renderDocRow('Lampiran Spesimen Tanda Tangan', legality.signingAttachment, true)}
                    {renderDocRow('Lampiran Pendaftaran Perusahaan', legality.companyRegistrationAttachment, true)}
                    {renderDocRow('Lampiran Surat Domisili', legality.domicileAttachment, true)}
                    {renderDocRow('Lampiran Lisensi Usaha', legality.businessLicenceFile, true)}
                    {renderDocRow('Lampiran BKPM', legality.investmentCoorBoardFile, true)}
                    {renderDocRow('Lampiran Surat Keagenan', legality.agencyLetterFile, true)}
                    {renderDocRow('Lampiran Dokumen Lainnya', legality.otherAttachment, true)}
                    {renderDocRow('Lampiran NPWP', tax.npwpfile, true)}
                    {renderDocRow('Lampiran SK PKP', tax.skpkpfile, true)}
                    {renderDocRow('Lampiran JKP', tax.jkpfile, true)}
                    {renderDocRow('Lampiran PP23', tax.pp23attachment, true)}
                </div>
            </div>
        </div>
    );

    if (isTabView) {
        return (
            <div className="flex flex-col flex-1 p-3 lg:p-4 gap-3 h-full min-h-0">
                <div className="bg-primary text-primary-foreground flex h-9.5 min-h-[38px] max-h-[38px] shrink-0 items-center justify-between px-4 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-primary-foreground">
                        <Building2 size={15} className="text-primary-foreground/90" /> Detail Profil & Dokumen Legalitas Vendor
                    </div>
                    {vendor?.id && (
                        <a
                            href={`/admin/core/vendors/${vendor.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white transition-all active:scale-95 cursor-pointer"
                            title="Buka di Halaman Baru"
                        >
                            <span>Buka di Tab Baru</span>
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>
                <Card className="flex-1 overflow-y-auto custom-scrollbar border-border/80">
                    {fullDocumentContent}
                </Card>
            </div>
        );
    }

    return (
        <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-3 bg-primary text-primary-foreground flex flex-row items-center justify-between rounded-t-lg space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-tight text-primary-foreground flex items-center gap-2">
                    <Building2 size={15} className="text-primary-foreground/90" /> Detail Profil & Legalitas Vendor
                </CardTitle>
                <div className="flex items-center gap-1.5">
                    {vendor?.id && (
                        <a
                            href={`/admin/core/vendors/${vendor.id}/document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 h-6 px-2 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all active:scale-95 cursor-pointer"
                            title="Buka di Tab Baru"
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
            </CardHeader>

            {!minimized && (
                <CardContent className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {fullDocumentContent}
                </CardContent>
            )}
        </Card>
    );
}
