import { FormSection, ManagementForm } from '@/pages/admin/components/ManagementForm';
import { SELECTABLE_ICONS } from '@/pages/admin/components/NavigationManagement';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { cn } from '@/lib/utils';
import {
    defaultDropAnimationSideEffects,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    pointerWithin,
    UniqueIdentifier,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Check,
    CheckSquare,
    ChevronDown,
    Edit2,
    Eye,
    Filter,
    GripVertical,
    Key,
    Layers,
    LayoutGrid,
    ArrowLeft,
    Briefcase,
    Loader2,
    Move,
    Plus,
    RefreshCw,
    Save,
    Scale,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    SlidersHorizontal,
    Sparkles,
    Square,
    Trash2,
    UserCheck,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

// --- Shared Constants & Types ---
const PERMISSIONS = ['can_read', 'can_create', 'can_update', 'can_delete', 'can_approve', 'can_bulk_approve', 'can_bulk_delete'] as const;
type Permission = (typeof PERMISSIONS)[number];

type PresetLevel = 'none' | 'read' | 'editor' | 'full' | 'custom';

const PERMISSION_CONFIG: Record<
    Permission,
    {
        label: string;
        shortLabel: string;
        description: string;
        icon: React.ComponentType<{ size?: number; className?: string }>;
        colorClass: string;
        badgeClass: string;
    }
> = {
    can_read: {
        label: 'Can Read (Lihat Data)',
        shortLabel: 'Read',
        description: 'Melihat & membuka modul',
        icon: Eye,
        colorClass: 'text-sky-600 dark:text-sky-400',
        badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
    },
    can_create: {
        label: 'Can Create (Tambah Data)',
        shortLabel: 'Create',
        description: 'Membuat data baru',
        icon: Plus,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
    },
    can_update: {
        label: 'Can Edit (Ubah Data)',
        shortLabel: 'Edit',
        description: 'Mengubah data yang ada',
        icon: Edit2,
        colorClass: 'text-amber-600 dark:text-amber-400',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
    },
    can_delete: {
        label: 'Can Delete (Hapus Data)',
        shortLabel: 'Delete',
        description: 'Menghapus data individual',
        icon: Trash2,
        colorClass: 'text-rose-600 dark:text-rose-400',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
    },
    can_approve: {
        label: 'Can Approve (Setujui)',
        shortLabel: 'Approve',
        description: 'Menyetujui pengajuan / permohonan',
        icon: ShieldCheck,
        colorClass: 'text-indigo-600 dark:text-indigo-400',
        badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
    },
    can_bulk_approve: {
        label: 'Can Bulk Approve (Massal Setujui)',
        shortLabel: 'Bulk Aprv',
        description: 'Persetujuan massal banyak data',
        icon: CheckSquare,
        colorClass: 'text-purple-600 dark:text-purple-400',
        badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
    },
    can_bulk_delete: {
        label: 'Can Bulk Delete (Massal Hapus)',
        shortLabel: 'Bulk Del',
        description: 'Penghapusan massal banyak data',
        icon: ShieldAlert,
        colorClass: 'text-red-600 dark:text-red-400',
        badgeClass: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/60',
    },
};

function getPermissionLevel(access: any): { level: PresetLevel; label: string; badgeClass: string; icon: React.ComponentType<{ size?: number; className?: string }> } {
    if (!access) {
        return {
            level: 'none',
            label: 'Tidak Ada Akses',
            badgeClass: 'bg-surface-muted text-text-desc border-surface-border',
            icon: ShieldOff,
        };
    }

    const isFull = PERMISSIONS.every((p) => access[p]);
    if (isFull) {
        return {
            level: 'full',
            label: 'Akses Penuh',
            badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold',
            icon: ShieldCheck,
        };
    }

    const isNoAccess = PERMISSIONS.every((p) => !access[p]);
    if (isNoAccess) {
        return {
            level: 'none',
            label: 'Tidak Ada Akses',
            badgeClass: 'bg-surface-muted text-text-desc border-surface-border font-medium',
            icon: ShieldOff,
        };
    }

    const isRead =
        access.can_read &&
        !access.can_create &&
        !access.can_update &&
        !access.can_delete &&
        !access.can_approve &&
        !access.can_bulk_approve &&
        !access.can_bulk_delete;
    if (isRead) {
        return {
            level: 'read',
            label: 'Lihat Saja',
            badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 font-bold',
            icon: Eye,
        };
    }

    const isEditor =
        access.can_read &&
        access.can_create &&
        access.can_update &&
        !access.can_delete &&
        !access.can_approve &&
        !access.can_bulk_approve &&
        !access.can_bulk_delete;
    if (isEditor) {
        return {
            level: 'editor',
            label: 'Editor (CRUD)',
            badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold',
            icon: Edit2,
        };
    }

    const activeCount = PERMISSIONS.filter((p) => access[p]).length;
    return {
        level: 'custom',
        label: `Kustom (${activeCount} Izin)`,
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold',
        icon: SlidersHorizontal,
    };
}

interface Module {
    id: string;
    name: string;
    identifier?: string;
    route: string | null;
    icon: string | null;
    module_group_id: string | null;
    sequence: number;
    access?: any;
    showed_as_menu?: boolean;
    description?: string | null;
    module_group?: {
        id: string;
        name: string;
    } | null;
}

interface Group {
    id: string;
    name: string;
    icon?: string | null;
    sequence: number;
    modules: Module[];
}

interface Role {
    id: string;
    name: string;
    description: string;
}

interface Props {
    role: Role;
    roles: Role[];
    modules: Module[];
    navigation: Group[];
    allModules: Module[];
    defaultTab: 'access' | 'navigation';
    isIndependent?: boolean;
}

// --- ACCESS TAB MODERN COMPONENT ---
const ModernModuleRow = React.memo(
    ({
        module,
        access,
        isSelected,
        onSelect,
        onToggle,
        onSetPreset,
    }: {
        module: Module;
        access: any;
        isSelected: boolean;
        onSelect: (moduleId: string) => void;
        onToggle: (moduleId: string, permission: Permission, checked: boolean) => void;
        onSetPreset: (moduleId: string, preset: PresetLevel) => void;
    }) => {
        const status = getPermissionLevel(access);
        const StatusIcon = status.icon;

        return (
            <div
                className={cn(
                    'flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 border-b border-surface-border/60 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors last:border-b-0',
                    isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'bg-surface-card',
                )}
            >
                {/* Module Identification */}
                <div className="flex items-center gap-3 min-w-0 md:w-[35%] lg:w-[30%]">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelect(module.id)}
                        className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 rounded-md transition-all active:scale-90 shrink-0 cursor-pointer"
                        title={isSelected ? 'Batalkan pilihan' : 'Pilih untuk bulk edit'}
                    />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                        {module.icon && SELECTABLE_ICONS[module.icon]
                            ? React.createElement(SELECTABLE_ICONS[module.icon], { size: 16 })
                            : <LayoutGrid size={16} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-main truncate">
                                {module.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-text-desc truncate">
                                {module.identifier || 'system.module'}
                            </span>
                            {module.route && (
                                <span className="text-[10px] text-text-desc/60 truncate border-l border-surface-border pl-1.5">
                                    {module.route}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Permission Badges */}
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    {PERMISSIONS.map((p) => {
                        const isGranted = !!access?.[p];
                        const cfg = PERMISSION_CONFIG[p];
                        const Icon = cfg.icon;

                        if (!isGranted) return null;

                        return (
                            <span
                                key={p}
                                className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border shadow-2xs transition-all',
                                    cfg.badgeClass,
                                )}
                                title={cfg.description}
                            >
                                <Icon size={11} className="shrink-0" />
                                <span>{cfg.shortLabel}</span>
                            </span>
                        );
                    })}
                    {status.level === 'none' && (
                        <span className="text-[11px] text-text-desc/70 italic flex items-center gap-1">
                            <ShieldOff size={12} />
                            Tidak ada hak akses yang diizinkan
                        </span>
                    )}
                </div>

                {/* Dropdown Action & Level Indicator */}
                <div className="flex items-center gap-2 shrink-0">
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs',
                            status.badgeClass,
                        )}
                    >
                        <StatusIcon size={13} />
                        <span>{status.label}</span>
                    </span>

                    {/* Permission Dropdown Trigger */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border-surface-border bg-surface-muted/60 hover:bg-surface-border/80 cursor-pointer"
                            >
                                <span>Kelola Izin</span>
                                <ChevronDown size={12} className="text-text-desc" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-1.5 bg-white dark:bg-zinc-900 border border-surface-border shadow-2xl rounded-xl z-50">
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-text-desc px-2 py-1">
                                Preset Akses Cepat
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => onSetPreset(module.id, 'full')}
                                className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                            >
                                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <div className="flex flex-col">
                                    <span>Akses Penuh</span>
                                    <span className="text-[10px] font-normal text-text-desc">Semua izin CRUD & Approve</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onSetPreset(module.id, 'editor')}
                                className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                <div className="flex flex-col">
                                    <span>Editor (CRUD)</span>
                                    <span className="text-[10px] font-normal text-text-desc">Read, Create, Update</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onSetPreset(module.id, 'read')}
                                className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                            >
                                <Eye size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
                                <div className="flex flex-col">
                                    <span>Lihat Saja (Read Only)</span>
                                    <span className="text-[10px] font-normal text-text-desc">Hanya dapat melihat data</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onSetPreset(module.id, 'none')}
                                className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-1.5 px-2 hover:bg-rose-500/10 hover:text-rose-600"
                            >
                                <ShieldOff size={14} className="text-rose-500 shrink-0" />
                                <div className="flex flex-col">
                                    <span>Tidak Ada Akses</span>
                                    <span className="text-[10px] font-normal text-text-desc">Nonaktifkan semua izin</span>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1 bg-surface-border" />

                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-text-desc px-2 py-1">
                                Izin Granular
                            </DropdownMenuLabel>
                            {PERMISSIONS.map((p) => {
                                const cfg = PERMISSION_CONFIG[p];
                                const Icon = cfg.icon;
                                const isChecked = !!access?.[p];

                                return (
                                    <DropdownMenuItem
                                        key={p}
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={() => onToggle(module.id, p, !isChecked)}
                                        className="cursor-pointer rounded-lg py-1.5 px-2 text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <Icon size={14} className={cn('shrink-0', cfg.colorClass)} />
                                            <span className="text-xs font-medium text-text-main truncate">{cfg.label}</span>
                                        </div>
                                        <div
                                            className={cn(
                                                'h-4 w-4 rounded flex items-center justify-center border transition-all shrink-0',
                                                isChecked
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'border-surface-border bg-surface-muted/40',
                                            )}
                                        >
                                            {isChecked && <Check size={11} strokeWidth={3} />}
                                        </div>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    },
);

// --- NAVIGATION TAB COMPONENTS ---

const SortableModuleItem = ({
    module,
    onRemove,
    index,
    total,
    onMoveUp,
    onMoveDown,
    onEditModule,
    onMoveToGroup,
    groups,
}: {
    module: Module;
    onRemove: (id: string) => void;
    index: number;
    total: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onEditModule: (m: Module) => void;
    onMoveToGroup: (moduleId: string, targetGroupId: string) => void;
    groups: Group[];
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: module.id,
        data: { type: 'module', module },
    });
    const style = { transform: CSS.Translate.toString(transform), transition };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group border-surface-border/70 bg-surface-card hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 flex items-center justify-between gap-3 rounded-xl border p-3 transition-all shadow-2xs',
                isDragging && 'border-primary ring-primary/20 z-50 scale-[1.02] opacity-50 shadow-2xl ring-2',
            )}
        >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Drag handle */}
                <div
                    {...listeners}
                    {...attributes}
                    className="text-text-desc hover:bg-primary/10 hover:text-primary cursor-grab rounded-lg p-1.5 transition-colors active:cursor-grabbing shrink-0"
                    title="Tarik untuk mengubah urutan modul"
                >
                    <GripVertical size={15} />
                </div>

                {/* Sequence badge */}
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-muted text-[11px] font-bold text-text-desc shrink-0 border border-surface-border">
                    #{index + 1}
                </span>

                {/* Module Icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {module.icon && SELECTABLE_ICONS[module.icon]
                        ? React.createElement(SELECTABLE_ICONS[module.icon], { size: 15 })
                        : <LayoutGrid size={15} />}
                </div>

                {/* Module Details */}
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-text-main truncate">{module.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[9.5px] text-text-desc/80 truncate">
                            {module.identifier || 'system.module'}
                        </span>
                        {module.route && (
                            <span className="text-[9.5px] text-text-desc/60 truncate border-l border-surface-border pl-1.5 font-mono">
                                {module.route}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {/* Reorder Up/Down */}
                <button
                    type="button"
                    disabled={index === 0}
                    onClick={onMoveUp}
                    className="p-1 rounded text-text-desc hover:text-primary hover:bg-primary/10 disabled:opacity-20 cursor-pointer"
                    title="Geser ke atas"
                >
                    <ArrowUp size={13} />
                </button>
                <button
                    type="button"
                    disabled={index === total - 1}
                    onClick={onMoveDown}
                    className="p-1 rounded text-text-desc hover:text-primary hover:bg-primary/10 disabled:opacity-20 cursor-pointer"
                    title="Geser ke bawah"
                >
                    <ArrowDown size={13} />
                </button>

                <div className="h-3.5 w-px bg-surface-border mx-0.5" />

                {/* Move to another group dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="p-1.5 rounded-lg text-text-desc hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                            title="Pindahkan ke Grup Lain"
                        >
                            <Move size={13} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-1.5 bg-white dark:bg-zinc-900 border border-surface-border shadow-2xl rounded-xl z-50">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-text-desc px-2 py-1">
                            Pindah ke Grup
                        </DropdownMenuLabel>
                        {groups.map((g) => (
                            <DropdownMenuItem
                                key={g.id}
                                onClick={() => onMoveToGroup(module.id, g.id)}
                                className="cursor-pointer rounded-lg text-xs font-semibold py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                            >
                                <LayoutGrid size={13} className="text-text-desc mr-2 shrink-0" />
                                <span className="truncate">{g.name}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Edit Module */}
                <button
                    type="button"
                    onClick={() => onEditModule(module)}
                    className="p-1.5 rounded-lg text-text-desc hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                    title="Ubah Nama/Path Modul"
                >
                    <Edit2 size={13} />
                </button>

                {/* Remove from Nav */}
                <button
                    type="button"
                    onClick={() => onRemove(module.id)}
                    className="p-1.5 rounded-lg text-text-desc hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Lepas dari Navigasi Role Ini"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
};

const SortableNavGroupRow = ({
    group,
    index,
    total,
    isSelected,
    onSelect,
    onMoveUp,
    onMoveDown,
    onEditGroup,
    onDeleteGroup,
}: {
    group: Group;
    index: number;
    total: number;
    isSelected: boolean;
    onSelect: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onEditGroup: () => void;
    onDeleteGroup: () => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: group.id,
        data: { type: 'group', group },
    });
    const style = { transform: CSS.Translate.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={cn(
                'p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group/item min-h-[50px] shadow-2xs relative overflow-hidden',
                isDragging && 'border-primary ring-primary/20 z-50 scale-[1.02] opacity-50 shadow-2xl ring-2',
                isSelected
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-surface-border/80 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 bg-surface-card text-text-main',
            )}
        >
            {/* Active Left Indicator Bar */}
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />}

            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Drag handle */}
                <div
                    {...listeners}
                    {...attributes}
                    onClick={(e) => e.stopPropagation()}
                    className="text-text-desc hover:bg-primary/10 hover:text-primary cursor-grab rounded-lg p-1 transition-colors active:cursor-grabbing shrink-0"
                    title="Tarik untuk mengubah urutan grup"
                >
                    <GripVertical size={14} />
                </div>

                {/* Sequence Number */}
                <span
                    className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold shrink-0 border',
                        isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-surface-muted text-text-desc border-surface-border',
                    )}
                >
                    {index + 1}
                </span>

                {/* Group Icon */}
                <div
                    className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg shrink-0 border',
                        isSelected ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-muted text-text-desc border-surface-border',
                    )}
                >
                    {group.icon && SELECTABLE_ICONS[group.icon]
                        ? React.createElement(SELECTABLE_ICONS[group.icon], { size: 14 })
                        : <LayoutGrid size={14} />}
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{group.name}</span>
                    <span className={cn('text-[10px] truncate', isSelected ? 'text-primary/80 font-medium' : 'text-text-desc')}>
                        {group.modules.length} Modul Terpasang
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                <span
                    className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md border',
                        isSelected
                            ? 'bg-primary/15 text-primary border-primary/30'
                            : 'bg-surface-muted text-text-desc border-surface-border',
                    )}
                >
                    {group.modules.length}
                </span>

                <button
                    type="button"
                    disabled={index === 0}
                    onClick={onMoveUp}
                    className="p-1 rounded text-text-desc hover:text-primary hover:bg-primary/10 disabled:opacity-20 cursor-pointer"
                    title="Geser grup ke atas"
                >
                    <ArrowUp size={12} />
                </button>
                <button
                    type="button"
                    disabled={index === total - 1}
                    onClick={onMoveDown}
                    className="p-1 rounded text-text-desc hover:text-primary hover:bg-primary/10 disabled:opacity-20 cursor-pointer"
                    title="Geser grup ke bawah"
                >
                    <ArrowDown size={12} />
                </button>

                <button
                    type="button"
                    onClick={onEditGroup}
                    className="p-1 rounded text-text-desc hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    title="Ubah Grup"
                >
                    <Edit2 size={12} />
                </button>
                <button
                    type="button"
                    onClick={onDeleteGroup}
                    className="p-1 rounded text-text-desc hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Lepas Grup dari Navigasi"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};

const AvailableListContainer = ({
    modules,
    onQuickAdd,
    onEditModule,
    onAddModule,
    onDeleteModule,
    activeGroupName,
}: {
    modules: Module[];
    onQuickAdd: (m: Module) => void;
    onEditModule: (m: Module) => void;
    onAddModule: () => void;
    onDeleteModule: (id: string) => void;
    activeGroupName?: string;
}) => {
    const { setNodeRef } = useDroppable({ id: 'available-list' });
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return modules;
        const q = search.toLowerCase();
        return modules.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                (m.identifier && m.identifier.toLowerCase().includes(q)) ||
                (m.route && m.route.toLowerCase().includes(q)),
        );
    }, [modules, search]);

    return (
        <div className="flex flex-col gap-2.5 h-full">
            <div className="flex items-center justify-between border-b border-surface-border pb-2 min-h-[36px]">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-muted text-text-desc border border-surface-border">
                        <Layers size={13} />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
                        Repository Modul
                    </h3>
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                        {modules.length} Tersedia
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onAddModule}
                    className="text-primary hover:bg-primary/10 border border-primary/30 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    title="Buat Modul Baru ke Repository"
                >
                    <Plus size={12} />
                    <span>Buat Modul</span>
                </button>
            </div>

            {/* Search filter for available modules */}
            <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-desc" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari modul di repository..."
                    className="w-full h-8 pl-7 pr-7 text-xs bg-surface-card border border-surface-border rounded-lg placeholder:text-text-desc/60 focus:outline-none focus:ring-1 focus:ring-primary text-text-main"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-desc hover:text-text-main p-0.5 cursor-pointer"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* List container */}
            <div
                ref={setNodeRef}
                className="h-[calc(100vh-320px)] min-h-[350px] overflow-y-auto scrollbar-hide space-y-1.5 p-2 border border-surface-border/80 rounded-xl bg-slate-50/40 dark:bg-zinc-900/30 flex flex-col"
            >
                <SortableContext id="available-context" items={filtered.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {filtered.map((module) => (
                        <AvailableModuleItem
                            key={module.id}
                            module={module}
                            onQuickAdd={onQuickAdd}
                            onEditModule={onEditModule}
                            onDeleteModule={onDeleteModule}
                            activeGroupName={activeGroupName}
                        />
                    ))}
                </SortableContext>
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-text-desc">
                        <Layers className="text-text-desc/40 mb-2" size={32} strokeWidth={1} />
                        <p className="text-xs font-bold text-text-main">
                            {search ? 'Tidak ada modul yang cocok' : 'Semua modul telah dipasang'}
                        </p>
                        <p className="text-[10px] text-text-desc mt-0.5">
                            {search ? `Tidak ditemukan modul "${search}"` : 'Semua modul dari repository sudah terdaftar dalam navigasi.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AvailableModuleItem = ({
    module,
    onQuickAdd,
    onEditModule,
    onDeleteModule,
    activeGroupName,
}: {
    module: Module;
    onQuickAdd: (m: Module) => void;
    onEditModule: (m: Module) => void;
    onDeleteModule: (id: string) => void;
    activeGroupName?: string;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: module.id,
        data: { type: 'available-module', module },
    });
    const style = { transform: CSS.Translate.toString(transform), transition };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group border-surface-border/70 bg-surface-card hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all shadow-2xs',
                isDragging && 'border-primary ring-primary/20 z-50 scale-[1.02] opacity-50 shadow-2xl ring-2',
            )}
        >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                    {...listeners}
                    {...attributes}
                    className="text-text-desc hover:bg-primary/10 hover:text-primary cursor-grab rounded-lg p-1 transition-colors active:cursor-grabbing shrink-0"
                    title="Tarik modul ke grup navigasi"
                >
                    <GripVertical size={14} />
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-desc border border-surface-border">
                    {module.icon && SELECTABLE_ICONS[module.icon]
                        ? React.createElement(SELECTABLE_ICONS[module.icon], { size: 13 })
                        : <LayoutGrid size={13} />}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-text-main truncate">{module.name}</span>
                    <span className="text-[9px] font-mono text-text-desc truncate mt-0.5">
                        {module.route || module.identifier || 'system.module'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => onEditModule(module)}
                    className="p-1 rounded text-text-desc hover:text-primary hover:bg-primary/10 cursor-pointer"
                    title="Edit Definisi Modul"
                >
                    <Edit2 size={12} />
                </button>
                <button
                    type="button"
                    onClick={() => onDeleteModule(module.id)}
                    className="p-1 rounded text-text-desc hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                    title="Hapus Modul dari Sistem"
                >
                    <Trash2 size={12} />
                </button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onQuickAdd(module)}
                    className="h-7 px-2 text-[11px] font-bold rounded-lg border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 cursor-pointer ml-0.5"
                    title={activeGroupName ? `Pasang ke grup ${activeGroupName}` : 'Pasang ke grup'}
                >
                    <Plus size={11} className="mr-0.5" />
                    <span>Pasang</span>
                </Button>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function RoleConfig({ role, roles, modules, navigation, allModules, defaultTab, isIndependent }: Props) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'access' | 'navigation'>(defaultTab);

    // --- Navigation States & Handlers ---
    const [navItems, setNavItems] = useState<Group[]>(navigation);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Default to the first group on load
    useEffect(() => {
        if (navItems.length > 0 && !selectedGroupId) {
            setSelectedGroupId(navItems[0].id);
        }
    }, [navItems]);

    const [availableModules, setAvailableModules] = useState<Module[]>(() => {
        const activeModuleIds = new Set(navigation.flatMap((g) => g.modules.map((m) => m.id)));
        return allModules.filter((m) => !activeModuleIds.has(m.id));
    });
    const [isSavingNav, setIsSavingNav] = useState(false);

    // Navigation Search States
    const [navGroupSearch, setNavGroupSearch] = useState('');
    const [activeGroupModuleSearch, setActiveGroupModuleSearch] = useState('');

    // Group CRUD States
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupName, setGroupName] = useState('');
    const [groupIcon, setGroupIcon] = useState('Folder');
    const [isProcessingGroup, setIsGroupProcessing] = useState(false);

    // Sync state when props change
    useEffect(() => {
        setNavItems(navigation);
        const activeModuleIds = new Set(navigation.flatMap((g) => g.modules.map((m) => m.id)));
        setAvailableModules(allModules.filter((m) => !activeModuleIds.has(m.id)));
    }, [navigation, allModules]);

    const openGroupModal = (group: Group | null = null) => {
        setEditingGroup(group);
        setGroupName(group ? group.name : '');
        setGroupIcon(group?.icon || 'Folder');
        setIsGroupModalOpen(true);
    };

    const handleSaveGroup = async () => {
        if (!groupName.trim()) return;
        setIsGroupProcessing(true);

        try {
            if (editingGroup) {
                setNavItems((prev) => prev.map((g) => (g.id === editingGroup.id ? { ...g, name: groupName, icon: groupIcon } : g)));
                router.put(
                    `/admin/module-groups/${editingGroup.id}`,
                    { name: groupName, icon: groupIcon },
                    {
                        onSuccess: () => showToast('Grup navigasi berhasil diperbarui', 'success'),
                        onFinish: () => setIsGroupProcessing(false),
                    },
                );
            } else {
                router.post(
                    `/admin/module-groups`,
                    { name: groupName, icon: groupIcon, role_id: role.id },
                    {
                        onSuccess: () => showToast('Grup navigasi berhasil dibuat', 'success'),
                        onFinish: () => setIsGroupProcessing(false),
                    },
                );
            }
            setIsGroupModalOpen(false);
        } catch (error) {
            showToast('Gagal memproses grup', 'danger');
            setIsGroupProcessing(false);
        }
    };

    // Delete Group Confirmation States
    const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
    const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

    // Delete Module Confirmation States
    const [isDeleteModuleModalOpen, setIsDeleteModuleModalOpen] = useState(false);
    const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

    const handleDeleteGroup = (groupId: string) => {
        setDeletingGroupId(groupId);
        setIsDeleteGroupModalOpen(true);
    };

    const confirmDeleteGroup = () => {
        if (!deletingGroupId) return;

        const groupId = deletingGroupId;
        const group = navItems.find((g) => g.id === groupId);
        if (group) {
            // Move modules back to available pool
            setAvailableModules((prev) => [...prev, ...group.modules]);
            setNavItems((prev) => prev.filter((g) => g.id !== groupId));
        }

        // Only remove from this role's nav, not global delete
        router.delete(`/admin/roles/${role.id}/nav-group/${groupId}`, {
            onSuccess: () => showToast('Grup dilepas dari navigasi role ini', 'success'),
            onFinish: () => {
                setIsDeleteGroupModalOpen(false);
                setDeletingGroupId(null);
            },
        });
    };

    // Module CRUD States & Handlers
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModuleItem, setEditingModuleItem] = useState<Module | null>(null);
    const [moduleName, setModuleName] = useState('');
    const [moduleIdentifier, setModuleIdentifier] = useState('');
    const [moduleRoute, setModuleRoute] = useState('');
    const [moduleGroupId, setModuleGroupId] = useState('');
    const [moduleIcon, setModuleIcon] = useState('LayoutGrid');
    const [moduleDescription, setModuleDescription] = useState('');
    const [isProcessingModule, setIsModuleProcessing] = useState(false);

    const openModuleModal = (module: Module | null = null) => {
        setEditingModuleItem(module);
        setModuleName(module ? module.name : '');
        setModuleIdentifier(module ? module.identifier || '' : '');
        setModuleRoute(module ? module.route || '' : '');
        setModuleGroupId(module ? module.module_group_id || '' : navItems[0]?.id || '');
        setModuleIcon(module ? module.icon || 'LayoutGrid' : 'LayoutGrid');
        setModuleDescription(module ? module.description || '' : '');
        setIsModuleModalOpen(true);
    };

    const handleSaveModule = async () => {
        if (!moduleName.trim()) return;
        setIsModuleProcessing(true);

        try {
            if (editingModuleItem) {
                // Update existing module
                router.put(
                    `/admin/modules/${editingModuleItem.id}`,
                    {
                        name: moduleName,
                        identifier: editingModuleItem.identifier,
                        module_group_id: moduleGroupId || navItems[0]?.id,
                        route: moduleRoute,
                        icon: moduleIcon,
                        showed_as_menu: editingModuleItem.showed_as_menu !== undefined ? editingModuleItem.showed_as_menu : true,
                        description: moduleDescription,
                    },
                    {
                        onSuccess: () => {
                            showToast('Modul berhasil diperbarui', 'success');
                            setIsModuleModalOpen(false);
                            setEditingModuleItem(null);
                        },
                        onFinish: () => setIsModuleProcessing(false),
                    },
                );
            } else {
                // Store new module
                router.post(
                    `/admin/modules`,
                    {
                        name: moduleName,
                        identifier: moduleIdentifier,
                        module_group_id: moduleGroupId || navItems[0]?.id,
                        route: moduleRoute,
                        icon: moduleIcon,
                        showed_as_menu: true,
                        description: moduleDescription,
                        role_id: role.id,
                    },
                    {
                        onSuccess: () => {
                            showToast('Modul baru berhasil ditambahkan', 'success');
                            setIsModuleModalOpen(false);
                        },
                        onFinish: () => setIsModuleProcessing(false),
                    },
                );
            }
        } catch (error) {
            showToast('Gagal memproses modul', 'danger');
            setIsModuleProcessing(false);
        }
    };

    const handleDeleteModule = (moduleId: string) => {
        setDeletingModuleId(moduleId);
        setIsDeleteModuleModalOpen(true);
    };

    const confirmDeleteModule = () => {
        if (!deletingModuleId) return;

        const moduleId = deletingModuleId;
        // Move module back to available pool
        const module = navItems.flatMap((g) => g.modules).find((m) => m.id === moduleId);
        if (module) {
            setAvailableModules((prev) => [...prev, module]);
            setNavItems((prev) =>
                prev.map((g) => ({ ...g, modules: g.modules.filter((m) => m.id !== moduleId) }))
            );
        }

        // Only remove from this role's nav, not global delete
        router.delete(`/admin/roles/${role.id}/nav-module/${moduleId}`, {
            onSuccess: () => showToast('Modul dilepas dari navigasi role ini', 'success'),
            onError: () => showToast('Gagal melepas modul', 'danger'),
            onFinish: () => {
                setIsDeleteModuleModalOpen(false);
                setDeletingModuleId(null);
            },
        });
    };

    // Sync tab when defaultTab changes (due to Inertia reload)
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    // Access Matrix Form
    const accessForm = useForm({
        accesses: modules.map((module) => ({
            module_id: module.id,
            can_read: module.access?.can_read || false,
            can_create: module.access?.can_create || false,
            can_update: module.access?.can_update || false,
            can_delete: module.access?.can_delete || false,
            can_approve: (module.access as any)?.can_approve || false,
            can_bulk_approve: (module.access as any)?.can_bulk_approve || false,
            can_bulk_delete: (module.access as any)?.can_bulk_delete || false,
        })),
    });

    const handleAccessSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        accessForm.post(`/admin/roles/${role.id}/access`, {
            onSuccess: () => showToast('Hak akses role berhasil diperbarui.', 'success'),
            onError: () => showToast('Gagal menyimpan hak akses.', 'danger'),
        });
    };

    const handleNavSave = () => {
        setIsSavingNav(true);
        const data = navItems.map((g, gIdx) => ({
            id: g.id,
            sequence: gIdx + 1,
            modules: g.modules.map((m, mIdx) => ({
                id: m.id,
                sequence: mIdx + 1,
            })),
        }));

        router.post(
            `/admin/roles/${role.id}/reorder`,
            { role_id: role.id, groups: data },
            {
                onSuccess: () => showToast('Urutan navigasi berhasil disimpan', 'success'),
                onFinish: () => setIsSavingNav(false),
            },
        );
    };

    // Add Enter key shortcut to save configurations
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            // Ignore if user is editing inside a form input, select, textarea, or DND modal is active
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                isGroupModalOpen ||
                isModuleModalOpen ||
                isDeleteGroupModalOpen ||
                isDeleteModuleModalOpen
            ) {
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                if (activeTab === 'access') {
                    if (!accessForm.processing) {
                        handleAccessSubmit();
                    }
                } else {
                    if (!isSavingNav) {
                        handleNavSave();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        activeTab,
        accessForm.processing,
        isSavingNav,
        isGroupModalOpen,
        isModuleModalOpen,
        isDeleteGroupModalOpen,
        isDeleteModuleModalOpen,
        navItems,
        role.id,
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // --- Bulk Selection & Bulk Action States ---
    const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
    const [isBulkGranularModalOpen, setIsBulkGranularModalOpen] = useState(false);
    const [bulkPermissions, setBulkPermissions] = useState<Record<Permission, boolean>>({
        can_read: true,
        can_create: false,
        can_update: false,
        can_delete: false,
        can_approve: false,
        can_bulk_approve: false,
        can_bulk_delete: false,
    });

    const toggleSelectModule = (id: string) => {
        setSelectedModuleIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectGroup = (groupId: string) => {
        const groupModules = filteredGroupedModules[groupId]?.modules || [];
        const groupModuleIds = groupModules.map((m) => m.id);
        const allSelected = groupModuleIds.length > 0 && groupModuleIds.every((id) => selectedModuleIds.includes(id));

        if (allSelected) {
            setSelectedModuleIds((prev) => prev.filter((id) => !groupModuleIds.includes(id)));
        } else {
            setSelectedModuleIds((prev) => Array.from(new Set([...prev, ...groupModuleIds])));
        }
    };

    const applyPresetToSelected = (preset: PresetLevel) => {
        if (selectedModuleIds.length === 0) return;
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                if (selectedModuleIds.includes(access.module_id)) {
                    if (preset === 'full') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: true,
                            can_update: true,
                            can_delete: true,
                            can_approve: true,
                            can_bulk_approve: true,
                            can_bulk_delete: true,
                        };
                    } else if (preset === 'editor') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: true,
                            can_update: true,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    } else if (preset === 'read') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: false,
                            can_update: false,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    } else if (preset === 'none') {
                        return {
                            ...access,
                            can_read: false,
                            can_create: false,
                            can_update: false,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    }
                }
                return access;
            }),
        );
        showToast(`Preset diterapkan ke ${selectedModuleIds.length} modul terpilih`, 'success');
    };

    const handleBulkGranularApply = () => {
        if (selectedModuleIds.length === 0) return;
        const hasAnyWriteOrApprove = Object.entries(bulkPermissions).some(([k, v]) => k !== 'can_read' && v);
        const resolvedPermissions = {
            ...bulkPermissions,
            can_read: bulkPermissions.can_read || hasAnyWriteOrApprove,
        };

        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                if (selectedModuleIds.includes(access.module_id)) {
                    return {
                        ...access,
                        ...resolvedPermissions,
                    };
                }
                return access;
            }),
        );
        setIsBulkGranularModalOpen(false);
        showToast(`Izin granular diterapkan ke ${selectedModuleIds.length} modul terpilih`, 'success');
    };

    const updateAccess = (moduleId: string, permission: Permission, checked: boolean) => {
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                if (access.module_id === moduleId) {
                    const newAccess = { ...access, [permission]: checked };
                    if (checked && permission !== 'can_read') newAccess.can_read = true;
                    if (permission === 'can_read' && !checked) {
                        PERMISSIONS.forEach((p) => {
                            (newAccess as any)[p] = false;
                        });
                    }
                    return newAccess;
                }
                return access;
            }),
        );
    };

    const applyPresetToModule = (moduleId: string, preset: PresetLevel) => {
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                if (access.module_id === moduleId) {
                    if (preset === 'full') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: true,
                            can_update: true,
                            can_delete: true,
                            can_approve: true,
                            can_bulk_approve: true,
                            can_bulk_delete: true,
                        };
                    } else if (preset === 'editor') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: true,
                            can_update: true,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    } else if (preset === 'read') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: false,
                            can_update: false,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    } else if (preset === 'none') {
                        return {
                            ...access,
                            can_read: false,
                            can_create: false,
                            can_update: false,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    }
                }
                return access;
            }),
        );
    };

    const applyPresetToGroup = (groupId: string, preset: PresetLevel) => {
        const groupModuleIds = modules.filter((m) => (m.module_group_id || 'ungrouped') === groupId).map((m) => m.id);
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                if (groupModuleIds.includes(access.module_id)) {
                    if (preset === 'full') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: true,
                            can_update: true,
                            can_delete: true,
                            can_approve: true,
                            can_bulk_approve: true,
                            can_bulk_delete: true,
                        };
                    } else if (preset === 'editor') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: true,
                            can_update: true,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    } else if (preset === 'read') {
                        return {
                            ...access,
                            can_read: true,
                            can_create: false,
                            can_update: false,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    } else if (preset === 'none') {
                        return {
                            ...access,
                            can_read: false,
                            can_create: false,
                            can_update: false,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    }
                }
                return access;
            }),
        );
    };

    const applyRoleTemplate = (templateType: 'default' | 'staff' | 'admin' | 'legal') => {
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                const targetModule = modules.find((m) => m.id === access.module_id);
                const moduleGroup = targetModule?.module_group?.name?.toLowerCase() || '';
                const moduleName = targetModule?.name?.toLowerCase() || '';
                const moduleIdentifier = targetModule?.identifier?.toLowerCase() || '';
                const moduleRoute = targetModule?.route?.toLowerCase() || '';

                if (templateType === 'admin') {
                    // Admin: Full Access to all modules
                    return {
                        ...access,
                        can_read: true,
                        can_create: true,
                        can_update: true,
                        can_delete: true,
                        can_approve: true,
                        can_bulk_approve: true,
                        can_bulk_delete: true,
                    };
                }

                if (templateType === 'default') {
                    // Default / Viewer: View only on all modules
                    return {
                        ...access,
                        can_read: true,
                        can_create: false,
                        can_update: false,
                        can_delete: false,
                        can_approve: false,
                        can_bulk_approve: false,
                        can_bulk_delete: false,
                    };
                }

                if (templateType === 'staff') {
                    // Staff: CRUD on regular operational modules, Read-only on Master Data / Settings, No admin/delete/bulk permissions
                    const isMasterOrSetting =
                        moduleGroup.includes('master') ||
                        moduleGroup.includes('pengaturan') ||
                        moduleGroup.includes('setting') ||
                        moduleGroup.includes('admin') ||
                        moduleName.includes('role') ||
                        moduleName.includes('user') ||
                        moduleName.includes('pengguna') ||
                        moduleIdentifier.includes('role') ||
                        moduleIdentifier.includes('user');

                    if (isMasterOrSetting) {
                        return {
                            ...access,
                            can_read: true,
                            can_create: false,
                            can_update: false,
                            can_delete: false,
                            can_approve: false,
                            can_bulk_approve: false,
                            can_bulk_delete: false,
                        };
                    }

                    // Operational modules: Create, Read, Update (no delete, no bulk approve/delete)
                    return {
                        ...access,
                        can_read: true,
                        can_create: true,
                        can_update: true,
                        can_delete: false,
                        can_approve: false,
                        can_bulk_approve: false,
                        can_bulk_delete: false,
                    };
                }

                if (templateType === 'legal') {
                    // Legal: Full CRUD & Approval on Contract, Legal, Document modules; Read-only on Master Data
                    const isLegalOrContract =
                        moduleGroup.includes('kontrak') ||
                        moduleGroup.includes('contract') ||
                        moduleGroup.includes('legal') ||
                        moduleGroup.includes('dokumen') ||
                        moduleGroup.includes('document') ||
                        moduleGroup.includes('perjanjian') ||
                        moduleGroup.includes('agreement') ||
                        moduleName.includes('kontrak') ||
                        moduleName.includes('contract') ||
                        moduleName.includes('legal') ||
                        moduleName.includes('perjanjian') ||
                        moduleName.includes('dokumen') ||
                        moduleIdentifier.includes('contract') ||
                        moduleIdentifier.includes('legal') ||
                        moduleRoute.includes('contract') ||
                        moduleRoute.includes('legal');

                    if (isLegalOrContract) {
                        return {
                            ...access,
                            can_read: true,
                            can_create: true,
                            can_update: true,
                            can_delete: false,
                            can_approve: true,
                            can_bulk_approve: true,
                            can_bulk_delete: false,
                        };
                    }

                    // Other modules: Read only
                    return {
                        ...access,
                        can_read: true,
                        can_create: false,
                        can_update: false,
                        can_delete: false,
                        can_approve: false,
                        can_bulk_approve: false,
                        can_bulk_delete: false,
                    };
                }

                return access;
            }),
        );

        const templateNames: Record<string, string> = {
            default: 'Default (Lihat Saja)',
            staff: 'Template Staff (Operasional CRUD)',
            admin: 'Template Admin (Akses Penuh)',
            legal: 'Template Legal (Kontrak & Approval)',
        };
        showToast(`Template "${templateNames[templateType]}" berhasil diterapkan`, 'success');
    };

    const applyNavTemplate = (templateType: 'default' | 'staff' | 'admin' | 'legal') => {
        if (templateType === 'admin') {
            // Admin: Group all available modules by their default module_group and mount all of them
            const groupsMap: Record<string, { id: string; name: string; icon?: string | null; modules: Module[] }> = {};
            
            // First preserve existing groups if any
            navItems.forEach((g) => {
                groupsMap[g.id] = { id: g.id, name: g.name, icon: g.icon, modules: [] };
            });

            // Group all modules
            allModules.forEach((m) => {
                const gid = m.module_group_id || 'general-group';
                const gname = m.module_group?.name || 'Menu Utama';
                if (!groupsMap[gid]) {
                    groupsMap[gid] = {
                        id: gid,
                        name: gname,
                        icon: 'Folder',
                        modules: [],
                    };
                }
                groupsMap[gid].modules.push(m);
            });

            const newNavItems: Group[] = Object.values(groupsMap).map((g, idx) => ({
                id: g.id,
                name: g.name,
                icon: g.icon || 'Folder',
                sequence: idx + 1,
                modules: g.modules.map((m, mIdx) => ({ ...m, sequence: mIdx + 1 })),
            }));

            setNavItems(newNavItems);
            setAvailableModules([]);
            if (newNavItems.length > 0) {
                setSelectedGroupId(newNavItems[0].id);
            }
            showToast('Template Navigasi "Admin (Semua Modul Terpasang)" diterapkan', 'success');
            return;
        }

        if (templateType === 'staff') {
            // Staff: Install operational & dashboard modules, omit master/admin setting modules or keep them in available repository
            const staffModules: Module[] = [];
            const remainingModules: Module[] = [];

            allModules.forEach((m) => {
                const groupName = m.module_group?.name?.toLowerCase() || '';
                const name = m.name?.toLowerCase() || '';
                const isMasterSetting =
                    groupName.includes('master') ||
                    groupName.includes('pengaturan') ||
                    groupName.includes('setting') ||
                    groupName.includes('admin') ||
                    name.includes('role') ||
                    name.includes('user') ||
                    name.includes('pengguna');

                if (!isMasterSetting) {
                    staffModules.push(m);
                } else {
                    remainingModules.push(m);
                }
            });

            // Group staff modules
            const groupsMap: Record<string, { id: string; name: string; icon?: string | null; modules: Module[] }> = {};
            staffModules.forEach((m) => {
                const gid = m.module_group_id || 'staff-ops';
                const gname = m.module_group?.name || 'Operasional';
                if (!groupsMap[gid]) {
                    groupsMap[gid] = {
                        id: gid,
                        name: gname,
                        icon: 'Folder',
                        modules: [],
                    };
                }
                groupsMap[gid].modules.push(m);
            });

            const newNavItems: Group[] = Object.values(groupsMap).map((g, idx) => ({
                id: g.id,
                name: g.name,
                icon: g.icon || 'Folder',
                sequence: idx + 1,
                modules: g.modules.map((m, mIdx) => ({ ...m, sequence: mIdx + 1 })),
            }));

            setNavItems(newNavItems);
            setAvailableModules(remainingModules);
            if (newNavItems.length > 0) {
                setSelectedGroupId(newNavItems[0].id);
            }
            showToast('Template Navigasi "Staff (Menu Operasional)" diterapkan', 'success');
            return;
        }

        if (templateType === 'legal') {
            // Legal: Install Contract, Document, Legal & Dashboard modules
            const legalModules: Module[] = [];
            const remainingModules: Module[] = [];

            allModules.forEach((m) => {
                const groupName = m.module_group?.name?.toLowerCase() || '';
                const name = m.name?.toLowerCase() || '';
                const identifier = m.identifier?.toLowerCase() || '';
                const route = m.route?.toLowerCase() || '';

                const isLegalContract =
                    groupName.includes('kontrak') ||
                    groupName.includes('contract') ||
                    groupName.includes('legal') ||
                    groupName.includes('dokumen') ||
                    groupName.includes('document') ||
                    groupName.includes('perjanjian') ||
                    name.includes('kontrak') ||
                    name.includes('contract') ||
                    name.includes('legal') ||
                    name.includes('dashboard') ||
                    name.includes('beranda') ||
                    identifier.includes('contract') ||
                    identifier.includes('legal') ||
                    route.includes('contract') ||
                    route.includes('legal') ||
                    route.includes('dashboard');

                if (isLegalContract) {
                    legalModules.push(m);
                } else {
                    remainingModules.push(m);
                }
            });

            const groupsMap: Record<string, { id: string; name: string; icon?: string | null; modules: Module[] }> = {};
            legalModules.forEach((m) => {
                const gid = m.module_group_id || 'legal-group';
                const gname = m.module_group?.name || 'Manajemen Kontrak & Legal';
                if (!groupsMap[gid]) {
                    groupsMap[gid] = {
                        id: gid,
                        name: gname,
                        icon: 'Folder',
                        modules: [],
                    };
                }
                groupsMap[gid].modules.push(m);
            });

            const newNavItems: Group[] = Object.values(groupsMap).map((g, idx) => ({
                id: g.id,
                name: g.name,
                icon: g.icon || 'Folder',
                sequence: idx + 1,
                modules: g.modules.map((m, mIdx) => ({ ...m, sequence: mIdx + 1 })),
            }));

            setNavItems(newNavItems);
            setAvailableModules(remainingModules);
            if (newNavItems.length > 0) {
                setSelectedGroupId(newNavItems[0].id);
            }
            showToast('Template Navigasi "Default Legal (Menu Kontrak & Legal)" diterapkan', 'success');
            return;
        }

        if (templateType === 'default') {
            // Default: Reset to standard props navigation or basic groups
            setNavItems(navigation);
            const activeModuleIds = new Set(navigation.flatMap((g) => g.modules.map((m) => m.id)));
            setAvailableModules(allModules.filter((m) => !activeModuleIds.has(m.id)));
            if (navigation.length > 0) {
                setSelectedGroupId(navigation[0].id);
            }
            showToast('Template Navigasi "Default (Standar Role)" diterapkan', 'success');
        }
    };

    const applyPresetToAll = (preset: PresetLevel) => {
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                if (preset === 'full') {
                    return {
                        ...access,
                        can_read: true,
                        can_create: true,
                        can_update: true,
                        can_delete: true,
                        can_approve: true,
                        can_bulk_approve: true,
                        can_bulk_delete: true,
                    };
                } else if (preset === 'editor') {
                    return {
                        ...access,
                        can_read: true,
                        can_create: true,
                        can_update: true,
                        can_delete: false,
                        can_approve: false,
                        can_bulk_approve: false,
                        can_bulk_delete: false,
                    };
                } else if (preset === 'read') {
                    return {
                        ...access,
                        can_read: true,
                        can_create: false,
                        can_update: false,
                        can_delete: false,
                        can_approve: false,
                        can_bulk_approve: false,
                        can_bulk_delete: false,
                    };
                } else if (preset === 'none') {
                    return {
                        ...access,
                        can_read: false,
                        can_create: false,
                        can_update: false,
                        can_delete: false,
                        can_approve: false,
                        can_bulk_approve: false,
                        can_bulk_delete: false,
                    };
                }
                return access;
            }),
        );
    };

    const groupedModules = useMemo(() => {
        const groups: Record<string, { name: string; modules: Module[] }> = {};
        modules.forEach((m) => {
            const gid = m.module_group_id || 'ungrouped';
            if (!groups[gid]) groups[gid] = { name: m.module_group?.name || 'Lainnya', modules: [] };
            groups[gid].modules.push(m);
        });
        return groups;
    }, [modules]);

    const filteredGroupedModules = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const result: Record<string, { name: string; modules: Module[] }> = {};

        Object.entries(groupedModules).forEach(([gid, group]) => {
            const matchingModules = group.modules.filter((m) => {
                const matchesQuery =
                    !query ||
                    m.name.toLowerCase().includes(query) ||
                    (m.identifier && m.identifier.toLowerCase().includes(query)) ||
                    (m.route && m.route.toLowerCase().includes(query));

                if (!matchesQuery) return false;

                const access = accessForm.data.accesses.find((a) => a.module_id === m.id);
                const hasAnyAccess = access && PERMISSIONS.some((p) => access[p]);

                if (statusFilter === 'active') return hasAnyAccess;
                if (statusFilter === 'inactive') return !hasAnyAccess;

                return true;
            });

            if (matchingModules.length > 0) {
                result[gid] = {
                    name: group.name,
                    modules: matchingModules,
                };
            }
        });

        return result;
    }, [groupedModules, searchQuery, statusFilter, accessForm.data.accesses]);

    const totalActiveModules = useMemo(() => {
        return accessForm.data.accesses.filter((a) => PERMISSIONS.some((p) => (a as any)[p])).length;
    }, [accessForm.data.accesses]);

    // --- Drag & Drop Core Logic ---
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [activeType, setActiveType] = useState<'group' | 'module' | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const findContainer = (id: UniqueIdentifier) => {
        if (id === 'available-list') return 'available-list';
        if (availableModules.find((m) => m.id === id)) return 'available-list';
        if (navItems.find((g) => g.id === id)) return id;
        return navItems.find((g) => g.modules.find((m) => m.id === id))?.id;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveType(active.data.current?.type === 'group' ? 'group' : 'module');
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || activeType === 'group') return;

        const activeContainer = findContainer(active.id);
        const overContainer = over.id === 'available-list' ? 'available-list' : findContainer(over.id);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        const activeItems = activeContainer === 'available-list' ? availableModules : navItems.find((g) => g.id === activeContainer)?.modules || [];
        const movedItem = activeItems.find((m) => m.id === active.id);
        if (!movedItem) return;

        if (activeContainer === 'available-list') {
            setAvailableModules((prevAvail) => prevAvail.filter((m) => m.id !== active.id));
        }

        if (overContainer === 'available-list') {
            setAvailableModules((prevAvail) => {
                // Prevent duplicate addition
                if (prevAvail.find(m => m.id === active.id)) return prevAvail;
                return [...prevAvail, movedItem];
            });
        }

        setNavItems((prev) => {
            return prev.map((g) => {
                if (g.id === activeContainer) {
                    return { ...g, modules: g.modules.filter((m) => m.id !== active.id) };
                }
                if (g.id === overContainer) {
                    // Prevent duplicate addition
                    if (g.modules.find(m => m.id === active.id)) return g;
                    const newModules = [...g.modules];
                    const overIndex = over.id === overContainer ? newModules.length : g.modules.findIndex((m) => m.id === over.id);
                    newModules.splice(overIndex === -1 ? newModules.length : overIndex, 0, movedItem);
                    return { ...g, modules: newModules };
                }
                return g;
            });
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (activeType === 'group' && over) {
            if (active.id !== over.id) {
                setNavItems((items) => {
                    const oldIndex = items.findIndex((i) => i.id === active.id);
                    const newIndex = items.findIndex((i) => i.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
            }
        } else if (over) {
            const activeContainer = findContainer(active.id);
            const overContainer = over.id === 'available-list' ? 'available-list' : findContainer(over.id);

            if (activeContainer && overContainer && activeContainer === overContainer) {
                if (activeContainer === 'available-list') {
                    const oldIndex = availableModules.findIndex((m) => m.id === active.id);
                    const newIndex = availableModules.findIndex((m) => m.id === over.id);
                    setAvailableModules(arrayMove(availableModules, oldIndex, newIndex));
                } else {
                    setNavItems((prev) =>
                        prev.map((g) => {
                            if (g.id === activeContainer) {
                                const oldIndex = g.modules.findIndex((m) => m.id === active.id);
                                const newIndex = g.modules.findIndex((m) => m.id === over.id);
                                return { ...g, modules: arrayMove(g.modules, oldIndex, newIndex) };
                            }
                            return g;
                        }),
                    );
                }
            }
        }

        setActiveId(null);
        setActiveType(null);
    };

    const handleRemoveModule = (moduleId: string) => {
        const group = navItems.find((g) => g.modules.find((m) => m.id === moduleId));
        if (!group) return;

        const module = group.modules.find((m) => m.id === moduleId)!;
        setNavItems((prev) => prev.map((g) => (g.id === group.id ? { ...g, modules: g.modules.filter((m) => m.id !== moduleId) } : g)));
        setAvailableModules((prev) => [...prev, module]);
    };

    const handleMoveModuleToGroup = (moduleId: string, targetGroupId: string) => {
        const sourceGroup = navItems.find((g) => g.modules.find((m) => m.id === moduleId));
        if (!sourceGroup || sourceGroup.id === targetGroupId) return;

        const module = sourceGroup.modules.find((m) => m.id === moduleId)!;
        setNavItems((prev) =>
            prev.map((g) => {
                if (g.id === sourceGroup.id) {
                    return { ...g, modules: g.modules.filter((m) => m.id !== moduleId) };
                }
                if (g.id === targetGroupId) {
                    return { ...g, modules: [...g.modules, module] };
                }
                return g;
            }),
        );
    };

    const handleQuickAdd = (module: Module) => {
        if (navItems.length === 0) {
            showToast('Buat grup navigasi terlebih dahulu', 'danger');
            return;
        }
        const firstGroupId = navItems[0].id;
        setNavItems((prev) => prev.map((g) => (g.id === firstGroupId ? { ...g, modules: [...g.modules, module] } : g)));
        setAvailableModules((prev) => prev.filter((m) => m.id !== module.id));
    };

    const handleMoveGroup = (groupIdx: number, direction: 'up' | 'down') => {
        const targetIdx = direction === 'up' ? groupIdx - 1 : groupIdx + 1;
        if (targetIdx < 0 || targetIdx >= navItems.length) return;
        setNavItems((prev) => arrayMove(prev, groupIdx, targetIdx));
    };

    const handleMoveGroupTo = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= navItems.length || toIdx === fromIdx) return;
        setNavItems((prev) => arrayMove(prev, fromIdx, toIdx));
    };

    const handleMoveModuleIndex = (groupId: string, moduleIdx: number, direction: 'up' | 'down') => {
        const targetIdx = direction === 'up' ? moduleIdx - 1 : moduleIdx + 1;
        setNavItems((prev) =>
            prev.map((g) => {
                if (g.id === groupId) {
                    if (targetIdx < 0 || targetIdx >= g.modules.length) return g;
                    return {
                        ...g,
                        modules: arrayMove(g.modules, moduleIdx, targetIdx),
                    };
                }
                return g;
            }),
        );
    };

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    const activeModule = activeId ? allModules.find((m) => m.id === activeId) : null;
    const activeGroup = activeId ? navItems.find((g) => g.id === activeId) : null;

    return (
        <>
            <Head title={activeTab === 'access' ? 'Pemetaan Hak Akses' : 'Pemetaan Navigasi'} />

            <MasterPageLayout>
                <FloatingPanel className="flex-1 min-w-0 flex flex-col">
                    {/* Master Data Page Header Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-surface-border bg-surface-card shrink-0">
                        <div className="flex items-center gap-3.5">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="p-2 rounded-xl bg-surface-muted hover:bg-surface-border text-text-main transition-colors cursor-pointer shadow-xs border border-surface-border"
                                title="Kembali"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    {activeTab === 'access' ? <Key size={20} /> : <LayoutGrid size={20} />}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-base font-bold text-text-main">
                                            {activeTab === 'access' ? 'Pemetaan Hak Akses' : 'Pemetaan Navigasi'}
                                        </h1>
                                        <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                                            Role: {role.name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-desc font-normal">
                                        {activeTab === 'access'
                                            ? 'Konfigurasi matriks perizinan CRUD, persetujuan, dan visibilitas modul'
                                            : 'Atur hierarki grup menu dan urutan modul navigasi aplikasi'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Role Switcher Selector */}
                            <Select
                                value={role.id}
                                onValueChange={(value) => {
                                    if (value !== role.id) {
                                        const basePath = activeTab === 'access' ? '/admin/access-mapping' : '/admin/navigation-mapping';
                                        router.get(`${basePath}/${value}`);
                                    }
                                }}
                            >
                                <SelectTrigger className="bg-surface-muted hover:bg-surface-border/80 border-surface-border h-9 w-[180px] rounded-lg px-2.5 text-xs font-semibold text-text-main">
                                    <div className="flex items-center gap-1.5 truncate text-text-main">
                                        <ShieldAlert className="text-primary h-3.5 w-3.5 shrink-0" />
                                        <SelectValue placeholder="Pilih Role" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="w-[180px] rounded-lg p-1 shadow-md border-surface-border">
                                    {roles.map((r) => (
                                        <SelectItem
                                            key={r.id}
                                            value={r.id}
                                            className="cursor-pointer rounded-md pl-2 pr-2 py-1.5 text-xs font-medium"
                                        >
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Mapping Type Switcher */}
                            {!isIndependent && (
                                <div className="bg-surface-muted flex rounded-lg p-0.5 border border-surface-border">
                                    <button
                                        onClick={() => setActiveTab('access')}
                                        type="button"
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                                            activeTab === 'access'
                                                ? 'bg-surface-base text-primary shadow-xs border border-surface-border'
                                                : 'text-text-desc hover:text-text-main hover:bg-surface-card/60',
                                        )}
                                    >
                                        <Key size={13} /> <span>Hak Akses</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('navigation')}
                                        type="button"
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                                            activeTab === 'navigation'
                                                ? 'bg-surface-base text-primary shadow-xs border border-surface-border'
                                                : 'text-text-desc hover:text-text-main hover:bg-surface-card/60',
                                        )}
                                    >
                                        <LayoutGrid size={13} /> <span>Navigasi</span>
                                    </button>
                                </div>
                            )}

                            {/* Access Quick Presets & Role Templates Dropdown */}
                            {activeTab === 'access' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-surface-border bg-surface-muted/60 hover:bg-surface-border/80"
                                        >
                                            <Sparkles size={13} className="text-primary" />
                                            <span>Setting Cepat</span>
                                            <ChevronDown size={12} className="text-text-desc" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 p-1.5 bg-white dark:bg-zinc-900 border border-surface-border shadow-2xl rounded-xl z-50">
                                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-text-desc px-2 py-1 flex items-center gap-1.5">
                                            <Sparkles size={11} className="text-primary" />
                                            <span>Template Hak Akses Role</span>
                                        </DropdownMenuLabel>
                                        
                                        <DropdownMenuItem
                                            onClick={() => applyRoleTemplate('default')}
                                            className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-2 px-2 hover:bg-sky-500/10 hover:text-sky-600"
                                        >
                                            <Eye size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">Default (Lihat Saja)</span>
                                                <span className="text-[10px] text-text-desc font-normal">Akses baca/view saja untuk semua modul</span>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => applyRoleTemplate('staff')}
                                            className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-2 px-2 hover:bg-blue-500/10 hover:text-blue-600"
                                        >
                                            <Briefcase size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">Staff (Operasional)</span>
                                                <span className="text-[10px] text-text-desc font-normal">CRUD data operasional, read-only master data</span>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => applyRoleTemplate('admin')}
                                            className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-2 px-2 hover:bg-emerald-500/10 hover:text-emerald-600"
                                        >
                                            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">Admin (All Access)</span>
                                                <span className="text-[10px] text-text-desc font-normal">Akses penuh CRUD, Approval & Bulk Action</span>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => applyRoleTemplate('legal')}
                                            className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-2 px-2 hover:bg-indigo-500/10 hover:text-indigo-600"
                                        >
                                            <Scale size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">Default Legal</span>
                                                <span className="text-[10px] text-text-desc font-normal">CRUD & Approval Kontrak/Legal, read master</span>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator className="my-1.5 bg-surface-border" />

                                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-text-desc px-2 py-1 flex items-center gap-1.5">
                                            <SlidersHorizontal size={11} className="text-text-desc" />
                                            <span>Aksi Massal Seluruh Modul</span>
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => applyPresetToAll('full')}
                                            className="cursor-pointer rounded-lg text-xs font-medium flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                                        >
                                            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>Set Semua Akses Penuh</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => applyPresetToAll('editor')}
                                            className="cursor-pointer rounded-lg text-xs font-medium flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Edit2 size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                            <span>Set Semua Editor (CRUD)</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => applyPresetToAll('read')}
                                            className="cursor-pointer rounded-lg text-xs font-medium flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Eye size={13} className="text-sky-600 dark:text-sky-400 shrink-0" />
                                            <span>Set Semua Lihat Saja</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => applyPresetToAll('none')}
                                            className="cursor-pointer rounded-lg text-xs font-medium flex items-center gap-2 py-1.5 px-2 hover:bg-rose-500/10 hover:text-rose-600"
                                        >
                                            <ShieldOff size={13} className="text-rose-500 shrink-0" />
                                            <span>Kosongkan Semua Izin</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Navigation Quick Presets & Templates Dropdown */}
                            {activeTab === 'navigation' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-surface-border bg-surface-muted/60 hover:bg-surface-border/80"
                                        >
                                            <Sparkles size={13} className="text-primary" />
                                            <span>Setting Cepat</span>
                                            <ChevronDown size={12} className="text-text-desc" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 p-1.5 bg-white dark:bg-zinc-900 border border-surface-border shadow-2xl rounded-xl z-50">
                                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-text-desc px-2 py-1 flex items-center gap-1.5">
                                            <Sparkles size={11} className="text-primary" />
                                            <span>Template Navigasi Sidebar</span>
                                        </DropdownMenuLabel>
                                        
                                        <DropdownMenuItem
                                            onClick={() => applyNavTemplate('default')}
                                            className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-2 px-2 hover:bg-sky-500/10 hover:text-sky-600"
                                        >
                                            <Eye size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">Default (Standar Role)</span>
                                                <span className="text-[10px] text-text-desc font-normal">Pulihkan susunan default modul role</span>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => applyNavTemplate('staff')}
                                            className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-2 px-2 hover:bg-blue-500/10 hover:text-blue-600"
                                        >
                                            <Briefcase size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">Staff (Menu Operasional)</span>
                                                <span className="text-[10px] text-text-desc font-normal">Pasang modul operasional harian</span>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => applyNavTemplate('admin')}
                                            className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-2 px-2 hover:bg-emerald-500/10 hover:text-emerald-600"
                                        >
                                            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">Admin (Semua Modul Terpasang)</span>
                                                <span className="text-[10px] text-text-desc font-normal">Pasang seluruh modul ke semua grup</span>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => applyNavTemplate('legal')}
                                            className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-2 px-2 hover:bg-indigo-500/10 hover:text-indigo-600"
                                        >
                                            <Scale size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">Default Legal</span>
                                                <span className="text-[10px] text-text-desc font-normal">Pasang modul Kontrak, Legal & Dokumen</span>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <Button
                                variant="primary"
                                onClick={activeTab === 'access' ? handleAccessSubmit : handleNavSave}
                                disabled={accessForm.processing || isSavingNav}
                                className="h-9 rounded-lg px-4 text-xs font-bold shadow-xs cursor-pointer"
                            >
                                {accessForm.processing || isSavingNav ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <Save size={14} />
                                        <span>Simpan Perubahan</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Table Area for Access Mapping */}
                    {activeTab === 'access' ? (
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            {/* Access Subheader Filter & Search Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-surface-muted/30 border-b border-surface-border shrink-0">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Select All Checkbox */}
                                    {(() => {
                                        const allVisibleModuleIds = Object.values(filteredGroupedModules).flatMap((g) => g.modules.map((m) => m.id));
                                        const isAllVisibleSelected = allVisibleModuleIds.length > 0 && allVisibleModuleIds.every((id) => selectedModuleIds.includes(id));
                                        const isSomeVisibleSelected = selectedModuleIds.length > 0 && !isAllVisibleSelected;

                                        return (
                                            <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-surface-border">
                                                <Checkbox
                                                    checked={isAllVisibleSelected ? true : isSomeVisibleSelected ? 'indeterminate' : false}
                                                    onCheckedChange={() => {
                                                        if (isAllVisibleSelected) {
                                                            setSelectedModuleIds([]);
                                                        } else {
                                                            setSelectedModuleIds(allVisibleModuleIds);
                                                        }
                                                    }}
                                                    className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 rounded-md cursor-pointer"
                                                    id="select-all-visible"
                                                    title="Pilih seluruh modul yang tampil"
                                                />
                                                <label htmlFor="select-all-visible" className="text-xs font-bold text-text-main cursor-pointer select-none whitespace-nowrap">
                                                    Pilih Semua {selectedModuleIds.length > 0 ? `(${selectedModuleIds.length})` : ''}
                                                </label>
                                            </div>
                                        );
                                    })()}

                                    <div className="relative flex-1 max-w-sm">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-desc" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Cari modul atau URL..."
                                            className="w-full h-8 pl-8 pr-7 text-xs bg-surface-card border border-surface-border rounded-lg placeholder:text-text-desc/60 focus:outline-none focus:ring-1 focus:ring-primary text-text-main"
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-desc hover:text-text-main p-0.5 rounded cursor-pointer"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="bg-surface-muted flex rounded-lg p-0.5 border border-surface-border">
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter('all')}
                                            className={cn(
                                                'px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer',
                                                statusFilter === 'all'
                                                    ? 'bg-surface-card text-primary shadow-2xs border border-surface-border'
                                                    : 'text-text-desc hover:text-text-main',
                                            )}
                                        >
                                            Semua ({modules.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter('active')}
                                            className={cn(
                                                'px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer',
                                                statusFilter === 'active'
                                                    ? 'bg-surface-card text-emerald-600 dark:text-emerald-400 shadow-2xs border border-surface-border'
                                                    : 'text-text-desc hover:text-text-main',
                                            )}
                                        >
                                            Aktif ({totalActiveModules})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter('inactive')}
                                            className={cn(
                                                'px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer',
                                                statusFilter === 'inactive'
                                                    ? 'bg-surface-card text-rose-600 dark:text-rose-400 shadow-2xs border border-surface-border'
                                                    : 'text-text-desc hover:text-text-main',
                                            )}
                                        >
                                            Nonaktif ({modules.length - totalActiveModules})
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Grouped Modules List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                                {Object.keys(filteredGroupedModules).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-surface-border rounded-xl bg-surface-card/40">
                                        <ShieldOff size={36} className="text-text-desc/40 mb-2" />
                                        <h3 className="text-sm font-bold text-text-main">Tidak Ada Modul Ditemukan</h3>
                                        <p className="text-xs text-text-desc mt-1 max-w-sm">
                                            {searchQuery
                                                ? `Tidak ditemukan modul yang cocok dengan kata kunci "${searchQuery}".`
                                                : 'Tidak ada modul dengan filter yang dipilih.'}
                                        </p>
                                    </div>
                                ) : (
                                    Object.entries(filteredGroupedModules).map(([groupId, group]) => {
                                        const groupModuleIds = group.modules.map((m) => m.id);
                                        const activeInGroupCount = accessForm.data.accesses.filter(
                                            (a) => groupModuleIds.includes(a.module_id) && PERMISSIONS.some((p) => (a as any)[p]),
                                        ).length;
                                        const isGroupAllSelected = group.modules.length > 0 && group.modules.every((m) => selectedModuleIds.includes(m.id));
                                        const isGroupSomeSelected = group.modules.some((m) => selectedModuleIds.includes(m.id)) && !isGroupAllSelected;

                                        return (
                                            <div
                                                key={groupId}
                                                className="border border-surface-border/80 rounded-xl overflow-hidden bg-surface-card shadow-2xs"
                                            >
                                                {/* Group Card Header */}
                                                <div className="flex items-center justify-between px-4 py-2.5 bg-surface-muted/60 border-b border-surface-border">
                                                    <div className="flex items-center gap-2.5">
                                                        <Checkbox
                                                            checked={isGroupAllSelected ? true : isGroupSomeSelected ? 'indeterminate' : false}
                                                            onCheckedChange={() => toggleSelectGroup(groupId)}
                                                            className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 rounded-md cursor-pointer shrink-0 mr-0.5"
                                                            title="Pilih seluruh modul di grup ini"
                                                        />
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                                                            <LayoutGrid size={13} />
                                                        </div>
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
                                                            {group.name}
                                                        </h3>
                                                        <span className="text-[10px] font-bold text-text-desc bg-surface-card border border-surface-border px-2 py-0.5 rounded-full">
                                                            {activeInGroupCount} / {group.modules.length} Aktif
                                                        </span>
                                                    </div>

                                                    {/* Group Level Quick Dropdown */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                                                            >
                                                                <span>Atur Izin Grup</span>
                                                                <ChevronDown size={12} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-56 p-1.5 bg-white dark:bg-zinc-900 border border-surface-border shadow-2xl rounded-xl z-50"
                                                        >
                                                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-text-desc px-2 py-1">
                                                                Terapkan ke Semua di Grup
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onClick={() => applyPresetToGroup(groupId, 'full')}
                                                                className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                <span>Semua Akses Penuh</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => applyPresetToGroup(groupId, 'editor')}
                                                                className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Edit2 size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                                                <span>Semua Editor (CRUD)</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => applyPresetToGroup(groupId, 'read')}
                                                                className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-1.5 px-2 hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Eye size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
                                                                <span>Semua Lihat Saja</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-1 bg-surface-border" />
                                                            <DropdownMenuItem
                                                                onClick={() => applyPresetToGroup(groupId, 'none')}
                                                                className="cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-2 py-1.5 px-2 hover:bg-rose-500/10 hover:text-rose-600"
                                                            >
                                                                <ShieldOff size={14} className="text-rose-500 shrink-0" />
                                                                <span>Nonaktifkan Izin Grup</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Group Modules Rows */}
                                                <div className="divide-y divide-surface-border/60">
                                                    {group.modules.map((module) => (
                                                        <ModernModuleRow
                                                            key={module.id}
                                                            module={module}
                                                            access={accessForm.data.accesses.find((a) => a.module_id === module.id)}
                                                            isSelected={selectedModuleIds.includes(module.id)}
                                                            onSelect={toggleSelectModule}
                                                            onToggle={updateAccess}
                                                            onSetPreset={applyPresetToModule}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Floating Bulk Action Bar */}
                            {selectedModuleIds.length > 0 && (
                                <div className="p-3 bg-surface-card border-t border-surface-border shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                                            {selectedModuleIds.length}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-text-main">
                                                {selectedModuleIds.length} Modul Terpilih
                                            </span>
                                            <span className="text-[10px] text-text-desc">
                                                Terapkan aksi atau preset ke seluruh modul yang dipilih
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyPresetToSelected('full')}
                                            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                        >
                                            <ShieldCheck size={13} />
                                            <span>Akses Penuh</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyPresetToSelected('editor')}
                                            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                                        >
                                            <Edit2 size={13} />
                                            <span>Editor</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyPresetToSelected('read')}
                                            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                                        >
                                            <Eye size={13} />
                                            <span>Lihat Saja</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyPresetToSelected('none')}
                                            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                        >
                                            <ShieldOff size={13} />
                                            <span>Kosongkan</span>
                                        </Button>

                                        <div className="h-4 w-px bg-surface-border mx-1" />

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsBulkGranularModalOpen(true)}
                                            className="h-8 px-3 text-xs font-semibold rounded-lg border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                                        >
                                            <SlidersHorizontal size={13} />
                                            <span>Kelola Izin Granular</span>
                                        </Button>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedModuleIds([])}
                                            className="p-1.5 rounded-lg text-text-desc hover:text-text-main hover:bg-surface-muted transition-colors cursor-pointer ml-1"
                                            title="Batalkan Pilihan"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                <div className="p-4 flex-1 flex flex-col">
                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 flex-1">
                        {/* COLUMN 1: Module Groups (col-span-4) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between border-b border-surface-border pb-2 min-h-[36px]">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-muted text-text-desc border border-surface-border">
                                        <LayoutGrid size={13} />
                                    </div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">Grup Menu</h3>
                                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                                        {navItems.length} Grup
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openGroupModal()}
                                    className="text-primary hover:bg-primary/10 border border-primary/30 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                    title="Tambah Grup Menu Baru"
                                >
                                    <Plus size={12} />
                                    <span>Buat Grup</span>
                                </button>
                            </div>

                            {/* Group Search Input */}
                            <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-desc" />
                                <input
                                    type="text"
                                    value={navGroupSearch}
                                    onChange={(e) => setNavGroupSearch(e.target.value)}
                                    placeholder="Cari grup menu..."
                                    className="w-full h-8 pl-7 pr-7 text-xs bg-surface-card border border-surface-border rounded-lg placeholder:text-text-desc/60 focus:outline-none focus:ring-1 focus:ring-primary text-text-main"
                                />
                                {navGroupSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setNavGroupSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-desc hover:text-text-main p-0.5 cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Group List Container */}
                            <div className="h-[calc(100vh-320px)] min-h-[350px] overflow-y-auto scrollbar-hide space-y-1.5 p-2 border border-surface-border/80 rounded-xl bg-slate-50/40 dark:bg-zinc-900/30 flex flex-col">
                                {(() => {
                                    const filteredGroups = navGroupSearch.trim()
                                        ? navItems.filter((g) => g.name.toLowerCase().includes(navGroupSearch.toLowerCase()))
                                        : navItems;

                                    return (
                                        <>
                                            <SortableContext id="groups-context" items={filteredGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                                                {filteredGroups.map((group, index) => (
                                                    <SortableNavGroupRow
                                                        key={group.id}
                                                        group={group}
                                                        index={index}
                                                        total={filteredGroups.length}
                                                        isSelected={selectedGroupId === group.id}
                                                        onSelect={() => setSelectedGroupId(group.id)}
                                                        onMoveUp={() => handleMoveGroup(index, 'up')}
                                                        onMoveDown={() => handleMoveGroup(index, 'down')}
                                                        onEditGroup={() => openGroupModal(group)}
                                                        onDeleteGroup={() => handleDeleteGroup(group.id)}
                                                    />
                                                ))}
                                            </SortableContext>
                                            {filteredGroups.length === 0 && (
                                                <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-text-desc">
                                                    <LayoutGrid className="text-text-desc/40 mb-2" size={32} strokeWidth={1} />
                                                    <p className="text-xs font-bold text-text-main">
                                                        {navGroupSearch ? 'Tidak ada grup yang cocok' : 'Belum ada grup menu'}
                                                    </p>
                                                    <p className="text-[10px] text-text-desc mt-0.5">
                                                        {navGroupSearch ? `Tidak ditemukan grup "${navGroupSearch}"` : 'Buat grup baru untuk mulai menyusun menu.'}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* COLUMN 2: List Module in Selected Group (col-span-4) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2.5">
                            {(() => {
                                const currentActiveGroup = navItems.find((g) => g.id === selectedGroupId) || navItems[0];
                                if (!currentActiveGroup) {
                                    return (
                                        <div className="border border-dashed border-surface-border rounded-xl p-8 text-center text-text-desc text-xs h-[calc(100vh-270px)] flex flex-col items-center justify-center">
                                            <LayoutGrid size={36} className="text-text-desc/40 mb-2" />
                                            <span className="font-bold text-text-main">Belum Ada Grup Menu</span>
                                            <span className="text-[11px] text-text-desc mt-1">Silakan buat grup menu di sebelah kiri untuk mulai mengatur navigasi.</span>
                                        </div>
                                    );
                                }

                                const groupModules = currentActiveGroup.modules;
                                const filteredGroupModules = activeGroupModuleSearch.trim()
                                    ? groupModules.filter(
                                          (m) =>
                                              m.name.toLowerCase().includes(activeGroupModuleSearch.toLowerCase()) ||
                                              (m.identifier && m.identifier.toLowerCase().includes(activeGroupModuleSearch.toLowerCase())) ||
                                              (m.route && m.route.toLowerCase().includes(activeGroupModuleSearch.toLowerCase())),
                                      )
                                    : groupModules;

                                return (
                                    <>
                                        <div className="flex items-center justify-between border-b border-surface-border pb-2 min-h-[36px]">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                    {currentActiveGroup.icon && SELECTABLE_ICONS[currentActiveGroup.icon]
                                                        ? React.createElement(SELECTABLE_ICONS[currentActiveGroup.icon], { size: 13 })
                                                        : <LayoutGrid size={13} />}
                                                </div>
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-text-main truncate max-w-[240px]">
                                                    Modul di {currentActiveGroup.name}
                                                </h3>
                                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                                                    {groupModules.length} Modul
                                                </span>
                                            </div>
                                        </div>

                                        {/* Search in group modules */}
                                        <div className="relative">
                                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-desc" />
                                            <input
                                                type="text"
                                                value={activeGroupModuleSearch}
                                                onChange={(e) => setActiveGroupModuleSearch(e.target.value)}
                                                placeholder={`Cari modul di ${currentActiveGroup.name}...`}
                                                className="w-full h-8 pl-7 pr-7 text-xs bg-surface-card border border-surface-border rounded-lg placeholder:text-text-desc/60 focus:outline-none focus:ring-1 focus:ring-primary text-text-main"
                                            />
                                            {activeGroupModuleSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveGroupModuleSearch('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-desc hover:text-text-main p-0.5 cursor-pointer"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="h-[calc(100vh-320px)] min-h-[350px] overflow-y-auto scrollbar-hide space-y-1.5 p-2 border border-surface-border/80 rounded-xl bg-slate-50/40 dark:bg-zinc-900/30 flex flex-col">
                                            <SortableContext id={'context-' + currentActiveGroup.id} items={filteredGroupModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                                                {filteredGroupModules.map((module, mIdx) => (
                                                    <SortableModuleItem
                                                        key={module.id}
                                                        module={module}
                                                        onRemove={handleRemoveModule}
                                                        index={mIdx}
                                                        total={filteredGroupModules.length}
                                                        onMoveUp={() => handleMoveModuleIndex(currentActiveGroup.id, mIdx, 'up')}
                                                        onMoveDown={() => handleMoveModuleIndex(currentActiveGroup.id, mIdx, 'down')}
                                                        onEditModule={openModuleModal}
                                                        onMoveToGroup={handleMoveModuleToGroup}
                                                        groups={navItems}
                                                    />
                                                ))}
                                            </SortableContext>
                                            {filteredGroupModules.length === 0 && (
                                                <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-text-desc border border-dashed border-surface-border/80 rounded-xl bg-surface-card/40 my-auto">
                                                    <Layers className="text-text-desc/40 mb-2" size={32} strokeWidth={1} />
                                                    <p className="text-xs font-bold text-text-main">
                                                        {activeGroupModuleSearch ? 'Tidak ada modul yang cocok' : 'Grup ini masih kosong'}
                                                    </p>
                                                    <p className="text-[10px] text-text-desc mt-0.5 max-w-xs">
                                                        {activeGroupModuleSearch
                                                            ? `Tidak ditemukan modul "${activeGroupModuleSearch}" di grup ini.`
                                                            : 'Klik tombol "+ Pasang" pada repository di sebelah kanan atau tarik modul ke sini.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* COLUMN 3: Available Modules (col-span-4) */}
                        <div className="col-span-12 lg:col-span-4">
                            <AvailableListContainer
                                modules={availableModules}
                                activeGroupName={navItems.find((g) => g.id === selectedGroupId)?.name || navItems[0]?.name}
                                onQuickAdd={(m) => {
                                    const currentGroup = selectedGroupId || navItems[0]?.id;
                                    if (!currentGroup) {
                                        showToast('Buat grup navigasi terlebih dahulu', 'danger');
                                        return;
                                    }
                                    setNavItems((prev) => prev.map((g) => (g.id === currentGroup ? { ...g, modules: [...g.modules, m] } : g)));
                                    setAvailableModules((prev) => prev.filter((item) => item.id !== m.id));
                                }}
                                onEditModule={openModuleModal}
                                onAddModule={() => openModuleModal(null)}
                                onDeleteModule={handleDeleteModule}
                            />
                        </div>
                    </div>

                    <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                        {activeId ? (
                            activeType === 'group' ? (
                                <div className="border-primary bg-card ring-primary/20 w-full md:w-[calc(100vw/2-3rem)] max-w-2xl cursor-grabbing overflow-hidden rounded-xl border opacity-95 shadow-2xl ring-4">
                                    <div className="flex items-center justify-between border-b px-4 py-3.5 bg-card">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-inner">
                                                <Layers size={14} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-foreground text-sm font-normal  ">
                                                    {navItems.find((g) => g.id === activeId)?.name}
                                                </h3>
                                                <span className="text-text-main text-sm font-normal  ">
                                                    {navItems.find((g) => g.id === activeId)?.modules?.length || 0} MODUL TERDAFTAR
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-border bg-card flex w-[280px] scale-105 cursor-grabbing items-center gap-3 rounded-xl border p-3 opacity-95 shadow-2xl">
                                    <GripVertical size={14} className="text-primary" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground text-sm font-normal">{allModules.find((m) => m.id === activeId)?.name}</p>
                                    </div>
                                </div>
                            )
                        ) : null}
                    </DragOverlay>
                </DndContext>
                </div>
            )}

            {/* Group CRUD Modal */}
            <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogContent className="rounded-2xl sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-base font-normal  ">
                            {editingGroup ? 'Ubah Grup Navigasi' : 'Tambah Grup Navigasi'}
                        </DialogTitle>
                        <DialogDescription className="text-text-main text-xs font-normal">
                            {editingGroup ? 'Ganti nama grup navigasi yang sudah ada.' : 'Buat kontainer baru untuk mengelompokkan menu sidebar.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-sm font-normal  ">Nama Grup</label>
                            <input
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Contoh: Manajemen Aset"
                                className="border-surface-border bg-muted/30 focus:ring-primary/20 h-11 w-full rounded-xl border px-4 text-sm font-normal outline-hidden transition-all focus:ring-2"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-sm font-normal  ">Icon Grup</label>
                            <Select value={groupIcon} onValueChange={setGroupIcon}>
                                <SelectTrigger className="border-surface-border bg-muted/30 focus:ring-primary/20 text-foreground h-11 w-full rounded-xl border px-4 text-sm font-normal outline-hidden transition-all focus:ring-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-surface-border bg-card max-h-60 overflow-y-auto rounded-xl shadow-2xl">
                                    {Object.keys(SELECTABLE_ICONS).map((iconName) => {
                                        const IconComponent = SELECTABLE_ICONS[iconName];
                                        return (
                                            <SelectItem key={iconName} value={iconName} className="py-2.5 text-xs font-normal ">
                                                <div className="flex items-center gap-2">
                                                    {IconComponent && <IconComponent size={14} className="text-text-main/50" />}
                                                    <span>{iconName}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)} className="rounded-lg font-normal">
                            BATAL
                        </Button>
                        <Button
                            onClick={handleSaveGroup}
                            disabled={isProcessingGroup || !groupName.trim()}
                            className="rounded-lg font-normal"
                            variant="primary"
                        >
                            {isProcessingGroup ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                            SIMPAN PERUBAHAN
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Module CRUD Modal */}
            <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
                <DialogContent className="rounded-2xl sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-base font-normal  ">
                            {editingModuleItem ? 'Ubah Modul' : 'Tambah Modul Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-text-main text-xs font-normal">
                            {editingModuleItem ? 'Sesuaikan nama dan path rute untuk modul ini.' : 'Daftarkan modul baru ke dalam repository sistem.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-sm font-normal  ">Nama Modul</label>
                            <input
                                value={moduleName}
                                onChange={(e) => setModuleName(e.target.value)}
                                placeholder="Contoh: Daftar Kontrak"
                                className="border-surface-border bg-muted/30 focus:ring-primary/20 h-11 w-full rounded-xl border px-4 text-sm font-normal outline-hidden transition-all focus:ring-2"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-sm font-normal  ">Identifier</label>
                            <input
                                value={moduleIdentifier}
                                onChange={(e) => setModuleIdentifier(e.target.value)}
                                placeholder="Contoh: contract.index"
                                disabled={!!editingModuleItem}
                                className={cn(
                                    'border-surface-border bg-muted/30 focus:ring-primary/20 h-11 w-full rounded-xl border px-4 text-sm font-normal outline-hidden transition-all focus:ring-2',
                                    editingModuleItem && 'cursor-not-allowed opacity-60',
                                )}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-sm font-normal  ">Path Rute / URL</label>
                            <input
                                value={moduleRoute}
                                onChange={(e) => setModuleRoute(e.target.value)}
                                placeholder="Contoh: /admin/contracts"
                                className="border-surface-border bg-muted/30 focus:ring-primary/20 h-11 w-full rounded-xl border px-4 text-sm font-normal outline-hidden transition-all focus:ring-2"
                            />
                        </div>
                        {!editingModuleItem && (
                            <div className="flex flex-col gap-2">
                                <label className="text-text-main text-sm font-normal  ">Grup Navigasi</label>
                                <select
                                    value={moduleGroupId}
                                    onChange={(e) => setModuleGroupId(e.target.value)}
                                    className="border-surface-border bg-muted/30 focus:ring-primary/20 text-foreground h-11 w-full rounded-xl border px-4 text-sm font-normal outline-hidden transition-all focus:ring-2"
                                >
                                    <option value="" disabled>
                                        Pilih Grup Menu
                                    </option>
                                    {navItems.map((g) => (
                                        <option key={g.id} value={g.id} className="text-foreground bg-card">
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-sm font-normal  ">Icon Modul</label>
                            <Select value={moduleIcon} onValueChange={setModuleIcon}>
                                <SelectTrigger className="border-surface-border bg-muted/30 focus:ring-primary/20 text-foreground h-11 w-full rounded-xl border px-4 text-sm font-normal outline-hidden transition-all focus:ring-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-surface-border bg-card max-h-60 overflow-y-auto rounded-xl shadow-2xl">
                                    {Object.keys(SELECTABLE_ICONS).map((iconName) => {
                                        const IconComponent = SELECTABLE_ICONS[iconName];
                                        return (
                                            <SelectItem key={iconName} value={iconName} className="py-2.5 text-xs font-normal ">
                                                <div className="flex items-center gap-2">
                                                    {IconComponent && <IconComponent size={14} className="text-text-main/50" />}
                                                    <span>{iconName}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-sm font-normal  ">Deskripsi Modul</label>
                            <textarea
                                value={moduleDescription}
                                onChange={(e) => setModuleDescription(e.target.value)}
                                placeholder="Contoh: Modul untuk mengelola seluruh dokumen kontrak"
                                className="border-surface-border bg-muted/30 focus:ring-primary/20 text-foreground min-h-[80px] w-full resize-none rounded-xl border p-4 text-sm font-normal outline-hidden transition-all focus:ring-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsModuleModalOpen(false)} className="rounded-lg font-normal">
                            BATAL
                        </Button>
                        <Button
                            onClick={handleSaveModule}
                            disabled={isProcessingModule || !moduleName.trim() || (!editingModuleItem && !moduleIdentifier.trim())}
                            className="rounded-lg font-normal"
                            variant="primary"
                        >
                            {isProcessingModule ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                            SIMPAN
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Granular Permissions Dialog */}
            <Dialog open={isBulkGranularModalOpen} onOpenChange={setIsBulkGranularModalOpen}>
                <DialogContent className="rounded-2xl sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-base font-bold flex items-center gap-2">
                            <SlidersHorizontal size={18} className="text-primary" />
                            <span>Bulk Edit Izin ({selectedModuleIds.length} Modul Terpilih)</span>
                        </DialogTitle>
                        <DialogDescription className="text-text-desc text-xs font-normal">
                            Tentukan hak akses yang ingin diaktifkan atau dinonaktifkan untuk seluruh {selectedModuleIds.length} modul yang dipilih.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-3">
                        {PERMISSIONS.map((p) => {
                            const cfg = PERMISSION_CONFIG[p];
                            const Icon = cfg.icon;
                            const isChecked = !!bulkPermissions[p];

                            return (
                                <div
                                    key={p}
                                    onClick={() =>
                                        setBulkPermissions((prev) => ({
                                            ...prev,
                                            [p]: !isChecked,
                                        }))
                                    }
                                    className={cn(
                                        'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none',
                                        isChecked
                                            ? 'bg-primary/5 border-primary/30 text-text-main'
                                            : 'bg-surface-card border-surface-border/80 hover:bg-surface-muted text-text-desc',
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className={cn(
                                                'flex h-7 w-7 items-center justify-center rounded-lg border shrink-0',
                                                isChecked
                                                    ? 'bg-primary/10 border-primary/20'
                                                    : 'bg-surface-muted border-surface-border',
                                            )}
                                        >
                                            <Icon size={14} className={cfg.colorClass} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-text-main truncate">{cfg.label}</span>
                                            <span className="text-[10px] text-text-desc truncate">{cfg.description}</span>
                                        </div>
                                    </div>

                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) =>
                                            setBulkPermissions((prev) => ({
                                                ...prev,
                                                [p]: !!checked,
                                            }))
                                        }
                                        className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 rounded-md cursor-pointer shrink-0 ml-3"
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsBulkGranularModalOpen(false)}
                            className="rounded-lg text-xs font-semibold cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleBulkGranularApply}
                            className="rounded-lg text-xs font-bold cursor-pointer"
                            variant="primary"
                        >
                            <Save size={14} />
                            <span>Terapkan ke {selectedModuleIds.length} Modul</span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Group Confirmation Modal */}
            <ConfirmationModal
                open={isDeleteGroupModalOpen}
                onClose={() => {
                    setIsDeleteGroupModalOpen(false);
                    setDeletingGroupId(null);
                }}
                onConfirm={confirmDeleteGroup}
                title="Hapus Grup Navigasi?"
                description="Modul di dalam grup ini akan dipindahkan kembali ke repository."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />

            {/* Delete Module Confirmation Modal */}
            <ConfirmationModal
                open={isDeleteModuleModalOpen}
                onClose={() => {
                    setIsDeleteModuleModalOpen(false);
                    setDeletingModuleId(null);
                }}
                onConfirm={confirmDeleteModule}
                title="Hapus Modul Secara Permanen?"
                description="Tindakan ini akan menghapus modul secara permanen dari sistem dan tidak dapat dibatalkan."
                confirmText="Ya, Hapus Permanen"
                cancelText="Batal"
                variant="danger"
            />

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .content-visibility-auto { content-visibility: auto; contain-intrinsic-size: auto 60px; }
            `,
                }}
            />
                </FloatingPanel>
            </MasterPageLayout>
        </>
    );
}
