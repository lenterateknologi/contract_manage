import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
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
    rectIntersection,
    UniqueIdentifier,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckSquare, GripVertical, Key, Layers, LayoutGrid, Plus, ShieldAlert, Square, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
                    'border-border hover:bg-muted/30 group border-b transition-colors last:border-b-0',
                    'content-visibility-auto contain-intrinsic-size-[auto_60px]', // Native Virtualization
                )}
            >
                <td className="border-border bg-card sticky left-0 z-10 border-r px-5 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col">
                        <span className="text-foreground text-sm font-bold tracking-tight">{module.name}</span>
                        <span className="text-muted-foreground/60 font-mono text-xs tracking-wide uppercase">{module.identifier}</span>
                    </div>
                </td>
                {PERMISSIONS.map((p) => (
                    <td
                        key={p}
                        className={cn('border-border border-r px-2 py-4 text-center last:border-r-0', access[p] ? 'bg-primary/5' : 'bg-transparent')}
                    >
                        <div className="flex justify-center">
                            <Checkbox
                                className="border-border h-5 w-5 rounded transition-transform active:scale-90"
                                checked={access[p] || false}
                                onCheckedChange={(checked) => onToggle(module.id, p, checked as boolean)}
                            />
                        </div>
                    </td>
                ))}
                <td className="bg-muted/40 group-hover:bg-muted border-border border-l px-2 py-4 text-center transition-colors">
                    <div className="flex justify-center">
                        <Checkbox
                            className="border-border h-5 w-5 rounded transition-transform active:scale-90"
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
const SortableModuleItem = ({ module, onRemove }: { module: Module; onRemove: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id, data: { type: 'module', module } });
    const style = { transform: CSS.Translate.toString(transform), transition };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group border-border bg-card flex items-center gap-3 rounded-xl border p-3 shadow-sm transition-all',
                isDragging && 'border-primary ring-primary/10 z-50 scale-[1.02] opacity-50 shadow-2xl ring-2',
            )}
        >
            <div
                {...listeners}
                {...attributes}
                className="text-muted-foreground/40 hover:bg-muted hover:text-foreground cursor-grab rounded-lg p-1.5 transition-colors active:cursor-grabbing"
            >
                <GripVertical size={16} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-bold tracking-tight">{module.name}</p>
                <p className="text-muted-foreground mt-0.5 truncate text-xs font-semibold tracking-wide">{module.route || 'SYSTEM_INTERNAL'}</p>
            </div>
            <button
                onClick={() => onRemove(module.id)}
                className="text-muted-foreground/40 rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 active:scale-90"
            >
                <Trash2 size={14} />
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
                'border-border bg-card/40 overflow-hidden rounded-2xl border shadow-sm transition-all',
                isDragging && 'border-primary ring-primary/5 z-40 opacity-50 shadow-2xl ring-2',
            )}
        >
            <div className="border-border bg-card flex items-center justify-between border-b px-4 py-3.5">
                <div className="flex items-center gap-3">
                    <div
                        {...listeners}
                        {...attributes}
                        className="text-muted-foreground/40 hover:bg-muted hover:text-foreground cursor-grab rounded-xl p-2 active:cursor-grabbing"
                    >
                        <GripVertical size={16} />
                    </div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-foreground text-sm font-bold tracking-tight">{group.name}</h3>
                        <span className="bg-primary/10 text-primary rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm">
                            {group.modules.length} UNITS
                        </span>
                    </div>
                </div>
            </div>
            <div className="min-h-[80px] space-y-2.5 p-4">
                <SortableContext id={'context-' + group.id} items={group.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {group.modules.map((module) => (
                        <SortableModuleItem key={module.id} module={module} onRemove={onRemoveModule} />
                    ))}
                </SortableContext>
                {group.modules.length === 0 && (
                    <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-8">
                        <span className="text-muted-foreground/60 text-xs font-medium uppercase">Drop module here</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const AvailableListContainer = ({ modules, onQuickAdd }: { modules: Module[]; onQuickAdd: (m: Module) => void }) => {
    const { setNodeRef } = useDroppable({ id: 'available-list' });
    return (
        <div
            ref={setNodeRef}
            className="border-border bg-card sticky top-6 col-span-12 flex h-[calc(100vh-320px)] flex-col overflow-hidden rounded-2xl border shadow-md lg:col-span-4"
        >
            <div className="border-border bg-muted/20 flex shrink-0 items-center justify-between border-b p-5">
                <div className="flex items-center gap-3">
                    <h2 className="text-foreground text-sm font-bold tracking-tight uppercase">Repository</h2>
                </div>
                <span className="bg-primary/10 text-primary rounded-lg px-2.5 py-1 text-xs font-bold uppercase shadow-sm">
                    {modules.length} UNITS
                </span>
            </div>
            <div className="scrollbar-hide bg-card/10 flex-1 space-y-3 overflow-y-auto p-5">
                <SortableContext id="available-context" items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {modules.map((module) => (
                        <AvailableModuleItem key={module.id} module={module} onQuickAdd={onQuickAdd} />
                    ))}
                </SortableContext>
                {modules.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 py-24 text-center opacity-40 select-none">
                        <Layers className="text-muted-foreground/40 mb-4" size={48} strokeWidth={1} />
                        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Kosong</p>
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
                'group border-border bg-card hover:border-border/80 flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm',
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
                <div className="min-w-0">
                    <span className="text-foreground block truncate text-sm font-bold tracking-tight uppercase">{module.name}</span>
                    <span className="text-muted-foreground/70 mt-0.5 block truncate text-xs font-semibold tracking-wide uppercase">
                        {module.route || 'NO_PATH'}
                    </span>
                </div>
            </div>
            <button
                onClick={() => onQuickAdd(module)}
                className="text-muted-foreground/40 hover:text-primary hover:bg-primary/10 ml-2 rounded-lg p-2 opacity-0 transition-all group-hover:opacity-100 active:scale-90"
            >
                <Plus size={18} />
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

    const handleAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        accessForm.post(`/admin/roles/${role.id}/access`, {
            onSuccess: () => showToast('Hak akses role berhasil diperbarui.', 'success'),
            onError: () => showToast('Gagal menyimpan hak akses.', 'danger'),
        });
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
        return modules.reduce(
            (acc, module) => {
                const groupId = module.module_group_id || 'other';
                const groupName = module.identifier?.split('_')[0] || 'Lainnya'; // Fallback logic
                if (!acc[groupId]) acc[groupId] = { name: groupName, modules: [] };
                acc[groupId].modules.push(module);
                return acc;
            },
            {} as Record<string, { name: string; modules: typeof modules }>,
        );
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

    useEffect(() => {
        itemsRef.current = navItems;
    }, [navItems]);
    useEffect(() => {
        availableModulesRef.current = availableModules;
    }, [availableModules]);

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
        let activeContainerIdx = -1,
            activeModule: Module | null = null;
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
        setTimeout(() => {
            isMoving.current = false;
        }, 40);
        if (activeContainerIdx === -2) {
            const newAvailable = availableModulesRef.current.filter((m) => m.id !== active.id);
            setAvailableModules(newAvailable);
            availableModulesRef.current = newAvailable;
            setNavItems((prev) => {
                const next = [...prev],
                    targetModules = [...next[overContainerIdx].modules],
                    overIdx = targetModules.findIndex((m) => m.id === over.id);
                targetModules.splice(overIdx === -1 ? targetModules.length : overIdx, 0, {
                    ...activeModule!,
                    module_group_id: next[overContainerIdx].id,
                });
                next[overContainerIdx].modules = targetModules;
                itemsRef.current = next;
                return next;
            });
        } else if (overContainerIdx === -2) {
            const next = itemsRef.current.map((g, i) =>
                i === activeContainerIdx ? { ...g, modules: g.modules.filter((m) => m.id !== active.id) } : g,
            );
            setNavItems(next);
            itemsRef.current = next;
            const newAvailable = [...availableModulesRef.current, activeModule!];
            setAvailableModules(newAvailable);
            availableModulesRef.current = newAvailable;
        } else {
            setNavItems((prev) => {
                const next = [...prev];
                next[activeContainerIdx] = {
                    ...next[activeContainerIdx],
                    modules: next[activeContainerIdx].modules.filter((m) => m.id !== active.id),
                };
                const targetModules = [...next[overContainerIdx].modules],
                    overIdx = targetModules.findIndex((m) => m.id === over.id);
                targetModules.splice(overIdx === -1 ? targetModules.length : overIdx, 0, {
                    ...activeModule!,
                    module_group_id: next[overContainerIdx].id,
                });
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
                setNavItems((prev) =>
                    arrayMove(
                        prev,
                        prev.findIndex((i) => i.id === active.id),
                        prev.findIndex((i) => i.id === over.id),
                    ),
                );
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
        router.post(
            `/admin/roles/${role.id}/reorder`,
            { role_id: role.id, groups: data },
            {
                onSuccess: () => {
                    setIsSavingNav(false);
                    showToast('Struktur navigasi role diperbarui.', 'success');
                },
                onError: () => {
                    setIsSavingNav(false);
                    showToast('Gagal menyimpan navigasi.', 'danger');
                },
            },
        );
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
                    {/* Utility Buttons Container */}
                    <div className="mr-4 flex items-center transition-all">
                        {activeTab === 'access' ? (
                            <div className="bg-muted flex rounded-xl p-1">
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
                        ) : (
                            <div className="h-9" /> // Placeholder same height
                        )}
                    </div>

                    {/* Tab Switcher */}
                    <div className="bg-muted flex rounded-xl p-1">
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
                            <Key size={14} /> Otoritas
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
            }
        >
            <Head title={`Config: ${role.name}`} />

            {activeTab === 'access' ? (
                <div className="grid grid-cols-1 gap-8">
                    <FormSection title="Matriks Hak Akses" subtitle="Tentukan izin spesifik untuk setiap modul operasional">
                        <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
                            <div className="scrollbar-hide overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted text-muted-foreground text-xs font-bold tracking-wider uppercase">
                                            <th className="border-border bg-muted text-foreground sticky left-0 z-30 min-w-[240px] border-r px-6 py-4 text-left font-bold">
                                                Scope Modul
                                            </th>
                                            {PERMISSIONS.map((p) => {
                                                const isAllChecked = accessForm.data.accesses.every((a) => (a as any)[p]);
                                                return (
                                                    <th
                                                        key={p}
                                                        className="border-border min-w-[120px] border-r px-2 py-4 text-center last:border-r-0"
                                                    >
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="font-bold">{permissionLabels[p]}</span>
                                                            <Checkbox
                                                                className="h-4 w-4 rounded"
                                                                checked={isAllChecked}
                                                                onCheckedChange={(checked) => setColumn(p, !!checked)}
                                                            />
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                            <th className="border-border bg-muted min-w-[80px] border-l px-2 py-4 text-center font-bold">Full</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
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
                                                    <tr className="bg-muted/30 border-border border-b">
                                                        <td className="text-foreground flex items-center gap-3 px-5 py-3.5 font-bold">
                                                            <div className="bg-primary/10 text-primary rounded-lg p-1.5">
                                                                <LayoutGrid className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-sm font-bold">{group.name}</span>
                                                        </td>
                                                        {PERMISSIONS.map((p) => {
                                                            const isGroupColumnChecked = groupAccesses.every((a) => (a as any)[p]);
                                                            return (
                                                                <td key={p} className="border-border border-l px-2 py-3 text-center">
                                                                    <div className="flex justify-center">
                                                                        <Checkbox
                                                                            className="h-4 w-4 rounded transition-all active:scale-90"
                                                                            checked={isGroupColumnChecked}
                                                                            onCheckedChange={(checked) => setGroupColumn(groupId, p, !!checked)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="bg-muted/50 border-border border-l px-2 py-3 text-center">
                                                            <div className="flex justify-center">
                                                                <Checkbox
                                                                    className="h-4 w-4 rounded transition-all active:scale-90"
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

                    <div className="group border-border bg-card relative max-w-4xl overflow-hidden rounded-2xl border p-6 shadow-sm transition-all">
                        <div className="pointer-events-none absolute top-0 right-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
                            <ShieldAlert size={120} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-500/10">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-foreground text-sm font-bold tracking-tight">Protokol Keamanan Perubahan</h4>
                                <p className="text-muted-foreground/80 text-xs leading-relaxed font-semibold tracking-wide uppercase">
                                    Setiap modifikasi hak akses akan langsung mengikat seluruh personil dengan role{' '}
                                    <span className="text-primary font-bold">{role.name}</span>. Pastikan tingkat otorisasi sudah sesuai dengan batas
                                    wewenang struktural sebelum menyimpan perubahan ini.
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
                                <div className="border-border bg-card ring-primary/5 flex w-[400px] cursor-grabbing items-center gap-3 rounded-2xl border p-3 opacity-90 shadow-2xl ring-4">
                                    <GripVertical className="text-primary" size={16} />
                                    <h3 className="text-foreground text-sm font-bold">{navItems.find((g) => g.id === activeId)?.name}</h3>
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
