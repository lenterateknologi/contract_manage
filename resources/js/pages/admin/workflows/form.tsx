import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Key,
    Briefcase,
    CheckCircle2,
    GitBranch,
    GripVertical,
    Info,
    LayoutTemplate,
    Plus,
    PlusCircle,
    ExternalLink,
    Search,
    ChevronUp,
    Settings2,
    Shield,
    Trash2,
    UserCheck,
    Users as UsersIcon,
    Scale,
    CornerDownLeft,
    ChevronRight,
    Copy,
    Edit3,
    Eye,
    ArrowUp,
    ArrowDown,
    XCircle,
    X,
    Upload,
    RotateCcw,
    Globe,
    Building2,
    FileSignature,
    PenTool,
} from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import { WorkflowVisualizer } from '@/components/admin/WorkflowVisualizer';

// --- Sortable Step Item (Compact) ---
function SortableStepItem({
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

    const actorLabel = useMemo(() => {
        switch (step.actor_type) {
            case 'initiator': return 'INISIATOR';
            case 'approver': return 'PENYETUJU';
            case 'legal': return 'LEGAL';
            case 'atasan': return 'ATASAN';
            default: return 'BELUM DIATUR';
        }
    }, [step.actor_type]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group/step flex flex-col gap-0 overflow-hidden transition-all duration-300',
                isDragging && 'z-50 scale-[1.01]',
            )}
        >
            {/* --- Premium Header Card --- */}
            <div className={cn(
                'group/header relative flex gap-4 rounded-2xl border p-4 transition-all duration-500 dark:bg-card',
                isExpanded ? 'rounded-b-none border-b-0 shadow-2xl bg-white dark:bg-white/[0.02]' : 'shadow-sm bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/[0.05]',
                !step.actor_type && 'border-rose-200 border-dashed bg-rose-50/20',
                step.actor_type ? 'border-primary/10' : 'border-primary/20',
            )}>
                <div className="flex shrink-0 flex-col items-center">
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex h-10 w-10 cursor-grab items-center justify-center rounded-xl border border-primary/5 bg-primary/[0.03] transition-all hover:bg-primary/10 hover:border-primary/20"
                    >
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/30 mb-0.5" />
                            <span className="text-[10px] font-black text-primary/40 leading-none">#{idx + 1}</span>
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Primary Action Badge */}
                            {step.step_type && (
                                <div className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-tight uppercase border shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
                                    step.step_type === 'condition'
                                        ? "bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                                        : "bg-slate-900 text-white border-slate-950 dark:bg-white dark:text-black dark:border-white"
                                )}>
                                    {(step.step_type === 'approval' || step.step_type === 'APPROVAL') && <Shield size={10} />}
                                    {(step.step_type === 'condition' || step.step_type === 'CONDITION') && <GitBranch size={10} />}
                                    {(step.step_type === 'selection' || step.step_type === 'SELECTION') && <UsersIcon size={10} />}
                                    {(step.step_type === 'upload' || step.step_type === 'UPLOAD') && <Upload size={10} />}
                                    <span className="leading-none">
                                        {step.step_type === 'SELECTION' ? 'PENUGASAN' :
                                         step.step_type === 'APPROVAL' ? 'Persetujuan' :
                                         step.step_type === 'REVIEW' ? 'Peninjauan' :
                                         step.step_type === 'UPLOAD' ? 'Unggah' :
                                         step.step_type === 'CLOSING' ? 'Selesai' :
                                         step.step_type.replace('_', ' ')}
                                    </span>
                                </div>
                            )}

                            {/* Actor Badge */}
                            <div className={cn(
                                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border",
                                step.actor_type === 'initiator' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50" :
                                step.actor_type === 'legal' ? "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/50" :
                                step.actor_type === 'atasan' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50" :
                                step.actor_type === 'approver' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50" :
                                "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50"
                            )}>
                                <UserCheck size={10} /> {actorLabel}
                            </div>

                            {/* Conditional Flag */}
                            {step.condition_expression && (
                                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                    <GitBranch size={10} /> BERSYARAT
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {step.description && (
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic">"{step.description}"</span>
                            )}

                            {step.status_id && (
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        {contractStatuses.find((s: any) => String(s.id) === String(step.status_id))?.label || 'Status Aktif'}
                                    </span>
                                </div>
                            )}

                            {step.allowed_actions?.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Shield size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                                className="h-7 w-7 text-slate-400 hover:bg-white hover:text-primary dark:hover:bg-slate-700 rounded-md transition-all"
                                title="Duplikat Tahap"
                            >
                                <Copy size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLocalStep(idx, 'up')}
                                disabled={idx === 0}
                                className="h-7 w-7 text-slate-400 hover:bg-white hover:text-primary dark:hover:bg-slate-700 rounded-md transition-all disabled:opacity-10"
                                title="Pindah ke Atas"
                            >
                                <ArrowUp size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLocalStep(idx, 'down')}
                                disabled={idx === totalSteps - 1}
                                className="h-7 w-7 text-slate-400 hover:bg-white hover:text-primary dark:hover:bg-slate-700 rounded-md transition-all disabled:opacity-10"
                                title="Pindah ke Bawah"
                            >
                                <ArrowDown size={12} />
                            </Button>
                        </div>

                        <Button
                            variant={isExpanded ? "default" : "outline"}
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                "h-8 gap-2 rounded-lg px-3 text-[10px] font-bold tracking-tight uppercase transition-all",
                                isExpanded
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                    : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                            )}
                        >
                            {isExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                            {isExpanded ? 'SIMPAN' : 'EDIT'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLocalStep(idx)}
                            className="text-slate-300 hover:bg-rose-50 hover:text-rose-500 h-8 w-8 rounded-lg transition-all dark:text-slate-700 dark:hover:bg-rose-500/10"
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Premium Expansion Block --- */}
            {isExpanded && (
                <div className="relative border-x border-b border-primary/10 rounded-b-3xl bg-white shadow-2xl animate-in fade-in slide-in-from-top-6 duration-500 dark:bg-black/40 overflow-hidden">
                    <div className="relative z-10 p-6">
                        <div className="grid grid-cols-12 gap-6">
                            {/* --- Section 1: Basic Config --- */}
                            <div className="col-span-12 lg:col-span-6 space-y-5">
                                <div>
                                    <h4 className="mb-4 text-[11px] font-black tracking-widest text-primary/30 uppercase flex items-center gap-2">
                                        <Settings2 size={12} /> Konfigurasi Dasar
                                    </h4>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipe Langkah</label>
                                            <Select
                                                value={step.step_type || 'none'}
                                                onValueChange={(v) => updateLocalStep(idx, { step_type: v === 'none' ? null : String(v) })}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="none" className="py-2 text-[10px] font-bold uppercase opacity-40 italic">-- PILIH TIPE --</SelectItem>
                                                    <SelectItem value="APPROVAL" className="py-2 text-[10px] font-bold uppercase">PERSETUJUAN</SelectItem>
                                                    <SelectItem value="MANAGEMENT" className="py-2 text-[10px] font-bold uppercase">MANAGEMENT (OPSIONAL)</SelectItem>
                                                    <SelectItem value="LEGAL" className="py-2 text-[10px] font-bold uppercase">LEGAL / DRAFTING</SelectItem>
                                                    <SelectItem value="TAX" className="py-2 text-[10px] font-bold uppercase">PAJAK / TAX</SelectItem>
                                                    <SelectItem value="UPLOAD" className="py-2 text-[10px] font-bold uppercase">UNGGAH DOKUMEN</SelectItem>
                                                    <SelectItem value="SIGNING" className="py-2 text-[10px] font-bold uppercase">PENANDATANGANAN (2 PIHAK)</SelectItem>
                                                    <SelectItem value="CLOSING" className="py-2 text-[10px] font-bold uppercase text-emerald-500">PENUTUPAN (FINISH)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pemeran (Actor)</label>
                                            <Select
                                                value={step.actor_type || 'approver'}
                                                onValueChange={(v) => updateLocalStep(idx, { actor_type: String(v) })}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="initiator" className="py-2 text-[10px] font-bold uppercase">INISIATOR</SelectItem>
                                                    <SelectItem value="approver" className="py-2 text-[10px] font-bold uppercase">PENYETUJU (POOL)</SelectItem>
                                                    <SelectItem value="legal" className="py-2 text-[10px] font-bold uppercase">LEGAL (POOL)</SelectItem>
                                                    <SelectItem value="atasan" className="py-2 text-[10px] font-bold uppercase">ATASAN LANGSUNG</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Deskripsi Tahap</label>
                                            <input
                                                value={step.description || ''}
                                                onChange={(e) => updateLocalStep(idx, { description: e.target.value })}
                                                placeholder="Contoh: Review Legal Staff"
                                                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tolak Ke</label>
                                            <Select
                                                value={String(step.reject_target || 'none')}
                                                onValueChange={(v) => updateLocalStep(idx, { reject_target: v === 'none' ? null : Number(v) })}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="none" className="py-2 text-[10px] font-bold uppercase opacity-40">INISIATOR</SelectItem>
                                                    {Array.from({ length: idx }, (_, i) => i + 1).map((num) => (
                                                        <SelectItem key={num} value={String(num)} className="py-2 text-[10px] font-bold uppercase">
                                                            Tahap {num}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Aktif</label>
                                            <Select
                                                value={String(step.status_id || 'none')}
                                                onValueChange={(v) => updateLocalStep(idx, { status_id: v === 'none' ? null : Number(v) })}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="none" className="py-2 text-[10px] font-bold uppercase opacity-40 italic">-- PILIH STATUS --</SelectItem>
                                                    {contractStatuses.map((s: any) => (
                                                        <SelectItem key={s.id} value={String(s.id)} className="py-2 text-[10px] font-bold uppercase">{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="col-span-2 space-y-3">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aksi yang Diijinkan</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['APPROVE', 'REJECT', 'ASSIGN', 'UPLOAD', 'REVIEW'].map((action) => {
                                                    const isSelected = step.allowed_actions?.includes(action.toLowerCase()) || step.allowed_actions?.includes(action);
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
                                                                "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                                                                isSelected
                                                                    ? "bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-900/20"
                                                                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800"
                                                            )}
                                                        >
                                                            {action}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Section 2: Logika Eksekusi --- */}
                            <div className="col-span-12 lg:col-span-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Metadata Logic (Visibility) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={16} className="text-slate-400" />
                                                <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Ekspresi Kondisi (Metadata)</h4>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => updateLocalStep(idx, { condition_expression: step.condition_expression ? null : 'METADATA_KEY' })}
                                                className={cn(
                                                    "flex h-6 items-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-widest transition-all",
                                                    step.condition_expression
                                                        ? "bg-slate-900 text-white shadow-sm"
                                                        : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                                                )}
                                            >
                                                {step.condition_expression ? 'AKTIF' : 'NON-AKTIF'}
                                            </button>
                                        </div>

                                        <div className="min-h-[60px]">
                                            {step.condition_expression !== null ? (
                                                <div className="animate-in zoom-in-95 duration-200">
                                                    <div className="relative">
                                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                        <input
                                                            value={step.condition_expression || ''}
                                                            onChange={(e) => updateLocalStep(idx, { condition_expression: e.target.value })}
                                                            placeholder="Contoh: IS_TAX == true"
                                                            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[11px] font-bold outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex h-[60px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 dark:border-slate-800/50 dark:bg-black/10">
                                                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Selalu Diproses</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Section 3: Actor Pools (Per-Step) --- */}
                            {(step.actor_type === 'approver' || step.actor_type === 'legal' || step.step_type === 'MANAGEMENT') && (
                                <div className="col-span-12 border-t border-slate-100 pt-6 mt-2 dark:border-slate-800">
                                    <div className="mb-4 flex items-center gap-2">
                                        <UsersIcon size={14} className="text-primary/40" />
                                        <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Pool Otoritas Langkah</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Role Pool */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <Shield size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">ROLE POOL</span>
                                            </div>
                                            <div className="custom-scrollbar max-h-[160px] space-y-1 overflow-y-auto pr-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateLocalStep(idx, { roles: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        (!step.roles || step.roles.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                    )}
                                                >
                                                    <span className="text-[10px] font-bold uppercase text-center w-full">SEMUA ROLE</span>
                                                </button>
                                                {roles.map((role: any) => {
                                                    const isSelected = step.roles?.includes(role.name);
                                                    return (
                                                        <button
                                                            key={role.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.roles || [];
                                                                const next = isSelected ? current.filter((r: string) => r !== role.name) : [...current, role.name];
                                                                updateLocalStep(idx, { roles: next });
                                                            }}
                                                            className={cn('flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all', isSelected ? 'bg-slate-900 text-white border-slate-900' : 'hover:bg-slate-100 border-transparent')}
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
                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">UNIT POOL</span>
                                            </div>
                                            <div className="custom-scrollbar max-h-[160px] space-y-1 overflow-y-auto pr-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateLocalStep(idx, { departments: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        (!step.departments || step.departments.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                    )}
                                                >
                                                    <span className="text-[10px] font-bold uppercase text-center w-full">SEMUA UNIT</span>
                                                </button>
                                                {departments.map((dept: any) => {
                                                    const isSelected = step.departments?.includes(String(dept.id));
                                                    return (
                                                        <button
                                                            key={dept.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.departments || [];
                                                                const next = isSelected ? current.filter((d: string) => d !== String(dept.id)) : [...current, String(dept.id)];
                                                                updateLocalStep(idx, { departments: next });
                                                            }}
                                                            className={cn('flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all', isSelected ? 'bg-slate-900 text-white border-slate-900' : 'hover:bg-slate-100 border-transparent')}
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
                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">USER POOL</span>
                                            </div>
                                            <div className="custom-scrollbar max-h-[160px] space-y-1 overflow-y-auto pr-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateLocalStep(idx, { users: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        (!step.users || step.users.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                    )}
                                                >
                                                    <span className="text-[10px] font-bold uppercase text-center w-full">SEMUA USER</span>
                                                </button>
                                                {users.map((user: any) => {
                                                    const isSelected = step.users?.includes(String(user.id));
                                                    return (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.users || [];
                                                                const next = isSelected ? current.filter((u: string) => u !== String(user.id)) : [...current, String(user.id)];
                                                                updateLocalStep(idx, { users: next });
                                                            }}
                                                            className={cn('flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all', isSelected ? 'bg-slate-900 text-white border-slate-900' : 'hover:bg-slate-100 border-transparent')}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold uppercase">{user.name}</span>
                                                                <span className="text-[8px] opacity-50 uppercase">{user.role}</span>
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
                                <div className="col-span-12 border-t border-slate-100 pt-6 mt-2 dark:border-slate-800">
                                    <div className="mb-4 flex items-center gap-2">
                                        <FileSignature size={14} className="text-primary/40" />
                                        <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Konfigurasi Penandatanganan (2 Pihak)</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Party 1 */}
                                        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                                    <span className="text-[10px] font-black">P1</span>
                                                </div>
                                                <div>
                                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Pihak Pertama</h5>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Download Draft & Upload TTD</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Pemeran Penandatangan</label>
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
                                        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                                    <span className="text-[10px] font-black">P2</span>
                                                </div>
                                                <div>
                                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Pihak Kedua</h5>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Download P1 & Upload Final</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Pemeran Penandatangan</label>
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

                    {/* --- Section 3: Simulasi Tombol Aksi --- */}
                    <div className="border-t border-slate-100 bg-slate-50/20 px-8 py-6 dark:border-slate-800 dark:bg-black/10">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Simulasi Tombol Aksi</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {(() => {
                                    const actions = (step.allowed_actions || []).map((a: string) => a.toLowerCase());
                                    const buttons = [];

                                    const nextStep = idx + 2;
                                    
                                    if (actions.includes('approve')) {
                                        buttons.push({ 
                                            label: 'Setujui', 
                                            color: 'bg-emerald-600', 
                                            icon: CheckCircle2,
                                            tooltip: nextStep > totalSteps ? 'Selesai / Final' : `Lanjut ke Tahap ${nextStep}`
                                        });
                                    }
                                    if (actions.includes('reject')) {
                                        const target = step.reject_target ? `Tahap ${step.reject_target}` : 'INISIATOR';
                                        buttons.push({ 
                                            label: 'Tolak', 
                                            color: 'bg-rose-500', 
                                            icon: XCircle,
                                            tooltip: `Tolak Kontrak ke ${target}`
                                        });
                                    }
                                    if (actions.includes('assign')) {
                                        buttons.push({ 
                                            label: 'Tugaskan', 
                                            color: 'bg-blue-600', 
                                            icon: UserCheck,
                                            tooltip: `Penugasan PIC di Tahap ${idx + 1}`
                                        });
                                    }
                                    if (actions.includes('upload') || (step.step_type && (step.step_type.toUpperCase() === 'UPLOAD' || step.step_type.toUpperCase() === 'SIGNING'))) {
                                        buttons.push({ 
                                            label: 'Unggah', 
                                            color: 'bg-indigo-600', 
                                            icon: Upload,
                                            tooltip: step.step_type === 'SIGNING' ? `Unggah Draft Ter-TTD (Pihak ${idx + 1})` : `Unggah Dokumen di Tahap ${idx + 1}`
                                        });
                                    }
                                    if (actions.includes('review') || (step.step_type && step.step_type.toUpperCase() === 'REVIEW')) {
                                        buttons.push({ 
                                            label: 'Review', 
                                            color: 'bg-indigo-600', 
                                            icon: Eye,
                                            tooltip: `Review Kontrak di Tahap ${idx + 1}`
                                        });
                                    }

                                    if (buttons.length === 0) {
                                        return (
                                            <div className="text-[10px] font-bold text-slate-400 uppercase italic">
                                                Pilih Aksi yang Diijinkan Untuk Simulasi
                                            </div>
                                        );
                                    }

                                    return buttons.map((btn, bIdx) => (
                                        <div 
                                            key={bIdx} 
                                            title={btn.tooltip}
                                            className={cn(
                                                "flex cursor-help items-center gap-2.5 rounded-xl px-5 py-2.5 text-white transition-all shadow-sm hover:scale-105 active:scale-95",
                                                btn.color
                                            )}
                                        >
                                            <btn.icon size={14} className="opacity-80" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{btn.label}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main Workflow Editor Page ---
export default function WorkflowEditor({ auth, workflow, contractTypes, departments, roles, users, contractStatuses, companyGroups = [], regions = [], companies = [] }: any) {
    const { showToast } = useToast();
    const [isOrgExpanded, setIsOrgExpanded] = useState(false);
    const [isInitiatorExpanded, setIsInitiatorExpanded] = useState(false);

    const [groupSearchText, setGroupSearchText] = useState('');
    const [regionSearchText, setRegionSearchText] = useState('');
    const [companySearchText, setCompanySearchText] = useState('');

    const [initiatorUserSearch, setInitiatorUserSearch] = useState('');
    const [initiatorRoleSearch, setInitiatorRoleSearch] = useState('');
    const [initiatorDeptSearch, setInitiatorDeptSearch] = useState('');

    const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'list' | 'visual'>('list');

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const form = useForm({
        name: workflow?.name || '',
        contract_type: workflow?.contract_type || '',
        description: workflow?.description || '',
        is_default: !!workflow?.is_default,
        initiator_type: workflow?.initiator_type || 'all',
        initiator_roles: workflow?.initiator_roles || [],
        initiator_users: workflow?.initiator_users || [],
        initiator_departments: workflow?.initiator_departments || [],
        approver_roles: workflow?.approver_roles || [],
        approver_departments: workflow?.approver_departments || [],
        approver_users: workflow?.approver_users || [],
        legal_roles: workflow?.legal_roles || [],
        legal_departments: workflow?.legal_departments || [],
        legal_users: workflow?.legal_users || [],
        steps: workflow?.steps || [],
        department_id: workflow?.department_id || null,
        company_group_ids: workflow?.company_group_ids || [],
        region_ids: workflow?.region_ids || [],
        company_ids: workflow?.company_ids || [],
    });


    useEffect(() => {
        const hasRoles = form.data.initiator_roles.length > 0 || form.data.initiator_departments.length > 0;
        const hasUsers = form.data.initiator_users.length > 0;

        let type = 'all';
        if (hasUsers) type = 'user';
        else if (hasRoles) type = 'role';

        if (form.data.initiator_type !== type) {
            form.setData('initiator_type', type);
        }
    }, [form.data.initiator_roles, form.data.initiator_departments, form.data.initiator_users]);

    const handleOpenVisualizer = () => {
        // Save current steps and master data to localStorage for the new tab to pick up
        localStorage.setItem('workflow_preview_steps', JSON.stringify(form.data.steps));
        localStorage.setItem('workflow_master_groups', JSON.stringify(companyGroups));
        localStorage.setItem('workflow_master_regions', JSON.stringify(regions));
        localStorage.setItem('workflow_master_companies', JSON.stringify(companies));
        window.open(route('admin.workflows.visualize'), '_blank');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIdx = form.data.steps.findIndex((i: any) => i.id === active.id);
            const newIdx = form.data.steps.findIndex((i: any) => i.id === over.id);
            form.setData('steps', arrayMove(form.data.steps, oldIdx, newIdx));
        }
    };

    const addLocalStep = () => {
        form.setData('steps', [
            ...form.data.steps,
            {
                id: `new-${Date.now()}`,
                label: '',
                actor_type: 'approver',
                allowed_actions: ['approve', 'reject'],
                condition_expression: null,
                status_id: null,
                roles: [],
                departments: [],
                users: [],
                step: form.data.steps.length + 1,
            },
        ]);
    };


    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            onSuccess: () => showToast('Konfigurasi alur berhasil disimpan', 'success'),
            onError: (err: any) => showToast(err.error || 'Gagal menyimpan alur', 'danger'),
        };

        if (workflow) form.put(route('admin.workflows.update', workflow.id), options);
        else form.post(route('admin.workflows.store'), options);
    };

    return (
        <>
            <Head title={workflow ? 'Edit Workflow' : 'Registrasi Workflow Baru'} />

            <div className="flex h-full flex-col bg-white dark:bg-black">
                <ManagementForm
                    title={workflow ? 'Parameter Alur' : 'Registrasi Alur'}
                    subtitle={workflow ? `Konfigurasi tahapan untuk ${form.data.name}` : 'Mendefinisikan alur approval baru'}
                    onClose={() => router.visit(route('admin.workflows'))}
                    onSave={handleSubmit}
                    processing={form.processing}
                    isDirty={form.isDirty}
                    isEdit={!!workflow}
                    headerActions={
                        <Button type="button" onClick={addLocalStep} variant="ghost" className="h-9 rounded-xl px-4 text-xs font-bold border border-primary/20 hover:bg-primary/5 active:scale-95 transition-all">
                            <PlusCircle size={14} className="mr-1.5" /> Tambah Tahap
                        </Button>
                    }
                >
                    <div className="space-y-8">
                        <FormSection>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    <div className="lg:col-span-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <Edit3 size={10} /> Nama Alur Kerja
                                            </label>
                                            <input
                                                type="text"
                                                value={form.data.name}
                                                onChange={(e) => form.setData('name', e.target.value)}
                                                className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 text-xs font-bold transition-all focus:border-slate-900 focus:bg-white focus:ring-0 dark:border-slate-800 dark:bg-slate-900/50 dark:focus:border-white dark:focus:bg-slate-900"
                                                placeholder="Contoh: ALUR PERSETUJUAN KONTRAK LOGISTIK"
                                            />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <LayoutTemplate size={10} /> Jenis Kontrak
                                            </label>
                                            <Select
                                                value={form.data.contract_type || 'all'}
                                                onValueChange={(v) => form.setData('contract_type', v === 'all' ? '' : String(v))}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-black uppercase tracking-tight transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900/50 dark:focus:border-white">
                                                    <SelectValue placeholder="SEMUA JENIS" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                    <SelectItem value="all" className="py-2.5 text-[10px] font-black uppercase">SEMUA JENIS</SelectItem>
                                                    {contractTypes.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.name} className="py-2.5 text-[10px] font-black uppercase">
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* --- Configuration Grid (Org Scope & Authority) --- */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    {/* Column 1: Ruang Lingkup Organisasi */}
                                    <div className={cn("transition-all duration-300", isOrgExpanded ? "lg:col-span-2" : "lg:col-span-1")}>
                                        <div className={cn(
                                            'bg-slate-50 dark:bg-slate-900/50 rounded-2xl border p-5 transition-all h-full flex flex-col',
                                            (form.data.company_group_ids?.length > 0 || form.data.region_ids?.length > 0 || form.data.company_ids?.length > 0) ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 border-dashed',
                                        )}>
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <span className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest">
                                                        Ruang Lingkup Organisasi
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsOrgExpanded(!isOrgExpanded)}
                                                    className={cn(
                                                        "h-8 gap-2 rounded-lg px-4 text-[10px] font-bold tracking-tight uppercase transition-all",
                                                        isOrgExpanded ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400"
                                                    )}
                                                >
                                                    {isOrgExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                                                    {isOrgExpanded ? 'TUTUP' : 'ATUR'}
                                                </Button>
                                            </div>

                                            {/* Summary View */}
                                            {!isOrgExpanded && (
                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        const activeGroups = companyGroups.filter((g: any) => form.data.company_group_ids?.includes(g.id));
                                                        const activeRegions = regions.filter((r: any) => form.data.region_ids?.includes(r.id));
                                                        const activeCompanies = companies.filter((c: any) => form.data.company_ids?.includes(c.id));
                                                        
                                                        if (activeGroups.length === 0 && activeRegions.length === 0 && activeCompanies.length === 0) {
                                                            return (
                                                                <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-400 font-medium italic">
                                                                    <Info size={12} /> Seluruh Organisasi (Global)
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <>
                                                                {activeGroups.map((group: any) => (
                                                                    <div key={group.id} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-[11px] font-bold dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                                                        <span className="opacity-50 text-[9px]">GRP:</span> {group.name}
                                                                    </div>
                                                                ))}
                                                                {activeRegions.map((region: any) => (
                                                                    <div key={region.id} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 text-[11px] font-bold dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                                                                        <span className="opacity-50 text-[9px]">REG:</span> {region.name}
                                                                    </div>
                                                                ))}
                                                                {activeCompanies.map((company: any) => (
                                                                    <div key={company.id} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold dark:bg-white/5 dark:text-slate-300 dark:border-white/10">
                                                                        <span className="opacity-50 text-[9px]">CO:</span> {company.name}
                                                                    </div>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}


                                            {/* Expanded Edit View */}
                                            {isOrgExpanded && (
                                                <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800 flex-1">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {/* Group Column */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Building2 size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">GROUP</span>
                                                            </div>
                                                            <div className="relative group/search">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                                                                <input
                                                                    placeholder="CARI GROUP..."
                                                                    value={groupSearchText}
                                                                    onChange={(e) => setGroupSearchText(e.target.value)}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData({ ...form.data, company_group_ids: [], region_ids: [], company_ids: [] })}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        (!form.data.company_group_ids || form.data.company_group_ids.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA GROUP</span>
                                                                    {(!form.data.company_group_ids || form.data.company_group_ids.length === 0) && <CheckCircle2 size={10} />}
                                                                </button>
                                                                {companyGroups.filter((g: any) => !groupSearchText || g.name.toLowerCase().includes(groupSearchText.toLowerCase())).map((group: any) => {
                                                                    const isSelected = form.data.company_group_ids?.includes(group.id);
                                                                    return (
                                                                        <button
                                                                            key={group.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newGroups = isSelected 
                                                                                    ? form.data.company_group_ids.filter((id: string) => id !== group.id)
                                                                                    : [...(form.data.company_group_ids || []), group.id];
                                                                                form.setData({ ...form.data, company_group_ids: newGroups, region_ids: [], company_ids: [] });
                                                                            }}
                                                                            className={cn(
                                                                                'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent',
                                                                            )}
                                                                        >
                                                                            <span className="text-[10px] font-bold uppercase">{group.name}</span>
                                                                            {isSelected && <CheckCircle2 size={10} />}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Region Column */}
                                                        <div className="space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Globe size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">REGION</span>
                                                            </div>
                                                            <div className="relative group/search">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                                                                <input
                                                                    placeholder="CARI REGION..."
                                                                    value={regionSearchText}
                                                                    onChange={(e) => setRegionSearchText(e.target.value)}
                                                                    disabled={!form.data.company_group_ids || form.data.company_group_ids.length === 0}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[10px] font-bold uppercase outline-none focus:border-slate-900 disabled:opacity-30 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData({ ...form.data, region_ids: [], company_ids: [] })}
                                                                    disabled={!form.data.company_group_ids || form.data.company_group_ids.length === 0}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        (!form.data.region_ids || form.data.region_ids.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA REGION</span>
                                                                    {(!form.data.region_ids || form.data.region_ids.length === 0) && <CheckCircle2 size={10} />}
                                                                </button>
                                                                {regions.filter((r: any) => {
                                                                    if (!form.data.company_group_ids || form.data.company_group_ids.length === 0) return true;
                                                                    const validRegionIds = companies
                                                                        .filter((c: any) => form.data.company_group_ids.includes(c.company_group_id))
                                                                        .map((c: any) => c.region_id)
                                                                        .filter(Boolean);
                                                                    return validRegionIds.includes(r.id);
                                                                }).filter((r: any) => !regionSearchText || r.name.toLowerCase().includes(regionSearchText.toLowerCase())).map((region: any) => {
                                                                    const isSelected = form.data.region_ids?.includes(region.id);
                                                                    return (
                                                                        <button
                                                                            key={region.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newRegions = isSelected 
                                                                                    ? form.data.region_ids.filter((id: string) => id !== region.id)
                                                                                    : [...(form.data.region_ids || []), region.id];
                                                                                form.setData({ ...form.data, region_ids: newRegions, company_ids: [] });
                                                                            }}
                                                                            className={cn(
                                                                                'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent',
                                                                            )}
                                                                        >
                                                                            <span className="text-[10px] font-bold uppercase">{region.name}</span>
                                                                            {isSelected && <CheckCircle2 size={10} />}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Company Column */}
                                                        <div className="space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Building2 size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">PERUSAHAAN</span>
                                                            </div>
                                                            <div className="relative group/search">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                                                                <input
                                                                    placeholder="CARI PERUSAHAAN..."
                                                                    value={companySearchText}
                                                                    onChange={(e) => setCompanySearchText(e.target.value)}
                                                                    disabled={!form.data.region_ids || form.data.region_ids.length === 0}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[10px] font-bold uppercase outline-none focus:border-slate-900 disabled:opacity-30 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData('company_ids', [])}
                                                                    disabled={!form.data.region_ids || form.data.region_ids.length === 0}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        (!form.data.company_ids || form.data.company_ids.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA PERUSAHAAN</span>
                                                                    {(!form.data.company_ids || form.data.company_ids.length === 0) && <CheckCircle2 size={10} />}
                                                                </button>
                                                                {companies.filter((c: any) => form.data.region_ids.includes(c.region_id)).filter((c: any) => !companySearchText || c.name.toLowerCase().includes(companySearchText.toLowerCase())).map((company: any) => {
                                                                    const isSelected = form.data.company_ids?.includes(company.id);
                                                                    return (
                                                                        <button
                                                                            key={company.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newCompanies = isSelected 
                                                                                    ? form.data.company_ids.filter((id: string) => id !== company.id)
                                                                                    : [...(form.data.company_ids || []), company.id];
                                                                                form.setData('company_ids', newCompanies);
                                                                            }}
                                                                            className={cn(
                                                                                'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent',
                                                                            )}
                                                                        >
                                                                            <span className="text-[10px] font-bold uppercase">{company.name}</span>
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

                                    {/* Column 2: Otoritas Akses (Initiator) */}
                                    <div className={cn("transition-all duration-300", isInitiatorExpanded ? "lg:col-span-2" : "lg:col-span-1")}>
                                         <div className={cn(
                                             'bg-slate-50 dark:bg-slate-900/50 rounded-2xl border p-5 transition-all h-full flex flex-col',
                                             (form.data.initiator_roles.length > 0 || form.data.initiator_departments.length > 0 || form.data.initiator_users.length > 0) ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 border-dashed',
                                         )}>
                                             <div className="mb-4 flex items-center justify-between">
                                                 <div className="flex items-center gap-3">
                                                     <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                         <Shield size={16} />
                                                     </div>
                                                     <span className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest">
                                                         Otoritas Inisiator
                                                     </span>
                                                 </div>
                                                 <Button
                                                     type="button"
                                                     variant="outline"
                                                     onClick={() => setIsInitiatorExpanded(!isInitiatorExpanded)}
                                                     className={cn(
                                                         "h-8 gap-2 rounded-lg px-4 text-[10px] font-bold tracking-tight uppercase transition-all",
                                                         isInitiatorExpanded ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400"
                                                     )}
                                                 >
                                                     {isInitiatorExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                                                     {isInitiatorExpanded ? 'TUTUP' : 'ATUR'}
                                                 </Button>
                                             </div>
                                             {/* ... Initiator Summary and Content ... */}
                                             {!isInitiatorExpanded && (
                                                 <div className="flex flex-wrap gap-2">
                                                     {form.data.initiator_roles.length === 0 && form.data.initiator_departments.length === 0 && form.data.initiator_users.length === 0 ? (
                                                         <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-400 font-medium italic">
                                                             <Info size={12} /> Seluruh Personel (Global)
                                                         </div>
                                                     ) : (
                                                         <>
                                                             {form.data.initiator_roles.map((roleId: string) => (
                                                                 <div key={roleId} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-[11px] font-bold">
                                                                     <span className="opacity-50 text-[9px]">ROLE:</span> {roleId}
                                                                 </div>
                                                             ))}
                                                             {form.data.initiator_departments.map((deptId: string) => {
                                                                 const dept = departments.find((d: any) => String(d.id) === String(deptId));
                                                                 return (
                                                                     <div key={deptId} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 text-[11px] font-bold">
                                                                         <span className="opacity-50 text-[9px]">UNIT:</span> {dept?.name || deptId}
                                                                     </div>
                                                                 );
                                                             })}
                                                             {form.data.initiator_users.map((userId: string) => {
                                                                 const user = users.find((u: any) => String(u.id) === String(userId));
                                                                 return (
                                                                     <div key={userId} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                                                                         <span className="opacity-50 text-[9px]">USER:</span> {user?.name || userId}
                                                                     </div>
                                                                 );
                                                             })}
                                                         </>
                                                     )}
                                                 </div>
                                             )}
                                             {isInitiatorExpanded && (
                                                 <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800 flex-1">
                                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                         {/* Role Column */}
                                                         <div className="space-y-4">
                                                             <div className="flex items-center gap-2 px-1">
                                                                 <Shield size={12} className="text-slate-400" />
                                                                 <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">ROLE POOL</span>
                                                             </div>
                                                             <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto">
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => form.setData('initiator_roles', [])}
                                                                     className={cn(
                                                                         'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                         (!form.data.initiator_roles || form.data.initiator_roles.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                                     )}
                                                                 >
                                                                     <span className="text-[10px] font-bold uppercase">SEMUA ROLE</span>
                                                                     {(!form.data.initiator_roles || form.data.initiator_roles.length === 0) && <CheckCircle2 size={10} />}
                                                                 </button>
                                                                 {roles.filter((r: any) => !initiatorRoleSearch || r.name.toLowerCase().includes(initiatorRoleSearch.toLowerCase())).map((role: any) => {
                                                                     const isSelected = form.data.initiator_roles.includes(role.name);
                                                                     return (
                                                                         <button
                                                                             key={role.id}
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const newRoles = isSelected ? form.data.initiator_roles.filter((r: string) => r !== role.name) : [...form.data.initiator_roles, role.name];
                                                                                 form.setData('initiator_roles', newRoles);
                                                                             }}
                                                                             className={cn('flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all', isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100')}
                                                                         >
                                                                             <span className="text-[10px] font-bold uppercase">{role.name}</span>
                                                                             {isSelected && <CheckCircle2 size={10} />}
                                                                         </button>
                                                                     );
                                                                 })}
                                                             </div>
                                                         </div>
                                                         {/* Unit Column */}
                                                         <div className="space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                                                             <div className="flex items-center gap-2 px-1">
                                                                 <UsersIcon size={12} className="text-slate-400" />
                                                                 <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">UNIT POOL</span>
                                                             </div>
                                                             <div className="relative group/search">
                                                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                                                                 <input
                                                                     placeholder="CARI UNIT..."
                                                                     value={initiatorDeptSearch}
                                                                     onChange={(e) => setInitiatorDeptSearch(e.target.value)}
                                                                     className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                                 />
                                                             </div>
                                                             <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => form.setData('initiator_departments', [])}
                                                                     className={cn(
                                                                         'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                         (!form.data.initiator_departments || form.data.initiator_departments.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                                     )}
                                                                 >
                                                                     <span className="text-[10px] font-bold uppercase">SEMUA UNIT</span>
                                                                     {(!form.data.initiator_departments || form.data.initiator_departments.length === 0) && <CheckCircle2 size={10} />}
                                                                 </button>
                                                                 {departments.filter((d: any) => !initiatorDeptSearch || d.name.toLowerCase().includes(initiatorDeptSearch.toLowerCase())).map((dept: any) => {
                                                                     const isSelected = form.data.initiator_departments.includes(String(dept.id));
                                                                     return (
                                                                         <button
                                                                             key={dept.id}
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const next = isSelected 
                                                                                     ? form.data.initiator_departments.filter((id: string) => id !== String(dept.id))
                                                                                     : [...form.data.initiator_departments, String(dept.id)];
                                                                                 form.setData('initiator_departments', next);
                                                                             }}
                                                                             className={cn('flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all', isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100')}
                                                                         >
                                                                             <span className="text-[10px] font-bold uppercase">{dept.name}</span>
                                                                             {isSelected && <CheckCircle2 size={10} />}
                                                                         </button>
                                                                     );
                                                                 })}
                                                             </div>
                                                         </div>
                                                         {/* User Column */}
                                                         <div className="space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                                                             <div className="flex items-center gap-2 px-1">
                                                                 <UsersIcon size={12} className="text-slate-400" />
                                                                 <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">USER POOL</span>
                                                             </div>
                                                             <div className="relative group/search">
                                                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
                                                                 <input
                                                                     placeholder="CARI USER..."
                                                                     value={initiatorUserSearch}
                                                                     onChange={(e) => setInitiatorUserSearch(e.target.value)}
                                                                     className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                                 />
                                                             </div>
                                                             <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                 <button
                                                                     type="button"
                                                                     onClick={() => form.setData('initiator_users', [])}
                                                                     className={cn(
                                                                         'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                         (!form.data.initiator_users || form.data.initiator_users.length === 0) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'hover:bg-slate-100 border-transparent text-slate-400 italic',
                                                                     )}
                                                                 >
                                                                     <span className="text-[10px] font-bold uppercase">SEMUA USER</span>
                                                                     {(!form.data.initiator_users || form.data.initiator_users.length === 0) && <CheckCircle2 size={10} />}
                                                                 </button>
                                                                 {users.filter((u: any) => !initiatorUserSearch || u.name.toLowerCase().includes(initiatorUserSearch.toLowerCase())).map((user: any) => {
                                                                     const isSelected = form.data.initiator_users.includes(String(user.id));
                                                                     return (
                                                                         <button
                                                                             key={user.id}
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const next = isSelected 
                                                                                     ? form.data.initiator_users.filter((id: string) => id !== String(user.id))
                                                                                     : [...form.data.initiator_users, String(user.id)];
                                                                                 form.setData('initiator_users', next);
                                                                             }}
                                                                             className={cn('flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all', isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100')}
                                                                         >
                                                                             <div className="flex flex-col">
                                                                                 <span className="text-[10px] font-bold uppercase">{user.name}</span>
                                                                                 <span className="text-[8px] text-slate-400 font-medium uppercase tracking-tight">{user.role}</span>
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

                                </div>
                            </div>
                        </FormSection>

                        {/* --- Workflow Steps & Visualization Section --- */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <GitBranch size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Tahapan Alur Kerja</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Konfigurasi Urutan Approval & Penugasan</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
                                    <button 
                                        type="button"
                                        onClick={() => setActiveTab('list')}
                                        className={cn(
                                            "px-4 py-1.5 text-[9px] font-bold uppercase rounded-md transition-all",
                                            activeTab === 'list' ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-400"
                                        )}
                                    >
                                        Daftar Langkah
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setActiveTab('visual')}
                                        className={cn(
                                            "px-4 py-1.5 text-[9px] font-bold uppercase rounded-md transition-all",
                                            activeTab === 'visual' ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-400"
                                        )}
                                    >
                                        Visualisasi
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'visual' ? (
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                                    <WorkflowVisualizer 
                                        steps={form.data.steps} 
                                        companyGroups={companyGroups}
                                        regions={regions}
                                        companies={companies}
                                        className="h-[600px]" 
                                    />
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleOpenVisualizer}
                                            className="h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider"
                                        >
                                            <ExternalLink size={12} className="mr-2" />
                                            Buka di Tab Baru
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {form.data.steps.length === 0 ? (
                                        <div className="border-primary/5 bg-primary/[0.01] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-24 text-center dark:border-white/5 dark:bg-white/[0.01]">
                                            <div className="bg-primary/5 p-4 rounded-2xl mb-4">
                                                <PlusCircle size={32} className="text-primary/20" />
                                            </div>
                                            <span className="text-primary/30 text-xs font-black tracking-[0.2em] uppercase">
                                                Belum Ada Tahapan Terdefinisi
                                            </span>
                                            <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                Klik tombol "Tambah Tahap" di header untuk memulai
                                            </p>
                                        </div>
                                    ) : (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                            modifiers={[restrictToVerticalAxis]}
                                        >
                                            <SortableContext items={form.data.steps.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                                                <div className="relative grid gap-4">
                                                    <div className="bg-slate-100 dark:bg-slate-800 absolute top-12 bottom-12 left-[19.5px] z-0 w-px" />
                                                    {form.data.steps.map((step: any, idx: number) => (
                                                        <SortableStepItem
                                                            roles={roles}
                                                            departments={departments}
                                                            users={users}
                                                            step={step}
                                                            idx={idx}
                                                            totalSteps={form.data.steps.length}
                                                            contractStatuses={contractStatuses}
                                                            duplicateLocalStep={(i: number) => {
                                                                const newStep = { ...form.data.steps[i], id: `new-${Date.now()}` };
                                                                const s = [...form.data.steps];
                                                                s.splice(i + 1, 0, newStep);
                                                                form.setData('steps', s);
                                                            }}
                                                            moveLocalStep={(i: number, direction: 'up' | 'down') => {
                                                                if (direction === 'up' && i > 0) {
                                                                    form.setData('steps', arrayMove(form.data.steps, i, i - 1));
                                                                } else if (direction === 'down' && i < form.data.steps.length - 1) {
                                                                    form.setData('steps', arrayMove(form.data.steps, i, i + 1));
                                                                }
                                                            }}
                                                            updateLocalStep={(i, data) => {
                                                                const s = [...form.data.steps];
                                                                s[i] = { ...s[i], ...data };
                                                                form.setData('steps', s);
                                                            }}
                                                            removeLocalStep={(i: number) =>
                                                                form.setData(
                                                                    'steps',
                                                                    form.data.steps.filter((_: any, index: number) => index !== i),
                                                                )
                                                            }
                                                            isExpanded={expandedStepId === step.id}
                                                            setIsExpanded={(expanded) => setExpandedStepId(expanded ? step.id : null)}
                                                        />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    )}
                                </div>
                            )}
                        </div>

                        {form.data.steps.length > 0 && (
                            <div className="flex items-center gap-4 py-8">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                                <div className="border-slate-200 bg-slate-50 text-slate-400 flex items-center gap-2 rounded-xl border px-6 py-2.5 text-[9px] font-black tracking-[0.3em] uppercase dark:border-white/5 dark:bg-white/[0.02]">
                                    <CheckCircle2 size={12} className="opacity-50" /> AKHIR ALUR KERJA
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                            </div>
                        )}
                    </div>
                </ManagementForm>
            </div>
        </>
    );
}
