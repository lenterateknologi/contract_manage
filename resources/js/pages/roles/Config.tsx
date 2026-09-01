import { FormSection, ManagementForm } from '@/pages/admin/components/ManagementForm';
import { SELECTABLE_ICONS } from '@/pages/admin/components/NavigationManagement';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
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
    ArrowLeft,
    Loader2,
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
                    'border-b border-surface-border/60 hover:bg-slate-50 dark:hover:bg-zinc-800/40 group transition-colors last:border-b-0',
                    'content-visibility-auto contain-intrinsic-size-[auto_36px]',
                )}
            >
                <td className="border-r border-surface-border/60 bg-card group-hover:bg-slate-50 dark:group-hover:bg-zinc-800/40 sticky left-0 z-10 px-3 py-1.5 transition-colors">
                    <div className="flex items-center gap-2">
                        {module.icon && SELECTABLE_ICONS[module.icon] && (
                            <div className="text-primary/70 group-hover:text-primary shrink-0">
                                {React.createElement(SELECTABLE_ICONS[module.icon], { size: 13 })}
                            </div>
                        )}
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span className="text-text-main group-hover:text-primary truncate text-[11px] font-bold">
                                {module.name}
                            </span>
                            <span className="text-text-desc/50 font-mono text-[9px]">{module.identifier}</span>
                        </div>
                    </div>
                </td>
                {PERMISSIONS.map((p) => (
                    <td
                        key={p}
                        className={cn(
                            'border-r border-surface-border/60 px-1 py-1.5 text-center transition-colors last:border-r-0',
                            access[p] ? 'bg-primary/5' : 'bg-transparent',
                        )}
                    >
                        <div className="flex justify-center">
                            <Checkbox
                                className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5 rounded transition-all active:scale-90"
                                checked={access[p] || false}
                                onCheckedChange={(checked) => onToggle(module.id, p, !!checked)}
                            />
                        </div>
                    </td>
                ))}
                <td className="bg-surface-muted/20 group-hover:bg-surface-muted/40 border-l border-surface-border/60 px-1 py-1.5 text-center transition-all">
                    <div className="flex justify-center">
                        <Checkbox
                            className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5 rounded transition-all active:scale-90"
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
            <div className="bg-primary/5 text-primary ring-primary/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-sm font-normal  ring-1">
                {index + 1}
            </div>
            <div
                {...listeners}
                {...attributes}
                className="text-text-main hover:bg-primary/10 hover:text-primary cursor-grab rounded-lg p-1.5 transition-colors active:cursor-grabbing"
            >
                <GripVertical size={16} />
            </div>
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
                <button
                    type="button"
                    disabled={index === 0}
                    onClick={onMoveUp}
                    className="text-text-main hover:text-primary hover:bg-primary/10 rounded p-0.5 transition-all disabled:opacity-20"
                >
                    <ArrowUp size={12} />
                </button>
                <button
                    type="button"
                    disabled={index === total - 1}
                    onClick={onMoveDown}
                    className="text-text-main hover:text-primary hover:bg-primary/10 rounded p-0.5 transition-all disabled:opacity-20"
                >
                    <ArrowDown size={12} />
                </button>
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {module.icon &&
                        SELECTABLE_ICONS[module.icon] &&
                        React.createElement(SELECTABLE_ICONS[module.icon], {
                            size: 13,
                            className: 'text-text-main/70 shrink-0',
                        })}
                    <p className="text-text-main truncate text-xs font-semibold">{module.name}</p>
                </div>
                <p className="text-text-desc/60 mt-0.5 truncate font-mono text-[9px] font-normal">{module.route || 'SYSTEM_INTERNAL'}</p>
                {module.description && (
                    <p className="text-text-desc/70 mt-0.5 truncate text-[10px] font-normal">{module.description}</p>
                )}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="text-text-main hover:bg-primary/10 hover:text-primary rounded-lg p-1.5 transition-all active:scale-90"
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
                className="text-text-main hover:bg-primary/10 hover:text-primary rounded-lg p-1.5 transition-all active:scale-90"
                title="Edit Nama/Path Modul"
            >
                <Edit2 size={13} />
            </button>
            <button
                onClick={() => onRemove(module.id)}
                className="text-text-main rounded-lg p-1.5 transition-all hover:bg-rose-500/10 hover:text-rose-500 active:scale-90"
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
                    <div className="bg-foreground text-background flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sm font-normal  shadow-sm">
                        {index + 1}
                    </div>
                    <div
                        {...listeners}
                        {...attributes}
                        onClick={(e) => e.stopPropagation()}
                        className="text-text-main hover:bg-primary/10 hover:text-primary cursor-grab rounded-xl p-2 active:cursor-grabbing"
                    >
                        <GripVertical size={16} />
                    </div>
                    {/* Reorder Group buttons */}
                    <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            disabled={index === 0}
                            onClick={onMoveGroupUp}
                            className="text-text-main hover:text-primary hover:bg-primary/10 flex items-center justify-center rounded p-0.5 transition-all disabled:opacity-20"
                        >
                            <ArrowUp size={10} />
                        </button>
                        <button
                            type="button"
                            disabled={index === total - 1}
                            onClick={onMoveGroupDown}
                            className="text-text-main hover:text-primary hover:bg-primary/10 flex items-center justify-center rounded p-0.5 transition-all disabled:opacity-20"
                        >
                            <ArrowDown size={10} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-foreground text-sm font-normal ">{group.name}</h3>
                        <span className="bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-xs font-normal shadow-sm">
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
                                    className="bg-primary/5 hover:bg-primary/10 text-text-main hover:text-primary border-surface-border/40 flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-sm font-normal  transition-all"
                                    title="Pindah ke urutan"
                                    style={{ background: 'transparent' }}
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
                                            targetIdx === index && 'font-normal text-primary',
                                        )}
                                    >
                                        <span className="bg-foreground/10 flex h-4 w-4 shrink-0 items-center justify-center rounded text-sm font-normal ">
                                            {targetIdx + 1}
                                        </span>
                                        {groups[targetIdx]?.name ?? `Grup ${targetIdx + 1}`}
                                        {targetIdx === index && (
                                            <span className="text-primary ml-auto text-sm font-normal ">sekarang</span>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronDown 
                            size={14} 
                            className={cn("text-text-main transition-transform duration-300 ml-1", isExpanded ? "rotate-180" : "rotate-0")} 
                        />
                    </div>
                </div>
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onEditGroup(group)}>
                        <Edit2 size={12} className="text-text-main" />
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
                                <span className="text-muted-foreground/60 text-xs font-medium ">Drop module here</span>
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
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-surface-border pb-1.5 min-h-[30px]">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-main">Repository Modul</h3>
                <div className="flex items-center gap-1.5">
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{modules.length} Modul</span>
                    <button
                        type="button"
                        onClick={onAddModule}
                        className="text-primary hover:bg-primary/10 border-primary/30 flex h-6 w-6 items-center justify-center rounded-lg border text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        title="Tambah Modul Baru"
                    >
                        <Plus size={12} />
                    </button>
                </div>
            </div>
            <div ref={setNodeRef} className="h-[calc(100vh-270px)] min-h-[350px] overflow-y-auto scrollbar-hide space-y-1.5 p-2 border border-surface-border rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col">
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
                        <Layers className="text-text-main mb-2" size={32} strokeWidth={1} />
                        <p className="text-text-main text-sm font-normal  ">Kosong</p>
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
                'group border-surface-border/60 bg-card hover:border-surface-border flex items-center justify-between rounded-lg border p-3 transition-all',
                isDragging && 'border-primary ring-primary/10 z-50 scale-[1.02] opacity-50 shadow-2xl ring-2',
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div
                    {...listeners}
                    {...attributes}
                    className="text-text-main hover:bg-primary/10 hover:text-primary shrink-0 cursor-grab rounded-lg p-2 transition-colors"
                >
                    <GripVertical size={16} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        {module.icon &&
                            SELECTABLE_ICONS[module.icon] &&
                            React.createElement(SELECTABLE_ICONS[module.icon], {
                                size: 13,
                                className: 'text-text-main/70 shrink-0',
                            })}
                        <span className="text-text-main block truncate text-xs font-semibold">{module.name}</span>
                    </div>
                    <span className="text-text-desc/60 mt-0.5 block truncate font-mono text-[9px] font-normal">
                        {module.route || 'NO_PATH'}
                    </span>
                    {module.description && (
                        <p className="text-text-desc/70 mt-0.5 truncate text-[10px] font-normal">
                            {module.description}
                        </p>
                    )}
                </div>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-1">
                <button
                    onClick={() => onEditModule(module)}
                    className="text-text-main hover:text-primary hover:bg-primary/10 rounded-lg p-1.5 active:scale-90"
                    title="Edit Nama/Path Modul"
                >
                    <Edit2 size={13} />
                </button>
                <button
                    onClick={() => onDeleteModule(module.id)}
                    className="text-text-main rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-500 active:scale-90"
                    title="Hapus Modul Permanen"
                >
                    <Trash2 size={14} />
                </button>
                <button
                    onClick={() => onQuickAdd(module)}
                    className="text-text-main hover:text-primary hover:bg-primary/10 rounded-lg p-1.5 active:scale-90"
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
        <>
            <Head title={activeTab === 'access' ? 'Pemetaan Hak Akses' : 'Pemetaan Navigasi'} />

            <div className="flex flex-col gap-4 p-6 w-full font-sans antialiased text-text-main">
                {/* Unified Card Header & Table Container */}
                <div className="border border-surface-border rounded-xl bg-card overflow-hidden">
                    {/* Top Unified Toolbar with Primary Blue Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-primary text-white dark:bg-zinc-800/95 border-b border-primary/20">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.history.back()}
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 transition-all text-primary shrink-0 cursor-pointer shadow-xs"
                                title="Kembali"
                            >
                                <ArrowLeft size={15} />
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span>{activeTab === 'access' ? 'Pemetaan Hak Akses' : 'Pemetaan Navigasi'}</span>
                                    <span className="text-[10px] font-bold text-primary bg-white px-2 py-0.5 rounded-full shadow-xs">
                                        Role: {role.name}
                                    </span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
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
                                <SelectTrigger className="bg-white/10 hover:bg-white/20 border-white/20 h-8 w-[180px] rounded-lg px-2.5 text-xs font-semibold text-white">
                                    <div className="flex items-center gap-1.5 truncate text-white">
                                        <ShieldAlert className="text-white h-3.5 w-3.5 shrink-0" />
                                        <SelectValue placeholder="Pilih Role" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="w-[180px] rounded-lg p-1 shadow-md">
                                    {roles.map((r) => (
                                        <SelectItem
                                            key={r.id}
                                            value={r.id}
                                            className="cursor-pointer rounded-md pl-2 pr-2 py-1 text-xs font-medium"
                                        >
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Mapping Type Switcher */}
                            {!isIndependent && (
                                <div className="bg-black/20 flex rounded-lg p-0.5 border border-white/10">
                                    <button
                                        onClick={() => setActiveTab('access')}
                                        type="button"
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-bold transition-all cursor-pointer',
                                            activeTab === 'access'
                                                ? 'bg-white text-primary shadow-xs'
                                                : 'text-white/80 hover:text-white hover:bg-white/10',
                                        )}
                                    >
                                        <Key size={12} /> Hak Akses
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('navigation')}
                                        type="button"
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-bold transition-all cursor-pointer',
                                            activeTab === 'navigation'
                                                ? 'bg-white text-primary shadow-xs'
                                                : 'text-white/80 hover:text-white hover:bg-white/10',
                                        )}
                                    >
                                        <LayoutGrid size={12} /> Navigasi
                                    </button>
                                </div>
                            )}

                            {/* Access Quick Controls */}
                            {activeTab === 'access' && (
                                <div className="bg-black/20 flex rounded-lg p-0.5 border border-white/10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2.5 rounded-md text-[11px] font-bold text-white hover:bg-white/20 hover:text-white cursor-pointer"
                                        onClick={() => setAll(true)}
                                    >
                                        <CheckSquare className="mr-1 h-3 w-3" /> Pilih Semua
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2.5 rounded-md text-[11px] font-bold text-white hover:bg-white/20 hover:text-white cursor-pointer"
                                        onClick={() => setAll(false)}
                                    >
                                        <Square className="mr-1 h-3 w-3" /> Bersihkan
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant="primary"
                                onClick={activeTab === 'access' ? handleAccessSubmit : handleNavSave}
                                disabled={accessForm.processing || isSavingNav}
                                className="h-8 rounded-lg px-4 text-xs font-bold shadow-xs bg-white text-primary hover:bg-white/90 border border-white"
                            >
                                {accessForm.processing || isSavingNav ? (
                                    <Loader2 size={13} className="animate-spin text-primary" />
                                ) : (
                                    <div className="flex items-center gap-1.5 text-primary font-bold">
                                        <Save size={13} />
                                        <span>Simpan</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Table Area */}
                    {activeTab === 'access' ? (
                        <div className="scrollbar-hide overflow-x-auto">
                            <table className="w-full min-w-[800px] border-collapse text-left">
                                    <thead className="bg-primary text-white dark:bg-zinc-800/90 select-none">
                                        <tr className="border-b border-primary/20 dark:border-zinc-700/80 bg-primary text-white dark:bg-zinc-800/90 select-none">
                                            <th className="border-r border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 sticky left-0 z-30 min-w-[200px] px-3 py-2 text-left text-[11px] font-bold uppercase">
                                                Scope Modul
                                            </th>
                                            {PERMISSIONS.map((p) => {
                                                const isAllChecked = accessForm.data.accesses.every((a) => (a as any)[p]);
                                                return (
                                                    <th
                                                        key={p}
                                                        className="border-r border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 w-16 min-w-[60px] px-0.5 py-1.5 text-center text-[10px] font-bold uppercase last:border-r-0"
                                                    >
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <span className="truncate max-w-[55px]">{permissionLabels[p]}</span>
                                                            <Checkbox
                                                                className="border-white/50 dark:border-zinc-500 data-[state=checked]:bg-white data-[state=checked]:text-primary h-3.5 w-3.5 rounded transition-all active:scale-90"
                                                                checked={isAllChecked}
                                                                onCheckedChange={(checked) => setColumn(p, !!checked)}
                                                            />
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                            <th className="border-l border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 w-12 min-w-[48px] px-0.5 py-1.5 text-center text-[10px] font-bold uppercase">
                                                Full
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-border">
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
                                                    <tr className="border-y border-surface-border bg-slate-100/80 dark:bg-zinc-800/60 transition-colors">
                                                         <td className="bg-slate-100/90 dark:bg-zinc-800/80 border-r border-surface-border sticky left-0 z-10 px-3 py-1.5">
                                                             <div className="flex items-center gap-2">
                                                                 <div className="bg-primary/10 text-primary rounded-md p-1">
                                                                     <LayoutGrid className="h-3 w-3" />
                                                                 </div>
                                                                 <span className="text-text-main text-xs font-extrabold uppercase tracking-wide">
                                                                     {group.name}
                                                                 </span>
                                                             </div>
                                                         </td>
                                                         {PERMISSIONS.map((p) => {
                                                             const isGroupColumnChecked = groupAccesses.every((a) => (a as any)[p]);
                                                             return (
                                                                 <td
                                                                     key={p}
                                                                     className="border-r border-surface-border px-1 py-1.5 text-center transition-colors"
                                                                 >
                                                                     <div className="flex justify-center">
                                                                         <Checkbox
                                                                             className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5 rounded transition-all active:scale-90"
                                                                             checked={isGroupColumnChecked}
                                                                             onCheckedChange={(checked) => setGroupColumn(groupId, p, !!checked)}
                                                                         />
                                                                     </div>
                                                                 </td>
                                                             );
                                                         })}
                                                         <td className="bg-slate-100/50 dark:bg-zinc-800/50 border-l border-surface-border px-1 py-1.5 text-center">
                                                            <div className="flex justify-center">
                                                                <Checkbox
                                                                    className="border-surface-border data-[state=checked]:bg-primary data-[state=checked]:border-primary h-3.5 w-3.5 rounded-md border transition-all active:scale-90"
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
            ) : (
                <div className="p-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                            {/* COLUMN 1: Module Groups (col-span-3) */}
                            <div className="col-span-12 lg:col-span-3 flex flex-col gap-2">
                                <div className="flex items-center justify-between border-b border-surface-border pb-1.5 min-h-[30px]">
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-main">Grup Menu</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{navItems.length} Grup</span>
                                        <button
                                            type="button"
                                            onClick={() => openGroupModal()}
                                            className="text-primary hover:bg-primary/10 border-primary/30 flex h-6 w-6 items-center justify-center rounded-lg border text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                            title="Tambah Grup Menu"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="h-[calc(100vh-270px)] min-h-[350px] overflow-y-auto scrollbar-hide space-y-1.5 p-2 border border-surface-border rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col">
                                    {navItems.map((group, index) => (
                                        <div
                                            key={group.id}
                                            onClick={() => setSelectedGroupId(group.id)}
                                            className={cn(
                                                "p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between group min-h-[46px]",
                                                selectedGroupId === group.id
                                                    ? "border-primary bg-primary/10 text-primary shadow-xs font-bold"
                                                    : "border-surface-border/80 hover:bg-white dark:hover:bg-zinc-800 bg-white dark:bg-zinc-900 text-text-main"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="font-normal text-xs shrink-0 opacity-55">{index + 1}</span>
                                                {group.icon && SELECTABLE_ICONS[group.icon] && (
                                                    <div className={cn(
                                                        "flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                                                        selectedGroupId === group.id ? "bg-primary/20 text-primary" : "bg-foreground/8 text-text-main"
                                                    )}>
                                                        {React.createElement(SELECTABLE_ICONS[group.icon], { size: 13 })}
                                                    </div>
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-normal truncate">{group.name}</span>
                                                    <span className={cn(
                                                        "text-[10px] font-normal mt-0.5",
                                                        selectedGroupId === group.id ? "text-primary/75" : "text-text-main"
                                                    )}>
                                                        {group.modules.length} Modul Terdaftar
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="bg-foreground/5 text-text-main text-[9px] font-normal px-1.5 py-0.5 rounded-md group-hover:bg-primary/10">
                                                    {group.modules.length}
                                                </span>
                                                {/* Reorder actions and inline crud */}
                                                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        disabled={index === 0}
                                                        onClick={() => handleMoveGroup(index, 'up')}
                                                        className="text-text-main hover:text-primary disabled:opacity-10"
                                                        title="Pindahkan ke atas"
                                                    >
                                                        <ArrowUp size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={index === navItems.length - 1}
                                                        onClick={() => handleMoveGroup(index, 'down')}
                                                        className="text-text-main hover:text-primary disabled:opacity-10"
                                                        title="Pindahkan ke bawah"
                                                    >
                                                        <ArrowDown size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openGroupModal(group)}
                                                        className="text-text-main hover:text-primary"
                                                        title="Ubah Grup"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteGroup(group.id)}
                                                        className="text-rose-500 hover:text-rose-600"
                                                        title="Hapus Grup"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {navItems.length === 0 && (
                                        <div className="border border-dashed border-surface-border rounded-xl p-4 text-center text-text-main text-xs">
                                            Belum ada grup menu
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COLUMN 2: List Module in Selected Group (col-span-5) */}
                            <div className="col-span-12 lg:col-span-5 flex flex-col gap-2">
                                {(() => {
                                    const selectedGroup = navItems.find((g) => g.id === selectedGroupId) || navItems[0];
                                    if (!selectedGroup) {
                                        return (
                                            <div className="border border-dashed border-surface-border rounded-xl p-8 text-center text-text-main text-xs">
                                                Silakan pilih atau buat grup menu terlebih dahulu.
                                            </div>
                                        );
                                    }
                                    return (
                                        <>
                                            <div className="flex items-center justify-between border-b border-surface-border pb-1.5 min-h-[30px]">
                                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-main truncate max-w-[280px]">
                                                    Modul Terdaftar ({selectedGroup.name})
                                                </h3>
                                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {selectedGroup.modules.length} Modul
                                                </span>
                                            </div>
                                            <div className="h-[calc(100vh-270px)] min-h-[350px] overflow-y-auto scrollbar-hide space-y-1.5 p-2 border border-surface-border rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col">
                                                <SortableContext id={'context-' + selectedGroup.id} items={selectedGroup.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                                                    {selectedGroup.modules.map((module, mIdx) => (
                                                        <SortableModuleItem
                                                            key={module.id}
                                                            module={module}
                                                            onRemove={handleRemoveModule}
                                                            index={mIdx}
                                                            total={selectedGroup.modules.length}
                                                            onMoveUp={() => handleMoveModuleIndex(selectedGroup.id, mIdx, 'up')}
                                                            onMoveDown={() => handleMoveModuleIndex(selectedGroup.id, mIdx, 'down')}
                                                            onEditModule={openModuleModal}
                                                            onMoveToGroup={handleMoveModuleToGroup}
                                                            groups={navItems}
                                                        />
                                                    ))}
                                                </SortableContext>
                                                {selectedGroup.modules.length === 0 && (
                                                    <div className="border border-dashed border-surface-border/60 rounded-lg p-6 text-center text-text-main text-xs italic">
                                                        Belum ada modul di grup ini.
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* COLUMN 3: Available Modules (col-span-4) */}
                            <div className="col-span-12 lg:sticky lg:top-6 lg:col-span-4">
                                <AvailableListContainer
                                    modules={availableModules}
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
            </div>

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
            </div>
        </>
    );
}
