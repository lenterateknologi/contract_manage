import { useToast } from '@/components/contracts/Toast';
import { FormField } from '@/components/form-renderer/FormElement';
import { InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { Download, History, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
    { key: 'meta_judul_kontrak', label: 'Judul Perjanjian', width: '1/1' },
    { key: 'meta_tipe_perjanjian', label: 'Tipe Perjanjian', width: '1/2' },
    { key: 'meta_tgl_dibuat', label: 'Tanggal', width: '1/2' },
    { key: 'meta_p1_entity', label: 'Pihak I (PT.)', width: '1/2' },
    { key: 'meta_p2_entity', label: 'Pihak II (PT.)', width: '1/2' },
    { key: 'meta_p1_signer_position', label: 'Penandatangan Pihak I', width: '1/2' },
    { key: 'meta_p2_signer_position', label: 'Penandatangan Pihak II', width: '1/2' },
    { key: 'meta_ringkasan_klausul', label: 'Ringkasan Klausul', width: '1/1' },
    { key: 'meta_masa_berlaku', label: 'Masa Berlaku', width: '1/2' },
    { key: 'meta_lokasi', label: 'Lokasi Area', width: '1/1' },
    { key: 'meta_nilai_transaksi', label: 'Harga / Nilai', width: '1/2' },
    { key: 'meta_mekanisme_pembayaran', label: 'Mekanisme Bayar', width: '1/2' },
    // Signature boxes
    { key: 'meta_pic', label: 'PIC', width: '1/3', type: 'signature_box' },
    { key: 'meta_manager_legal', label: 'Manager Legal', width: '1/3', type: 'signature_box' },
    { key: 'meta_vp_legal', label: 'VP Legal / Management', width: '1/3', type: 'signature_box' },
];

/**
 * Fuzzy matching helper to autofill F1 form fields from general contract data.
 */
const getAutofillValue = (field: any, contract: Contract, docType?: 'f1' | 'f2') => {
    const name = field.name.toLowerCase();

    // Special Case: F2 Ruang Lingkup composite
    if (name === 'meta_ruang_lingkup' && docType === 'f2') {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const crownNo = (contract as any).crown_no || '';
        const signer = contract.p1_signer || (contract as any).initiator?.name || '';
        return `${crownNo}/${dateStr}/${signer}`;
    }

    // 1. Identification / Metadata
    if (name === 'meta_nomor') return contract.contract_no || '';
    if (name === 'meta_nomor_kontrak') return (contract as any).crown_no || '';
    if (name === 'meta_judul') return contract.title || '';
    if (name === 'meta_topik') {
        const type = (contract as any).contract_type;
        return type?.name || (typeof type === 'string' ? type : '');
    }
    if (name === 'meta_sub_topik') return (contract as any).kop_sub_topik || '';
    if (name === 'meta_lampiran') {
        const vendor = (contract as any).vendor;
        const docs = vendor?.documents || [];
        if (docs.length === 0) return '';
        if (docs.length > 3) {
            return (
                docs
                    .slice(0, 3)
                    .map((d: any, i: number) => `${i + 1}. ${d.name}`)
                    .join(', ') + `, dan +${docs.length - 3} lainnya`
            );
        }
        return docs.map((d: any, i: number) => `${i + 1}. ${d.name}`).join(', ');
    }

    // 2. Dates
    if (name === 'meta_tgl_dibuat' || name === 'tanggal') {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const isDateField = field.type === 'date' || field.options?.value_type === 'date';
        return isDateField ? dateStr : `${dateStr} ${timeStr}`;
    }
    if (name === 'meta_masa_berlaku') {
        if (contract.contract_date && contract.end_date) {
            return `${contract.contract_date.split(' ')[0]} s/d ${contract.end_date.split(' ')[0]}`;
        }
        return '';
    }

    // 3. Parties & Metadata
    if (name === 'meta_p1_name' || name === 'meta_p1_entity') return 'PT. LENTERA TEKNOLOGI';
    if (name === 'meta_type' || name === 'meta_tipe_perjanjian') return (contract as any).submission_type || '';
    if (name === 'meta_p1_signer') return contract.p1_signer || (contract as any).initiator?.name || '';
    if (name === 'meta_p1_signer_position') return contract.p1_signer_position || (contract as any).initiator?.role || '';
    if (name === 'meta_p1_alamat') return 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan';

    const vendor = (contract as any).vendor;
    if (name === 'meta_p2_entity') return vendor?.name || '';
    if (name === 'meta_p2_signer') return vendor?.pic_name || '';
    if (name === 'meta_p2_signer_position') return vendor?.pic_position || '';
    if (name === 'meta_p2_alamat') return vendor?.address || '';

    if (name === 'meta_lokasi') return (contract as any).location || '';
    if (name === 'meta_nilai_transaksi') return (contract as any).amount || '';
    if (name === 'meta_mekanisme_pembayaran') return (contract as any).payment_terms || '';

    // Fallback
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
    const { showToast, showProgress, hideProgress } = useToast();
    const [fields, setFields] = useState<FormField[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [originalData, setOriginalData] = useState<Record<string, any>>({});
    const [versions, setVersions] = useState<VersionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [manualFields, setManualFields] = useState<Set<string>>(new Set());

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowVersions(false);
                setShowMoreActions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showVersions, showMoreActions]);

    // PDF Queue States
    const [isExporting, setIsExporting] = useState(false);
    const [pdfJobId, setPdfJobId] = useState<string | null>(null);
    const [pdfJobStatus, setPdfJobStatus] = useState<any>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

    const matchingTemplate =
        formTemplates.find((ft) => ft.contract_type_name === selected.contract_type && ft.document_type === docType) ??
        formTemplates.find((ft) => !ft.contract_type_id && ft.document_type === docType);

    const filteredVersions = versions.filter((v) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return v.version_no.toString().includes(q) || v.created_by?.name?.toLowerCase().includes(q) || v.created_at.toLowerCase().includes(q);
    });

    const handleSync = useCallback(
        (isManual = false) => {
            setFormData((prev) => {
                const synced = { ...prev };
                let hasChanged = false;
                fields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                        const val = getAutofillValue(f, selected, docType);
                        if (val !== null) {
                            // Date fields marked as meta_tgl_dibuat/tanggal are always updated to current time
                            // Other fields use the "Smart Sync" logic to preserve manual edits.
                            const currentVal = synced[f.name];
                            const serverVal = originalData[f.name];

                            // A field is safe to auto-sync if:
                            // 1. It's a manual sync trigger.
                            // 2. The field has never been manually edited by the user in this session (manualFields).
                            // 3. The current value still matches the last known server state (isUntouched).

                            const isManualEdit = manualFields.has(f.name);
                            const isUntouched = currentVal === serverVal;

                            // Special case: Avoid auto-syncing "Date" fields that already have a value
                            // unless it's a manual sync trigger. This prevents "Date Created" from
                            // resetting to "today" every single time the form is opened.
                            const isDateField = f.name === 'meta_tgl_dibuat' || f.name === 'tanggal' || f.type === 'date' || (f.options as any)?.value_type === 'date';

                            if (isManual || (!isManualEdit && (isUntouched || !currentVal))) {
                                if (!isManual && isDateField && currentVal) {
                                    return; // Keep existing date
                                }

                                if (currentVal !== val) {
                                    synced[f.name] = val;
                                    hasChanged = true;
                                }
                            }
                        }
                    }
                });
                return hasChanged ? synced : prev;
            });
            if (isManual) {
                showToast('Data sinkron dengan informasi kontrak & vendor.', 'success');
            }
        },
        [fields, selected, originalData, showToast],
    );

    // Auto-sync whenever contract metadata changes
    useEffect(() => {
        if (!loading && fields.length > 0) {
            handleSync(false);
        }
    }, [selected, loading, fields.length, handleSync]);

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
            setManualFields(new Set()); // Reset tracking on fresh load

            if (subRes.submission && subRes.versions?.length > 0) {
                const latest = subRes.versions[0];
                const savedData = latest.form_data ?? {};

                // Generate full autofill set
                const autofilled: Record<string, any> = {};
                tplFields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                        const val = getAutofillValue(f, selected, docType);
                        if (val !== null) autofilled[f.name] = val;
                    }
                });

                // Merge: savedData wins for most fields, but ONLY if they are not empty.
                // This ensures newly added metadata features populate even on old saved forms.
                const finalData = { ...autofilled, ...(subRes.prefill_data || {}) };
                Object.keys(savedData).forEach((key) => {
                    if (savedData[key] !== null && savedData[key] !== '') {
                        finalData[key] = savedData[key];
                    }
                });

                setFormData(finalData);
                setOriginalData(savedData);
                setVersions(subRes.versions);
            } else {
                // No submission yet
                const initial: Record<string, any> = {};
                tplFields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                        const autofillValue = getAutofillValue(f, selected, docType);
                        initial[f.name] = autofillValue !== null ? autofillValue : '';
                    }
                });

                const finalInitial = {
                    ...initial,
                    ...(subRes.prefill_data || {}),
                };

                setFormData(finalInitial);
                setOriginalData(finalInitial);
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
            showToast(`Form ${docType.toUpperCase()} berhasil disimpan.`, 'success');
            const res = await contractApi.formSubmissions.get(selected.id, docType);
            if (res.versions) setVersions(res.versions);
        } catch (e: any) {
            showToast('Gagal menyimpan form.', 'danger');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPdf = async () => {
        if (!matchingTemplate) return;
        setIsExporting(true);
        setPdfJobStatus({ progress: 0, status: 'pending' });

        // Open window immediately to avoid pop-up blocker
        const win = window.open('about:blank', '_blank');
        (window as any)._pdfWindow = win;
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>Mempersiapkan Dokumen...</title>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                        <style>
                            body { font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #1e293b; }
                            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); text-align: center; border: 1px solid #e2e8f0; max-width: 400px; }
                            .loader { width: 48px; height: 48px; border: 5px solid #f1f5f9; border-top: 5px solid #0f172a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 24px; }
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            h2 { font-size: 14px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 12px; }
                            p { font-size: 11px; color: #64748b; font-weight: 500; line-height: 1.6; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <div class="loader"></div>
                            <h2>Mempersiapkan Dokumen</h2>
                            <p>Mohon tunggu sebentar, file sedang diproses di server. Halaman ini akan otomatis beralih ke dokumen setelah siap.</p>
                        </div>
                    </body>
                </html>
            `);
            win.document.close();
        }

        try {
            const res = await axios.post(
                `/admin/contracts/${selected.id}/form-submissions/${docType}/export-queue`,
                {
                    data: JSON.stringify(formData),
                    form_template_id: matchingTemplate.id,
                },
                {
                    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                    withCredentials: true,
                },
            );

            const jobId = res.data.job_id;

            setPdfJobId(jobId);

            // Start Polling
            const interval = setInterval(async () => {
                try {
                    const statusRes = await axios.get(`/admin/form-templates/pdf-status/${jobId}`, {
                        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                        withCredentials: true,
                    });
                    const statusData = statusRes.data;
                    setPdfJobStatus(statusData);

                    // Update Progress Toast
                    showProgress(jobId, `Mempersiapkan Dokumen ${docType.toUpperCase()}...`, statusData.progress || 0);

                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        setIsExporting(false);
                        setPdfJobId(null);

                        // Update the already opened window
                        if ((window as any)._pdfWindow) {
                            (window as any)._pdfWindow.location.href = statusData.url;
                            (window as any)._pdfWindow = null;
                        } else {
                            // Fallback if window was closed or not opened
                            window.open(statusData.url, '_blank');
                        }

                        setIsExporting(false);
                        setPdfJobId(null);
                        hideProgress(jobId);
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        setIsExporting(false);
                        setPdfJobId(null);
                        hideProgress(jobId);
                        showToast('Gagal mendownload PDF: ' + (statusData.error || 'Unknown error'), 'danger');
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
            showToast(msg, 'danger');
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
        letterhead_json: { margins: { top: 15, bottom: 15, left: 15, right: 15 } },
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

            <div className="border-border/60 sticky top-0 z-40 flex h-[60px] shrink-0 items-center justify-between border-b bg-white/50 px-6 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-1 rounded-full bg-slate-900" />
                            <h4 className="text-[10px] leading-none font-black tracking-tighter text-slate-900 uppercase">
                                {docType === 'f1' ? 'Formulir F1 (Internal)' : 'Formulir F2 (Resume)'}
                            </h4>
                            <span className="animate-in fade-in zoom-in rounded bg-slate-950 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white uppercase duration-500">
                                V{submissionInfo?.current_version || 1}
                            </span>
                        </div>
                        <span
                            className={cn(
                                'mt-1 text-[8px] font-black tracking-[0.2em] uppercase',
                                submissionInfo ? 'text-emerald-500' : 'text-indigo-500',
                            )}
                        >
                            {docType === 'f1'
                                ? submissionInfo
                                    ? 'Sudah Diisi'
                                    : 'Draft / Inherited Data'
                                : submissionInfo
                                  ? 'Resume Disimpan'
                                  : 'Resume & Persetujuan (Editable)'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2.5" ref={dropdownRef}>
                    <div className="relative">
                        <button
                            onClick={() => setShowVersions(!showVersions)}
                            className={cn(
                                'border-border flex h-7 items-center gap-1.5 rounded-xl border bg-white px-3 text-[9px] font-black tracking-widest uppercase shadow-sm transition-all active:scale-95',
                                showVersions ? 'border-slate-900 bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50',
                            )}
                        >
                            <History size={11} className={cn('text-indigo-500', showVersions && 'text-white')} />
                            {versions.length || 0} <span className={cn('opacity-40', showVersions && 'opacity-60')}>VERSIONS</span>
                            <i className={cn('fa-solid fa-chevron-down ml-1 text-[8px] transition-transform', showVersions && 'rotate-180')} />
                        </button>

                        {showVersions && (
                            <div className="animate-in fade-in zoom-in-95 absolute top-full left-0 z-[999] mt-2 w-72 origin-top-left rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/50 duration-200 outline-none">
                                <div className="border-b border-slate-100 p-2">
                                    <div className="relative">
                                        <i className="fa-solid fa-magnifying-glass absolute top-1/2 left-3 -translate-y-1/2 text-[10px] text-slate-400" />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Cari versi..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full rounded-lg border border-slate-100 bg-slate-50 py-1.5 pr-3 pl-8 text-[11px] font-bold transition-all outline-none focus:border-indigo-200 focus:bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto py-1">
                                    {filteredVersions.length > 0 ? (
                                        filteredVersions.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => {
                                                    setFormData(v.form_data);
                                                    setOriginalData(v.form_data);
                                                    setShowVersions(false);
                                                }}
                                                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all hover:bg-slate-50"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                                            {v.version_no}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-slate-800">Version {v.version_no}</span>
                                                    </div>
                                                    <span className="mt-1 text-[9px] font-medium tracking-tight text-slate-400 uppercase">
                                                        {v.created_at} · {v.created_by?.name || 'System'}
                                                    </span>
                                                </div>
                                                <i className="fa-solid fa-arrow-right -translate-x-2 text-[10px] text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center">
                                            <i className="fa-solid fa-folder-open mb-2 block text-xl text-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tidak ada versi ditemukan</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowMoreActions(!showMoreActions)}
                            className={cn(
                                'border-border flex h-7 w-7 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-95',
                                showMoreActions ? 'border-slate-900 bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50',
                            )}
                        >
                            <i className="fa-solid fa-ellipsis-vertical text-[10px]" />
                        </button>

                        {showMoreActions && (
                            <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-[999] mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/50 duration-200 outline-none">
                                <a
                                    href={`/admin/contracts/${selected.id}/form-submissions/${docType}/compare`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setShowMoreActions(false)}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-orange-600 transition-all hover:bg-orange-50"
                                >
                                    <i className="fa-solid fa-columns w-4 text-[10px] opacity-60" />
                                    COMPARE VERSIONS
                                </a>

                                {(submissionInfo || docType === 'f1' || docType === 'f2') && (
                                    <button
                                        onClick={() => {
                                            handleExportPdf();
                                            setShowMoreActions(false);
                                        }}
                                        disabled={isExporting}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                                    >
                                        {isExporting ? (
                                            <Loader2 size={12} className="animate-spin opacity-40" />
                                        ) : (
                                            <Download size={12} className="opacity-40" />
                                        )}
                                        EXPORT PDF DOCUMENT
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex h-7 items-center gap-2 rounded-xl bg-slate-900 px-5 text-[9px] font-black tracking-widest text-white uppercase shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
                        {submissionInfo ? 'Update Form' : 'Simpan Data'}
                    </button>
                </div>
            </div>

            <div className="relative flex-1 overflow-y-auto bg-slate-50/50">
                {isDirty && (
                    <div className="pointer-events-none sticky top-0 right-0 z-50 flex justify-end p-4">
                        <span className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-50 px-2.5 py-1 text-[9px] font-bold tracking-wider text-amber-600 uppercase shadow-md backdrop-blur-sm transition-all hover:scale-105">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                            Draft Belum Disimpan
                        </span>
                    </div>
                )}

                <div className="flex justify-center px-4 py-6">
                    <InteractiveForm
                        template={templateForRenderer}
                        formData={formData}
                        onChange={(name, val) => {
                            setManualFields((prev) => new Set(prev).add(name));
                            setFormData((prev) => ({ ...prev, [name]: val }));
                        }}
                        readOnly={false}
                        className="shadow-2xl shadow-slate-200/50"
                    />
                </div>
            </div>
        </div>
    );
}
