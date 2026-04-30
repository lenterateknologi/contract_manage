import { useToast } from '@/components/contracts/Toast';
import { FormField } from '@/components/form-renderer/FormElement';
import { InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { SearchInput } from '@/components/ui/forms/SearchInput';
import { Modal } from '@/components/ui/overlays/Modal';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { ArrowRight, Check, ChevronDown, Columns, Download, FileText, FolderOpen, History, Loader2, MoreVertical, PlusCircle } from 'lucide-react';
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
    if (name === 'meta_p1_entity') return 'PT. LENTERA TEKNOLOGI';
    if (name === 'meta_type' || name === 'meta_tipe_perjanjian') return (contract as any).submission_type || (contract as any).transaction_type || '';
    if (name === 'meta_transaction_type') return (contract as any).transaction_type || '';
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
    if (name === 'meta_deskripsi' || name === 'keterangan') return contract.description || '';

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
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [versionNote, setVersionNote] = useState('');
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

                            // Auto-sync is aggressive: if the user hasn't manually edited
                            // the field IN THIS SESSION, we pull the latest from contract info.
                            const isManualEdit = manualFields.has(f.name);
                            const isDateField =
                                f.name === 'meta_tgl_dibuat' ||
                                f.name === 'tanggal' ||
                                f.type === 'date' ||
                                (f.options as any)?.value_type === 'date';

                            if (isManual || !isManualEdit) {
                                // For dates, we only auto-update on manual sync or if empty
                                if (!isManual && isDateField && currentVal) {
                                    return;
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
        [fields, selected, originalData, showToast, manualFields, docType],
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
        // Only show spinner if we don't have fields yet
        if (fields.length === 0) setLoading(true);
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

                // Auto-create V1 if it's a fresh form
                try {
                    const firstVersion = await contractApi.formSubmissions.save(selected.id, {
                        form_template_id: matchingTemplate.id,
                        document_type: docType,
                        form_data: finalInitial,
                        is_new_version: true,
                        change_summary: 'Initial version (Auto-created)',
                    });
                    if (firstVersion.versions) {
                        setVersions(firstVersion.versions as any);
                    }
                } catch (saveErr) {
                    console.error('Failed to auto-create V1', saveErr);
                }
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

    const isDraft = selected.status === 'draft';
    const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const autoSaveTimerRef = useRef<any>(null);

    const latestVersion = versions.length > 0 ? [...versions].sort((a, b) => b.version_no - a.version_no)[0] : null;
    const vno = latestVersion?.version_no;

    // Debounced Auto-Save
    useEffect(() => {
        if (!loading && isDirty && matchingTemplate && isDraft) {
            setAutoSaveStatus('saving');

            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

            autoSaveTimerRef.current = setTimeout(async () => {
                try {
                    await contractApi.formSubmissions.save(selected.id, {
                        form_template_id: matchingTemplate.id,
                        document_type: docType,
                        form_data: formData,
                        is_new_version: false, // Don't bump version on auto-save
                    });
                    setOriginalData({ ...formData });
                    setAutoSaveStatus('saved');
                    // Reset to idle after 3 seconds
                    setTimeout(() => setAutoSaveStatus('idle'), 3000);
                } catch (e) {
                    console.error('Auto-save failed', e);
                    setAutoSaveStatus('error');
                }
            }, 3000); // 3 second debounce
        }

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [formData, loading, matchingTemplate, selected.id, docType, isDirty]);

    const isF2 = docType === 'f2';

    const handleManualSave = async () => {
        if (!matchingTemplate) return;
        setSaving(true);
        try {
            const updated = await contractApi.formSubmissions.save(selected.id, {
                form_template_id: matchingTemplate.id,
                document_type: docType,
                form_data: formData,
                is_new_version: true, // Explicit version bump
                change_summary: versionNote || undefined,
            });
            onContractUpdated(updated);
            setOriginalData({ ...formData });
            showToast(`Versi baru ${docType.toUpperCase()} berhasil disimpan.`, 'success');
            const res = await contractApi.formSubmissions.get(selected.id, docType);
            if (res.versions) setVersions(res.versions);
            setAutoSaveStatus('idle');
            setVersionNote('');
            setShowNoteModal(false);
        } catch (e: any) {
            showToast('Gagal menyimpan data.', 'danger');
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
            <div className="rounded-xl border border-dashed border-black/10 bg-black/5 py-20 text-center dark:border-white/10 dark:bg-white/5">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/10 dark:bg-white/10">
                    <FileText className="text-black/40 dark:text-white/40" size={24} />
                </div>
                <h5 className="mb-1 font-bold tracking-widest text-black uppercase dark:text-white" style={{ fontSize: 12 }}>
                    Belum Ada Template {docType.toUpperCase()}
                </h5>
            </div>
        );
    }

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                <LoadingLottie width={80} height={80} className="mb-4" />
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
        <div className="bg-card animate-in fade-in flex flex-1 flex-col overflow-hidden duration-300">
            {/* PDF Preview Overlay */}
            {pdfPreviewUrl && (
                <div className="dark:bg-sidebar/90 animate-in fade-in zoom-in-95 fixed inset-0 z-[100] flex flex-col bg-white/90 backdrop-blur-md duration-300">
                    <div className="flex h-16 items-center justify-between border-b border-black/10 px-6 dark:border-white/10">
                        <div className="flex flex-col">
                            <h3 className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-black uppercase dark:text-white">
                                <FileText size={16} className="text-black dark:text-white" /> Preview Dokumen {docType.toUpperCase()}
                            </h3>
                            <span className="text-[9px] font-bold tracking-wider text-black/40 uppercase dark:text-white/40">
                                {selected.contract_no} — Ready for Download
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={pdfPreviewUrl}
                                download={`${selected.contract_no}_${docType.toUpperCase()}.pdf`}
                                className="flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-all hover:opacity-90 active:scale-95 dark:bg-white dark:text-black"
                            >
                                <Download size={14} /> Download PDF
                            </a>
                            <button
                                onClick={() => setPdfPreviewUrl(null)}
                                className="rounded-lg bg-black/5 px-4 py-2.5 text-[10px] font-bold tracking-widest text-black uppercase transition-all hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-1 justify-center overflow-hidden p-8">
                        <div className="animate-in slide-in-from-bottom-5 fill-mode-both h-full w-full max-w-[210mm] overflow-hidden rounded-sm bg-white shadow-2xl ring-1 ring-black/10 delay-150 duration-500 dark:ring-white/10">
                            <iframe src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`} className="h-full w-full border-none" title="PDF Preview" />
                        </div>
                    </div>
                </div>
            )}

            <div className="dark:bg-sidebar/80 sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-between border-b border-black/10 bg-white/80 px-6 backdrop-blur-md dark:border-white/10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-[3px] rounded-full bg-black dark:bg-white" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-black dark:text-white">
                                    {docType === 'f1' ? 'Formulir F1 (Internal)' : 'Formulir F2 (Resume)'}
                                </h4>
                                <div className="bg-primary rounded px-1.5 py-0.5 dark:bg-white">
                                    <span className="text-[10px] font-bold text-white dark:text-black">V{submissionInfo?.current_version || 1}</span>
                                </div>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-black dark:text-white">
                                    {docType === 'f1' ? 'Submission Document' : 'Agreement Resume'}
                                </span>
                                <div className="h-1 w-1 rounded-full bg-black dark:bg-white" />
                                <span className="text-[10px] font-bold text-black dark:text-white">
                                    {submissionInfo ? 'Sudah Diisi' : 'Draft Mode'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3" ref={dropdownRef}>
                    {autoSaveStatus !== 'idle' && (
                        <div className="mr-2 flex items-center gap-2 rounded-md bg-black/5 px-2.5 py-1 dark:bg-white/5">
                            {autoSaveStatus === 'saving' && (
                                <>
                                    <Loader2 size={12} className="animate-spin text-black dark:text-white" />
                                    <span className="text-[11px] font-bold text-black dark:text-white">Menyimpan...</span>
                                </>
                            )}
                            {autoSaveStatus === 'saved' && (
                                <>
                                    <Check size={12} className="text-black dark:text-white" />
                                    <span className="text-[11px] text-black dark:text-white">Tersimpan</span>
                                </>
                            )}
                        </div>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setShowVersions(!showVersions)}
                            className={cn(
                                'group flex h-9 items-center gap-2.5 rounded-lg border px-4 transition-all active:scale-95',
                                showVersions
                                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                    : 'border-black bg-white text-black hover:border-black/20 dark:border-white dark:bg-transparent dark:text-white',
                            )}
                        >
                            <History
                                size={16}
                                className={cn(
                                    'transition-colors',
                                    showVersions
                                        ? 'text-white'
                                        : 'text-black/40 group-hover:text-black dark:text-white/40 dark:group-hover:text-white',
                                )}
                            />
                            <span className="text-xs font-semibold">{versions.length || 0} Versi</span>
                            <ChevronDown size={14} className={cn('ml-1 transition-transform', showVersions && 'rotate-180')} />
                        </button>

                        {showVersions && (
                            <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-[999] mt-2 w-80 origin-top-right rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl backdrop-blur-md duration-200 dark:border-white/10 dark:bg-[#1e293b]">
                                <div className="border-b border-black/5 p-3 dark:border-white/5">
                                    <SearchInput
                                        autoFocus
                                        placeholder="Cari riwayat versi..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-9 text-[11px]"
                                    />
                                </div>
                                <div className="max-h-[320px] overflow-y-auto py-1">
                                    {filteredVersions.length > 0 ? (
                                        filteredVersions.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => {
                                                    setFormData(v.form_data);
                                                    setOriginalData(v.form_data);
                                                    setShowVersions(false);
                                                }}
                                                className="group flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition-all hover:bg-black/5 dark:hover:bg-white/5"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="flex h-6 w-6 items-center justify-center rounded bg-black text-[10px] font-bold text-white dark:bg-white dark:text-black">
                                                            {v.version_no}
                                                        </span>
                                                        <span className="text-xs font-bold text-black dark:text-white">Versi {v.version_no}</span>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-black dark:text-white">{v.created_at}</span>
                                                        <div className="h-1 w-1 rounded-full bg-black dark:bg-white" />
                                                        <span className="text-[10px] font-bold text-black dark:text-white">
                                                            {v.created_by?.name || 'System'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowRight
                                                    size={14}
                                                    className="-translate-x-2 text-[#0f172a] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:text-white"
                                                />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-16 text-center">
                                            <FolderOpen className="mx-auto mb-3 text-black dark:text-white" size={24} />
                                            <span className="text-xs font-bold text-black dark:text-white">Data Kosong</span>
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
                                'flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95',
                                showMoreActions
                                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                    : 'border-black bg-white text-black hover:bg-black/5 dark:border-white dark:bg-transparent dark:text-white',
                            )}
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showMoreActions && (
                            <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-[999] mt-2 w-64 origin-top-right rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl backdrop-blur-xl duration-200 dark:border-white/10 dark:bg-[#1e293b]">
                                {versions.length > 1 && (
                                    <a
                                        href={`/admin/contracts/${selected.id}/form-submissions/${docType}/compare`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setShowMoreActions(false)}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-semibold text-[#0f172a] transition-all hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                    >
                                        <Columns size={16} className="opacity-40" />
                                        Bandingkan Versi
                                    </a>
                                )}

                                <button
                                    onClick={() => {
                                        handleExportPdf();
                                        setShowMoreActions(false);
                                    }}
                                    disabled={isExporting}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-semibold text-[#0f172a] transition-all hover:bg-black/5 disabled:opacity-20 dark:text-white dark:hover:bg-white/5"
                                >
                                    {isExporting ? (
                                        <Loader2 size={16} className="animate-spin opacity-40" />
                                    ) : (
                                        <Download size={16} className="opacity-40" />
                                    )}
                                    Ekspor PDF
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Simpan Versi Popup Modal */}
                    <Modal
                        isOpen={showNoteModal}
                        onClose={() => setShowNoteModal(false)}
                        title="Update Versi Dokumen"
                        description="Arsipkan perubahan sebagai versi baru."
                        maxWidth="md"
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-xs font-bold text-black dark:text-white">Catatan Perubahan</label>
                                <textarea
                                    autoFocus
                                    value={versionNote}
                                    onChange={(e) => setVersionNote(e.target.value)}
                                    placeholder="Apa saja yang berubah pada versi ini?"
                                    rows={4}
                                    className="w-full resize-none rounded-2xl border border-black bg-white p-5 text-sm font-medium transition-all outline-none placeholder:text-black focus:ring-2 focus:ring-black dark:border-white dark:bg-transparent dark:text-white dark:placeholder:text-white dark:focus:ring-white"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowNoteModal(false)}
                                    className="flex-1 rounded-xl border-2 border-black bg-white py-4 text-xs font-bold text-black transition-all hover:bg-black hover:text-white active:scale-95 dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-white dark:hover:text-black"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleManualSave}
                                    disabled={saving}
                                    className="flex flex-[1.5] items-center justify-center gap-2.5 rounded-xl bg-black py-4 text-xs font-bold text-white shadow-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-20 dark:bg-white dark:text-black"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Simpan Versi Baru
                                </button>
                            </div>
                        </div>
                    </Modal>

                    <div className="mx-1 h-8 w-px bg-black/10 dark:bg-white/10" />

                    {isDraft && (
                        <button
                            onClick={() => setShowNoteModal(true)}
                            disabled={saving}
                            className="bg-primary flex h-9 items-center gap-2 rounded-lg px-5 text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-20 dark:bg-white dark:text-black"
                        >
                            <PlusCircle size={16} />
                            Update Versi
                        </button>
                    )}
                </div>
            </div>

            <div className="dark:bg-sidebar force-light custom-scrollbar relative flex-1 overflow-y-auto bg-white/50">
                <div className="flex justify-center px-6 py-12">
                    {(selected as any).display_mode === 'pdf' ? (
                        <InteractiveForm
                            template={templateForRenderer}
                            formData={formData}
                            readOnly={true}
                            className={cn('shadow-2xl transition-all duration-300', 'ring-1 shadow-black/20 ring-black/5')}
                        />
                    ) : (
                        <InteractiveForm
                            template={templateForRenderer}
                            formData={formData}
                            onChange={(name, val) => {
                                setManualFields((prev) => new Set(prev).add(name));
                                setFormData((prev) => ({ ...prev, [name]: val }));
                            }}
                            readOnly={!isDraft}
                            className={cn(
                                'shadow-2xl transition-all duration-500',
                                !isDraft ? 'ring-1 shadow-black/20 ring-black/5' : 'shadow-black/10',
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
