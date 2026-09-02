import { FormField } from '@/pages/form-builder/components/fields/FormElement';
import { UnifiedFormViewer } from '@/pages/form-builder/components/renderer/UnifiedFormViewer';
import { Button } from '@/components/ui/buttons/Button';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { Modal } from '@/components/ui/dialogs/Modal';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import axios from 'axios';
import { ArrowRight, Check, Columns, Download, FileText, FolderOpen, History, Loader2, MoreVertical, PlusCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAutofillValue } from '../parts/autofill';

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

// ═══════════════════════════════════════════════════════════════════════
//  Principal Components
// ═══════════════════════════════════════════════════════════════════════

export function FormSubmissionTab({
    docType,
    selected,
    formTemplates,
    onContractUpdated,
    users = [],
    meUser,
    onFormDirty,
    onFormSave,
}: {
    docType: 'f1' | 'f2' | 'contract';
    selected: Contract;
    formTemplates: FormTemplateInfo[];
    onContractUpdated: (c: Contract) => void;
    users?: any[];
    meUser?: any;
    onFormDirty?: (dirty: boolean) => void;
    onFormSave?: (saveFn: () => Promise<void>) => void;
}) {
    return (
        <GenericFormTab
            docType={docType}
            selected={selected}
            formTemplates={formTemplates}
            onContractUpdated={onContractUpdated}
            users={users}
            meUser={meUser}
            onFormDirty={onFormDirty}
            onFormSave={onFormSave}
        />
    );
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
    users = [],
    meUser,
    onFormDirty,
    onFormSave,
}: {
    docType: 'f1' | 'f2' | 'contract';
    selected: Contract;
    formTemplates: FormTemplateInfo[];
    onContractUpdated: (c: Contract) => void;
    users?: any[];
    meUser?: any;
    onFormDirty?: (dirty: boolean) => void;
    onFormSave?: (saveFn: () => Promise<void>) => void;
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

    const templateId =
        docType === 'f1'
            ? (selected as any).f1_form_template_id
            : docType === 'f2'
                ? (selected as any).f2_form_template_id
                : (selected as any).contract_form_template_id;

    const matchingTemplate =
        formTemplates.find((ft) => templateId && ft.id === templateId) ??
        formTemplates.find((ft) => selected.contract_type_id && ft.contract_type_id === selected.contract_type_id && ft.document_type === docType) ??
        formTemplates.find((ft) => ft.contract_type_name === selected.contract_type && ft.document_type === docType) ??
        formTemplates.find((ft) => ft.name.includes('FORMULIR PERMINTAAN PERJANJIAN') && ft.document_type === docType) ??
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
                        const val = getAutofillValue(f, selected, docType, users);
                        if (val !== null) {
                            const currentVal = synced[f.name];
                            const isManualEdit = manualFields.has(f.name);
                            const isDateField =
                                f.name === 'meta_tgl_dibuat' ||
                                f.name === 'tanggal' ||
                                f.type === 'date' ||
                                (f.options as any)?.value_type === 'date';

                            if (isManual || !isManualEdit) {
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
                if (hasChanged && !isManual) {
                    setOriginalData((origPrev) => ({ ...origPrev, ...synced }));
                }
                return hasChanged ? synced : prev;
            });
            if (isManual) {
                showToast('Data sinkron dengan informasi kontrak & vendor.', 'success');
            }
        },
        [fields, selected, showToast, manualFields, docType, users],
    );
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
        if (fields.length === 0) setLoading(true);
        try {
            const [tplRes, subRes] = await Promise.all([
                api.get(`/api/form-templates/${matchingTemplate.id}/fields`),
                contractApi.formSubmissions.get(selected.id, docType),
            ]);
            const tplFields: FormField[] = tplRes.data.fields ?? [];
            setFields(tplFields);
            setManualFields(new Set());

            if (subRes.submission && subRes.versions?.length > 0) {
                const latest = subRes.versions[0];
                const savedData = latest.form_data ?? {};

                const autofilled: Record<string, any> = {};
                tplFields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                        const val = getAutofillValue(f, selected, docType, users);
                        if (val !== null) autofilled[f.name] = val;
                    }
                });
                const finalData = { ...autofilled, ...(subRes.prefill_data || {}) };
                Object.keys(savedData).forEach((key) => {
                    if (savedData[key] !== null && savedData[key] !== '') {
                        finalData[key] = savedData[key];
                    }
                });

                setFormData(finalData);
                setOriginalData(finalData);
                setVersions(subRes.versions);
            } else {
                const initial: Record<string, any> = {};
                tplFields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                        const autofillValue = getAutofillValue(f, selected, docType, users);
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

                // Auto-create V1 if it's a fresh form AND user has edit permission
                if (canEdit) {
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

    const isCreator = selected.created_by === meUser?.id;
    const isApprover = (selected as any).can_approve;

    const allowFlag =
        docType === 'f1'
            ? selected.allow_f1_edit
            : docType === 'f2'
                ? selected.allow_f2_edit
                : docType === 'contract'
                    ? selected.allow_agreement_edit
                    : selected.allow_info_edit;

    // Strict enforcement: permissions follow workflow flags and participant status ONLY.
    // User must be the current active actor (isApprover) AND the step must allow editing.
    const canEdit = allowFlag !== false && isApprover;

    // DEBUG LOG
    console.log(`[FormSubmissionTab] Debug for ${docType}:`, {
        docType,
        allowFlag,
        isCreator,
        isApprover,
        canEdit,
        meUserId: meUser?.id,
        contractCreatorId: selected.created_by,
        workflowStepId: selected.workflow_step_id,
    });

    const isDirty = useMemo(() => {
        const allKeys = new Set([...Object.keys(formData || {}), ...Object.keys(originalData || {})]);
        for (const key of allKeys) {
            const currentVal = formData[key] ?? '';
            const origVal = originalData[key] ?? '';
            if (String(currentVal).trim() !== String(origVal).trim()) {
                return true;
            }
        }
        return false;
    }, [formData, originalData]);

    useEffect(() => {
        if (canEdit) {
            onFormDirty?.(isDirty);
        }
    }, [isDirty, canEdit, onFormDirty]);

    const handleSave = async (isNewVersion = false) => {
        if (!matchingTemplate) return;
        setSaving(true);
        try {
            const updated = await contractApi.formSubmissions.save(selected.id, {
                form_template_id: matchingTemplate.id,
                document_type: docType,
                form_data: formData,
                is_new_version: isNewVersion,
                change_summary: isNewVersion && versionNote ? versionNote : undefined,
            });
            onContractUpdated(updated);
            setOriginalData({ ...formData });
            onFormDirty?.(false);
            if (isNewVersion) {
                showToast(`Versi baru ${docType.toUpperCase()} berhasil disimpan.`, 'success');
            } else {
                showToast(`Perubahan ${docType.toUpperCase()} berhasil disimpan.`, 'success');
            }
            const res = await contractApi.formSubmissions.get(selected.id, docType);
            if (res.versions) setVersions(res.versions);
            setVersionNote('');
            setShowNoteModal(false);
        } catch (e: any) {
            showToast('Gagal menyimpan data.', 'danger');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (canEdit && onFormSave) {
            onFormSave(() => handleSave(false));
        }
    }, [canEdit, onFormSave, formData, originalData, matchingTemplate]);

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
                `/api/contracts/${selected.id}/form-submissions/${docType}/pdf/queue`,
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
            <div className="border-surface-border bg-white dark:bg-zinc-900 rounded-xl border border-dashed py-20 text-center">
                <div className="bg-surface-base mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full shadow-sm">
                    <FileText className="text-text-soft" size={24} />
                </div>
                <h5 className="text-text-main mb-1 font-semibold uppercase" style={{ fontSize: 12 }}>
                    Belum Ada Template {docType.toUpperCase()}
                </h5>
            </div>
        );
    }

    if (loading)
        return (
            <div className="text-text-soft flex flex-col items-center justify-center py-20 text-[10px] font-semibold uppercase">
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
        <div className="bg-surface-base animate-in fade-in flex flex-1 flex-col overflow-hidden duration-300 p-3 lg:p-4 gap-3">
            {/* PDF Preview Overlay */}
            {pdfPreviewUrl && (
                <div className="animate-in fade-in zoom-in-95 bg-surface-base/90 fixed inset-0 z-[100] flex flex-col backdrop-blur-md duration-300">
                    <div className="border-surface-border flex h-16 items-center justify-between border-b px-6">
                        <div className="flex flex-col">
                            <h3 className="text-text-main flex items-center gap-2 text-[11px] font-semibold uppercase">
                                <FileText size={16} /> Preview Dokumen {docType.toUpperCase()}
                            </h3>
                            <span className="text-text-soft text-[9px] font-medium  uppercase">
                                {selected.form_no} — Ready for Download
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={pdfPreviewUrl}
                                download={`${selected.form_no}_${docType.toUpperCase()}.pdf`}
                                className="bg-primary text-primary-foreground shadow-primary/20 flex h-10 items-center gap-2 rounded-xl px-6 text-[10px] font-medium uppercase shadow-lg transition-all hover:opacity-90 active:scale-95"
                            >
                                <Download size={14} /> Download PDF
                            </a>
                            <Button variant="white" onClick={() => setPdfPreviewUrl(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-1 justify-center overflow-hidden p-8">
                        <div className="animate-in slide-in-from-bottom-5 fill-mode-both border-surface-border h-full w-full max-w-[210mm] overflow-hidden rounded-sm bg-white shadow-2xl ring-1 delay-150 duration-500">
                            <iframe src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`} className="h-full w-full border-none" title="PDF Preview" />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-primary text-primary-foreground shrink-0 flex h-9.5 min-h-[38px] max-h-[38px] items-center justify-between px-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <FileText size={15} className="text-primary-foreground/90" />
                        <h4 className="text-xs font-semibold tracking-tight text-primary-foreground uppercase">
                            {docType === 'f1' ? 'F1 Internal (Permohonan)' : 'F2 Summary (Ringkasan)'}
                        </h4>
                        <span className="rounded bg-white/20 border border-white/30 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            V{submissionInfo?.current_version || 1}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2" ref={dropdownRef}>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowVersions(!showVersions);
                                setShowMoreActions(false);
                            }}
                            className={cn(
                                "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer",
                                showVersions 
                                    ? "bg-white text-primary border-white shadow-xs font-bold" 
                                    : "bg-white/15 hover:bg-white/25 text-white border-white/20"
                            )}
                        >
                            <History size={13} />
                            <span>{versions.length || 0} Versi</span>
                        </button>

                        {showVersions && (
                            <div className="animate-in fade-in zoom-in-95 border-surface-border bg-surface-base absolute top-full right-0 z-[999] mt-2 w-80 origin-top-right rounded-2xl border p-1.5 shadow-2xl backdrop-blur-md duration-200 text-foreground">
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
                                                        <span className="flex h-6 w-6 items-center justify-center rounded bg-black text-[10px] font-medium text-white dark:bg-white dark:text-black">
                                                            {v.version_no}
                                                        </span>
                                                        <span className="text-xs font-medium text-black dark:text-white">Versi {v.version_no}</span>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="text-[10px] font-medium text-black dark:text-white">{v.created_at}</span>
                                                        <div className="h-1 w-1 rounded-full bg-black dark:bg-white" />
                                                        <span className="text-[10px] font-medium text-black dark:text-white">
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
                                            <span className="text-xs font-medium text-black dark:text-white">Data Kosong</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowMoreActions(!showMoreActions);
                                setShowVersions(false);
                            }}
                            className={cn(
                                "flex items-center justify-center h-7 w-7 rounded-lg text-xs transition-colors border cursor-pointer",
                                showMoreActions 
                                    ? "bg-white text-primary border-white shadow-xs" 
                                    : "bg-white/15 hover:bg-white/25 text-white border-white/20"
                            )}
                        >
                            <MoreVertical size={14} />
                        </button>

                        {showMoreActions && (
                            <div className="animate-in fade-in zoom-in-95 border-surface-border bg-surface-base absolute top-full right-0 z-[999] mt-2 w-64 origin-top-right rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl duration-200 text-foreground">
                                {versions.length > 1 && (
                                    <a
                                        href={`/admin/contracts/${selected.id}/form-submissions/${docType}/compare`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setShowMoreActions(false)}
                                        className="text-text-main hover:bg-surface-muted flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-semibold transition-all"
                                    >
                                        <Columns size={16} className="text-text-soft" />
                                        Bandingkan Versi
                                    </a>
                                )}

                                <button
                                    onClick={() => {
                                        handleExportPdf();
                                        setShowMoreActions(false);
                                    }}
                                    disabled={isExporting}
                                    className="text-text-main hover:bg-surface-muted flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-semibold transition-all disabled:opacity-20"
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

                    {canEdit && isDirty && (
                        <button
                            type="button"
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="bg-white text-primary hover:bg-white/90 h-7 px-3 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Simpan
                        </button>
                    )}

                    {/* Simpan Versi Popup Modal */}
                    <Modal
                        isOpen={showNoteModal}
                        onClose={() => setShowNoteModal(false)}
                        maxWidth="lg"
                        title={
                            <div className="bg-primary text-primary-foreground -m-8 flex items-center justify-between px-5 py-3.5 relative overflow-hidden border-b border-white/20">
                                <div className="flex items-center gap-3 z-10">
                                    <div className="bg-white/15 border border-white/20 shadow-xs flex h-9 w-9 items-center justify-center rounded-lg backdrop-blur-xs">
                                        <PlusCircle size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold tracking-wide">Update Versi Dokumen</h3>
                                        <p className="text-white/80 text-[10.5px] font-normal">Arsipkan perubahan sebagai versi baru</p>
                                    </div>
                                </div>
                                {/* Oversized transparent rotated background icon */}
                                <PlusCircle
                                    size={55}
                                    className="absolute right-14 top-1/2 -translate-y-1/2 text-white/15 rotate-12 pointer-events-none select-none"
                                />
                            </div>
                        }
                        footer={
                            <div className="flex w-full justify-end gap-2.5">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowNoteModal(false)}
                                    disabled={saving}
                                    className="h-9 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 font-semibold"
                                >
                                    Batal
                                </Button>
                                <Button onClick={() => handleSave(true)} disabled={saving} className="min-w-[140px] h-9 text-xs">
                                    {saving ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Check size={15} className="mr-1.5" />}
                                    Simpan Versi Baru
                                </Button>
                            </div>
                        }
                    >
                        <div className="space-y-3 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                                    Catatan Perubahan / Versi
                                </label>
                                <textarea
                                    value={versionNote}
                                    onChange={(e) => setVersionNote(e.target.value)}
                                    placeholder="Contoh: Perbaikan nilai kontrak dan lampiran vendor..."
                                    rows={3}
                                    className="w-full rounded-xl border border-surface-border bg-surface-muted/30 p-3 text-xs text-text-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-soft/40"
                                />
                            </div>
                        </div>
                    </Modal>

                    {canEdit && (
                        <Button onClick={() => setShowNoteModal(true)} disabled={saving} className="h-9 px-3 text-xs font-semibold">
                            <PlusCircle size={14} className="mr-1.5" />
                            Update Versi
                        </Button>
                    )}
                </div>
            </div>

            <div className="dark:bg-sidebar force-light custom-scrollbar relative flex-1 overflow-y-auto bg-white/50 rounded-xl border border-surface-border">
                {/* Visual Debug Banner */}
                {/* <div className="flex justify-center pt-6 px-6">
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-full border text-[10px] font-bold uppercase  shadow-sm",
                        canEdit ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"
                    )}>
                        <div className={cn("h-2 w-2 rounded-full animate-pulse", canEdit ? "bg-green-500" : "bg-amber-500")} />
                        MODE: {canEdit ? "EDIT (Interactive Form)" : "VIEW (PDF Preview)"}
                        <span className="opacity-30">|</span>
                        REASON: {allowFlag === false ? "Workflow Locked" : (!isCreator && !isApprover ? "Not Your Turn" : "Allowed")}
                    </div>
                </div> */}

                <div className="flex justify-center px-6 py-12">
                    <UnifiedFormViewer
                        template={templateForRenderer}
                        formData={formData}
                        onChange={(name, val) => {
                            setManualFields((prev) => new Set(prev).add(name));
                            setFormData((prev) => ({ ...prev, [name]: val }));
                        }}
                        mode={canEdit ? 'interactive-form' : 'pdf-preview'}
                    />
                </div>
            </div>
        </div>
    );
}
