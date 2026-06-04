import { contractApi } from '@/lib/contract-api';
import { cn } from '@/lib/utils';
import { Activity, CheckCircle2, ChevronDown, GitBranch, MessageSquare, Send, User } from 'lucide-react';
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

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="animate-in fade-in zoom-in-95 my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl duration-300 dark:border-white/5 dark:bg-slate-900">
                <div className="relative h-36 w-full overflow-hidden bg-slate-950 p-7">
                    <div className="absolute inset-0 opacity-30">
                        <div className="animate-shimmer absolute top-[-50%] left-[-10%] h-[200%] w-[40%] skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-inner backdrop-blur-xl">
                                <Send className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-xl leading-none font-black tracking-tight text-white uppercase">Kirim Approval</h2>
                                <span className="mt-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                                    Initialize Workflow Engine
                                </span>
                            </div>
                        </div>
                        <p className="max-w-[80%] text-xs leading-relaxed font-medium text-white/50">
                            Pilih alur kerja otomatis atau sesuaikan step sesuai kebutuhan kontrak.
                        </p>
                    </div>
                </div>

                <div className="space-y-7 p-7">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase dark:text-slate-500">
                                Pilih Workflow Alur
                            </label>
                            {initLoading && <Activity className="h-3 w-3 animate-pulse text-indigo-500" />}
                        </div>
                        <div className="group relative">
                            <select
                                value={selectedWorkflowId}
                                onChange={(e) => handleWorkflowChange(e.target.value)}
                                disabled={initLoading || workflows.length === 0}
                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-900 transition-all outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-white"
                            >
                                {workflows.length === 0 && <option>Memuat alur...</option>}
                                {workflows.map((w) => (
                                    <option key={w.id} value={w.id.toString()}>
                                        {w.name} {w.is_default ? '(DEFAULT)' : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    {selectedWorkflow && (
                        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 duration-500">
                            {selectedWorkflow.steps?.some((s: any) => s.is_optional) && (
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase dark:text-slate-500">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Step Opsional
                                    </label>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {selectedWorkflow.steps
                                            .filter((s: any) => s.is_optional)
                                            .map((step: any) => (
                                                <div
                                                    key={step.id}
                                                    onClick={() => toggleOptionalStep(step.id)}
                                                    className={cn(
                                                        'group flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all duration-300',
                                                        metadata.optional_steps.includes(step.id.toString())
                                                            ? 'translate-x-1 border-slate-900 bg-slate-900 text-white shadow-xl'
                                                            : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-white/20',
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                                                metadata.optional_steps.includes(step.id.toString())
                                                                    ? 'bg-white/10'
                                                                    : 'bg-white shadow-sm dark:bg-slate-900',
                                                            )}
                                                        >
                                                            <CheckCircle2
                                                                size={14}
                                                                className={
                                                                    metadata.optional_steps.includes(step.id.toString())
                                                                        ? 'text-white'
                                                                        : 'text-slate-300'
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold tracking-tight uppercase">{step.name}</span>
                                                            <span
                                                                className={cn(
                                                                    'text-[9px] font-medium opacity-60',
                                                                    metadata.optional_steps.includes(step.id.toString())
                                                                        ? 'text-white'
                                                                        : 'text-slate-500',
                                                                )}
                                                            >
                                                                {step.role_name || 'System Role'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all',
                                                            metadata.optional_steps.includes(step.id.toString())
                                                                ? 'border-white bg-white'
                                                                : 'border-slate-300 dark:border-slate-700',
                                                        )}
                                                    >
                                                        {metadata.optional_steps.includes(step.id.toString()) && (
                                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {selectedWorkflow.steps?.some((s: any) => s.step_type === 'selection') && (
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase dark:text-slate-500">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pilih Personel Manual
                                    </label>
                                    <div className="space-y-4">
                                        {selectedWorkflow.steps
                                            .filter((s: any) => s.step_type === 'selection')
                                            .map((step: any) => (
                                                <div key={step.id} className="space-y-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <User size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-bold tracking-tight text-slate-600 uppercase dark:text-slate-300">
                                                            {step.name}
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <select
                                                            value={metadata.selections[step.id.toString()] || ''}
                                                            onChange={(e) => handleSelectionChange(step.id, e.target.value)}
                                                            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-900 transition-all outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                        >
                                                            <option value="">Pilih approver untuk {step.name}...</option>
                                                            {users
                                                                .filter((u: any) => {
                                                                    // Filter by approver roles configured on the step
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
                                                        <ChevronDown
                                                            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400"
                                                            size={14}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {!selectedWorkflow.steps?.some((s: any) => s.is_optional || s.step_type === 'selection') && (
                                <div className="flex flex-col items-center justify-center space-y-2 rounded-2xl border border-dashed border-slate-100 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
                                        <Activity size={18} className="text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Alur kerja standar diaktifkan</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase dark:text-slate-500">
                            <MessageSquare size={12} /> Catatan untuk Approver
                        </label>
                        <textarea
                            placeholder="Berikan instruksi atau konteks tambahan..."
                            className="min-h-[100px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-900 transition-all outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-white"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4 border-t border-slate-100 bg-slate-50 p-7 dark:border-slate-800 dark:bg-slate-950/50">
                    <button
                        onClick={onClose}
                        className="h-12 flex-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase transition-colors hover:text-slate-900 dark:hover:text-white"
                    >
                        Batalkan
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || initLoading || workflows.length === 0 || !selectedWorkflowId}
                        className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-slate-950 text-[11px] font-black tracking-[0.2em] text-white uppercase transition-all hover:shadow-2xl hover:shadow-slate-500/20 active:scale-95 disabled:opacity-20 disabled:grayscale dark:bg-white dark:text-slate-950"
                    >
                        {loading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            <GitBranch size={16} strokeWidth={3} />
                        )}
                        {loading ? 'Processing...' : 'Inisialisasi Approval'}
                    </button>
                </div>
            </div>
        </div>
    );
}
