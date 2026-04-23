import { FormField } from '@/components/form-renderer/FormElement';
import { InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import { contractApi } from '@/lib/contract-api';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
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

// FormField and FormTemplate interfaces are now imported from shared components

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

/**
 * Fuzzy matching helper to autofill F1 form fields from general contract data.
 */
const getAutofillValue = (field: FormField, contract: Contract) => {
    const name = field.name.toLowerCase();
    const label = field.label.toLowerCase();

    // Title / Judul (Supporting new prefixes)
    if (
        name === 'judul' ||
        name === 'judul_kontrak' ||
        name === 'bv_f1_title' ||
        name === 'f1_title' ||
        label.includes('judul') ||
        label.includes('nama kontrak')
    ) {
        return contract.title || '';
    }
    // Number / No Kontrak
    if (name === 'no_kontrak' || name === 'mv_nomor' || label.includes('nomor kontrak') || label.includes('no. kontrak')) {
        return contract.contract_no || '';
    }
    // Type / Tipe Perjanjian / Jenis Kontrak
    if (name === 'type_perjanjian' || name === 'tipe_perjanjian_detail' || label.includes('tipe perjanjian') || label.includes('jenis kontrak')) {
        return (contract as any).contract_type?.name || (typeof contract.contract_type === 'string' ? contract.contract_type : '');
    }
    // Date formatting helper
    const formatDate = (date: string | null) => (date ? date.split(' ')[0] : '');
    // Date / Tanggal
    if (name === 'tanggal' || name === 'bv_f1_date' || label === 'tanggal' || label.includes('tgl perjanjian')) {
        return formatDate(contract.contract_date || contract.created_at);
    }
    // Jangka Waktu
    if (name === 'tdv_jw' || name.includes('jangka_waktu_(mulai)') || label.includes('jangka waktu mulai') || label.includes('tanggal mulai')) {
        return formatDate(contract.contract_date);
    }
    if (name.includes('jangka_waktu_(s.d)') || label.includes('jangka waktu s.d') || label.includes('tanggal berakhir')) {
        return formatDate(contract.end_date);
    }
    // PIC / Dibuat Oleh
    if (name.includes('pic') || name.includes('dibuat_oleh') || label.includes('pic') || label.includes('dibuat oleh')) {
        return contract.creator?.name || '';
    }
    // Description / Tujuan / Background
    if (name === 'bv_f1_tujuan' || name === 'tujuan/latar_belakang' || label.includes('tujuan') || label.includes('latar belakang')) {
        return contract.description || '';
    }

    // Commercial Fields
    if (name === 'tdv_price') return (contract as any).total_value || '';
    if (name === 'tdv_loc') return (contract as any).location || '';

    // Mode Transaksi
    if (name === 'transaction_mode' || name === 'jenis_transaksi_pks' || label.includes('mode transaksi') || label.includes('jenis transaksi')) {
        return (contract as any).transaction_type || '';
    }

    // Party Representatives (F2 Specific Mapping)
    if (name === 'nama_pihak_1') return contract.creator?.name || '';
    if (name === 'jabatan_pihak_1') return (contract.metadata as any)?.jabatan_pihak_1 || 'Direktur';
    if (name === 'nama_pihak_2') return (contract as any).vendor?.pic_name || (contract.metadata as any)?.nama_pihak_2 || '';
    if (name === 'jabatan_pihak_2') return (contract as any).vendor?.pic_position || (contract.metadata as any)?.jabatan_pihak_2 || 'Kuasa Direksi';

    // General Metadata Fallback (If name matches metadata key)
    if (contract.metadata && (contract.metadata as any)[field.name]) {
        return (contract.metadata as any)[field.name];
    }

    return null;
};

// ═══════════════════════════════════════════════════════════════════════
//  Principal Components
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
    return <GenericFormTab docType={docType} selected={selected} formTemplates={formTemplates} onContractUpdated={onContractUpdated} />;
}

/**
 * A generic, industrial-grade editable tab for any form document type (F1, F2, etc.)
 * Centralizes loading, pre-filling (inheritance), and versioning.
 */
function GenericFormTab({
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
    const [fields, setFields] = useState<FormField[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [originalData, setOriginalData] = useState<Record<string, any>>({});
    const [versions, setVersions] = useState<VersionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [showVersions, setShowVersions] = useState(false);

    // PDF Queue States
    const [isExporting, setIsExporting] = useState(false);
    const [pdfJobId, setPdfJobId] = useState<string | null>(null);
    const [pdfJobStatus, setPdfJobStatus] = useState<any>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

    const matchingTemplate =
        formTemplates.find((ft) => ft.contract_type_name === selected.contract_type && ft.document_type === docType) ??
        formTemplates.find((ft) => !ft.contract_type_id && ft.document_type === docType);

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
            setFields(tplFields);

            if (subRes.submission && subRes.versions?.length > 0) {
                const latest = subRes.versions[0];
                setFormData(latest.form_data ?? {});
                setOriginalData(latest.form_data ?? {});
                setVersions(subRes.versions);
            } else {
                // NEW: Use prefill_data from backend if available (Professional Inheritance)
                if (subRes.prefill_data && Object.keys(subRes.prefill_data).length > 0) {
                    setFormData(subRes.prefill_data);
                    setOriginalData(subRes.prefill_data);
                } else {
                    // Fallback to frontend autofill
                    const initial: Record<string, any> = {};
                    tplFields.forEach((f) => {
                        if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                            const autofillValue = getAutofillValue(f, selected);
                            initial[f.name] = autofillValue !== null ? autofillValue : '';
                        }
                    });
                    setFormData(initial);
                    setOriginalData(initial);
                }
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
    const isF2 = docType === 'f2';

    const handleSave = async () => {
        if (!matchingTemplate || !isDirty || isF2) return;
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
            const res = await contractApi.formSubmissions.get(selected.id, docType);
            if (res.versions) setVersions(res.versions);
        } catch (e: any) {
            setToast('Gagal menyimpan form.');
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!matchingTemplate) return;
        setIsExporting(true);

        setPdfJobStatus({ status: 'pending', progress: 10 });

        try {
            // Use the locally configured 'api' instance (line 30) instead of raw axios
            // Sending current formData ensures "logic yang sama persis" with the builder
            // Using /admin prefix to resolve routing conflicts
            // Explicitly sending the template ID to prevent "Template not found" errors
            const res = await api.post(`/admin/contracts/${selected.id}/form-submissions/${docType}/export-queue`, {
                data: JSON.stringify(formData),
                form_template_id: matchingTemplate.id,
            });

            const jobId = res.data.job_id;

            setPdfJobId(jobId);

            // Start Polling
            const interval = setInterval(async () => {
                try {
                    const statusRes = await api.get(`/admin/form-templates/pdf-status/${jobId}`);
                    const statusData = statusRes.data;
                    setPdfJobStatus(statusData);

                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        setIsExporting(false);
                        setPdfJobId(null);

                        // Switch to preview mode
                        setPdfPreviewUrl(statusData.url);
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        setIsExporting(false);
                        setPdfJobId(null);
                        alert('Gagal mendownload PDF: ' + (statusData.error || 'Unknown error'));
                    }
                } catch (err) {
                    console.error('Polling failed:', err);
                }
            }, 2000);
        } catch (error: any) {
            console.error('Queue failed:', error);
            setIsExporting(false);
            setPdfJobId(null);
            const msg = error.response?.data?.message || 'Gagal antrikan PDF. Silakan coba lagi nanti.';
            alert(msg);
        }
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
            </div>
        );
    }

    if (loading)
        return (
            <div className="text-muted-foreground py-- text-center text-xs">
                <i className="fa-solid fa-spinner fa-spin mr-2" />
                Memuat form {docType.toUpperCase()}...
            </div>
        );

    const submissionInfo = selected.form_submissions?.find((s) => s.document_type === docType);
    const templateForRenderer = {
        ...matchingTemplate,
        has_letterhead: true,
        letterhead_json: { margins: { top: 10, bottom: 10, left: 15, right: 15 } },
        fields: fields,
    } as any;

    return (
        <div className="bg-card animate-in fade-in flex flex-1 flex-col overflow-hidden duration-500">
            {/* PDF Preview Overlay */}
            {pdfPreviewUrl && (
                <div className="bg-background/90 animate-in fade-in zoom-in-95 fixed inset-0 z-[100] flex flex-col backdrop-blur-xl duration-300">
                    <div className="border-border bg-muted/50 flex h-16 items-center justify-between border-b px-6">
                        <div className="flex flex-col">
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                                <i className="fa-solid fa-file-pdf text-rose-500" /> Preview Dokumen {docType.toUpperCase()}
                            </h3>
                            <span className="text-muted-foreground text-[10px] font-bold">{selected.contract_no} — Ready for Download</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={pdfPreviewUrl}
                                download={`${selected.contract_no}_${docType.toUpperCase()}.pdf`}
                                className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-xs font-bold tracking-widest text-white uppercase shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700"
                            >
                                <Download size={14} /> Download PDF
                            </a>
                            <button
                                onClick={() => setPdfPreviewUrl(null)}
                                className="bg-muted hover:bg-muted/80 text-foreground rounded-md px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-1 justify-center overflow-hidden p-8">
                        <div className="bg-card ring-border animate-in slide-in-from-bottom-5 fill-mode-both h-full w-full max-w-[210mm] overflow-hidden rounded-sm shadow-2xl ring-1 delay-150 duration-500">
                            <iframe src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`} className="h-full w-full border-none" title="PDF Preview" />
                        </div>
                    </div>
                </div>
            )}

            <div className="border-border bg-muted/50 flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h4 className="text-foreground text-xs font-bold tracking-tight uppercase">
                            Form {docType.toUpperCase()} — {docType === 'f1' ? 'Perijinan & Kontrak' : 'Resume & Persetujuan'}
                        </h4>
                        <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">
                            {isF2 ? 'Automated Resume (Read-Only)' : submissionInfo ? 'Sudah Diisi' : 'Draft / Inherited Data'}
                        </span>
                    </div>
                    {submissionInfo && !isF2 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                            v{submissionInfo.current_version}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        className="border-border hover:bg-muted/50 text-muted-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all"
                        title="Refresh data dari server"
                    >
                        <i className="fa-solid fa-arrows-rotate" />
                    </button>
                    {versions.length > 0 && !isF2 && (
                        <button
                            onClick={() => setShowVersions(!showVersions)}
                            className="border-border hover:bg-muted/50 text-muted-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all"
                        >
                            <i className="fa-solid fa-clock-rotate-left" /> {versions.length} versi
                        </button>
                    )}
                    {(submissionInfo || isF2) && (
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isExporting}
                            className="bg-background hover:bg-muted text-foreground border-border flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-xs font-bold tracking-widest uppercase shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 size={12} className="mr-1.5 animate-spin" />
                                    {pdfJobStatus?.status === 'pending' ? 'Queued...' : `Processing ${pdfJobStatus?.progress || 0}%`}
                                </>
                            ) : (
                                <>
                                    <Download size={12} className="mr-1.5" /> Generate PDF
                                </>
                            )}
                        </button>
                    )}

                    {!isF2 && (isDirty || !submissionInfo) && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
                            {submissionInfo ? 'Update Form' : 'Simpan Form'}
                        </button>
                    )}
                </div>
            </div>

            {toast && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                    <i className="fa-solid fa-check-circle mr-2" />
                    {toast}
                </div>
            )}

            {showVersions && !isF2 && (
                <div className="border-border bg-muted/20 mx-auto w-full max-w-4xl space-y-2 rounded-xl border p-4">
                    {versions.map((v) => (
                        <div
                            key={v.id}
                            className="border-border bg-card hover:bg-muted/30 flex cursor-pointer items-center justify-between rounded-lg border p-3"
                            onClick={() => {
                                setFormData(v.form_data);
                                setOriginalData(v.form_data);
                                setShowVersions(false);
                            }}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-mono text-xs font-bold">v{v.version_no}</span>
                                    <span className="text-muted-foreground text-[10px]">{v.created_at}</span>
                                </div>
                                {v.created_by && <div className="text-muted-foreground mt-0.5 text-[10px]">oleh {v.created_by.name}</div>}
                            </div>
                            <i className="fa-solid fa-arrow-right text-muted-foreground text-xs" />
                        </div>
                    ))}
                </div>
            )}

            <div className="relative mx-auto w-full">
                {isDirty && !isF2 && (
                    <div className="absolute top-0 right-0 m-2 p-2">
                        <span className="flex items-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-50 px-2.5 py-1 text-[9px] font-bold tracking-wider text-amber-600 uppercase shadow-sm">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                            Draft Belum Disimpan
                        </span>
                    </div>
                )}

                <div className="py-2">
                    <InteractiveForm
                        template={templateForRenderer}
                        formData={formData}
                        onChange={(name, val) => !isF2 && setFormData((prev) => ({ ...prev, [name]: val }))}
                        readOnly={isF2}
                    />
                </div>

                <div className="border-border text-muted-foreground/50 mt-16 flex items-center justify-between border-t pt-6 text-[9px] font-bold tracking-widest uppercase">
                    <span>Lentera Teknologi Legal System</span>
                    <span>
                        Form {docType.toUpperCase()} / {isF2 ? 'Automated Resume View' : 'Professional Interactive Form'}
                    </span>
                </div>
            </div>

            {!isF2 && (isDirty || !submissionInfo) && (
                <div className="border-border mx-auto flex w-full max-w-4xl items-center justify-between border-t border-dashed pt-6">
                    <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                        <i className="fa-solid fa-triangle-exclamation mr-1.5 text-amber-500" />
                        {submissionInfo
                            ? "Changes detected. Click 'Update Form' to save version."
                            : 'Inherited data from F1 detected. Please review and Save.'}
                    </span>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground ring-primary/10 rounded-md px-6 py-1.5 text-xs font-bold tracking-widest uppercase shadow-xl ring-4 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {saving ? 'Processing...' : submissionInfo ? `Update Form ${docType.toUpperCase()}` : `Simpan Form ${docType.toUpperCase()}`}
                    </button>
                </div>
            )}
        </div>
    );
}
