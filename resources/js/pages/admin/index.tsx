import React, { useState, FormEvent } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Users, ShieldCheck, Settings2, GitBranch, Plus, 
    Pencil, Trash2, Key, LayoutGrid, ChevronRight, 
    ChevronDown, GitMerge, AlertCircle, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissions } from '@/hooks/use-permissions';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
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
import { GripVertical } from 'lucide-react';

interface Props {
    currentView: string;
    users?: any[];
    roles?: any[];
    contractTypes?: any[];
    types?: any[];
    workflows?: any[];
    groups?: any[];
    modules?: any[];
    moduleGroups?: any[];
}

const SortableStepItem = ({ 
    id,
    step, 
    index, 
    roles, 
    users,
    onRemove, 
    onUpdateRole, 
    onUpdateType,
    onUpdateUserIds,
    onUpdateDesc 
}: { 
    id: string;
    step: any; 
    index: number; 
    roles: any[]; 
    users: any[];
    onRemove: () => void;
    onUpdateRole: (role: string) => void;
    onUpdateType: (type: 'role' | 'user') => void;
    onUpdateUserIds: (userIds: string[] | null) => void;
    onUpdateDesc: (desc: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const filteredUsers = users?.filter(u => u.role === (step.role || roles?.[0]?.name)) || [];

    return (
        <div 
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative bg-white rounded-lg p-2 border border-slate-200 transition-all flex flex-col gap-2",
                isDragging && "opacity-50 ring-2 ring-primary border-primary z-[100] shadow-xl"
            )}
        >
            <div className="flex gap-2 items-center">
                <div {...attributes} {...listeners} className="cursor-grab hover:bg-slate-100 p-1 rounded shrink-0">
                    <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                </div>
                
                <div className="bg-slate-950 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    {index + 1}
                </div>

                <div className="flex-1 flex gap-2 items-center min-w-0">
                    <div className="relative shrink-0">
                        <select 
                            className="flex h-7 min-w-[80px] rounded border border-input bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold shadow-sm focus:ring-1 focus:ring-primary/20 appearance-none pr-6"
                            value={step.role} 
                            onChange={e => onUpdateRole(e.target.value)}
                            required
                        >
                            {roles?.map((r: any) => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-0.5 rounded-md h-7 shrink-0">
                        <button 
                            type="button"
                            onClick={() => onUpdateType('role')}
                            className={cn(
                                "px-2 text-[9px] font-black uppercase tracking-tighter rounded transition-all",
                                step.approver_type === 'role' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Role
                        </button>
                        <button 
                            type="button"
                            onClick={() => onUpdateType('user')}
                            className={cn(
                                "px-2 text-[9px] font-black uppercase tracking-tighter rounded transition-all",
                                step.approver_type === 'user' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            User
                        </button>
                    </div>

                    <Input 
                        className="h-7 text-[10px] bg-white flex-1 border-dashed hover:border-solid hover:bg-slate-50 transition-all px-2 shadow-none focus-visible:ring-0 focus-visible:border-primary/30" 
                        placeholder="Instruksi singkat..." 
                        value={step.description}
                        onChange={e => onUpdateDesc(e.target.value)}
                    />
                </div>

                <button 
                    type="button"
                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                    onClick={onRemove}
                >
                    <Trash2 className="h-3 w-3.5" />
                </button>
            </div>

            {step.approver_type === 'user' && (
                <div className="pl-12 pr-2 pb-1">
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 bg-slate-50 rounded-md border border-slate-200">
                        {filteredUsers.length > 0 ? filteredUsers.map(u => (
                            <label key={u.id} className="flex items-center gap-1.5 bg-white border px-2 py-1 rounded-full cursor-pointer hover:border-primary/50 transition-all group/user">
                                <Checkbox 
                                    className="h-3 w-3"
                                    checked={step.user_ids?.includes(u.id)}
                                    onCheckedChange={(checked) => {
                                        const currentIds = step.user_ids || [];
                                        const newIds = checked 
                                            ? [...currentIds, u.id]
                                            : currentIds.filter((id: string) => id !== u.id);
                                        onUpdateUserIds(newIds.length > 0 ? newIds : null);
                                    }}
                                />
                                <span className="text-[9px] font-bold text-slate-600 group-hover/user:text-primary transition-colors">{u.name}</span>
                            </label>
                        )) : (
                            <p className="text-[9px] font-bold text-slate-400 italic">Tidak ada user dengan role ini</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function AdminIndex({ 
    currentView, 
    users, 
    roles, 
    contractTypes, 
    types, 
    workflows, 
    groups, 
    modules, 
    moduleGroups 
}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [expandedWorkflowId, setExpandedWorkflowId] = useState<any>(null);

    const viewTitleMap: Record<string, string> = {
        'users': 'Manajemen Pengguna',
        'roles': 'Manajemen Role',
        'contract-types': 'Tipe Kontrak',
        'workflows': 'Alur Kerja',
        'module-groups': 'Grup Modul',
        'modules': 'Modul & Menu',
    };

    const viewIconMap: Record<string, any> = {
        'users': Users,
        'roles': ShieldCheck,
        'contract-types': Settings2,
        'workflows': GitBranch,
        'module-groups': LayoutGrid,
        'modules': LayoutGrid,
    };

    const viewModuleMap: Record<string, string> = {
        'users': 'USERS',
        'roles': 'ROLES',
        'contract-types': 'CTC_TYPES',
        'workflows': 'WORKFLOWS',
        'module-groups': 'NAV_MGMT',
        'modules': 'NAV_MGMT',
    };

    const viewTitle = viewTitleMap[currentView] || 'Admin';
    const Icon = viewIconMap[currentView] || Settings2;
    
    const moduleCode = viewModuleMap[currentView] || 'ADMIN';
    const { canCreate, canUpdate, canDelete } = usePermissions(moduleCode);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Removed handleDragEnd for modal as steps are now inline-only

    // Forms
    const userForm = useForm({
        name: '',
        email: '',
        role: roles?.[0]?.name || '',
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

    const inlineWorkflowForm = useForm({
        steps: [] as { 
            role: string; 
            approver_type: 'role' | 'user'; 
            user_ids: string[] | null; 
            description: string 
        }[],
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
                password: '',
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
                is_default: !!item.is_default,
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
                showed_as_menu: !!item.showed_as_menu,
            });
        }
        setIsModalOpen(true);
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
        }
    };

    const handleDelete = (id: any) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            const urlMap: Record<string, string> = {
                'users': route('admin.users.destroy', id),
                'roles': route('admin.roles.destroy', id),
                'contract-types': route('admin.contract-types.destroy', id),
                'workflows': route('admin.workflows.destroy', id),
                'module-groups': route('admin.module-groups.destroy', id),
                'modules': route('admin.modules.destroy', id),
            };
            const url = urlMap[currentView];
            if (url) router.delete(url);
        }
    };

    const route = (name: string, id?: any) => {
        const base = name.split('.').slice(1).join('/').replace('destroy', '').replace('update', '').replace('store', '');
        if (id) return `/admin/${base}/${id}`;
        return `/admin/${base}`;
    };

    const toggleExpand = (id: any) => {
        if (expandedWorkflowId === id) {
            setExpandedWorkflowId(null);
        } else {
            const workflow = workflows?.find(w => w.id === id);
            setExpandedWorkflowId(id);
            if (workflow) {
                const steps = workflow.steps?.map((s: any) => ({
                    role: s.role,
                    approver_type: s.approver_type || 'role',
                    user_ids: s.user_ids || null,
                    description: s.description || '',
                })) || [];
                inlineWorkflowForm.setData('steps', steps);
            }
        }
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
                    {canCreate && (
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
                    <div className="bg-card border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-[13px] border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 text-left">
                                    <th className="px-6 py-3 uppercase text-[9px] tracking-[0.15em] font-black text-slate-500 w-16">ID</th>
                                    <th className="px-6 py-3 uppercase text-[9px] tracking-[0.15em] font-black text-slate-500">
                                        {currentView === 'users' ? 'Identitas Pengguna' : 'Informasi Item'}
                                    </th>
                                    <th className="px-6 py-3 uppercase text-[9px] tracking-[0.15em] font-black text-slate-500">
                                        {currentView === 'users' ? 'Role & Akses' : 'Metadata / Detail'}
                                    </th>
                                    <th className="px-6 py-3 uppercase text-[9px] tracking-[0.15em] font-black text-slate-500 text-right">Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {currentView === 'users' && users?.map((u: any) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group border-l-2 border-transparent hover:border-blue-400">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[9px] tracking-tighter tabular-nums">{String(u.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-700 border border-blue-200">
                                                    {u.name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 uppercase tracking-tighter text-[12px]">{u.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tighter shadow-sm">
                                                    {u.role}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">System Access Granted</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canUpdate && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => openEdit(u)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-all" onClick={() => handleDelete(u.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'roles' && roles?.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group border-l-2 border-transparent hover:border-slate-800">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[9px] tracking-tighter tabular-nums">{String(r.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4 font-black text-slate-900 uppercase tracking-tighter text-[12px]">{r.name}</td>
                                        <td className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">{r.description || 'Tidak ada deskripsi'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-600 transition-all" title="Kelola Akses" onClick={() => router.get(`/admin/roles/${r.id}/access`)}>
                                                    <Key className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-600 transition-all" title="Kelola Navigasi" onClick={() => router.get(`/admin/roles/${r.id}/navigation`)}>
                                                    <LayoutGrid className="h-3.5 w-3.5" />
                                                </Button>
                                                {canUpdate && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => openEdit(r)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-all" onClick={() => handleDelete(r.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'contract-types' && (contractTypes || types)?.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group border-l-2 border-transparent hover:border-slate-800">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[9px] tracking-tighter tabular-nums">{String(t.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4 font-black text-slate-900 uppercase tracking-tighter text-[12px]">{t.name}</td>
                                        <td className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">{t.description || 'Tidak ada deskripsi'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canUpdate && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => openEdit(t)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-all" onClick={() => handleDelete(t.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'workflows' && workflows?.map((w: any) => (
                                    <React.Fragment key={w.id}>
                                        <tr className={cn(
                                            "hover:bg-slate-50/80 transition-all group border-l-2 border-transparent",
                                            expandedWorkflowId === w.id && "bg-slate-50/50 border-primary shadow-sm"
                                        )}>
                                            <td className="px-6 py-4 text-slate-400 font-mono text-[9px] tracking-tighter tabular-nums">{String(w.id).substring(0, 8)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleExpand(w.id)}
                                                        className={cn(
                                                            "p-1.5 hover:bg-white border rounded shadow-sm transition-all",
                                                            expandedWorkflowId === w.id ? "bg-white border-primary/20" : "bg-slate-50/50"
                                                        )}
                                                    >
                                                        {expandedWorkflowId === w.id ? <ChevronDown className="h-3 w-3 text-primary" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                                                    </button>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 uppercase tracking-tighter text-[12px]">{w.name}</span>
                                                            {w.is_default && <span className="text-[8px] font-black bg-slate-950 text-white px-1.5 py-0.5 rounded tracking-tighter uppercase shadow-sm">Default</span>}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{w.contract_type}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {w.steps?.slice(0, 3).map((step: any, i: number) => (
                                                            <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-800 border border-slate-200 uppercase">
                                                                {step.role?.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {w.steps?.length > 3 && (
                                                            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-800 flex items-center justify-center text-[9px] font-black text-white border border-slate-700 shadow-sm">
                                                                +{w.steps.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{w.steps?.length || 0} Approval Steps</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sequence Configured</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canUpdate && (
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => openEdit(w)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-all" onClick={() => handleDelete(w.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedWorkflowId === w.id && (
                                            <tr className="bg-slate-50 border-l-2 border-primary">
                                                <td colSpan={4} className="px-12 py-8">
                                                    <div className="flex flex-col gap-5 max-w-2xl">
                                                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                                            <div className="flex items-center gap-2">
                                                                <GitMerge className="h-4 w-4 text-primary" />
                                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Review & Approval Sequence</h4>
                                                            </div>
                                                            <Badge variant="outline" className="bg-white text-[9px] font-black h-5 uppercase tracking-tighter shadow-sm border-slate-200 px-2">
                                                                {w.steps?.length || 0} Stages
                                                            </Badge>
                                                        </div>
                                                        
                                                        <div className="relative space-y-4">
                                                             <div className="p-1 border rounded-xl bg-slate-50/50">
                                                                <DndContext
                                                                    sensors={sensors}
                                                                    collisionDetection={closestCenter}
                                                                    onDragEnd={(event) => {
                                                                        const { active, over } = event;
                                                                        if (over && active.id !== over.id) {
                                                                            const oldIndex = parseInt(String(active.id).split('-')[2]);
                                                                            const newIndex = parseInt(String(over.id).split('-')[2]);
                                                                            const newSteps = arrayMove(inlineWorkflowForm.data.steps, oldIndex, newIndex);
                                                                            inlineWorkflowForm.setData('steps', newSteps);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                                                                        <SortableContext 
                                                                            items={inlineWorkflowForm.data.steps.map((_, i) => `inline-step-${i}`)} 
                                                                            strategy={verticalListSortingStrategy}
                                                                        >
                                                                            {inlineWorkflowForm.data.steps.map((step, index) => (
                                                                                <SortableStepItem 
                                                                                    key={`inline-step-${index}`}
                                                                                    id={`inline-step-${index}`}
                                                                                    step={step}
                                                                                    index={index}
                                                                                    roles={roles || []}
                                                                                    users={users || []}
                                                                                    onRemove={() => {
                                                                                        const newSteps = inlineWorkflowForm.data.steps.filter((_, i) => i !== index);
                                                                                        inlineWorkflowForm.setData('steps', newSteps);
                                                                                    }}
                                                                                    onUpdateRole={(role) => {
                                                                                        const newSteps = [...inlineWorkflowForm.data.steps];
                                                                                        newSteps[index].role = role;
                                                                                        inlineWorkflowForm.setData('steps', newSteps);
                                                                                    }}
                                                                                    onUpdateType={(type) => {
                                                                                        const newSteps = [...inlineWorkflowForm.data.steps];
                                                                                        newSteps[index].approver_type = type;
                                                                                        newSteps[index].user_ids = null;
                                                                                        inlineWorkflowForm.setData('steps', newSteps);
                                                                                    }}
                                                                                    onUpdateUserIds={(userIds) => {
                                                                                        const newSteps = [...inlineWorkflowForm.data.steps];
                                                                                        newSteps[index].user_ids = userIds;
                                                                                        inlineWorkflowForm.setData('steps', newSteps);
                                                                                    }}
                                                                                    onUpdateDesc={(description) => {
                                                                                        const newSteps = [...inlineWorkflowForm.data.steps];
                                                                                        newSteps[index].description = description;
                                                                                        inlineWorkflowForm.setData('steps', newSteps);
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </SortableContext>
                                                                        
                                                                        <div className="flex gap-2 p-1">
                                                                            <Button 
                                                                                type="button" 
                                                                                variant="outline" 
                                                                                size="sm" 
                                                                                className="h-8 flex-1 text-[10px] font-black uppercase tracking-tighter"
                                                                                onClick={() => inlineWorkflowForm.setData('steps', [...inlineWorkflowForm.data.steps, { role: roles?.[0]?.name || '', approver_type: 'role', user_ids: null, description: '' }])}
                                                                            >
                                                                                <Plus className="h-3 w-3 mr-1" /> Tambah Step Inline
                                                                            </Button>
                                                                            {JSON.stringify(inlineWorkflowForm.data.steps) !== JSON.stringify(w.steps?.map((s: any) => ({
                                                                                role: s.role,
                                                                                approver_type: s.approver_type || 'role',
                                                                                user_ids: s.user_ids || null,
                                                                                description: s.description || '',
                                                                            })) || []) && (
                                                                                <Button 
                                                                                    type="button" 
                                                                                    size="sm" 
                                                                                    className="h-8 text-[10px] font-black uppercase tracking-tighter shadow-sm"
                                                                                    disabled={inlineWorkflowForm.processing}
                                                                                    onClick={() => inlineWorkflowForm.put(route('admin.workflows.update', w.id), {
                                                                                        preserveScroll: true,
                                                                                        onSuccess: () => {
                                                                                            setExpandedWorkflowId(null);
                                                                                            inlineWorkflowForm.reset();
                                                                                        }
                                                                                    })}
                                                                                >
                                                                                    {inlineWorkflowForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </DndContext>
                                                             </div>
                                                         </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}

                                {currentView === 'module-groups' && (moduleGroups || groups)?.map((g: any) => (
                                    <tr key={g.id} className="hover:bg-slate-50/50 transition-colors group border-l-2 border-transparent hover:border-slate-800">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[9px] tracking-tighter tabular-nums">{String(g.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 w-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-200 tabular-nums">
                                                    #{g.sort_number}
                                                </div>
                                                <span className="font-black text-slate-900 uppercase tracking-tighter text-[12px]">{g.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Grup Menu Navigasi Utama</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canUpdate && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => openEdit(g)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-all" onClick={() => handleDelete(g.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentView === 'modules' && modules?.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group border-l-2 border-transparent hover:border-slate-800">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[9px] tracking-tighter tabular-nums">{String(m.id).substring(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 tracking-tighter font-black text-[9px]">
                                                    {m.icon ? <i className={cn("fa-solid h-4 w-4 flex items-center justify-center", m.icon)} /> : m.code?.substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 uppercase tracking-tighter text-[12px]">{m.title}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.code}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter border border-slate-200">
                                                    {moduleGroups?.find((mg: any) => mg.id === m.module_group_id)?.title || 'No Group'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Route: {m.url || '#'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canUpdate && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => openEdit(m)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-all" onClick={() => handleDelete(m.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CRUD Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className={cn(
                    "sm:max-w-[425px] overflow-hidden border-none shadow-2xl p-0",
                    currentView === 'workflows' && "sm:max-w-[500px]"
                )}>
                    <div className="bg-slate-950 p-6 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Icon className="h-24 w-24 rotate-12" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <div className="bg-primary h-8 w-2 rounded-full" />
                            {editingItem ? 'Edit' : 'Tambah'} {' '}
                            {currentView === 'users' ? 'Pengguna' : 
                             currentView === 'roles' ? 'Role' : 
                             currentView === 'contract-types' ? 'Tipe' : 
                             currentView === 'workflows' ? 'Alur Kerja' : 
                             currentView === 'module-groups' ? 'Grup' : 'Modul'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium text-[12px] mt-1">
                            {editingItem ? 'Silakan perbarui detail entitas di bawah ini.' : 'Isi formulir untuk mendaftarkan entitas baru ke sistem.'}
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid gap-4 py-4">
                            {currentView === 'users' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <Input id="name" value={userForm.data.name} onChange={e => userForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={userForm.data.email} onChange={e => userForm.setData('email', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <select 
                                            id="role" 
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={userForm.data.role} 
                                            onChange={e => userForm.setData('role', e.target.value)}
                                        >
                                            {roles?.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password {editingItem && '(Kosongkan jika tidak ingin mengubah)'}</Label>
                                        <Input id="password" type="password" value={userForm.data.password} onChange={e => userForm.setData('password', e.target.value)} required={!editingItem} />
                                    </div>
                                </>
                            )}

                            {currentView === 'roles' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-name">Nama Role</Label>
                                        <Input id="role-name" value={roleForm.data.name} onChange={e => roleForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-desc">Deskripsi</Label>
                                        <Input id="role-desc" value={roleForm.data.description} onChange={e => roleForm.setData('description', e.target.value)} />
                                    </div>
                                </>
                            )}

                            {currentView === 'contract-types' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type-name">Nama Tipe Kontrak</Label>
                                        <Input id="type-name" value={typeForm.data.name} onChange={e => typeForm.setData('name', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type-desc">Deskripsi</Label>
                                        <Input id="type-desc" value={typeForm.data.description} onChange={e => typeForm.setData('description', e.target.value)} />
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
                                        <Label htmlFor="wf-type">Tipe Kontrak</Label>
                                        <select 
                                            id="wf-type" 
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={workflowForm.data.contract_type} 
                                            onChange={e => workflowForm.setData('contract_type', e.target.value)}
                                            required
                                        >
                                            <option value="">Pilih Tipe</option>
                                            {(contractTypes || types)?.map((t: any) => (
                                                <option key={t.id} value={t.name}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Steps removed from modal as per request */}
                                    <div className="flex items-center gap-2 pt-2 border-t">
                                        <Checkbox 
                                            id="wf-default" 
                                            checked={workflowForm.data.is_default} 
                                            onCheckedChange={checked => workflowForm.setData('is_default', !!checked)} 
                                        />
                                        <Label htmlFor="wf-default" className="text-[11px] font-bold text-slate-600 cursor-pointer">Set sebagai alur kerja default untuk tipe ini</Label>
                                    </div>
                                </>
                            )}

                            {currentView === 'module-groups' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mg-title">Judul Grup</Label>
                                        <Input id="mg-title" value={moduleGroupForm.data.title} onChange={e => moduleGroupForm.setData('title', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mg-sort">Nomor Urut</Label>
                                        <Input id="mg-sort" type="number" value={moduleGroupForm.data.sort_number} onChange={e => moduleGroupForm.setData('sort_number', parseInt(e.target.value))} required />
                                    </div>
                                </>
                            )}

                            {currentView === 'modules' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-code">Kode Modul (Case Sensitive)</Label>
                                        <Input id="m-code" value={moduleForm.data.code} onChange={e => moduleForm.setData('code', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-title">Judul Link</Label>
                                        <Input id="m-title" value={moduleForm.data.title} onChange={e => moduleForm.setData('title', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-url">URL Path</Label>
                                        <Input id="m-url" value={moduleForm.data.url} onChange={e => moduleForm.setData('url', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-icon">Lucide Icon name</Label>
                                        <Input id="m-icon" value={moduleForm.data.icon} onChange={e => moduleForm.setData('icon', e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-group">Grup Modul</Label>
                                        <select 
                                            id="m-group" 
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={moduleForm.data.module_group_id} 
                                            onChange={e => moduleForm.setData('module_group_id', e.target.value)}
                                            required
                                        >
                                            {moduleGroups?.map((g: any) => (
                                                <option key={g.id} value={g.id}>{g.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="m-show" 
                                            checked={moduleForm.data.showed_as_menu} 
                                            onCheckedChange={checked => moduleForm.setData('showed_as_menu', !!checked)} 
                                        />
                                        <Label htmlFor="m-show">Tampilkan di Menu Sidebar</Label>
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter className="bg-slate-50 p-6 -mx-6 -mb-6 border-t mt-4 rounded-b-xl">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold text-[12px] uppercase tracking-tighter">Batal</Button>
                            <Button type="submit" disabled={userForm.processing || roleForm.processing || workflowForm.processing || typeForm.processing} className="px-8 font-black text-[12px] uppercase tracking-tighter shadow-lg shadow-primary/20">
                                {editingItem ? 'Perbarui Data' : 'Simpan Data'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
