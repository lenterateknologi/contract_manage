import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { ManagementForm, FormSection } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { cn } from '@/lib/utils';
import { 
    ShieldCheck, 
    LayoutGrid, 
    CheckSquare, 
    Square, 
    ShieldAlert, 
    Key, 
    GripVertical, 
    Trash2, 
    Plus, 
    Layers 
} from 'lucide-react';
import {
    defaultDropAnimationSideEffects,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    rectIntersection,
    UniqueIdentifier,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    useSortable, 
    verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Shared Constants & Types ---
const PERMISSIONS = ['can_read', 'can_create', 'can_update', 'can_delete', 'can_approve', 'can_bulk_approve', 'can_bulk_delete'] as const;
type Permission = typeof PERMISSIONS[number];

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
    modules: Module[];
    navigation: Group[];
    allModules: Module[];
    defaultTab: 'access' | 'navigation';
}

// --- ACCESS TAB COMPONENTS ---
const ModuleRow = React.memo(({ 
    module, 
    access, 
    onToggle, 
    onSetRow 
}: { 
    module: any; 
    access: any; 
    onToggle: (moduleId: string, permission: Permission, checked: boolean) => void;
    onSetRow: (moduleId: string, checked: boolean) => void;
}) => {
    const isRowAllChecked = PERMISSIONS.every(p => access[p]);

    return (
        <tr className={cn(
            "border-b border-primary/5 dark:border-white/5 last:border-b-0 hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] group",
            "content-visibility-auto contain-intrinsic-size-[auto_60px]" // Native Virtualization
        )}>
            <td className="px-5 py-4 border-r border-primary/5 dark:border-white/5 bg-white dark:bg-background sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col">
                    <span className="font-black text-primary dark:text-white uppercase tracking-tight text-[11px] leading-none mb-1">{module.name}</span>
                    <span className="text-[9px] font-mono text-primary/30 dark:text-white/30 uppercase tracking-wider">{module.identifier}</span>
                </div>
            </td>
            {PERMISSIONS.map(p => (
                <td key={p} className={cn(
                    "px-2 py-4 text-center border-r border-primary/5 dark:border-white/5 last:border-r-0",
                    access[p] ? "bg-primary/[0.03] dark:bg-white/[0.03]" : "bg-transparent"
                )}>
                    <div className="flex justify-center">
                        <Checkbox
                            className="h-5 w-5 rounded-md border-primary/20 dark:border-white/20 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white data-[state=checked]:border-primary dark:data-[state=checked]:border-white data-[state=checked]:text-white dark:data-[state=checked]:text-black transition-transform active:scale-90"
                            checked={access[p] || false}
                            onCheckedChange={(checked) => onToggle(module.id, p, checked as boolean)}
                        />
                    </div>
                </td>
            ))}
            <td className="px-2 py-4 text-center bg-primary/[0.05] dark:bg-white/[0.05] group-hover:bg-primary/[0.1] dark:group-hover:bg-white/[0.1] border-l border-primary/10 dark:border-white/10">
                <div className="flex justify-center">
                    <Checkbox 
                        className="h-5 w-5 rounded-md border-primary/30 dark:border-white/30 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white data-[state=checked]:border-primary dark:data-[state=checked]:border-white data-[state=checked]:text-white dark:data-[state=checked]:text-black transition-transform active:scale-90"
                        checked={!!isRowAllChecked}
                        onCheckedChange={(checked) => onSetRow(module.id, !!checked)}
                    />
                </div>
            </td>
        </tr>
    );
});

// --- NAVIGATION TAB COMPONENTS ---
const SortableModuleItem = ({ module, onRemove }: { module: Module; onRemove: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id, data: { type: 'module', module } });
    const style = { transform: CSS.Translate.toString(transform), transition };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group flex items-center gap-3 border border-primary/5 dark:border-white/5 bg-white dark:bg-white/[0.02] p-3 rounded-xl transition-all hover:border-primary/20 dark:hover:border-white/20 shadow-sm',
                isDragging && 'z-50 scale-[1.02] border-primary dark:border-white opacity-50 ring-2 ring-primary/10 shadow-2xl',
            )}
        >
            <div
                {...listeners}
                {...attributes}
                className="cursor-grab p-1.5 rounded-lg text-primary/30 dark:text-white/30 transition-colors hover:bg-primary/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white active:cursor-grabbing"
            >
                <GripVertical size={14} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-black text-primary dark:text-white uppercase tracking-tight">{module.name}</p>
                <p className="mt-0.5 truncate text-[9px] font-bold text-primary/30 dark:text-white/30 uppercase tracking-[0.1em]">{module.route || 'SYSTEM_INTERNAL'}</p>
            </div>
            <button
                onClick={() => onRemove(module.id)}
                className="p-1.5 rounded-lg text-primary/20 dark:text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/5 active:scale-90"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
};

const SortableGroupItem = ({ group, onRemoveModule }: { group: Group; onRemoveModule: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id, data: { type: 'group', group } });
    const style = { transform: CSS.Translate.toString(transform), transition };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'overflow-hidden border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] rounded-2xl transition-all shadow-sm',
                isDragging && 'z-40 border-primary dark:border-white opacity-50 ring-2 ring-primary/5 shadow-2xl',
            )}
        >
            <div className="flex items-center justify-between border-b border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.05] p-4">
                <div className="flex items-center gap-3">
                    <div {...listeners} {...attributes} className="cursor-grab p-2 rounded-xl text-primary/30 dark:text-white/30 hover:bg-primary/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white active:cursor-grabbing">
                        <GripVertical size={16} />
                    </div>
                    <div>
                        <h3 className="flex items-center gap-3 text-[11px] font-black text-primary dark:text-white uppercase tracking-[0.2em]">
                            {group.name}
                            <span className="bg-primary dark:bg-white px-2.5 py-1 text-[9px] font-black text-white dark:text-black rounded-lg tracking-tighter shadow-sm">
                                {group.modules.length} UNITS
                            </span>
                        </h3>
                    </div>
                </div>
            </div>
            <div className="min-h-[80px] space-y-3 p-4">
                <SortableContext id={'context-' + group.id} items={group.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {group.modules.map((module) => (
                        <SortableModuleItem key={module.id} module={module} onRemove={onRemoveModule} />
                    ))}
                </SortableContext>
                {group.modules.length === 0 && (
                    <div className="flex flex-col items-center justify-center border border-dashed border-primary/10 dark:border-white/10 bg-primary/[0.01] dark:bg-white/[0.01] py-10 rounded-xl">
                        <span className="text-[9px] font-black tracking-[0.3em] text-primary/20 dark:text-white/20 uppercase italic">Drop module here</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const AvailableListContainer = ({ modules, onQuickAdd }: { modules: Module[]; onQuickAdd: (m: Module) => void }) => {
    const { setNodeRef } = useDroppable({ id: 'available-list' });
    return (
        <div ref={setNodeRef} className="col-span-12 flex h-[calc(100vh-320px)] flex-col overflow-hidden border border-primary/10 dark:border-white/10 bg-white dark:bg-background rounded-2xl shadow-xl lg:col-span-4 sticky top-6">
            <div className="flex shrink-0 items-center justify-between border-b border-primary/5 dark:border-white/5 bg-primary/[0.02] dark:bg-white/[0.02] p-5">
                <div className="flex items-center gap-3">
                    <h2 className="text-[10px] font-black tracking-[0.2em] text-primary dark:text-white uppercase">Repository</h2>
                </div>
                <span className="bg-primary/10 dark:bg-white/10 px-2.5 py-1 text-[9px] font-black text-primary dark:text-white rounded-lg tracking-[0.1em] uppercase shadow-sm">
                    {modules.length} UNITS
                </span>
            </div>
            <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto p-5 bg-primary/[0.01] dark:bg-white/[0.01]">
                <SortableContext id="available-context" items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {modules.map((module) => (
                        <AvailableModuleItem key={module.id} module={module} onQuickAdd={onQuickAdd} />
                    ))}
                </SortableContext>
                {modules.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 py-24 text-center opacity-20">
                        <Layers className="mb-6" size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase">Empty</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AvailableModuleItem = ({ module, onQuickAdd }: { module: Module; onQuickAdd: (m: Module) => void }) => {
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
                'group flex items-center justify-between border border-primary/5 dark:border-white/5 bg-white dark:bg-white/[0.03] p-4 rounded-xl transition-all hover:border-primary/30 dark:hover:border-white/30 hover:shadow-md',
                isDragging && 'z-50 scale-[1.02] border-primary dark:border-white opacity-50 shadow-2xl ring-2 ring-primary/10',
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div {...listeners} {...attributes} className="shrink-0 cursor-grab p-2 rounded-lg text-primary/20 dark:text-white/20 hover:bg-primary/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white transition-colors">
                    <GripVertical size={14} />
                </div>
                <div className="min-w-0">
                    <span className="block truncate text-[11px] font-black text-primary dark:text-white uppercase tracking-tight">{module.name}</span>
                    <span className="mt-0.5 block truncate text-[9px] font-bold text-primary/30 dark:text-white/30 uppercase tracking-[0.1em]">
                        {module.route || 'NO_PATH'}
                    </span>
                </div>
            </div>
            <button
                onClick={() => onQuickAdd(module)}
                className="ml-2 p-2 rounded-lg text-primary/20 dark:text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:text-primary dark:hover:text-white hover:bg-primary/10 dark:hover:bg-white/10 active:scale-90"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function RoleConfig({ role, modules, navigation, allModules, defaultTab }: Props) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'access' | 'navigation'>(defaultTab);

    // Access Matrix Form
    const accessForm = useForm({
        accesses: modules.map(module => ({
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

    const handleAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        accessForm.post(`/admin/roles/${role.id}/access`, {
            onSuccess: () => showToast("Hak akses role berhasil diperbarui.", "success"),
            onError: () => showToast("Gagal menyimpan hak akses.", "danger")
        });
    };

    const updateAccess = (moduleId: string, permission: Permission, checked: boolean) => {
        accessForm.setData('accesses', accessForm.data.accesses.map(access => {
            if (access.module_id === moduleId) {
                const newAccess = { ...access, [permission]: checked };
                if (checked && permission !== 'can_read') newAccess.can_read = true;
                if (permission === 'can_read' && !checked) {
                    PERMISSIONS.forEach(p => { (newAccess as any)[p] = false; });
                }
                return newAccess;
            }
            return access;
        }));
    };

    const setAll = (checked: boolean) => {
        accessForm.setData('accesses', accessForm.data.accesses.map(access => {
            const newAccess = { ...access };
            PERMISSIONS.forEach(p => { (newAccess as any)[p] = checked; });
            return newAccess;
        }));
    };

    const setColumn = (permission: Permission, checked: boolean) => {
        accessForm.setData('accesses', accessForm.data.accesses.map(access => {
            const newAccess = { ...access, [permission]: checked };
            if (checked && permission !== 'can_read') newAccess.can_read = true;
            if (permission === 'can_read' && !checked) {
                PERMISSIONS.forEach(p => { (newAccess as any)[p] = false; });
            }
            return newAccess;
        }));
    };

    const setGroupColumn = (groupId: string, permission: Permission, checked: boolean) => {
        const groupModuleIds = modules.filter(m => m.module_group_id === groupId).map(m => m.id);
        accessForm.setData('accesses', accessForm.data.accesses.map(access => {
            if (groupModuleIds.includes(access.module_id)) {
                const newAccess = { ...access, [permission]: checked };
                if (checked && permission !== 'can_read') newAccess.can_read = true;
                if (permission === 'can_read' && !checked) {
                    PERMISSIONS.forEach(p => { (newAccess as any)[p] = false; });
                }
                return newAccess;
            }
            return access;
        }));
    };

    const setRow = (moduleId: string, checked: boolean) => {
        accessForm.setData('accesses', accessForm.data.accesses.map(access => {
            if (access.module_id === moduleId) {
                const newAccess = { ...access };
                PERMISSIONS.forEach(p => { (newAccess as any)[p] = checked; });
                return newAccess;
            }
            return access;
        }));
    };

    const groupedModules = useMemo(() => {
        return modules.reduce((acc, module) => {
            const groupId = module.module_group_id || 'other';
            const groupName = module.identifier?.split('_')[0] || 'Lainnya'; // Fallback logic
            if (!acc[groupId]) acc[groupId] = { name: groupName, modules: [] };
            acc[groupId].modules.push(module);
            return acc;
        }, {} as Record<string, { name: string; modules: typeof modules }>);
    }, [modules]);

    // --- Navigation States & Handlers ---
    const [navItems, setNavItems] = useState<Group[]>(navigation);
    const [availableModules, setAvailableModules] = useState<Module[]>(() => {
        const activeModuleIds = new Set(navigation.flatMap((g) => g.modules.map((m) => m.id)));
        return allModules.filter((m) => !activeModuleIds.has(m.id));
    });
    const itemsRef = useRef(navItems);
    const availableModulesRef = useRef(availableModules);
    const isMoving = useRef(false);
    const lastOverId = useRef<UniqueIdentifier | null>(null);

    useEffect(() => { itemsRef.current = navItems; }, [navItems]);
    useEffect(() => { availableModulesRef.current = availableModules; }, [availableModules]);

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [activeType, setActiveType] = useState<any>(null);
    const [isSavingNav, setIsSavingNav] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleRemoveModule = (moduleId: string) => {
        let removedModule: Module | null = null;
        const newItems = navItems.map((group) => {
            const mod = group.modules.find((m) => m.id === moduleId);
            if (mod) removedModule = mod;
            return { ...group, modules: group.modules.filter((m) => m.id !== moduleId) };
        });
        if (removedModule) {
            setNavItems(newItems);
            setAvailableModules((prev) => [...prev, removedModule!]);
        }
    };

    const handleQuickAdd = (module: Module) => {
        if (navItems.length === 0) return;
        setAvailableModules((prev) => prev.filter((m) => m.id !== module.id));
        setNavItems((prev) => {
            const newItems = [...prev];
            newItems[0] = { ...newItems[0], modules: [...newItems[0].modules, { ...module, module_group_id: newItems[0].id }] };
            return newItems;
        });
    };

    const handleDragStart = (e: DragStartEvent) => {
        setActiveId(e.active.id);
        setActiveType(e.active.data.current?.type);
    };

    const handleDragOver = (e: DragOverEvent) => {
        const { active, over } = e;
        if (!over || isMoving.current || lastOverId.current === over.id) return;
        lastOverId.current = over.id;
        if (activeType === 'group' || active.id === over.id) return;
        let activeContainerIdx = -1, activeModule: Module | null = null;
        const inAvailableIdx = availableModulesRef.current.findIndex((m) => m.id === active.id);
        if (inAvailableIdx !== -1) {
            activeContainerIdx = -2;
            activeModule = availableModulesRef.current[inAvailableIdx];
        } else {
            for (let i = 0; i < itemsRef.current.length; i++) {
                const idx = itemsRef.current[i].modules.findIndex((m) => m.id === active.id);
                if (idx !== -1) {
                    activeContainerIdx = i;
                    activeModule = itemsRef.current[i].modules[idx];
                    break;
                }
            }
        }
        if (!activeModule) return;
        let overContainerIdx = itemsRef.current.findIndex((g) => g.id === over.id || g.modules.some((m) => m.id === over.id));
        if (overContainerIdx === -1 && (over.id === 'available-list' || availableModulesRef.current.some((m) => m.id === over.id)))
            overContainerIdx = -2;
        if (overContainerIdx === -1 || activeContainerIdx === overContainerIdx) return;
        isMoving.current = true;
        setTimeout(() => { isMoving.current = false; }, 40);
        if (activeContainerIdx === -2) {
            const newAvailable = availableModulesRef.current.filter((m) => m.id !== active.id);
            setAvailableModules(newAvailable);
            availableModulesRef.current = newAvailable;
            setNavItems((prev) => {
                const next = [...prev],
                    targetModules = [...next[overContainerIdx].modules],
                    overIdx = targetModules.findIndex((m) => m.id === over.id);
                targetModules.splice(overIdx === -1 ? targetModules.length : overIdx, 0, { ...activeModule!, module_group_id: next[overContainerIdx].id });
                next[overContainerIdx].modules = targetModules;
                itemsRef.current = next;
                return next;
            });
        } else if (overContainerIdx === -2) {
            const next = itemsRef.current.map((g, i) => i === activeContainerIdx ? { ...g, modules: g.modules.filter((m) => m.id !== active.id) } : g);
            setNavItems(next);
            itemsRef.current = next;
            const newAvailable = [...availableModulesRef.current, activeModule!];
            setAvailableModules(newAvailable);
            availableModulesRef.current = newAvailable;
        } else {
            setNavItems((prev) => {
                const next = [...prev];
                next[activeContainerIdx] = { ...next[activeContainerIdx], modules: next[activeContainerIdx].modules.filter((m) => m.id !== active.id) };
                const targetModules = [...next[overContainerIdx].modules],
                    overIdx = targetModules.findIndex((m) => m.id === over.id);
                targetModules.splice(overIdx === -1 ? targetModules.length : overIdx, 0, { ...activeModule!, module_group_id: next[overContainerIdx].id });
                next[overContainerIdx].modules = targetModules;
                itemsRef.current = next;
                return next;
            });
        }
    };

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveId(null);
        setActiveType(null);
        if (!over) return;
        if (activeType === 'group') {
            if (active.id !== over.id)
                setNavItems((prev) => arrayMove(prev, prev.findIndex((i) => i.id === active.id), prev.findIndex((i) => i.id === over.id)));
        } else {
            const inAvailable = availableModules.some((m) => m.id === active.id);
            if (inAvailable) {
                const oldIdx = availableModules.findIndex((m) => m.id === active.id),
                    newIdx = availableModules.findIndex((m) => m.id === over.id);
                if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) setAvailableModules((prev) => arrayMove(prev, oldIdx, newIdx));
            } else {
                const cIdx = navItems.findIndex((g) => g.modules.some((m) => m.id === active.id));
                if (cIdx !== -1) {
                    const mods = navItems[cIdx].modules,
                        oldIdx = mods.findIndex((m) => m.id === active.id),
                        newIdx = mods.findIndex((m) => m.id === over.id);
                    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx)
                        setNavItems((prev) => {
                            const next = [...prev];
                            next[cIdx] = { ...next[cIdx], modules: arrayMove(mods, oldIdx, newIdx) };
                            return next;
                        });
                }
            }
        }
    };

    const handleNavSave = () => {
        setIsSavingNav(true);
        const data = navItems.map((g, gIdx) => ({
            id: g.id,
            sequence: gIdx + 1,
            modules: g.modules.map((m, mIdx) => ({ id: m.id, sequence: mIdx + 1 })),
        }));
        router.post(`/admin/roles/${role.id}/reorder`, { role_id: role.id, groups: data }, {
            onSuccess: () => {
                setIsSavingNav(false);
                showToast('Struktur navigasi role diperbarui.', 'success');
            },
            onError: () => {
                setIsSavingNav(false);
                showToast('Gagal menyimpan navigasi.', 'danger');
            },
        });
    };

    return (
        <ManagementForm
            title={`Konfigurasi Role: ${role.name}`}
            subtitle="Pusat pengaturan otoritas dan arsitektur menu"
            onClose={() => window.history.back()}
            onSave={activeTab === 'access' ? handleAccessSubmit : handleNavSave}
            processing={accessForm.processing || isSavingNav}
            isDirty={accessForm.isDirty || true}
            isEdit={true}
            headerActions={
                <div className="flex items-center">
                    {/* Utility Buttons Container - Conditional with fixed height/behavior to prevent jump */}
                    <div className="flex items-center transition-all duration-300 mr-4">
                        {activeTab === 'access' ? (
                            <div className="flex bg-primary/5 dark:bg-white/5 p-1 rounded-xl border border-primary/10 dark:border-white/10 animate-in fade-in slide-in-from-right-2 duration-300">
                                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg transition-all" onClick={() => setAll(true)}>
                                    <CheckSquare className="h-3 w-3 mr-1.5" /> Pilih Semua
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg transition-all" onClick={() => setAll(false)}>
                                    <Square className="h-3 w-3 mr-1.5" /> Bersihkan
                                </Button>
                            </div>
                        ) : (
                            <div className="h-9" /> // Placeholder same height
                        )}
                    </div>

                    {/* Tab Switcher - Primary Action */}
                    <div className="flex bg-primary/5 dark:bg-white/5 p-1 rounded-xl border border-primary/10 dark:border-white/10">
                        <button 
                            onClick={() => setActiveTab('access')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'access' 
                                    ? "bg-primary dark:bg-white text-white dark:text-black shadow-lg" 
                                    : "text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                            )}
                        >
                            <Key size={12} /> Otoritas
                        </button>
                        <button 
                            onClick={() => setActiveTab('navigation')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'navigation' 
                                    ? "bg-primary dark:bg-white text-white dark:text-black shadow-lg" 
                                    : "text-primary/40 dark:text-white/40 hover:text-primary dark:hover:text-white"
                            )}
                        >
                            <LayoutGrid size={12} /> Navigasi
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Config: ${role.name}`} />

            {activeTab === 'access' ? (
                <div className="grid grid-cols-1 gap-10">
                    <FormSection title="Matriks Hak Akses" subtitle="Tentukan izin spesifik untuk setiap modul operasional">
                        <div className="border border-primary/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-background transform-gpu">
                            <div className="overflow-x-auto scrollbar-hide overscroll-contain">
                                <table className="w-full border-collapse isolate">
                                    <thead>
                                        <tr className="bg-primary dark:bg-white text-white dark:text-black uppercase tracking-[0.2em] text-[10px] font-black sticky top-0 z-20 shadow-md">
                                            <th className="px-6 py-5 text-left font-black border-r border-white/10 dark:border-black/10 min-w-[240px] bg-primary dark:bg-white sticky left-0 z-30">Scope Modul</th>
                                            {PERMISSIONS.map(p => {
                                                const isAllChecked = accessForm.data.accesses.every(a => (a as any)[p]);
                                                return (
                                                    <th key={p} className="px-2 py-5 text-center min-w-[120px] border-r border-white/10 dark:border-black/10 last:border-r-0">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="opacity-80">{permissionLabels[p]}</span>
                                                            <Checkbox 
                                                                className="h-4 w-4 rounded-md border-white/40 dark:border-black/40 data-[state=checked]:bg-white dark:data-[state=checked]:bg-black data-[state=checked]:border-white dark:data-[state=checked]:border-black data-[state=checked]:text-black dark:data-[state=checked]:text-white transition-all"
                                                                checked={isAllChecked}
                                                                onCheckedChange={(checked) => setColumn(p, !!checked)}
                                                            />
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                            <th className="px-2 py-5 text-center min-w-[80px] bg-black/20 dark:bg-white/20 border-l border-white/10 dark:border-black/10 font-black tracking-widest">Full</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(groupedModules).map(([groupId, group]) => {
                                            const groupModuleIds = group.modules.map(m => m.id);
                                            const groupAccesses = accessForm.data.accesses.filter(a => groupModuleIds.includes(a.module_id));
                                            const isGroupFullControlChecked = groupAccesses.every(a => a.can_read && a.can_create && a.can_update && a.can_delete && a.can_approve && a.can_bulk_approve && a.can_bulk_delete);

                                            return (
                                                <React.Fragment key={groupId}>
                                                    <tr className="bg-primary/[0.04] dark:bg-white/[0.04] border-b border-primary/10 dark:border-white/10">
                                                        <td className="px-5 py-3 font-black text-primary dark:text-white flex items-center gap-3">
                                                            <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                                                                <LayoutGrid className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="uppercase tracking-[0.2em] text-[11px] font-black">{group.name}</span>
                                                        </td>
                                                        {PERMISSIONS.map(p => {
                                                            const isGroupColumnChecked = groupAccesses.every(a => (a as any)[p]);
                                                            return (
                                                                <td key={p} className="px-2 py-3 text-center border-l border-primary/5 dark:border-white/5">
                                                                    <div className="flex justify-center">
                                                                        <Checkbox 
                                                                            className="h-4 w-4 rounded-md border-primary/20 dark:border-white/20 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white data-[state=checked]:border-primary dark:data-[state=checked]:border-white data-[state=checked]:text-white dark:data-[state=checked]:text-black transition-all active:scale-90"
                                                                            checked={isGroupColumnChecked}
                                                                            onCheckedChange={(checked) => setGroupColumn(groupId, p, !!checked)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="px-2 py-3 text-center border-l border-primary/10 dark:border-white/10 bg-primary/[0.08] dark:bg-white/[0.08]">
                                                             <div className="flex justify-center">
                                                                <Checkbox 
                                                                    className="h-4 w-4 rounded-md border-primary/30 dark:border-white/30 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white data-[state=checked]:border-primary dark:data-[state=checked]:border-white data-[state=checked]:text-white dark:data-[state=checked]:text-black transition-all active:scale-90"
                                                                    checked={isGroupFullControlChecked}
                                                                    onCheckedChange={(checked) => {
                                                                         accessForm.setData('accesses', accessForm.data.accesses.map(access => 
                                                                            groupModuleIds.includes(access.module_id) ? { ...access, can_read: !!checked, can_create: !!checked, can_update: !!checked, can_delete: !!checked, can_approve: !!checked, can_bulk_approve: !!checked, can_bulk_delete: !!checked } : access
                                                                        ));
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {group.modules.map((module) => (
                                                        <ModuleRow 
                                                            key={module.id} 
                                                            module={module} 
                                                            access={accessForm.data.accesses.find(a => a.module_id === module.id)}
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
                    
                    <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] p-8 shadow-sm relative overflow-hidden group max-w-4xl">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldAlert size={120} strokeWidth={1} />
                        </div>
                        <div className="flex items-start gap-5 relative z-10">
                            <div className="p-3 rounded-2xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[12px] font-black text-primary dark:text-white uppercase tracking-[0.2em] leading-none">Protokol Keamanan Perubahan</h4>
                                <p className="text-[10px] text-primary/40 dark:text-white/40 font-bold uppercase tracking-wider leading-relaxed">
                                    Setiap modifikasi hak akses akan langsung mengikat seluruh personil dengan role <span className="text-primary dark:text-white underline underline-offset-4 font-black">{role.name}</span>. 
                                    Pastikan tingkat otorisasi sudah sesuai dengan batas wewenang struktural sebelum menyimpan perubahan ini.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={rectIntersection}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-12 gap-10">
                        <div className="col-span-12 flex flex-col gap-10 lg:col-span-8">
                            <FormSection title="Active Navigation Hierarchy" subtitle="Drag and drop menu untuk mengatur urutan dan grup sidebar">
                                <div className="space-y-6 pb-20">
                                    <SortableContext id="groups-context" items={navItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                                        {navItems.map((group) => (
                                            <SortableGroupItem key={group.id} group={group} onRemoveModule={handleRemoveModule} />
                                        ))}
                                    </SortableContext>
                                </div>
                            </FormSection>
                        </div>
                        <AvailableListContainer modules={availableModules} onQuickAdd={handleQuickAdd} />
                    </div>
                    <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                        {activeId ? (
                            activeType === 'group' ? (
                                <div className="flex w-[400px] cursor-grabbing items-center gap-3 border border-primary bg-white dark:bg-background p-3 opacity-90 shadow-2xl ring-4 ring-primary/5 rounded-2xl">
                                    <GripVertical className="text-primary" size={16} />
                                    <h3 className="text-[11px] font-black tracking-[0.2em] text-primary dark:text-white uppercase">
                                        {navItems.find((g) => g.id === activeId)?.name}
                                    </h3>
                                </div>
                            ) : (
                                <div className="flex w-[280px] scale-105 cursor-grabbing items-center gap-3 border border-primary bg-white dark:bg-background p-3 opacity-95 shadow-2xl rounded-xl">
                                    <GripVertical size={14} className="text-primary" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black tracking-tight text-primary dark:text-white uppercase">
                                            {allModules.find((m) => m.id === activeId)?.name}
                                        </p>
                                    </div>
                                </div>
                            )
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            <style dangerouslySetInnerHTML={{ __html: ` 
                .scrollbar-hide::-webkit-scrollbar { display: none; } 
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } 
                .content-visibility-auto { content-visibility: auto; contain-intrinsic-size: auto 60px; }
            ` }} />
        </ManagementForm>
    );
}
