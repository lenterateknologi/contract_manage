import { Avatar } from '@/components/contracts/ui/ui';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/types/contracts';
import { Check, ChevronDown, ChevronUp, Info, Loader2, ChevronRight, LayoutTemplate, FileText, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TaxToggle } from './TaxToggle';
import { ContractInfoForm } from './ContractInfoForm';

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
    const [crownNo, setCrownNo] = useState((selected as any).crown_no || '');
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
            : (types.find((x) => x.name === selected.contract_type)?.id ? String(types.find((x) => x.name === selected.contract_type)?.id) : '');
        setTypeId(typeVal);
        setVendorId(selected.vendor_id || '');
        setSubmissionTypeId(selected.submission_type_id || '');
        setKopSubTopik((selected as any).kop_sub_topik || '');
        setCrownNo((selected as any).crown_no || '');
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
        types,
    ]);

    const autoSaveTimerRef = useRef<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    const hasChanges = useMemo(() => {
        const origTypeId = selected.contract_type_id
            ? String(selected.contract_type_id)
            : (types.find((x) => x.name === selected.contract_type)?.id ? String(types.find((x) => x.name === selected.contract_type)?.id) : '');
        return (
            title !== selected.title ||
            description !== (selected.description || '') ||
            typeId !== origTypeId ||
            vendorId !== (selected.vendor_id || '') ||
            submissionTypeId !== (selected.submission_type_id || '') ||
            kopSubTopik !== ((selected as any).kop_sub_topik || '') ||
            crownNo !== ((selected as any).crown_no || '') ||
            taxRequired !== !!selected.metadata?.tax_required
        );
    }, [title, description, typeId, vendorId, submissionTypeId, kopSubTopik, taxRequired, selected, types]);

    // Debounced Auto-Save for Contract Metadata
    useEffect(() => {
        if (!isDraft) return;

        if (hasChanges && title.trim()) {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(async () => {
                setLocalSaving(true);
                try {
                    await onUpdate({
                        title,
                        description,
                        contract_type_id: typeId || null,
                        vendor_id: vendorId || null,
                        submission_type_id: submissionTypeId || null,
                        kop_sub_topik: kopSubTopik,
                        crown_no: crownNo || null,
                        metadata: {
                            ...selected.metadata,
                            tax_required: taxRequired,
                        },
                    });
                } finally {
                    setLocalSaving(false);
                }
            }, 1000); // 1 second debounce for snappier real-time feel
        }

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [title, description, typeId, vendorId, submissionTypeId, kopSubTopik, crownNo, taxRequired, isDraft, onUpdate]);

    const inputCls =
        'w-full bg-surface-base border-surface-border rounded-lg px-3 py-2 text-sm font-medium text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs placeholder:text-text-soft/30';

    const f2Version = selected.versions?.filter((x) => x.document_type === 'f2').sort((a, b) => b.version_no - a.version_no)[0];

    const filterTypeId = isDraft ? typeId : selected.contract_type_id ? String(selected.contract_type_id) : '';
    const tpl = formTemplates.find(
        (ft) => ft.document_type === 'f1' && (ft.contract_type_id === filterTypeId || ft.contract_type_name === selected.contract_type),
    );

    return (
        <div className="bg-surface-base text-text-main border-surface-border overflow-hidden rounded-xl border shadow-sm">

            <div className="bg-primary flex h-12 items-center justify-between border-b px-4">

                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Info size={16} className="text-white/70" /> Informasi Kontrak
                    {isDraft && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                            Dapat Diedit
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isDraft && (
                        <div className="flex items-center gap-2 px-2">
                            {localSaving ? (
                                <>
                                    <Loader2 size={12} className="animate-spin text-white/70" />
                                    <span className="text-xs text-white/70">Menyimpan...</span>
                                </>
                            ) : hasChanges ? (
                                <>
                                    <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full ring-2 ring-white/50" />
                                    <span className="text-xs text-white/70">Berubah</span>
                                </>
                            ) : (
                                <>
                                    <Check size={12} className="text-emerald-300" />
                                    <span className="text-xs text-white/70">Tersimpan</span>
                                </>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setMinimized(!minimized)}
                        className="text-white/70 transition-all hover:text-white active:scale-95"
                    >
                        {minimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>

            {!minimized && (
                <div className="grid grid-cols-1 gap-5 p-5">
                    {isDraft && (
                        <div className="border-surface-border col-span-full mt-2 border-t pt-4">
                            <TaxToggle 
                                taxRequired={taxRequired} 
                                setTaxRequired={(newVal) => {
                                    setTaxRequired(newVal);
                                    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
                                    setLocalSaving(true);
                                    Promise.resolve(
                                        onUpdate({
                                            metadata: {
                                                ...selected.metadata,
                                                tax_required: newVal,
                                            },
                                        })
                                    ).finally(() => setLocalSaving(false));
                                }} 
                            />
                        </div>
                    )}
                    <ContractInfoForm 
                        isDraft={isDraft}
                        title={title}
                        setTitle={setTitle}
                        crownNo={crownNo}
                        setCrownNo={setCrownNo}
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
                    />

                    <div className="flex flex-col gap-1">
                        <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Dibuat Oleh</div>
                        <div className="flex items-center gap-2">
                            <Avatar user={selected.creator} size="sm" />
                            <span className="text-text-main text-sm font-semibold">{selected.creator?.name}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Tgl Dibuat</div>
                        <span className="text-text-main text-sm font-semibold">{selected.created_at}</span>
                    </div>

                    <div className="border-surface-border mt-2 border-t pt-5">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Disetujui Oleh</div>
                                {selected.assigned_by ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar user={selected.assigned_by} size="sm" />
                                        <span className="text-text-main text-sm font-bold">{selected.assigned_by.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-text-soft text-xs italic opacity-50">Belum disetujui manager</span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="text-text-desc text-[10px] font-bold tracking-widest uppercase">Ditugaskan</div>
                                {selected.assigned_pic ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar user={selected.assigned_pic} size="sm" />
                                        <span className="text-text-main text-sm font-bold">{selected.assigned_pic.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-text-soft text-xs italic opacity-50">Belum ditugaskan</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {selected.workflow_step && (
                        <div className="border-surface-border col-span-full border-t pt-4">
                            <div className="text-text-desc mb-2 text-xs font-semibold">Hasil Analisis Workflow</div>
                            <div className="animate-in fade-in border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2 rounded-xl border p-3 shadow-sm">
                                <div className="bg-emerald-500/10 text-emerald-600 flex h-8 w-8 items-center justify-center rounded-lg">
                                    <Check size={16} strokeWidth={3} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-emerald-700 text-xs font-bold">
                                        Langkah Aktif: {selected.workflow_step.description}
                                    </span>
                                    <span className="text-emerald-600/70 text-[10px] font-semibold uppercase tracking-wider">
                                        PIC/Role: {selected.workflow_step.role}
                                    </span>
                                    {selected.workflow_step.target_approvers && (
                                        <div className="mt-1 flex items-center gap-1.5 rounded-md bg-white/50 px-2 py-0.5 dark:bg-black/20">
                                            <span className="text-emerald-600 text-[9px] font-black tracking-tighter uppercase">Target:</span>
                                            <span className="text-emerald-700 truncate text-[9px] font-bold">
                                                {selected.workflow_step.target_approvers}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            )}
        </div>
    );
}
