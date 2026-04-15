import { contractApi } from '@/lib/contract-api';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

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
const F2_IMPORTANT_FIELDS: { key: string; label: string; width: string; type?: string }[] = [
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
    // Signature boxes
    { key: 'dibuat_oleh_(nama_pic)', label: 'PIC', width: '1/3', type: 'signature_box' },
    { key: 'diketahui_oleh_(manager_legal)', label: 'Manager Legal', width: '1/3', type: 'signature_box' },
    { key: 'diketahui_oleh_(vp_legal)', label: 'VP Legal / Management', width: '1/3', type: 'signature_box' },
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
        return <F2SummaryTab selected={selected} formTemplates={formTemplates} />;
    }

    return <F1EditableTab selected={selected} formTemplates={formTemplates} onContractUpdated={onContractUpdated} />;
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

    const matchingTemplate =
        formTemplates.find((ft) => ft.contract_type_name === selected.contract_type && ft.document_type === docType) ??
        formTemplates.find((ft) => !ft.contract_type_id && ft.document_type === docType);

    // Load template fields + existing submission data
    const loadData = useCallback(async () => {
        if (!matchingTemplate) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [tplRes, subRes] = await Promise.all([
                api.get(`/api/form-templates/${matchingTemplate.id}/fields`),
                contractApi.formSubmissions.get(selected.id, docType),
            ]);
            const tplFields: FormField[] = tplRes.data.fields ?? [];
            setFields(tplFields.filter((f) => f.type !== 'kop_surat' && f.type !== 'form_title'));

            if (subRes.submission && subRes.versions?.length > 0) {
                const latest = subRes.versions[0];
                setFormData(latest.form_data ?? {});
                setOriginalData(latest.form_data ?? {});
                setVersions(subRes.versions);
            } else {
                const empty: Record<string, any> = {};
                tplFields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') empty[f.name] = '';
                });
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

    useEffect(() => {
        loadData();
    }, [loadData]);

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
        '1/1': '100%',
        '1/2': 'calc(50% - 6px)',
        '1/3': 'calc(33.33% - 8px)',
        '2/3': 'calc(66.66% - 4px)',
        '1/4': 'calc(25% - 9px)',
    };

    if (!matchingTemplate) {
        return (
            <div className="border-border rounded-xl border border-dashed py-12 text-center">
                <div className="bg-muted/50 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                    <i className="fa-solid fa-file-circle-question text-muted-foreground" style={{ fontSize: 24 }} />
                </div>
                <h5 className="text-foreground mb-1 font-bold" style={{ fontSize: 14 }}>
                    Belum Ada Template {docType.toUpperCase()}
                </h5>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                    {selected.contract_type && selected.contract_type !== '—'
                        ? `Tidak ada form ${docType.toUpperCase()} untuk tipe "${selected.contract_type}".`
                        : 'Pilih tipe kontrak terlebih dahulu.'}
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-muted-foreground flex items-center justify-center gap-3 py-16" style={{ fontSize: 13 }}>
                <i className="fa-solid fa-spinner fa-spin" /> Memuat form...
            </div>
        );
    }

    const submissionInfo = selected.form_submissions?.find((s) => s.document_type === docType);

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h4 className="text-foreground font-bold" style={{ fontSize: 13 }}>
                        Form {docType.toUpperCase()}
                    </h4>
                    {submissionInfo && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase dark:bg-emerald-900/30 dark:text-emerald-400">
                            v{submissionInfo.current_version}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {versions.length > 0 && (
                        <button
                            onClick={() => setShowVersions(!showVersions)}
                            className="border-border hover:bg-muted/50 text-muted-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all"
                        >
                            <i className="fa-solid fa-clock-rotate-left" /> {versions.length} versi
                        </button>
                    )}
                    {submissionInfo && (
                        <a
                            href={`/api/contracts/${selected.id}/form-submissions/f1/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-border text-muted-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        >
                            <i className="fa-solid fa-file-pdf" /> Download PDF
                        </a>
                    )}
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                        >
                            {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
                            Simpan
                        </button>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <i className="fa-solid fa-check-circle" /> {toast}
                </div>
            )}

            {/* Version History Panel */}
            {showVersions && (
                <div className="border-border bg-muted/20 space-y-2 rounded-xl border p-4">
                    <h5 className="text-foreground mb-2 font-bold" style={{ fontSize: 12 }}>
                        Riwayat Versi
                    </h5>
                    {versions.map((v) => (
                        <div
                            key={v.id}
                            className="border-border bg-card hover:bg-muted/30 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all"
                            onClick={() => loadVersion(v)}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-mono text-xs font-bold">v{v.version_no}</span>
                                    <span className="text-muted-foreground text-[10px]">{v.created_at}</span>
                                </div>
                                {v.change_summary && <div className="text-muted-foreground mt-0.5 text-[11px]">{v.change_summary}</div>}
                                {v.created_by && <div className="text-muted-foreground mt-0.5 text-[10px]">oleh {v.created_by.name}</div>}
                            </div>
                            <i className="fa-solid fa-arrow-right text-muted-foreground text-xs" />
                        </div>
                    ))}
                </div>
            )}

            {/* Template Info */}
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                    <i className="fa-solid fa-file-lines text-blue-600 dark:text-blue-400" style={{ fontSize: 14 }} />
                </div>
                <div className="min-w-0">
                    <div className="text-foreground truncate text-xs font-bold">{matchingTemplate.name}</div>
                    <div className="text-muted-foreground text-[10px]">
                        {fields.length} fields · {matchingTemplate.contract_type_name}
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {fields.map((field) => (
                    <div key={field.id} style={{ width: widthMap[field.width] || '100%' }}>
                        <label className="text-foreground/80 mb-1.5 block text-xs font-semibold">
                            {field.label}
                            {field.is_required && <span className="ml-0.5 text-red-500">*</span>}
                        </label>
                        {(field.type === 'text' || field.type === 'signature_box') && (
                            <input
                                type="text"
                                value={formData[field.name] ?? ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder={field.placeholder}
                                className="border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3 py-2 text-xs transition-all outline-none focus:ring-2"
                            />
                        )}
                        {field.type === 'number' && (
                            <input
                                type="number"
                                value={formData[field.name] ?? ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder={field.placeholder}
                                className="border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3 py-2 text-xs transition-all outline-none focus:ring-2"
                            />
                        )}
                        {field.type === 'date' && (
                            <input
                                type="date"
                                value={formData[field.name] ?? ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                className="border-border bg-card text-foreground focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3 py-2 text-xs transition-all outline-none focus:ring-2"
                            />
                        )}
                        {field.type === 'textarea' && (
                            <textarea
                                value={formData[field.name] ?? ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                placeholder={field.placeholder}
                                rows={3}
                                className="border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:ring-primary/20 focus:border-primary w-full resize-none rounded-lg border px-3 py-2 text-xs transition-all outline-none focus:ring-2"
                            />
                        )}
                        {field.type === 'select' && (
                            <select
                                value={formData[field.name] ?? ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                className="border-border bg-card text-foreground focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-3 py-2 text-xs transition-all outline-none focus:ring-2"
                            >
                                <option value="">{field.placeholder || 'Pilih...'}</option>
                                {(field.options ?? []).map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        )}
                        {field.type === 'checkbox' && (
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!formData[field.name]}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.checked }))}
                                    className="border-border text-primary focus:ring-primary/20 h-4 w-4 rounded"
                                />
                                <span className="text-muted-foreground text-xs">{field.label}</span>
                            </label>
                        )}
                    </div>
                ))}
            </div>

            {/* Save Footer */}
            {isDirty && (
                <div className="border-border flex items-center justify-between border-t pt-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <i className="fa-solid fa-circle-dot" style={{ fontSize: 6 }} /> Perubahan belum disimpan
                    </span>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold shadow-lg transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin" /> Menyimpan...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-check" /> Simpan Form {docType.toUpperCase()}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  F2 Summary Tab — Read-only, values pulled from F1 submission
// ═══════════════════════════════════════════════════════════════════════
function F2SummaryTab({ selected, formTemplates }: { selected: Contract; formTemplates: FormTemplateInfo[] }) {
    const [f1Data, setF1Data] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [f1Version, setF1Version] = useState<number>(0);
    const [hasF1Submission, setHasF1Submission] = useState(!!selected.form_submissions?.find((s) => s.document_type === 'f1'));

    const f2Template =
        formTemplates.find((ft) => ft.contract_type_name === selected.contract_type && ft.document_type === 'f2') ??
        formTemplates.find((ft) => !ft.contract_type_id && ft.document_type === 'f2');

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

    useEffect(() => {
        loadF1Data();
    }, [loadF1Data]);

    const widthMap: Record<string, string> = {
        '1/1': '100%',
        '1/2': 'calc(50% - 6px)',
        '1/3': 'calc(33.33% - 8px)',
        '2/3': 'calc(66.66% - 4px)',
        '1/4': 'calc(25% - 9px)',
    };

    // No F1 submission yet
    if (!hasF1Submission && !loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-foreground font-bold" style={{ fontSize: 13 }}>
                        Form F2 — Resume
                    </h4>
                    <button
                        onClick={loadF1Data}
                        disabled={loading}
                        className="border-border text-muted-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 dark:hover:border-blue-800 dark:hover:bg-blue-950/20 dark:hover:text-blue-400"
                    >
                        <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} /> Perbarui Data F1
                    </button>
                </div>
                <div className="border-border bg-muted/5 rounded-xl border border-dashed py-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
                        <i className="fa-solid fa-file-circle-exclamation text-amber-500" style={{ fontSize: 24 }} />
                    </div>
                    <h5 className="text-foreground mb-1 font-bold" style={{ fontSize: 14 }}>
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
            <div className="text-muted-foreground flex items-center justify-center gap-3 py-16" style={{ fontSize: 13 }}>
                <i className="fa-solid fa-spinner fa-spin" /> Memuat resume F2...
            </div>
        );
    }

    const hasData = Object.values(f1Data).some((v) => v !== '' && v !== null && v !== undefined);

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h4 className="text-foreground font-bold" style={{ fontSize: 13 }}>
                        Form F2 — Resume
                    </h4>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                        Read-Only
                    </span>
                    {f1Version > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase dark:bg-blue-900/30 dark:text-blue-400">
                            dari F1 v{f1Version}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadF1Data}
                        disabled={loading}
                        className="border-border text-muted-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 dark:hover:border-blue-800 dark:hover:bg-blue-950/20 dark:hover:text-blue-400"
                    >
                        <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} /> Refresh
                    </button>
                    {hasData && (
                        <a
                            href={`/api/contracts/${selected.id}/form-submissions/f2/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-border text-muted-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        >
                            <i className="fa-solid fa-file-pdf" /> Download PDF
                        </a>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <i className="fa-solid fa-file-shield text-amber-600 dark:text-amber-400" style={{ fontSize: 14 }} />
                </div>
                <div className="min-w-0">
                    <div className="text-foreground truncate text-xs font-bold">{f2Template?.name ?? 'Resume dan Persetujuan'}</div>
                    <div className="text-muted-foreground text-[10px]">
                        Data diambil otomatis dari Form F1 · {F2_IMPORTANT_FIELDS.length} field penting
                    </div>
                </div>
            </div>

            {/* Read-only Field Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {F2_IMPORTANT_FIELDS.map((field) => {
                    const value = f1Data[field.key] ?? '';

                    if (field.type === 'signature_box') {
                        return (
                            <div key={field.key} style={{ width: widthMap[field.width] || '100%' }}>
                                <label className="text-muted-foreground mb-1.5 block text-[10px] font-bold tracking-wider uppercase">
                                    {field.label}
                                </label>
                                <div className="border-border overflow-hidden rounded-lg border bg-white dark:bg-slate-950">
                                    <div className="border-border text-muted-foreground border-b bg-slate-50 px-3 py-1.5 text-center text-[10px] font-bold tracking-tight uppercase dark:bg-slate-900">
                                        {field.key.includes('vp') ? 'Disetujui oleh :' : 'Diketahui oleh :'}
                                    </div>
                                    <div className="flex h-20 flex-col items-center justify-end p-3">
                                        <div className="text-foreground text-[11px] font-bold">{value || ''}</div>
                                    </div>
                                    <div className="border-border text-muted-foreground/60 border-t bg-slate-50/50 px-3 py-1 text-[9px] italic dark:bg-slate-900/50">
                                        Tgl. ________________
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={field.key} style={{ width: widthMap[field.width] || '100%' }}>
                            <label className="text-muted-foreground mb-1.5 block text-[10px] font-bold tracking-wider uppercase">{field.label}</label>
                            <div
                                className="border-border/50 bg-muted/30 text-foreground flex min-h-[34px] w-full items-center rounded-lg border px-3 py-2 text-xs"
                                style={{ cursor: 'default' }}
                            >
                                {value ? <span>{value}</span> : <span className="text-muted-foreground/40 italic">—</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer info */}
            <div className="border-border flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                    <i className="fa-solid fa-info-circle" style={{ fontSize: 10 }} />
                    Data F2 diambil otomatis dari Form F1. Untuk mengubah data, silakan edit pada tab F1.
                </span>
            </div>
        </div>
    );
}
