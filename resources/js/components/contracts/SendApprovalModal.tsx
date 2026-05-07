import { contractApi } from '@/lib/contract-api';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, GitBranch, ChevronDown, Send, Activity, User, MessageSquare, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-md p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-slate-900 my-auto w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-black/5 dark:border-white/5">
                <div className="relative h-36 w-full overflow-hidden bg-slate-950 p-7">
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-[-50%] left-[-10%] h-[200%] w-[40%] skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner">
                                <Send className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black tracking-tight text-white uppercase leading-none">Kirim Approval</h2>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Initialize Workflow Engine</span>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-white/50 max-w-[80%] leading-relaxed">Pilih alur kerja otomatis atau sesuaikan step sesuai kebutuhan kontrak.</p>
                    </div>
                </div>

                <div className="p-7 space-y-7">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 dark:text-slate-500 uppercase">Pilih Workflow Alur</label>
                            {initLoading && <Activity className="h-3 w-3 animate-pulse text-indigo-500" />}
                        </div>
                        <div className="relative group">
                            <select
                                value={selectedWorkflowId}
                                onChange={(e) => handleWorkflowChange(e.target.value)}
                                disabled={initLoading || workflows.length === 0}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-12 px-4 text-xs font-bold rounded-xl appearance-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none text-slate-900 dark:text-white disabled:opacity-50"
                            >
                                {workflows.length === 0 && <option>Memuat alur...</option>}
                                {workflows.map((w) => (
                                    <option key={w.id} value={w.id.toString()}>
                                        {w.name} {w.is_default ? '(DEFAULT)' : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                        </div>
                    </div>

                    {selectedWorkflow && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            {selectedWorkflow.steps?.some((s: any) => s.is_optional) && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Step Opsional
                                    </label>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {selectedWorkflow.steps
                                            .filter((s: any) => s.is_optional)
                                            .map((step: any) => (
                                                <div
                                                    key={step.id}
                                                    onClick={() => toggleOptionalStep(step.id)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 cursor-pointer",
                                                        metadata.optional_steps.includes(step.id.toString())
                                                            ? "bg-slate-900 border-slate-900 text-white shadow-xl translate-x-1"
                                                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-400 hover:border-slate-900 dark:hover:border-white/20"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                            metadata.optional_steps.includes(step.id.toString()) ? "bg-white/10" : "bg-white dark:bg-slate-900 shadow-sm"
                                                        )}>
                                                            <CheckCircle2 size={14} className={metadata.optional_steps.includes(step.id.toString()) ? "text-white" : "text-slate-300"} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold uppercase tracking-tight">{step.name}</span>
                                                            <span className={cn("text-[9px] font-medium opacity-60", metadata.optional_steps.includes(step.id.toString()) ? "text-white" : "text-slate-500")}>
                                                                {step.role_name || 'System Role'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                        metadata.optional_steps.includes(step.id.toString()) ? "border-white bg-white" : "border-slate-300 dark:border-slate-700"
                                                    )}>
                                                        {metadata.optional_steps.includes(step.id.toString()) && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {selectedWorkflow.steps?.some((s: any) => s.step_type === 'selection') && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pilih Personel Manual
                                    </label>
                                    <div className="space-y-4">
                                        {selectedWorkflow.steps
                                            .filter((s: any) => s.step_type === 'selection')
                                            .map((step: any) => (
                                                <div key={step.id} className="space-y-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <User size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{step.name}</span>
                                                    </div>
                                                    <div className="relative">
                                                        <select
                                                            value={metadata.selections[step.id.toString()] || ''}
                                                            onChange={(e) => handleSelectionChange(step.id, e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-11 px-4 text-xs font-bold rounded-xl appearance-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900 dark:text-white"
                                                        >
                                                            <option value="">Pilih approver untuk {step.name}...</option>
                                                            {users
                                                                .filter((u: any) => {
                                                                    const rules = step.selection_rules || [];
                                                                    if (rules.length === 0) {
                                                                        // Fallback to legacy role_id filter if no specific rules
                                                                        return !step.role_id || u.role_id === step.role_id;
                                                                    }
                                                                    
                                                                    // Check if user matches ANY of the rules (OR logic)
                                                                    return rules.some((rule: any) => {
                                                                        const matchesRole = !rule.role_id || u.role_id === rule.role_id;
                                                                        const matchesDept = !rule.department_id || u.department_id === rule.department_id;
                                                                        return matchesRole && matchesDept;
                                                                    });
                                                                })
                                                                .map((u: any) => (
                                                                    <option key={u.id} value={u.id.toString()}>
                                                                        {u.name} ({u.department_name || 'No Dept'})
                                                                    </option>
                                                                ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {(!selectedWorkflow.steps?.some((s: any) => s.is_optional || s.step_type === 'selection')) && (
                                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 border-dashed flex flex-col items-center justify-center text-center space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                        <Activity size={18} className="text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alur kerja standar diaktifkan</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
                            <MessageSquare size={12} /> Catatan untuk Approver
                        </label>
                        <textarea
                            placeholder="Berikan instruksi atau konteks tambahan..."
                            className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 text-xs font-medium rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all outline-none text-slate-900 dark:text-white resize-none"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-7 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-[0.2em]"
                    >
                        Batalkan
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || initLoading || workflows.length === 0 || !selectedWorkflowId}
                        className="flex-[2] bg-slate-950 dark:bg-white text-white dark:text-slate-950 h-12 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 disabled:opacity-20 disabled:grayscale hover:shadow-2xl hover:shadow-slate-500/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
