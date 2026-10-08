import { Button } from '@/components/ui/buttons/Button';
import { Modal } from '@/components/ui/dialogs/Modal';
import LoadingLottie from '@/components/ui/feedback/LoadingLottie';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { useContractPermissions } from '@/hooks/use-contract-permissions';
import { cn } from '@/lib/utils';
import { Contract, subresourcesApi } from '@/features/Contracts';
import { FormField, UnifiedFormViewer, formTemplatesApi } from '@/features/templates';
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
    const [, setPdfJobId] = useState<string | null>(null);
    const [, setPdfJobStatus] = useState<any>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [fetchedTemplate, setFetchedTemplate] = useState<FormTemplateInfo | null>(null);

    const templateIdMap: Record<string, string | undefined> = {
        f1: selected.f1_form_template_id || selected.modes?.f1_form_template_id,
        f2: selected.f2_form_template_id || selected.modes?.f2_form_template_id,
        contract: selected.contract_form_template_id || selected.agreement_form_template_id || selected.modes?.contract_form_template_id,
        agreement: selected.contract_form_template_id || selected.agreement_form_template_id || selected.modes?.contract_form_template_id,
    };
    const templateId = templateIdMap[docType];

    const matchingTemplate =
        fetchedTemplate ??
        formTemplates.find((ft) => templateId && ft.id === templateId) ??
        formTemplates.find((ft) => selected.contract_type_id && ft.contract_type_id === selected.contract_type_id && ft.document_type === docType) ??
        formTemplates.find((ft) => ft.contract_type_name === selected.contract_type && ft.document_type === docType) ??
        formTemplates.find((ft) => ft.name?.includes('FORMULIR PERMINTAAN PERJANJIAN') && ft.document_type === docType) ??
        formTemplates.find((ft) => !ft.contract_type_id && ft.document_type === docType);

    const { canEdit } = useContractPermissions(selected, docType, meUser?.id);

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

                const p1RelatedFields = new Set(['meta_p1_entity', 'meta_p1_signer', 'meta_p1_signer_position', 'meta_p1_alamat']);
                const p2RelatedFields = new Set([
                    'meta_p2_entity',
                    'meta_p2_signer',
                    'meta_p2_signer_position',
                    'meta_p2_alamat',
                    'meta_lampiran', // vendor document/attachment list
                ]);

                // Detect P1 (First Party / Pembeli) change
                const currentP1Entity = synced['meta_p1_entity'] ?? '';
                const freshP1Entity = getAutofillValue({ name: 'meta_p1_entity' }, selected) ?? '';
                const p1Changed = currentP1Entity && freshP1Entity && currentP1Entity !== freshP1Entity;

                // Detect P2 (Second Party / Penjual) change
                const currentP2Entity = synced['meta_p2_entity'] ?? '';
                const freshP2Entity = getAutofillValue({ name: 'meta_p2_entity' }, selected) ?? '';
                const p2Changed = currentP2Entity && freshP2Entity && currentP2Entity !== freshP2Entity;

                fields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                        const isP1Field = p1RelatedFields.has(f.name);
                        const isP2Field = p2RelatedFields.has(f.name);
                        const forceUpdate = (isP1Field && p1Changed) || (isP2Field && p2Changed);
                        const val = getAutofillValue(f, selected);

                        // For force-update (party changed): apply even if val is null/empty (clears stale data)
                        if (forceUpdate) {
                            const freshVal = val ?? '';
                            if (synced[f.name] !== freshVal) {
                                synced[f.name] = freshVal;
                                hasChanged = true;
                            }
                            return;
                        }

                        if (val !== null && val !== '') {
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
                                // Update if: value differs AND (field is empty or manual sync)
                                if (currentVal !== val && (!currentVal || isManual)) {
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
        let activeTemplate = matchingTemplate;
        if (!activeTemplate && templateId) {
            try {
                const res: any = await formTemplatesApi.detail(templateId);
                const tpl = res?.data ?? res;
                if (tpl?.id) {
                    activeTemplate = tpl;
                    setFetchedTemplate(tpl);
                }
            } catch (err) {
                console.warn('[FormSubmissionTab] Failed to fetch template detail by templateId:', err);
            }
        }
        if (!activeTemplate && selected?.id) {
            try {
                const docRes: any = await contractApi.documentTypes(selected.id, docType);
                const tpl = docRes?.data?.document?.form_template ?? docRes?.data?.documents?.[docType]?.form_template;
                if (tpl?.id) {
                    activeTemplate = tpl;
                    setFetchedTemplate(tpl);
                }
            } catch (err) {
                console.warn('[FormSubmissionTab] Failed to fetch document types config:', err);
            }
        }

        if (!activeTemplate) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [tplRes, subRes]: [any, any] = await Promise.all([
                formTemplatesApi.getFields(activeTemplate.id),
                contractApi.formSubmissions.get(selected.id, docType),
            ]);
            const tplFields: FormField[] = tplRes?.fields ?? tplRes?.data?.fields ?? [];
            setFields(tplFields);
            setManualFields(new Set());

            if (subRes.submission && subRes.versions?.length > 0) {
                const latest = subRes.versions[0];
                const savedData = latest.form_data ?? {};

                const autofilled: Record<string, any> = {};
                tplFields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                        const val = getAutofillValue(f, selected);
                        if (val !== null) autofilled[f.name] = val;
                    }
                });
                const finalData = { ...autofilled, ...(subRes.prefill_data || {}) };
                Object.keys(savedData).forEach((key) => {
                    if (savedData[key] !== null && savedData[key] !== '') {
                        finalData[key] = savedData[key];
                    }
                });

                // --- P1 (First Party / Pembeli) change detection: if P1 has changed since last save, override all P1 fields ---
                const p1RelatedFields = ['meta_p1_entity', 'meta_p1_signer', 'meta_p1_signer_position', 'meta_p1_alamat'];
                const savedP1Entity = savedData['meta_p1_entity'];
                const currentP1Entity = autofilled['meta_p1_entity'] ?? '';
                if (savedP1Entity && currentP1Entity && savedP1Entity !== currentP1Entity) {
                    p1RelatedFields.forEach((key) => {
                        if (autofilled[key] !== undefined && autofilled[key] !== null) {
                            finalData[key] = autofilled[key];
                        }
                    });
                }

                // --- P2 (Vendor / Penjual) change detection: if P2 has changed since last save, override all P2 fields ---
                const p2RelatedFields = [
                    'meta_p2_entity',
                    'meta_p2_signer',
                    'meta_p2_signer_position',
                    'meta_p2_alamat',
                    'meta_lampiran', // vendor document/attachment list
                ];
                const savedP2Entity = savedData['meta_p2_entity'];
                const currentP2Entity = autofilled['meta_p2_entity'] ?? '';
                if (savedP2Entity && currentP2Entity && savedP2Entity !== currentP2Entity) {
                    p2RelatedFields.forEach((key) => {
                        if (autofilled[key] !== undefined && autofilled[key] !== null) {
                            finalData[key] = autofilled[key];
                        }
                    });
                }

                setFormData(finalData);
                setOriginalData(finalData);
                setVersions(subRes.versions);
            } else {
                const initial: Record<string, any> = {};
                tplFields.forEach((f) => {
                    if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                        const autofillValue = getAutofillValue(f, selected);
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
                            form_template_id: activeTemplate.id,
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
    }, [matchingTemplate?.id, templateId, selected.id, docType, formTemplates?.length, canEdit]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
        } catch {
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
                        <script>
                            window.onPdfReady = function(url) {
                                window.location.replace(url);
                            };
                        </script>
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
            const res: any = await subresourcesApi.formSubmissions.queuePdf(selected.id, docType, {
                data: JSON.stringify(formData),
                form_template_id: matchingTemplate.id,
            });

            const jobId = res?.job_id || res?.data?.job_id;

            setPdfJobId(jobId);

            // Start Polling
            let pollCount = 0;
            let errorCount = 0;
            const maxPollCount = 60; // 2 minutes max

            const interval = setInterval(async () => {
                pollCount++;
                try {
                    const statusRes: any = await subresourcesApi.formSubmissions.pdfStatus(jobId);
                    const statusData = statusRes?.data || statusRes;
                    setPdfJobStatus(statusData);

                    // Update Progress Toast
                    showProgress(jobId, `Mempersiapkan Dokumen ${docType.toUpperCase()}...`, statusData.progress || 0);

                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        setIsExporting(false);
                        setPdfJobId(null);

                        const fullUrl = statusData.url.startsWith('http')
                            ? statusData.url
                            : window.location.origin + (statusData.url.startsWith('/') ? '' : '/') + statusData.url;

                        // Update the already opened window
                        const targetWin = (window as any)._pdfWindow;
                        if (targetWin && !targetWin.closed) {
                            try {
                                if (typeof targetWin.onPdfReady === 'function') {
                                    targetWin.onPdfReady(fullUrl);
                                } else {
                                    targetWin.location.replace(fullUrl);
                                }
                            } catch (e) {
                                console.warn('Direct popup navigation fallback:', e);
                                try {
                                    targetWin.location.href = fullUrl;
                                } catch {
                                    window.open(fullUrl, '_blank');
                                }
                            }
                            (window as any)._pdfWindow = null;
                        } else {
                            window.open(fullUrl, '_blank');
                        }

                        hideProgress(jobId);
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        setIsExporting(false);
                        setPdfJobId(null);
                        hideProgress(jobId);

                        const errMsg = statusData.error || 'Terjadi kesalahan saat memproses PDF.';
                        if ((window as any)._pdfWindow && !(window as any)._pdfWindow.closed) {
                            (window as any)._pdfWindow.document.body.innerHTML = `
                                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                                    <h2 style="color: #ef4444;">Gagal Membuat Dokumen</h2>
                                    <p style="color: #64748b;">${errMsg}</p>
                                    <button onclick="window.close()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 15px;">Tutup Halaman</button>
                                </div>
                            `;
                        }
                        showToast('Gagal mendownload PDF: ' + errMsg, 'danger');
                    }
                } catch (err: any) {
                    console.error('Polling failed:', err);
                    errorCount++;
                    if (errorCount >= 5) {
                        clearInterval(interval);
                        setIsExporting(false);
                        setPdfJobId(null);
                        hideProgress(jobId);
                        if ((window as any)._pdfWindow && !(window as any)._pdfWindow.closed) {
                            (window as any)._pdfWindow.document.body.innerHTML = `
                                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                                    <h2 style="color: #ef4444;">Koneksi Terputus</h2>
                                    <p style="color: #64748b;">Gagal memeriksa status pembuatan PDF dari server.</p>
                                    <button onclick="window.close()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 15px;">Tutup Halaman</button>
                                </div>
                            `;
                        }
                        showToast('Gagal memverifikasi status PDF dari server.', 'danger');
                    }
                }

                if (pollCount >= maxPollCount) {
                    clearInterval(interval);
                    setIsExporting(false);
                    setPdfJobId(null);
                    hideProgress(jobId);
                    if ((window as any)._pdfWindow && !(window as any)._pdfWindow.closed) {
                        (window as any)._pdfWindow.document.body.innerHTML = `
                            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                                <h2 style="color: #ef4444;">Waktu Habis (Timeout)</h2>
                                <p style="color: #64748b;">Proses pembuatan dokumen memakan waktu terlalu lama. Silakan coba lagi.</p>
                                <button onclick="window.close()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 15px;">Tutup Halaman</button>
                            </div>
                        `;
                    }
                    showToast('Waktu pembuatan PDF habis (timeout). Silakan coba lagi.', 'danger');
                }
            }, 2000);
        } catch (error: any) {
            console.error('Queue failed:', error);
            setIsExporting(false);
            setPdfJobId(null);
            if ((window as any)._pdfWindow && !(window as any)._pdfWindow.closed) {
                (window as any)._pdfWindow.close();
            }
            const msg = error.response?.data?.message || 'Gagal antrikan PDF. Silakan coba lagi nanti.';
            showToast(msg, 'danger');
        }
    };

    if (loading || !formTemplates || (formTemplates.length === 0 && !matchingTemplate)) {
        return (
            <div className="bg-surface-base animate-in fade-in flex h-full min-h-[400px] w-full flex-1 flex-col items-center justify-center p-12 text-center duration-300">
                <LoadingLottie width={110} height={110} />
                <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-text-main">Memuat Formulir {docType.toUpperCase()}...</p>
                    <p className="text-[11px] text-text-desc">Menyiapkan isian formulir dan riwayat versi</p>
                </div>
            </div>
        );
    }

    if (!matchingTemplate) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center bg-transparent p-12 text-center">
                <div className="mb-4 text-black dark:text-zinc-200">
                    <FileText size={40} strokeWidth={1.5} />
                </div>
                <h4 className="mb-1 text-sm font-bold text-black dark:text-white">Template {docType.toUpperCase()} Belum Tersedia</h4>
                <p className="mb-5 max-w-md text-xs text-black/80 dark:text-zinc-400">
                    Template formulir untuk tipe dokumen ini belum dikonfigurasi pada alur kerja atau jenis kontrak saat ini.
                </p>
            </div>
        );
    }

    const submissionInfo = selected.form_submissions?.find((s) => s.document_type === docType);
    const templateForRenderer = {
        ...matchingTemplate,
        has_letterhead: true,
        letterhead_json: { margins: { top: 15, bottom: 15, left: 15, right: 15 } },
        fields: fields,
    } as any;

    return (
        <div className="bg-surface-base animate-in fade-in flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden p-3 duration-300 lg:p-4">
            {/* PDF Preview Overlay */}
            {pdfPreviewUrl && (
                <div className="animate-in fade-in zoom-in-95 bg-surface-base/90 fixed inset-0 z-[100] flex flex-col backdrop-blur-md duration-300">
                    <div className="border-surface-border flex h-16 items-center justify-between border-b px-6">
                        <div className="flex flex-col">
                            <h3 className="text-text-main flex items-center gap-2 text-[11px] font-semibold uppercase">
                                <FileText size={16} /> Preview Dokumen {docType.toUpperCase()}
                            </h3>
                            <span className="text-text-soft text-[9px] font-medium uppercase">{selected.form_no} — Ready for Download</span>
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

            <div className="bg-primary text-primary-foreground flex h-9.5 max-h-[38px] min-h-[38px] shrink-0 items-center justify-between rounded-xl px-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <FileText size={15} className="text-primary-foreground/90" />
                        <h4 className="text-primary-foreground text-xs font-semibold tracking-tight uppercase">
                            {docType === 'f1' ? 'F1 Internal (Permohonan)' : 'F2 Summary (Ringkasan)'}
                        </h4>
                        <span className="rounded border border-white/30 bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white">
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
                                'flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                                showVersions
                                    ? 'text-primary border-white bg-white font-bold shadow-xs'
                                    : 'border-white/20 bg-white/15 text-white hover:bg-white/25',
                            )}
                        >
                            <History size={13} />
                            <span>{versions.length || 0} Versi</span>
                        </button>

                        {showVersions && (
                            <div className="animate-in fade-in zoom-in-95 border-surface-border bg-surface-base text-foreground absolute top-full right-0 z-[999] mt-2 w-80 origin-top-right rounded-2xl border p-1.5 shadow-2xl backdrop-blur-md duration-200">
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
                                'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border text-xs transition-colors',
                                showMoreActions
                                    ? 'text-primary border-white bg-white shadow-xs'
                                    : 'border-white/20 bg-white/15 text-white hover:bg-white/25',
                            )}
                        >
                            <MoreVertical size={14} />
                        </button>

                        {showMoreActions && (
                            <div className="animate-in fade-in zoom-in-95 border-surface-border bg-surface-base text-foreground absolute top-full right-0 z-[999] mt-2 w-64 origin-top-right rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl duration-200">
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
                            className="text-primary flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold shadow-xs transition-all hover:bg-white/90 disabled:opacity-50"
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
                        headerVariant="primary"
                        headerIcon={<PlusCircle size={18} className="text-white" />}
                        title="Update Versi Dokumen"
                        description="Arsipkan perubahan sebagai versi baru"
                        footer={
                            <div className="flex w-full justify-end gap-2.5">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowNoteModal(false)}
                                    disabled={saving}
                                    className="h-9 border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                                >
                                    Batal
                                </Button>
                                <Button onClick={() => handleSave(true)} disabled={saving} className="h-9 min-w-[140px] text-xs">
                                    {saving ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Check size={15} className="mr-1.5" />}
                                    Simpan Versi Baru
                                </Button>
                            </div>
                        }
                    >
                        <div className="space-y-3 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-[10.5px] font-extrabold text-slate-700 uppercase dark:text-zinc-200">
                                    Catatan Perubahan / Versi
                                </label>
                                <textarea
                                    value={versionNote}
                                    onChange={(e) => setVersionNote(e.target.value)}
                                    placeholder="Contoh: Perbaikan nilai kontrak dan lampiran vendor..."
                                    rows={3}
                                    className="border-surface-border bg-surface-muted/30 text-text-main focus:border-primary focus:ring-primary/10 placeholder:text-text-soft/40 w-full rounded-xl border p-3 text-xs transition-all outline-none focus:ring-2"
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

            <div className="dark:bg-sidebar force-light custom-scrollbar border-surface-border relative flex-1 overflow-y-auto rounded-xl border bg-white/50">
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
