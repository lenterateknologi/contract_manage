import { Modal } from '@/components/ui/dialogs/Modal';
import { Button } from '@/components/ui/buttons/Button';
import { contractApi } from '@/pages/contracts/utils';
import { cn } from '@/lib/utils';
import { Activity, CheckCircle2, ChevronDown, GitBranch, Loader2, MessageSquare, Send, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SendApprovalModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    contractType?: string;
    users?: any[];
}

export default function SendApprovalModal({ open, onClose, onSubmit, contractType, users = [] }: SendApprovalModalProps) {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [note, setNote] = useState('');
    const [metadata, setMetadata] = useState<{
        optional_steps: string[];
        selections: Record<string, string>;
    }>({
        optional_steps: [],
        selections: {},
    });

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open, contractType]);

    const loadData = async () => {
        setInitLoading(true);
        try {
            const data = await contractApi.getWorkflows(contractType);
            setWorkflows(data);

            if (data.length > 0) {
                const defaultWf = data.find((w: any) => w.is_default) || data[0];
                setSelectedWorkflowId(defaultWf.id.toString());
            }
        } catch (error) {
            console.error('Failed to load workflows:', error);
        } finally {
            setInitLoading(false);
        }
    };

    const selectedWorkflow = workflows.find((w) => w.id.toString() === selectedWorkflowId);

    const handleWorkflowChange = (id: string) => {
        setSelectedWorkflowId(id);
        setMetadata({
            optional_steps: [],
            selections: {},
        });
    };

    const toggleOptionalStep = (stepId: any) => {
        setMetadata((prev) => {
            const current = [...prev.optional_steps];
            const stepIdStr = stepId.toString();
            const index = current.indexOf(stepIdStr);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(stepIdStr);
            }
            return { ...prev, optional_steps: current };
        });
    };

    const handleSelectionChange = (stepId: any, userId: string) => {
        setMetadata((prev) => ({
            ...prev,
            selections: {
                ...prev.selections,
                [stepId.toString()]: userId,
            },
        }));
    };

    const handleSubmit = async () => {
        if (selectedWorkflow) {
            const selectionSteps = selectedWorkflow.steps?.filter((s: any) => s.step_type === 'selection') || [];
            for (const step of selectionSteps) {
                if (!metadata.selections[step.id.toString()]) {
                    alert(`Silakan pilih personel untuk step: ${step.name}`);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            await onSubmit({
                workflow_id: selectedWorkflowId,
                note,
                metadata,
            });
            onClose();
        } catch (error) {
            console.error('Failed to submit approval:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            headerVariant="primary"
            headerIcon={<Send size={18} className="text-white" />}
            title="Kirim Approval"
            description="Pilih alur kerja persetujuan sesuai kebutuhan kontrak"
            maxWidth="2xl"
            footer={
                <div className="flex w-full justify-end gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="h-9 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 font-semibold"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || initLoading || workflows.length === 0 || !selectedWorkflowId}
                        className="min-w-[140px] h-9 text-xs"
                    >
                        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <GitBranch size={15} className="mr-1.5" />}
                        Inisialisasi Approval
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 pt-1">
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                            Pilih Alur Kerja <span className="text-rose-500">*</span>
                        </label>
                        {initLoading && <Activity className="h-3.5 w-3.5 animate-pulse text-primary" />}
                    </div>
                    <div className="group relative">
                        <select
                            value={selectedWorkflowId}
                            onChange={(e) => handleWorkflowChange(e.target.value)}
                            disabled={initLoading || workflows.length === 0}
                            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 transition-all outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        >
                            {workflows.length === 0 && <option>Memuat alur...</option>}
                            {workflows.map((w) => (
                                <option key={w.id} value={w.id.toString()}>
                                    {w.name} {w.is_default ? '(DEFAULT)' : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" size={16} />
                    </div>
                    <p className="text-text-soft text-[11px] leading-relaxed font-normal mt-1">
                        Alur kerja persetujuan sesuai tipe kontrak yang dipilih.
                    </p>
                </div>

                {selectedWorkflow && (
                    <div className="space-y-3">
                        {selectedWorkflow.steps?.some((s: any) => s.is_optional) && (
                            <div className="space-y-1.5">
                                <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                                    Step Opsional
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {selectedWorkflow.steps
                                        .filter((s: any) => s.is_optional)
                                        .map((step: any) => {
                                            const isChecked = metadata.optional_steps.includes(step.id.toString());
                                            return (
                                                <div
                                                    key={step.id}
                                                    onClick={() => toggleOptionalStep(step.id)}
                                                    className={cn(
                                                        'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all',
                                                        isChecked
                                                            ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                                                            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <CheckCircle2
                                                            size={16}
                                                            className={isChecked ? 'text-primary' : 'text-slate-300'}
                                                        />
                                                        <div>
                                                            <span className="text-xs font-bold uppercase">{step.name}</span>
                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                {step.role_name || 'System Role'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {selectedWorkflow.steps?.some((s: any) => s.step_type === 'selection') && (
                            <div className="space-y-1.5">
                                <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                                    Pilih Personel Manual <span className="text-rose-500">*</span>
                                </label>
                                <div className="space-y-2">
                                    {selectedWorkflow.steps
                                        .filter((s: any) => s.step_type === 'selection')
                                        .map((step: any) => (
                                            <div key={step.id} className="space-y-1">
                                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                    {step.name}
                                                </span>
                                                <div className="relative">
                                                    <select
                                                        value={metadata.selections[step.id.toString()] || ''}
                                                        onChange={(e) => handleSelectionChange(step.id, e.target.value)}
                                                        className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-primary dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                    >
                                                        <option value="">Pilih approver untuk {step.name}...</option>
                                                        {users
                                                            .filter((u: any) => {
                                                                const roles: string[] = step.role || [];
                                                                if (roles.length === 0) return true;
                                                                return roles.some((r: string) => u.role?.toLowerCase() === r.toLowerCase());
                                                            })
                                                            .map((u: any) => (
                                                                <option key={u.id} value={u.id.toString()}>
                                                                    {u.name} ({u.department_name || 'No Dept'})
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" size={14} />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                        Catatan untuk Approver (Optional)
                    </label>
                    <textarea
                        placeholder="Berikan instruksi atau konteks tambahan..."
                        className="min-h-[80px] w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 transition-all outline-none focus:ring-2 focus:ring-primary dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                    />
                </div>
            </div>
        </Modal>
    );
}
