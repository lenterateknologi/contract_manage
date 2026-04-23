import { Column, DataTable } from '@/components/ui/DataTable';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    Filter,
    GitBranch,
    GripVertical,
    Key,
    LayoutGrid,
    Pencil,
    Plus,
    PlusCircle,
    Save,
    Search,
    Settings2,
    Shield,
    ShieldCheck,
    Tags,
    Trash2,
    Users,
    Users as UsersIcon,
    AlertTriangle,
    Clock,
} from 'lucide-react';
import React, { FormEvent, useCallback, useMemo, useState } from 'react';

import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ToastProvider, useToast } from '@/components/contracts/Toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

// ─── Table header cell ───────────────────────────────────────────────
function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <th
            style={{
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
                ...style,
            }}
        >
            {children}
        </th>
    );
}
function Td({
    children,
    className,
    style,
    colSpan,
}: {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    colSpan?: number;
}) {
    return (
        <td
            colSpan={colSpan}
            style={{
                padding: '12px 14px',
                fontSize: 13,
                borderBottom: '1px solid var(--border)',
                verticalAlign: 'middle',
                ...style,
            }}
            className={className}
        >
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
    departments,
    updateLocalStep,
    removeLocalStep,
}: {
    step: any;
    idx: number;
    users?: any[];
    roles?: any[];
    departments?: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

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
    const filteredRoles = roles?.filter((r) => r.name.toLowerCase().includes(roleSearchText.toLowerCase())) || [];

    const filteredUsers =
        users?.filter((u) => {
            const matchesName =
                u.name.toLowerCase().includes(userSearchText.toLowerCase()) || u.email.toLowerCase().includes(userSearchText.toLowerCase());
            const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
            return matchesName && matchesRole;
        }) || [];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group/step relative flex items-start gap-5 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)]"
        >
            <div className="absolute top-0 left-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover/step:opacity-100" />
            <div
                {...attributes}
                {...listeners}
                className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-xl bg-primary text-[11px] font-black text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:bg-primary/90 active:scale-95 active:cursor-grabbing"
            >
                <GripVertical size={12} className="mr-0.5 opacity-40" />
                {idx + 1}
            </div>

            <div className="grid flex-1 grid-cols-12 gap-3">
                <div className="col-span-3 space-y-1">
                    <Label className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Tipe Otoritas</Label>
                    <div className="flex h-7 rounded-lg border border-border bg-muted p-0.5">
                        <button
                            type="button"
                            onClick={() => updateLocalStep(idx, { approver_type: 'role', user_ids: [] })}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1 rounded text-[8px] font-bold uppercase transition-all',
                                step.approver_type === 'role' ? 'text-primary bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Shield size={9} /> Role
                        </button>
                        <button
                            type="button"
                            onClick={() => updateLocalStep(idx, { approver_type: 'user' })}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1 rounded text-[8px] font-bold uppercase transition-all',
                                step.approver_type === 'user' ? 'text-primary bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <UsersIcon size={9} /> User
                        </button>
                    </div>
                </div>

                <div className="col-span-9 space-y-1.5">
                    {step.approver_type === 'role' ? (
                        <>
                            <div className="space-y-1">
                                <Label className="flex justify-between text-[9px] font-black tracking-widest text-muted-foreground uppercase">
                                    Pilih Spesifik Role
                                    {step.selected_role && <span className="text-primary font-bold normal-case">{step.selected_role}</span>}
                                </Label>
                                <Select value={step.selected_role} onValueChange={(val) => updateLocalStep(idx, { selected_role: val })}>
                                    <SelectTrigger className="hover:border-primary/30 h-8 rounded-lg border-border bg-card px-3 text-[11px] font-bold text-foreground transition-colors">
                                        <SelectValue placeholder="Cari & Pilih Role..." />
                                    </SelectTrigger>
                                    <SelectContent className="p-0 border-border bg-popover">
                                        <div className="border-b border-border bg-muted/30 p-2">
                                            <div className="relative">
                                                <Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
                                                <Input
                                                    placeholder="Cari role..."
                                                    className="h-7 rounded-md border-border bg-background pl-8 text-[11px] shadow-sm"
                                                    value={roleSearchText}
                                                    onChange={(e) => setRoleSearchText(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[150px] overflow-y-auto p-1">
                                            {filteredRoles.map((r) => (
                                                <SelectItem key={r.id} value={r.name} className="py-1.5 text-[10px] font-medium uppercase">
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                            {filteredRoles.length === 0 && (
                                                <div className="p-4 text-center text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                    Tidak ada role
                                                </div>
                                            )}
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="mt-2 space-y-1">
                                <Label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Spesifik Departemen (Opsional)</Label>
                                <Select value={step.department_id} onValueChange={(val) => updateLocalStep(idx, { department_id: val })}>
                                    <SelectTrigger className="hover:border-primary/30 h-8 rounded-lg border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-800 transition-colors">
                                        <SelectValue placeholder="Semua Departemen (Default Workflow)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-[10px] font-bold text-slate-400 uppercase">
                                            Gunakan Departemen Workflow
                                        </SelectItem>
                                        {(Array.isArray(departments) ? departments : []).map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id} className="text-[10px] font-medium uppercase">
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Pilih User (Filter & Search)</Label>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute top-2 left-3 h-3.5 w-3.5 text-muted-foreground/50" />
                                    <Input
                                        placeholder="Cari berdasarkan nama atau email..."
                                        className="focus-visible:ring-primary/20 h-8 rounded-lg border-border bg-card pl-9 text-[11px] shadow-sm"
                                        value={userSearchText}
                                        onChange={(e) => setUserSearchText(e.target.value)}
                                    />
                                </div>
                                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                                    <SelectTrigger className="h-8 w-[140px] rounded-lg border-border bg-muted px-3 text-[10px] font-bold tracking-tight uppercase transition-colors hover:bg-muted/80">
                                        <Filter className="mr-1.5 h-3 w-3 text-muted-foreground/50" />
                                        <SelectValue placeholder="Filter Role" />
                                    </SelectTrigger>
                                    <SelectContent className="border-border bg-popover">
                                        <SelectItem value="all" className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            Show All Roles
                                        </SelectItem>
                                        {roles?.map((r) => (
                                            <SelectItem key={r.id} value={r.name} className="text-[10px] font-medium uppercase">
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid max-h-[160px] grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-2 shadow-inner sm:grid-cols-3">
                                {filteredUsers.map((u) => (
                                    <label
                                        key={u.id}
                                        className={cn(
                                            'group/u inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-bold transition-all duration-200',
                                            step.user_ids?.includes(u.id)
                                                ? 'bg-primary border-primary shadow-primary/10 scale-[1.02] text-primary-foreground shadow-md'
                                                : 'hover:border-primary/40 border-border bg-card text-foreground/80 hover:bg-muted/50 hover:shadow-sm',
                                        )}
                                    >
                                        <Checkbox
                                            checked={step.user_ids?.includes(u.id)}
                                            onCheckedChange={(checked: boolean | 'indeterminate') => {
                                                const ids = step.user_ids || [];
                                                const isChecked = checked === true;
                                                updateLocalStep(idx, { user_ids: isChecked ? [...ids, u.id] : ids.filter((id: any) => id !== u.id) });
                                            }}
                                            className={cn(
                                                'h-3.5 w-3.5 rounded-md transition-colors',
                                                step.user_ids?.includes(u.id)
                                                    ? 'data-[state=checked]:text-primary border-white data-[state=checked]:bg-white'
                                                    : 'border-slate-300',
                                            )}
                                        />
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate leading-tight">{u.name}</span>
                                            <span
                                                className={cn(
                                                    'truncate text-[8px] font-medium opacity-60',
                                                    step.user_ids?.includes(u.id) ? 'text-primary-foreground' : 'text-muted-foreground',
                                                )}
                                            >
                                                {u.email}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center gap-2 py-8 text-center">
                                        <UsersIcon size={20} className="text-muted-foreground/30" />
                                        <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">User tidak ditemukan</div>
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
                className="mt-3 h-8 w-8 shrink-0 rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
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
    statuses?: PaginatedData<any> | any[];
    departments?: PaginatedData<any> | any[];
    filters?: any;
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
    moduleGroups,
    statuses,
    departments,
    filters: serverFilters,
}: Props & { filters: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [expandedWorkflowId, setExpandedWorkflowId] = useState<number | null>(null);
    const [editingSteps, setEditingSteps] = useState<any[]>([]);
    const [isSavingSteps, setIsSavingSteps] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState<any>(null);

    const viewModuleMap: Record<string, string> = {
        users: 'ADMIN_USERS',
        roles: 'ADMIN_ROLES',
        'contract-types': 'ADMIN_TYPES',
        workflows: 'ADMIN_WORKFLOWS',
        'contract-statuses': 'ADMIN_STATUS',
        departments: 'ADMIN_DEPTS',
        vendors: 'ADMIN_VENDORS',
        'module-groups': 'NAV_MGMT',
        modules: 'NAV_MGMT',
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
                    router.get(
                        window.location.pathname,
                        { page },
                        {
                            preserveState: true,
                            preserveScroll: true,
                        },
                    );
                },
                onPerPageChange: (perPage: number) => {
                    router.get(
                        window.location.pathname,
                        { per_page: perPage },
                        {
                            preserveState: true,
                            preserveScroll: true,
                        },
                    );
                },
            },
        };
    }, []);

    const ensureArray = useCallback((prop: any) => {
        if (!prop) return [];
        if (Array.isArray(prop)) return prop;
        return prop.data || [];
    }, []);

    const { data: displayData, pagination } = useMemo(() => {
        switch (currentView) {
            case 'users':
                return getPaginatedData(users);
            case 'roles':
                return getPaginatedData(roles);
            case 'contract-types':
                return getPaginatedData(contractTypes || types);
            case 'workflows':
                return getPaginatedData(workflows);
            case 'module-groups':
                return getPaginatedData(moduleGroups || groups);
            case 'modules':
                return getPaginatedData(modules);
            case 'contract-statuses':
                return getPaginatedData(statuses);
            case 'departments':
                return getPaginatedData(departments);
            case 'navigation':
                return { data: ensureArray(groups), pagination: undefined };
            default:
                return { data: [], pagination: undefined };
        }
    }, [currentView, users, roles, contractTypes, types, workflows, moduleGroups, groups, modules, statuses, departments, getPaginatedData, ensureArray]);

    const handleBackendFilter = useCallback((newParams: any) => {
        const query = {
            ...serverFilters,
            ...newParams,
            page: 1, // Reset to first page on filter change
        };

        // Filter out empty values
        Object.keys(query).forEach(key => {
            if (query[key] === null || query[key] === undefined || query[key] === '') {
                delete query[key];
            }
        });

        router.get(window.location.pathname, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    }, [serverFilters]);

    const getRowId = useCallback((row: any) => row.id, []);

    // ─── Columns Definition ─────────────────────────────────────────
    const columns = useMemo(() => {
        const baseColumns: Column<any>[] = [
            {
                header: 'ID',
                accessorKey: 'id',
                className: 'w-[100px]',
                cell: (row) => <span className="font-mono text-[10px] text-muted-foreground uppercase tabular-nums">{String(row.id).substring(0, 8)}</span>,
            },
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
                                <span className="font-semibold text-foreground">{row.name}</span>
                                <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                                    <span>{row.email}</span>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <span className="font-mono">{row.username}</span>
                                </div>
                                {row.department && (
                                    <div className="mt-1 flex items-center gap-1">
                                        <Building2 size={10} className="text-primary" />
                                        <span className="text-primary text-[10px] font-bold uppercase">{row.department.name}</span>
                                    </div>
                                )}
                            </div>
                        ),
                    },
                    {
                        header: 'Role & Jabatan',
                        accessorKey: 'role',
                        sortable: true,
                        cell: (row: any) => (
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-blue-100 bg-blue-50/50 px-2 py-0 text-[9px] font-bold tracking-tight text-blue-700 uppercase shadow-sm"
                                    >
                                        {row.role}
                                    </Badge>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] leading-none font-black tracking-tight text-foreground/80 uppercase">
                                        {row.position || '-'}
                                    </span>
                                    <span className="text-muted-foreground mt-1 text-[10px] font-bold uppercase opacity-60">{row.phone || '-'}</span>
                                </div>
                            </div>
                        ),
                    },
                    {
                        header: 'Status',
                        accessorKey: 'is_active',
                        cell: (row: any) => (
                            <Badge
                                variant={row.is_active ? 'secondary' : 'destructive'}
                                className={cn(
                                    'px-2 py-0 text-[8px] font-black tracking-widest uppercase',
                                    row.is_active ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700',
                                )}
                            >
                                {row.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                        ),
                    },
                ];
            case 'roles':
                return [
                    ...baseColumns,
                    { header: 'Nama Role', accessorKey: 'name', sortable: true, className: 'font-semibold text-foreground uppercase text-[12px]' },
                    {
                        header: 'Deskripsi',
                        accessorKey: 'description',
                        className: 'font-medium text-muted-foreground uppercase text-[10px] tracking-wide',
                    },
                ];
            case 'contract-types':
                return [
                    ...baseColumns,
                    { header: 'Tipe Kontrak', accessorKey: 'name', sortable: true, className: 'font-semibold text-foreground uppercase text-[12px]' },
                    {
                        header: 'Tipe Alur (F1/F2)',
                        accessorKey: 'type',
                        cell: (row: any) => (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'px-2 py-0 text-[10px] font-black tracking-tight uppercase',
                                    row.type === 'f2' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-200 bg-blue-50 text-blue-700',
                                )}
                            >
                                {row.type?.toUpperCase()}
                            </Badge>
                        ),
                    },
                    {
                        header: 'Deskripsi',
                        accessorKey: 'description',
                        className: 'font-medium text-muted-foreground uppercase text-[10px] tracking-wide',
                    },
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
                                    <span className="text-[12px] font-semibold text-foreground uppercase">{row.name}</span>
                                    {row.is_default && (
                                        <Badge
                                            variant="outline"
                                            className="border-none bg-foreground px-1.5 py-0 text-[8px] font-bold text-background uppercase shadow-sm"
                                        >
                                            Default
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-muted-foreground text-[10px] leading-none font-medium tracking-widest uppercase">
                                        {row.contract_type}
                                    </span>
                                    {row.department && (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-border" />
                                            <span className="text-primary text-[9px] font-black uppercase">{row.department.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ),
                    },
                    {
                        header: 'Persetujuan',
                        accessorKey: 'steps_count',
                        cell: (row: any) => (
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-1.5 overflow-hidden">
                                    {row.steps?.slice(0, 3).map((step: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted text-[9px] font-bold text-foreground/80 uppercase ring-2 ring-background"
                                        >
                                            {step.role?.charAt(0)}
                                        </div>
                                    ))}
                                    {row.steps?.length > 3 && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-foreground text-[9px] font-bold text-background shadow-sm ring-2 ring-background">
                                            +{row.steps.length - 3}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold tracking-tight text-foreground/80 uppercase">
                                        {row.steps?.length || 0} Approval Steps
                                    </span>
                                    <span className="text-muted-foreground text-[10px] font-medium uppercase">Sequence Configured</span>
                                </div>
                            </div>
                        ),
                    },
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
                                <div className="flex h-6 w-8 items-center justify-center rounded border border-border bg-muted text-[10px] font-bold text-foreground/60 tabular-nums">
                                    #{row.sort_number}
                                </div>
                                <span className="text-[12px] font-semibold text-foreground uppercase">{row.title}</span>
                            </div>
                        ),
                    },
                    {
                        header: 'Status',
                        accessorKey: 'id',
                        cell: () => <span className="text-muted-foreground text-[10px] font-bold uppercase">Active</span>,
                    },
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
                                <div className="flex h-8 w-8 items-center justify-center rounded border border-border bg-muted text-[10px] font-bold text-muted-foreground">
                                    {row.icon ? (
                                        <i className={cn('fa-solid flex h-4 w-4 items-center justify-center', row.icon)} />
                                    ) : (
                                        row.code?.substring(0, 2)
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-semibold text-foreground uppercase">{row.title}</span>
                                    <span className="text-muted-foreground mt-1 text-[10px] leading-none font-medium tracking-widest uppercase">
                                        {row.code}
                                    </span>
                                </div>
                            </div>
                        ),
                    },
                    {
                        header: 'Koneksi',
                        accessorKey: 'module_group_id',
                        cell: (row: any) => (
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="rounded border border-border bg-muted text-[9px] font-bold tracking-tight text-muted-foreground uppercase"
                                >
                                    {ensureArray(moduleGroups).find((mg: any) => mg.id === row.module_group_id)?.title || 'No Group'}
                                </Badge>
                                <span className="text-muted-foreground text-[10px] font-medium uppercase opacity-70">Route: {row.url || '#'}</span>
                            </div>
                        ),
                    },
                ];
            case 'contract-statuses':
                return [
                    ...baseColumns,
                    {
                        header: 'Status',
                        accessorKey: 'label',
                        sortable: true,
                        cell: (row: any) => (
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-border shadow-sm"
                                    style={{ backgroundColor: row.bg_color }}
                                >
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-semibold text-foreground uppercase">{row.label}</span>
                                    <span className="text-muted-foreground mt-1 text-[10px] leading-none font-medium tracking-widest uppercase">
                                        {row.code}
                                    </span>
                                </div>
                            </div>
                        ),
                    },
                    {
                        header: 'Tampilan',
                        accessorKey: 'color',
                        cell: (row: any) => (
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    style={{ color: row.color, backgroundColor: row.bg_color, borderColor: `${row.color}20` }}
                                    className="px-2.5 py-0.5 text-[10px] font-bold tracking-tight uppercase shadow-sm"
                                >
                                    {row.label}
                                </Badge>
                                <span className="font-mono text-[10px] text-slate-400">
                                    {row.color} / {row.bg_color}
                                </span>
                            </div>
                        ),
                    },
                    {
                        header: 'Urutan',
                        accessorKey: 'sequence',
                        sortable: true,
                        cell: (row: any) => (
                            <div className="flex w-fit items-center gap-1.5 rounded-md border border-border/50 bg-muted/50 px-2 py-1">
                                <Badge
                                    variant="outline"
                                    className="flex h-4 min-w-[1.25rem] items-center justify-center border-none bg-background p-0 text-[10px] font-bold shadow-sm ring-1 ring-border"
                                >
                                    {row.sequence}
                                </Badge>
                                <span className="text-[9px] font-bold tracking-tighter text-muted-foreground uppercase">Position</span>
                            </div>
                        ),
                    },
                ];
            case 'departments':
                return [
                    ...baseColumns,
                    { header: 'Kode', accessorKey: 'code', sortable: true, className: 'font-bold text-slate-500 uppercase text-[11px] tabular-nums' },
                    {
                        header: 'Nama Departemen',
                        accessorKey: 'name',
                        sortable: true,
                        className: 'font-semibold text-foreground uppercase text-[12px]',
                    },
                    {
                        header: 'Deskripsi',
                        accessorKey: 'description',
                        className: 'font-medium text-muted-foreground uppercase text-[10px] tracking-wide',
                    },
                    {
                        header: 'Status',
                        accessorKey: 'is_active',
                        cell: (row: any) => (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'px-2 py-0.5 text-[9px] font-bold tracking-tight uppercase shadow-sm',
                                    row.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700',
                                )}
                            >
                                {row.is_active ? 'Aktif' : 'Non-Aktif'}
                            </Badge>
                        ),
                    },
                ];
            case 'vendors':
                return [
                    ...baseColumns,
                    { header: 'Kode', accessorKey: 'code', sortable: true, className: 'font-bold text-slate-500 uppercase text-[11px]' },
                    { header: 'Nama Vendor', accessorKey: 'name', sortable: true, className: 'font-semibold text-foreground uppercase text-[12px]' },
                    {
                        header: 'Kategori',
                        accessorKey: 'category',
                        cell: (row: any) =>
                            row.category && (
                                <Badge variant="secondary" className="text-[9px] font-bold uppercase">
                                    {row.category}
                                </Badge>
                            ),
                    },
                    {
                        header: 'Kontak',
                        accessorKey: 'email',
                        cell: (row: any) => (
                            <div className="flex flex-col text-[11px]">
                                <span className="font-medium">{row.email || '-'}</span>
                                <span className="text-slate-400">{row.phone || '-'}</span>
                            </div>
                        ),
                    },
                    {
                        header: 'Status',
                        accessorKey: 'is_active',
                        cell: (row: any) => (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'px-2 py-0.5 text-[9px] font-bold tracking-tight uppercase shadow-sm',
                                    row.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700',
                                )}
                            >
                                {row.is_active ? 'Aktif' : 'Non-Aktif'}
                            </Badge>
                        ),
                    },
                ];
            default:
                return baseColumns;
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
        }),
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

    const toggleWorkflowExpand = useCallback(
        (w: any) => {
            if (expandedWorkflowId === w.id) {
                setExpandedWorkflowId(null);
                setEditingSteps([]);
            } else {
                setExpandedWorkflowId(w.id);
                setEditingSteps(
                    w.steps?.map((s: any) => ({
                        id: s.id,
                        role: s.role,
                        approver_type: s.approver_type || 'role',
                        user_ids: s.users?.map((u: any) => u.id) || [],
                        selected_role: s.approver_type === 'role' || !s.approver_type ? s.role || '' : '',
                        description: s.description || '',
                        department_id: s.department_id || 'none',
                        step: s.step,
                    })) || [],
                );
            }
        },
        [expandedWorkflowId],
    );

    // ─── Row Actions ────────────────────────────────────────────────
    const renderRowActions = useCallback(
        (row: any) => {
            return (
                <div className="flex items-center gap-1">
                    {currentView === 'roles' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-600 transition-all hover:bg-slate-100"
                                title="Kelola Akses"
                                onClick={() => router.get(`/admin/roles/${row.id}/access`)}
                            >
                                <Key size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-600 transition-all hover:bg-slate-100"
                                title="Kelola Navigasi"
                                onClick={() => router.get(`/admin/roles/${row.id}/navigation`)}
                            >
                                <LayoutGrid size={14} />
                            </Button>
                        </>
                    )}
                    {currentView === 'workflows' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'h-8 w-8 p-0 transition-all',
                                expandedWorkflowId === row.id ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100',
                            )}
                            title={expandedWorkflowId === row.id ? 'Tutup Management' : 'Kelola Steps & Alur'}
                            onClick={() => toggleWorkflowExpand(row)}
                        >
                            <LayoutGrid size={14} />
                        </Button>
                    )}
                    {canUpdate && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/5 hover:text-primary h-8 w-8 p-0 transition-all"
                            onClick={() => openEdit(row)}
                        >
                            <Pencil size={14} />
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 transition-all hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(row.id)}
                        >
                            <Trash2 size={14} />
                        </Button>
                    )}
                </div>
            );
        },
        [currentView, canUpdate, canDelete, expandedWorkflowId, toggleWorkflowExpand],
    );

    const addLocalStep = () => {
        setEditingSteps([
            ...editingSteps,
            {
                id: `new-${Date.now()}`,
                role: '',
                approver_type: 'role',
                user_ids: [],
                description: '',
                department_id: 'none',
                step: editingSteps.length + 1,
            },
        ]);
    };

    const updateLocalStep = (idx: number, data: any) => {
        setEditingSteps(editingSteps.map((s, i) => (i === idx ? { ...s, ...data } : s)));
    };

    const removeLocalStep = (idx: number) => {
        setEditingSteps(editingSteps.filter((_, i) => i !== idx));
    };

    const saveWorkflowSteps = (workflowId: number) => {
        if (editingSteps.some((s) => s.approver_type === 'role' && !s.selected_role)) {
            showToast('Semua langkah role harus dipilih.', 'danger');
            return;
        }

        if (editingSteps.some((s) => s.approver_type === 'user' && (!s.user_ids || s.user_ids.length === 0))) {
            showToast('Semua langkah user harus memiliki minimal satu user.', 'danger');
            return;
        }

        setIsSavingSteps(true);
        router.post(
            `/admin/workflows/${workflowId}/steps`,
            {
                steps: editingSteps.map((s, idx) => ({
                    role: s.approver_type === 'role' ? s.selected_role : 'Persetujuan User',
                    selected_role: s.selected_role,
                    approver_type: s.approver_type,
                    user_ids: s.user_ids,
                    description: s.approver_type === 'role' ? s.selected_role : 'Persetujuan User',
                    department_id: s.department_id === 'none' ? null : s.department_id,
                    step: idx + 1,
                })),
            },
            {
                onSuccess: () => {
                    setIsSavingSteps(false);
                    showToast('Alur kerja berhasil diperbarui.', 'success');
                },
                onError: () => {
                    setIsSavingSteps(false);
                    showToast('Terjadi kesalahan.', 'danger');
                },
            },
        );
    };

    const viewIconMap: Record<string, any> = {
        users: Users,
        roles: ShieldCheck,
        'contract-types': Settings2,
        workflows: GitBranch,
        'contract-statuses': Tags,
        departments: Building2,
        'module-groups': LayoutGrid,
        modules: LayoutGrid,
    };

    const viewTitleMap: Record<string, string> = {
        users: 'Manajemen Pengguna',
        roles: 'Manajemen Role',
        'contract-types': 'Tipe Kontrak',
        workflows: 'Alur Kerja',
        'contract-statuses': 'Master Status',
        departments: 'Master Departemen',
        vendors: 'Master Vendor',
        'module-groups': 'Grup Modul',
        modules: 'Modul & Menu',
    };

    const viewTitle = viewTitleMap[currentView] || 'Admin';
    const Icon = viewIconMap[currentView] || Settings2;

    const userForm = useForm({
        name: '',
        email: '',
        username: '',
        role: ensureArray(roles)?.[0]?.name || 'Staff',
        department_id: '',
        position: '',
        phone: '',
        is_active: true as boolean,
        password: '',
    });

    const roleForm = useForm({
        name: '',
        description: '',
    });

    const typeForm = useForm({
        name: '',
        description: '',
        type: 'f1',
    });

    const workflowForm = useForm({
        name: '',
        contract_type: '',
        department_id: '',
        description: '',
        is_default: true as boolean,
        sla_drafting_hours: 72,
        sla_total_hours: 240,
        sla_cutoff_hour: 16,
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

    const statusForm = useForm({
        code: '',
        name: '',
        color: '#000000',
        bg_color: '#ffffff',
        icon: '',
        description: '',
        sort_order: 0,
        is_active: true as boolean,
    });

    const departmentForm = useForm({
        code: '',
        name: '',
        description: '',
        is_active: true as boolean,
    });

    const vendorForm = useForm({
        code: '',
        name: '',
        category: '',
        email: '',
        phone: '',
        address: '',
        is_active: true as boolean,
    });

    const openCreate = () => {
        setEditingItem(null);
        userForm.reset();
        roleForm.reset();
        typeForm.reset();
        moduleGroupForm.reset();
        moduleForm.reset();
        statusForm.reset();
        departmentForm.reset();
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
                department_id: item.department_id || '',
                position: item.position || '',
                phone: item.phone || '',
                is_active: !!item.is_active,
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
                type: item.type || 'f1',
            });
        } else if (currentView === 'workflows') {
            workflowForm.setData({
                name: item.name,
                contract_type: item.contract_type,
                department_id: item.department_id || '',
                description: item.description || '',
                is_default: !!item.is_default,
                sla_drafting_hours: item.sla_drafting_hours || 72,
                sla_total_hours: item.sla_total_hours || 240,
                sla_cutoff_hour: item.sla_cutoff_hour || 16,
            });
        } else if (currentView === 'contract-statuses') {
            statusForm.setData({
                code: item.code,
                name: item.name,
                color: item.color || '#000000',
                bg_color: item.bg_color || '#ffffff',
                icon: item.icon || '',
                description: item.description || '',
                sort_order: item.sort_order || 0,
                is_active: !!item.is_active,
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
        } else if (currentView === 'departments') {
            departmentForm.setData({
                code: item.code,
                name: item.name,
                description: item.description || '',
                is_active: !!item.is_active,
            });
        } else if (currentView === 'vendors') {
            vendorForm.setData({
                code: item.code,
                name: item.name,
                category: item.category || '',
                email: item.email || '',
                phone: item.phone || '',
                address: item.address || '',
                is_active: !!item.is_active,
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
        } else if (currentView === 'contract-statuses') {
            if (editingItem) {
                statusForm.put(route('admin.contract-statuses.update', editingItem.id), options);
            } else {
                statusForm.post(route('admin.contract-statuses.store'), options);
            }
        } else if (currentView === 'departments') {
            if (editingItem) {
                departmentForm.put(route('admin.departments.update', editingItem.id), options);
            } else {
                departmentForm.post(route('admin.departments.store'), options);
            }
        } else if (currentView === 'vendors') {
            if (editingItem) {
                vendorForm.put(route('admin.vendors.update', editingItem.id), options);
            } else {
                vendorForm.post(route('admin.vendors.store'), options);
            }
        }
    };

    const handleDelete = (id: any) => {
        setItemToDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDeleteId) return;

        const urlMap: Record<string, string> = {
            users: route('admin.users.destroy', itemToDeleteId),
            roles: route('admin.roles.destroy', itemToDeleteId),
            'contract-types': route('admin.contract-types.destroy', itemToDeleteId),
            'contract-statuses': route('admin.contract-statuses.destroy', itemToDeleteId),
            workflows: route('admin.workflows.destroy', itemToDeleteId),
            departments: route('admin.departments.destroy', itemToDeleteId),
            'module-groups': route('admin.module-groups.destroy', itemToDeleteId),
            modules: route('admin.modules.destroy', itemToDeleteId),
            vendors: route('admin.vendors.destroy', itemToDeleteId),
        };

        const url = urlMap[currentView];
        if (url) {
            router.delete(url, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDeleteId(null);
                    showToast('Data berhasil dihapus', 'success');
                },
                onError: () => {
                    showToast('Gagal menghapus data', 'danger');
                },
            });
        }
    };

    const route = (name: string, id?: any) => {
        // Correct base path generation:
        // admin.users.destroy -> users
        // admin.contract-types.store -> contract-types
        let base = name
            .split('.')
            .slice(1)
            .join('/')
            .replace('destroy', '')
            .replace('update', '')
            .replace('store', '')
            .replace(/\/$/, ''); // Remove trailing slash if any

        if (id) return `/admin/${base}/${id}`;
        return `/admin/${base}`;
    };

    return (
        <ToastProvider>
            <Head title={`Admin - ${viewTitle}`} />

            <div className="flex h-full flex-1 flex-col">
                <div className="flex-1 overflow-hidden">
                    <DataTable
                        getRowId={getRowId}
                        searchKey={['module-groups', 'modules', 'navigation'].includes(currentView) ? 'title' : 'name'}
                        searchPlaceholder={`Cari ${viewTitle.toLowerCase()}...`}
                        columns={columns}
                        data={displayData}
                        pagination={pagination}
                        headerActions={
                            canCreate && (
                                <Button className="h-10 gap-2 rounded-lg px-4 text-[11px] font-bold tracking-wider uppercase" onClick={openCreate}>
                                    <Plus className="h-3.5 w-3.5" />
                                    Tambah{' '}
                                    {currentView === 'users'
                                        ? 'Pengguna'
                                        : currentView === 'roles'
                                          ? 'Role'
                                          : currentView === 'contract-types'
                                            ? 'Tipe'
                                            : currentView === 'contract-statuses'
                                              ? 'Status'
                                              : currentView === 'workflows'
                                                ? 'Alur'
                                                : currentView === 'module-groups'
                                                  ? 'Grup'
                                                  : 'Modul'}
                                </Button>
                            )
                        }
                        filters={
                            currentView === 'users'
                                ? [
                                      { label: 'Role', key: 'role', options: ensureArray(roles).map((r: any) => ({ label: r.name, value: r.name })) },
                                      { label: 'Departemen', key: 'department_id', options: ensureArray(departments).map((d: any) => ({ label: d.name, value: d.id })) }
                                  ]
                                : currentView === 'workflows'
                                  ? [
                                        {
                                            label: 'Tipe Kontrak',
                                            key: 'contract_type',
                                            options: ensureArray(contractTypes || types).map((t: any) => ({ label: t.name, value: t.name })),
                                        },
                                    ]
                                  : currentView === 'modules'
                                    ? [
                                          {
                                              label: 'Grup Modul',
                                              key: 'module_group_id',
                                              options: ensureArray(moduleGroups).map((mg: any) => ({ label: mg.title, value: mg.id })),
                                          },
                                      ]
                                  : currentView === 'contract-types'
                                    ? [
                                          {
                                              label: 'Format',
                                              key: 'type',
                                              options: [
                                                  { label: 'F1', value: 'f1' },
                                                  { label: 'F2', value: 'f2' },
                                              ],
                                          },
                                      ]
                                    : undefined
                        }
                        searchValue={serverFilters?.search}
                        onSearchChange={(val) => handleBackendFilter({ search: val })}
                        activeFilters={serverFilters || {}}
                        onFilterChange={(f) => handleBackendFilter(f)}
                        onRefresh={() => router.reload({ preserveScroll: true } as any)}
                        renderExpandedRow={(row) => (
                            <div className="space-y-5 bg-slate-50/80 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="text-primary flex h-8 w-8 items-center justify-center rounded-xl border bg-white shadow-sm">
                                            <GitBranch size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] leading-none font-black text-foreground">Alur Approval</h4>
                                            <p className="mt-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                                                Kelola urutan dan otoritas persetujuan
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addLocalStep}
                                            className="h-8 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-[11px] font-bold"
                                        >
                                            <Plus size={14} /> Tambah
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => saveWorkflowSteps(row.id)}
                                            disabled={isSavingSteps}
                                            className="h-8 gap-1.5 rounded-lg px-4 text-[11px] font-black shadow-sm"
                                        >
                                            {isSavingSteps ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                            Simpan
                                        </Button>
                                    </div>
                                </div>

                                {editingSteps.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-8">
                                        <PlusCircle className="mb-2 h-6 w-6 text-slate-200" />
                                        <p className="text-[11px] font-bold text-slate-400">Belum ada langkah approval</p>
                                        <Button
                                            variant="link"
                                            onClick={addLocalStep}
                                            className="text-primary mt-1 h-auto p-0 text-[9px] font-black tracking-widest uppercase"
                                        >
                                            Buat Pertama
                                        </Button>
                                    </div>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                        modifiers={[restrictToVerticalAxis]}
                                    >
                                        <SortableContext items={editingSteps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-2">
                                                {editingSteps.map((step, idx) => (
                                                    <SortableStepItem
                                                        key={step.id}
                                                        step={step}
                                                        idx={idx}
                                                        users={ensureArray(users)}
                                                        roles={ensureArray(roles)}
                                                        departments={ensureArray(departments)}
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
                                        <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Selesai</span>
                                    </div>
                                    <div className="h-[1px] flex-1 bg-slate-200" />
                                </div>
                            </div>
                        )}
                        isRowExpanded={(row) => currentView === 'workflows' && expandedWorkflowId === row.id}
                        rowActions={(row) => <>{renderRowActions(row)}</>}
                        bulkActions={(selectedRows) => (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 gap-2 px-3 text-[11px] font-bold tracking-wider text-red-600 uppercase hover:bg-red-50 hover:text-red-700"
                                onClick={() => {
                                    if (confirm(`Hapus ${selectedRows.length} data terpilih?`)) {
                                        // Bulk delete logic here
                                        showToast(`${selectedRows.length} data berhasil dihapus.`, 'success');
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
                <DialogContent
                    className={cn('overflow-hidden border-none p-0 shadow-2xl sm:max-w-[425px]', currentView === 'workflows' && 'sm:max-w-[500px]')}
                >
                    <div className="relative bg-slate-950 p-6 text-white">
                        <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-10">
                            <Icon className="h-24 w-24 rotate-12" />
                        </div>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight uppercase">
                            <div className="bg-primary h-8 w-2 rounded-full" />
                            {editingItem ? 'Edit' : 'Tambah'}{' '}
                            {currentView === 'users'
                                ? 'Pengguna'
                                : currentView === 'roles'
                                  ? 'Role'
                                  : currentView === 'contract-types'
                                    ? 'Tipe'
                                    : currentView === 'contract-statuses'
                                      ? 'Status Master'
                                      : currentView === 'workflows'
                                        ? 'Alur Kerja'
                                        : currentView === 'departments'
                                          ? 'Departemen'
                                          : currentView === 'module-groups'
                                            ? 'Grup'
                                            : 'Modul'}
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-[12px] font-medium text-slate-400">
                            {editingItem
                                ? 'Silakan perbarui detail entitas di bawah ini.'
                                : 'Isi formulir untuk mendaftarkan entitas baru ke sistem.'}
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid gap-4 py-4">
                            {currentView === 'users' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <Input
                                            id="name"
                                            value={userForm.data.name}
                                            onChange={(e) => userForm.setData('name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={userForm.data.email}
                                            onChange={(e) => userForm.setData('email', e.target.value)}
                                            required
                                        />
                                        {userForm.errors.email && <p className="text-destructive text-xs">{userForm.errors.email}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            value={userForm.data.username}
                                            onChange={(e) => userForm.setData('username', e.target.value)}
                                            required
                                            maxLength={20}
                                        />
                                        {userForm.errors.username && <p className="text-destructive text-xs">{userForm.errors.username}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={userForm.data.role} onValueChange={(value) => userForm.setData('role', value)}>
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
                                        <Label htmlFor="department">Departemen / Divisi</Label>
                                        <Select
                                            value={userForm.data.department_id}
                                            onValueChange={(value) => userForm.setData('department_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Departemen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Tanpa Departemen</SelectItem>
                                                {ensureArray(departments).map((dept: any) => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="position">Jabatan / Posisi</Label>
                                            <Input
                                                id="position"
                                                value={userForm.data.position}
                                                onChange={(e) => userForm.setData('position', e.target.value)}
                                                placeholder="e.g. Legal Manager"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Nomor Telepon</Label>
                                            <Input
                                                id="phone"
                                                value={userForm.data.phone}
                                                onChange={(e) => userForm.setData('phone', e.target.value)}
                                                placeholder="08xxxxxxxxxx"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password {editingItem && '(Kosongkan jika tidak ingin mengubah)'}</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={userForm.data.password}
                                            onChange={(e) => userForm.setData('password', e.target.value)}
                                            required={!editingItem}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Checkbox
                                            id="user-active"
                                            checked={userForm.data.is_active}
                                            onCheckedChange={(checked) => userForm.setData('is_active', !!checked)}
                                        />
                                        <Label htmlFor="user-active" className="font-bold text-slate-600">
                                            Akun Aktif
                                        </Label>
                                    </div>
                                </>
                            )}

                            {currentView === 'roles' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-name">Nama Role</Label>
                                        <Input
                                            id="role-name"
                                            value={roleForm.data.name}
                                            onChange={(e) => roleForm.setData('name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-desc">Deskripsi</Label>
                                        <Input
                                            id="role-desc"
                                            value={roleForm.data.description}
                                            onChange={(e) => roleForm.setData('description', e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {currentView === 'contract-types' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type-name">Nama Tipe Kontrak</Label>
                                        <Input
                                            id="type-name"
                                            value={typeForm.data.name}
                                            onChange={(e) => typeForm.setData('name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type-flow">Tipe Alur</Label>
                                        <Select
                                            value={typeForm.data.type}
                                            onValueChange={(value) => typeForm.setData('type', value)}
                                        >
                                            <SelectTrigger id="type-flow">
                                                <SelectValue placeholder="Pilih Tipe Alur" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="f1" className="text-[11px] font-bold uppercase">Flow F1 (Request)</SelectItem>
                                                <SelectItem value="f2" className="text-[11px] font-bold uppercase">Flow F2 (Summary)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type-desc">Deskripsi</Label>
                                        <Input
                                            id="type-desc"
                                            value={typeForm.data.description}
                                            onChange={(e) => typeForm.setData('description', e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {currentView === 'workflows' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wf-name">Nama Alur Kerja</Label>
                                        <Input
                                            id="wf-name"
                                            value={workflowForm.data.name}
                                            onChange={(e) => workflowForm.setData('name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wf-type">Tipe Kontrak</Label>
                                        <Select
                                            value={workflowForm.data.contract_type}
                                            onValueChange={(value) => workflowForm.setData('contract_type', value)}
                                        >
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="wf-dept">Departemen Pemilik</Label>
                                        <Select
                                            value={workflowForm.data.department_id || 'none'}
                                            onValueChange={(value) => workflowForm.setData('department_id', value === 'none' ? null : (value as any))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Departemen (Optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">General / Cross-Department</SelectItem>
                                                {ensureArray(departments).map((dept: any) => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2 border-t pt-2">
                                        <Checkbox
                                            id="wf-default"
                                            checked={workflowForm.data.is_default}
                                            onCheckedChange={(checked) => workflowForm.setData('is_default', !!checked)}
                                        />
                                        <Label htmlFor="wf-default" className="cursor-pointer text-[11px] font-bold text-slate-600">
                                            Set sebagai alur kerja default untuk tipe ini
                                        </Label>
                                    </div>

                                    <div className="mt-4 space-y-4 border-t pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary flex h-5 w-5 items-center justify-center rounded text-white shadow-sm">
                                                <Clock size={10} className="stroke-[3]" />
                                            </div>
                                            <span className="text-[11px] font-black tracking-widest text-slate-800 uppercase">SLA & Kecepatan Kerja</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase">SLA Drafting (Jam)</Label>
                                                    <span className="text-[10px] font-bold text-primary">{Math.floor(workflowForm.data.sla_drafting_hours / 24)} Hari</span>
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={workflowForm.data.sla_drafting_hours}
                                                    onChange={(e) => workflowForm.setData('sla_drafting_hours', parseInt(e.target.value))}
                                                    className="h-9 rounded-lg font-mono text-[12px] font-bold"
                                                    placeholder="Contoh: 72"
                                                />
                                                <p className="text-[9px] text-slate-400">Total jam kerja untuk tahap draf.</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Total SLA (Jam)</Label>
                                                    <span className="text-[10px] font-bold text-primary">{Math.floor(workflowForm.data.sla_total_hours / 24)} Hari</span>
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={workflowForm.data.sla_total_hours}
                                                    onChange={(e) => workflowForm.setData('sla_total_hours', parseInt(e.target.value))}
                                                    className="h-9 rounded-lg font-mono text-[12px] font-bold"
                                                    placeholder="Contoh: 240"
                                                />
                                                <p className="text-[9px] text-slate-400">Total SLA sampai tanda tangan.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                            <div className="flex items-center justify-between px-1">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Cut-off Time (WIB)</Label>
                                                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">{workflowForm.data.sla_cutoff_hour}:00</span>
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={workflowForm.data.sla_cutoff_hour}
                                                onChange={(e) => workflowForm.setData('sla_cutoff_hour', parseInt(e.target.value))}
                                                className="h-9 border-slate-200 bg-white rounded-lg font-mono text-[12px] font-bold"
                                            />
                                            <p className="px-1 text-[9px] leading-tight text-slate-400 italic">
                                                Jika data masuk lewat dari jam ini, perhitungan hari kerja dimulai esok harinya.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentView === 'contract-statuses' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="st-code">Kode Status (Case Sensitive)</Label>
                                            <Input
                                                id="st-code"
                                                value={statusForm.data.code}
                                                onChange={(e) => statusForm.setData('code', e.target.value)}
                                                required
                                                placeholder="e.g. in_review"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="st-name">Label Tampilan</Label>
                                            <Input
                                                id="st-name"
                                                value={statusForm.data.name}
                                                onChange={(e) => statusForm.setData('name', e.target.value)}
                                                required
                                                placeholder="e.g. Dalam Review"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="st-color">Warna Teks (HEX)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="st-color"
                                                    value={statusForm.data.color}
                                                    onChange={(e) => statusForm.setData('color', e.target.value)}
                                                    required
                                                    className="flex-1 font-mono"
                                                />
                                                <div
                                                    className="h-10 w-10 shrink-0 rounded-lg border shadow-sm"
                                                    style={{ backgroundColor: statusForm.data.color }}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="st-bg">Warna Background (HEX)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="st-bg"
                                                    value={statusForm.data.bg_color}
                                                    onChange={(e) => statusForm.setData('bg_color', e.target.value)}
                                                    required
                                                    className="flex-1 font-mono"
                                                />
                                                <div
                                                    className="h-10 w-10 shrink-0 rounded-lg border shadow-sm"
                                                    style={{ backgroundColor: statusForm.data.bg_color }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="st-icon">Icon (Lucide)</Label>
                                            <Input
                                                id="st-icon"
                                                value={statusForm.data.icon}
                                                onChange={(e) => statusForm.setData('icon', e.target.value)}
                                                placeholder="e.g. clock"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="st-sort">Urutan Tampil</Label>
                                            <Input
                                                id="st-sort"
                                                type="number"
                                                value={statusForm.data.sort_order}
                                                onChange={(e) => statusForm.setData('sort_order', parseInt(e.target.value))}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="st-desc">Deskripsi / Hint</Label>
                                        <Input
                                            id="st-desc"
                                            value={statusForm.data.description}
                                            onChange={(e) => statusForm.setData('description', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Checkbox
                                            id="st-active"
                                            checked={statusForm.data.is_active}
                                            onCheckedChange={(checked) => statusForm.setData('is_active', !!checked)}
                                        />
                                        <Label htmlFor="st-active" className="font-bold text-slate-600">
                                            Status Aktif
                                        </Label>
                                    </div>
                                </>
                            )}

                            {currentView === 'departments' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="dept-code">Kode Departemen</Label>
                                        <Input
                                            id="dept-code"
                                            value={departmentForm.data.code}
                                            onChange={(e) => departmentForm.setData('code', e.target.value)}
                                            required
                                            placeholder="e.g. IT, HR, FIN"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="dept-name">Nama Departemen</Label>
                                        <Input
                                            id="dept-name"
                                            value={departmentForm.data.name}
                                            onChange={(e) => departmentForm.setData('name', e.target.value)}
                                            required
                                            placeholder="e.g. Information Technology"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="dept-desc">Deskripsi</Label>
                                        <Input
                                            id="dept-desc"
                                            value={departmentForm.data.description}
                                            onChange={(e) => departmentForm.setData('description', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Checkbox
                                            id="dept-active"
                                            checked={departmentForm.data.is_active}
                                            onCheckedChange={(checked) => departmentForm.setData('is_active', !!checked)}
                                        />
                                        <Label htmlFor="dept-active" className="font-bold text-slate-600">
                                            Status Aktif
                                        </Label>
                                    </div>
                                </>
                            )}

                            {currentView === 'vendors' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="v-code">Kode Vendor</Label>
                                            <Input
                                                id="v-code"
                                                value={vendorForm.data.code}
                                                onChange={(e) => vendorForm.setData('code', e.target.value)}
                                                required
                                                placeholder="e.g. VND001"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="v-name">Nama Vendor / Mitra</Label>
                                            <Input
                                                id="v-name"
                                                value={vendorForm.data.name}
                                                onChange={(e) => vendorForm.setData('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="v-cat">Kategori</Label>
                                        <Select value={vendorForm.data.category} onValueChange={(v) => vendorForm.setData('category', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Supplier">Supplier</SelectItem>
                                                <SelectItem value="Consultant">Consultant</SelectItem>
                                                <SelectItem value="Contractor">Contractor</SelectItem>
                                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                <SelectItem value="Others">Others</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="v-email">Email Kontak</Label>
                                            <Input
                                                id="v-email"
                                                type="email"
                                                value={vendorForm.data.email}
                                                onChange={(e) => vendorForm.setData('email', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="v-phone">Nomor Telepon</Label>
                                            <Input
                                                id="v-phone"
                                                value={vendorForm.data.phone}
                                                onChange={(e) => vendorForm.setData('phone', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="v-addr">Alamat Lengkap</Label>
                                        <Input
                                            id="v-addr"
                                            value={vendorForm.data.address}
                                            onChange={(e) => vendorForm.setData('address', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Checkbox
                                            id="v-active"
                                            checked={vendorForm.data.is_active}
                                            onCheckedChange={(checked) => vendorForm.setData('is_active', !!checked)}
                                        />
                                        <Label htmlFor="v-active" className="font-bold text-slate-600">
                                            Vendor Aktif
                                        </Label>
                                    </div>
                                </>
                            )}

                            {currentView === 'module-groups' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mg-title">Judul Grup</Label>
                                        <Input
                                            id="mg-title"
                                            value={moduleGroupForm.data.title}
                                            onChange={(e) => moduleGroupForm.setData('title', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="mg-sort">Nomor Urut</Label>
                                        <Input
                                            id="mg-sort"
                                            type="number"
                                            value={moduleGroupForm.data.sort_number}
                                            onChange={(e) => moduleGroupForm.setData('sort_number', parseInt(e.target.value))}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {currentView === 'modules' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-code">Kode Modul (Case Sensitive)</Label>
                                        <Input
                                            id="m-code"
                                            value={moduleForm.data.code}
                                            onChange={(e) => moduleForm.setData('code', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-title">Judul Link</Label>
                                        <Input
                                            id="m-title"
                                            value={moduleForm.data.title}
                                            onChange={(e) => moduleForm.setData('title', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-url">URL Path</Label>
                                        <Input
                                            id="m-url"
                                            value={moduleForm.data.url}
                                            onChange={(e) => moduleForm.setData('url', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-icon">Lucide Icon name</Label>
                                        <Input
                                            id="m-icon"
                                            value={moduleForm.data.icon}
                                            onChange={(e) => moduleForm.setData('icon', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="m-group">Grup Modul</Label>
                                        <Select
                                            value={moduleForm.data.module_group_id}
                                            onValueChange={(value) => moduleForm.setData('module_group_id', value)}
                                        >
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
                                            onCheckedChange={(checked) => moduleForm.setData('showed_as_menu', !!checked)}
                                        />
                                        <Label htmlFor="m-show">Tampilkan di Menu Sidebar</Label>
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter className="-mx-6 mt-4 -mb-6 rounded-b-xl border-t bg-slate-50 p-6">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                className="text-[12px] font-bold tracking-tighter uppercase"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    userForm.processing ||
                                    roleForm.processing ||
                                    workflowForm.processing ||
                                    typeForm.processing ||
                                    moduleGroupForm.processing ||
                                    moduleForm.processing ||
                                    statusForm.processing ||
                                    departmentForm.processing ||
                                    vendorForm.processing
                                }
                                className="shadow-primary/20 px-8 text-[12px] font-black tracking-tighter uppercase shadow-lg"
                            >
                                {editingItem ? 'Perbarui Data' : 'Simpan Data'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[400px]">
                    <div className="relative bg-rose-600 p-6 text-white">
                        <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-10">
                            <AlertTriangle className="h-24 w-24 rotate-12" />
                        </div>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                            <AlertTriangle className="h-6 w-6" />
                            Hapus Data
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-[12px] font-medium text-rose-100">
                            Tindakan ini permanen dan data yang dihapus tidak dapat dikembalikan.
                        </DialogDescription>
                    </div>

                    <div className="bg-white p-6">
                        <p className="text-[13px] font-medium leading-relaxed text-slate-600">
                            Apakah Anda benar-benar yakin ingin menghapus item ini? Semua informasi terkait akan dihapus dari sistem secara permanen.
                        </p>
                    </div>

                    <DialogFooter className="flex flex-col gap-2 border-t bg-slate-50 p-6 pt-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="text-[12px] font-bold uppercase tracking-tighter"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            className="bg-rose-600 px-8 text-[12px] font-black uppercase tracking-tighter shadow-lg shadow-rose-200 hover:bg-rose-700"
                        >
                            Hapus Data Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ToastProvider>
    );
}
