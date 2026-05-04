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
    const [workflows, setWorkflows] = useState<any[]>([]);
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

            // Auto-select logic based on initial tax checkbox
            if (w.length > 0) {
                const defaultW = w.find(wf => !!wf.is_tax_involved === !!metadata.tax_required) || w.find(wf => wf.is_default) || w[0];
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
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white my-auto w-full max-w-lg rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h6 className="text-sm font-bold text-black dark:text-white flex items-center gap-2 uppercase tracking-tight">
                            <GitBranch size={16} className="text-black dark:text-white" /> Kirim Approval
                        </h6>
                        <p className="text-black/40 dark:text-white/40 text-[10px] mt-0.5 font-bold uppercase tracking-widest">Konfirmasi alur persetujuan kontrak</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"
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
                                metadata.tax_required ? "bg-black/5 border-black dark:bg-white/5 dark:border-white" : "bg-white dark:bg-black border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", metadata.tax_required ? "bg-black text-white dark:bg-white dark:text-black" : "bg-black/5 text-black/40 dark:bg-white/5 dark:text-white/40")}>
                                    <AlertCircle size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-black dark:text-white">Review Kepatuhan Pajak</span>
                                    <span className="text-[10px] text-black/40 dark:text-white/40 mt-0.5 text-balance italic">Sertakan departemen pajak dalam alur persetujuan</span>
                                </div>
                            </span>
                            <input 
                                type="checkbox"
                                className="hidden"
                                checked={metadata.tax_required}
                                onChange={() => {
                                    const nextTax = !metadata.tax_required;
                                    setMetadata({ ...metadata, tax_required: nextTax });
                                    const matched = workflows.find(wf => !!wf.is_tax_involved === nextTax) || workflows.find(wf => wf.is_default) || workflows[0];
                                    if (matched) {
                                        setSelectedWorkflowId(matched.id);
                                    }
                                }}
                            />
                            <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", metadata.tax_required ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black" : "bg-white border-black/10 dark:bg-black dark:border-white/10")}>
                                {metadata.tax_required && <CheckCircle2 size={12} />}
                            </div>
                        </label>
                    </div>

                    {initLoading ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/5 dark:border-white/5">
                            <div className="w-8 h-8 border-3 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Mengevaluasi Alur...</span>
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="p-6 rounded-xl border border-black/10 bg-black/5 text-center space-y-3 dark:border-white/10 dark:bg-white/5">
                            <div className="mx-auto w-10 h-10 rounded-full border border-black/20 flex items-center justify-center text-black bg-white dark:bg-black dark:text-white"><AlertCircle size={20} /></div>
                            <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-widest">Akses Ditolak</h4>
                            <p className="text-[10px] text-black/40 dark:text-white/40 leading-relaxed italic">Tidak ditemukan alur persetujuan yang sesuai untuk kategori ini. Hubungi admin untuk akses.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {workflows.length > 1 ? (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Pilih Workflow</Label>
                                    <div className="relative group">
                                        <select 
                                            value={selectedWorkflowId} 
                                            onChange={(e) => setSelectedWorkflowId(e.target.value)}
                                            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 h-11 px-4 text-xs font-bold rounded-lg appearance-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all outline-none text-black dark:text-white"
                                        >
                                            {workflows.filter(wf => !!wf.is_tax_involved === !!metadata.tax_required).map(wf => (
                                                <option key={wf.id} value={wf.id} className="text-black bg-white dark:bg-black dark:text-white">
                                                    {wf.name} {wf.is_default ? '(DEFAULT)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/40 dark:text-white/40" size={14} />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-black text-white dark:bg-white dark:text-black rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 size={20} /></div>
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-tight">{workflows[0].name}</h4>
                                        <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5 italic">Alur otomatis telah diotorisasi</p>
                                    </div>
                                </div>
                            )}

                             {selectedWorkflow && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3 block">Urutan Persetujuan</Label>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
                                        {selectedWorkflow.steps?.map((step: any, idx: number) => (
                                            <div key={idx} className="flex items-center flex-shrink-0">
                                                <div className="px-4 py-2.5 rounded-xl border border-black/10 bg-white dark:bg-sidebar shadow-sm flex flex-col items-center justify-center min-w-[100px] dark:border-white/10">
                                                    <span className="text-[11px] font-bold text-black dark:text-white leading-tight uppercase tracking-tight">
                                                        {Array.isArray(step.role) ? step.role.join(', ') : step.role}
                                                    </span>
                                                    {step.department_names && step.department_names.length > 0 && (
                                                        <span className="text-[8px] font-bold text-black/30 dark:text-white/30 mt-1 uppercase tracking-widest">
                                                            {step.department_names.join(' & ')}
                                                        </span>
                                                    )}
                                                </div>
                                                {idx < (selectedWorkflow.steps?.length || 0) - 1 && (
                                                    <div className="w-4 h-[1px] bg-black/10 dark:bg-white/10" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                 <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 text-xs font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || initLoading || workflows.length === 0 || !selectedWorkflowId}
                        className="flex-[2] bg-black text-white dark:bg-white dark:text-black h-11 text-[11px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:grayscale hover:opacity-90 shadow-lg"
                    >
                        {loading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : <GitBranch size={16} className="inline mr-2" strokeWidth={3} />}
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

