import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
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
import { Head, router } from '@inertiajs/react';
import { GripVertical, Layers, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Module {
    id: string;
    name: string;
    route: string | null;
    icon: string | null;
    module_group_id: string | null;
    sequence: number;
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
}
interface Props {
    role: Role;
    navigation: Group[];
    allModules: Module[];
}

const SortableModuleItem = ({ module, onRemove }: { module: Module; onRemove: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id, data: { type: 'module', module } });
    const style = { transform: CSS.Translate.toString(transform), transition };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group flex items-center gap-3 border border-slate-200 bg-white p-3 transition-all',
                isDragging && 'z-50 scale-[1.02] border-black opacity-50 ring-1 ring-black',
            )}
        >
            <div
                {...listeners}
                {...attributes}
                className="cursor-grab p-1 text-slate-400 transition-colors hover:bg-slate-100 active:cursor-grabbing"
            >
                <GripVertical size={14} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] leading-none font-black tracking-tight text-slate-900 uppercase">{module.name}</p>
                <p className="mt-1 truncate text-[9px] font-bold text-slate-400 uppercase">{module.route || 'SYSTEM_INTERNAL'}</p>
            </div>
            <button
                onClick={() => onRemove(module.id)}
                className="p-1.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:text-rose-600"
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
                'overflow-hidden border border-slate-200 bg-slate-50 transition-all',
                isDragging && 'z-40 border-black opacity-50 ring-2 ring-black/5',
            )}
        >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3">
                    <div {...listeners} {...attributes} className="cursor-grab p-1.5 text-slate-400 hover:bg-slate-50 active:cursor-grabbing">
                        <GripVertical size={16} />
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-800 uppercase">
                            {group.name}
                            <span className="bg-slate-900 px-1.5 py-0.5 text-[8px] leading-none font-black tracking-widest text-white uppercase">
                                {group.modules.length} ELEMENTS
                            </span>
                        </h3>
                    </div>
                </div>
            </div>
            <div className="min-h-[60px] space-y-2 p-3">
                <SortableContext id={'context-' + group.id} items={group.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {group.modules.map((module) => (
                        <SortableModuleItem key={module.id} module={module} onRemove={onRemoveModule} />
                    ))}
                </SortableContext>
                {group.modules.length === 0 && (
                    <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white/40 py-6">
                        <span className="text-[9px] font-black tracking-[0.2em] text-slate-300 uppercase italic">Drop module here</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const AvailableListContainer = ({ modules, onQuickAdd }: { modules: Module[]; onQuickAdd: (m: Module) => void }) => {
    const { setNodeRef } = useDroppable({ id: 'available-list' });
    return (
        <div ref={setNodeRef} className="col-span-12 flex h-full flex-col overflow-hidden border border-slate-200 bg-white lg:col-span-4">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                    {/* <div className="w-1.5 h-3 bg-black" /> */}
                    <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase">Available Repository</h2>
                </div>
                <span className="bg-slate-200 px-2 py-0.5 text-[9px] font-black tracking-tight text-slate-500 uppercase">{modules.length} UNITS</span>
            </div>
            <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto p-4">
                <SortableContext id="available-context" items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {modules.map((module) => (
                        <AvailableModuleItem key={module.id} module={module} onQuickAdd={onQuickAdd} />
                    ))}
                </SortableContext>
                {modules.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                        <Layers className="mb-4 text-slate-200" size={32} />
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Repository Empty</p>
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
                'group flex items-center justify-between border border-slate-200 bg-white p-3 transition-all hover:border-slate-800',
                isDragging && 'z-50 scale-[1.02] border-black opacity-50 shadow-2xl ring-1 ring-black',
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div {...listeners} {...attributes} className="shrink-0 cursor-grab p-1.5 text-slate-300 hover:bg-slate-50">
                    <GripVertical size={14} />
                </div>
                <div className="min-w-0">
                    <span className="block truncate text-[11px] font-black tracking-tight text-slate-900 uppercase">{module.name}</span>
                    <span className="mt-0.5 block truncate text-[9px] leading-none font-bold tracking-wider text-slate-400 uppercase italic">
                        {module.route || 'NO_PATH'}
                    </span>
                </div>
            </div>
            <button
                onClick={() => onQuickAdd(module)}
                className="ml-2 p-1 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:text-black"
            >
                <Plus size={14} />
            </button>
        </div>
    );
};

export default function RoleNavigation({ role, navigation: initialNavigation, allModules }: Props) {
    const [items, setItems] = useState<Group[]>(initialNavigation);
    const [availableModules, setAvailableModules] = useState<Module[]>(() => {
        const activeModuleIds = new Set(initialNavigation.flatMap((g) => g.modules.map((m) => m.id)));
        return allModules.filter((m) => !activeModuleIds.has(m.id));
    });
    const itemsRef = useRef(items);
    const availableModulesRef = useRef(availableModules);
    const isMoving = useRef(false);
    const lastOverId = useRef<UniqueIdentifier | null>(null);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);
    useEffect(() => {
        availableModulesRef.current = availableModules;
    }, [availableModules]);

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [activeType, setActiveType] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleRemoveModule = (moduleId: string) => {
        let removedModule: Module | null = null;
        const newItems = items.map((group) => {
            const mod = group.modules.find((m) => m.id === moduleId);
            if (mod) removedModule = mod;
            return { ...group, modules: group.modules.filter((m) => m.id !== moduleId) };
        });
        if (removedModule) {
            setItems(newItems);
            setAvailableModules((prev) => [...prev, removedModule!]);
        }
    };

    const handleQuickAdd = (module: Module) => {
        if (items.length === 0) return;
        setAvailableModules((prev) => prev.filter((m) => m.id !== module.id));
        setItems((prev) => {
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
            setItems((prev) => {
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
            setItems(next);
            itemsRef.current = next;
            const newAvailable = [...availableModulesRef.current, activeModule!];
            setAvailableModules(newAvailable);
            availableModulesRef.current = newAvailable;
        } else {
            setItems((prev) => {
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
                setItems((prev) =>
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
                const cIdx = items.findIndex((g) => g.modules.some((m) => m.id === active.id));
                if (cIdx !== -1) {
                    const mods = items[cIdx].modules,
                        oldIdx = mods.findIndex((m) => m.id === active.id),
                        newIdx = mods.findIndex((m) => m.id === over.id);
                    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx)
                        setItems((prev) => {
                            const next = [...prev];
                            next[cIdx] = { ...next[cIdx], modules: arrayMove(mods, oldIdx, newIdx) };
                            return next;
                        });
                }
            }
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        const data = items.map((g, gIdx) => ({
            id: g.id,
            sequence: gIdx + 1,
            modules: g.modules.map((m, mIdx) => ({ id: m.id, sequence: mIdx + 1 })),
        }));
        router.post(
            `/admin/roles/${role.id}/reorder`,
            { role_id: role.id, groups: data },
            {
                onSuccess: () => {
                    setIsSaving(false);
                    showToast('Struktur navigasi role diperbarui.', 'success');
                },
                onError: () => {
                    setIsSaving(false);
                    showToast('Gagal menyimpan navigasi.', 'danger');
                },
            },
        );
    };

    return (
        <ManagementForm
            title={`Navigasi Role: ${role.name}`}
            subtitle="Arsitektur struktur menu sidebar"
            onClose={() => window.history.back()}
            onSave={handleSave}
            processing={isSaving}
            isDirty={true}
            isEdit={true}
        >
            <Head title={`Navigasi: ${role.name}`} />
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
                                <SortableContext id="groups-context" items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                                    {items.map((group) => (
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
                            <div className="flex w-[400px] cursor-grabbing items-center gap-3 border border-black bg-white p-3 opacity-90 shadow-2xl ring-4 ring-black/5">
                                <GripVertical className="text-black" size={16} />
                                <h3 className="text-[11px] font-black tracking-widest text-slate-800 uppercase">
                                    {items.find((g) => g.id === activeId)?.name}
                                </h3>
                            </div>
                        ) : (
                            <div className="flex w-[280px] scale-105 cursor-grabbing items-center gap-3 border border-black bg-white p-3 opacity-95 shadow-2xl">
                                <GripVertical size={14} className="text-black" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black tracking-tight text-slate-900 uppercase">
                                        {allModules.find((m) => m.id === activeId)?.name}
                                    </p>
                                </div>
                            </div>
                        )
                    ) : null}
                </DragOverlay>
            </DndContext>
            <style
                dangerouslySetInnerHTML={{
                    __html: ` .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } `,
                }}
            />
        </ManagementForm>
    );
}
