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
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white my-auto w-full max-w-lg rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h6 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <GitBranch size={16} className="text-primary" /> Kirim Approval
                        </h6>
                        <p className="text-slate-400 text-[10px] mt-0.5">Konfirmasi alur persetujuan kontrak</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-lg" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Tax Policy Gate */}
                    <div className="space-y-3">
                        <label 
                            className={cn(
                                "flex cursor-pointer items-center justify-between p-4 rounded-xl border-2 transition-all",
                                metadata.tax_required ? "bg-primary/5 border-primary" : "bg-white border-slate-100 hover:border-slate-200"
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", metadata.tax_required ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>
                                    <AlertCircle size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900">Review Kepatuhan Pajak</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5 text-balance italic">Sertakan departemen pajak dalam alur persetujuan</span>
                                </div>
                            </span>
                            <input 
                                type="checkbox"
                                className="hidden"
                                checked={metadata.tax_required}
                                onChange={() => setMetadata({ ...metadata, tax_required: !metadata.tax_required })}
                            />
                            <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", metadata.tax_required ? "bg-primary border-primary text-white" : "bg-white border-slate-200")}>
                                {metadata.tax_required && <CheckCircle2 size={12} />}
                            </div>
                        </label>
                    </div>

                    {initLoading ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-xl">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mengevaluasi Alur...</span>
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="p-6 rounded-xl border border-rose-100 bg-rose-50/50 text-center space-y-3">
                            <div className="mx-auto w-10 h-10 rounded-full border border-rose-200 flex items-center justify-center text-rose-500 bg-white"><AlertCircle size={20} /></div>
                            <h4 className="text-xs font-bold text-rose-900">Akses Ditolak</h4>
                            <p className="text-[10px] text-rose-600/80 leading-relaxed">Tidak ditemukan alur persetujuan yang sesuai untuk kategori ini. Hubungi admin untuk akses.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {workflows.length > 1 ? (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Workflow</Label>
                                    <div className="relative group">
                                        <select 
                                            value={selectedWorkflowId} 
                                            onChange={(e) => setSelectedWorkflowId(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 h-11 px-4 text-xs font-bold rounded-lg appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        >
                                            {workflows.map(wf => (
                                                <option key={wf.id} value={wf.id}>
                                                    {wf.name} {wf.is_default ? '(DEFAULT)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><CheckCircle2 size={20} /></div>
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{workflows[0].name}</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5 italic">Alur otomatis telah diotorisasi</p>
                                    </div>
                                </div>
                            )}

                            {selectedWorkflow && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Urutan Persetujuan</Label>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
                                        {selectedWorkflow.steps?.map((step: any, idx: number) => (
                                            <div key={idx} className="flex items-center flex-shrink-0">
                                                <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center min-w-[100px]">
                                                    <span className="text-[11px] font-bold text-slate-900 leading-tight">
                                                        {Array.isArray(step.role) ? step.role.join(', ') : step.role}
                                                    </span>
                                                    {step.department_names && step.department_names.length > 0 && (
                                                        <span className="text-[8px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                                                            {step.department_names.join(' & ')}
                                                        </span>
                                                    )}
                                                </div>
                                                {idx < (selectedWorkflow.steps?.length || 0) - 1 && (
                                                    <div className="w-4 h-[1px] bg-slate-200" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || initLoading || workflows.length === 0 || !selectedWorkflowId}
                        className="flex-[2] bg-primary text-white h-11 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:grayscale hover:bg-primary/90"
                    >
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <GitBranch size={16} className="inline mr-2" />}
                        {loading ? 'Mengirim...' : 'Konfirmasi & Kirim'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={cn("block text-xs font-bold", className)}>{children}</span>;
}

