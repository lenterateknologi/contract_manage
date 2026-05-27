import { Avatar } from '@/components/contracts/ui';
import { cn } from '@/lib/utils';
import { Contract, ContractType } from '@/types/contracts';
import { Check, ChevronDown, ChevronUp, Info, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    onUpdate: (data: any) => void;
    processing: boolean;
    setPreviewTitle: (v: string) => void;
    setPreviewUrl: (v: string) => void;
    setPreviewHasFile: (v: boolean) => void;
    setPreviewOpen: (v: boolean) => void;
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
}: DraftEditableInfoCardProps) {
    const isDraft = selected.allow_info_edit && canUpdate;
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
                        contract_type_id: typeId || undefined,
                        vendor_id: vendorId || undefined,
                        submission_type_id: submissionTypeId || undefined,
                        kop_sub_topik: kopSubTopik,
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
    }, [title, description, typeId, vendorId, submissionTypeId, kopSubTopik, taxRequired, isDraft, onUpdate]);

    const inputCls =
        'w-full bg-surface-muted border-surface-border rounded-lg px-3 py-1.5 text-sm text-text-main outline-none focus:bg-surface-base transition-all shadow-sm';

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
                <div className="grid grid-cols-1 gap-4 p-4">
                    <div>
                        <div className="text-text-desc mb-1 text-xs font-semibold">No. Pengajuan</div>
                        <span className="bg-surface-muted text-text-main inline-block rounded px-3 py-1.5 font-mono text-sm font-medium shadow-sm">
                            {selected.contract_no}
                        </span>
                    </div>

                    <div>
                        <div className="text-text-desc mb-1 text-xs font-semibold">No. Kontrak (F2)</div>
                        <div className="bg-primary/5 border-primary/10 text-primary flex h-9 items-center rounded-lg border px-3 text-sm font-semibold">
                            {(selected as any).crown_no || 'Belum diisi di F2'}
                        </div>
                    </div>

                    {isDraft ? (
                        <>
                            <div className="col-span-full">
                                <div className="text-text-desc mb-1 text-xs font-semibold">Judul Kontrak</div>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Nama kontrak..."
                                    className={inputCls + ' text-sm font-medium'}
                                />
                            </div>
                        </>
                    ) : null}

                    <div>
                        <div className="text-text-desc mb-1 text-xs font-semibold">Jenis Kontrak</div>
                        {isDraft ? (
                            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Tipe</option>
                                {Array.isArray(types) &&
                                    types.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                                {selected.contract_type}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-text-desc mb-1 text-xs font-semibold">Perjanjian</div>
                        {isDraft ? (
                            <select value={submissionTypeId} onChange={(e) => setSubmissionTypeId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Tipe</option>
                                {Array.isArray(submissionTypes) &&
                                    submissionTypes.map((st) => (
                                        <option key={st.id} value={st.id}>
                                            {st.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <span className="text-text-main text-sm font-medium">{selected.submission_type || '—'}</span>
                        )}
                    </div>

                    <div>
                        <div className="text-text-desc mb-1 text-xs font-semibold">Pihak Kedua (Vendor)</div>
                        {isDraft ? (
                            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Vendor</option>
                                {Array.isArray(vendors) &&
                                    vendors.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <span className="bg-surface-muted text-text-main rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                                {(selected as any).vendor?.name || '-'}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-text-desc mb-1 text-xs font-semibold">Dibuat Oleh</div>
                        <div className="flex items-center gap-1.5">
                            <Avatar user={selected.creator} size="sm" />
                            <span className="text-text-main text-sm font-medium">{selected.creator?.name}</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-text-desc mb-1 text-xs font-semibold">Tgl Dibuat</div>
                        <span className="text-text-main text-sm font-medium">{selected.created_at}</span>
                    </div>

                    <div className="border-surface-border col-span-full mt-2 border-t pt-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <div className="text-text-desc mb-1.5 text-xs font-semibold">Disetujui Oleh</div>
                                {selected.assigned_by ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar user={selected.assigned_by} size="sm" className="ring-surface-muted ring-1" />
                                        <span className="text-text-main text-sm font-semibold">{selected.assigned_by.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-text-soft text-xs italic">Belum disetujui manager</span>
                                )}
                            </div>

                            <div>
                                <div className="text-text-desc mb-1.5 text-xs font-semibold">Ditugaskan</div>
                                {selected.assigned_pic ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar user={selected.assigned_pic} size="sm" className="ring-surface-muted ring-1" />
                                        <span className="text-text-main text-sm font-semibold">{selected.assigned_pic.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-text-soft text-xs italic">Belum ditugaskan</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {selected.workflow_step && (
                        <div className="border-surface-border col-span-full border-t pt-4">
                            <div className="text-text-desc mb-2 text-xs font-semibold">Posisi Kontrak Saat Ini (Workflow)</div>
                            <div className="animate-in fade-in border-primary/20 bg-primary/5 flex items-center gap-2 rounded-xl border p-3 shadow-sm">
                                <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                                    <Info size={16} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-primary text-xs font-medium">
                                        Sedang Di: {selected.workflow_step.description}
                                    </span>
                                    <span className="text-primary/70 text-xs font-semibold">
                                        Peran: {selected.workflow_step.role}
                                    </span>
                                    {selected.workflow_step.target_approvers && (
                                        <span className="text-primary/60 mt-1 text-[10px] font-semibold tracking-tight uppercase">
                                            Target Penyetuju: {selected.workflow_step.target_approvers}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {isDraft && (
                        <div className="border-surface-border col-span-full mt-2 border-t pt-4">
                            <div
                                className={cn(
                                    'mb-4 rounded-xl border p-3 transition-all duration-300',
                                    taxRequired
                                        ? 'bg-primary/5 border-primary/20'
                                        : 'border-surface-border/50 bg-surface-muted/30',
                                )}
                            >
                                <label className="flex cursor-pointer items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                                                taxRequired
                                                    ? 'bg-primary shadow-primary/20 text-white shadow-lg'
                                                    : 'bg-surface-muted text-text-soft/20',
                                            )}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M4 10h12" />
                                                <path d="M4 14h9" />
                                                <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
                                                <path d="M16 16l4-4-4-4" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span
                                                className={cn(
                                                    'text-[11px] font-semibold tracking-wider uppercase',
                                                    taxRequired ? 'text-primary' : 'text-text-soft/40',
                                                )}
                                            >
                                                Ada Pajak
                                            </span>
                                            <span className="text-text-soft/30 text-[9px] font-medium">
                                                Aktifkan jika kontrak dikenakan pajak (PPN/PPh)
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setTaxRequired(!taxRequired)}
                                        className={cn(
                                            'relative h-5 w-9 rounded-full transition-all duration-300',
                                            taxRequired ? 'bg-primary shadow-inner shadow-black/10' : 'bg-surface-muted border-surface-border border',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-300',
                                                taxRequired ? 'left-5' : 'left-1',
                                            )}
                                        />
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={taxRequired}
                                        onChange={() => {}} // Controlled by div click for better feel
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
