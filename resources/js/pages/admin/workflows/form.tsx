import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { WorkflowVisualizer } from '@/components/admin/WorkflowVisualizer';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { SearchableSelect } from '@/components/ui/forms/SearchableSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { Modal } from '@/components/ui/overlays/Modal';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Briefcase,
    Building2,
    Check,
    CheckCircle2,
    ChevronUp,
    Copy,
    Edit3,
    ExternalLink,
    Eye,
    FileSignature,
    FileText,
    GitBranch,
    Globe,
    Info,
    Key,
    LayoutTemplate,
    Loader2,
    Paperclip,
    PenTool,
    PlusCircle,
    Search,
    Send,
    Settings2,
    Shield,
    Trash2,
    Upload,
    UserCheck,
    Users as UsersIcon,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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

    const { showToast } = useToast();

    // Simulation active modal state
    const [activeModal, setActiveModal] = useState<'approve' | 'reject' | 'assign' | 'upload' | 'review' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Standard & Signing Approve simulation states
    const [approveNote, setApproveNote] = useState('');
    const [approveAttachment, setApproveAttachment] = useState<File | null>(null);
    const [signingP1, setSigningP1] = useState('');
    const [signingP2, setSigningP2] = useState('');
    const [signingSequence, setSigningSequence] = useState<'legal' | 'initiator'>('legal');

    // Reject simulation states
    const [rejectReason, setRejectReason] = useState('');
    const [rejectAttachment, setRejectAttachment] = useState<File | null>(null);

    // Assign PIC simulation states
    const [assignedPicId, setAssignedPicId] = useState('');
    const [assignNote, setAssignNote] = useState('');

    // Upload simulation states
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [formVersion, setFormVersion] = useState<'F1' | 'F2'>('F1');
    const [uploadChangelog, setUploadChangelog] = useState('');

    // Review & Comments states
    const [reviewComments, setReviewComments] = useState<{ id: string; user: string; role: string; text: string; time: string }[]>([
        {
            id: '1',
            user: 'Rian Anggara',
            role: 'Legal Staff',
            text: 'Mohon periksa klausul ganti rugi di pasal 8, sepertinya perlu disesuaikan dengan limitasi tanggung jawab.',
            time: '10:15',
        },
        {
            id: '2',
            user: 'Siti Rahma',
            role: 'VP Legal',
            text: 'Klausul pembayaran di pasal 4 sudah sesuai dengan termin kontrak standard kita.',
            time: '11:30',
        },
    ]);
    const [newCommentText, setNewCommentText] = useState('');

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

    // Handle interactive simulated upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            setUploadProgress(0);
            setUploadedFile(null);
            let current = 0;
            const interval = setInterval(() => {
                current += 10;
                if (current >= 100) {
                    clearInterval(interval);
                    setUploading(false);
                    setUploadProgress(100);
                    setUploadedFile(file);
                } else {
                    setUploadProgress(current);
                }
            }, 120);
        }
    };

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
                                                <SelectTrigger className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
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

                                        <div className="col-span-2 space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Aksi yang Diijinkan</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['APPROVE', 'REJECT', 'ASSIGN', 'UPLOAD', 'REVIEW'].map((action) => {
                                                    const isSelected =
                                                        step.allowed_actions?.includes(action.toLowerCase()) ||
                                                        step.allowed_actions?.includes(action);
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
                                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm shadow-slate-900/20'
                                                                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900',
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
                                                    onClick={() => updateLocalStep(idx, { roles: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        !step.roles || step.roles.length === 0
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="w-full text-center text-[10px] font-bold uppercase">SEMUA ROLE</span>
                                                </button>
                                                {roles.map((role: any) => {
                                                    const isSelected = step.roles?.includes(role.name);
                                                    return (
                                                        <button
                                                            key={role.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.roles || [];
                                                                const next = isSelected
                                                                    ? current.filter((r: string) => r !== role.name)
                                                                    : [...current, role.name];
                                                                updateLocalStep(idx, { roles: next });
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
                                                    onClick={() => updateLocalStep(idx, { departments: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        !step.departments || step.departments.length === 0
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="w-full text-center text-[10px] font-bold uppercase">SEMUA UNIT</span>
                                                </button>
                                                {departments.map((dept: any) => {
                                                    const isSelected = step.departments?.includes(String(dept.id));
                                                    return (
                                                        <button
                                                            key={dept.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.departments || [];
                                                                const next = isSelected
                                                                    ? current.filter((d: string) => d !== String(dept.id))
                                                                    : [...current, String(dept.id)];
                                                                updateLocalStep(idx, { departments: next });
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
                                                    onClick={() => updateLocalStep(idx, { users: [] })}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                        !step.users || step.users.length === 0
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                    )}
                                                >
                                                    <span className="w-full text-center text-[10px] font-bold uppercase">SEMUA USER</span>
                                                </button>
                                                {users.map((user: any) => {
                                                    const isSelected = step.users?.includes(String(user.id));
                                                    return (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = step.users || [];
                                                                const next = isSelected
                                                                    ? current.filter((u: string) => u !== String(user.id))
                                                                    : [...current, String(user.id)];
                                                                updateLocalStep(idx, { users: next });
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

                    {/* --- Section 3: Simulasi Tombol Aksi --- */}
                    <div className="border-t border-slate-100 bg-slate-50/20 px-8 py-6 dark:border-slate-800 dark:bg-black/10">
                        <div className="flex flex-col gap-4">
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
                                            color: 'bg-emerald-600',
                                            icon: CheckCircle2,
                                            tooltip: nextStep > totalSteps ? 'Selesai / Final' : `Lanjut ke Tahap ${nextStep}`,
                                        });
                                    }
                                    if (actions.includes('reject')) {
                                        const target = step.reject_target ? `Tahap ${step.reject_target}` : 'INISIATOR';
                                        buttons.push({
                                            label: 'Tolak',
                                            actionType: 'reject',
                                            color: 'bg-rose-500',
                                            icon: XCircle,
                                            tooltip: `Tolak Kontrak ke ${target}`,
                                        });
                                    }
                                    if (actions.includes('assign')) {
                                        buttons.push({
                                            label: 'Tugaskan',
                                            actionType: 'assign',
                                            color: 'bg-blue-600',
                                            icon: UserCheck,
                                            tooltip: `Penugasan PIC di Tahap ${idx + 1}`,
                                        });
                                    }
                                    if (
                                        actions.includes('upload') ||
                                        (step.step_type && (step.step_type.toUpperCase() === 'UPLOAD' || step.step_type.toUpperCase() === 'SIGNING'))
                                    ) {
                                        buttons.push({
                                            label: 'Unggah',
                                            actionType: 'upload',
                                            color: 'bg-indigo-600',
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
                                            color: 'bg-indigo-600',
                                            icon: Eye,
                                            tooltip: `Review Kontrak di Tahap ${idx + 1}`,
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
                                        <button
                                            key={bIdx}
                                            type="button"
                                            title={btn.tooltip}
                                            onClick={() => setActiveModal(btn.actionType as any)}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2.5 rounded-xl px-5 py-2.5 text-white shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95',
                                                btn.color,
                                            )}
                                        >
                                            <btn.icon size={14} className="opacity-80" />
                                            <span className="text-[10px] font-black tracking-wider uppercase">{btn.label}</span>
                                        </button>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* --- Interactive Simulated Modals --- */}

                    {/* --- Approve Modal --- */}
                    <Modal
                        isOpen={activeModal === 'approve'}
                        onClose={() => {
                            setActiveModal(null);
                            setApproveNote('');
                            setApproveAttachment(null);
                            setSigningP1('');
                            setSigningP2('');
                        }}
                        title={
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                        Simulasi Persetujuan
                                    </h3>
                                    <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">
                                        Tahap {idx + 1}: {step.step_type || 'APPROVAL'}
                                    </p>
                                </div>
                            </div>
                        }
                        maxWidth="lg"
                    >
                        {step.step_type === 'SIGNING' ? (
                            <div className="space-y-6">
                                <div className="flex gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
                                    <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
                                    <div className="text-[11px] leading-relaxed font-medium text-amber-700 dark:text-amber-400">
                                        <strong>Tahap Penandatanganan:</strong> Harap tentukan perwakilan penandatangan untuk Pihak Pertama dan Pihak
                                        Kedua.
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-left">
                                    {/* Pihak 1 */}
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-black/20">
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-[10px] font-black text-emerald-600">
                                                P1
                                            </div>
                                            <span className="text-[10px] font-black tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                                Pihak Pertama
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Penandatangan</label>
                                            <SearchableSelect
                                                value={signingP1}
                                                onValueChange={setSigningP1}
                                                options={userOptions}
                                                placeholder="Pilih Penandatangan..."
                                            />
                                        </div>
                                    </div>

                                    {/* Pihak 2 */}
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-black/20">
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-[10px] font-black text-blue-600">
                                                P2
                                            </div>
                                            <span className="text-[10px] font-black tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                                Pihak Kedua
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Penandatangan</label>
                                            <SearchableSelect
                                                value={signingP2}
                                                onValueChange={setSigningP2}
                                                options={userOptions}
                                                placeholder="Pilih Penandatangan..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Urutan Penandatanganan (Sequence)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSigningSequence('legal')}
                                            className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                                                signingSequence === 'legal'
                                                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                                                    : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${signingSequence === 'legal' ? 'border-emerald-500 text-emerald-500' : 'border-slate-300'}`}
                                                >
                                                    {signingSequence === 'legal' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                                </div>
                                                <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                                    Legal Dulu
                                                </span>
                                            </div>
                                            <p className="mt-1 px-6 text-[9px] font-medium text-slate-400 uppercase">
                                                Sequence: Pihak Pertama (Legal/P1) Menandatangani Lebih Dulu.
                                            </p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSigningSequence('initiator')}
                                            className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                                                signingSequence === 'initiator'
                                                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                                                    : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${signingSequence === 'initiator' ? 'border-emerald-500 text-emerald-500' : 'border-slate-300'}`}
                                                >
                                                    {signingSequence === 'initiator' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                                </div>
                                                <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                                    Inisiator Dulu
                                                </span>
                                            </div>
                                            <p className="mt-1 px-6 text-[9px] font-medium text-slate-400 uppercase">
                                                Sequence: Pihak Kedua (Inisiator/P2) Menandatangani Lebih Dulu.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-4 dark:border-slate-800 dark:bg-black/10">
                                    <PenTool size={20} className="text-slate-400" />
                                    <span className="text-center text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        E-Meterai & Tanda Tangan Digital akan Dibubuhkan Otomatis
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5 text-left">
                                <div className="space-y-1.5">
                                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Catatan Persetujuan</label>
                                    <textarea
                                        value={approveNote}
                                        onChange={(e) => setApproveNote(e.target.value)}
                                        placeholder="Masukkan catatan atau memo persetujuan (opsional)..."
                                        className="min-h-[100px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                                    />
                                </div>

                                {/* Interactive File Attachment */}
                                <div className="space-y-1.5">
                                    <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Lampiran Pendukung (Opsional)</label>
                                    <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-6 transition-all hover:border-emerald-400 dark:border-slate-800 dark:bg-black/10">
                                        <input
                                            type="file"
                                            id={`approve-file-${step.id}`}
                                            className="hidden"
                                            onChange={(e) => setApproveAttachment(e.target.files?.[0] || null)}
                                        />
                                        {approveAttachment ? (
                                            <div className="flex w-full flex-col items-center gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="max-w-[280px] truncate text-[10px] font-black text-slate-700 uppercase dark:text-slate-300">
                                                        {approveAttachment.name}
                                                    </p>
                                                    <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase">
                                                        {(approveAttachment.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setApproveAttachment(null)}
                                                    className="mt-1 text-[9px] font-black text-rose-500 uppercase hover:underline"
                                                >
                                                    Hapus Lampiran
                                                </button>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor={`approve-file-${step.id}`}
                                                className="flex w-full cursor-pointer flex-col items-center gap-2 text-center"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                                                    <Paperclip size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase dark:text-slate-300">
                                                        Pilih File Pendukung
                                                    </p>
                                                    <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase">PDF, PNG, JPG (MAX 10MB)</p>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveModal(null);
                                    setApproveNote('');
                                    setApproveAttachment(null);
                                    setSigningP1('');
                                    setSigningP2('');
                                }}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting || (step.step_type === 'SIGNING' && (!signingP1 || !signingP2))}
                                onClick={() => {
                                    setIsSubmitting(true);
                                    setTimeout(() => {
                                        setIsSubmitting(false);
                                        showToast(
                                            step.step_type === 'SIGNING'
                                                ? 'Simulasi Setup Penandatanganan berhasil!'
                                                : 'Simulasi Persetujuan berhasil!',
                                            'success',
                                        );
                                        setActiveModal(null);
                                        setApproveNote('');
                                        setApproveAttachment(null);
                                        setSigningP1('');
                                        setSigningP2('');
                                    }, 850);
                                }}
                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={12} />
                                        Kirim Persetujuan
                                    </>
                                )}
                            </button>
                        </div>
                    </Modal>

                    {/* --- Reject Modal --- */}
                    <Modal
                        isOpen={activeModal === 'reject'}
                        onClose={() => {
                            setActiveModal(null);
                            setRejectReason('');
                            setRejectAttachment(null);
                        }}
                        title={
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 shadow-inner">
                                    <XCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">Simulasi Penolakan</h3>
                                    <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Kontrak akan dikembalikan</p>
                                </div>
                            </div>
                        }
                        maxWidth="lg"
                    >
                        <div className="space-y-5 text-left">
                            {/* Rejection Alert */}
                            <div className="flex gap-3 rounded-2xl border border-l-4 border-rose-500/30 border-y-transparent border-r-transparent bg-gradient-to-r from-rose-500/10 to-rose-500/[0.02] p-4 shadow-sm">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 animate-pulse text-rose-500" />
                                <div className="text-[11px] leading-relaxed font-medium text-rose-700 dark:text-rose-400">
                                    <strong>Pemberitahuan Rejeksi:</strong> Kontrak akan dikembalikan ke{' '}
                                    <strong>{step.reject_target ? `TAHAP ${step.reject_target}` : 'INISIATOR'}</strong> untuk direvisi sesuai alasan
                                    penolakan di bawah.
                                </div>
                            </div>

                            {/* Alasan Penolakan (Mandatory) */}
                            <div className="space-y-1.5">
                                <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                                    Alasan Penolakan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Harap berikan alasan penolakan yang rinci agar inisiator/pihak sebelumnya dapat merevisi dengan tepat..."
                                    className="min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-rose-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                                    required
                                />
                            </div>

                            {/* Rejection Attachment */}
                            <div className="space-y-1.5">
                                <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Bukti / Dokumen Pendukung (Opsional)</label>
                                <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-5 transition-all hover:border-rose-400 dark:border-slate-800 dark:bg-black/10">
                                    <input
                                        type="file"
                                        id={`reject-file-${step.id}`}
                                        className="hidden"
                                        onChange={(e) => setRejectAttachment(e.target.files?.[0] || null)}
                                    />
                                    {rejectAttachment ? (
                                        <div className="flex w-full flex-col items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                                                <FileText size={20} />
                                            </div>
                                            <div className="text-center">
                                                <p className="max-w-[280px] truncate text-[10px] font-black text-slate-700 uppercase dark:text-slate-300">
                                                    {rejectAttachment.name}
                                                </p>
                                                <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase">
                                                    {(rejectAttachment.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setRejectAttachment(null)}
                                                className="mt-1 text-[9px] font-black text-rose-500 uppercase hover:underline"
                                            >
                                                Hapus Lampiran
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor={`reject-file-${step.id}`}
                                            className="flex w-full cursor-pointer flex-col items-center gap-2 text-center"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                                                <Paperclip size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-600 uppercase dark:text-slate-300">
                                                    Pilih File Bukti
                                                </p>
                                                <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase">PDF, PNG, JPG (MAX 10MB)</p>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveModal(null);
                                    setRejectReason('');
                                    setRejectAttachment(null);
                                }}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting || !rejectReason.trim()}
                                onClick={() => {
                                    setIsSubmitting(true);
                                    setTimeout(() => {
                                        setIsSubmitting(false);
                                        showToast('Simulasi Penolakan berhasil!', 'success');
                                        setActiveModal(null);
                                        setRejectReason('');
                                        setRejectAttachment(null);
                                    }, 850);
                                }}
                                className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02] hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={12} />
                                        Tolak Kontrak
                                    </>
                                )}
                            </button>
                        </div>
                    </Modal>

                    {/* --- Assign Modal --- */}
                    <Modal
                        isOpen={activeModal === 'assign'}
                        onClose={() => {
                            setActiveModal(null);
                            setAssignedPicId('');
                            setAssignNote('');
                        }}
                        title={
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shadow-inner">
                                    <UserCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                        Simulasi Penugasan PIC
                                    </h3>
                                    <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Pilih PIC untuk Memproses Tahap Ini</p>
                                </div>
                            </div>
                        }
                        maxWidth="lg"
                    >
                        <div className="space-y-5 text-left">
                            {/* PIC Dropdown */}
                            <div className="space-y-1.5">
                                <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                                    Pilih PIC Legal / Staff <span className="text-rose-500">*</span>
                                </label>
                                <SearchableSelect
                                    value={assignedPicId}
                                    onValueChange={setAssignedPicId}
                                    options={legalUserOptions}
                                    placeholder="Cari & Pilih PIC Staff..."
                                />
                            </div>

                            {/* Info PIC */}
                            <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                                <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
                                <div className="text-[10px] leading-relaxed font-medium text-blue-700 dark:text-blue-400">
                                    <strong>Alur Penugasan:</strong> PIC yang ditugaskan akan menerima pemberitahuan email & notifikasi sistem untuk
                                    segera memproses tinjauan kontrak ini.
                                </div>
                            </div>

                            {/* Catatan / Instruksi */}
                            <div className="space-y-1.5">
                                <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Catatan / Instruksi Tambahan</label>
                                <textarea
                                    value={assignNote}
                                    onChange={(e) => setAssignNote(e.target.value)}
                                    placeholder="Tulis instruksi khusus mengenai apa saja yang perlu difokuskan dalam peninjauan ini..."
                                    className="min-h-[90px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveModal(null);
                                    setAssignedPicId('');
                                    setAssignNote('');
                                }}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting || !assignedPicId}
                                onClick={() => {
                                    setIsSubmitting(true);
                                    setTimeout(() => {
                                        setIsSubmitting(false);
                                        const picName = legalUserOptions.find((o) => o.value === assignedPicId)?.label || 'PIC';
                                        showToast(`Simulasi Penugasan PIC kepada ${picName.split(' (')[0]} berhasil!`, 'success');
                                        setActiveModal(null);
                                        setAssignedPicId('');
                                        setAssignNote('');
                                    }, 850);
                                }}
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <UserCheck size={12} />
                                        Tugaskan PIC
                                    </>
                                )}
                            </button>
                        </div>
                    </Modal>

                    {/* --- Upload Modal --- */}
                    <Modal
                        isOpen={activeModal === 'upload'}
                        onClose={() => {
                            setActiveModal(null);
                            setUploading(false);
                            setUploadProgress(0);
                            setUploadedFile(null);
                            setFormVersion('F1');
                            setUploadChangelog('');
                        }}
                        title={
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner">
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                        Simulasi Unggah Dokumen
                                    </h3>
                                    <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Unggah Draft Final Hasil TTD / Revisi</p>
                                </div>
                            </div>
                        }
                        maxWidth="lg"
                    >
                        <div className="space-y-5 text-left">
                            {/* Form Version Selection Button Group */}
                            <div className="space-y-1.5">
                                <label className="px-1 text-[9px] font-black text-slate-400 uppercase">Versi Formulir (Form Version)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormVersion('F1')}
                                        className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                                            formVersion === 'F1'
                                                ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10'
                                                : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${formVersion === 'F1' ? 'border-indigo-500 text-indigo-500' : 'border-slate-300'}`}
                                            >
                                                {formVersion === 'F1' && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                                            </div>
                                            <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                                Form F1 (Utama)
                                            </span>
                                        </div>
                                        <p className="mt-1 px-6 text-[9px] font-medium text-slate-400 uppercase">
                                            Formulir Standard Kontrak Utama & Klausul Umum.
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormVersion('F2')}
                                        className={`rounded-2xl border-2 p-3.5 text-left transition-all ${
                                            formVersion === 'F2'
                                                ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10'
                                                : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${formVersion === 'F2' ? 'border-indigo-500 text-indigo-500' : 'border-slate-300'}`}
                                            >
                                                {formVersion === 'F2' && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                                            </div>
                                            <span className="text-[10px] font-black tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                                Form F2
                                            </span>
                                        </div>
                                        <p className="mt-1 px-6 text-[9px] font-medium text-slate-400 uppercase">
                                            Formulir Amandemen, Addendum atau Lampiran Khusus.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div className="space-y-1.5">
                                <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                                    Unggah Draf Dokumen <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id={`sim-upload-file-${step.id}`}
                                        className="hidden"
                                        disabled={uploading}
                                        onChange={handleFileChange}
                                    />

                                    {!uploadedFile && !uploading && (
                                        <label
                                            htmlFor={`sim-upload-file-${step.id}`}
                                            className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/20 p-12 text-center transition-all hover:border-indigo-500 hover:bg-indigo-50/5 dark:border-slate-800"
                                        >
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner transition-transform hover:scale-110">
                                                <Upload size={32} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-800 uppercase dark:text-slate-200">
                                                    Tarik & Lepas File Draf di Sini
                                                </h4>
                                                <p className="mt-1.5 text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Atau klik untuk menelusuri dari penyimpanan lokal
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[8px] font-bold text-slate-400 uppercase dark:border-slate-800 dark:bg-black/40">
                                                Format: PDF, DOCX (Max 15MB)
                                            </div>
                                        </label>
                                    )}

                                    {uploading && (
                                        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-slate-100 bg-white p-12 dark:border-slate-800 dark:bg-black/10">
                                            <div className="relative flex h-20 w-20 items-center justify-center">
                                                <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-indigo-600 border-r-indigo-600" />
                                                <span className="text-xs leading-none font-black text-slate-800 dark:text-white">
                                                    {uploadProgress}%
                                                </span>
                                            </div>
                                            <div className="w-full max-w-[280px] text-center">
                                                <h4 className="text-[10px] font-black tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                                    Mengunggah Dokumen...
                                                </h4>
                                                <p className="mt-1 text-[8px] leading-relaxed font-bold text-slate-400 uppercase">
                                                    Mengamankan enkripsi draft dan menyimpannya ke server repositori
                                                </p>
                                            </div>
                                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 dark:bg-slate-800">
                                                <div
                                                    className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-150"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {uploadedFile && (
                                        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-emerald-500/20 bg-emerald-500/[0.02] p-8 text-center dark:border-emerald-500/30">
                                            <div className="flex h-14 w-14 animate-bounce items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                                                <Check size={26} />
                                            </div>
                                            <div className="max-w-[320px]">
                                                <h4 className="text-[10px] font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                                    Dokumen Berhasil Terupload
                                                </h4>
                                                <p className="mx-auto mt-2 max-w-[280px] truncate rounded-xl border border-slate-100 bg-white px-3 py-1 text-xs font-black text-slate-800 uppercase dark:border-slate-800 dark:bg-black/30 dark:text-slate-200">
                                                    {uploadedFile.name}
                                                </p>
                                                <p className="mt-1.5 text-[9px] font-bold text-slate-400 uppercase">
                                                    Ukuran: {(uploadedFile.size / 1024).toFixed(1)} KB • Tipe:{' '}
                                                    {uploadedFile.name.split('.').pop()?.toUpperCase()}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUploadedFile(null);
                                                    setUploadProgress(0);
                                                }}
                                                className="mt-2 rounded-xl bg-rose-500/5 px-4 py-2 text-[9px] font-black text-rose-500 uppercase transition-all hover:bg-rose-500/10 hover:underline"
                                            >
                                                Ganti File Dokumen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Deskripsi Perubahan / Changelog (Mandatory) */}
                            <div className="space-y-1.5">
                                <label className="px-1 text-[9px] font-black text-slate-400 uppercase">
                                    Catatan Perubahan / Changelog <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={uploadChangelog}
                                    onChange={(e) => setUploadChangelog(e.target.value)}
                                    placeholder="Masukkan deskripsi perubahan atau riwayat revisi pada draf dokumen ini (wajib)..."
                                    className="min-h-[90px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold transition-all outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveModal(null);
                                    setUploading(false);
                                    setUploadProgress(0);
                                    setUploadedFile(null);
                                    setFormVersion('F1');
                                    setUploadChangelog('');
                                }}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting || !uploadedFile || !uploadChangelog.trim()}
                                onClick={() => {
                                    setIsSubmitting(true);
                                    setTimeout(() => {
                                        setIsSubmitting(false);
                                        showToast('Simulasi Unggah Dokumen berhasil!', 'success');
                                        setActiveModal(null);
                                        setUploading(false);
                                        setUploadProgress(0);
                                        setUploadedFile(null);
                                        setFormVersion('F1');
                                        setUploadChangelog('');
                                    }, 850);
                                }}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Check size={12} />
                                        Konfirmasi Dokumen
                                    </>
                                )}
                            </button>
                        </div>
                    </Modal>

                    {/* --- Review Modal --- */}
                    <Modal
                        isOpen={activeModal === 'review'}
                        onClose={() => {
                            setActiveModal(null);
                            setNewCommentText('');
                        }}
                        title={
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                        Simulasi Peninjauan & Markup
                                    </h3>
                                    <p className="mt-0.5 text-[10px] font-medium text-slate-400 uppercase">Tahap {idx + 1} • Reviewer Kolaboratif</p>
                                </div>
                            </div>
                        }
                        maxWidth="full"
                    >
                        <div className="grid max-h-[70vh] min-h-[500px] grid-cols-12 gap-8">
                            {/* Left Pane: Document Preview */}
                            <div className="col-span-7 flex min-h-0 flex-col gap-3 text-left">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                        Draf Kontrak Hukum (Simulasi)
                                    </span>
                                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-600 uppercase">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Dilindungi
                                    </div>
                                </div>

                                <div className="relative flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-8 font-serif text-xs leading-relaxed text-slate-700 shadow-inner select-none dark:border-slate-800 dark:bg-black/30 dark:text-slate-300">
                                    {/* Watermark */}
                                    <div className="pointer-events-none absolute inset-0 flex rotate-12 items-center justify-center text-6xl font-black uppercase opacity-[0.02] select-none dark:opacity-[0.03]">
                                        DRAFT SIMULASI
                                    </div>

                                    <div className="mb-6 text-center text-[13px] font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                        SURAT PERJANJIAN KERJASAMA PENYEDIAAN JASA TEKNOLOGI INFORMASI
                                    </div>

                                    <p className="mb-4">
                                        Yang bertanda tangan di bawah ini, selanjutnya disebut sebagai <strong>Pihak Pertama</strong> (Penyedia) dan{' '}
                                        <strong>Pihak Kedua</strong> (Mitra Kerja/Klien), dengan ini sepakat untuk mengikatkan diri dalam perjanjian
                                        kerjasama dengan syarat-syarat sebagai berikut:
                                    </p>

                                    <h5 className="mb-2 font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                        PASAL 1 - RUANG LINGKUP PEKERJAAN
                                    </h5>
                                    <p className="mb-4">
                                        Penyedia setuju untuk menyediakan jasa pengembangan perangkat lunak berupa modul Contract Builder beserta
                                        workflow engine terintegrasi sesuai spesifikasi teknis lampiran A.
                                    </p>

                                    <h5 className="mb-2 font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                        PASAL 4 - TERMIN PEMBAYARAN
                                    </h5>
                                    <p className="mb-4">
                                        Pembayaran atas pelaksanaan kontrak ini wajib dibayarkan oleh Pihak Kedua secara bertahap. Termin pertama
                                        sebesar 30% dibayarkan selambat-lambatnya{' '}
                                        <span
                                            className="inline-block cursor-help rounded-md border border-indigo-200 bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                            title="Termin pembayaran standard adalah 30 hari. Mohon periksa kembali."
                                        >
                                            14 hari kerja
                                        </span>{' '}
                                        setelah invoice dan berita acara serah terima pekerjaan (BAST) diterima oleh Pihak Kedua.
                                    </p>

                                    <h5 className="mb-2 font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                        PASAL 8 - BATASAN TANGGUNG JAWAB (LIABILITAS)
                                    </h5>
                                    <p className="mb-4">
                                        Total kewajiban ganti rugi atau liabilitas dari Penyedia atas segala klaim yang timbul dari perjanjian
                                        kerjasama ini dibatasi maksimal sebesar{' '}
                                        <span
                                            className="inline-block cursor-help rounded-md border border-amber-200 bg-amber-100 px-1.5 py-0.5 font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                            title="Batas limit ganti rugi maksimal 200% dinilai terlalu tinggi untuk standard resiko kita. Direkomendasikan 100%."
                                        >
                                            200% dari nilai kontrak
                                        </span>{' '}
                                        yang disepakati oleh kedua belah pihak.
                                    </p>

                                    <h5 className="mb-2 font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
                                        PASAL 12 - FORCE MAJEURE
                                    </h5>
                                    <p className="mb-4">
                                        Keadaan kahar yang dibenarkan dalam perjanjian ini mencakup bencana alam, huru-hara, epidemi, perang, serta
                                        perubahan kebijakan regulasi pemerintah yang berdampak langsung pada kelancaran operasional.
                                    </p>
                                </div>
                            </div>

                            {/* Right Pane: Review Comments & Discussion */}
                            <div className="col-span-5 flex min-h-0 flex-col gap-3 border-l border-slate-100 pl-8 text-left dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                        Thread Review & Diskusi ({reviewComments.length})
                                    </span>
                                    <span className="text-right text-[9px] font-black text-indigo-500 uppercase">Kolaborasi Aktif</span>
                                </div>

                                {/* Chat Messages */}
                                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/20 p-4 dark:border-slate-800 dark:bg-black/10">
                                    {reviewComments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-[10px] font-black text-slate-600 uppercase shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {comment.user
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="max-w-[120px] truncate text-[10px] font-black text-slate-700 uppercase dark:text-slate-200">
                                                        {comment.user}
                                                    </span>
                                                    <span className="max-w-[120px] truncate rounded-md border border-slate-200/50 bg-slate-100 px-1.5 py-0.5 text-[8px] leading-none font-bold tracking-wider text-slate-400 uppercase dark:border-slate-700 dark:bg-slate-800">
                                                        {comment.role}
                                                    </span>
                                                    <span className="ml-auto shrink-0 text-[8px] font-bold text-slate-400 uppercase">
                                                        {comment.time}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 rounded-2xl rounded-tl-none border border-slate-100 bg-white p-3 text-[11px] leading-relaxed font-medium whitespace-pre-wrap text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                                    {comment.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input Comment */}
                                <div className="flex items-end gap-2 pt-2">
                                    <textarea
                                        value={newCommentText}
                                        onChange={(e) => setNewCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (newCommentText.trim()) {
                                                    setReviewComments((prev) => [
                                                        ...prev,
                                                        {
                                                            id: String(Date.now()),
                                                            user: 'Administrator',
                                                            role: 'WORKFLOW DESIGNER',
                                                            text: newCommentText,
                                                            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                                                        },
                                                    ]);
                                                    setNewCommentText('');
                                                }
                                            }
                                        }}
                                        placeholder="Tulis masukan review Anda di sini..."
                                        className="max-h-[100px] min-h-[50px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-[11px] font-bold transition-all outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-black/20 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        disabled={!newCommentText.trim()}
                                        onClick={() => {
                                            if (newCommentText.trim()) {
                                                setReviewComments((prev) => [
                                                    ...prev,
                                                    {
                                                        id: String(Date.now()),
                                                        user: 'Administrator',
                                                        role: 'WORKFLOW DESIGNER',
                                                        text: newCommentText,
                                                        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                                                    },
                                                ]);
                                                setNewCommentText('');
                                            }
                                        }}
                                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveModal(null);
                                    setNewCommentText('');
                                }}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setIsSubmitting(true);
                                    setTimeout(() => {
                                        setIsSubmitting(false);
                                        showToast('Simulasi Review & Markup selesai!', 'success');
                                        setActiveModal(null);
                                        setNewCommentText('');
                                    }, 850);
                                }}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-[10px] font-black text-white uppercase shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Check size={12} />
                                        Selesaikan Review
                                    </>
                                )}
                            </button>
                        </div>
                    </Modal>
                </div>
            )}
        </div>
    );
}

// --- Main Workflow Editor Page ---
export default function WorkflowEditor({
    auth,
    workflow,
    contractTypes,
    departments,
    roles,
    users,
    contractStatuses,
    companyGroups = [],
    regions = [],
    companies = [],
}: any) {
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
                        <Button
                            type="button"
                            onClick={addLocalStep}
                            variant="ghost"
                            className="border-primary/20 hover:bg-primary/5 h-9 rounded-xl border px-4 text-xs font-bold transition-all active:scale-95"
                        >
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
                                            <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
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
                                            <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                                <LayoutTemplate size={10} /> Jenis Kontrak
                                            </label>
                                            <Select
                                                value={form.data.contract_type || 'all'}
                                                onValueChange={(v) => form.setData('contract_type', v === 'all' ? '' : String(v))}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-black tracking-tight uppercase transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900/50 dark:focus:border-white">
                                                    <SelectValue placeholder="SEMUA JENIS" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                    <SelectItem value="all" className="py-2.5 text-[10px] font-black uppercase">
                                                        SEMUA JENIS
                                                    </SelectItem>
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
                                    <div className={cn('transition-all duration-300', isOrgExpanded ? 'lg:col-span-2' : 'lg:col-span-1')}>
                                        <div
                                            className={cn(
                                                'flex h-full flex-col rounded-2xl border bg-slate-50 p-5 transition-all dark:bg-slate-900/50',
                                                form.data.company_group_ids?.length > 0 ||
                                                    form.data.region_ids?.length > 0 ||
                                                    form.data.company_ids?.length > 0
                                                    ? 'border-slate-200 dark:border-slate-800'
                                                    : 'border-dashed border-slate-200 dark:border-slate-800',
                                            )}
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase dark:text-white">
                                                        Ruang Lingkup Organisasi
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsOrgExpanded(!isOrgExpanded)}
                                                    className={cn(
                                                        'h-8 gap-2 rounded-lg px-4 text-[10px] font-bold tracking-tight uppercase transition-all',
                                                        isOrgExpanded
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400',
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
                                                        const activeGroups = companyGroups.filter((g: any) =>
                                                            form.data.company_group_ids?.includes(g.id),
                                                        );
                                                        const activeRegions = regions.filter((r: any) => form.data.region_ids?.includes(r.id));
                                                        const activeCompanies = companies.filter((c: any) => form.data.company_ids?.includes(c.id));

                                                        if (activeGroups.length === 0 && activeRegions.length === 0 && activeCompanies.length === 0) {
                                                            return (
                                                                <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-400 italic">
                                                                    <Info size={12} /> Seluruh Organisasi (Global)
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <>
                                                                {activeGroups.map((group: any) => (
                                                                    <div
                                                                        key={group.id}
                                                                        className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                                                                    >
                                                                        <span className="text-[9px] opacity-50">GRP:</span> {group.name}
                                                                    </div>
                                                                ))}
                                                                {activeRegions.map((region: any) => (
                                                                    <div
                                                                        key={region.id}
                                                                        className="flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400"
                                                                    >
                                                                        <span className="text-[9px] opacity-50">REG:</span> {region.name}
                                                                    </div>
                                                                ))}
                                                                {activeCompanies.map((company: any) => (
                                                                    <div
                                                                        key={company.id}
                                                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                                                    >
                                                                        <span className="text-[9px] opacity-50">CO:</span> {company.name}
                                                                    </div>
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {/* Expanded Edit View */}
                                            {isOrgExpanded && (
                                                <div className="mt-6 flex-1 border-t border-slate-200 pt-6 dark:border-slate-800">
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                        {/* Group Column */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Building2 size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">GROUP</span>
                                                            </div>
                                                            <div className="group/search relative">
                                                                <Search
                                                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300"
                                                                    size={13}
                                                                />
                                                                <input
                                                                    placeholder="CARI GROUP..."
                                                                    value={groupSearchText}
                                                                    onChange={(e) => setGroupSearchText(e.target.value)}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        form.setData({
                                                                            ...form.data,
                                                                            company_group_ids: [],
                                                                            region_ids: [],
                                                                            company_ids: [],
                                                                        })
                                                                    }
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.company_group_ids || form.data.company_group_ids.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA GROUP</span>
                                                                    {(!form.data.company_group_ids || form.data.company_group_ids.length === 0) && (
                                                                        <CheckCircle2 size={10} />
                                                                    )}
                                                                </button>
                                                                {companyGroups
                                                                    .filter(
                                                                        (g: any) =>
                                                                            !groupSearchText ||
                                                                            g.name.toLowerCase().includes(groupSearchText.toLowerCase()),
                                                                    )
                                                                    .map((group: any) => {
                                                                        const isSelected = form.data.company_group_ids?.includes(group.id);
                                                                        return (
                                                                            <button
                                                                                key={group.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newGroups = isSelected
                                                                                        ? form.data.company_group_ids.filter(
                                                                                              (id: string) => id !== group.id,
                                                                                          )
                                                                                        : [...(form.data.company_group_ids || []), group.id];
                                                                                    form.setData({
                                                                                        ...form.data,
                                                                                        company_group_ids: newGroups,
                                                                                        region_ids: [],
                                                                                        company_ids: [],
                                                                                    });
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected
                                                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                                        : 'border-transparent hover:bg-slate-100',
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
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">REGION</span>
                                                            </div>
                                                            <div className="group/search relative">
                                                                <Search
                                                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300"
                                                                    size={13}
                                                                />
                                                                <input
                                                                    placeholder="CARI REGION..."
                                                                    value={regionSearchText}
                                                                    onChange={(e) => setRegionSearchText(e.target.value)}
                                                                    disabled={
                                                                        !form.data.company_group_ids || form.data.company_group_ids.length === 0
                                                                    }
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 disabled:opacity-30 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData({ ...form.data, region_ids: [], company_ids: [] })}
                                                                    disabled={
                                                                        !form.data.company_group_ids || form.data.company_group_ids.length === 0
                                                                    }
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.region_ids || form.data.region_ids.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA REGION</span>
                                                                    {(!form.data.region_ids || form.data.region_ids.length === 0) && (
                                                                        <CheckCircle2 size={10} />
                                                                    )}
                                                                </button>
                                                                {regions
                                                                    .filter((r: any) => {
                                                                        if (!form.data.company_group_ids || form.data.company_group_ids.length === 0)
                                                                            return true;
                                                                        const validRegionIds = companies
                                                                            .filter((c: any) =>
                                                                                form.data.company_group_ids.includes(c.company_group_id),
                                                                            )
                                                                            .map((c: any) => c.region_id)
                                                                            .filter(Boolean);
                                                                        return validRegionIds.includes(r.id);
                                                                    })
                                                                    .filter(
                                                                        (r: any) =>
                                                                            !regionSearchText ||
                                                                            r.name.toLowerCase().includes(regionSearchText.toLowerCase()),
                                                                    )
                                                                    .map((region: any) => {
                                                                        const isSelected = form.data.region_ids?.includes(region.id);
                                                                        return (
                                                                            <button
                                                                                key={region.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newRegions = isSelected
                                                                                        ? form.data.region_ids.filter(
                                                                                              (id: string) => id !== region.id,
                                                                                          )
                                                                                        : [...(form.data.region_ids || []), region.id];
                                                                                    form.setData({
                                                                                        ...form.data,
                                                                                        region_ids: newRegions,
                                                                                        company_ids: [],
                                                                                    });
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected
                                                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                                        : 'border-transparent hover:bg-slate-100',
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
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">PERUSAHAAN</span>
                                                            </div>
                                                            <div className="group/search relative">
                                                                <Search
                                                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300"
                                                                    size={13}
                                                                />
                                                                <input
                                                                    placeholder="CARI PERUSAHAAN..."
                                                                    value={companySearchText}
                                                                    onChange={(e) => setCompanySearchText(e.target.value)}
                                                                    disabled={!form.data.region_ids || form.data.region_ids.length === 0}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 disabled:opacity-30 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData('company_ids', [])}
                                                                    disabled={!form.data.region_ids || form.data.region_ids.length === 0}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.company_ids || form.data.company_ids.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA PERUSAHAAN</span>
                                                                    {(!form.data.company_ids || form.data.company_ids.length === 0) && (
                                                                        <CheckCircle2 size={10} />
                                                                    )}
                                                                </button>
                                                                {companies
                                                                    .filter((c: any) => form.data.region_ids.includes(c.region_id))
                                                                    .filter(
                                                                        (c: any) =>
                                                                            !companySearchText ||
                                                                            c.name.toLowerCase().includes(companySearchText.toLowerCase()),
                                                                    )
                                                                    .map((company: any) => {
                                                                        const isSelected = form.data.company_ids?.includes(company.id);
                                                                        return (
                                                                            <button
                                                                                key={company.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newCompanies = isSelected
                                                                                        ? form.data.company_ids.filter(
                                                                                              (id: string) => id !== company.id,
                                                                                          )
                                                                                        : [...(form.data.company_ids || []), company.id];
                                                                                    form.setData('company_ids', newCompanies);
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected
                                                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                                        : 'border-transparent hover:bg-slate-100',
                                                                                )}
                                                                            >
                                                                                <span className="text-[10px] font-bold uppercase">
                                                                                    {company.name}
                                                                                </span>
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
                                    <div className={cn('transition-all duration-300', isInitiatorExpanded ? 'lg:col-span-2' : 'lg:col-span-1')}>
                                        <div
                                            className={cn(
                                                'flex h-full flex-col rounded-2xl border bg-slate-50 p-5 transition-all dark:bg-slate-900/50',
                                                form.data.initiator_roles.length > 0 ||
                                                    form.data.initiator_departments.length > 0 ||
                                                    form.data.initiator_users.length > 0
                                                    ? 'border-slate-200 dark:border-slate-800'
                                                    : 'border-dashed border-slate-200 dark:border-slate-800',
                                            )}
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl">
                                                        <Shield size={16} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase dark:text-white">
                                                        Otoritas Inisiator
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsInitiatorExpanded(!isInitiatorExpanded)}
                                                    className={cn(
                                                        'h-8 gap-2 rounded-lg px-4 text-[10px] font-bold tracking-tight uppercase transition-all',
                                                        isInitiatorExpanded
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400',
                                                    )}
                                                >
                                                    {isInitiatorExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                                                    {isInitiatorExpanded ? 'TUTUP' : 'ATUR'}
                                                </Button>
                                            </div>
                                            {/* ... Initiator Summary and Content ... */}
                                            {!isInitiatorExpanded && (
                                                <div className="flex flex-wrap gap-2">
                                                    {form.data.initiator_roles.length === 0 &&
                                                    form.data.initiator_departments.length === 0 &&
                                                    form.data.initiator_users.length === 0 ? (
                                                        <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-400 italic">
                                                            <Info size={12} /> Seluruh Personel (Global)
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {form.data.initiator_roles.map((roleId: string) => (
                                                                <div
                                                                    key={roleId}
                                                                    className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700"
                                                                >
                                                                    <span className="text-[9px] opacity-50">ROLE:</span> {roleId}
                                                                </div>
                                                            ))}
                                                            {form.data.initiator_departments.map((deptId: string) => {
                                                                const dept = departments.find((d: any) => String(d.id) === String(deptId));
                                                                return (
                                                                    <div
                                                                        key={deptId}
                                                                        className="flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700"
                                                                    >
                                                                        <span className="text-[9px] opacity-50">UNIT:</span> {dept?.name || deptId}
                                                                    </div>
                                                                );
                                                            })}
                                                            {form.data.initiator_users.map((userId: string) => {
                                                                const user = users.find((u: any) => String(u.id) === String(userId));
                                                                return (
                                                                    <div
                                                                        key={userId}
                                                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700"
                                                                    >
                                                                        <span className="text-[9px] opacity-50">USER:</span> {user?.name || userId}
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {isInitiatorExpanded && (
                                                <div className="mt-6 flex-1 border-t border-slate-200 pt-6 dark:border-slate-800">
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                        {/* Role Column */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Shield size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">ROLE POOL</span>
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData('initiator_roles', [])}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.initiator_roles || form.data.initiator_roles.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA ROLE</span>
                                                                    {(!form.data.initiator_roles || form.data.initiator_roles.length === 0) && (
                                                                        <CheckCircle2 size={10} />
                                                                    )}
                                                                </button>
                                                                {roles
                                                                    .filter(
                                                                        (r: any) =>
                                                                            !initiatorRoleSearch ||
                                                                            r.name.toLowerCase().includes(initiatorRoleSearch.toLowerCase()),
                                                                    )
                                                                    .map((role: any) => {
                                                                        const isSelected = form.data.initiator_roles.includes(role.name);
                                                                        return (
                                                                            <button
                                                                                key={role.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newRoles = isSelected
                                                                                        ? form.data.initiator_roles.filter(
                                                                                              (r: string) => r !== role.name,
                                                                                          )
                                                                                        : [...form.data.initiator_roles, role.name];
                                                                                    form.setData('initiator_roles', newRoles);
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
                                                                                )}
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
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">UNIT POOL</span>
                                                            </div>
                                                            <div className="group/search relative">
                                                                <Search
                                                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300"
                                                                    size={13}
                                                                />
                                                                <input
                                                                    placeholder="CARI UNIT..."
                                                                    value={initiatorDeptSearch}
                                                                    onChange={(e) => setInitiatorDeptSearch(e.target.value)}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData('initiator_departments', [])}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.initiator_departments ||
                                                                            form.data.initiator_departments.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA UNIT</span>
                                                                    {(!form.data.initiator_departments ||
                                                                        form.data.initiator_departments.length === 0) && <CheckCircle2 size={10} />}
                                                                </button>
                                                                {departments
                                                                    .filter(
                                                                        (d: any) =>
                                                                            !initiatorDeptSearch ||
                                                                            d.name.toLowerCase().includes(initiatorDeptSearch.toLowerCase()),
                                                                    )
                                                                    .map((dept: any) => {
                                                                        const isSelected = form.data.initiator_departments.includes(String(dept.id));
                                                                        return (
                                                                            <button
                                                                                key={dept.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const next = isSelected
                                                                                        ? form.data.initiator_departments.filter(
                                                                                              (id: string) => id !== String(dept.id),
                                                                                          )
                                                                                        : [...form.data.initiator_departments, String(dept.id)];
                                                                                    form.setData('initiator_departments', next);
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
                                                                                )}
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
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">USER POOL</span>
                                                            </div>
                                                            <div className="group/search relative">
                                                                <Search
                                                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300"
                                                                    size={13}
                                                                />
                                                                <input
                                                                    placeholder="CARI USER..."
                                                                    value={initiatorUserSearch}
                                                                    onChange={(e) => setInitiatorUserSearch(e.target.value)}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData('initiator_users', [])}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.initiator_users || form.data.initiator_users.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA USER</span>
                                                                    {(!form.data.initiator_users || form.data.initiator_users.length === 0) && (
                                                                        <CheckCircle2 size={10} />
                                                                    )}
                                                                </button>
                                                                {users
                                                                    .filter(
                                                                        (u: any) =>
                                                                            !initiatorUserSearch ||
                                                                            u.name.toLowerCase().includes(initiatorUserSearch.toLowerCase()),
                                                                    )
                                                                    .map((user: any) => {
                                                                        const isSelected = form.data.initiator_users.includes(String(user.id));
                                                                        return (
                                                                            <button
                                                                                key={user.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const next = isSelected
                                                                                        ? form.data.initiator_users.filter(
                                                                                              (id: string) => id !== String(user.id),
                                                                                          )
                                                                                        : [...form.data.initiator_users, String(user.id)];
                                                                                    form.setData('initiator_users', next);
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
                                                                                )}
                                                                            >
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[10px] font-bold uppercase">
                                                                                        {user.name}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-medium tracking-tight text-slate-400 uppercase">
                                                                                        {user.role}
                                                                                    </span>
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
                                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl">
                                        <GitBranch size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-slate-900 uppercase dark:text-white">Tahapan Alur Kerja</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Konfigurasi Urutan Approval & Penugasan</p>
                                    </div>
                                </div>
                                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('list')}
                                        className={cn(
                                            'rounded-md px-4 py-1.5 text-[9px] font-bold uppercase transition-all',
                                            activeTab === 'list'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                                : 'text-slate-400',
                                        )}
                                    >
                                        Daftar Langkah
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('visual')}
                                        className={cn(
                                            'rounded-md px-4 py-1.5 text-[9px] font-bold uppercase transition-all',
                                            activeTab === 'visual'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                                : 'text-slate-400',
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
                                            className="h-8 rounded-lg px-4 text-[10px] font-black tracking-wider uppercase"
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
                                            <div className="bg-primary/5 mb-4 rounded-2xl p-4">
                                                <PlusCircle size={32} className="text-primary/20" />
                                            </div>
                                            <span className="text-primary/30 text-xs font-black tracking-[0.2em] uppercase">
                                                Belum Ada Tahapan Terdefinisi
                                            </span>
                                            <p className="mt-2 text-[10px] font-bold tracking-tight text-slate-400 uppercase">
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
                                                    <div className="absolute top-12 bottom-12 left-[19.5px] z-0 w-px bg-slate-100 dark:bg-slate-800" />
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
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-[9px] font-black tracking-[0.3em] text-slate-400 uppercase dark:border-white/5 dark:bg-white/[0.02]">
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
