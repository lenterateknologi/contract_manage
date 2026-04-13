import React, { useState, useMemo, useCallback, FormEvent } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Users, ShieldCheck, Settings2, GitBranch, Plus, 
    Pencil, Trash2, Key, LayoutGrid, ChevronRight, 
    ChevronDown, GitMerge, AlertCircle, Edit3,
    ChevronUp, Edit, Filter, PlusCircle, Save, 
    Search, Shield, Info, CheckCircle2, GripVertical,
    Users as UsersIcon, RefreshCw
} from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { ToastProvider, useToast } from '@/components/contracts/Toast';

// ─── Table header cell ───────────────────────────────────────────────
function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <th style={{ 
            padding: '12px 14px', 
            textAlign: 'left', 
            fontSize: 11, 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            color: 'var(--muted-foreground)', 
            borderBottom: '1px solid var(--border)', 
            whiteSpace: 'nowrap',
            background: 'rgba(0,0,0,0.02)',
            ...style 
        }}>
            {children}
        </th>
    );
}
function Td({ children, className, style, colSpan }: { children?: React.ReactNode; className?: string; style?: React.CSSProperties; colSpan?: number }) {
    return (
        <td colSpan={colSpan} style={{ 
            padding: '12px 14px', 
            fontSize: 13, 
            borderBottom: '1px solid var(--border)', 
            verticalAlign: 'middle', 
            ...style 
        }} className={className}>
            {children}
        </td>
    );
}

// ─── Sortable Step Item ───────────────────────────────────────────────
function SortableStepItem({ 
    step, 
    idx, 
    users, 
    roles, 
    updateLocalStep, 
    removeLocalStep 
}: { 
    step: any; 
    idx: number; 
    users?: any[]; 
    roles?: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: step.id });

    // Internal UI States
    const [userSearchText, setUserSearchText] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    // Filter Logic
    const filteredRoles = roles?.filter(r => 
        r.name.toLowerCase().includes(roleSearchText.toLowerCase())
    ) || [];

    const filteredUsers = users?.filter(u => {
        const matchesName = u.name.toLowerCase().includes(userSearchText.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearchText.toLowerCase());
        const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
        return matchesName && matchesRole;
    }) || [];

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-5 items-start shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 group/step relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover/step:opacity-100 transition-opacity" />
            <div 
                {...attributes} 
                {...listeners} 
                className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-[11px] shrink-0 cursor-grab active:cursor-grabbing hover:bg-slate-800 shadow-lg shadow-slate-200 transition-transform active:scale-95"
            >
                <GripVertical size={12} className="mr-0.5 opacity-40" />
                {idx + 1}
            </div>
            
            <div className="flex-1 grid grid-cols-12 gap-3">
                <div className="col-span-3 space-y-1">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tipe Otoritas</Label>
                    <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 h-7">
                        <button 
                            type="button"
                            onClick={() => updateLocalStep(idx, { approver_type: 'role', user_ids: [] })}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1 rounded font-bold text-[8px] uppercase transition-all",
                                step.approver_type === 'role' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <Shield size={9} /> Role
                        </button>
                        <button 
                            type="button"
                            onClick={() => updateLocalStep(idx, { approver_type: 'user' })}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1 rounded font-bold text-[8px] uppercase transition-all",
                                step.approver_type === 'user' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <UsersIcon size={9} /> User
                        </button>
                    </div>
                </div>

                <div className="col-span-9 space-y-1.5">
                    {step.approver_type === 'role' ? (
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                                Pilih Spesifik Role
                                {step.selected_role && <span className="text-primary normal-case font-bold">{step.selected_role}</span>}
                            </Label>
                            <Select 
                                value={step.selected_role} 
                                onValueChange={(val) => updateLocalStep(idx, { selected_role: val })}
                            >
                                <SelectTrigger className="h-8 font-bold text-slate-800 text-[11px] bg-white border-slate-200 px-3 rounded-lg hover:border-primary/30 transition-colors">
                                    <SelectValue placeholder="Cari & Pilih Role..." />
                                </SelectTrigger>
                                <SelectContent className="p-0">
                                    <div className="p-2 border-b bg-slate-50/50">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                                            <Input 
                                                placeholder="Cari role..." 
                                                className="h-7 pl-8 text-[11px] bg-white border-slate-200 shadow-sm rounded-md"
                                                value={roleSearchText}
                                                onChange={e => setRoleSearchText(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-[150px] overflow-y-auto p-1">
                                        {filteredRoles.map(r => (
                                            <SelectItem key={r.id} value={r.name} className="text-[10px] font-medium uppercase py-1.5">
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                        {filteredRoles.length === 0 && (
                                            <div className="p-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tidak ada role</div>
                                        )}
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pilih User (Filter & Search)</Label>
                            
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                                    <Input 
                                        placeholder="Cari berdasarkan nama atau email..." 
                                        className="h-8 pl-9 text-[11px] bg-white border-slate-200 shadow-sm rounded-lg focus-visible:ring-primary/20"
                                        value={userSearchText}
                                        onChange={e => setUserSearchText(e.target.value)}
                                    />
                                </div>
                                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                                    <SelectTrigger className="h-8 w-[140px] text-[10px] font-bold bg-slate-50 border-slate-200 px-3 rounded-lg uppercase tracking-tight hover:bg-slate-100 transition-colors">
                                        <Filter className="h-3 w-3 mr-1.5 text-slate-400" />
                                        <SelectValue placeholder="Filter Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Show All Roles</SelectItem>
                                        {roles?.map(r => (
                                            <SelectItem key={r.id} value={r.name} className="text-[10px] font-medium uppercase">
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner">
                                {filteredUsers.map(u => (
                                    <label key={u.id} className={cn(
                                        "group/u inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all duration-200",
                                        step.user_ids?.includes(u.id) 
                                            ? "bg-primary text-white border-primary shadow-md shadow-primary/10 scale-[1.02]" 
                                            : "bg-white border-slate-200 text-slate-600 hover:border-primary/40 hover:bg-slate-50 hover:shadow-sm"
                                    )}>
                                        <Checkbox 
                                            checked={step.user_ids?.includes(u.id)}
                                            onCheckedChange={(checked: boolean | 'indeterminate') => {
                                                const ids = step.user_ids || [];
                                                const isChecked = checked === true;
                                                updateLocalStep(idx, { user_ids: isChecked ? [...ids, u.id] : ids.filter((id: any) => id !== u.id) });
                                            }}
                                            className={cn("h-3.5 w-3.5 rounded-md transition-colors", step.user_ids?.includes(u.id) ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-primary" : "border-slate-300")}
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span className="truncate leading-tight">{u.name}</span>
                                            <span className={cn("text-[8px] opacity-60 font-medium truncate", step.user_ids?.includes(u.id) ? "text-white" : "text-slate-400")}>{u.email}</span>
                                        </div>
                                    </label>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="col-span-full py-8 text-center flex flex-col items-center gap-2">
                                        <UsersIcon size={20} className="text-slate-200" />
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">User tidak ditemukan</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                onClick={() => removeLocalStep(idx)}
                className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 mt-3"
            >
                <Trash2 size={13} />
            </Button>
        </div>
    );
}

interface PaginatedData<T> {
    data: T[];
    links: any[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        per_page: number;
    };
}

interface Props {
    currentView: string;
    users?: PaginatedData<any> | any[];
    roles?: PaginatedData<any> | any[];
    contractTypes?: PaginatedData<any> | any[];
    types?: PaginatedData<any> | any[];
    workflows?: PaginatedData<any> | any[];
    groups?: PaginatedData<any> | any[];
    modules?: PaginatedData<any> | any[];
    moduleGroups?: PaginatedData<any> | any[];
}

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
    const [expandedWorkflowId, setExpandedWorkflowId] = useState<number | null>(null);
    const [editingSteps, setEditingSteps] = useState<any[]>([]);
    const [isSavingSteps, setIsSavingSteps] = useState(false);

    const viewModuleMap: Record<string, string> = {
        'users': 'USERS',
        'roles': 'ROLES',
        'contract-types': 'CTC_TYPES',
        'workflows': 'WORKFLOWS',
        'module-groups': 'NAV_MGMT',
        'modules': 'NAV_MGMT',
    };
    
    const moduleCode = viewModuleMap[currentView] || 'ADMIN';
    const { canCreate, canUpdate, canDelete } = usePermissions(moduleCode);

    // ─── Data Accessors ──────────────────────────────────────────────
    const getPaginatedData = useCallback((prop: any) => {
        if (!prop) return { data: [], pagination: undefined };
        
        // If it's a direct array, no pagination footer
        if (Array.isArray(prop)) return { data: prop, pagination: undefined };
        
        // If it's a Laravel paginated object
        const data = prop.data || [];
        const isPaginated = prop.current_page !== undefined || prop.meta !== undefined;
        
        if (!isPaginated) return { data: [], pagination: undefined };

        // Support both direct pagination (from paginate()) and Resource pagination (from Resource::collection)
        const meta = prop.meta || prop;
        
        return {
            data: data,
            pagination: {
                currentPage: meta.current_page,
                lastPage: meta.last_page,
                total: meta.total,
                from: meta.from,
                to: meta.to,
                perPage: meta.per_page,
                onPageChange: (page: number) => {
                    router.get(window.location.pathname, { page }, { 
                        preserveState: true, 
                        preserveScroll: true 
                    });
                },
                onPerPageChange: (perPage: number) => {
                    router.get(window.location.pathname, { per_page: perPage }, { 
                        preserveState: true, 
                        preserveScroll: true 
                    });
                }
            }
        };
    }, []);

    const ensureArray = useCallback((prop: any) => {
        if (!prop) return [];
        if (Array.isArray(prop)) return prop;
        return prop.data || [];
    }, []);

    const { data: displayData, pagination } = useMemo(() => {
        switch (currentView) {
            case 'users': return getPaginatedData(users);
            case 'roles': return getPaginatedData(roles);
            case 'contract-types': return getPaginatedData(contractTypes || types);
            case 'workflows': return getPaginatedData(workflows);
            case 'module-groups': return getPaginatedData(moduleGroups || groups);
            case 'modules': return getPaginatedData(modules);
            case 'navigation': return { data: ensureArray(groups), pagination: undefined };
            default: return { data: [], pagination: undefined };
        }
    }, [currentView, users, roles, contractTypes, types, workflows, moduleGroups, groups, modules, getPaginatedData, ensureArray]);

    const getRowId = useCallback((row: any) => row.id, []);

    // ─── Columns Definition ─────────────────────────────────────────
    const columns = useMemo(() => {
        const baseColumns: Column<any>[] = [
            {
                header: 'ID',
                accessorKey: 'id',
                className: 'w-[100px]',
                cell: (row) => <span className="text-slate-400 font-mono text-[10px] tabular-nums uppercase">{String(row.id).substring(0, 8)}</span>
            }
        ];

        switch (currentView) {
            case 'users':
                return [
                    ...baseColumns,
                    {
                        header: 'Identitas Pengguna',
                        accessorKey: 'name',
                        sortable: true,
                        cell: (row: any) => (
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-900">{row.name}</span>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                    <span>{row.email}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span className="font-mono">{row.username}</span>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Role & Akses',
                        accessorKey: 'role',
                        sortable: true,
                        cell: (row: any) => (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight shadow-sm">
                                    {row.role}
                                </Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">System Access</span>
                            </div>
                        )
                    }
                ];
            case 'roles':
                return [
                    ...baseColumns,
                    { header: 'Nama Role', accessorKey: 'name', sortable: true, className: 'font-semibold text-slate-900 uppercase text-[12px]' },
                    { header: 'Deskripsi', accessorKey: 'description', className: 'font-medium text-muted-foreground uppercase text-[10px] tracking-wide' }
                ];
            case 'contract-types':
                return [
                    ...baseColumns,
                    { header: 'Tipe Kontrak', accessorKey: 'name', sortable: true, className: 'font-semibold text-slate-900 uppercase text-[12px]' },
                    { header: 'Deskripsi', accessorKey: 'description', className: 'font-medium text-muted-foreground uppercase text-[10px] tracking-wide' }
                ];
            case 'workflows':
                return [
                    ...baseColumns,
                    {
                        header: 'Workflow',
                        accessorKey: 'name',
                        sortable: true,
                        cell: (row: any) => (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900 uppercase text-[12px]">{row.name}</span>
                                    {row.is_default && <Badge variant="outline" className="bg-slate-950 text-white px-1.5 py-0 text-[8px] font-bold uppercase shadow-sm border-none">Default</Badge>}
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mt-1">{row.contract_type}</span>
                            </div>
                        )
                    },
                    {
                        header: 'Persetujuan',
                        accessorKey: 'steps_count',
                        cell: (row: any) => (
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-1.5 overflow-hidden">
                                    {row.steps?.slice(0, 3).map((step: any, i: number) => (
                                        <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-800 border border-slate-200 uppercase">
                                            {step.role?.charAt(0)}
                                        </div>
                                    ))}
                                    {row.steps?.length > 3 && (
                                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-800 flex items-center justify-center text-[9px] font-bold text-white border border-slate-700 shadow-sm">
                                            +{row.steps.length - 3}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{row.steps?.length || 0} Approval Steps</span>
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Sequence Configured</span>
                                </div>
                            </div>
                        )
                    }
                ];
            case 'module-groups':
                return [
                    ...baseColumns,
                    {
                        header: 'Grup Modul',
                        accessorKey: 'title',
                        sortable: true,
                        cell: (row: any) => (
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200 tabular-nums">
                                    #{row.sort_number}
                                </div>
                                <span className="font-semibold text-slate-900 uppercase text-[12px]">{row.title}</span>
                            </div>
                        )
                    },
                    { header: 'Status', accessorKey: 'id', cell: () => <span className="text-[10px] font-bold text-muted-foreground uppercase">Active</span> }
                ];
            case 'modules':
                return [
                    ...baseColumns,
                    {
                        header: 'Modul',
                        accessorKey: 'title',
                        sortable: true,
                        cell: (row: any) => (
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                                    {row.icon ? <i className={cn("fa-solid h-4 w-4 flex items-center justify-center", row.icon)} /> : row.code?.substring(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 uppercase text-[12px]">{row.title}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mt-1">{row.code}</span>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Koneksi',
                        accessorKey: 'module_group_id',
                        cell: (row: any) => (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-tight border border-slate-200">
                                    {ensureArray(moduleGroups).find((mg: any) => mg.id === row.module_group_id)?.title || 'No Group'}
                                </Badge>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">Route: {row.url || '#'}</span>
                            </div>
                        )
                    }
                ];
            default: return baseColumns;
        }
    }, [currentView, moduleGroups]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = editingSteps.findIndex((s) => s.id === active.id);
            const newIndex = editingSteps.findIndex((s) => s.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                setEditingSteps(arrayMove(editingSteps, oldIndex, newIndex));
            }
        }
    };

    const { showToast: toast } = useToast();

    const showToast = (msg: string, type: 'success' | 'danger') => toast(msg, type);

    const toggleWorkflowExpand = useCallback((w: any) => {
        if (expandedWorkflowId === w.id) {
            setExpandedWorkflowId(null);
            setEditingSteps([]);
        } else {
            setExpandedWorkflowId(w.id);
            setEditingSteps(w.steps?.map((s: any) => ({
                id: s.id,
                role: s.role,
                approver_type: s.approver_type || 'role',
                user_ids: s.users?.map((u: any) => u.id) || [],
                selected_role: s.approver_type === 'role' ? s.role : '',
                description: s.description || '',
                step: s.step
            })) || []);
        }
    }, [expandedWorkflowId]);

    // ─── Row Actions ────────────────────────────────────────────────
    const renderRowActions = useCallback((row: any) => {
        return (
            <div className="flex items-center gap-1">
                {currentView === 'roles' && (
                    <>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-600 transition-all" title="Kelola Akses" onClick={() => router.get(`/admin/roles/${row.id}/access`)}>
                            <Key size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-600 transition-all" title="Kelola Navigasi" onClick={() => router.get(`/admin/roles/${row.id}/navigation`)}>
                            <LayoutGrid size={14} />
                        </Button>
                    </>
                )}
                {currentView === 'workflows' && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                            "h-8 w-8 p-0 transition-all",
                            expandedWorkflowId === row.id ? "bg-slate-900 text-white hover:bg-slate-800" : "hover:bg-slate-100 text-slate-600"
                        )}
                        title={expandedWorkflowId === row.id ? "Tutup Management" : "Kelola Steps & Alur"} 
                        onClick={() => toggleWorkflowExpand(row)}
                    >
                        <LayoutGrid size={14} />
                    </Button>
                )}
                {canUpdate && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => openEdit(row)}>
                        <Pencil size={14} />
                    </Button>
                )}
                {canDelete && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-all" onClick={() => handleDelete(row.id)}>
                        <Trash2 size={14} />
                    </Button>
                )}
            </div>
        );
    }, [currentView, canUpdate, canDelete, expandedWorkflowId, toggleWorkflowExpand]);

    const addLocalStep = () => {
        setEditingSteps([...editingSteps, {
            id: `new-${Date.now()}`,
            role: '',
            approver_type: 'role',
            user_ids: [],
            description: '',
            step: editingSteps.length + 1
        }]);
    };

    const updateLocalStep = (idx: number, data: any) => {
        setEditingSteps(editingSteps.map((s, i) => i === idx ? { ...s, ...data } : s));
    };

    const removeLocalStep = (idx: number) => {
        setEditingSteps(editingSteps.filter((_, i) => i !== idx));
    };

    const saveWorkflowSteps = (workflowId: number) => {
        if (editingSteps.some(s => s.approver_type === 'role' && !s.selected_role)) {
            showToast("Semua langkah role harus dipilih.", "danger");
            return;
        }

        if (editingSteps.some(s => s.approver_type === 'user' && (!s.user_ids || s.user_ids.length === 0))) {
            showToast("Semua langkah user harus memiliki minimal satu user.", "danger");
            return;
        }

        setIsSavingSteps(true);
        router.post(`/admin/workflows/${workflowId}/steps`, { 
            steps: editingSteps.map((s, idx) => ({
                role: s.approver_type === 'role' ? s.selected_role : 'Persetujuan User',
                selected_role: s.selected_role,
                approver_type: s.approver_type,
                user_ids: s.user_ids,
                description: s.approver_type === 'role' ? s.selected_role : 'Persetujuan User',
                step: idx + 1
            }))
        }, {
            onSuccess: () => {
                setIsSavingSteps(false);
                showToast("Alur kerja berhasil diperbarui.", "success");
            },
            onError: () => {
                setIsSavingSteps(false);
                showToast("Terjadi kesalahan.", "danger");
            }
        });
    };

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

    const viewTitle = viewTitleMap[currentView] || 'Admin';
    const Icon = viewIconMap[currentView] || Settings2;
    
    const userForm = useForm({
        name: '',
        email: '',
        username: '',
        role: ensureArray(roles)?.[0]?.name || 'Initiator',
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
        module_group_id: ensureArray(moduleGroups)?.[0]?.id || '',
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
                username: item.username || '',
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

    return (
        <ToastProvider>
            <Head title={`Admin - ${viewTitle}`} />

            <div className="flex h-full flex-col flex-1">
                <div className="flex-1 overflow-auto p-4 bg-slate-50/30">
                    <DataTable
                        getRowId={getRowId}
                        searchKey={currentView === 'users' ? 'name' : 'title'}
                        searchPlaceholder={`Cari ${viewTitle.toLowerCase()}...`}
                        columns={columns}
                        data={displayData}
                        pagination={pagination}
                        headerActions={canCreate && (
                            <Button className="h-10 px-4 gap-2 font-bold text-[11px] uppercase tracking-wider rounded-lg" onClick={openCreate}>
                                <Plus className="h-3.5 w-3.5" />
                                Tambah {
                                    currentView === 'users' ? 'Pengguna' : 
                                    currentView === 'roles' ? 'Role' : 
                                    currentView === 'contract-types' ? 'Tipe' : 
                                    currentView === 'workflows' ? 'Alur' : 
                                    currentView === 'module-groups' ? 'Grup' : 'Modul'
                                }
                            </Button>
                        )}
                        filters={
                            currentView === 'users' ? [
                                { label: 'Role', key: 'role', options: ensureArray(roles).map((r: any) => ({ label: r.name, value: r.name })) }
                            ] : currentView === 'workflows' ? [
                                { label: 'Tipe Kontrak', key: 'contract_type', options: ensureArray(contractTypes || types).map((t: any) => ({ label: t.name, value: t.name })) }
                            ] : currentView === 'modules' ? [
                                { label: 'Grup Modul', key: 'module_group_id', options: ensureArray(moduleGroups).map((mg: any) => ({ label: mg.title, value: mg.id })) }
                            ] : undefined
                        }
                        onRefresh={() => router.reload({ preserveScroll: true } as any)}
                        renderExpandedRow={(row) => (
                            <div className="p-6 space-y-5 bg-slate-50/80">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-xl bg-white shadow-sm border flex items-center justify-center text-primary">
                                            <GitBranch size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-slate-900 leading-none">Alur Approval</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola urutan dan otoritas persetujuan</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={addLocalStep}
                                            className="h-8 px-3 rounded-lg font-bold gap-1.5 bg-white border-slate-200 text-[11px]"
                                        >
                                            <Plus size={14} /> Tambah
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={() => saveWorkflowSteps(row.id)}
                                            disabled={isSavingSteps}
                                            className="h-8 px-4 rounded-lg font-black gap-1.5 shadow-sm text-[11px]"
                                        >
                                            {isSavingSteps ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                                            Simpan
                                        </Button>
                                    </div>
                                </div>

                                {editingSteps.length === 0 ? (
                                    <div className="py-8 flex flex-col items-center justify-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                                        <PlusCircle className="h-6 w-6 text-slate-200 mb-2" />
                                        <p className="text-[11px] font-bold text-slate-400">Belum ada langkah approval</p>
                                        <Button variant="link" onClick={addLocalStep} className="text-primary font-black uppercase text-[9px] tracking-widest h-auto p-0 mt-1">Buat Pertama</Button>
                                    </div>
                                ) : (
                                    <DndContext 
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                        modifiers={[restrictToVerticalAxis]}
                                    >
                                        <SortableContext 
                                            items={editingSteps.map(s => s.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-2">
                                                {editingSteps.map((step, idx) => (
                                                    <SortableStepItem
                                                        key={step.id}
                                                        step={step}
                                                        idx={idx}
                                                        users={ensureArray(users)}
                                                        roles={ensureArray(roles)}
                                                        updateLocalStep={updateLocalStep}
                                                        removeLocalStep={removeLocalStep}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}
                                
                                <div className="flex items-center justify-center py-2 opacity-50">
                                    <div className="h-[1px] flex-1 bg-slate-200" />
                                    <div className="flex items-center gap-1.5 px-4">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Selesai</span>
                                    </div>
                                    <div className="h-[1px] flex-1 bg-slate-200" />
                                </div>
                            </div>
                        )}
                        isRowExpanded={(row) => currentView === 'workflows' && expandedWorkflowId === row.id}
                        rowActions={(row) => (
                            <>
                                {renderRowActions(row)}
                            </>
                        )}
                        bulkActions={(selectedRows) => (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-10 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-[11px] uppercase tracking-wider gap-2"
                                onClick={() => {
                                    if (confirm(`Hapus ${selectedRows.length} data terpilih?`)) {
                                        // Bulk delete logic here
                                        showToast(`${selectedRows.length} data berhasil dihapus.`, "success");
                                    }
                                }}
                            >
                                <Trash2 size={14} />
                                Hapus Terpilih ({selectedRows.length})
                            </Button>
                        )}
                    />
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
                                        {userForm.errors.email && <p className="text-xs text-destructive">{userForm.errors.email}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input id="username" value={userForm.data.username} onChange={e => userForm.setData('username', e.target.value)} required maxLength={20} />
                                        {userForm.errors.username && <p className="text-xs text-destructive">{userForm.errors.username}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={userForm.data.role} onValueChange={value => userForm.setData('role', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ensureArray(roles).map((role: any) => (
                                                    <SelectItem key={role.id} value={role.name}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        <Select value={workflowForm.data.contract_type} onValueChange={value => workflowForm.setData('contract_type', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Tipe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ensureArray(contractTypes || types).map((type: any) => (
                                                    <SelectItem key={type.id} value={type.name}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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
                                        <Select value={moduleForm.data.module_group_id} onValueChange={value => moduleForm.setData('module_group_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Grup" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ensureArray(moduleGroups).map((group: any) => (
                                                    <SelectItem key={group.id} value={group.id}>
                                                        {group.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
        </ToastProvider>
    );
}
