import React, { useCallback, useEffect, useState } from 'react';
import { Contract } from '@/types/contracts';
import { contractApi } from '@/lib/contract-api';
import axios from 'axios';

interface FormTemplateInfo {
    id: string;
    name: string;
    description: string;
    document_type?: string;
    contract_type_id: string | null;
    contract_type_name: string | null;
    fields_count: number;
}

interface FormField {
    id: string;
    label: string;
    name: string;
    type: string;
    placeholder?: string;
    is_required: boolean;
    width: string;
    options?: string[];
    order: number;
}

interface VersionItem {
    id: string;
    version_no: number;
    form_data: Record<string, any>;
    change_summary: string | null;
    created_by: any;
    created_at: string;
}

const api = axios.create({
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
});

// ── F2 important field keys (from F1 data) ──────────────────────────
// These are the F1 field names (snake_case) that should appear in the F2 summary.
const F2_IMPORTANT_FIELDS: { key: string; label: string; width: string }[] = [
    { key: 'judul', label: 'Judul Perjanjian', width: '1/1' },
    { key: 'type_perjanjian', label: 'Type Perjanjian', width: '1/2' },
    { key: 'tanggal', label: 'Tanggal', width: '1/2' },
    { key: 'pihak_i_(pt.)', label: 'Pihak I (PT.)', width: '1/2' },
    { key: 'pihak_ii_(pt.)', label: 'Pihak II (PT.)', width: '1/2' },
    { key: 'penandatanganan_pihak_i', label: 'Penandatangan Pihak I', width: '1/2' },
    { key: 'penandatanganan_pihak_ii', label: 'Penandatangan Pihak II', width: '1/2' },
    { key: 'tujuan/latar_belakang', label: 'Tujuan / Latar Belakang', width: '1/1' },
    { key: 'jangka_waktu_(mulai)', label: 'Jangka Waktu (Mulai)', width: '1/2' },
    { key: 'jangka_waktu_(s.d)', label: 'Jangka Waktu (s.d)', width: '1/2' },
    { key: 'lokasi_area', label: 'Lokasi Area', width: '1/1' },
    { key: 'harga/fee', label: 'Harga / Fee', width: '1/2' },
    { key: 'terms_of_payment', label: 'Terms of Payment', width: '1/2' },
    { key: 'ppn', label: 'PPN', width: '1/2' },
    { key: 'pph', label: 'PPh', width: '1/2' },
];

// ═══════════════════════════════════════════════════════════════════════
//  F1 Form Tab — Editable form
// ═══════════════════════════════════════════════════════════════════════
export function FormSubmissionTab({
    docType,
    selected,
    formTemplates,
    onContractUpdated,
}: {
    docType: 'f1' | 'f2';
    selected: Contract;
    formTemplates: FormTemplateInfo[];
    onContractUpdated: (c: Contract) => void;
}) {
    // If docType is 'f2', delegate to the read-only F2 summary component
    if (docType === 'f2') {
        return (
            <F2SummaryTab
                selected={selected}
                formTemplates={formTemplates}
            />
        );
    }

    return (
        <F1EditableTab
            selected={selected}
            formTemplates={formTemplates}
            onContractUpdated={onContractUpdated}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  F1 Editable Tab (original behavior)
// ═══════════════════════════════════════════════════════════════════════
function F1EditableTab({
    selected,
    formTemplates,
    onContractUpdated,
}: {
    selected: Contract;
    formTemplates: FormTemplateInfo[];
    onContractUpdated: (c: Contract) => void;
}) {
    const docType = 'f1';
    const [fields, setFields] = useState<FormField[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [originalData, setOriginalData] = useState<Record<string, any>>({});
    const [versions, setVersions] = useState<VersionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [showVersions, setShowVersions] = useState(false);

    const matchingTemplate = formTemplates.find(
        ft => ft.contract_type_name === selected.contract_type && ft.document_type === docType
    ) ?? formTemplates.find(
        ft => !ft.contract_type_id && ft.document_type === docType
    );

    // Load template fields + existing submission data
    const loadData = useCallback(async () => {
        if (!matchingTemplate) { setLoading(false); return; }
        setLoading(true);
        try {
            const [tplRes, subRes] = await Promise.all([
                api.get(`/api/form-templates/${matchingTemplate.id}/fields`),
                contractApi.formSubmissions.get(selected.id, docType),
            ]);
            const tplFields: FormField[] = tplRes.data.fields ?? [];
            setFields(tplFields.filter(f => f.type !== 'kop_surat' && f.type !== 'form_title'));

            if (subRes.submission && subRes.versions?.length > 0) {
                const latest = subRes.versions[0];
                setFormData(latest.form_data ?? {});
                setOriginalData(latest.form_data ?? {});
                setVersions(subRes.versions);
            } else {
                const empty: Record<string, any> = {};
                tplFields.forEach(f => { if (f.type !== 'kop_surat' && f.type !== 'form_title') empty[f.name] = ''; });
                setFormData(empty);
                setOriginalData(empty);
                setVersions([]);
            }
        } catch (e) {
            console.error('Failed to load form data', e);
        } finally {
            setLoading(false);
        }
    }, [matchingTemplate?.id, selected.id, docType]);

    useEffect(() => { loadData(); }, [loadData]);

    const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

    const handleSave = async () => {
        if (!matchingTemplate || !isDirty) return;
        setSaving(true);
        try {
            const updated = await contractApi.formSubmissions.save(selected.id, {
                form_template_id: matchingTemplate.id,
                document_type: docType,
                form_data: formData,
            });
            onContractUpdated(updated);
            setOriginalData({ ...formData });
            setToast(`Form ${docType.toUpperCase()} berhasil disimpan.`);
            setTimeout(() => setToast(null), 3000);
            // Reload versions
            const subRes = await contractApi.formSubmissions.get(selected.id, docType);
            if (subRes.versions) setVersions(subRes.versions);
        } catch (e: any) {
            setToast('Gagal menyimpan form.');
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const loadVersion = (v: VersionItem) => {
        setFormData(v.form_data);
        setOriginalData(v.form_data);
        setShowVersions(false);
    };

    const widthMap: Record<string, string> = {
        '1/1': '100%', '1/2': 'calc(50% - 6px)', '1/3': 'calc(33.33% - 8px)',
        '2/3': 'calc(66.66% - 4px)', '1/4': 'calc(25% - 9px)',
    };

    if (!matchingTemplate) {
        return (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <div className="w-14 h-14 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-file-circle-question text-muted-foreground" style={{ fontSize: 24 }} />
                </div>
                <h5 className="font-bold text-foreground mb-1" style={{ fontSize: 14 }}>
                    Belum Ada Template {docType.toUpperCase()}
                </h5>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    {selected.contract_type && selected.contract_type !== '—'
                        ? `Tidak ada form ${docType.toUpperCase()} untuk tipe "${selected.contract_type}".`
                        : 'Pilih tipe kontrak terlebih dahulu.'
                    }
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-3" style={{ fontSize: 13 }}>
                <i className="fa-solid fa-spinner fa-spin" /> Memuat form...
            </div>
        );
    }

    const submissionInfo = selected.form_submissions?.find(s => s.document_type === docType);

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h4 className="font-bold text-foreground" style={{ fontSize: 13 }}>
                        Form {docType.toUpperCase()}
                    </h4>
                    {submissionInfo && (
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                            v{submissionInfo.current_version}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {versions.length > 0 && (
                        <button
                            onClick={() => setShowVersions(!showVersions)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md hover:bg-muted/50 transition-all text-xs font-medium text-muted-foreground"
                        >
                            <i className="fa-solid fa-clock-rotate-left" /> {versions.length} versi
                        </button>
                    )}
                    {submissionInfo && (
                        <a
                            href={`/api/contracts/${selected.id}/form-submissions/f1/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-800 transition-all text-xs font-medium text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                        >
                            <i className="fa-solid fa-file-pdf" /> Download PDF
                        </a>
                    )}
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                        >
                            {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
                            Simpan
                        </button>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                    <i className="fa-solid fa-check-circle" /> {toast}
                </div>
            )}

            {/* Version History Panel */}
            {showVersions && (
                <div className="border border-border rounded-xl bg-muted/20 p-4 space-y-2">
                    <h5 className="font-bold text-foreground mb-2" style={{ fontSize: 12 }}>Riwayat Versi</h5>
                    {versions.map(v => (
                        <div
                            key={v.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-all cursor-pointer"
                            onClick={() => loadVersion(v)}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-primary text-xs">v{v.version_no}</span>
                                    <span className="text-muted-foreground text-[10px]">{v.created_at}</span>
                                </div>
                                {v.change_summary && (
                                    <div className="text-[11px] text-muted-foreground mt-0.5">{v.change_summary}</div>
                                )}
                                {v.created_by && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5">oleh {v.created_by.name}</div>
                                )}
                            </div>
                            <i className="fa-solid fa-arrow-right text-muted-foreground text-xs" />
                        </div>
                    ))}
                </div>
            )}

            {/* Template Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-file-lines text-blue-600 dark:text-blue-400" style={{ fontSize: 14 }} />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-foreground text-xs truncate">{matchingTemplate.name}</div>
                    <div className="text-muted-foreground text-[10px]">{fields.length} fields · {matchingTemplate.contract_type_name}</div>
                </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {fields.map(field => (
                    <div key={field.id} style={{ width: widthMap[field.width] || '100%' }}>
                        <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                            {field.label}
                            {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {(field.type === 'text' || field.type === 'signature_box') && (
                            <input
                                type="text"
                                value={formData[field.name] ?? ''}
                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder={field.placeholder}
                                className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        )}
                        {field.type === 'number' && (
                            <input
                                type="number"
                                value={formData[field.name] ?? ''}
                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder={field.placeholder}
                                className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        )}
                        {field.type === 'date' && (
                            <input
                                type="date"
                                value={formData[field.name] ?? ''}
                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        )}
                        {field.type === 'textarea' && (
                            <textarea
                                value={formData[field.name] ?? ''}
                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder={field.placeholder}
                                rows={3}
                                className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            />
                        )}
                        {field.type === 'select' && (
                            <select
                                value={formData[field.name] ?? ''}
                                onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="">{field.placeholder || 'Pilih...'}</option>
                                {(field.options ?? []).map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        )}
                        {field.type === 'checkbox' && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!formData[field.name]}
                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                />
                                <span className="text-xs text-muted-foreground">{field.label}</span>
                            </label>
                        )}
                    </div>
                ))}
            </div>

            {/* Save Footer */}
            {isDirty && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-dot" style={{ fontSize: 6 }} /> Perubahan belum disimpan
                    </span>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold text-xs transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fa-solid fa-check" /> Simpan Form {docType.toUpperCase()}</>}
                    </button>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  F2 Summary Tab — Read-only, values pulled from F1 submission
// ═══════════════════════════════════════════════════════════════════════
function F2SummaryTab({
    selected,
    formTemplates,
}: {
    selected: Contract;
    formTemplates: FormTemplateInfo[];
}) {
    const [f1Data, setF1Data] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [f1Version, setF1Version] = useState<number>(0);
    const [hasF1Submission, setHasF1Submission] = useState(!!selected.form_submissions?.find(s => s.document_type === 'f1'));

    const f2Template = formTemplates.find(
        ft => ft.contract_type_name === selected.contract_type && ft.document_type === 'f2'
    ) ?? formTemplates.find(
        ft => !ft.contract_type_id && ft.document_type === 'f2'
    );

    // Load F1 submission data
    const loadF1Data = useCallback(async () => {
        setLoading(true);
        try {
            const subRes = await contractApi.formSubmissions.get(selected.id, 'f1');
            if (subRes.submission && subRes.versions?.length > 0) {
                const latest = subRes.versions[0];
                setF1Data(latest.form_data ?? {});
                setF1Version(subRes.submission.current_version ?? 0);
                setHasF1Submission(true);
            } else {
                setF1Data({});
                setF1Version(0);
                setHasF1Submission(false);
            }
        } catch (e) {
            console.error('Failed to load F1 data for F2 summary', e);
        } finally {
            setLoading(false);
        }
    }, [selected.id]);

    useEffect(() => { loadF1Data(); }, [loadF1Data]);

    const widthMap: Record<string, string> = {
        '1/1': '100%', '1/2': 'calc(50% - 6px)', '1/3': 'calc(33.33% - 8px)',
        '2/3': 'calc(66.66% - 4px)', '1/4': 'calc(25% - 9px)',
    };

    // No F1 submission yet
    if (!hasF1Submission && !loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground" style={{ fontSize: 13 }}>Form F2 — Resume</h4>
                    <button
                        onClick={loadF1Data}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-xs font-medium text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                    >
                        <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} /> Perbarui Data F1
                    </button>
                </div>
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/5">
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-file-circle-exclamation text-amber-500" style={{ fontSize: 24 }} />
                    </div>
                    <h5 className="font-bold text-foreground mb-1" style={{ fontSize: 14 }}>
                        Form F1 Belum Diisi
                    </h5>
                    <p className="text-muted-foreground mb-4" style={{ fontSize: 12 }}>
                        F2 adalah resume dari data F1. Silakan isi form F1 terlebih dahulu.
                    </p>
                </div>
            </div>
        );
    }

    if (loading && !hasF1Submission) {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-3" style={{ fontSize: 13 }}>
                <i className="fa-solid fa-spinner fa-spin" /> Memuat resume F2...
            </div>
        );
    }

    const hasData = Object.values(f1Data).some(v => v !== '' && v !== null && v !== undefined);

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h4 className="font-bold text-foreground" style={{ fontSize: 13 }}>
                        Form F2 — Resume
                    </h4>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                        Read-Only
                    </span>
                    {f1Version > 0 && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                            dari F1 v{f1Version}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadF1Data}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-xs font-medium text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                    >
                        <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} /> Refresh
                    </button>
                    {hasData && (
                        <a
                            href={`/api/contracts/${selected.id}/form-submissions/f2/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-800 transition-all text-xs font-medium text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                        >
                            <i className="fa-solid fa-file-pdf" /> Download PDF
                        </a>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-file-shield text-amber-600 dark:text-amber-400" style={{ fontSize: 14 }} />
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-foreground text-xs truncate">
                        {f2Template?.name ?? 'Resume dan Persetujuan'}
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                        Data diambil otomatis dari Form F1 · {F2_IMPORTANT_FIELDS.length} field penting
                    </div>
                </div>
            </div>

            {/* Read-only Field Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {F2_IMPORTANT_FIELDS.map(field => {
                    const value = f1Data[field.key] ?? '';
                    return (
                        <div key={field.key} style={{ width: widthMap[field.width] || '100%' }}>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                                {field.label}
                            </label>
                            <div
                                className="w-full border border-border/50 rounded-lg px-3 py-2 text-xs bg-muted/30 text-foreground min-h-[34px] flex items-center"
                                style={{ cursor: 'default' }}
                            >
                                {value ? (
                                    <span>{value}</span>
                                ) : (
                                    <span className="text-muted-foreground/40 italic">—</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <i className="fa-solid fa-info-circle" style={{ fontSize: 10 }} />
                    Data F2 diambil otomatis dari Form F1. Untuk mengubah data, silakan edit pada tab F1.
                </span>
            </div>
        </div>
    );
}
