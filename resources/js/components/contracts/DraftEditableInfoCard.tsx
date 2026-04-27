import { Avatar, StatusBadge } from '@/components/contracts/ui';
import { Contract, ContractType } from '@/types/contracts';
import { useEffect, useMemo, useState } from 'react';

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
    const isDraft = selected.status === 'draft' && canUpdate;
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

    const handleSave = () => {
        onUpdate({
            title,
            description,
            contract_type_id: typeId || undefined,
            vendor_id: vendorId || undefined,
            submission_type_id: submissionTypeId || undefined,
            transaction_type: transactionType,
            kop_sub_topik: kopSubTopik,
            crown_no: crownNo,
        });
    };

    const inputCls =
        'w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all';

    const f2Version = selected.versions?.filter((x) => x.document_type === 'f2').sort((a, b) => b.version_no - a.version_no)[0];

    const filterTypeId = isDraft ? typeId : selected.contract_type_id ? String(selected.contract_type_id) : '';
    const tpl = formTemplates.find(
        (ft) => ft.document_type === 'f1' && (ft.contract_type_id === filterTypeId || ft.contract_type_name === selected.contract_type),
    );

    return (
        <div className="bg-card border-border overflow-hidden rounded-xl border">
            <div className="border-border/50 flex items-center justify-between border-b" style={{ padding: '12px 16px' }}>
                <div className="flex items-center gap-2 font-semibold" style={{ fontSize: 13 }}>
                    <i className="fa-solid fa-circle-info text-muted-foreground" style={{ fontSize: 12 }} /> Informasi Kontrak
                    {isDraft && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400">
                            Editable
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isDraft && hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={processing || !title.trim()}
                            className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? (
                                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 10 }} />
                            ) : (
                                <i className="fa-solid fa-save" style={{ fontSize: 10 }} />
                            )}
                            Simpan
                        </button>
                    )}
                    {!(isDraft && hasChanges) && (
                        <button
                            onClick={() => setMinimized(!minimized)}
                            className="text-muted-foreground hover:bg-muted h-7 w-7 rounded-md transition-all active:scale-95"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <i
                                className={`fa-solid fa-chevron-${minimized ? 'down' : 'up'}`}
                                style={{ fontSize: 12, transition: 'transform 0.2s' }}
                            />
                        </button>
                    )}
                </div>
            </div>
            {!minimized && (
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    {isDraft ? (
                        <div style={{ gridColumn: '1/-1' }}>
                            <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
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
                            <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                                No. Pengajuan
                            </div>
                            <span
                                className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-500"
                                style={{ fontSize: 12 }}
                            >
                                {selected.contract_no}
                            </span>
                        </div>
                        <div>
                            <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                                No. Kontrak
                            </div>
                            {isDraft ? (
                                <div className="group relative">
                                    <input
                                        value={crownNo}
                                        onChange={(e) => setCrownNo(e.target.value)}
                                        placeholder="..."
                                        className={inputCls + ' pr-8 font-bold text-indigo-600'}
                                    />
                                    {crownNo && (
                                        <button
                                            onClick={() => setCrownNo('')}
                                            className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors hover:text-red-500"
                                            title="Hapus nomor"
                                        >
                                            <i className="fa-solid fa-circle-xmark text-[14px]" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <span
                                    className={
                                        selected.crown_no
                                            ? 'rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 font-mono font-bold text-indigo-700'
                                            : 'text-muted-foreground italic'
                                    }
                                    style={{ fontSize: 12 }}
                                >
                                    {selected.crown_no || 'Not Set'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Status
                        </div>
                        <StatusBadge status={selected.status} />
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
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
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-bold tracking-wider text-blue-700 uppercase dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
                                {selected.contract_type}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
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
                            <span style={{ fontSize: 12 }}>{selected.submission_type || '—'}</span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
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
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold tracking-wider text-slate-600 uppercase">
                                {(selected as any).vendor?.name || '-'}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Dibuat Oleh
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Avatar user={selected.creator} size="sm" />
                            <span style={{ fontSize: 12 }}>{selected.creator?.name}</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Tgl Dibuat
                        </div>
                        <span style={{ fontSize: 12 }}>{selected.created_at}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
