import { Avatar } from '@/components/contracts/ui';
import { Contract, ContractType } from '@/types/contracts';
import { Info, Loader2, Check, ChevronUp, ChevronDown, FileText as FileIcon } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { ContractReferenceCard } from './ContractReferenceCard';

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
        const t = types.find((x) => x.name === selected.contract_type);
        return t ? String(t.id) : '';
    });
    const [vendorId, setVendorId] = useState(selected.vendor_id || '');
    const [submissionTypeId, setSubmissionTypeId] = useState(selected.submission_type_id || '');
    const [transactionType, setTransactionType] = useState(selected.transaction_type || 'Perjanjian Baru');
    const [kopSubTopik, setKopSubTopik] = useState((selected as any).kop_sub_topik || '');
    const [crownNo, setCrownNo] = useState(selected.crown_no || '');
    const [minimized, setMinimized] = useState(false);

    useEffect(() => {
        setTitle(selected.title);
        setDescription(selected.description || '');
        const t = types.find((x) => x.name === selected.contract_type);
        setTypeId(t ? String(t.id) : '');
        setVendorId(selected.vendor_id || '');
        setSubmissionTypeId(selected.submission_type_id || '');
        setTransactionType(selected.transaction_type || 'Perjanjian Baru');
        setKopSubTopik((selected as any).kop_sub_topik || '');
        setCrownNo(selected.crown_no || '');
    }, [
        selected.id,
        selected.title,
        selected.description,
        selected.contract_type,
        selected.vendor_id,
        selected.submission_type_id,
        selected.transaction_type,
        selected.crown_no,
        (selected as any).kop_sub_topik,
        types,
    ]);

    const autoSaveTimerRef = useRef<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    const hasChanges = useMemo(() => {
        const origType = types.find((x) => x.name === selected.contract_type);
        const origTypeId = origType ? String(origType.id) : '';
        return (
            title !== selected.title ||
            description !== (selected.description || '') ||
            typeId !== origTypeId ||
            vendorId !== (selected.vendor_id || '') ||
            submissionTypeId !== (selected.submission_type_id || '') ||
            transactionType !== (selected.transaction_type || 'Perjanjian Baru') ||
            crownNo !== (selected.crown_no || '') ||
            kopSubTopik !== ((selected as any).kop_sub_topik || '')
        );
    }, [title, description, typeId, vendorId, submissionTypeId, transactionType, crownNo, kopSubTopik, selected, types]);

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
                        transaction_type: transactionType,
                        kop_sub_topik: kopSubTopik,
                        crown_no: crownNo,
                    });
                } finally {
                    setLocalSaving(false);
                }
            }, 3000); // 3 second debounce
        }

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [
        title,
        description,
        typeId,
        vendorId,
        submissionTypeId,
        transactionType,
        kopSubTopik,
        crownNo,
        isDraft,
        onUpdate,
    ]);

    const inputCls =
        'w-full bg-black/[0.03] dark:bg-white/[0.03] rounded-lg px-3 py-1.5 text-sm text-black dark:text-white outline-none focus:bg-white dark:focus:bg-sidebar transition-all shadow-sm';

    const f2Version = selected.versions?.filter((x) => x.document_type === 'f2').sort((a, b) => b.version_no - a.version_no)[0];

    const filterTypeId = isDraft ? typeId : selected.contract_type_id ? String(selected.contract_type_id) : '';
    const tpl = formTemplates.find(
        (ft) => ft.document_type === 'f1' && (ft.contract_type_id === filterTypeId || ft.contract_type_name === selected.contract_type),
    );

    return (
        <div className="bg-white dark:bg-sidebar overflow-hidden rounded-xl shadow-sm">
            <div className="flex h-14 items-center justify-between bg-primary dark:bg-white px-4">
                <div className="flex items-center gap-2 font-bold text-white dark:text-black text-[11px] uppercase tracking-widest">
                    <Info size={14} className="text-white/40 dark:text-black/40" /> Informasi Kontrak
                    {isDraft && (
                        <span className="rounded-full bg-white dark:bg-black px-2 py-0.5 text-[8px] font-bold tracking-widest text-black dark:text-white uppercase">
                            Editable
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isDraft && (
                        <div className="flex items-center gap-2 px-2">
                            {localSaving ? (
                                <>
                                    <Loader2 size={12} className="animate-spin text-white/40 dark:text-[#0f172a]/40" />
                                    <span className="text-[10px] font-bold text-white/40 dark:text-[#0f172a]/40 uppercase tracking-widest">Menyimpan...</span>
                                </>
                            ) : hasChanges ? (
                                <>
                                    <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-[#0f172a] animate-pulse" />
                                    <span className="text-[10px] font-bold text-white dark:text-[#0f172a] uppercase tracking-widest">Berubah</span>
                                </>
                            ) : (
                                <>
                                    <Check size={12} className="text-white dark:text-[#0f172a]" />
                                    <span className="text-[10px] font-bold text-white dark:text-[#0f172a] uppercase tracking-widest">Tersimpan</span>
                                </>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setMinimized(!minimized)}
                        className="text-white/40 dark:text-black/40 hover:text-white dark:hover:text-black transition-all active:scale-95"
                    >
                        {minimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>
            {!minimized && (
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    <div>
                        <div className="text-black/40 dark:text-white/40 font-bold tracking-[0.2em] uppercase" style={{ fontSize: 9, marginBottom: 6 }}>
                            No. Pengajuan
                        </div>
                        <span
                            className="rounded bg-black/[0.03] dark:bg-white/[0.03] px-3 py-1.5 font-mono font-bold text-black dark:text-white inline-block shadow-sm"
                            style={{ fontSize: 12 }}
                        >
                            {selected.contract_no}
                        </span>
                    </div>

                    {isDraft ? (
                        <div style={{ gridColumn: '1/-1' }}>
                            <div className="text-black/40 dark:text-white/40 font-bold tracking-[0.2em] uppercase" style={{ fontSize: 9, marginBottom: 6 }}>
                                Judul Kontrak
                            </div>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nama kontrak..."
                                className={inputCls + ' font-medium'}
                            />
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-4">
                        <div>
                            <div className="text-black/40 dark:text-white/40 font-bold tracking-[0.2em] uppercase" style={{ fontSize: 9, marginBottom: 6 }}>
                                No. Kontrak
                            </div>
                            {isDraft ? (
                                <input
                                    value={crownNo}
                                    onChange={(e) => setCrownNo(e.target.value)}
                                    placeholder="CROWN-XXX..."
                                    className={inputCls + ' font-mono font-bold'}
                                />
                            ) : (
                                <span
                                    className="rounded bg-black/[0.03] dark:bg-white/[0.03] px-3 py-1.5 font-mono font-bold text-black dark:text-white inline-block shadow-sm"
                                    style={{ fontSize: 12 }}
                                >
                                    {selected.crown_no || '—'}
                                </span>
                            )}
                        </div>

                        <div>
                            <div className="text-black/40 dark:text-white/40 font-bold tracking-[0.2em] uppercase" style={{ fontSize: 9, marginBottom: 6 }}>
                                Sifat Kontrak
                            </div>
                            {isDraft ? (
                                <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className={inputCls}>
                                    <option value="Perjanjian Baru">Perjanjian Baru</option>
                                    <option value="Perpanjangan">Perpanjangan</option>
                                    <option value="Addendum">Addendum</option>
                                    <option value="Amandemen">Amandemen</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            ) : (
                                <span className="text-xs font-bold text-black dark:text-white uppercase">
                                    {selected.transaction_type || '—'}
                                </span>
                            )}
                        </div>
                    </div>


                    <div>
                        <div className="text-black/40 dark:text-white/40 font-bold tracking-[0.2em] uppercase" style={{ fontSize: 9, marginBottom: 6 }}>
                            Jenis Kontrak
                        </div>
                        {isDraft ? (
                            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Tipe</option>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                                <span className="rounded-full bg-[#172554] dark:bg-white px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-white dark:text-[#172554] uppercase shadow-sm">
                                    {selected.contract_type}
                                </span>
                        )}
                    </div>

                    <div>
                        <div className="text-black/40 dark:text-white/40 font-bold tracking-[0.2em] uppercase" style={{ fontSize: 9, marginBottom: 6 }}>
                            Perjanjian
                        </div>
                        {isDraft ? (
                            <select value={submissionTypeId} onChange={(e) => setSubmissionTypeId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Tipe</option>
                                {submissionTypes.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-black dark:text-white font-medium" style={{ fontSize: 12 }}>{selected.submission_type || '—'}</span>
                        )}
                    </div>

                    <div>
                        <div className="text-black/40 dark:text-white/40 font-bold tracking-[0.2em] uppercase" style={{ fontSize: 9, marginBottom: 6 }}>
                            Pihak Kedua (Vendor)
                        </div>
                        {isDraft ? (
                            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls}>
                                <option value="">Pilih Vendor</option>
                                {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                                <span className="rounded-full bg-black/[0.03] dark:bg-white/[0.03] px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-black dark:text-white uppercase shadow-sm">
                                    {(selected as any).vendor?.name || '-'}
                                </span>
                        )}
                    </div>

                    <div>
                        <div className="text-black/40 dark:text-white/40 font-bold tracking-widest uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Dibuat Oleh
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Avatar user={selected.creator} size="sm" />
                            <span className="text-black dark:text-white font-medium" style={{ fontSize: 12 }}>{selected.creator?.name}</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-black/40 dark:text-white/40 font-bold tracking-widest uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Tgl Dibuat
                        </div>
                        <span className="text-black dark:text-white font-medium" style={{ fontSize: 12 }}>{selected.created_at}</span>
                    </div>

                    <div className="grid-cols-1 border-t border-black/10 pt-6 dark:border-white/10" style={{ gridColumn: '1/-1' }}>
                        <div className="mb-4 text-[9px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                            Kontrak Referensi / Dasar Hukum
                        </div>
                        <ContractReferenceCard 
                            selected={selected}
                            canUpdate={canUpdate}
                            onUpdate={onUpdate as any}
                            processing={processing}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
