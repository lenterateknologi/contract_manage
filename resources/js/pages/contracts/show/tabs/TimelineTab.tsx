import ApprovalSteps from '@/components/contracts/ApprovalSteps';
import { Contract } from '@/types/contracts';
import { Button } from '@/components/ui/base/Button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useToast } from '@/components/contracts/Toast';

interface TimelineTabProps {
    contract: Contract;
    meId: string;
    onApprove: (note: string, file?: File) => void;
    showToast: (msg: string, type: any) => void;
}

export const TimelineTab = ({ contract, meId, onApprove, showToast }: TimelineTabProps) => {
    const [isExporting, setIsExporting] = useState(false);
    const { showProgress, hideProgress } = useToast();

    const handleExportTimelinePdf = async () => {
        setIsExporting(true);

        const win = globalThis.window.open('about:blank', '_blank');
        if (win) {
            win.document.writeln(`
                <html>
                    <head>
                        <title>Mempersiapkan Alur Approval...</title>
                        <style>
                            body { font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #1e293b; }
                            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); text-align: center; border: 1px solid #e2e8f0; max-width: 400px; }
                            .loader { width: 48px; height: 48px; border: 5px solid #f1f5f9; border-top: 5px solid #0f172a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 24px; }
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            h2 { font-size: 14px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 12px; }
                            p { font-size: 11px; color: #64748b; font-weight: 500; line-height: 1.6; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <div class="loader"></div>
                            <h2>Mempersiapkan Laporan Approval</h2>
                            <p>Mohon tunggu sebentar, data alur approval sedang dikonversi menjadi PDF. Halaman ini akan otomatis beralih ke dokumen setelah siap.</p>
                        </div>
                    </body>
                </html>
            `);
            win.document.close();
        }

        try {
            const res = await axios.get(`/api/contracts/${contract.id}/approval/pdf/queue`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                withCredentials: true,
            });

            const jobId = res.data.job_id;

            const interval = setInterval(async () => {
                try {
                    const statusRes = await axios.get(`/admin/form-templates/pdf-status/${jobId}`, {
                        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                        withCredentials: true,
                    });
                    const statusData = statusRes.data;

                    showProgress(jobId, 'Mempersiapkan Laporan Approval...', statusData.progress || 0);

                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        if (win) {
                            win.location.href = statusData.url;
                        } else {
                            globalThis.window.open(statusData.url, '_blank');
                        }
                        hideProgress(jobId);
                        setIsExporting(false);
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        hideProgress(jobId);
                        showToast('Export PDF gagal: ' + (statusData.error || 'Unknown error'), 'danger');
                        if (win) win.close();
                        setIsExporting(false);
                    }
                } catch (pollErr) {
                    console.error('Polling error', pollErr);
                }
            }, 2000);
        } catch (err: any) {
            console.error('Export failed', err);
            showToast('Gagal mengekspor PDF.', 'danger');
            setIsExporting(false);
            if (win) win.close();
        }
    };

    return (
        <div className="flex flex-col gap-4 p-5">
            <div className="flex justify-end px-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportTimelinePdf}
                    disabled={isExporting}
                    className="h-8 gap-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all active:scale-95"
                >
                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                    {isExporting ? 'Mengekspor...' : 'Export PDF'}
                </Button>
            </div>
            <div className="mb-10 flex flex-col gap-8">
                <ApprovalSteps
                    contract={contract}
                    approvals={contract.approvals}
                    creator={contract.creator}
                    submittedAt={contract.submitted_at ?? undefined}
                    meId={meId}
                    onApprove={onApprove}
                />
            </div>
        </div>
    );
};
