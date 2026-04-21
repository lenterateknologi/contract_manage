import React, { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    DndContext, 
    closestCorners, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors, 
    DragOverlay, 
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    UniqueIdentifier,
    useDroppable,
    rectIntersection
} from '@dnd-kit/core';
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    verticalListSortingStrategy,
    useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
    LayoutGrid, 
    ChevronRight, 
    Settings2, 
    GripVertical, 
    Plus, 
    Trash2, 
    Save, 
    Search,
    ShieldCheck,
    ArrowRight,
    MousePointer2,
    Database,
    Layers,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/contracts/Toast';
import { cn } from '@/lib/utils';

// Types
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

// Components
const SortableModuleItem = ({ module, onRemove }: { module: Module; onRemove: (id: string) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: module.id, data: { type: 'module', module } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl transition-all duration-200 hover:border-primary/30 hover:shadow-md",
                isDragging && "opacity-50 ring-2 ring-primary/20 border-primary shadow-xl z-50 scale-[1.02]"
            )}
        >
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary transition-colors">
                <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 truncate text-[13.5px] tracking-tight">{module.name}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium italic">
                    <MousePointer2 size={10} /> {module.route || 'Tanpa rute'}
                </p>
            </div>
            <button 
                onClick={() => onRemove(module.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

const SortableGroupItem = ({ group, onRemoveModule }: { group: Group; onRemoveModule: (id: string) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: group.id, data: { type: 'group', group } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className={cn(
                "bg-slate-50/80 rounded-2xl border-2 border-slate-200/60 overflow-hidden transition-all duration-300",
                isDragging && "opacity-50 border-primary ring-4 ring-primary/10 shadow-2xl z-40"
            )}
        >
            <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors">
                        <GripVertical size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            {group.name}
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">
                                {group.modules.length} Menu
                            </span>
                        </h3>
                    </div>
                </div>
            </div>
            
            <div className="p-4 space-y-2 min-h-[60px]">
                <SortableContext 
                    id={'context-' + group.id}
                    items={group.modules.map(m => m.id)} 
                    strategy={verticalListSortingStrategy}
                >
                    {group.modules.map((module) => (
                        <SortableModuleItem 
                            key={module.id} 
                            module={module} 
                            onRemove={onRemoveModule}
                        />
                    ))}
                </SortableContext>
                
                {group.modules.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 animate-pulse">
                        <Plus size={20} className="mb-1 opacity-40 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/80">Tempatkan menu di sini</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const AvailableListContainer = ({ modules, onQuickAdd }: { modules: Module[]; onQuickAdd: (m: Module) => void }) => {
    const { setNodeRef } = useDroppable({ id: 'available-list' });

    return (
        <div ref={setNodeRef} className="col-span-4 flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b bg-white flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Layers className="text-primary" size={20} />
                    </div>
                    <h2 className="font-extrabold text-slate-800 tracking-tight">Menu Tersedia</h2>
                </div>
                <span className="bg-primary/10 text-primary text-[11px] px-2 py-1 rounded-full font-black uppercase tracking-wider">
                    {modules.length} Total
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide">
                <SortableContext 
                    id="available-context"
                    items={modules.map(m => m.id)} 
                    strategy={verticalListSortingStrategy}
                >
                    {modules.map((module) => (
                        <AvailableModuleItem key={module.id} module={module} onQuickAdd={onQuickAdd} />
                    ))}
                </SortableContext>
                
                {modules.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="bg-slate-100 p-4 rounded-full mb-3 text-slate-300">
                            <Layers size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 mb-1">Semua menu aktif</p>
                        <p className="text-xs text-slate-400">Tidak ada menu tersisa yang tersedia</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AvailableModuleItem = ({ module, onQuickAdd }: { module: Module; onQuickAdd: (m: Module) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: module.id, data: { type: 'available-module', module } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
                isDragging && "opacity-50 ring-2 ring-primary/20 border-primary z-50 scale-105 shadow-2xl"
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div {...listeners} {...attributes} className="cursor-grab p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors shrink-0">
                    <GripVertical size={16} />
                </div>
                <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-700 block truncate">{module.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium italic block">{module.route || 'Tanpa rute'}</span>
                </div>
            </div>
            <button 
                onClick={() => onQuickAdd(module)}
                className="ml-2 p-1.5 text-primary hover:bg-primary hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-primary/20"
            >
                <Plus size={14} />
            </button>
        </div>
    );
};

export default function RoleNavigation({ role, navigation: initialNavigation, allModules }: Props) {
    const [items, setItems] = useState<Group[]>(initialNavigation);
    const [availableModules, setAvailableModules] = useState<Module[]>(() => {
        const activeModuleIds = new Set(initialNavigation.flatMap(g => g.modules.map(m => m.id)));
        return allModules.filter(m => !activeModuleIds.has(m.id));
    });

    // Stability Refs
    const itemsRef = useRef(items);
    const availableModulesRef = useRef(availableModules);
    const isMoving = useRef(false);
    const lastOverId = useRef<UniqueIdentifier | null>(null);

    // Sync refs immediately when state changes safely
    useEffect(() => { itemsRef.current = items; }, [items]);
    useEffect(() => { availableModulesRef.current = availableModules; }, [availableModules]);

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [activeType, setActiveType] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleRemoveModule = (moduleId: string) => {
        let removedModule: Module | null = null;
        const newItems = items.map(group => {
            const mod = group.modules.find(m => m.id === moduleId);
            if (mod) removedModule = mod;
            return { ...group, modules: group.modules.filter(m => m.id !== moduleId) };
        });

        if (removedModule) {
            setItems(newItems);
            setAvailableModules(prev => [...prev, removedModule!]);
        }
    };

    const handleQuickAdd = (module: Module) => {
        if (items.length === 0) return;
        setAvailableModules(prev => prev.filter(m => m.id !== module.id));
        setItems(prev => {
            const newItems = [...prev];
            newItems[0] = { ...newItems[0], modules: [...newItems[0].modules, { ...module, module_group_id: newItems[0].id }] };
            return newItems;
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveType(active.data.current?.type);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || isMoving.current) return;
        
        // Multi-id guard
        if (lastOverId.current === over.id) return;
        lastOverId.current = over.id;

        const activeId = active.id;
        const overId = over.id;

        if (activeType === 'group' || activeId === overId) return;

        // 1. Identify starting container
        let activeContainerIdx = -1;
        let activeModule: Module | null = null;
        
        const inAvailableIdx = availableModulesRef.current.findIndex(m => m.id === activeId);
        if (inAvailableIdx !== -1) {
            activeContainerIdx = -2; // Available
            activeModule = availableModulesRef.current[inAvailableIdx];
        } else {
            for (let i = 0; i < itemsRef.current.length; i++) {
                const idx = itemsRef.current[i].modules.findIndex(m => m.id === activeId);
                if (idx !== -1) {
                    activeContainerIdx = i;
                    activeModule = itemsRef.current[i].modules[idx];
                    break;
                }
            }
        }

        if (!activeModule) return;

        // 2. Identify target container
        let overContainerIdx = itemsRef.current.findIndex(g => g.id === overId);
        if (overContainerIdx === -1) {
            overContainerIdx = itemsRef.current.findIndex(g => g.modules.some(m => m.id === overId));
        }

        const isOverAvailableZone = overId === 'available-list' || availableModulesRef.current.some(m => m.id === overId);
        if (overContainerIdx === -1 && isOverAvailableZone) {
            overContainerIdx = -2;
        }

        // Return if movement is within same container (let DragEnd handle reordering)
        if (overContainerIdx === -1 || activeContainerIdx === overContainerIdx) return;

        // Lock to avoid infinite loops
        isMoving.current = true;
        setTimeout(() => { isMoving.current = false; }, 40);

        // 3. Move across containers
        if (activeContainerIdx === -2) {
            // From Available to a Group
            const newAvailable = availableModulesRef.current.filter(m => m.id !== activeId);
            setAvailableModules(newAvailable);
            availableModulesRef.current = newAvailable; // Instant sync

            setItems(prev => {
                const newItems = [...prev];
                const targetModules = [...newItems[overContainerIdx].modules];
                const overModuleIdx = targetModules.findIndex(m => m.id === overId);
                const insertIdx = overModuleIdx === -1 ? targetModules.length : overModuleIdx;
                
                targetModules.splice(insertIdx, 0, { ...activeModule!, module_group_id: newItems[overContainerIdx].id });
                newItems[overContainerIdx].modules = targetModules;
                itemsRef.current = newItems; // Instant sync
                return newItems;
            });
        } else if (overContainerIdx === -2) {
            // From a Group to Available
            const newItems = itemsRef.current.map((g, i) => i === activeContainerIdx ? {
                ...g,
                modules: g.modules.filter(m => m.id !== activeId)
            } : g);
            setItems(newItems);
            itemsRef.current = newItems;

            const newAvailable = [...availableModulesRef.current, activeModule!];
            setAvailableModules(newAvailable);
            availableModulesRef.current = newAvailable;
        } else {
            // Between two Groups
            setItems(prev => {
                const newItems = [...prev];
                // Remove from source
                newItems[activeContainerIdx] = {
                    ...newItems[activeContainerIdx],
                    modules: newItems[activeContainerIdx].modules.filter(m => m.id !== activeId)
                };
                // Insert into target
                const targetModules = [...newItems[overContainerIdx].modules];
                const overModuleIdx = targetModules.findIndex(m => m.id === overId);
                const insertIdx = overModuleIdx === -1 ? targetModules.length : overModuleIdx;
                
                targetModules.splice(insertIdx, 0, { ...activeModule!, module_group_id: newItems[overContainerIdx].id });
                newItems[overContainerIdx].modules = targetModules;
                itemsRef.current = newItems;
                return newItems;
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveType(null);
        
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeType === 'group') {
            // Reorder groups
            if (activeId !== overId) {
                setItems((items) => {
                    const oldIndex = items.findIndex(i => i.id === activeId);
                    const newIndex = items.findIndex(i => i.id === overId);
                    return arrayMove(items, oldIndex, newIndex);
                });
            }
        } else {
            // Finalize reorder within current container
            let containerIdx = -1;
            const inAvailable = availableModules.some(m => m.id === activeId);
            
            if (inAvailable) {
                const oldIndex = availableModules.findIndex(m => m.id === activeId);
                const newIndex = availableModules.findIndex(m => m.id === overId);
                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    setAvailableModules(prev => arrayMove(prev, oldIndex, newIndex));
                }
            } else {
                containerIdx = items.findIndex(g => g.modules.some(m => m.id === activeId));
                if (containerIdx !== -1) {
                    const modules = items[containerIdx].modules;
                    const oldIndex = modules.findIndex(m => m.id === activeId);
                    const newIndex = modules.findIndex(m => m.id === overId);
                    
                    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                        setItems(prev => {
                            const next = [...prev];
                            next[containerIdx] = {
                                ...next[containerIdx],
                                modules: arrayMove(modules, oldIndex, newIndex)
                            };
                            return next;
                        });
                    }
                }
            }
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        const formattedData = items.map((group, gIdx) => ({
            id: group.id,
            sequence: gIdx + 1,
            modules: group.modules.map((module, mIdx) => ({
                id: module.id,
                sequence: mIdx + 1,
            }))
        }));

        router.post(`/admin/roles/${role.id}/reorder`, {
            role_id: role.id,
            groups: formattedData
        }, {
            onSuccess: () => {
                setIsSaving(false);
                showToast("Struktur navigasi role telah diperbarui.", "success");
            },
            onError: () => {
                setIsSaving(false);
                showToast("Terjadi kesalahan saat menyimpan navigasi.", "danger");
            }
        });
    };

    return (
        <>
            <Head title={`Navigasi: ${role.name}`} />
            
            <div className="flex flex-col h-[calc(100vh-64px)] p-4 gap-4">
                {/* Header Section - Compact Version */}
                <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <LayoutGrid className="text-primary" size={20} />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-slate-800 tracking-tight text-lg leading-none">Struktur Navigasi</h1>
                            <p className="text-[11px] text-slate-500 font-medium mt-1">Mengatur menu untuk role: <span className="font-bold text-primary">{role.name}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            className="rounded-lg font-bold border-slate-200 hover:bg-slate-50 gap-1.5 h-8 px-3 text-[11px]"
                            onClick={() => window.history.back()}
                        >
                            Batal
                        </Button>
                        <Button 
                            className="rounded-lg font-black gap-1.5 h-8 px-4 text-[11px] shadow-md shadow-primary/10 transition-all hover:scale-105 active:scale-95"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    Simpan Perubahan
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-slate-200/30 rounded-3xl p-1 overflow-hidden">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={rectIntersection}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="grid grid-cols-12 gap-6 h-full p-4">
                            {/* Left: Active Navigation Column */}
                            <div className="col-span-8 flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <MousePointer2 className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="font-extrabold text-slate-800 tracking-tight">Active Navigation Structure</h2>
                                            <p className="text-[11px] text-slate-400 font-medium italic">Organize your sidebar groups and menu items</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                    <div className="space-y-6 pb-20">
                                        <SortableContext 
                                            id="groups-context"
                                            items={items.map(i => i.id)} 
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {items.map((group) => (
                                                <SortableGroupItem 
                                                    key={group.id} 
                                                    group={group} 
                                                    onRemoveModule={handleRemoveModule}
                                                />
                                            ))}
                                        </SortableContext>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Available Modules Column */}
                            <AvailableListContainer 
                                modules={availableModules} 
                                onQuickAdd={handleQuickAdd}
                            />
                        </div>

                        {/* Drag Overlay for smooth visuals */}
                        <DragOverlay dropAnimation={{
                            sideEffects: defaultDropAnimationSideEffects({
                                styles: {
                                    active: {
                                        opacity: '0.5',
                                    },
                                },
                            }),
                        }}>
                            {activeId ? (
                                activeType === 'group' ? (
                                    <div className="bg-white p-4 border-2 border-primary rounded-2xl shadow-2xl w-full opacity-90 cursor-grabbing ring-4 ring-primary/10">
                                        <div className="flex items-center gap-3">
                                            <GripVertical className="text-primary" size={20} />
                                            <h3 className="font-black text-slate-800 tracking-tight">
                                                {items.find(g => g.id === activeId)?.name}
                                            </h3>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-white border-2 border-primary rounded-xl shadow-2xl w-[300px] opacity-95 cursor-grabbing scale-105">
                                        <GripVertical size={18} className="text-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-800 truncate text-sm">
                                                {allModules.find(m => m.id === activeId)?.name}
                                            </p>
                                        </div>
                                    </div>
                                )
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </>
    );
}
