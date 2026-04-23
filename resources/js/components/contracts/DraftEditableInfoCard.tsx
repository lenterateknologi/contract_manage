import React, { useState, useEffect, useMemo } from 'react';
import { Contract, ContractType } from '@/types/contracts';
import { Avatar, StatusBadge } from '@/components/contracts/ui';
import { contractApi } from '@/lib/contract-api';

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
    const [minimized, setMinimized] = useState(false);

    useEffect(() => {
        setTitle(selected.title);
        setDescription(selected.description || '');
        const t = types.find((x) => x.name === selected.contract_type);
        setTypeId(t ? String(t.id) : '');
    }, [selected.id, selected.title, selected.description, selected.contract_type, types]);

    const hasChanges = useMemo(() => {
        const origType = types.find((x) => x.name === selected.contract_type);
        const origTypeId = origType ? String(origType.id) : '';
        return title !== selected.title || description !== (selected.description || '') || typeId !== origTypeId;
    }, [title, description, typeId, selected, types]);

    const handleSave = () => {
        onUpdate({ title, description, contract_type_id: typeId || undefined });
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

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            No. Kontrak
                        </div>
                        <span className="bg-muted text-foreground/80 rounded px-2 py-0.5 font-mono" style={{ fontSize: 12 }}>
                            {selected.contract_no}
                        </span>
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Status
                        </div>
                        <StatusBadge status={selected.status} />
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Tipe Kontrak
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

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Form Template
                        </div>
                        {tpl ? (
                            <div className="flex items-center gap-2">
                                <span className="text-primary max-w-[160px] truncate font-medium" style={{ fontSize: 12 }} title={tpl.name}>
                                    {tpl.name}
                                </span>
                                <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                                    ({tpl.fields_count} fields)
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic" style={{ fontSize: 12 }}>
                                Belum ada template
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Dokumen F2
                        </div>
                        {f2Version ? (
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                    <span className="text-primary font-mono font-bold" style={{ fontSize: 12 }}>
                                        v{f2Version.version_no}
                                    </span>
                                    <span
                                        className="text-muted-foreground max-w-[140px] truncate"
                                        style={{ fontSize: 12 }}
                                        title={f2Version.file_name}
                                    >
                                        {f2Version.file_name}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setPreviewTitle('F2 - v' + f2Version.version_no);
                                            setPreviewUrl(contractApi.pdfPreviewUrl(selected.id, f2Version.version_no, 'f2'));
                                            setPreviewHasFile(f2Version.has_file);
                                            setPreviewOpen(true);
                                        }}
                                        className="bg-muted/50 border-border/50 text-muted-foreground hover:bg-card flex h-5 w-5 items-center justify-center rounded border shadow-sm transition-all hover:text-cyan-600"
                                    >
                                        <i className="fa-solid fa-eye" style={{ fontSize: 12 }} />
                                    </button>
                                    <a
                                        href={contractApi.downloadUrl(selected.id, 'f2', f2Version.version_no)}
                                        download
                                        className="bg-muted/50 border-border/50 text-muted-foreground hover:bg-card flex h-5 w-5 items-center justify-center rounded border shadow-sm transition-all hover:text-cyan-600"
                                    >
                                        <i className="fa-solid fa-download" style={{ fontSize: 12 }} />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic" style={{ fontSize: 12 }}>
                                -
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Total Versi
                        </div>
                        <span style={{ fontSize: 12 }}>{selected.versions?.length ?? 0} versi</span>
                    </div>

                    <div style={{ gridColumn: '1/-1' }}>
                        <div className="text-muted-foreground font-semibold tracking-wider uppercase" style={{ fontSize: 10, marginBottom: 4 }}>
                            Deskripsi
                        </div>
                        {isDraft ? (
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Deskripsi kontrak (opsional)..."
                                className={inputCls + ' resize-none'}
                            />
                        ) : (
                            <div style={{ fontSize: 12 }}>{selected.description || <span className="text-muted-foreground italic">-</span>}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
