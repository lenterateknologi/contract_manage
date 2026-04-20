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
    onSubmit: (data: { workflow_id?: string; custom_steps?: CustomStep[]; metadata?: any }) => Promise<void>;
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
    const [metadata, setMetadata] = useState<Record<string, any>>({
        tax_required: false,
    });

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
            const data: { workflow_id?: string; custom_steps?: CustomStep[]; metadata?: any } = {};
            if (mode === 'selectable') data.workflow_id = selectedWorkflowId;
            if (mode === 'custom') data.custom_steps = customSteps;
            data.metadata = metadata;

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
                    {/* Workflow Options / Logic Gates */}
                    <div className="space-y-4">
                        <div className="bg-muted/30 border-border rounded-xl border p-4">
                            <label className="flex cursor-pointer items-center justify-between">
                                <span className="flex items-center gap-3">
                                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                                        <i className="fa-solid fa-receipt text-primary text-sm" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold">Tax Review Required?</span>
                                        <span className="text-muted-foreground text-[10px]">Pilih jika kontrak ini memerlukan review dari tim Pajak</span>
                                    </div>
                                </span>
                                <div
                                    onClick={() => setMetadata({ ...metadata, tax_required: !metadata.tax_required })}
                                    className={`relative h-5 w-9 rounded-full transition-colors ${metadata.tax_required ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                >
                                    <div
                                        className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${metadata.tax_required ? 'left-5' : 'left-1'}`}
                                    />
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 rounded-xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-800/30 dark:bg-blue-900/10">
                        <i className="fa-solid fa-circle-info mt-0.5 text-blue-500" />
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Alur Standar (Otomatis)</p>
                            <p className="text-[11px] leading-relaxed text-blue-600/80 dark:text-blue-500/80">
                                Kontrak akan dikirim menggunakan alur persetujuan standar yang telah disesuaikan secara otomatis.
                            </p>
                        </div>
                    </div>

                    {initLoading && (
                        <div className="flex flex-col items-center justify-center gap-3 py-6">
                            <i className="fa-solid fa-circle-notch fa-spin text-primary text-xl" />
                            <p className="text-muted-foreground text-xs">Menyiapkan alur...</p>
                        </div>
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
