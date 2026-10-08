import { Modal } from '@/components/ui/dialogs/Modal';
import { Button } from '@/components/ui/buttons/Button';
import { contractApi } from '@/pages/contracts/utils';
import { Contract } from '@/pages/contracts/types';
import {
    AlertTriangle,
    GitFork,
    Layers,
    Loader2,
    ShieldAlert,
    Workflow,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AdminChangeWorkflowModalProps {
    open: boolean;
    onClose: () => void;
    contract: Contract;
    onSuccess: (updatedContract: Contract) => void;
    showToast: (toast: { title?: string; message: string; type: 'success' | 'error' | 'info' | 'warning' } | string, type?: any) => void;
}

export function AdminChangeWorkflowModal({
    open,
    onClose,
    contract,
    onSuccess,
    showToast,
}: AdminChangeWorkflowModalProps) {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
    const [selectedStepId, setSelectedStepId] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [initLoading, setInitLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            loadWorkflows();
        }
    }, [open]);

    const loadWorkflows = async () => {
        setInitLoading(true);
        try {
            const res = await contractApi.getWorkflows(undefined, undefined, true);
            const list: any[] = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : []);
            setWorkflows(list);

            if (list.length > 0) {
                const currentWfId = contract.workflow_id
                    ? String(contract.workflow_id)
                    : String(list[0].id);

                const activeWf = list.find((w: any) => String(w.id) === currentWfId) || list[0];
                setSelectedWorkflowId(String(activeWf.id));

                const rawSteps = activeWf?.steps || [];
                const wfSteps = rawSteps.slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));

                const currentStepId = contract.workflow_step_id
                    ? String(contract.workflow_step_id)
                    : (wfSteps.length > 0 ? String(wfSteps[0].id) : '');

                const activeStep = wfSteps.find((s: any) => String(s.id) === currentStepId) || wfSteps[0];
                setSelectedStepId(activeStep ? String(activeStep.id) : '');
            } else {
                setSelectedWorkflowId('');
                setSelectedStepId('');
            }
            setReason('');
        } catch (error: any) {
            console.error('Failed to load workflows for admin override:', error);
            showToast({
                type: 'error',
                title: 'Gagal Memuat Workflow',
                message: error?.message || 'Terjadi kesalahan saat memuat daftar workflow.',
            });
        } finally {
            setInitLoading(false);
        }
    };

    const selectedWorkflow = workflows.find((w) => String(w.id) === String(selectedWorkflowId));
    const steps = (selectedWorkflow?.steps || []).slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
    const selectedStep = steps.find((s: any) => String(s.id) === String(selectedStepId));

    const handleWorkflowChange = (newWorkflowId: string) => {
        setSelectedWorkflowId(String(newWorkflowId));
        const wf = workflows.find((w) => String(w.id) === String(newWorkflowId));
        const wfSteps = (wf?.steps || []).slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
        setSelectedStepId(wfSteps.length > 0 ? String(wfSteps[0].id) : '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkflowId || !selectedStepId) {
            showToast({
                type: 'warning',
                message: 'Pilih alur kerja dan tahapan yang valid.',
            });
            return;
        }

        setSubmitting(true);
        try {
            const updated = await contractApi.adminOverrideWorkflow(contract.id, {
                workflow_id: selectedWorkflowId,
                workflow_step_id: selectedStepId,
                reason: reason.trim() || undefined,
            });

            showToast({
                type: 'success',
                title: 'Alur Kerja Diperbarui',
                message: 'Alur kerja dan tahapan kontrak berhasil diubah oleh Administrator.',
            });
            onSuccess(updated);
            onClose();
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Gagal Mengubah Alur Kerja',
                message: error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat memproses permintaan.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const currentWorkflowName = contract.workflow?.name || 'Belum Ditentukan';
    const currentStepName = contract.workflow_step
        ? `Tahap ${contract.workflow_step.step}: ${contract.workflow_step.name || contract.workflow_step.description || 'Tahap Tanpa Nama'}`
        : 'Belum Ada Tahap';

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <ShieldAlert size={20} />
                    <span>Ubah Alur Kerja & Tahapan (Admin Override)</span>
                </div>
            }
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                {/* Warning Banner */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div className="space-y-1">
                            <p className="font-bold">Perhatian Khusus Administrator:</p>
                            <p className="leading-relaxed text-amber-700/90 dark:text-amber-300/90">
                                Mengubah alur kerja atau tahapan secara manual akan menghapus antrean persetujuan (approval pending/waiting) yang lama dan membangkitkan persetujuan baru sesuai konfigurasi tahapan yang dipilih.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Current State Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/50 border border-border text-xs">
                    <div>
                        <span className="text-muted-foreground font-medium block">Alur Kerja Saat Ini:</span>
                        <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5 truncate">
                            <Workflow size={14} className="text-primary shrink-0" />
                            {currentWorkflowName}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground font-medium block">Tahapan Saat Ini:</span>
                        <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5 truncate">
                            <Layers size={14} className="text-amber-500 shrink-0" />
                            {currentStepName}
                        </span>
                    </div>
                </div>

                {initLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                        <Loader2 size={24} className="animate-spin text-primary" />
                        <span>Memuat data alur kerja...</span>
                    </div>
                ) : (
                    <>
                        {/* Target Workflow Select */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Pilih Alur Kerja Baru <span className="text-rose-500">*</span></span>
                                {selectedWorkflow && (
                                    <span className="text-[11px] font-normal text-muted-foreground">
                                        Total {steps.length} tahapan
                                    </span>
                                )}
                            </label>
                            <select
                                value={selectedWorkflowId}
                                onChange={(e) => handleWorkflowChange(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
                                required
                            >
                                <option value="" disabled>-- Pilih Alur Kerja --</option>
                                {workflows.map((wf) => (
                                    <option key={wf.id} value={wf.id}>
                                        {wf.name} {wf.contract_type?.name ? `(${wf.contract_type.name})` : ''} {wf.is_default ? '★ Default' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Target Step Select */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Pilih Tahapan Baru <span className="text-rose-500">*</span></span>
                                {selectedStep && (
                                    <span className="text-[11px] font-semibold text-primary">
                                        Target Status: {selectedStep.meta?.target_status || 'Sesuai Step'}
                                    </span>
                                )}
                            </label>
                            <select
                                value={selectedStepId}
                                onChange={(e) => setSelectedStepId(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
                                required
                                disabled={steps.length === 0}
                            >
                                {steps.length === 0 ? (
                                    <option value="">Tidak ada tahapan tersedia pada workflow ini</option>
                                ) : (
                                    steps.map((st: any) => (
                                        <option key={st.id} value={st.id}>
                                            Tahap {st.step}: {st.name || st.description || `Tahap ${st.step}`} {st.approver_type ? `[${st.approver_type}]` : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Reason / Catatan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Alasan Perubahan (Audit Trail Log)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Contoh: Penyesuaian tahapan persetujuan karena perubahan klausul komersial..."
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                            />
                        </div>
                    </>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <Button
                        type="submit"
                        disabled={initLoading || submitting || !selectedWorkflowId || !selectedStepId}
                        className="h-9 px-5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <GitFork size={14} />
                                <span>Ubah Workflow & Step</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
