import { FormField } from '@/components/form-renderer/FormElement';
import { InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { useToast } from '@/components/contracts/Toast';
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

    // Party Representatives (F1 & F2 Mapping)
    // PIHAK PERTAMA (Internal / User)
    const p1Names = ['nama_pihak_1', 'perwakilan_pihak_1', 'nama_perwakilan_1', 'nama_pihak_pertama'];
    const p1Positions = ['jabatan_pihak_1', 'jabatan_perwakilan_1', 'jabatan_pihak_pertama'];
    const p1Companies = ['nama_perusahaan_1', 'pihak_pertama', 'nama_pihak_1_perusahaan'];

    if (p1Names.some(n => name.includes(n)) || label.includes('nama pihak pertama') || label === 'nama (pihak 1)') {
        return contract.initiator?.name || contract.creator?.name || '';
    }
    if (p1Positions.some(n => name.includes(n)) || label.includes('jabatan pihak pertama') || label === 'jabatan (pihak 1)') {
        return (contract.metadata as any)?.jabatan_pihak_1 || contract.initiator?.role || contract.creator?.role || 'Direktur';
    }
    if (p1Companies.some(n => name.includes(n)) || label.includes('perusahaan pihak pertama')) {
        return 'PT. Lentera Teknologi'; // Default company name if not specifically in metadata
    }

    // PIHAK KEDUA (Vendor / Partner)
    const p2Names = ['nama_pihak_2', 'perwakilan_pihak_2', 'nama_perwakilan_2', 'nama_pihak_kedua', 'nama_vendor'];
    const p2Positions = ['jabatan_pihak_2', 'jabatan_perwakilan_2', 'jabatan_pihak_kedua', 'jabatan_vendor'];
    const p2Companies = ['nama_perusahaan_2', 'pihak_kedua', 'nama_pihak_2_perusahaan', 'vendor_name'];
    const p2Address = ['alamat_pihak_2', 'alamat_vendor', 'alamat_perusahaan_2'];

    const vendor = (contract as any).vendor;

    if (p2Names.some(n => name.includes(n)) || label.includes('nama pihak kedua') || label === 'nama (pihak 2)') {
        return vendor?.pic_name || (contract.metadata as any)?.nama_pihak_2 || '';
    }
    if (p2Positions.some(n => name.includes(n)) || label.includes('jabatan pihak kedua') || label === 'jabatan (pihak 2)') {
        return vendor?.pic_position || (contract.metadata as any)?.jabatan_pihak_2 || 'Kuasa Direksi';
    }
    if (p2Companies.some(n => name.includes(n)) || label.includes('perusahaan pihak kedua') || label === 'nama vendor') {
        return vendor?.name || (contract.metadata as any)?.nama_perusahaan_2 || '';
    }
    if (p2Address.some(n => name.includes(n)) || label.includes('alamat pihak kedua') || label.includes('alamat vendor')) {
        return vendor?.address || (contract.metadata as any)?.alamat_pihak_2 || '';
    }

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
    const { showToast } = useToast();
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
        return (
            v.version_no.toString().includes(q) ||
            v.created_by?.name?.toLowerCase().includes(q) ||
            v.created_at.toLowerCase().includes(q)
        );
    });

    const handleSync = () => {
        const synced = { ...formData };
        fields.forEach((f) => {
            if (f.type !== 'kop_surat' && f.type !== 'form_title') {
                const val = getAutofillValue(f, selected);
                if (val !== null) {
                    synced[f.name] = val;
                }
            }
        });
        setFormData(synced);
        showToast('Data sinkron dengan informasi kontrak & vendor.', 'success');
    };

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

            <div className="border-border/60 sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-between border-b bg-white/50 px-6 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-1 rounded-full bg-slate-900" />
                            <h4 className="text-[11px] leading-none font-black tracking-tighter text-slate-900 uppercase">
                                {docType === 'f1' ? 'Formulir F1 (Internal)' : 'Formulir F2 (Resume)'}
                            </h4>
                            <span className="animate-in fade-in zoom-in rounded bg-slate-950 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white uppercase duration-500">
                                V{submissionInfo?.current_version || 1}
                            </span>
                        </div>
                        <span
                            className={cn(
                                'mt-1.5 text-[9px] font-black tracking-[0.2em] uppercase',
                                submissionInfo ? 'text-emerald-500' : 'text-indigo-500',
                            )}
                        >
                            {docType === 'f1' ? (submissionInfo ? 'Sudah Diisi' : 'Draft / Inherited Data') : (submissionInfo ? 'Resume Disimpan' : 'Resume & Persetujuan (Editable)')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2.5" ref={dropdownRef}>
                    <div className="relative">
                            <button
                                onClick={() => setShowVersions(!showVersions)}
                                className={cn(
                                    "border-border flex h-8 items-center gap-1.5 rounded-xl border bg-white px-3 text-[9px] font-black tracking-widest uppercase shadow-sm transition-all active:scale-95",
                                    showVersions ? "bg-slate-900 border-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <History size={11} className={cn('text-indigo-500', showVersions && 'text-white')} />
                                {versions.length || 0} <span className={cn("opacity-40", showVersions && "opacity-60")}>VERSIONS</span>
                                <i className={cn("fa-solid fa-chevron-down ml-1 text-[8px] transition-transform", showVersions && "rotate-180")} />
                            </button>

                            {showVersions && (
                                <div className="absolute left-0 top-full z-[999] mt-2 w-72 origin-top-left rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200 outline-none">
                                    <div className="border-b border-slate-100 p-2">
                                        <div className="relative">
                                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Cari versi..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full rounded-lg border border-slate-100 bg-slate-50 py-1.5 pl-8 pr-3 text-[11px] font-bold outline-none focus:border-indigo-200 focus:bg-white transition-all"
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
                                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all hover:bg-slate-50 group"
                                                >
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                                {v.version_no}
                                                            </span>
                                                            <span className="text-[11px] font-bold text-slate-800">Version {v.version_no}</span>
                                                        </div>
                                                        <span className="mt-1 text-[9px] font-medium text-slate-400 uppercase tracking-tight">
                                                            {v.created_at} · {v.created_by?.name || 'System'}
                                                        </span>
                                                    </div>
                                                    <i className="fa-solid fa-arrow-right text-[10px] text-slate-300 opacity-0 transition-all -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100" />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center">
                                                <i className="fa-solid fa-folder-open mb-2 block text-slate-200 text-xl" />
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
                                "border-border flex h-8 w-8 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-95",
                                showMoreActions ? "bg-slate-900 border-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <i className="fa-solid fa-ellipsis-vertical text-[10px]" />
                        </button>

                        {showMoreActions && (
                            <div className="absolute right-0 top-full z-[999] mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200 outline-none">
                                <button
                                    onClick={() => { loadData(); setShowMoreActions(false); }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                                >
                                    <i className="fa-solid fa-arrows-rotate w-4 text-[10px] opacity-40" />
                                    REFRESH DATA
                                </button>

                                <button
                                    onClick={() => { handleSync(); setShowMoreActions(false); }}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-indigo-600 transition-all hover:bg-indigo-50"
                                >
                                    <i className="fa-solid fa-sync w-4 text-[10px] opacity-60" />
                                    SYCHRONIZE DATA
                                </button>

                                <a
                                    href={`/admin/contracts/${selected.id}/form-submissions/${docType}/compare`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setShowMoreActions(false)}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-orange-600 transition-all hover:bg-orange-50"
                                >
                                    <i className="fa-solid fa-columns w-4 text-[10px] opacity-60" />
                                    COMPARE VERSIONS
                                </a >

                                {(submissionInfo || isF2) && (
                                    <button
                                        onClick={() => { handleDownloadPdf(); setShowMoreActions(false); }}
                                        disabled={isExporting}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                                    >
                                        {isExporting ? <Loader2 size={12} className="animate-spin opacity-40" /> : <Download size={12} className="opacity-40" />}
                                        EXPORT PDF DOCUMENT
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex h-8 items-center gap-2 rounded-xl bg-slate-900 px-5 text-[9px] font-black tracking-widest text-white uppercase shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
                        {submissionInfo ? 'Update Form' : 'Simpan Data'}
                    </button>
                </div>
            </div>




            <div className="relative mx-auto w-full">
                {isDirty && (
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
                        onChange={(name, val) => setFormData((prev) => ({ ...prev, [name]: val }))}
                        readOnly={false}
                    />
                </div>
            </div>
        </div>
    );
}
