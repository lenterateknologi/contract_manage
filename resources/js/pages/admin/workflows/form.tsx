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
    Database,
    Briefcase,
    CheckCircle2,
    GitBranch,
    GripVertical,
    Info,
    LayoutTemplate,
    Plus,
    PlusCircle,
    Search,
    ChevronUp,
    Settings2,
    Shield,
    Trash2,
    UserCheck,
    Users as UsersIcon,
    CornerDownLeft,
    Copy,
    ArrowUp,
    ArrowDown,
    XCircle,
    X,
    Upload,
    RotateCcw,
} from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';

// --- Sortable Step Item (Compact) ---
function SortableStepItem({
    step,
    idx,
    totalSteps,
    users,
    roles,
    departments,
    contractStatuses,
    updateLocalStep,
    removeLocalStep,
    duplicateLocalStep,
    moveLocalStep,
    isExpanded,
    setIsExpanded,
}: {
    step: any;
    idx: number;
    totalSteps: number;
    users: any[];
    roles: any[];
    departments: any[];
    contractStatuses: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
    duplicateLocalStep: (idx: number) => void;
    moveLocalStep: (idx: number, direction: 'up' | 'down') => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const [userSearchText, setUserSearchText] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [deptSearchText, setDeptSearchText] = useState('');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const activeRoles = Array.isArray(step.role) ? step.role : step.role ? [step.role] : [];
    const activeDepts = Array.isArray(step.department_ids) ? step.department_ids : step.department_ids ? [step.department_ids] : [];
    const activeUsers = Array.isArray(step.user_ids) ? step.user_ids : [];

    const filteredDepartments = useMemo(() => {
        const base =
            activeRoles.length === 0
                ? departments
                : departments.filter((d) => users.some((u) => activeRoles.includes(u.role) && u.department_id === d.id));
        return deptSearchText ? base.filter((d) => d.name.toLowerCase().includes(deptSearchText.toLowerCase())) : base;
    }, [departments, activeRoles, users, deptSearchText]);

    const filteredRolesBySearch = useMemo(() => {
        return roleSearchText ? roles.filter((r) => r.name.toLowerCase().includes(roleSearchText.toLowerCase())) : roles;
    }, [roles, roleSearchText]);

    const filteredUsersByHierarchy = useMemo(() => {
        return users.filter((u) => {
            const matchesRole = activeRoles.length === 0 || activeRoles.includes(u.role);
            const matchesDept = activeDepts.length === 0 || activeDepts.includes(u.department_id);
            const matchesSearch = !userSearchText || u.name.toLowerCase().includes(userSearchText.toLowerCase());
            return matchesRole && matchesDept && matchesSearch;
        });
    }, [users, activeRoles, activeDepts, userSearchText]);

    const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;

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
                !isAnySelected && !step.step_type && 'border-primary/20 border-dashed',
                isAnySelected || step.step_type ? 'border-primary/10' : 'border-primary/20',
            )}>
                <div className="flex shrink-0 flex-col items-center">
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex h-10 w-10 cursor-grab items-center justify-center rounded-xl border border-primary/5 bg-primary/[0.03] transition-all hover:bg-primary/10 hover:border-primary/20"
                    >
                        <div className="flex flex-col items-center -space-y-1">
                            <span className="text-[10px] font-black text-primary/40 leading-none">#{idx + 1}</span>
                            <GripVertical size={12} className="opacity-20" />
                        </div>
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

                            {/* Conditional Flag */}
                            {step.condition_expression && (
                                <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50">
                                    <GitBranch size={10} /> {step.condition_expression.includes('tax') ? 'PAJAK' : 'META'}
                                </div>
                            )}

                            {/* Access Summary Badges */}
                            <div className="flex items-center gap-2">
                                {isAnySelected ? (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <UsersIcon size={10} className="text-slate-400" />
                                        <div className="flex items-center divide-x divide-slate-300 dark:divide-slate-600">
                                            {activeRoles.length > 0 && (
                                                <span className="px-2 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                                    {activeRoles.length === 1 ? activeRoles[0] : `${activeRoles.length} ROLE`}
                                                </span>
                                            )}
                                            {activeDepts.length > 0 && (
                                                <span className="px-2 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                                    {activeDepts.length === 1 ? '1 DEPT' : `${activeDepts.length} DEPT`}
                                                </span>
                                            )}
                                            {activeUsers.length > 0 && (
                                                <span className="px-2 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                                    {activeUsers.length === 1 ? '1 PERS' : `${activeUsers.length} PERS`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tight opacity-60">Tanpa Akses</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {step.description && (
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{step.description}</span>
                            )}

                            {step.status_id && (
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        {contractStatuses.find((s) => s.id === step.status_id)?.label}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-1">
                                <Shield size={10} className="text-slate-400" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {step.approver_type === 'initiator' ? 'INISIATOR' :
                                     step.approver_type === 'atasan' ? 'ATASAN' :
                                     step.approver_type === 'user' ? 'PERSONEL' : 'ROLE'}
                                    {step.approver_type === 'atasan' && step.hierarchy_level && ` (LVL ${step.hierarchy_level})`}
                                </span>
                            </div>

                            {step.reject_target && (
                                <div className="flex items-center gap-1">
                                    <RotateCcw size={10} className="text-rose-400" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">
                                        TOLAK: {String(step.reject_target).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ml-6 flex shrink-0 items-center gap-2">
                        {/* Improved Quick Action Toolbar */}
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
                    {/* Background Subtle Gradient */}
                    <div className="relative z-10 p-6">
                        <div className="grid grid-cols-12 gap-6">
                            {/* --- Section 1: Basic Config --- */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black tracking-widest text-primary/30 uppercase flex items-center gap-2">
                                        <Settings2 size={12} /> Identitas Tahap
                                    </h4>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipe Langkah</label>
                                        <Select
                                            value={step.step_type || 'none'}
                                            onValueChange={(v) => updateLocalStep(idx, { step_type: v === 'none' ? null : String(v) })}
                                        >
                                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="none" className="py-2.5 text-[10px] font-bold uppercase opacity-40 italic">-- PILIH TIPE --</SelectItem>
                                                <SelectItem value="SELECTION" className="py-2.5 text-[10px] font-bold uppercase">PENUGASAN</SelectItem>
                                                <SelectItem value="APPROVAL" className="py-2.5 text-[10px] font-bold uppercase">PERSETUJUAN</SelectItem>
                                                <SelectItem value="REVIEW" className="py-2.5 text-[10px] font-bold uppercase">PENINJAUAN</SelectItem>
                                                <SelectItem value="UPLOAD" className="py-2.5 text-[10px] font-bold uppercase">UNGGAH DOKUMEN</SelectItem>
                                                <SelectItem value="CLOSING" className="py-2.5 text-[10px] font-bold uppercase text-emerald-500">PENUTUPAN (FINISH)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <CompactInput
                                        label="Label Langkah"
                                        value={step.description || ''}
                                        onChange={(e) => updateLocalStep(idx, { description: e.target.value })}
                                        placeholder="Misal: Review Legal & Compliance"
                                        icon={Info}
                                        className="h-10"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tolak Ke</label>
                                            <Select
                                                value={String(step.reject_target || 'none')}
                                                onValueChange={(v) => updateLocalStep(idx, { reject_target: v === 'none' ? null : Number(v) })}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="none" className="py-2.5 text-[10px] font-bold uppercase opacity-40">INISIATOR</SelectItem>
                                                    {Array.from({ length: idx }, (_, i) => i + 1).map((num) => (
                                                        <SelectItem key={num} value={String(num)} className="py-2.5 text-[10px] font-bold uppercase">
                                                            Tahap {num}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Target</label>
                                            <Select
                                                value={String(step.status_id || 'none')}
                                                onValueChange={(v) => updateLocalStep(idx, { status_id: v === 'none' ? null : v })}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="none" className="py-2.5 text-[10px] font-bold uppercase opacity-40 italic">TETAP</SelectItem>
                                                    {contractStatuses.map((s: any) => (
                                                        <SelectItem key={s.id} value={String(s.id)} className="py-2.5 text-[10px] font-bold uppercase">{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Section 2: Konfigurasi Lanjutan --- */}
                            <div className="col-span-12 lg:col-span-8 space-y-6">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-5 dark:border-slate-800 dark:bg-slate-900/30">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={16} className="text-slate-400" />
                                            <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Eksekusi Bersyarat</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Bersyarat:</span>
                                            <button
                                                type="button"
                                                onClick={() => updateLocalStep(idx, { condition_expression: step.condition_expression ? null : 'IS_TAX' })}
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
                                    </div>

                                    {step.condition_expression !== null && (
                                        <div className="mb-6">
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input
                                                    value={step.condition_expression || ''}
                                                    onChange={(e) => updateLocalStep(idx, { condition_expression: e.target.value.toUpperCase() })}
                                                    placeholder="NAMA_META_KEY (CONTOH: IS_TAX)"
                                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[11px] font-bold tracking-wider outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                />
                                                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-medium text-slate-400 italic">
                                                    <Info size={10} />
                                                    <span>Langkah hanya dieksekusi jika data metadata kontrak '{step.condition_expression || '...'}' bernilai TRUE</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Database size={16} className="text-slate-400" />
                                            <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Metadata</h4>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="h-7 rounded-lg px-2 text-[9px] font-bold uppercase hover:bg-slate-100 dark:hover:bg-slate-800"
                                            onClick={() => {
                                                const currentMeta = step.meta || {};
                                                updateLocalStep(idx, { meta: { ...currentMeta, [`NEW_KEY_${Object.keys(currentMeta).length + 1}`]: '' } });
                                            }}
                                        >
                                            <Plus size={12} className="mr-1" /> Meta
                                        </Button>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {step.meta && Object.entries(step.meta).map(([key, value], mIdx) => (
                                            <div key={mIdx} className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 transition-all hover:border-indigo-500/30 dark:border-slate-800 dark:bg-black/20">
                                                <input
                                                    value={key}
                                                    onChange={(e) => {
                                                        const newMeta = { ...step.meta };
                                                        const oldKey = key;
                                                        const newKey = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                                                        if (newKey !== oldKey) {
                                                            newMeta[newKey] = newMeta[oldKey];
                                                            delete newMeta[oldKey];
                                                            updateLocalStep(idx, { meta: newMeta });
                                                        }
                                                    }}
                                                    placeholder="KEY"
                                                    className="h-8 w-[35%] bg-transparent px-2 text-[10px] font-black uppercase tracking-tighter outline-none"
                                                />
                                                <div className="h-4 w-px bg-slate-100 dark:bg-slate-800" />
                                                <input
                                                    value={String(value)}
                                                    onChange={(e) => {
                                                        const newMeta = { ...step.meta };
                                                        newMeta[key] = e.target.value;
                                                        updateLocalStep(idx, { meta: newMeta });
                                                    }}
                                                    placeholder="VALUE"
                                                    className="h-8 flex-1 bg-transparent px-2 text-[10px] font-bold outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    className="flex h-8 w-8 items-center justify-center text-slate-300 hover:text-rose-500"
                                                    onClick={() => {
                                                        const newMeta = { ...step.meta };
                                                        delete newMeta[key];
                                                        updateLocalStep(idx, { meta: newMeta });
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!step.meta || Object.keys(step.meta).length === 0) && (
                                            <div className="col-span-full py-4 text-center">
                                                <p className="text-[10px] font-medium text-slate-400 italic">Belum ada metadata kustom.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                            {/* --- Section 3: Approver & Access --- */}
                            {step.step_type && step.step_type !== 'none' && (
                                <div className="col-span-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="relative h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent my-4" />

                                    <div className="grid grid-cols-12 gap-8">
                                        <div className="col-span-12 lg:col-span-4 space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 dark:text-white/60 flex items-center gap-2 mb-2">
                                                <UserCheck size={14} /> Jenis Penyetuju / Otoritas
                                            </label>
                                            <Select
                                                value={step.approver_type || 'role'}
                                                onValueChange={(v) => updateLocalStep(idx, { approver_type: String(v) })}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-[11px] font-bold tracking-tight transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="role" className="py-2.5 text-[10px] font-bold uppercase">JABATAN (ROLE)</SelectItem>
                                                    <SelectItem value="initiator" className="py-2.5 text-[10px] font-bold uppercase">INISIATOR</SelectItem>
                                                    <SelectItem value="atasan" className="py-2.5 text-[10px] font-bold uppercase">ATASAN (HIRARKI)</SelectItem>
                                                    <SelectItem value="user" className="py-2.5 text-[10px] font-bold uppercase">PERSONEL (USER)</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {step.approver_type === 'atasan' && (
                                                <div className="mt-4 animate-in slide-in-from-left-2 duration-300">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary/40 dark:text-white/40 mb-2 block">Level Atasan</label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {[1, 2, 3, 4].map(lvl => (
                                                            <button
                                                                key={lvl}
                                                                type="button"
                                                                onClick={() => updateLocalStep(idx, { hierarchy_level: lvl })}
                                                                className={cn(
                                                                    "h-10 rounded-xl text-[10px] font-black transition-all active:scale-95",
                                                                    (step.hierarchy_level || 1) === lvl
                                                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                                        : "bg-primary/5 text-primary/40 hover:bg-primary/10"
                                                                )}
                                                            >
                                                                LVL {lvl}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Selection Columns */}
                                        {!['CLOSING'].includes(step.step_type) && (
                                            <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-6">
                                                {[
                                                    {
                                                        label: 'PILIH ROLE',
                                                        icon: Shield,
                                                        active: activeRoles,
                                                        search: roleSearchText,
                                                        setSearch: setRoleSearchText,
                                                        data: filteredRolesBySearch,
                                                        onSelect: (r: any) => updateLocalStep(idx, {
                                                            role: activeRoles.includes(r.name) ? activeRoles.filter((n: string) => n !== r.name) : [...activeRoles, r.name],
                                                        }),
                                                        display: (r: any) => r.name,
                                                        hidden: step.approver_type === 'atasan' || (step.approver_type === 'user'),
                                                    },
                                                    {
                                                        label: 'DEPARTEMEN',
                                                        icon: GitBranch,
                                                        active: activeDepts,
                                                        search: deptSearchText,
                                                        setSearch: setDeptSearchText,
                                                        data: filteredDepartments,
                                                        onSelect: (d: any) => updateLocalStep(idx, {
                                                            department_ids: activeDepts.includes(d.id) ? activeDepts.filter((id: string) => id !== d.id) : [...activeDepts, d.id],
                                                        }),
                                                        display: (d: any) => d.name,
                                                        hidden: step.approver_type === 'atasan' || (step.approver_type === 'user'),
                                                    },
                                                    {
                                                        label: 'PILIH USER',
                                                        icon: UsersIcon,
                                                        active: activeUsers,
                                                        search: userSearchText,
                                                        setSearch: setUserSearchText,
                                                        data: filteredUsersByHierarchy,
                                                        onSelect: (u: any) => updateLocalStep(idx, {
                                                            user_ids: activeUsers.includes(u.id) ? activeUsers.filter((id: string) => id !== u.id) : [...activeUsers, u.id],
                                                        }),
                                                        display: (u: any) => u.name,
                                                        sub: (u: any) => u.role,
                                                        hidden: step.approver_type === 'atasan',
                                                    },
                                                ].filter(col => !col.hidden).map((col, cIdx) => (
                                                    <div key={col.label} className={cn('space-y-4 transition-all duration-500', cIdx > 0 && 'border-l border-primary/5 pl-6')}>
                                                        <div className="flex items-center justify-between px-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5 text-primary">
                                                                    <col.icon size={12} />
                                                                </div>
                                                                <span className="text-[10px] font-black tracking-widest uppercase text-primary/60">{col.label}</span>
                                                            </div>
                                                            {col.active.length > 0 && (
                                                                <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white shadow-sm ring-4 ring-primary/5">
                                                                    {col.active.length}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="relative group/search">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/20 transition-all group-focus-within/search:text-primary" size={13} />
                                                            <input
                                                                placeholder="CARI..."
                                                                value={col.search}
                                                                onChange={(e) => col.setSearch(e.target.value)}
                                                                className="h-10 w-full rounded-xl border border-primary/10 bg-primary/[0.01] pl-10 pr-3 text-[10px] font-bold uppercase transition-all outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 dark:focus:bg-black/50"
                                                            />
                                                        </div>
                                                        <div className="custom-scrollbar max-h-[300px] space-y-1 overflow-y-auto pr-2">
                                                            {col.data.map((item: any) => {
                                                                const itemId = col.label.toLowerCase().includes('role') ? item.name : item.id;
                                                                const isActive = col.active.some((a: any) => String(a) === String(itemId));
                                                                return (
                                                                    <button
                                                                        key={item.id || item.name}
                                                                        type="button"
                                                                        onClick={() => col.onSelect(item)}
                                                                        className={cn(
                                                                            'flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all active:scale-95 group/item',
                                                                            isActive
                                                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                                                : 'hover:bg-primary/[0.03] hover:border-primary/20 border-transparent',
                                                                        )}
                                                                    >
                                                                        <div className="flex min-w-0 flex-col">
                                                                            <span className="truncate text-[11px] font-bold uppercase tracking-tight">{col.display(item)}</span>
                                                                            {col.sub && (
                                                                                <span className={cn(
                                                                                    'text-[9px] font-bold uppercase tracking-tighter opacity-60',
                                                                                    isActive ? 'text-white/70' : 'text-primary/40',
                                                                                )}>
                                                                                    {col.sub(item)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {isActive && <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center"><CheckCircle2 size={10} className="text-white" /></div>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* --- Action Buttons Preview --- */}
                                    <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                        <div className="flex items-center justify-between border-b border-primary/5 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/5">
                                                    <LayoutTemplate size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h4 className="text-[11px] font-black tracking-[0.1em] text-primary/60 uppercase">Pratinjau Tombol Aksi</h4>
                                                    <p className="text-[10px] text-primary/40 font-medium italic">Simulasi antarmuka pengguna pada tahapan ini.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative flex flex-wrap items-center gap-4 rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-white/5 p-10 shadow-2xl dark:from-white/5 dark:to-black/20 overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none"><LayoutTemplate size={120} /></div>

                                            {(() => {
                                                const type = step.step_type;
                                                const buttons = [];

                                                if (type === 'SELECTION') {
                                                    buttons.push({ label: 'Tugaskan PIC', color: 'bg-primary', icon: UserCheck, shadow: 'shadow-primary/30' });
                                                    buttons.push({ label: 'Tolak', color: 'bg-rose-500', icon: XCircle, shadow: 'shadow-rose-500/30' });
                                                } else if (type === 'APPROVAL') {
                                                    buttons.push({ label: 'Setujui Kontrak', color: 'bg-emerald-500', icon: CheckCircle2, shadow: 'shadow-emerald-500/30' });
                                                    buttons.push({ label: 'Tolak', color: 'bg-rose-500', icon: XCircle, shadow: 'shadow-rose-500/30' });
                                                } else if (type === 'REVIEW') {
                                                    buttons.push({ label: 'Verifikasi / OK', color: 'bg-blue-600', icon: Search, shadow: 'shadow-blue-600/30' });
                                                    buttons.push({ label: 'Tolak / Revisi', color: 'bg-rose-500', icon: XCircle, shadow: 'shadow-rose-500/30' });
                                                } else if (type === 'UPLOAD') {
                                                    buttons.push({ label: 'Upload TTD', color: 'bg-indigo-600', icon: Upload, shadow: 'shadow-indigo-600/30' });
                                                    buttons.push({ label: 'Tolak', color: 'bg-rose-500', icon: XCircle, shadow: 'shadow-rose-500/30' });
                                                } else if (type === 'CLOSING') {
                                                    buttons.push({ label: 'Selesaikan', color: 'bg-emerald-600', icon: CheckCircle2, shadow: 'shadow-emerald-600/30' });
                                                    buttons.push({ label: 'Kembalikan', color: 'bg-amber-600', icon: RotateCcw, shadow: 'shadow-amber-600/30' });
                                                }

                                                if (step.approver_type === 'user' || (type === 'REVIEW' && idx === 1)) {
                                                    buttons.unshift({ label: 'Tugaskan PIC', color: 'bg-primary', icon: UserCheck, shadow: 'shadow-primary/30' });
                                                }

                                                return buttons.map((btn, bIdx) => (
                                                    <div key={bIdx} className={cn(
                                                        "group/btn relative flex cursor-default items-center gap-3 rounded-2xl px-6 py-3.5 text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95",
                                                        btn.color, btn.shadow
                                                    )}>
                                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-2xl" />
                                                        <btn.icon size={18} className="opacity-80" />
                                                        <span className="text-xs font-black uppercase tracking-[0.1em]">{btn.label}</span>
                                                    </div>
                                                ));
                                            })()}

                                            {(!step.step_type || step.step_type === 'none') && (
                                                <div className="flex w-full items-center justify-center py-10 text-primary/10 italic text-xs uppercase font-black tracking-[0.2em] border-2 border-dashed border-primary/10 rounded-[1.5rem]">
                                                    Konfigurasi Tipe Langkah Untuk Melihat Pratinjau
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compact Footer for Step Card */}
                    <div className="bg-primary/[0.02] flex items-center justify-between border-t border-primary/5 px-8 py-4">
                        <div className="flex items-center gap-2 text-[9px] font-black text-primary/30 uppercase tracking-[0.2em]">
                            <Settings2 size={10} /> Konfigurasi Langkah {idx + 1}
                        </div>
                        <Button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="h-9 rounded-xl px-10 text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-primary/20 transition-all active:scale-95 hover:shadow-primary/40"
                        >
                            SELESAI
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main Workflow Editor Page ---
export default function WorkflowEditor({ auth, workflow, contractTypes, departments, roles, users, contractStatuses }: any) {
    const { showToast } = useToast();
    const [isInitiatorExpanded, setIsInitiatorExpanded] = useState(false);
    const [initiatorUserSearch, setInitiatorUserSearch] = useState('');
    const [initiatorRoleSearch, setInitiatorRoleSearch] = useState('');
    const [initiatorDeptSearch, setInitiatorDeptSearch] = useState('');
    const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const form = useForm({
        name: workflow?.name || '',
        contract_type: workflow?.contract_type || '',
        description: workflow?.description || '',
        is_default: !!workflow?.is_default,
        initiator_type: workflow?.initiator_type || 'all',
        scope: workflow?.scope || 'HO',
        initiator_roles: workflow?.initiator_roles || [],
        initiator_users: workflow?.initiator_users || [],
        initiator_departments: workflow?.initiator_departments || [],
        steps: workflow?.steps || [],
        department_id: workflow?.department_id || null,
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
                approver_type: 'role',
                user_ids: [],
                role: [] as string[],
                department_ids: [] as string[],
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
                >
                    <div className="space-y-8">
                        <FormSection>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    <div className="lg:col-span-6">
                                        <CompactInput
                                            label="Nama Alur Kerja"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            placeholder="Contoh: Approval Kontrak Regional"
                                            icon={Briefcase}
                                        />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60 dark:text-white/60 flex items-center gap-2">
                                                <LayoutTemplate size={10} /> Jenis Kontrak
                                            </label>
                                            <Select
                                                value={form.data.contract_type || 'all'}
                                                onValueChange={(v) => form.setData('contract_type', v === 'all' ? '' : String(v))}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-primary/10 bg-primary/5 text-xs font-bold transition-all focus:border-primary">
                                                    <SelectValue placeholder="SEMUA JENIS" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-primary/10 bg-white shadow-2xl dark:bg-black">
                                                    <SelectItem value="all" className="py-2.5 text-[10px] font-bold uppercase">SEMUA JENIS</SelectItem>
                                                    {contractTypes.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.name} className="py-2.5 text-[10px] font-bold uppercase">
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary/60 dark:text-white/60 flex items-center gap-2">
                                                <Shield size={10} /> Scope / Unit
                                            </label>
                                            <Select
                                                value={form.data.scope || 'HO'}
                                                onValueChange={(v) => form.setData('scope', String(v))}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-primary/10 bg-primary/5 text-xs font-bold transition-all focus:border-primary">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-primary/10 bg-white shadow-2xl dark:bg-black">
                                                    <SelectItem value="HO" className="py-2.5 text-[10px] font-bold uppercase">HEAD OFFICE (HO)</SelectItem>
                                                    <SelectItem value="RO" className="py-2.5 text-[10px] font-bold uppercase">REGIONAL OFFICE (RO)</SelectItem>
                                                    <SelectItem value="Site" className="py-2.5 text-[10px] font-bold uppercase">SITE / PROJECT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Default Toggle & Otoritas Akses */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    <div className="lg:col-span-12">
                                    {(() => {
                                        const activeRoles = form.data.initiator_roles || [];
                                        const activeDepts = form.data.initiator_departments || [];
                                        const activeUsers = form.data.initiator_users || [];
                                        const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;
                                        const filteredDepts =
                                            activeRoles.length === 0
                                                ? departments
                                                : departments.filter((d: any) =>
                                                    users.some((u: any) => activeRoles.includes(u.role) && u.department_id === d.id),
                                                    );
                                        const filteredUsers = users.filter(
                                            (u: any) =>
                                                (activeRoles.length === 0 || activeRoles.includes(u.role)) &&
                                                (activeDepts.length === 0 || activeDepts.includes(u.department_id)) &&
                                                (!initiatorUserSearch || u.name.toLowerCase().includes(initiatorUserSearch.toLowerCase())),
                                        );

                                        return (
                                            <div
                                                className={cn(
                                                    'bg-slate-50 dark:bg-slate-900/50 rounded-xl border p-4 transition-all h-full flex flex-col',
                                                    isAnySelected ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 border-dashed',
                                                )}
                                            >
                                                <div className="mb-4 flex items-center justify-between">
                                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <Key size={12} /> Otoritas Akses (Pengaju)
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsInitiatorExpanded(!isInitiatorExpanded)}
                                                        className={cn(
                                                            "h-7 gap-1.5 rounded-lg px-3 text-[10px] font-bold tracking-tight uppercase transition-all",
                                                            isInitiatorExpanded ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400"
                                                        )}
                                                    >
                                                        {isInitiatorExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                                                        {isInitiatorExpanded ? 'TUTUP' : 'ATUR'}
                                                    </Button>
                                                </div>

                                                {isInitiatorExpanded && (
                                                    <div className="border-slate-200 bg-white mb-6 overflow-hidden rounded-xl border animate-in fade-in slide-in-from-top-4 duration-300 dark:bg-slate-950 dark:border-slate-800 z-50 absolute left-6 right-6 shadow-xl p-1">
                                                        <div className="grid min-h-[300px] grid-cols-3 gap-4 p-4">
                                                            {[
                                                                {
                                                                    label: 'ROLE INISIATOR',
                                                                    active: activeRoles,
                                                                    search: initiatorRoleSearch,
                                                                    setSearch: setInitiatorRoleSearch,
                                                                    data: roles,
                                                                    onSelect: (r: any) =>
                                                                        form.setData(
                                                                            'initiator_roles',
                                                                            activeRoles.includes(r.name)
                                                                                ? activeRoles.filter((n: any) => n !== r.name)
                                                                                : [...activeRoles, r.name],
                                                                        ),
                                                                    display: (r: any) => r.name,
                                                                },
                                                                {
                                                                    label: 'DEPARTEMEN',
                                                                    active: activeDepts,
                                                                    search: initiatorDeptSearch,
                                                                    setSearch: setInitiatorDeptSearch,
                                                                    data: filteredDepts,
                                                                    onSelect: (d: any) =>
                                                                        form.setData(
                                                                            'initiator_departments',
                                                                            activeDepts.includes(d.id)
                                                                                ? activeDepts.filter((id: any) => id !== d.id)
                                                                                : [...activeDepts, d.id],
                                                                        ),
                                                                    display: (d: any) => d.name,
                                                                },
                                                                {
                                                                    label: 'USER INISIATOR',
                                                                    active: activeUsers,
                                                                    search: initiatorUserSearch,
                                                                    setSearch: setInitiatorUserSearch,
                                                                    data: filteredUsers,
                                                                    onSelect: (u: any) =>
                                                                        form.setData(
                                                                            'initiator_users',
                                                                            activeUsers.includes(u.id)
                                                                                ? activeUsers.filter((id: any) => id !== u.id)
                                                                                : [...activeUsers, u.id],
                                                                        ),
                                                                    display: (u: any) => u.name,
                                                                },
                                                            ].map((col, idx) => (
                                                                <div
                                                                    key={col.label}
                                                                    className={cn('space-y-3', idx === 1 && 'border-primary/5 border-x px-6')}
                                                                >
                                                                    <div className="border-primary/5 flex items-center justify-between border-b pb-2">
                                                                        <span className="text-primary/40 text-[10px] font-bold uppercase tracking-widest">
                                                                            {col.label}
                                                                        </span>
                                                                        {col.active.length > 0 && (
                                                                            <div className="bg-primary flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
                                                                                {col.active.length}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="relative">
                                                                        <Search
                                                                            className="text-primary/20 absolute top-1/2 left-2.5 -translate-y-1/2 pointer-events-none"
                                                                            size={12}
                                                                        />
                                                                        <input
                                                                            placeholder="CARI..."
                                                                            value={col.search}
                                                                            onChange={(e) => col.setSearch(e.target.value)}
                                                                            className="border-primary/10 bg-primary/[0.01] focus:ring-primary/20 h-8 w-full rounded-lg border pr-3 pl-8 text-[10px] font-bold uppercase outline-none focus:ring-1"
                                                                        />
                                                                    </div>
                                                                    <div className="custom-scrollbar max-h-[250px] space-y-0.5 overflow-y-auto pr-1">
                                                                        {col.data
                                                                            .filter(
                                                                                (d: any) =>
                                                                                    !col.search ||
                                                                                    col.display(d).toLowerCase().includes(col.search.toLowerCase()),
                                                                            )
                                                                            .map((item: any) => {
                                                                                const itemId = col.label.toLowerCase().includes('role') ? item.name : item.id;
                                                                                const isActive = col.active.some((a: any) => String(a) === String(itemId));
                                                                                return (
                                                                                    <button
                                                                                        key={item.id || item.name}
                                                                                        type="button"
                                                                                        onClick={() => col.onSelect(item)}
                                                                                        className={cn(
                                                                                            'flex w-full items-center justify-between rounded-lg p-2 text-left transition-all',
                                                                                            isActive
                                                                                                ? 'bg-slate-900 border-slate-900 text-white'
                                                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent',
                                                                                        )}
                                                                                    >
                                                                                        <span className="truncate text-[10px] font-bold uppercase">{col.display(item)}</span>
                                                                                        {isActive && <CheckCircle2 size={10} />}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900 flex justify-end border-t border-slate-100 dark:border-slate-800 p-3">
                                                            <Button
                                                                type="button"
                                                                onClick={() => setIsInitiatorExpanded(false)}
                                                                className="h-8 rounded-lg px-6 text-[10px] font-bold tracking-widest uppercase transition-all"
                                                            >
                                                                Selesai
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-1.5 flex-1 items-start content-start">
                                                    {!isAnySelected ? (
                                                        <span className="text-slate-400 text-[10px] font-medium italic">
                                                            Akses Terbuka (Default)
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {activeRoles.map((r: any) => (
                                                                <div
                                                                    key={r}
                                                                    className="bg-slate-900 rounded-md px-2 py-0.5 text-[9px] font-bold text-white uppercase"
                                                                >
                                                                    {r}
                                                                </div>
                                                            ))}
                                                            {activeDepts.map((id: any) => (
                                                                <div
                                                                    key={id}
                                                                    className="border-slate-200 text-slate-600 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                                                >
                                                                    {departments.find((d: any) => d.id === id)?.name}
                                                                </div>
                                                            ))}
                                                            {activeUsers.map((id: any) => (
                                                                <div
                                                                    key={id}
                                                                    className="bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                                                >
                                                                    {users.find((u: any) => u.id === id)?.name}
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    </div>
                                </div>
                            </div>
                        </FormSection>

                        <FormSection
                                headerAction={
                                    <Button type="button" onClick={addLocalStep} className="group h-8 rounded-lg px-4 text-xs font-bold shadow-md">
                                        <PlusCircle size={12} className="mr-1.5 transition-transform group-hover:rotate-90" /> Tambah Tahap
                                    </Button>
                                }
                            >
                                {form.data.steps.length === 0 ? (
                                    <div className="border-primary/5 bg-primary/[0.01] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-20 text-center dark:border-white/5 dark:bg-white/[0.01]">
                                        <PlusCircle size={32} className="text-primary/10 mb-4 dark:text-white/10" />
                                        <span className="text-primary/20 mb-4 text-xs font-bold tracking-widest uppercase dark:text-white/20">
                                            Alur Belum Terdefinisi
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addLocalStep}
                                            className="h-8 rounded-lg px-6 text-xs font-bold uppercase"
                                        >
                                            Mulai Membangun
                                        </Button>
                                    </div>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                        modifiers={[restrictToVerticalAxis]}
                                    >
                                        <SortableContext items={form.data.steps.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                                            <div className="relative grid gap-3">
                                                <div className="bg-dashed border-primary/10 absolute top-6 bottom-6 left-[17px] z-0 w-px border-l border-dashed" />
                                                {form.data.steps.map((step: any, idx: number) => (
                                                    <SortableStepItem
                                                        key={step.id}
                                                        step={step}
                                                        idx={idx}
                                                        totalSteps={form.data.steps.length}
                                                        users={users}
                                                        roles={roles}
                                                        departments={departments}
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

                                {form.data.steps.length > 0 && (
                                    <div className="flex items-center gap-4 py-6">
                                        <div className="via-primary/5 to-primary/5 h-px flex-1 bg-gradient-to-r from-transparent" />
                                        <div className="border-primary/10 bg-primary/[0.01] text-primary/30 flex items-center gap-2 rounded-xl border px-4 py-2 text-[8px] font-bold tracking-[0.3em] uppercase dark:border-white/10 dark:bg-white/[0.01] dark:text-white/30">
                                            <CheckCircle2 size={12} /> FINISH
                                        </div>
                                        <div className="via-primary/5 to-primary/5 h-px flex-1 bg-gradient-to-l from-transparent" />
                                    </div>
                                )}
                            </FormSection>
                    </div>
                </ManagementForm>
            </div>
        </>
    );
}
