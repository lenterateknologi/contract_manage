import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Users, Settings2, GitBranch, Plus, Pencil, Trash2, Check, AlertCircle, ChevronRight, ChevronDown, ShieldCheck, Key, LayoutGrid, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useState, FormEvent } from 'react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { usePermissions } from '@/hooks/use-permissions';

interface Props {
    currentView: 'users' | 'contract-types' | 'workflows' | 'roles' | 'module-groups' | 'modules' | 'navigation';
    users?: any[];
    types?: any[];
    workflows?: any[];
    contractTypes?: any[];
    roles?: any[];
    groups?: any[];
    modules?: any[];
    moduleGroups?: any[];
    navigation?: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/users',
    },
    {
        title: 'Data Master',
        href: '#',
    },
];

const SortableModuleItem = ({ module, onEdit, onDelete, canUpdate, canDelete }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm group/item"
        >
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab hover:text-primary transition-colors">
                    <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{module.title}</span>
                        {!module.showed_as_menu && <span className="text-[8px] bg-amber-100 text-amber-700 font-black px-1 rounded uppercase">Hidden</span>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{module.code} - {module.url}</span>
                </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {canUpdate && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(module)}>
                        <Pencil className="h-3 w-3 text-slate-600" />
                    </Button>
                )}
                {canDelete && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(module.id)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
};

const SortableGroupItem = ({ group, modules, onEditGroup, onDeleteGroup, onEditModule, onDeleteModule, canUpdate, canDelete }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: group.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="space-y-3">
            <div className="flex items-center justify-between bg-slate-100/80 p-3 rounded-lg border border-slate-200 group/group">
                <div className="flex items-center gap-3">
                    <div {...attributes} {...listeners} className="cursor-grab hover:text-primary transition-colors">
                        <LayoutGrid className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="font-bold text-slate-700 uppercase tracking-widest text-xs">{group.title}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover/group:opacity-100 transition-opacity">
                    {canUpdate && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEditGroup(group)}>
                            <Pencil className="h-3.5 w-3.5 text-slate-600" />
                        </Button>
                    )}
                    {canDelete && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => onDeleteGroup(group.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="pl-8 space-y-2">
                <SortableContext items={modules.map((m: any) => m.id)} strategy={verticalListSortingStrategy}>
                    {modules.map((module: any) => (
                        <SortableModuleItem 
                            key={module.id} 
                            module={module} 
                            onEdit={onEditModule}
                            onDelete={onDeleteModule}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                        />
                    ))}
                </SortableContext>
                {modules.length === 0 && (
                    <div className="p-4 border-2 border-dashed rounded-lg text-center text-slate-400 italic text-xs">
                        Belum ada modul dalam grup ini
                    </div>
                )}
            </div>
        </div>
    );
};

export default function AdminIndex({ currentView, users, types, workflows, contractTypes, roles, groups, modules, moduleGroups, navigation: initialNavigation }: Props) {
    const viewModuleMap: Record<string, string> = {
        'users': 'USERS',
        'roles': 'ROLES',
        'contract-types': 'CTC_TYPES',
        'workflows': 'WORKFLOWS',
        'navigation': 'NAV_MGMT',
        'module-groups': 'NAV_MGMT',
        'modules': 'NAV_MGMT',
    };

    const moduleCode = viewModuleMap[currentView];
    const { canCreate, canUpdate, canDelete } = usePermissions(moduleCode);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const viewTitle = {
        'users': 'Manajemen Pengguna',
        'roles': 'Manajemen Role',
        'contract-types': 'Manajemen Tipe Kontrak',
        'workflows': 'Manajemen Alur Kerja',
        'module-groups': 'Grup Modul',
        'modules': 'Modul & Menu',
        'navigation': 'Manajemen Navigasi',
    }[currentView];

    const viewIcon = {
        'users': Users,
        'roles': ShieldCheck,
        'contract-types': Settings2,
        'workflows': GitBranch,
        'module-groups': LayoutGrid,
        'modules': FileText,
        'navigation': LayoutGrid,
    }[currentView];

    const Icon = viewIcon;

    // Forms
    const userForm = useForm({
        name: '',
        email: '',
        role: roles?.[0]?.name || 'Initiator',
        password: '',
    });

    const roleForm = useForm({
        name: '',
        description: '',
    });

    const typeForm = useForm({
        name: '',
        description: '',
    });

    const workflowForm = useForm({
        name: '',
        contract_type: '',
        description: '',
        is_default: true as boolean,
    });

    const moduleGroupForm = useForm({
        title: '',
        sort_number: 0,
    });

    const moduleForm = useForm({
        code: '',
        title: '',
        sort_number: 0,
        url: '',
        icon: '',
        module_group_id: moduleGroups?.[0]?.id || '',
        showed_as_menu: true as boolean,
    });

    const [navigationData, setNavigationData] = useState(initialNavigation || []);

    // Update navigation when initialNavigation changes
    React.useEffect(() => {
        if (initialNavigation) {
            setNavigationData(initialNavigation);
        }
    }, [initialNavigation]);

    const openCreate = () => {
        setEditingItem(null);
        userForm.reset();
        roleForm.reset();
        typeForm.reset();
        workflowForm.reset();
        moduleGroupForm.reset();
        moduleForm.reset();
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        if (currentView === 'users') {
            userForm.setData({
                name: item.name,
                email: item.email,
                role: item.role,
                password: '', // Don't pre-fill password
            });
        } else if (currentView === 'roles') {
            roleForm.setData({
                name: item.name,
                description: item.description || '',
            });
        } else if (currentView === 'contract-types') {
            typeForm.setData({
                name: item.name,
                description: item.description || '',
            });
        } else if (currentView === 'workflows') {
            workflowForm.setData({
                name: item.name,
                contract_type: item.contract_type,
                description: item.description || '',
                is_default: !!item.is_default as boolean,
            });
        } else if (currentView === 'module-groups') {
            moduleGroupForm.setData({
                title: item.title,
                sort_number: item.sort_number,
            });
        } else if (currentView === 'modules') {
            moduleForm.setData({
                code: item.code,
                title: item.title,
                sort_number: item.sort_number,
                url: item.url || '',
                icon: item.icon || '',
                module_group_id: item.module_group_id,
                showed_as_menu: !!item.showed_as_menu as boolean,
            });
        }
        setIsModalOpen(true);
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [activeItem, setActiveItem] = useState<any>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeId = active.id;
        
        // Find the active item (group or module)
        const group = navigationData.find(g => g.id === activeId);
        if (group) {
            setActiveItem({ type: 'group', ...group });
        } else {
            navigationData.forEach(g => {
                const module = g.modules?.find((m: any) => m.id === activeId);
                if (module) {
                    setActiveItem({ type: 'module', ...module });
                }
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveItem(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Check if we are dragging a group or a module
        const activeId = active.id as string;
        const overId = over.id as string;

        const isActiveGroup = navigationData.some(g => g.id === activeId);
        const isOverGroup = navigationData.some(g => g.id === overId);

        if (isActiveGroup && isOverGroup) {
            // Dragging group
            const oldIndex = navigationData.findIndex(g => g.id === activeId);
            const newIndex = navigationData.findIndex(g => g.id === overId);
            const newData = arrayMove(navigationData, oldIndex, newIndex);
            
            // Sync sort_number immediately
            const updatedData = newData.map((g, idx) => ({ ...g, sort_number: (idx + 1) * 10 }));
            setNavigationData(updatedData);
            saveOrder(updatedData);
        } else {
            // Dragging module
            let activeGroupIdx = -1;
            let overGroupIdx = -1;
            let activeModuleIdx = -1;
            let overModuleIdx = -1;

            navigationData.forEach((g, gIdx) => {
                const mIdx = g.modules?.findIndex((m: any) => m.id === activeId);
                if (mIdx !== undefined && mIdx !== -1) {
                    activeGroupIdx = gIdx;
                    activeModuleIdx = mIdx;
                }
                const moIdx = g.modules?.findIndex((m: any) => m.id === overId);
                if (moIdx !== undefined && moIdx !== -1) {
                    overGroupIdx = gIdx;
                    overModuleIdx = moIdx;
                }
            });

            if (activeGroupIdx !== -1) {
                const newData = [...navigationData];
                
                if (overGroupIdx !== -1 && activeGroupIdx === overGroupIdx) {
                    // Same group reorder
                    const group = { ...newData[activeGroupIdx] };
                    group.modules = arrayMove(group.modules, activeModuleIdx, overModuleIdx);
                    newData[activeGroupIdx] = group;
                } else if (overGroupIdx !== -1 && activeGroupIdx !== overGroupIdx) {
                    // Cross group move
                    const sourceGroup = { ...newData[activeGroupIdx] };
                    const targetGroup = { ...newData[overGroupIdx] };
                    const [movedModule] = sourceGroup.modules.splice(activeModuleIdx, 1);
                    movedModule.module_group_id = targetGroup.id;
                    targetGroup.modules.splice(overModuleIdx, 0, movedModule);
                    newData[activeGroupIdx] = sourceGroup;
                    newData[overGroupIdx] = targetGroup;
                } else if (isOverGroup) {
                    // Dragging onto a group header
                    const targetGroupIdx = navigationData.findIndex(g => g.id === overId);
                    if (targetGroupIdx !== -1 && activeGroupIdx !== targetGroupIdx) {
                        const sourceGroup = { ...newData[activeGroupIdx] };
                        const targetGroup = { ...newData[targetGroupIdx] };
                        const [movedModule] = sourceGroup.modules.splice(activeModuleIdx, 1);
                        movedModule.module_group_id = targetGroup.id;
                        targetGroup.modules.push(movedModule);
                        newData[activeGroupIdx] = sourceGroup;
                        newData[targetGroupIdx] = targetGroup;
                    }
                }

                setNavigationData(newData);
                saveOrder(newData);
            }
        }
    };

    const saveOrder = (data: any[]) => {
        // Map to the format backend expects
        const payload = {
            groups: data.map((g, gIdx) => ({
                id: g.id,
                sort_number: (gIdx + 1) * 10,
                modules: (g.modules || []).map((m: any, mIdx: number) => ({
                    id: m.id,
                    sort_number: (mIdx + 1) * 10
                }))
            }))
        };
        router.post(route('admin.navigation.reorder'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                // Optional: show toast
            }
        });
    };

    const handleDeleteNav = (type: 'group' | 'module', id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            const url = type === 'group' 
                ? route('admin.module-groups.destroy', id)
                : route('admin.modules.destroy', id);
            router.delete(url);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingItem(null);
            },
        };

        if (currentView === 'users') {
            if (editingItem) {
                userForm.put(route('admin.users.update', editingItem.id), options);
            } else {
                userForm.post(route('admin.users.store'), options);
            }
        } else if (currentView === 'roles') {
            if (editingItem) {
                roleForm.put(route('admin.roles.update', editingItem.id), options);
            } else {
                roleForm.post(route('admin.roles.store'), options);
            }
        } else if (currentView === 'contract-types') {
            if (editingItem) {
                typeForm.put(route('admin.contract-types.update', editingItem.id), options);
            } else {
                typeForm.post(route('admin.contract-types.store'), options);
            }
        } else if (currentView === 'workflows') {
            if (editingItem) {
                workflowForm.put(route('admin.workflows.update', editingItem.id), options);
            } else {
                workflowForm.post(route('admin.workflows.store'), options);
            }
        } else if (currentView === 'module-groups') {
            if (editingItem) {
                moduleGroupForm.put(route('admin.module-groups.update', editingItem.id), options);
            } else {
                moduleGroupForm.post(route('admin.module-groups.store'), options);
            }
        } else if (currentView === 'modules') {
            if (editingItem) {
                moduleForm.put(route('admin.modules.update', editingItem.id), options);
            } else {
                moduleForm.post(route('admin.modules.store'), options);
            }
        } else if (currentView === 'navigation') {
            const type = (window as any).__nav_modal_type;
            if (type === 'group') {
                if (editingItem) {
                    moduleGroupForm.put(route('admin.module-groups.update', editingItem.id), options);
                } else {
                    moduleGroupForm.post(route('admin.module-groups.store'), options);
                }
            } else {
                if (editingItem) {
                    moduleForm.put(route('admin.modules.update', editingItem.id), options);
                } else {
                    moduleForm.post(route('admin.modules.store'), options);
                }
            }
        }
    };

    const handleDelete = (id: any) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            const url = {
                'users': route('admin.users.destroy', id),
                'roles': route('admin.roles.destroy', id),
                'contract-types': route('admin.contract-types.destroy', id),
                'workflows': route('admin.workflows.destroy', id),
                'module-groups': route('admin.module-groups.destroy', id),
                'modules': route('admin.modules.destroy', id),
                'navigation': '#', // Handled via handleDeleteNav
            }[currentView];
            if (url !== '#') router.delete(url);
        }
    };

    // Helper to get route by name (Inertia might not have global route helper depending on config)
    // Here we assume ziggy is available or we use hardcoded paths if needed. 
    // Usually standard in Laravel starters.
    const route = (name: string, id?: any) => {
        const base = name.split('.').slice(1).join('/').replace('destroy', '').replace('update', '').replace('store', '');
        if (id) return `/admin/${base}/${id}`;
        return `/admin/${base}`;
    };

    const [expandedWorkflowId, setExpandedWorkflowId] = useState<any>(null);

    const toggleExpand = (id: any) => {
        setExpandedWorkflowId(expandedWorkflowId === id ? null : id);
    };

    return (
        <>
            <Head title={`Admin - ${viewTitle}`} />

            <div className="flex h-full flex-col flex-1 divide-y divide-border">
                {/* Header Section */}
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold leading-none">{viewTitle}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Kelola data {viewTitle.toLowerCase()} sistem Anda.</p>
                        </div>
                    </div>
                    {currentView !== 'navigation' && canCreate && (
                        <Button className="gap-2" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Tambah {
                                currentView === 'users' ? 'Pengguna' : 
                                currentView === 'roles' ? 'Role' : 
                                currentView === 'contract-types' ? 'Tipe' : 
                                currentView === 'workflows' ? 'Alur' : 
                                currentView === 'module-groups' ? 'Grup' : 'Modul'
                            }
                        </Button>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-auto p-4 bg-slate-50/30">
                    {currentView === 'navigation' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-medium text-slate-500">Susun urutan menu dengan menarik icon grid {(!canUpdate && !canCreate) && "(Read Only)"}</h3>
                                <div className="flex gap-2">
                                    {canCreate && (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setEditingItem(null);
                                                moduleGroupForm.reset();
                                                (window as any).__nav_modal_type = 'group';
                                                setIsModalOpen(true);
                                            }}>
                                                <Plus className="h-3.5 w-3.5 mr-2" />
                                                Grup Baru
                                            </Button>
                                            <Button size="sm" onClick={() => {
                                                setEditingItem(null);
                                                moduleForm.reset();
                                                (window as any).__nav_modal_type = 'module';
                                                setIsModalOpen(true);
                                            }}>
                                                <Plus className="h-3.5 w-3.5 mr-2" />
                                                Modul Baru
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-white border rounded-xl p-6 shadow-sm">
                                <DndContext 
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="space-y-6 w-full">
                                        <SortableContext 
                                            items={navigationData.map(g => g.id)} 
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {navigationData.map((group) => (
                                                <SortableGroupItem 
                                                    key={group.id} 
                                                    group={group} 
                                                    modules={group.modules || []}
                                                    canUpdate={canUpdate}
                                                    canDelete={canDelete}
                                                    onEditGroup={(g: any) => {
                                                        setEditingItem(g);
                                                        moduleGroupForm.setData({
                                                            title: g.title,
                                                            sort_number: g.sort_number,
                                                        });
                                                        (window as any).__nav_modal_type = 'group';
                                                        setIsModalOpen(true);
                                                    }}
                                                    onDeleteGroup={(id: string) => handleDeleteNav('group', id)}
                                                    onEditModule={(m: any) => {
                                                        setEditingItem(m);
                                                        moduleForm.setData({
                                                            code: m.code,
                                                            title: m.title,
                                                            sort_number: m.sort_number,
                                                            url: m.url || '',
                                                            icon: m.icon || '',
                                                            module_group_id: m.module_group_id,
                                                            showed_as_menu: !!m.showed_as_menu,
                                                        });
                                                        (window as any).__nav_modal_type = 'module';
                                                        setIsModalOpen(true);
                                                    }}
                                                    onDeleteModule={(id: string) => handleDeleteNav('module', id)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </div>

                                    <DragOverlay>
                                        {activeItem ? (
                                            activeItem.type === 'group' ? (
                                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-primary shadow-xl opacity-80 w-full">
                                                    <div className="flex items-center gap-3">
                                                        <LayoutGrid className="h-4 w-4 text-primary" />
                                                        <span className="font-bold text-slate-700 uppercase tracking-widest text-xs">{activeItem.title}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-3 bg-white border-2 border-primary rounded-lg shadow-xl opacity-80 w-[300px]">
                                                    <div className="flex items-center gap-3">
                                                        <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 text-xs">{activeItem.title}</span>
                                                            <span className="text-[10px] font-mono text-slate-400">{activeItem.code}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-[13px] border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100 bg-white text-left">
                                    <th className="px-6 py-4 uppercase text-[10px] tracking-widest font-bold text-slate-500">ID</th>
                                    <th className="px-6 py-4 uppercase text-[10px] tracking-widest font-bold text-slate-500">{currentView === 'users' ? 'Identitas Pengguna' : 'Informasi Item'}</th>
                                    <th className="px-6 py-4 uppercase text-[10px] tracking-widest font-bold text-slate-500">{currentView === 'users' ? 'Role & Akses' : 'Metadata / Detail'}</th>
                                    <th className="px-6 py-4 uppercase text-[10px] tracking-widest font-bold text-slate-500 text-right">Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {currentView === 'users' && users?.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{String(u.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{u.name}</span>
                                                <span className="text-[11px] text-slate-500">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-0.5 border border-slate-300 rounded text-[10px] font-bold uppercase tracking-tight text-slate-700">
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canUpdate && (
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)}>
                                                        <Pencil className="h-3.5 w-3.5 text-slate-600" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(u.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'roles' && roles?.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{String(r.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 uppercase tracking-tighter">{r.name}</td>
                                        <td className="px-6 py-4 text-slate-500 italic text-[12px]">{r.description || 'Tidak ada deskripsi'}</td>
                                        <td className="px-6 py-4 text-right">
                                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 {canUpdate && (
                                                    <>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Kelola Akses" onClick={() => router.visit(`/admin/roles/${r.id}/access`)}>
                                                            <Key className="h-3.5 w-3.5 text-slate-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(r)}>
                                                            <Pencil className="h-3.5 w-3.5 text-slate-600" />
                                                        </Button>
                                                    </>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(r.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'contract-types' && types?.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{String(t.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 uppercase tracking-tighter">{t.name}</td>
                                        <td className="px-6 py-4 text-slate-500 italic text-[12px]">{t.description || 'Tidak ada deskripsi'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canUpdate && (
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(t)}>
                                                        <Pencil className="h-3.5 w-3.5 text-slate-600" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(t.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'workflows' && workflows?.map((w) => (
                                    <React.Fragment key={w.id}>
                                        <tr className={cn(
                                            "hover:bg-slate-50/50 transition-all group border-l-2 border-transparent",
                                            expandedWorkflowId === w.id && "bg-slate-50 border-primary shadow-inner"
                                        )}>
                                            <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{String(w.id).substring(0, 8)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleExpand(w.id)}
                                                        className="p-1 hover:bg-white border rounded shadow-sm transition-all"
                                                    >
                                                        {expandedWorkflowId === w.id ? <ChevronDown className="h-3 w-3 text-slate-600" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                                                    </button>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 uppercase tracking-tight">{w.name}</span>
                                                            {w.is_default && <span className="text-[9px] font-black bg-slate-200 px-1.5 py-0.5 rounded tracking-tighter uppercase">Default</span>}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{w.contract_type}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {w.steps?.slice(0, 3).map((step: any, i: number) => (
                                                            <div key={i} className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                                                                {step.role?.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {w.steps?.length > 3 && (
                                                            <div className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-700">
                                                                +{w.steps.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] font-medium text-slate-600">{w.steps?.length || 0} Approval Steps</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canUpdate && (
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(w)}>
                                                            <Pencil className="h-3.5 w-3.5 text-slate-600" />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(w.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedWorkflowId === w.id && (
                                            <tr className="bg-slate-50/80">
                                                <td colSpan={4} className="px-16 py-6">
                                                    <div className="relative border-l-2 border-slate-200 pl-8 space-y-6 py-2">
                                                        {w.steps?.sort((a: any, b: any) => a.step - b.step).map((step: any, idx: number) => (
                                                            <div key={step.id} className="relative">
                                                                {/* Connector dot */}
                                                                <div className="absolute -left-[37px] top-1 h-4 w-4 rounded-full border-2 border-white bg-slate-300 ring-4 ring-slate-50/80" />
                                                                
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Step {step.step}</span>
                                                                        <span className="h-[1px] w-4 bg-slate-200" />
                                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{step.role}</span>
                                                                    </div>
                                                                    <p className="text-xs font-bold text-slate-800">{step.name}</p>
                                                                    <p className="text-[10px] text-slate-500 italic max-w-sm mt-1">Personil yang memiliki otorisasi untuk melakukan peninjauan dan persetujuan pada tahap ini.</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!w.steps || w.steps.length === 0) && (
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <AlertCircle className="h-3 w-3" />
                                                                <p className="text-[11px] italic font-medium">Belum ada tahapan alur kerja yang didefinisikan untuk tipe ini.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}

                                {currentView === 'module-groups' && groups?.map((g) => (
                                    <tr key={g.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{String(g.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 tabular-nums">#{g.sort_number}</span>
                                                <span className="font-bold text-slate-900 uppercase tracking-tighter">{g.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 italic text-[12px]">Kelola grup untuk navigasi sidebar utama.</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(g)}>
                                                    <Pencil className="h-3.5 w-3.5 text-slate-600" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(g.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>
            </div>

            {/* CRUD Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? 'Edit' : 'Tambah'} {' '}
                            {currentView === 'users' ? 'Pengguna' : 
                             currentView === 'roles' ? 'Role' : 
                             currentView === 'contract-types' ? 'Tipe' : 
                             currentView === 'workflows' ? 'Alur' : 
                             currentView === 'module-groups' ? 'Grup Modul' : 
                             currentView === 'navigation' ? ((window as any).__nav_modal_type === 'group' ? 'Grup' : 'Modul') : 'Modul'}
                        </DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk {editingItem ? 'memperbarui' : 'menambahkan'} data.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {currentView === 'users' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <Input id="name" value={userForm.data.name} onChange={e => userForm.setData('name', e.target.value)} required />
                                        {userForm.errors.name && <p className="text-xs text-destructive">{userForm.errors.name}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={userForm.data.email} onChange={e => userForm.setData('email', e.target.value)} required />
                                        {userForm.errors.email && <p className="text-xs text-destructive">{userForm.errors.email}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={userForm.data.role} onValueChange={v => userForm.setData('role', v)}>
                                            <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                                            <SelectContent>
                                                {roles?.map(r => (
                                                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                                ))}
                                                {(!roles || roles.length === 0) && (
                                                    <>
                                                        <SelectItem value="Admin">Admin</SelectItem>
                                                        <SelectItem value="Initiator">Initiator</SelectItem>
                                                        <SelectItem value="Legal">Legal</SelectItem>
                                                        <SelectItem value="Tax">Tax</SelectItem>
                                                        <SelectItem value="Management">Management</SelectItem>
                                                        <SelectItem value="Direksi">Direksi</SelectItem>
                                                        <SelectItem value="Vendor">Vendor</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">{editingItem ? 'Password Baru (Kosongkan jika tidak ganti)' : 'Password'}</Label>
                                        <Input id="password" type="password" value={userForm.data.password} onChange={e => userForm.setData('password', e.target.value)} required={!editingItem} />
                                        {userForm.errors.password && <p className="text-xs text-destructive">{userForm.errors.password}</p>}
                                    </div>
                                </>
                            )}

                            {currentView === 'roles' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-name">Nama Role</Label>
                                        <Input id="role-name" value={roleForm.data.name} onChange={e => roleForm.setData('name', e.target.value)} required />
                                        {roleForm.errors.name && <p className="text-xs text-destructive">{roleForm.errors.name}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-description">Deskripsi</Label>
                                        <Input id="role-description" value={roleForm.data.description} onChange={e => roleForm.setData('description', e.target.value)} />
                                    </div>
                                </>
                            )}

                            {currentView === 'contract-types' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type-name">Nama Tipe</Label>
                                        <Input id="type-name" value={typeForm.data.name} onChange={e => typeForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Deskripsi</Label>
                                        <Input id="description" value={typeForm.data.description} onChange={e => typeForm.setData('description', e.target.value)} />
                                    </div>
                                </>
                            )}

                            {currentView === 'workflows' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wf-name">Nama Alur Kerja</Label>
                                        <Input id="wf-name" value={workflowForm.data.name} onChange={e => workflowForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ct">Tipe Kontrak</Label>
                                        <Select value={workflowForm.data.contract_type} onValueChange={v => workflowForm.setData('contract_type', v)}>
                                            <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                                            <SelectContent>
                                                {contractTypes?.map(ct => (
                                                    <SelectItem key={ct.id} value={ct.name}>{ct.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wf-desc">Deskripsi</Label>
                                        <Input id="wf-desc" value={workflowForm.data.description} onChange={e => workflowForm.setData('description', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_default"
                                            checked={workflowForm.data.is_default}
                                            onChange={e => workflowForm.setData('is_default', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="is_default">Jadikan Default</Label>
                                    </div>
                                </>
                            )}

                            {(currentView === 'navigation' ? (window as any).__nav_modal_type === 'group' : currentView === 'module-groups') && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mg-title">Nama Grup</Label>
                                        <Input id="mg-title" value={moduleGroupForm.data.title} onChange={e => moduleGroupForm.setData('title', e.target.value)} />
                                        {moduleGroupForm.errors.title && <p className="text-xs text-red-500">{moduleGroupForm.errors.title}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mg-sort">Nomor Urut</Label>
                                        <Input id="mg-sort" type="number" value={moduleGroupForm.data.sort_number} onChange={e => moduleGroupForm.setData('sort_number', parseInt(e.target.value))} />
                                    </div>
                                </>
                            )}

                            {(currentView === 'navigation' ? (window as any).__nav_modal_type === 'module' : currentView === 'modules') && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="m-code">Kode (Max 10)</Label>
                                            <Input id="m-code" value={moduleForm.data.code} onChange={e => moduleForm.setData('code', e.target.value)} maxLength={10} />
                                            {moduleForm.errors.code && <p className="text-xs text-red-500">{moduleForm.errors.code}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="m-sort">Nomor Urut</Label>
                                            <Input id="m-sort" type="number" value={moduleForm.data.sort_number} onChange={e => moduleForm.setData('sort_number', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-title">Judul Menu</Label>
                                        <Input id="m-title" value={moduleForm.data.title} onChange={e => moduleForm.setData('title', e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-group">Grup Modul</Label>
                                        <Select value={moduleForm.data.module_group_id} onValueChange={v => moduleForm.setData('module_group_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Pilih Grup" /></SelectTrigger>
                                            <SelectContent>
                                                {(moduleGroups || (navigationData || [])).map(g => (
                                                    <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-url">URL / Route</Label>
                                        <Input id="m-url" value={moduleForm.data.url} onChange={e => moduleForm.setData('url', e.target.value)} placeholder="/admin/..." />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-icon">Icon (Optional)</Label>
                                        <Input id="m-icon" value={moduleForm.data.icon} onChange={e => moduleForm.setData('icon', e.target.value)} placeholder="fa-solid fa-..." />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="showed_as_menu"
                                            checked={moduleForm.data.showed_as_menu}
                                            onChange={e => moduleForm.setData('showed_as_menu', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="showed_as_menu">Tampilkan di Sidebar</Label>
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={userForm.processing || roleForm.processing || typeForm.processing || workflowForm.processing || moduleGroupForm.processing || moduleForm.processing}>
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
