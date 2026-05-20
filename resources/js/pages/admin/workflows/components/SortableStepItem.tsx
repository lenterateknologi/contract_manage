import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ArrowDown,
    ArrowUp,
    Briefcase,
    CheckCircle2,
    ChevronUp,
    Copy,
    Eye,
    FileSignature,
    GitBranch,
    Key,
    Settings2,
    Shield,
    Trash2,
    Upload,
    UserCheck,
    Users as UsersIcon,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApproveModal } from './modals/ApproveModal';
import { AssignModal } from './modals/AssignModal';
import { RejectModal } from './modals/RejectModal';
import { ReviewModal } from './modals/ReviewModal';
import { UploadModal } from './modals/UploadModal';

export default function SortableStepItem({
    step,
    idx,
    totalSteps,
    contractStatuses,
    updateLocalStep,
    removeLocalStep,
    duplicateLocalStep,
    moveLocalStep,
    isExpanded,
    setIsExpanded,
    roles,
    departments,
    users,
}: {
    step: any;
    idx: number;
    totalSteps: number;
    contractStatuses: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
    duplicateLocalStep: (idx: number) => void;
    moveLocalStep: (idx: number, direction: 'up' | 'down') => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    roles: any[];
    departments: any[];
    users: any[];
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const { showToast } = useToast();

    // Simulation active modal state
    const [activeModal, setActiveModal] = useState<'approve' | 'reject' | 'assign' | 'upload' | 'review' | null>(null);
    // Filtered users for select dropdowns
    const userOptions = useMemo(() => {
        return (users || []).map((u) => ({
            value: String(u.id),
            label: `${u.name.toUpperCase()} (${(u.role || 'Staff').toUpperCase()})`,
        }));
    }, [users]);

    const legalUserOptions = useMemo(() => {
        let list = (users || []).filter(
            (u) => u.role?.toLowerCase().includes('legal') || u.role?.toLowerCase().includes('admin') || u.role?.toLowerCase().includes('staff'),
        );
        if (list.length === 0) list = users || [];
        return list.map((u) => ({
            value: String(u.id),
            label: `${u.name.toUpperCase()} (${(u.role || 'Legal Staff').toUpperCase()})`,
        }));
    }, [users]);

    const actorLabel = useMemo(() => {
        switch (step.actor_type) {
            case 'initiator':
                return 'INISIATOR';
            case 'approver':
                return 'PENYETUJU';
            case 'legal':
                return 'LEGAL';
            case 'atasan':
                return 'ATASAN';
            default:
                return 'BELUM DIATUR';
        }
    }, [step.actor_type]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn('group/step flex flex-col gap-0 overflow-hidden transition-all duration-300', isDragging && 'z-50 scale-[1.01]')}
        >
            {/* --- Premium Header Card --- */}
            <div
                className={cn(
                    'group/header dark:bg-card relative flex gap-4 rounded-2xl border p-4 transition-all duration-500',
                    isExpanded
                        ? 'rounded-b-none border-b-0 bg-white shadow-2xl dark:bg-white/[0.02]'
                        : 'bg-white/50 shadow-sm hover:bg-white dark:bg-black/20 dark:hover:bg-white/[0.05]',
                    !step.actor_type && 'border-dashed border-rose-200 bg-rose-50/20',
                    step.actor_type ? 'border-primary/10' : 'border-primary/20',
                )}
            >
                <div className="flex shrink-0 flex-col items-center">
                    <div
                        {...attributes}
                        {...listeners}
                        className="border-primary/5 bg-primary/[0.03] hover:bg-primary/10 hover:border-primary/20 flex h-10 w-10 cursor-grab items-center justify-center rounded-xl border transition-all"
                    >
                        <div className="bg-primary/30 mb-0.5 h-1.5 w-1.5 rounded-full" />
                        <span className="text-primary/40 text-[10px] leading-none font-black">#{idx + 1}</span>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Primary Action Badge */}
                            {step.step_type && (
                                <div
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold tracking-tight uppercase shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
                                        step.step_type === 'condition'
                                            ? 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400'
                                            : 'border-slate-950 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black',
                                    )}
                                >
                                    {(step.step_type === 'approval' || step.step_type === 'APPROVAL') && <Shield size={10} />}
                                    {(step.step_type === 'condition' || step.step_type === 'CONDITION') && <GitBranch size={10} />}
                                    {(step.step_type === 'selection' || step.step_type === 'SELECTION') && <UsersIcon size={10} />}
                                    {(step.step_type === 'upload' || step.step_type === 'UPLOAD') && <Upload size={10} />}
                                    <span className="leading-none">
                                        {step.step_type === 'SELECTION'
                                            ? 'PENUGASAN'
                                            : step.step_type === 'APPROVAL'
                                              ? 'Persetujuan'
                                              : step.step_type === 'REVIEW'
                                                ? 'Peninjauan'
                                                : step.step_type === 'UPLOAD'
                                                  ? 'Unggah'
                                                  : step.step_type === 'CLOSING'
                                                    ? 'Selesai'
                                                    : step.step_type.replace('_', ' ')}
                                    </span>
                                </div>
                            )}

                            {/* Actor Badge */}
                            <div
                                className={cn(
                                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase',
                                    step.actor_type === 'initiator'
                                        ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400'
                                        : step.actor_type === 'legal'
                                          ? 'border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-800/50 dark:bg-indigo-950/30 dark:text-indigo-400'
                                          : step.actor_type === 'atasan'
                                            ? 'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400'
                                            : step.actor_type === 'approver'
                                              ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                                              : 'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400',
                                )}
                            >
                                <UserCheck size={10} /> {actorLabel}
                            </div>

                            {/* Conditional Flag */}
                            {step.condition_expression && (
                                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-600 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                    <GitBranch size={10} /> BERSYARAT
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {step.description && (
                                <span className="text-[10px] font-medium text-slate-500 italic dark:text-slate-400">"{step.description}"</span>
                            )}

                            {step.status_id && (
                                <div className="flex items-center gap-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                        {contractStatuses.find((s: any) => String(s.id) === String(step.status_id))?.label || 'Status Aktif'}
                                    </span>
                                </div>
                            )}

                            {step.allowed_actions?.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Shield size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        AKSI: {step.allowed_actions.map((a: string) => a.toUpperCase()).join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ml-6 flex shrink-0 items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => duplicateLocalStep(idx)}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white dark:hover:bg-slate-700"
                                title="Duplikat Tahap"
                            >
                                <Copy size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLocalStep(idx, 'up')}
                                disabled={idx === 0}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white disabled:opacity-10 dark:hover:bg-slate-700"
                                title="Pindah ke Atas"
                            >
                                <ArrowUp size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLocalStep(idx, 'down')}
                                disabled={idx === totalSteps - 1}
                                className="hover:text-primary h-7 w-7 rounded-md text-slate-400 transition-all hover:bg-white disabled:opacity-10 dark:hover:bg-slate-700"
                                title="Pindah ke Bawah"
                            >
                                <ArrowDown size={12} />
                            </Button>
                        </div>

                        <Button
                            variant={isExpanded ? 'default' : 'outline'}
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                'h-8 gap-2 rounded-lg px-3 text-[10px] font-bold tracking-tight uppercase transition-all',
                                isExpanded
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800',
                            )}
                        >
                            {isExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                            {isExpanded ? 'SIMPAN' : 'EDIT'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLocalStep(idx)}
                            className="h-8 w-8 rounded-lg text-slate-300 transition-all hover:bg-rose-50 hover:text-rose-500 dark:text-slate-700 dark:hover:bg-rose-500/10"
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Premium Expansion Block --- */}
            {isExpanded && (
                <div className="border-primary/10 animate-in fade-in slide-in-from-top-6 relative overflow-hidden rounded-b-3xl border-x border-b bg-white shadow-2xl duration-500 dark:bg-black/40">
                    <div className="relative z-10 p-6">
                        <div className="grid grid-cols-12 gap-6">
                            {/* --- Section 1: Basic Config --- */}
                            <div className="col-span-12 space-y-5 lg:col-span-6">
                                <div>
                                    <h4 className="text-primary/30 mb-4 flex items-center gap-2 text-[11px] font-black uppercase">
                                        <Settings2 size={12} /> Konfigurasi Dasar
                                    </h4>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                        <div className="col-span-2 space-y-1.5 sm:col-span-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Tipe Langkah</label>
                                            <Select
                                                value={step.step_type || 'none'}
                                                onValueChange={(v) => updateLocalStep(idx, { step_type: v === 'none' ? null : String(v) })}
                                            >
                                                <SelectTrigger className="col-span-2 h-9 space-y-1.5 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 sm:col-span-1 dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="none" className="py-2 text-[10px] font-bold uppercase italic opacity-40">
                                                        -- PILIH TIPE --
                                                    </SelectItem>
                                                    <SelectItem value="APPROVAL" className="py-2 text-[10px] font-bold uppercase">
                                                        PERSETUJUAN
                                                    </SelectItem>
                                                    <SelectItem value="MANAGEMENT" className="py-2 text-[10px] font-bold uppercase">
                                                        MANAGEMENT (OPSIONAL)
                                                    </SelectItem>
                                                    <SelectItem value="LEGAL" className="py-2 text-[10px] font-bold uppercase">
                                                        LEGAL / DRAFTING
                                                    </SelectItem>
                                                    <SelectItem value="TAX" className="py-2 text-[10px] font-bold uppercase">
                                                        PAJAK / TAX
                                                    </SelectItem>
                                                    <SelectItem value="UPLOAD" className="py-2 text-[10px] font-bold uppercase">
                                                        UNGGAH DOKUMEN
                                                    </SelectItem>
                                                    <SelectItem value="SIGNING" className="py-2 text-[10px] font-bold uppercase">
                                                        PENANDATANGANAN (2 PIHAK)
                                                    </SelectItem>
                                                    <SelectItem value="CLOSING" className="py-2 text-[10px] font-bold text-emerald-500 uppercase">
                                                        PENUTUPAN (FINISH)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Tahap</label>
                                            <input
                                                value={step.description || ''}
                                                onChange={(e) => updateLocalStep(idx, { description: e.target.value })}
                                                placeholder="Contoh: Review Legal Staff"
                                                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Tolak Ke</label>
                                            <Select
                                                value={String(step.reject_target || 'none')}
                                                onValueChange={(v) => updateLocalStep(idx, { reject_target: v === 'none' ? null : Number(v) })}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="none" className="py-2 text-[10px] font-bold uppercase opacity-40">
                                                        INISIATOR
                                                    </SelectItem>
                                                    {Array.from({ length: idx }, (_, i) => i + 1).map((num) => (
                                                        <SelectItem key={num} value={String(num)} className="py-2 text-[10px] font-bold uppercase">
                                                            Tahap {num}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Status Aktif</label>
                                            <Select
                                                value={String(step.status_id || 'none')}
                                                onValueChange={(v) => updateLocalStep(idx, { status_id: v === 'none' ? null : Number(v) })}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="none" className="py-2 text-[10px] font-bold uppercase italic opacity-40">
                                                        -- PILIH STATUS --
                                                    </SelectItem>
                                                    {contractStatuses.map((s: any) => (
                                                        <SelectItem key={s.id} value={String(s.id)} className="py-2 text-[10px] font-bold uppercase">
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Section 2: Logika Eksekusi --- */}
                            <div className="col-span-12 space-y-6 lg:col-span-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Metadata Logic (Visibility) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={16} className="text-slate-400" />
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase">Ekspresi Kondisi (Metadata)</h4>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateLocalStep(idx, { condition_expression: step.condition_expression ? null : 'METADATA_KEY' })
                                                }
                                                className={cn(
                                                    'flex h-6 items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase transition-all',
                                                    step.condition_expression
                                                        ? 'bg-slate-900 text-white shadow-sm'
                                                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
                                                )}
                                            >
                                                {step.condition_expression ? 'AKTIF' : 'NON-AKTIF'}
                                            </button>
                                        </div>

                                        <div className="min-h-[60px]">
                                            {step.condition_expression !== null ? (
                                                <div className="animate-in zoom-in-95 duration-200">
                                                    <div className="relative">
                                                        <Key className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={14} />
                                                        <input
                                                            value={step.condition_expression || ''}
                                                            onChange={(e) => updateLocalStep(idx, { condition_expression: e.target.value })}
                                                            placeholder="Contoh: IS_TAX == true"
                                                            className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[11px] font-bold outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex h-[60px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 dark:border-slate-800/50 dark:bg-black/10">
                                                    <p className="text-[8px] font-bold text-slate-300 uppercase">Selalu Diproses</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Section 3: Actor Pools (Per-Step) --- */}
                            {(step.actor_type === 'approver' || step.actor_type === 'legal' || step.step_type === 'MANAGEMENT') && (
                                <div className="col-span-12 mt-2 border-t border-slate-100 pt-6 dark:border-slate-800">
                                    <div className="mb-4 flex items-center gap-2">
                                        <UsersIcon size={14} className="text-primary/40" />
                                        <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Pool Otoritas Langkah</h4>
                                    </div>
                                    <div className="col-span-2 space-y-1.5 sm:col-span-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Pemeran (Actor)</label>
                                        <Select
                                            value={step.actor_type || 'approver'}
                                            onValueChange={(v) => updateLocalStep(idx, { actor_type: String(v) })}
                                        >
                                            <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="initiator" className="py-2 text-[10px] font-bold uppercase">
                                                    INISIATOR
                                                </SelectItem>
                                                <SelectItem value="approver" className="py-2 text-[10px] font-bold uppercase">
                                                    PENYETUJU (POOL)
                                                </SelectItem>
                                                <SelectItem value="legal" className="py-2 text-[10px] font-bold uppercase">
                                                    LEGAL (POOL)
                                                </SelectItem>
                                                <SelectItem value="atasan" className="py-2 text-[10px] font-bold uppercase">
                                                    ATASAN LANGSUNG
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* add divider */}
                                    <div className="m-5"></div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        {/* Role Pool */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <Shield size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase">ROLE POOL</span>
                                            </div>
                                            <div className="custom-scrollbar max-h-[160px] space-y-1 overflow-y-auto pr-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateLocalStep(idx, { role: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        !step.role || step.role.length === 0
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="w-full text-center text-[10px] font-bold uppercase">SEMUA ROLE</span>
                                                </button>
                                                {roles.map((role: any) => {
                                                    const isSelected = step.role?.includes(role.name);
                                                    return (
                                                        <button
                                                            key={role.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.role || [];
                                                                const next = isSelected
                                                                    ? current.filter((r: string) => r !== role.name)
                                                                    : [...current, role.name];
                                                                updateLocalStep(idx, { role: next });
                                                            }}
                                                            className={cn(
                                                                'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                isSelected
                                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                                    : 'border-transparent hover:bg-slate-100',
                                                            )}
                                                        >
                                                            <span className="text-[10px] font-bold uppercase">{role.name}</span>
                                                            {isSelected && <CheckCircle2 size={10} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Unit Pool */}
                                        <div className="space-y-3 border-l border-slate-100 pl-6 dark:border-slate-800">
                                            <div className="flex items-center gap-2 px-1">
                                                <Briefcase size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase">UNIT POOL</span>
                                            </div>
                                            <div className="custom-scrollbar max-h-[160px] space-y-1 overflow-y-auto pr-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateLocalStep(idx, { department_ids: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        !step.department_ids || step.department_ids.length === 0
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="w-full text-center text-[10px] font-bold uppercase">SEMUA UNIT</span>
                                                </button>
                                                {departments.map((dept: any) => {
                                                    const isSelected = step.department_ids?.includes(String(dept.id));
                                                    return (
                                                        <button
                                                            key={dept.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.department_ids || [];
                                                                const next = isSelected
                                                                    ? current.filter((d: string) => d !== String(dept.id))
                                                                    : [...current, String(dept.id)];
                                                                updateLocalStep(idx, { department_ids: next });
                                                            }}
                                                            className={cn(
                                                                'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                isSelected
                                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                                    : 'border-transparent hover:bg-slate-100',
                                                            )}
                                                        >
                                                            <span className="text-[10px] font-bold uppercase">{dept.name}</span>
                                                            {isSelected && <CheckCircle2 size={10} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* User Pool */}
                                        <div className="space-y-3 border-l border-slate-100 pl-6 dark:border-slate-800">
                                            <div className="flex items-center gap-2 px-1">
                                                <UsersIcon size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase">USER POOL</span>
                                            </div>
                                            <div className="custom-scrollbar max-h-[160px] space-y-1 overflow-y-auto pr-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateLocalStep(idx, { user_ids: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        !step.user_ids || step.user_ids.length === 0
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="w-full text-center text-[10px] font-bold uppercase">SEMUA USER</span>
                                                </button>
                                                {users.map((user: any) => {
                                                    const isSelected = step.user_ids?.includes(String(user.id));
                                                    return (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.user_ids || [];
                                                                const next = isSelected
                                                                    ? current.filter((u: string) => u !== String(user.id))
                                                                    : [...current, String(user.id)];
                                                                updateLocalStep(idx, { user_ids: next });
                                                            }}
                                                            className={cn(
                                                                'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                isSelected
                                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                                    : 'border-transparent hover:bg-slate-100',
                                                            )}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold uppercase">{user.name}</span>
                                                                <span className="text-[8px] uppercase opacity-50">{user.role}</span>
                                                            </div>
                                                            {isSelected && <CheckCircle2 size={10} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- Section 4: Signing Configuration --- */}
                    {step.step_type === 'SIGNING' && (
                        <div className="col-span-12 mt-2 border-t border-slate-100 pt-6 dark:border-slate-800">
                            <div className="mb-4 flex items-center gap-2">
                                <FileSignature size={14} className="text-primary/40" />
                                <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                    Konfigurasi Penandatanganan (2 Pihak)
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                {/* Party 1 */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                                            <span className="text-[10px] font-black">P1</span>
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                                Pihak Pertama
                                            </h5>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Download Draft & Upload TTD</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="px-1 text-[9px] font-bold text-slate-400 uppercase">Pemeran Penandatangan</label>
                                        <Select
                                            value={step.signing_party_1 || 'initiator'}
                                            onValueChange={(v) => updateLocalStep(idx, { signing_party_1: v })}
                                        >
                                            <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold dark:border-slate-800 dark:bg-black/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="initiator">INISIATOR (PIC / PEMBUAT)</SelectItem>
                                                <SelectItem value="legal">LEGAL STAFF</SelectItem>
                                                <SelectItem value="manager_legal">MANAGER LEGAL</SelectItem>
                                                <SelectItem value="vp_legal">VP LEGAL / MANAGEMENT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Party 2 */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                                            <span className="text-[10px] font-black">P2</span>
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                                Pihak Kedua
                                            </h5>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Download P1 & Upload Final</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="px-1 text-[9px] font-bold text-slate-400 uppercase">Pemeran Penandatangan</label>
                                        <Select
                                            value={step.signing_party_2 || 'vendor'}
                                            onValueChange={(v) => updateLocalStep(idx, { signing_party_2: v })}
                                        >
                                            <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold dark:border-slate-800 dark:bg-black/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="vendor">VENDOR / PIHAK LUAR</SelectItem>
                                                <SelectItem value="initiator">INISIATOR (PIC / PEMBUAT)</SelectItem>
                                                <SelectItem value="legal">LEGAL STAFF</SelectItem>
                                                <SelectItem value="vp_legal">VP LEGAL / MANAGEMENT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Section 3: Konfigurasi Aksi & Simulasi --- */}
                    <div className="border-t border-slate-100 bg-slate-50/20 px-8 py-6 dark:border-slate-800 dark:bg-black/10">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Left Column: Aksi yang Diijinkan */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Aksi yang Diijinkan</span>
                                <div className="flex flex-wrap gap-2">
                                    {['APPROVE', 'REJECT', 'ASSIGN', 'UPLOAD', 'REVIEW'].map((action) => {
                                        const isSelected =
                                            step.allowed_actions?.includes(action.toLowerCase()) || step.allowed_actions?.includes(action);
                                        return (
                                            <button
                                                key={action}
                                                type="button"
                                                onClick={() => {
                                                    const current = step.allowed_actions || [];
                                                    const actionLower = action.toLowerCase();
                                                    const next = current.includes(actionLower)
                                                        ? current.filter((a: string) => a !== actionLower)
                                                        : [...current, actionLower];
                                                    updateLocalStep(idx, { allowed_actions: next });
                                                }}
                                                className={cn(
                                                    'rounded-lg border px-3 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all',
                                                    isSelected
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm shadow-slate-900/20 dark:border-slate-100 dark:bg-white dark:text-slate-900 dark:shadow-white/20'
                                                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900',
                                                )}
                                            >
                                                {action}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Column: Simulasi Tombol Aksi */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Simulasi Tombol Aksi</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {(() => {
                                        const actions = (step.allowed_actions || []).map((a: string) => a.toLowerCase());
                                        const buttons = [];

                                        const nextStep = idx + 2;

                                        if (actions.includes('approve')) {
                                            buttons.push({
                                                label: 'Setujui',
                                                actionType: 'approve',
                                                color: 'bg-emerald-600 hover:bg-emerald-700',
                                                icon: CheckCircle2,
                                                tooltip: nextStep > totalSteps ? 'Selesai / Final' : `Lanjut ke Tahap ${nextStep}`,
                                            });
                                        }
                                        if (actions.includes('reject')) {
                                            const target = step.reject_target ? `Tahap ${step.reject_target}` : 'INISIATOR';
                                            buttons.push({
                                                label: 'Tolak',
                                                actionType: 'reject',
                                                color: 'bg-rose-500 hover:bg-rose-600',
                                                icon: XCircle,
                                                tooltip: `Tolak Kontrak ke ${target}`,
                                            });
                                        }
                                        if (actions.includes('assign')) {
                                            buttons.push({
                                                label: 'Tugaskan',
                                                actionType: 'assign',
                                                color: 'bg-blue-600 hover:bg-blue-700',
                                                icon: UserCheck,
                                                tooltip: `Penugasan PIC di Tahap ${idx + 1}`,
                                            });
                                        }
                                        if (
                                            actions.includes('upload') ||
                                            (step.step_type &&
                                                (step.step_type.toUpperCase() === 'UPLOAD' || step.step_type.toUpperCase() === 'SIGNING'))
                                        ) {
                                            buttons.push({
                                                label: 'Unggah',
                                                actionType: 'upload',
                                                color: 'bg-indigo-600 hover:bg-indigo-700',
                                                icon: Upload,
                                                tooltip:
                                                    step.step_type === 'SIGNING'
                                                        ? `Unggah Draft Ter-TTD (Pihak ${idx + 1})`
                                                        : `Unggah Dokumen di Tahap ${idx + 1}`,
                                            });
                                        }
                                        if (actions.includes('review') || (step.step_type && step.step_type.toUpperCase() === 'REVIEW')) {
                                            buttons.push({
                                                label: 'Review',
                                                actionType: 'review',
                                                color: 'bg-indigo-600 hover:bg-indigo-700',
                                                icon: Eye,
                                                tooltip: `Review Kontrak di Tahap ${idx + 1}`,
                                            });
                                        }

                                        if (buttons.length === 0) {
                                            return (
                                                <div className="py-1.5 text-[10px] font-bold text-slate-400 uppercase italic">
                                                    Pilih Aksi di Sebelah Kiri Untuk Simulasi
                                                </div>
                                            );
                                        }

                                        return buttons.map((btn, bIdx) => (
                                            <button
                                                key={bIdx}
                                                type="button"
                                                title={btn.tooltip}
                                                onClick={() => setActiveModal(btn.actionType as any)}
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-white shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95',
                                                    btn.color,
                                                )}
                                            >
                                                <btn.icon size={13} className="opacity-80" />
                                                <span className="text-[9px] font-black tracking-wider uppercase">{btn.label}</span>
                                            </button>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Interactive Simulated Modals --- */}

                    {/* --- Approve Modal --- */}
                    <ApproveModal
                        isOpen={activeModal === 'approve'}
                        onClose={() => setActiveModal(null)}
                        step={step}
                        idx={idx}
                        userOptions={userOptions}
                        showToast={showToast}
                    />

                    <RejectModal isOpen={activeModal === 'reject'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />

                    <AssignModal
                        isOpen={activeModal === 'assign'}
                        onClose={() => setActiveModal(null)}
                        legalUserOptions={legalUserOptions}
                        showToast={showToast}
                    />

                    <UploadModal isOpen={activeModal === 'upload'} onClose={() => setActiveModal(null)} step={step} showToast={showToast} />

                    <ReviewModal isOpen={activeModal === 'review'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />
                </div>
            )}
        </div>
    );
}
