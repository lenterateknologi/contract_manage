import { contractApi } from '@/lib/contract-api';
import { UserProfile } from '@/types/contracts';
import { useEffect, useState } from 'react';

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
            const [w, u, r] = await Promise.all([contractApi.getWorkflows(), contractApi.getUsers(), contractApi.getRoles()]);
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-card border-border animate-in fade-in zoom-in-95 my-auto w-full max-w-lg rounded-xl border shadow-2xl duration-200">
                <div className="border-border/50 flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h6 className="text-foreground flex items-center gap-2 text-base font-bold">
                            <i className="fa-solid fa-paper-plane text-blue-500" /> Kirim untuk Approval
                        </h6>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">Tentukan alur persetujuan untuk kontrak ini</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    {/* Mode Selector */}
                    <div className="bg-muted/50 border-border grid grid-cols-3 gap-2 rounded-lg border p-1">
                        {[
                            { id: 'default', label: 'Otomatis', icon: 'bolt' },
                            { id: 'selectable', label: 'Pilih Alur', icon: 'list-check' },
                            { id: 'custom', label: 'Kustom', icon: 'wand-magic-sparkles' },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id as any)}
                                className={`flex flex-col items-center gap-1.5 rounded-md py-2.5 transition-all ${mode === m.id ? 'bg-background text-primary ring-border shadow-sm ring-1' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                            >
                                <i className={`fa-solid fa-${m.icon} text-xs`} />
                                <span className="text-[10px] font-bold tracking-wider uppercase">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {initLoading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <i className="fa-solid fa-circle-notch fa-spin text-primary text-xl" />
                            <p className="text-muted-foreground text-xs">Memuat data alur...</p>
                        </div>
                    ) : (
                        <>
                            {mode === 'default' && (
                                <div className="flex gap-3 rounded-xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-800/30 dark:bg-blue-900/10">
                                    <i className="fa-solid fa-circle-info mt-0.5 text-blue-500" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Alur Standar</p>
                                        <p className="text-[11px] leading-relaxed text-blue-600/80 dark:text-blue-500/80">
                                            Kontrak akan menggunakan alur approval default untuk tipe <strong>{contractType || 'General'}</strong>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {mode === 'selectable' && (
                                <div className="space-y-4">
                                    <label className="text-muted-foreground ml-1 block text-xs font-bold tracking-wider uppercase">
                                        Pilih Template Alur
                                    </label>
                                    <div className="grid gap-2">
                                        {workflows.map((w) => (
                                            <button
                                                key={w.id}
                                                onClick={() => setSelectedWorkflowId(w.id)}
                                                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${selectedWorkflowId === w.id ? 'bg-primary/5 border-primary ring-primary/20 ring-1' : 'bg-muted/30 border-border hover:border-muted-foreground/30'}`}
                                            >
                                                <div
                                                    className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${selectedWorkflowId === w.id ? 'border-primary' : 'border-muted-foreground'}`}
                                                >
                                                    {selectedWorkflowId === w.id && <div className="bg-primary h-1.5 w-1.5 rounded-full" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">{w.name}</p>
                                                    <p className="text-muted-foreground mt-0.5 text-[10px]">{w.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {mode === 'custom' && (
                                <div className="space-y-4">
                                    <div className="ml-1 flex items-center justify-between">
                                        <label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                            Langkah Persetujuan
                                        </label>
                                        <button
                                            onClick={addStep}
                                            className="text-primary flex items-center gap-1 text-[10px] font-bold hover:underline"
                                        >
                                            <i className="fa-solid fa-plus" /> Tambah Step
                                        </button>
                                    </div>
                                    <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                                        {customSteps.map((step, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-muted/30 border-border group animate-in slide-in-from-right-4 relative space-y-3 rounded-xl border p-4 duration-200"
                                            >
                                                <button
                                                    onClick={() => removeStep(idx)}
                                                    className="text-muted-foreground absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                                                >
                                                    <i className="fa-solid fa-trash text-[10px]" />
                                                </button>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <div className="bg-primary/10 text-primary flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-muted-foreground text-[11px] font-bold uppercase">Step {idx + 1}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-muted-foreground ml-1 text-[10px] font-bold uppercase">
                                                            Role Approver
                                                        </label>
                                                        <select
                                                            value={step.role}
                                                            onChange={(e) => updateStep(idx, { role: e.target.value })}
                                                            className="bg-background border-border focus:ring-primary focus:border-primary w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-1"
                                                        >
                                                            {roles.map((r) => (
                                                                <option key={r.id} value={r.name}>
                                                                    {r.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-muted-foreground ml-1 text-[10px] font-bold uppercase">
                                                            Spesifik User (Opsional)
                                                        </label>
                                                        <select
                                                            value={step.user_id || ''}
                                                            onChange={(e) => updateStep(idx, { user_id: e.target.value || undefined })}
                                                            className="bg-background border-border focus:ring-primary focus:border-primary w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-1"
                                                        >
                                                            <option value="">Semua dengan role ini</option>
                                                            {users
                                                                .filter((u) => u.role === step.role)
                                                                .map((u) => (
                                                                    <option key={u.id} value={u.id}>
                                                                        {u.name}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-muted-foreground ml-1 text-[10px] font-bold uppercase">Deskripsi</label>
                                                    <input
                                                        value={step.description}
                                                        onChange={(e) => updateStep(idx, { description: e.target.value })}
                                                        placeholder="Contoh: Review legal aspek..."
                                                        className="bg-background border-border focus:ring-primary focus:border-primary w-full rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-1"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="border-border/50 flex justify-end gap-3 border-t px-6 py-4">
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-4 py-2 text-xs font-bold transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            loading ||
                            initLoading ||
                            (mode === 'selectable' && !selectedWorkflowId) ||
                            (mode === 'custom' && customSteps.length === 0)
                        }
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 flex items-center gap-2 rounded-lg px-6 py-2 text-xs font-bold shadow-lg transition-all disabled:opacity-50"
                    >
                        {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />}
                        {loading ? 'Mengirim...' : 'Kirim Sekarang'}
                    </button>
                </div>
            </div>
        </div>
    );
}
