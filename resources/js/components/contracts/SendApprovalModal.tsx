import { contractApi } from '@/lib/contract-api';
import { UserProfile } from '@/types/contracts';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, GitBranch, Shield, Info, Layers, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Workflow {
    id: string;
    name: string;
    description: string;
    is_default: boolean;
    steps?: any[];
}

interface Role {
    id: string;
    name: string;
}

interface CustomStep {
    role: string;
    user_id?: string;
    description: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { workflow_id?: string; custom_steps?: CustomStep[]; metadata?: any }) => Promise<void>;
    contractType?: string;
}

export default function SendApprovalModal({ open, onClose, onSubmit, contractType }: Props) {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [metadata, setMetadata] = useState<Record<string, any>>({
        tax_required: false,
    });

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open, contractType]);

    const loadData = async () => {
        setInitLoading(true);
        try {
            const w = await contractApi.getWorkflows(contractType);
            setWorkflows(w);

            // Auto-select logic
            if (w.length > 0) {
                const defaultW = w.find(wf => wf.is_default) || w[0];
                setSelectedWorkflowId(defaultW.id);
            }
        } finally {
            setInitLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data: { workflow_id?: string; custom_steps?: CustomStep[]; metadata?: any } = {
                workflow_id: selectedWorkflowId,
                metadata: metadata
            };

            await onSubmit(data);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white my-auto w-full max-w-lg rounded-none border-2 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] duration-200 animate-in fade-in zoom-in-95 overflow-hidden">
                <div className="bg-black text-white px-6 py-5 flex items-center justify-between">
                    <div>
                        <h6 className="text-[14px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <Shield size={16} className="text-white" /> Access Authorization
                        </h6>
                        <p className="text-white/50 mt-1 text-[9px] font-bold uppercase tracking-widest">Select Approval Pathway</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:rotate-90 transition-all duration-300 text-white/50 hover:text-white"
                    >
                        <i className="fa-solid fa-xmark text-xl" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Tax Policy Gate */}
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Mandatory Policy Check</Label>
                        <label 
                            className={cn(
                                "flex cursor-pointer items-center justify-between p-5 border-2 transition-all",
                                metadata.tax_required ? "bg-black text-white border-black" : "bg-slate-50 border-slate-100 hover:border-slate-300"
                            )}
                        >
                            <span className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 flex items-center justify-center transition-colors", metadata.tax_required ? "bg-white/10" : "bg-white border border-slate-200 shadow-sm")}>
                                    <AlertCircle size={18} className={metadata.tax_required ? "text-white" : "text-slate-400"} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase tracking-tight">Tax Compliance Review</span>
                                    <span className={cn("text-[8px] font-bold uppercase mt-0.5", metadata.tax_required ? "text-white/50" : "text-slate-400")}>Include tax department in the approval loop</span>
                                </div>
                            </span>
                            <input 
                                type="checkbox"
                                className="hidden"
                                checked={metadata.tax_required}
                                onChange={() => setMetadata({ ...metadata, tax_required: !metadata.tax_required })}
                            />
                            <div className={cn("w-6 h-6 border-2 flex items-center justify-center transition-all", metadata.tax_required ? "bg-white border-white text-black" : "bg-white border-slate-200")}>
                                {metadata.tax_required && <CheckCircle2 size={14} />}
                            </div>
                        </label>
                    </div>

                    {initLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-100">
                            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Evaluating Access...</span>
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="p-6 border-2 border-rose-100 bg-rose-50 text-center space-y-3">
                            <div className="mx-auto w-10 h-10 border-2 border-rose-200 flex items-center justify-center text-rose-500"><AlertCircle size={20} /></div>
                            <h4 className="text-[11px] font-black uppercase text-rose-800">Authorization Denied</h4>
                            <p className="text-[9px] font-bold text-rose-600 uppercase tracking-tight leading-relaxed">No authorized workflows found for this contract category. Contact your administrator for access rights.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {workflows.length > 1 ? (
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Workflows</Label>
                                    <div className="relative group">
                                        <select 
                                            value={selectedWorkflowId} 
                                            onChange={(e) => setSelectedWorkflowId(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-200 h-14 px-5 text-[11px] font-black uppercase tracking-tight rounded-none appearance-none focus:border-black focus:bg-white transition-all outline-none"
                                        >
                                            {workflows.map(wf => (
                                                <option key={wf.id} value={wf.id}>
                                                    {wf.name} {wf.is_default ? '(DEFAULT)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:rotate-180 transition-transform" size={16} />
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">You have access to multiple pathways. Choose the appropriate one.</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 border-2 border-black/5 flex flex-col items-center text-center space-y-4">
                                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center shadow-xl shadow-black/20"><CheckCircle2 size={24} /></div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.1em]">{workflows[0].name}</h4>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Automatic Authorization Confirmed</p>
                                    </div>
                                    <div className="pt-2 flex items-center gap-1.5 opacity-30">
                                        {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-black rounded-full" />)}
                                    </div>
                                </div>
                            )}

                            {selectedWorkflow && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Process Architecture</Label>
                                    <div className="flex items-center gap-1 overflow-hidden h-12">
                                        {selectedWorkflow.steps?.map((step: any, idx: number) => (
                                            <div key={idx} className="flex items-center">
                                                <div className="h-10 px-4 flex items-center justify-center bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-900 shadow-sm min-w-[80px]">
                                                    {step.role}
                                                </div>
                                                {idx < (selectedWorkflow.steps?.length || 0) - 1 && (
                                                    <div className="w-4 h-[2px] bg-slate-200" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t-2 border-black flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all border border-transparent hover:border-black"
                    >
                        Abort
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || initLoading || workflows.length === 0 || !selectedWorkflowId}
                        className="flex-[2] bg-black text-white h-12 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-20 disabled:grayscale"
                    >
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <GitBranch size={14} className="inline mr-2" />}
                        {loading ? 'Executing...' : 'Authorize & Dispatch'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={cn("block text-xs font-bold", className)}>{children}</span>;
}

