import { FormSection, ManagementForm } from '@/pages/admin/components/ManagementForm';
import { SELECTABLE_ICONS } from '@/pages/admin/components/NavigationManagement';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/overlays/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
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
    CheckSquare,
    ChevronDown,
    Edit2,
    GripVertical,
    Key,
    Layers,
    LayoutGrid,
    Move,
    Plus,
    RefreshCw,
    Save,
    ShieldAlert,
    ShieldCheck,
    Square,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

// --- Shared Constants & Types ---
const PERMISSIONS = ['can_read', 'can_create', 'can_update', 'can_delete', 'can_approve', 'can_bulk_approve', 'can_bulk_delete'] as const;
type Permission = (typeof PERMISSIONS)[number];

const permissionLabels: Record<Permission, string> = {
    can_read: 'Read',
    can_create: 'Create',
    can_update: 'Update',
    can_delete: 'Delete',
    can_approve: 'Approve',
    can_bulk_approve: 'Bulk Aprv',
    can_bulk_delete: 'Bulk Del',
};

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

// --- ACCESS TAB COMPONENTS ---
const ModuleRow = React.memo(
    ({
        module,
        access,
        onToggle,
        onSetRow,
    }: {
        module: any;
        access: any;
        onToggle: (moduleId: string, permission: Permission, checked: boolean) => void;
        onSetRow: (moduleId: string, checked: boolean) => void;
    }) => {
        const isRowAllChecked = PERMISSIONS.every((p) => access[p]);

        return (
            <tr
                className={cn(
                    'border-surface-border/40 hover:bg-surface-muted/30 group border-b transition-colors last:border-b-0',
                    'content-visibility-auto contain-intrinsic-size-[auto_48px]',
                )}
            >
                <td className="border-surface-border/40 bg-surface-base group-hover:bg-surface-muted/30 sticky left-0 z-10 border-r px-4 py-2.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] transition-colors">
                    <div className="flex items-start gap-2.5">
                        {module.icon && SELECTABLE_ICONS[module.icon] && (
                            <div className="text-muted-foreground/60 group-hover:text-primary mt-0.5 shrink-0">
                                {React.createElement(SELECTABLE_ICONS[module.icon], { size: 14 })}
                            </div>
                        )}
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span className="text-text-main group-hover:text-primary truncate text-xs font-semibold tracking-wide">
                                {module.name}
                            </span>
                            <span className="text-text-desc/50 font-mono text-[9px]  uppercase">{module.identifier}</span>
                            {module.description && (
                                <span className="text-text-desc/40 mt-0.5 text-[10px] leading-normal font-normal whitespace-pre-wrap">
                                    {module.description}
                                </span>
                            )}
                        </div>
                    </div>
                </td>
                {PERMISSIONS.map((p) => (
                    <td
                        key={p}
                        className={cn(
                            'border-surface-border/40 border-r px-1 py-2.5 text-center transition-colors last:border-r-0',
                            access[p] ? 'bg-primary/5' : 'bg-transparent',
                        )}
                    >
                        <div className="flex justify-center">
                            <Checkbox
                                className="border-surface-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 rounded transition-all active:scale-90"
                                checked={access[p] || false}
                                onCheckedChange={(checked) => onToggle(module.id, p, !!checked)}
                            />
                        </div>
                    </td>
                ))}
                <td className="bg-surface-muted/30 group-hover:bg-surface-muted/50 border-surface-border/40 border-l px-1 py-2.5 text-center transition-all">
                    <div className="flex justify-center">
                        <Checkbox
                            className="border-surface-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 rounded transition-all active:scale-90"
                            checked={!!isRowAllChecked}
                            onCheckedChange={(checked) => onSetRow(module.id, !!checked)}
                        />
                    </div>
                </td>
            </tr>
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
                'group border-surface-border/60 bg-card flex items-center gap-3 rounded-lg border p-3 transition-all',
                isDragging && 'border-primary ring-primary/10 z-50 scale-[1.02] opacity-50 shadow-2xl ring-2',
            )}
        >
            <div className="bg-primary/5 text-primary ring-primary/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums ring-1">
                {index + 1}
            </div>
            <div
                {...listeners}
                {...attributes}
                className="text-muted-foreground/40 hover:bg-muted hover:text-foreground cursor-grab rounded-lg p-1.5 transition-colors active:cursor-grabbing"
            >
                <GripVertical size={16} />
            </div>
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    type="button"
                    disabled={index === 0}
                    onClick={onMoveUp}
                    className="text-muted-foreground/40 hover:text-primary hover:bg-muted rounded p-0.5 transition-all disabled:opacity-20"
                >
                    <ArrowUp size={12} />
                </button>
                <button
                    type="button"
                    disabled={index === total - 1}
                    onClick={onMoveDown}
                    className="text-muted-foreground/40 hover:text-primary hover:bg-muted rounded p-0.5 transition-all disabled:opacity-20"
                >
                    <ArrowDown size={12} />
                </button>
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {module.icon &&
                        SELECTABLE_ICONS[module.icon] &&
                        React.createElement(SELECTABLE_ICONS[module.icon], {
                            size: 14,
                            className: 'text-muted-foreground/70 shrink-0',
                        })}
                    <p className="text-foreground truncate text-sm font-bold tracking-tight">{module.name}</p>
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-xs font-semibold tracking-wide">{module.route || 'SYSTEM_INTERNAL'}</p>
                {module.description && (
                    <p className="text-muted-foreground/50 mt-1 text-[11px] leading-relaxed font-normal whitespace-pre-wrap">{module.description}</p>
                )}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="text-muted-foreground/40 hover:bg-primary/10 hover:text-primary rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100 active:scale-90"
                        title="Pindahkan Modul"
                    >
                        <Move size={13} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {groups.map((g) => (
                        <DropdownMenuItem key={g.id} onClick={() => onMoveToGroup(module.id, g.id)}>
                            {g.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <button
                onClick={() => onEditModule(module)}
                className="text-muted-foreground/40 hover:bg-primary/10 hover:text-primary rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100 active:scale-90"
                title="Edit Nama/Path Modul"
            >
                <Edit2 size={13} />
            </button>
            <button
                onClick={() => onRemove(module.id)}
                className="text-muted-foreground/40 rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 active:scale-90"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

const SortableGroupItem = ({
    group,
    onRemoveModule,
    onEditGroup,
    onDeleteGroup,
    index,
    total,
    onMoveGroupUp,
    onMoveGroupDown,
    onMoveGroupTo,
    onMoveModule,
    onMoveModuleToGroup,
    onEditModule,
    isGlobalDraggingGroup,
    groups,
}: {
    group: Group;
    onRemoveModule: (id: string) => void;
    onEditGroup: (g: Group) => void;
    onDeleteGroup: (gId: string) => void;
    index: number;
    total: number;
    onMoveGroupUp: () => void;
    onMoveGroupDown: () => void;
    onMoveGroupTo: (targetIndex: number) => void;
    onMoveModule: (groupId: string, moduleIndex: number, direction: 'up' | 'down') => void;
    onMoveModuleToGroup: (moduleId: string, targetGroupId: string) => void;
    onEditModule: (m: Module) => void;
    isGlobalDraggingGroup: boolean;
    groups: Group[];
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: group.id,
        data: { type: 'group', group },
    });

    useEffect(() => {
        const handleToggleAll = (e: any) => {
            setIsExpanded(e.detail.expanded);
        };
        window.addEventListener('toggle-all-groups', handleToggleAll);
        return () => window.removeEventListener('toggle-all-groups', handleToggleAll);
    }, []);

    useEffect(() => {
        if (isGlobalDraggingGroup) {
            setIsExpanded(false);
        }
    }, [isGlobalDraggingGroup]);

    const style = { transform: CSS.Translate.toString(transform), transition };
    
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'border-surface-border/60 bg-card/40 overflow-hidden rounded-xl border transition-all',
                isDragging && 'border-primary ring-primary/5 z-40 opacity-50 shadow-2xl ring-2',
            )}
        >
            <div 
                className="border-border bg-card flex cursor-pointer items-center justify-between border-b px-4 py-3.5 transition-colors hover:bg-surface-muted/50"
                onClick={() => !isDragging && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-foreground text-background flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums shadow-sm">
                        {index + 1}
                    </div>
                    <div
                        {...listeners}
                        {...attributes}
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground/40 hover:bg-muted hover:text-foreground cursor-grab rounded-xl p-2 active:cursor-grabbing"
                    >
                        <GripVertical size={16} />
                    </div>
                    {/* Reorder Group buttons */}
                    <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            disabled={index === 0}
                            onClick={onMoveGroupUp}
                            className="text-muted-foreground/40 hover:text-primary hover:bg-muted flex items-center justify-center rounded p-0.5 transition-all disabled:opacity-20"
                        >
                            <ArrowUp size={10} />
                        </button>
                        <button
                            type="button"
                            disabled={index === total - 1}
                            onClick={onMoveGroupDown}
                            className="text-muted-foreground/40 hover:text-primary hover:bg-muted flex items-center justify-center rounded p-0.5 transition-all disabled:opacity-20"
                        >
                            <ArrowDown size={10} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-foreground text-sm font-bold tracking-tight">{group.name}</h3>
                        <span className="bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm">
                            {group.modules.length} UNITS
                        </span>
                        {/* Order jump dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                onClick={(e) => e.stopPropagation()}
                                asChild
                            >
                                <button
                                    type="button"
                                    className="bg-surface-muted/60 hover:bg-primary/10 text-muted-foreground hover:text-primary border-surface-border/40 flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-all"
                                    title="Pindah ke urutan"
                                >
                                    #{index + 1}
                                    <ChevronDown size={9} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                                {Array.from({ length: total }, (_, i) => i).map((targetIdx) => (
                                    <DropdownMenuItem
                                        key={targetIdx}
                                        disabled={targetIdx === index}
                                        onClick={() => onMoveGroupTo(targetIdx)}
                                        className={cn(
                                            'flex items-center gap-2 text-xs',
                                            targetIdx === index && 'font-bold text-primary',
                                        )}
                                    >
                                        <span className="bg-foreground/10 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-semibold tabular-nums">
                                            {targetIdx + 1}
                                        </span>
                                        {groups[targetIdx]?.name ?? `Grup ${targetIdx + 1}`}
                                        {targetIdx === index && (
                                            <span className="text-primary ml-auto text-[9px] font-semibold uppercase">sekarang</span>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronDown 
                            size={14} 
                            className={cn("text-muted-foreground/50 transition-transform duration-300 ml-1", isExpanded ? "rotate-180" : "rotate-0")} 
                        />
                    </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onEditGroup(group)}>
                        <Edit2 size={12} className="text-muted-foreground" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => onDeleteGroup(group.id)}
                    >
                        <Trash2 size={12} />
                    </Button>
                </div>
            </div>
            
            <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                    <div className="min-h-[80px] space-y-2.5 p-4">
                        <SortableContext id={'context-' + group.id} items={group.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                            {group.modules.map((module, mIdx) => (
                                <SortableModuleItem
                                    key={module.id}
                                    module={module}
                                    onRemove={onRemoveModule}
                                    index={mIdx}
                                    total={group.modules.length}
                                    onMoveUp={() => onMoveModule(group.id, mIdx, 'up')}
                                    onMoveDown={() => onMoveModule(group.id, mIdx, 'down')}
                                    onEditModule={onEditModule}
                                    onMoveToGroup={onMoveModuleToGroup}
                                    groups={groups}
                                />
                            ))}
                        </SortableContext>
                        {group.modules.length === 0 && (
                            <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-8">
                                <span className="text-muted-foreground/60 text-xs font-medium uppercase">Drop module here</span>
                            </div>
                        )}
                    </div>
                </div>
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
}: {
    modules: Module[];
    onQuickAdd: (m: Module) => void;
    onEditModule: (m: Module) => void;
    onAddModule: () => void;
    onDeleteModule: (id: string) => void;
}) => {
    const { setNodeRef } = useDroppable({ id: 'available-list' });
    return (
        <div ref={setNodeRef} className="border-surface-border/60 bg-card flex flex-col overflow-hidden rounded-xl border">
            <div className="border-border bg-muted/10 flex shrink-0 items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-foreground text-[10px] font-semibold tracking-widest uppercase opacity-70">Repository</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddModule}
                        className="text-primary hover:bg-primary/10 border-primary/20 flex h-6 w-6 items-center justify-center rounded-lg border text-xs font-bold transition-all active:scale-95"
                        title="Tambah Modul Baru"
                    >
                        <Plus size={12} />
                    </button>
                    <span className="bg-primary/5 text-primary rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-xs">{modules.length} UNITS</span>
                </div>
            </div>
            <div className="scrollbar-hide flex-1 space-y-2 p-3">
                <SortableContext id="available-context" items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {modules.map((module) => (
                        <AvailableModuleItem
                            key={module.id}
                            module={module}
                            onQuickAdd={onQuickAdd}
                            onEditModule={onEditModule}
                            onDeleteModule={onDeleteModule}
                        />
                    ))}
                </SortableContext>
                {modules.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center opacity-30 select-none">
                        <Layers className="text-muted-foreground/40 mb-2" size={32} strokeWidth={1} />
                        <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Kosong</p>
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
}: {
    module: Module;
    onQuickAdd: (m: Module) => void;
    onEditModule: (m: Module) => void;
    onDeleteModule: (id: string) => void;
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
                'group border-surface-border/60 bg-card hover:border-surface-border flex items-center justify-between rounded-lg border p-4 transition-all',
                isDragging && 'border-primary ring-primary/10 z-50 scale-[1.02] opacity-50 shadow-2xl ring-2',
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div
                    {...listeners}
                    {...attributes}
                    className="text-muted-foreground/40 hover:bg-muted hover:text-foreground shrink-0 cursor-grab rounded-lg p-2 transition-colors"
                >
                    <GripVertical size={16} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        {module.icon &&
                            SELECTABLE_ICONS[module.icon] &&
                            React.createElement(SELECTABLE_ICONS[module.icon], {
                                size: 14,
                                className: 'text-muted-foreground/70 shrink-0',
                            })}
                        <span className="text-foreground block truncate text-sm font-bold tracking-tight uppercase">{module.name}</span>
                    </div>
                    <span className="text-muted-foreground/70 mt-0.5 block truncate text-xs font-semibold tracking-wide uppercase">
                        {module.route || 'NO_PATH'}
                    </span>
                    {module.description && (
                        <p className="text-muted-foreground/50 mt-1 text-[11px] leading-relaxed font-normal whitespace-pre-wrap">
                            {module.description}
                        </p>
                    )}
                </div>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
                <button
                    onClick={() => onEditModule(module)}
                    className="text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg p-1.5 active:scale-90"
                    title="Edit Nama/Path Modul"
                >
                    <Edit2 size={13} />
                </button>
                <button
                    onClick={() => onDeleteModule(module.id)}
                    className="text-muted-foreground/40 rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-500 active:scale-90"
                    title="Hapus Modul Permanen"
                >
                    <Trash2 size={14} />
                </button>
                <button
                    onClick={() => onQuickAdd(module)}
                    className="text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg p-1.5 active:scale-90"
                    title="Tambahkan ke Grup Pertama"
                >
                    <Plus size={14} />
                </button>
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
    const [availableModules, setAvailableModules] = useState<Module[]>(() => {
        const activeModuleIds = new Set(navigation.flatMap((g) => g.modules.map((m) => m.id)));
        return allModules.filter((m) => !activeModuleIds.has(m.id));
    });
    const [isSavingNav, setIsSavingNav] = useState(false);

    // Group CRUD States
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupName, setGroupName] = useState('');
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
        setIsGroupModalOpen(true);
    };

    const handleSaveGroup = async () => {
        if (!groupName.trim()) return;
        setIsGroupProcessing(true);

        try {
            if (editingGroup) {
                setNavItems((prev) => prev.map((g) => (g.id === editingGroup.id ? { ...g, name: groupName } : g)));
                router.put(
                    `/admin/module-groups/${editingGroup.id}`,
                    { name: groupName },
                    {
                        onSuccess: () => showToast('Grup navigasi berhasil diperbarui', 'success'),
                        onFinish: () => setIsGroupProcessing(false),
                    },
                );
            } else {
                router.post(
                    `/admin/module-groups`,
                    { name: groupName, icon: 'LayoutGrid' },
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
            setAvailableModules((prev) => [...prev, ...group.modules]);
            setNavItems((prev) => prev.filter((g) => g.id !== groupId));
        }

        router.delete(`/admin/module-groups/${groupId}`, {
            onSuccess: () => showToast('Grup navigasi berhasil dihapus', 'success'),
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
                        module_group_id: editingModuleItem.module_group_id || navItems[0]?.id,
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
        setAvailableModules((prev) => prev.filter((m) => m.id !== moduleId));

        router.delete(`/admin/modules/${moduleId}`, {
            onSuccess: () => showToast('Modul berhasil dihapus secara permanen', 'success'),
            onError: () => showToast('Gagal menghapus modul', 'danger'),
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

    const setAll = (checked: boolean) => {
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                const newAccess = { ...access };
                PERMISSIONS.forEach((p) => {
                    (newAccess as any)[p] = checked;
                });
                return newAccess;
            }),
        );
    };

    const setColumn = (permission: Permission, checked: boolean) => {
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                const newAccess = { ...access, [permission]: checked };
                if (checked && permission !== 'can_read') newAccess.can_read = true;
                if (permission === 'can_read' && !checked) {
                    PERMISSIONS.forEach((p) => {
                        (newAccess as any)[p] = false;
                    });
                }
                return newAccess;
            }),
        );
    };

    const setGroupColumn = (groupId: string, permission: Permission, checked: boolean) => {
        const groupModuleIds = modules.filter((m) => m.module_group_id === groupId).map((m) => m.id);
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                if (groupModuleIds.includes(access.module_id)) {
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

    const setRow = (moduleId: string, checked: boolean) => {
        accessForm.setData(
            'accesses',
            accessForm.data.accesses.map((access) => {
                if (access.module_id === moduleId) {
                    const newAccess = { ...access };
                    PERMISSIONS.forEach((p) => {
                        (newAccess as any)[p] = checked;
                    });
                    return newAccess;
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
        <ManagementForm
            title={activeTab === 'access' ? 'Pemetaan Hak Akses' : 'Pemetaan Navigasi'}
            subtitle={`Konfigurasi otoritas dan arsitektur untuk role ${role.name}`}
            onClose={() => window.history.back()}
            onSave={activeTab === 'access' ? handleAccessSubmit : handleNavSave}
            processing={accessForm.processing || isSavingNav}
            isDirty={accessForm.isDirty || true}
            isEdit={true}
            headerActions={
                <div className="flex items-center">
                    {/* Role Switcher Selector */}
                    <div className="mr-4 flex items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-muted/50 hover:bg-muted border-border/60 h-9 rounded-lg px-4 text-xs font-bold transition-all"
                                >
                                    <ShieldAlert className="text-primary mr-2 h-4 w-4 opacity-70" />
                                    <span className="text-muted-foreground mr-1.5 font-medium">Role:</span>
                                    {role.name}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[240px] rounded-xl p-1.5 shadow-xl">
                                <div className="text-muted-foreground px-3 py-2 text-[10px] font-bold tracking-widest uppercase">
                                    Pilih Role Otoritas
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {roles.map((r) => (
                                        <DropdownMenuItem
                                            key={r.id}
                                            className={cn(
                                                'mb-1 cursor-pointer rounded-lg px-3 py-2.5 text-xs font-bold transition-all last:mb-0',
                                                r.id === role.id
                                                    ? 'bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground'
                                                    : 'hover:bg-muted focus:bg-muted',
                                            )}
                                            onClick={() => {
                                                if (r.id !== role.id) {
                                                    const basePath = activeTab === 'access' ? '/admin/access-mapping' : '/admin/navigation-mapping';
                                                    router.get(`${basePath}/${r.id}`);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck
                                                    size={14}
                                                    className={cn(r.id === role.id ? 'text-primary-foreground' : 'text-primary opacity-60')}
                                                />
                                                {r.name}
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Mapping Type Switcher - Hidden if Independent */}
                    {!isIndependent && (
                        <div className="border-border/60 mr-4 flex items-center border-l border-dashed pl-4 transition-all">
                            <div className="bg-muted flex rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('access')}
                                    type="button"
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
                                        activeTab === 'access'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Key size={14} /> Hak Akses
                                </button>
                                <button
                                    onClick={() => setActiveTab('navigation')}
                                    type="button"
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
                                        activeTab === 'navigation'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <LayoutGrid size={14} /> Navigasi
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Utility Buttons Container (Conditional for Access Tab) */}
                    {activeTab === 'access' && (
                        <div className="border-border/60 mr-4 flex items-center border-l border-dashed pl-4 transition-all">
                            <div className="bg-muted flex rounded-lg p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-card h-8 rounded-lg text-xs font-bold transition-all"
                                    onClick={() => setAll(true)}
                                >
                                    <CheckSquare className="mr-1.5 h-4 w-4" /> Pilih Semua
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-card h-8 rounded-lg text-xs font-bold transition-all"
                                    onClick={() => setAll(false)}
                                >
                                    <Square className="mr-1.5 h-4 w-4" /> Bersihkan
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={`Config: ${role.name}`} />

            {activeTab === 'access' ? (
                <div className="grid grid-cols-1 gap-8">
                    <FormSection title="Matriks Hak Akses" subtitle="Tentukan izin spesifik untuk setiap modul operasional">
                        <div className="bg-surface-base/40 border-surface-border/60 mx-1 overflow-hidden rounded-xl border backdrop-blur-sm">
                            <div className="scrollbar-hide overflow-x-auto">
                                <table className="w-full min-w-[800px] border-collapse text-left">
                                    <thead>
                                        <tr className="border-surface-border/60 bg-surface-muted/40 border-b backdrop-blur-md select-none">
                                            <th className="border-surface-border/60 bg-surface-muted/50 text-text-desc sticky left-0 z-30 min-w-[220px] border-r px-4 py-3.5 text-left text-[11px] font-medium  uppercase shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                                                Scope Modul
                                            </th>
                                            {PERMISSIONS.map((p) => {
                                                const isAllChecked = accessForm.data.accesses.every((a) => (a as any)[p]);
                                                return (
                                                    <th
                                                        key={p}
                                                        className="border-surface-border/60 text-text-desc min-w-[100px] border-r px-1 py-3.5 text-center text-[11px] font-medium  uppercase last:border-r-0"
                                                    >
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <span>{permissionLabels[p]}</span>
                                                            <Checkbox
                                                                className="border-surface-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5 rounded-md transition-all active:scale-90"
                                                                checked={isAllChecked}
                                                                onCheckedChange={(checked) => setColumn(p, !!checked)}
                                                            />
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                            <th className="border-surface-border/60 bg-surface-muted/30 text-text-desc min-w-[60px] border-l px-1 py-3.5 text-center text-[11px] font-medium  uppercase">
                                                Full
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-surface-border/40 divide-y">
                                        {Object.entries(groupedModules).map(([groupId, group]) => {
                                            const groupModuleIds = group.modules.map((m) => m.id);
                                            const groupAccesses = accessForm.data.accesses.filter((a) => groupModuleIds.includes(a.module_id));
                                            const isGroupFullControlChecked = groupAccesses.every(
                                                (a) =>
                                                    a.can_read &&
                                                    a.can_create &&
                                                    a.can_update &&
                                                    a.can_delete &&
                                                    a.can_approve &&
                                                    a.can_bulk_approve &&
                                                    a.can_bulk_delete,
                                            );

                                            return (
                                                <React.Fragment key={groupId}>
                                                    <tr className="border-surface-border/60 bg-surface-muted/30 hover:bg-surface-muted/50 border-y transition-colors">
                                                        <td className="bg-surface-muted border-surface-border/60 sticky left-0 z-10 border-r px-4 py-2.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-primary/5 text-primary ring-primary/10 rounded-lg p-1 ring-1">
                                                                    <LayoutGrid className="h-3 w-3" />
                                                                </div>
                                                                <span className="text-text-main text-[11px] font-semibold tracking-wide uppercase">
                                                                    {group.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        {PERMISSIONS.map((p) => {
                                                            const isGroupColumnChecked = groupAccesses.every((a) => (a as any)[p]);
                                                            return (
                                                                <td
                                                                    key={p}
                                                                    className="border-surface-border/60 border-r px-1 py-2.5 text-center transition-colors"
                                                                >
                                                                    <div className="flex justify-center">
                                                                        <Checkbox
                                                                            className="border-surface-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5 rounded-md border transition-all active:scale-90"
                                                                            checked={isGroupColumnChecked}
                                                                            onCheckedChange={(checked) => setGroupColumn(groupId, p, !!checked)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="bg-surface-muted/30 border-surface-border/60 border-l px-1 py-2.5 text-center">
                                                            <div className="flex justify-center">
                                                                <Checkbox
                                                                    className="border-surface-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5 rounded-md border transition-all active:scale-90"
                                                                    checked={isGroupFullControlChecked}
                                                                    onCheckedChange={(checked) => {
                                                                        accessForm.setData(
                                                                            'accesses',
                                                                            accessForm.data.accesses.map((access) =>
                                                                                groupModuleIds.includes(access.module_id)
                                                                                    ? {
                                                                                        ...access,
                                                                                        can_read: !!checked,
                                                                                        can_create: !!checked,
                                                                                        can_update: !!checked,
                                                                                        can_delete: !!checked,
                                                                                        can_approve: !!checked,
                                                                                        can_bulk_approve: !!checked,
                                                                                        can_bulk_delete: !!checked,
                                                                                    }
                                                                                    : access,
                                                                            ),
                                                                        );
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {group.modules.map((module) => (
                                                        <ModuleRow
                                                            key={module.id}
                                                            module={module}
                                                            access={accessForm.data.accesses.find((a) => a.module_id === module.id)}
                                                            onToggle={updateAccess}
                                                            onSetRow={setRow}
                                                        />
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </FormSection>

                    <div className="group relative max-w-4xl overflow-hidden rounded-xl border border-amber-200/50 bg-amber-50/10 p-5 dark:bg-amber-950/5">
                        <div className="pointer-events-none absolute -top-4 -right-4 p-6 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.07]">
                            <ShieldAlert size={200} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 flex items-start gap-6">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/20">
                                <ShieldAlert className="h-7 w-7 animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-foreground text-base font-semibold tracking-tight">Protokol Keamanan Perubahan</h4>
                                <p className="text-muted-foreground/80 text-xs leading-relaxed font-bold tracking-wide uppercase">
                                    Setiap modifikasi hak akses akan langsung mengikat seluruh personil dengan role{' '}
                                    <span className="text-primary decoration-primary/30 font-semibold underline underline-offset-4">{role.name}</span>.
                                    Pastikan tingkat otorisasi sudah sesuai dengan batas wewenang struktural sebelum melakukan finalisasi penyimpanan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <FormSection title="Arsitektur Navigasi" subtitle="Atur pengelompokan dan urutan menu yang tampil di sidebar" />
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const event = new CustomEvent('toggle-all-groups', { detail: { expanded: true } });
                                        window.dispatchEvent(event);
                                    }}
                                    className="h-9 rounded-xl font-bold"
                                >
                                    Expand All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const event = new CustomEvent('toggle-all-groups', { detail: { expanded: false } });
                                        window.dispatchEvent(event);
                                    }}
                                    className="h-9 rounded-xl font-bold"
                                >
                                    Minimize All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-primary/30 text-primary hover:bg-primary/5 h-9 rounded-xl font-bold transition-all"
                                    onClick={() => openGroupModal()}
                                >
                                    <Plus className="mr-1.5 h-4 w-4" /> TAMBAH GRUP MENU
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                            {/* Grid Container for Groups (Replaced Masonry to prevent DND infinite loops) */}
                            <div className="col-span-12 lg:col-span-8">
                                <div className="grid grid-cols-1 gap-6 items-start">
                                    <SortableContext id="groups-context" items={navItems.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                                        {navItems.map((group, gIdx) => (
                                            <div key={group.id} className="break-inside-avoid">
                                                <SortableGroupItem
                                                    group={group}
                                                    onRemoveModule={handleRemoveModule}
                                                    onEditGroup={openGroupModal}
                                                    onDeleteGroup={handleDeleteGroup}
                                                    index={gIdx}
                                                    total={navItems.length}
                                                    onMoveGroupUp={() => handleMoveGroup(gIdx, 'up')}
                                                    onMoveGroupDown={() => handleMoveGroup(gIdx, 'down')}
                                                    onMoveGroupTo={(targetIdx) => handleMoveGroupTo(gIdx, targetIdx)}
                                                    onMoveModule={handleMoveModuleIndex}
                                                    onMoveModuleToGroup={handleMoveModuleToGroup}
                                                    onEditModule={openModuleModal}
                                                    isGlobalDraggingGroup={activeType === 'group'}
                                                    groups={navItems}
                                                />
                                            </div>
                                        ))}
                                    </SortableContext>
                                </div>
                            </div>

                            {/* Repository (Independent Height) */}
                            <div className="col-span-12 lg:sticky lg:top-6 lg:col-span-4">
                                <AvailableListContainer
                                    modules={availableModules}
                                    onQuickAdd={handleQuickAdd}
                                    onEditModule={openModuleModal}
                                    onAddModule={() => openModuleModal(null)}
                                    onDeleteModule={handleDeleteModule}
                                />
                            </div>
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
                                                <h3 className="text-foreground text-[13px] font-bold tracking-tight uppercase">
                                                    {navItems.find((g) => g.id === activeId)?.name}
                                                </h3>
                                                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
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
                                        <p className="text-foreground text-sm font-bold">{allModules.find((m) => m.id === activeId)?.name}</p>
                                    </div>
                                </div>
                            )
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Group CRUD Modal */}
            <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogContent className="rounded-2xl sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground text-base font-semibold tracking-tight uppercase">
                            {editingGroup ? 'Ubah Grup Navigasi' : 'Tambah Grup Navigasi'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs font-medium">
                            {editingGroup ? 'Ganti nama grup navigasi yang sudah ada.' : 'Buat kontainer baru untuk mengelompokkan menu sidebar.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">Nama Grup</label>
                            <input
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Contoh: Manajemen Aset"
                                className="border-surface-border bg-muted/30 focus:ring-primary/20 h-11 w-full rounded-xl border px-4 text-sm font-bold outline-hidden transition-all focus:ring-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)} className="rounded-lg font-bold">
                            BATAL
                        </Button>
                        <Button
                            onClick={handleSaveGroup}
                            disabled={isProcessingGroup || !groupName.trim()}
                            className="rounded-lg font-bold"
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
                        <DialogTitle className="text-foreground text-base font-semibold tracking-tight uppercase">
                            {editingModuleItem ? 'Ubah Modul' : 'Tambah Modul Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs font-medium">
                            {editingModuleItem ? 'Sesuaikan nama dan path rute untuk modul ini.' : 'Daftarkan modul baru ke dalam repository sistem.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">Nama Modul</label>
                            <input
                                value={moduleName}
                                onChange={(e) => setModuleName(e.target.value)}
                                placeholder="Contoh: Daftar Kontrak"
                                className="border-surface-border bg-muted/30 focus:ring-primary/20 h-11 w-full rounded-xl border px-4 text-sm font-bold outline-hidden transition-all focus:ring-2"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">Identifier</label>
                            <input
                                value={moduleIdentifier}
                                onChange={(e) => setModuleIdentifier(e.target.value)}
                                placeholder="Contoh: contract.index"
                                disabled={!!editingModuleItem}
                                className={cn(
                                    'border-surface-border bg-muted/30 focus:ring-primary/20 h-11 w-full rounded-xl border px-4 text-sm font-bold outline-hidden transition-all focus:ring-2',
                                    editingModuleItem && 'cursor-not-allowed opacity-60',
                                )}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">Path Rute / URL</label>
                            <input
                                value={moduleRoute}
                                onChange={(e) => setModuleRoute(e.target.value)}
                                placeholder="Contoh: /admin/contracts"
                                className="border-surface-border bg-muted/30 focus:ring-primary/20 h-11 w-full rounded-xl border px-4 text-sm font-bold outline-hidden transition-all focus:ring-2"
                            />
                        </div>
                        {!editingModuleItem && (
                            <div className="flex flex-col gap-2">
                                <label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">Grup Navigasi</label>
                                <select
                                    value={moduleGroupId}
                                    onChange={(e) => setModuleGroupId(e.target.value)}
                                    className="border-surface-border bg-muted/30 focus:ring-primary/20 text-foreground h-11 w-full rounded-xl border px-4 text-sm font-bold outline-hidden transition-all focus:ring-2"
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
                            <label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">Icon Modul</label>
                            <Select value={moduleIcon} onValueChange={setModuleIcon}>
                                <SelectTrigger className="border-surface-border bg-muted/30 focus:ring-primary/20 text-foreground h-11 w-full rounded-xl border px-4 text-sm font-bold outline-hidden transition-all focus:ring-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-surface-border bg-card max-h-60 overflow-y-auto rounded-xl shadow-2xl">
                                    {Object.keys(SELECTABLE_ICONS).map((iconName) => {
                                        const IconComponent = SELECTABLE_ICONS[iconName];
                                        return (
                                            <SelectItem key={iconName} value={iconName} className="py-2.5 text-xs font-medium uppercase">
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
                            <label className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">Deskripsi Modul</label>
                            <textarea
                                value={moduleDescription}
                                onChange={(e) => setModuleDescription(e.target.value)}
                                placeholder="Contoh: Modul untuk mengelola seluruh dokumen kontrak"
                                className="border-surface-border bg-muted/30 focus:ring-primary/20 text-foreground min-h-[80px] w-full resize-none rounded-xl border p-4 text-sm font-bold outline-hidden transition-all focus:ring-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsModuleModalOpen(false)} className="rounded-lg font-bold">
                            BATAL
                        </Button>
                        <Button
                            onClick={handleSaveModule}
                            disabled={isProcessingModule || !moduleName.trim() || (!editingModuleItem && !moduleIdentifier.trim())}
                            className="rounded-lg font-bold"
                            variant="primary"
                        >
                            {isProcessingModule ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                            SIMPAN
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
        </ManagementForm>
    );
}
