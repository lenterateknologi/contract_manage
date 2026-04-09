import React, { useState, useEffect } from 'react';
import { contractApi } from '@/lib/contract-api';
import { UserProfile } from '@/types/contracts';

interface Workflow {
    id: string;
    name: string;
    description: string;
    is_default: boolean;
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
    onSubmit: (data: { workflow_id?: string; custom_steps?: CustomStep[] }) => Promise<void>;
    contractType?: string;
}

export default function SendApprovalModal({ open, onClose, onSubmit, contractType }: Props) {
    const [mode, setMode] = useState<'default' | 'selectable' | 'custom'>('default');
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
    const [customSteps, setCustomSteps] = useState<CustomStep[]>([]);
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        setInitLoading(true);
        try {
            const [w, u, r] = await Promise.all([
                contractApi.getWorkflows(),
                contractApi.getUsers(),
                contractApi.getRoles()
            ]);
            setWorkflows(w);
            setUsers(u);
            setRoles(r);

            // Auto-select first workflow if selectable
            if (w.length > 0) setSelectedWorkflowId(w[0].id);

            // Default custom steps: at least one
            if (customSteps.length === 0) {
                setCustomSteps([{ role: 'Legal', description: 'Approval Legal' }]);
            }
        } finally {
            setInitLoading(false);
        }
    };

    const addStep = () => {
        setCustomSteps([...customSteps, { role: roles[0]?.name || 'Legal', description: 'Approval Step' }]);
    };

    const removeStep = (index: number) => {
        setCustomSteps(customSteps.filter((_, i) => i !== index));
    };

    const updateStep = (index: number, data: Partial<CustomStep>) => {
        const next = [...customSteps];
        next[index] = { ...next[index], ...data };
        setCustomSteps(next);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data: { workflow_id?: string; custom_steps?: CustomStep[] } = {};
            if (mode === 'selectable') data.workflow_id = selectedWorkflowId;
            if (mode === 'custom') data.custom_steps = customSteps;

            await onSubmit(data);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                    <div>
                        <h6 className="text-base font-bold text-foreground flex items-center gap-2">
                            <i className="fa-solid fa-paper-plane text-blue-500" /> Kirim untuk Approval
                        </h6>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Tentukan alur persetujuan untuk kontrak ini</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-muted/50 rounded-lg border border-border">
                        {[
                            { id: 'default', label: 'Otomatis', icon: 'bolt' },
                            { id: 'selectable', label: 'Pilih Alur', icon: 'list-check' },
                            { id: 'custom', label: 'Kustom', icon: 'wand-magic-sparkles' }
                        ].map(m => (
                            <button key={m.id} onClick={() => setMode(m.id as any)}
                                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-md transition-all ${mode === m.id ? 'bg-background text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                                <i className={`fa-solid fa-${m.icon} text-xs`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {initLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <i className="fa-solid fa-circle-notch fa-spin text-primary text-xl" />
                            <p className="text-xs text-muted-foreground">Memuat data alur...</p>
                        </div>
                    ) : (
                        <>
                            {mode === 'default' && (
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4 flex gap-3">
                                    <i className="fa-solid fa-circle-info text-blue-500 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Alur Standar</p>
                                        <p className="text-[11px] text-blue-600/80 dark:text-blue-500/80 leading-relaxed">
                                            Kontrak akan menggunakan alur approval default untuk tipe <strong>{contractType || 'General'}</strong>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mode === 'selectable' && (
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Pilih Template Alur</label>
                                    <div className="grid gap-2">
                                        {workflows.map(w => (
                                            <button key={w.id} onClick={() => setSelectedWorkflowId(w.id)}
                                                className={`flex items-start text-left gap-3 p-3 rounded-xl border transition-all ${selectedWorkflowId === w.id ? 'bg-primary/5 border-primary ring-1 ring-primary/20' : 'bg-muted/30 border-border hover:border-muted-foreground/30'}`}>
                                                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${selectedWorkflowId === w.id ? 'border-primary' : 'border-muted-foreground'}`}>
                                                    {selectedWorkflowId === w.id && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">{w.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{w.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {mode === 'custom' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Langkah Persetujuan</label>
                                        <button onClick={addStep} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                                            <i className="fa-solid fa-plus" /> Tambah Step
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                        {customSteps.map((step, idx) => (
                                            <div key={idx} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3 relative group animate-in slide-in-from-right-4 duration-200">
                                                <button onClick={() => removeStep(idx)} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <i className="fa-solid fa-trash text-[10px]" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-5 h-5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-[11px] font-bold uppercase text-muted-foreground">Step {idx + 1}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Role Approver</label>
                                                        <select value={step.role} onChange={e => updateStep(idx, { role: e.target.value })}
                                                            className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                                                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Spesifik User (Opsional)</label>
                                                        <select value={step.user_id || ''} onChange={e => updateStep(idx, { user_id: e.target.value || undefined })}
                                                            className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                                                            <option value="">Semua dengan role ini</option>
                                                            {users.filter(u => u.role === step.role).map(u => (
                                                                <option key={u.id} value={u.id}>{u.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Deskripsi</label>
                                                    <input value={step.description} onChange={e => updateStep(idx, { description: e.target.value })}
                                                        placeholder="Contoh: Review legal aspek..."
                                                        className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/50">
                    <button onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                        Batal
                    </button>
                    <button onClick={handleSubmit} disabled={loading || initLoading || (mode === 'selectable' && !selectedWorkflowId) || (mode === 'custom' && customSteps.length === 0)}
                        className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                        {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />}
                        {loading ? 'Mengirim...' : 'Kirim Sekarang'}
                    </button>
                </div>
            </div>
        </div>
    );
}
