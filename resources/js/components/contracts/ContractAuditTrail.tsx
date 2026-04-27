import { useToast } from '@/components/contracts/Toast';
import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Contract } from '@/types/contracts';
import axios from 'axios';
import { Check, Clock, Download, ExternalLink, FileText, Loader2, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Props {
    contract: Contract;
}

export default function ContractAuditTrail({ contract }: Props) {
    const { showToast, showProgress, hideProgress } = useToast();
    const [histories, setHistories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        actor_id: '',
        date_from: '',
        date_to: '',
        search: '',
    });

    const [users, setUsers] = useState<any[]>([]);

    // PDF Queue States
    const [isExporting, setIsExporting] = useState(false);
    const [pdfJobId, setPdfJobId] = useState<string | null>(null);
    const [pdfJobStatus, setPdfJobStatus] = useState<any>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        contractApi.getUsers().then(setUsers);
        fetchHistories();
    }, [contract.id]);

    const fetchHistories = async (currentFilters = filters) => {
        setLoading(true);
        try {
            const data = await contractApi.auditTrail.list(contract.id, currentFilters);
            setHistories(data);
        } catch (err) {
            console.error('Failed to fetch audit trail', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        fetchHistories(newFilters);
    };

    const openDocumentView = () => {
        const params = new URLSearchParams(filters as any).toString();
        window.open(`/api/contracts/${contract.id}/audit-trail/document?${params}`, '_blank');
    };

    const handleExportPdf = async () => {
        setIsExporting(true);
        setPdfJobStatus({ progress: 0, status: 'pending' });

        // Open window immediately to avoid pop-up blocker
        const win = window.open('about:blank', '_blank');
        (window as any)._auditWindow = win;
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>Mempersiapkan Audit Trail...</title>
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
                            <h2>Mempersiapkan Dokumen Audit</h2>
                            <p>Mohon tunggu sebentar, log aktivitas sedang dikonversi menjadi PDF. Halaman ini akan otomatis beralih ke dokumen setelah siap.</p>
                        </div>
                    </body>
                </html>
            `);
            win.document.close();
        }

        try {
            const params = new URLSearchParams(filters as any).toString();
            // Use same pattern as F1/F2: hit the queue route
            const res = await axios.get(`/api/contracts/${contract.id}/audit-trail/pdf/queue?${params}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                withCredentials: true,
            });

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
                    showProgress(jobId, 'Mempersiapkan Dokumen Audit...', statusData.progress || 0);

                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        
                        // Update the already opened window
                        if ((window as any)._auditWindow) {
                            (window as any)._auditWindow.location.href = statusData.url;
                            (window as any)._auditWindow = null;
                        } else {
                            // Fallback
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
                        showToast('Export PDF gagal: ' + (statusData.error || 'Unknown error'), 'danger');
                        
                        if ((window as any)._auditWindow) {
                            (window as any)._auditWindow.close();
                            (window as any)._auditWindow = null;
                        }
                    }
                } catch (pollErr) {
                    console.error('Polling error', pollErr);
                }
            }, 2000);
        } catch (err: any) {
            console.error('Export failed', err);
            setIsExporting(false);
            showToast('Gagal mengekspor PDF.', 'danger');
        }
    };

    const getActionIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('approve'))
            return (
                <div className="rounded-full bg-emerald-500 p-1.5 text-white">
                    <Check size={12} strokeWidth={4} />
                </div>
            );
        if (a.includes('reject'))
            return (
                <div className="rounded-full bg-rose-500 p-1.5 text-white">
                    <X size={12} strokeWidth={4} />
                </div>
            );
        if (a.includes('submitted'))
            return (
                <div className="rounded-full bg-sky-500 p-1.5 text-white">
                    <Clock size={12} strokeWidth={4} />
                </div>
            );
        if (a.includes('created'))
            return (
                <div className="rounded-full bg-slate-500 p-1.5 text-white">
                    <ExternalLink size={12} strokeWidth={4} />
                </div>
            );
        return (
            <div className="rounded-full bg-amber-500 p-1.5 text-white">
                <FileText size={12} strokeWidth={4} />
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-500">
            {/* Header / Actions Area */}
            <div className="border-border/50 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
                <div>
                    <h3 className="text-foreground text-sm font-black tracking-widest uppercase">Riwayat Aktivitas</h3>
                    <p className="text-muted-foreground mt-1 text-[10px] font-medium">Log komprehensif seluruh aktivitas pada kontrak ini.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-950 bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {isExporting ? `Processing (${pdfJobStatus?.progress || 0}%)` : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* PDF Preview Overlay (Synced with F1/F2 style) */}
            {pdfPreviewUrl && (
                <div className="bg-background/90 animate-in fade-in zoom-in-95 fixed inset-0 z-[100] flex flex-col backdrop-blur-xl duration-300">
                    <div className="border-border flex h-16 items-center justify-between border-b bg-slate-50 px-6">
                        <div className="flex flex-col">
                            <h3 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                                <i className="fa-solid fa-file-pdf text-rose-500" /> Export Audit Trail
                            </h3>
                            <span className="text-muted-foreground text-[10px] font-bold">{contract.contract_no} — Generation Complete</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={pdfPreviewUrl}
                                download={`Audit_Trail_${contract.id}.pdf`}
                                className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-xs font-bold tracking-widest text-white uppercase shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700"
                            >
                                <Download size={14} /> Download PDF
                            </a>
                            <button
                                onClick={() => setPdfPreviewUrl(null)}
                                className="text-foreground rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all hover:bg-slate-50"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-1 justify-center overflow-hidden p-8">
                        <div className="ring-border animate-in slide-in-from-bottom-5 fill-mode-both h-full w-full max-w-[210mm] overflow-hidden rounded-sm bg-white shadow-2xl ring-1 delay-150 duration-500">
                            <iframe src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`} className="h-full w-full border-none" title="Audit Trail Preview" />
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Filter Area */}
            <div className="border-border/40 grid grid-cols-1 gap-3 rounded-xl border bg-slate-50/50 p-4 md:grid-cols-4">
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Cari deskripsi..."
                        className="border-border placeholder:text-muted-foreground focus:ring-primary/10 focus:border-primary h-9 w-full rounded-lg border bg-white pr-4 pl-9 text-[11px] font-medium transition-all outline-none focus:ring-2"
                    />
                </div>
                <select
                    name="actor_id"
                    value={filters.actor_id}
                    onChange={handleFilterChange}
                    className="border-border text-foreground focus:ring-primary/10 focus:border-primary h-9 rounded-lg border bg-white px-3 text-[11px] font-bold transition-all outline-none hover:border-slate-300 focus:ring-2"
                >
                    <option value="">Semua Aktor</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    name="date_from"
                    value={filters.date_from}
                    onChange={handleFilterChange}
                    className="border-border text-foreground focus:ring-primary/10 focus:border-primary h-9 rounded-lg border bg-white px-3 text-[11px] font-bold transition-all outline-none focus:ring-2"
                />
                <input
                    type="date"
                    name="date_to"
                    value={filters.date_to}
                    onChange={handleFilterChange}
                    className="border-border text-foreground focus:ring-primary/10 focus:border-primary h-9 rounded-lg border bg-white px-3 text-[11px] font-bold transition-all outline-none focus:ring-2"
                />
            </div>

            {/* Timeline View - Optimized for High Density */}
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <Loader2 className="text-primary/30 h-8 w-8 animate-spin" />
                    <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">Menarik data dari server...</span>
                </div>
            ) : (
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute top-4 bottom-4 left-[11px] w-px bg-slate-200" />

                    <div className="flex flex-col gap-2">
                        {histories.map((h, i) => (
                            <div key={h.id} className="group relative flex gap-4 py-1">
                                {/* Dot / Icon - Smaller & Sleek */}
                                <div className="group-hover:ring-primary/30 relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300">
                                    <div className="origin-center scale-75">{getActionIcon(h.action)}</div>
                                </div>

                                {/* Compact Content Area */}
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-foreground shrink-0 truncate text-[11px] font-black tracking-tight uppercase">
                                                {h.actor?.name || 'System'}
                                            </span>
                                            <span
                                                className={cn(
                                                    'rounded px-1.5 py-0.5 text-[8px] font-black tracking-tighter whitespace-nowrap uppercase ring-1 ring-inset',
                                                    h.action.includes('APPROVE')
                                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/50'
                                                        : h.action.includes('REJECT')
                                                          ? 'bg-rose-50 text-rose-700 ring-rose-200/50'
                                                          : 'bg-slate-100/50 text-slate-500 ring-slate-200/50',
                                                )}
                                            >
                                                {h.action.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[11px] leading-snug font-medium text-slate-500 italic">"{h.description}"</span>
                                        </div>
                                        <div className="font-mono text-[10px] font-bold whitespace-nowrap text-slate-400 tabular-nums">
                                            {h.created_at}
                                        </div>
                                    </div>
                                    {/* Bottom divider for even more clarity */}
                                    <div className="mt-2 w-full border-b border-slate-50" />
                                </div>
                            </div>
                        ))}

                        {histories.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12">
                                <Search className="mb-2 h-5 w-5 text-slate-300" />
                                <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Tidak ada riwayat</h4>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
