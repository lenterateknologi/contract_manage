import { ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router, useForm } from '@inertiajs/react';
import { CheckCircle2, Edit3, GitBranch, Plus, PlusCircle, Shield, Trash2, UserCheck, Users as UsersIcon } from 'lucide-react';
import React, { useMemo, useState } from 'react';

// --- Sortable Step Item Component ---
function SortableStepItem({
    step,
    idx,
    users,
    roles,
    departments,
    contractStatuses,
    updateLocalStep,
    removeLocalStep,
}: {
    step: any;
    idx: number;
    users: any[];
    roles: any[];
    departments: any[];
    contractStatuses: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const [userSearchText, setUserSearchText] = useState('');
    const [roleSearchText, setRoleSearchText] = useState('');
    const [deptSearchText, setDeptSearchText] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    // Cascading Filter Logic
    const activeRoles = Array.isArray(step.role) ? step.role : step.role ? [step.role] : [];
    const activeDepts = Array.isArray(step.department_ids) ? step.department_ids : step.department_ids ? [step.department_ids] : [];
    const activeUsers = Array.isArray(step.user_ids) ? step.user_ids : [];

    // 1. Filter Departments based on selected Roles
    // If no roles selected, show all departments that have users
    const filteredDepartments = useMemo(() => {
        const base =
            activeRoles.length === 0
                ? departments
                : departments.filter((d) => users.some((u) => activeRoles.includes(u.role) && u.department_id === d.id));
        if (!deptSearchText) return base;
        return base.filter((d) => d.name.toLowerCase().includes(deptSearchText.toLowerCase()));
    }, [departments, activeRoles, users, deptSearchText]);

    const filteredRolesBySearch = useMemo(() => {
        if (!roleSearchText) return roles;
        return roles.filter((r) => r.name.toLowerCase().includes(roleSearchText.toLowerCase()));
    }, [roles, roleSearchText]);

    // 2. Filter Users based on selected Roles AND Departments
    const filteredUsersByHierarchy = useMemo(() => {
        return users.filter((u) => {
            const matchesRole = activeRoles.length === 0 || activeRoles.includes(u.role);
            const matchesDept = activeDepts.length === 0 || activeDepts.includes(u.department_id);
            const matchesSearch = !userSearchText || u.name.toLowerCase().includes(userSearchText.toLowerCase());
            return matchesRole && matchesDept && matchesSearch;
        });
    }, [users, activeRoles, activeDepts, userSearchText]);

    const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group/step relative flex gap-4 border border-black/10 bg-white p-3 transition-all hover:bg-black/5 dark:border-white/10 dark:bg-black dark:hover:bg-white/5',
                isDragging && 'z-50 scale-[1.01] border-black shadow-2xl grayscale dark:border-white',
                !isAnySelected && 'border-dashed',
            )}
        >
            {/* Index & Handle */}
            <div className="flex shrink-0 flex-col items-center gap-1">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex h-8 w-8 cursor-grab items-center justify-center border border-black/10 bg-white transition-colors group-hover/step:bg-black group-hover/step:text-white dark:border-white/10 dark:bg-black dark:group-hover/step:bg-white dark:group-hover/step:text-black"
                >
                    <span className="text-[10px] font-black">{idx + 1}</span>
                </div>
            </div>

            {/* Summary View */}
            <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-6">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        {!isAnySelected ? (
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="secondary"
                                    className="h-5 rounded-none border-none bg-black/5 px-2 text-[8px] font-black tracking-widest text-black/40 uppercase dark:bg-white/5 dark:text-white/40"
                                >
                                    SEMUA PERSONEL
                                </Badge>
                                <span className="text-[7px] font-bold tracking-tighter text-black/30 uppercase dark:text-white/30">
                                    Otoritas Terbuka
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                {activeRoles.length > 0 && (
                                    <div className="flex items-center gap-1.5 rounded-none bg-black p-1 text-white dark:bg-white dark:text-black">
                                        <Shield size={10} />
                                        <span className="max-w-[150px] truncate text-[8px] font-black tracking-tighter uppercase">
                                            {activeRoles.length === 1 ? activeRoles[0] : `${activeRoles.length} ROLE`}
                                        </span>
                                    </div>
                                )}

                                {activeDepts.length > 0 && (
                                    <div className="flex items-center gap-1.5 rounded-none border border-black p-1 text-black dark:border-white dark:text-white">
                                        <GitBranch size={10} />
                                        <span className="max-w-[150px] truncate text-[8px] font-black tracking-tighter uppercase">
                                            {activeDepts.length === 1
                                                ? departments.find((d) => d.id === activeDepts[0])?.name
                                                : `${activeDepts.length} DEPT`}
                                        </span>
                                    </div>
                                )}

                                {activeUsers.length > 0 && (
                                    <div className="flex items-center gap-1.5 rounded-none border border-black/10 bg-black/5 p-1 text-black dark:border-white/10 dark:bg-white/5 dark:text-white">
                                        <UserCheck size={10} />
                                        <span className="max-w-[150px] truncate text-[8px] font-black tracking-tighter uppercase">
                                            {activeUsers.length === 1
                                                ? users.find((u) => u.id === activeUsers[0])?.name
                                                : `${activeUsers.length} PERSONEL`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                            {step.status_id && (
                                <Badge
                                    variant="secondary"
                                    className="h-4 rounded-none border-none bg-black px-1.5 text-[7px] font-black tracking-widest text-white uppercase dark:bg-white dark:text-black"
                                >
                                    STATUS MAP
                                </Badge>
                            )}
                            {step.description && (
                                <span className="truncate text-[7px] font-bold tracking-tight text-black/40 uppercase italic dark:text-white/40">
                                    {step.description}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-1">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 rounded-none border-2 border-black px-4 text-[9px] font-black uppercase transition-all hover:bg-black hover:text-white"
                            >
                                <Edit3 size={12} /> Atur Otoritas
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl overflow-hidden rounded-none border border-black bg-white p-0 dark:border-white dark:bg-black">
                            <DialogHeader className="flex-row items-center justify-between space-y-0 bg-black p-4 text-white dark:bg-white dark:text-black">
                                <div>
                                    <DialogTitle className="text-[12px] font-black tracking-[0.2em] uppercase">
                                        Tahap {idx + 1}: Konfigurasi Otoritas
                                    </DialogTitle>
                                    <p className="mt-1 text-[8px] font-bold text-white/50 uppercase dark:text-black/50">
                                        Gunakan Drill-down Hierarchy (Role → Dept → Personel)
                                    </p>
                                </div>
                            </DialogHeader>

                            <div className="flex gap-6 border-b border-black/10 bg-black/5 px-6 py-4 dark:border-white/10 dark:bg-white/5">
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-[9px] font-black tracking-widest text-black/50 uppercase dark:text-white/50">
                                        Deskripsi Tahapan (Opsional)
                                    </Label>
                                    <Input
                                        placeholder="CONTOH: REVIEW LEGAL DRAFT"
                                        value={step.description || ''}
                                        onChange={(e) => updateLocalStep(idx, { description: e.target.value })}
                                        className="h-9 rounded-none border-black bg-white text-[10px] font-black tracking-tight text-black uppercase shadow-none transition-colors focus-visible:ring-0 dark:border-white dark:bg-black dark:text-white"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-[9px] font-black tracking-widest text-black/50 uppercase dark:text-white/50">
                                        Label Status (Opsional)
                                    </Label>
                                    <select
                                        className="h-9 w-full rounded-none border border-black bg-white px-3 text-[10px] font-black tracking-tight text-black uppercase shadow-none transition-colors focus:ring-0 focus:outline-none dark:border-white dark:bg-black dark:text-white"
                                        value={step.status_id || ''}
                                        onChange={(e) => updateLocalStep(idx, { status_id: e.target.value || null })}
                                    >
                                        <option value="">-- TANPA PERUBAHAN STATUS --</option>
                                        {contractStatuses.map((s: any) => (
                                            <option key={s.id} value={s.id}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid min-h-[350px] grid-cols-1 gap-6 bg-white p-6 md:grid-cols-3">
                                {/* 1. ROLE SELECTION */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <Shield size={12} className="text-black" />
                                            <Label className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                1. Role / Jabatan
                                            </Label>
                                        </div>
                                        {activeRoles.length > 0 && (
                                            <Badge className="rounded-none bg-black text-[8px] text-white">{activeRoles.length}</Badge>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <Input
                                            placeholder="CARI ROLE..."
                                            value={roleSearchText}
                                            onChange={(e) => setRoleSearchText(e.target.value)}
                                            className="h-8 rounded-none border-black/10 pl-8 text-[10px] font-bold uppercase shadow-none focus-visible:border-black focus-visible:ring-0 dark:border-white/10"
                                        />
                                        <Shield className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/40 dark:text-white/40" size={12} />
                                    </div>

                                    <div className="customize-scrollbar grid max-h-[250px] grid-cols-1 gap-1 overflow-y-auto pr-1">
                                        {filteredRolesBySearch.map((r) => {
                                            const isActive = activeRoles.includes(r.name);
                                            return (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = isActive
                                                            ? activeRoles.filter((n: string) => n !== r.name)
                                                            : [...activeRoles, r.name];
                                                        updateLocalStep(idx, { role: next });
                                                    }}
                                                    className={cn(
                                                        'flex items-center justify-between border p-2.5 text-[9px] font-black uppercase transition-all',
                                                        isActive
                                                            ? 'border-black bg-black text-white'
                                                            : 'border-black/5 bg-white text-black/60 hover:border-black/30 dark:border-white/5 dark:text-white/60',
                                                    )}
                                                >
                                                    {r.name}
                                                    {isActive && <CheckCircle2 size={10} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. DEPARTMENT SELECTION */}
                                <div className="space-y-3 border-x border-black/5 px-6 dark:border-white/5">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={12} className="text-black" />
                                            <Label className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                2. Departemen
                                            </Label>
                                        </div>
                                        {activeDepts.length > 0 && (
                                            <Badge className="rounded-none bg-black text-[8px] text-white">{activeDepts.length}</Badge>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <Input
                                            placeholder="CARI DEPARTEMEN..."
                                            value={deptSearchText}
                                            onChange={(e) => setDeptSearchText(e.target.value)}
                                            className="h-8 rounded-none border-black/10 pl-8 text-[10px] font-bold uppercase shadow-none focus-visible:border-black focus-visible:ring-0 dark:border-white/10"
                                        />
                                        <GitBranch
                                            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/40 dark:text-white/40"
                                            size={12}
                                        />
                                    </div>

                                    <div className="customize-scrollbar grid max-h-[250px] grid-cols-1 gap-1 overflow-y-auto pr-1">
                                        {filteredDepartments.map((d) => {
                                            const isActive = activeDepts.includes(d.id);
                                            return (
                                                <button
                                                    key={d.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = isActive
                                                            ? activeDepts.filter((id: string) => id !== d.id)
                                                            : [...activeDepts, d.id];
                                                        updateLocalStep(idx, { department_ids: next });
                                                    }}
                                                    className={cn(
                                                        'flex items-center justify-between border p-2.5 text-[9px] font-black uppercase transition-all',
                                                        isActive
                                                            ? 'border-black bg-black text-white'
                                                            : 'border-black/5 bg-white text-black/60 hover:border-black/30 dark:border-white/5 dark:text-white/60',
                                                    )}
                                                >
                                                    {d.name}
                                                    {isActive && <CheckCircle2 size={10} />}
                                                </button>
                                            );
                                        })}
                                        {filteredDepartments.length === 0 && (
                                            <div className="py-20 text-center text-[8px] font-black text-black/30 uppercase italic dark:text-white/30">
                                                Tidak ada departemen tersedia
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. PERSONEL SELECTION */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <UsersIcon size={12} className="text-black" />
                                            <Label className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                3. Personel Spesifik
                                            </Label>
                                        </div>
                                        {activeUsers.length > 0 && (
                                            <Badge className="rounded-none bg-black text-[8px] text-white">{activeUsers.length}</Badge>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <Input
                                            placeholder="CARI..."
                                            value={userSearchText}
                                            onChange={(e) => setUserSearchText(e.target.value)}
                                            className="h-9 rounded-none border-black/10 pl-8 text-[10px] font-bold uppercase shadow-none focus-visible:border-black focus-visible:ring-0 dark:border-white/10"
                                        />
                                        <UsersIcon
                                            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/40 dark:text-white/40"
                                            size={12}
                                        />
                                    </div>

                                    <div className="customize-scrollbar grid max-h-[250px] grid-cols-1 gap-1 overflow-y-auto pr-1">
                                        {filteredUsersByHierarchy.map((u) => {
                                            const isSelected = activeUsers.includes(u.id);
                                            return (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = isSelected
                                                            ? activeUsers.filter((id: string) => id !== u.id)
                                                            : [...activeUsers, u.id];
                                                        updateLocalStep(idx, { user_ids: next });
                                                    }}
                                                    className={cn(
                                                        'flex items-center gap-3 border p-2.5 text-left transition-all',
                                                        isSelected
                                                            ? 'border-black bg-black text-white'
                                                            : 'border-transparent bg-white text-black/60 hover:border-black/10 dark:border-white/10 dark:text-white/60',
                                                    )}
                                                >
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <span className="truncate text-[10px] leading-none font-black uppercase">{u.name}</span>
                                                        <span
                                                            className={cn(
                                                                'mt-1 text-[7px] font-bold uppercase opacity-50',
                                                                isSelected ? 'text-black/40 dark:text-white/40' : 'text-black/40 dark:text-white/40',
                                                            )}
                                                        >
                                                            {u.role}
                                                        </span>
                                                    </div>
                                                    {isSelected && <CheckCircle2 size={12} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="flex items-center justify-between border-t bg-black/[0.02] p-3 sm:justify-between dark:bg-white/[0.02]">
                                <div className="text-[8px] font-black text-black/40 uppercase italic dark:text-white/40">
                                    Perubahan Tersimpan Otomatis di Draft
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="h-8 rounded-lg px-8 text-[10px] font-black uppercase shadow-lg active:scale-95"
                                >
                                    Tutup
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLocalStep(idx)}
                        className="h-8 w-8 text-black/20 transition-colors hover:text-black dark:text-white/20 dark:hover:text-white"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- Cell Components ---
const WorkflowNameCell = ({ row }: { readonly row: any }) => (
    <div className="flex flex-col">
        <div className="flex items-center gap-2">
            <span className="text-[13px] leading-tight font-bold text-black dark:text-white">{row.name}</span>
            {row.is_default && (
                <span className="border-l border-black/[0.1] pl-2 text-[8px] leading-none font-black tracking-widest text-black/20 uppercase dark:text-white/20">
                    DEFAULT
                </span>
            )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] leading-none font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
            {row.contract_type || 'GLOBAL CLASSIFICATION'}
        </div>
    </div>
);

const InitiatorCell = ({ row }: { readonly row: any }) => {
    let text = '';
    if (row.initiator_type === 'all') text = 'Publik';
    else if (row.initiator_type === 'role') text = `${row.initiator_roles?.length || 0} Role`;
    else text = `${row.initiator_users?.length || 0} User`;

    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-black/60 uppercase dark:text-white/60">{text}</span>
        </div>
    );
};

const StepsCell = ({ row }: { readonly row: any }) => (
    <div className="flex items-center gap-4">
        <div className="flex -space-x-1.5">
            {row.steps?.slice(0, 3).map((s: any) => (
                <div
                    key={s.id || Math.random().toString()}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black/[0.04] text-[10px] font-bold text-black/60 shadow-sm dark:border-black dark:bg-white/[0.04] dark:text-white/60"
                    title={Array.isArray(s.role) ? s.role.join(', ') : s.role}
                >
                    {Array.isArray(s.role) ? s.role[0]?.charAt(0) : s.role?.charAt(0)}
                </div>
            ))}
            {row.steps?.length > 3 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black/[0.04] text-[10px] font-bold text-black/40 shadow-sm dark:border-black dark:bg-white/[0.04] dark:text-white/40">
                    +{row.steps.length - 3}
                </div>
            )}
        </div>
        <span className="text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
            {row.steps?.length || 0} TAHAPAN
        </span>
    </div>
);

// --- Workflow Management Component ---
interface WorkflowManagementProps {
    readonly workflows: any;
    readonly contractTypes: any[];
    readonly departments: any[];
    readonly roles: any[];
    readonly users: any[];
    readonly contractStatuses: any[];
    readonly filters: any;
}

export function WorkflowManagement({ workflows, contractTypes, departments, roles, users, contractStatuses, filters }: WorkflowManagementProps) {
    const { showToast } = useToast();
    const { canUpdate } = usePermissions('ADMIN_WORKFLOWS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
    const [isInitiatorDialogOpen, setIsInitiatorDialogOpen] = useState(false);
    const [initiatorUserSearch, setInitiatorUserSearch] = useState('');
    const [initiatorRoleSearch, setInitiatorRoleSearch] = useState('');
    const [initiatorDeptSearch, setInitiatorDeptSearch] = useState('');

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const form = useForm({
        name: '',
        contract_type: '',
        description: '',
        is_default: true as boolean,
        initiator_type: 'all', // all, role, user
        initiator_roles: [] as string[],
        initiator_users: [] as string[],
        initiator_departments: [] as string[],
        steps: [] as any[],
    });


    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Alur Kerja',
                accessorKey: 'name',
                sortable: true,
                cell: (row) => <WorkflowNameCell row={row} />,
            },
            {
                header: 'Inisiator',
                accessorKey: 'initiator_type',
                cell: (row) => <InitiatorCell row={row} />,
            },
            {
                header: 'Tahapan',
                accessorKey: 'steps_count',
                cell: (row) => <StepsCell row={row} />,
            },
        ],
        [],
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIdx = form.data.steps.findIndex((i) => i.id === active.id);
            const newIdx = form.data.steps.findIndex((i) => i.id === over.id);
            form.setData('steps', arrayMove(form.data.steps, oldIdx, newIdx));
        }
    };

    const addLocalStep = () => {
        form.setData('steps', [
            ...form.data.steps,
            {
                id: `new-${Date.now()}`,
                approver_type: 'role',
                user_ids: [],
                role: [] as string[],
                department_ids: [] as string[],
                step: form.data.steps.length + 1,
            },
        ]);
    };

    const openCreate = () => {
        setEditingWorkflow(null);
        form.reset();
        setIsModalOpen(true);
    };

    const openEdit = (w: any) => {
        setEditingWorkflow(w);
        form.setData({
            name: w.name,
            contract_type: w.contract_type,
            description: w.description || '',
            is_default: !!w.is_default,
            initiator_type: w.initiator_type || 'all',
            initiator_roles: w.initiator_roles || [],
            initiator_users: w.initiator_users || [],
            initiator_departments: w.initiator_departments || [],
            steps:
                w.steps?.map((s: any) => ({
                    id: s.id,
                    role: Array.isArray(s.role) ? s.role : s.role ? [s.role] : [],
                    approver_type: s.approver_type || 'role',
                    user_ids: s.user_ids || [],
                    department_ids: s.department_ids || [],
                    status_id: s.status_id || null,
                    description: s.description || '',
                    step: s.step,
                })) || [],
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingWorkflow(null);
                showToast('Struktur Alur Tersimpan', 'success');
            },
        };
        if (editingWorkflow) form.put(`/admin/workflows/${editingWorkflow.id}`, options);
        else form.post('/admin/workflows', options);
    };

    if (editingWorkflow || (isModalOpen && !editingWorkflow)) {
        const isEdit = !!editingWorkflow;

        return (
            <ManagementForm
                title={isEdit ? 'Profil Alur Kerja' : 'Registrasi Alur Baru'}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingWorkflow(null);
                }}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={isEdit}
            >
                <div className="animate-in slide-in-from-bottom-2 w-full space-y-8 px-2 pb-12 duration-500">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Primary Identity Section */}
                        <div className="space-y-4">
                            <h3 className="border-b border-black/10 pb-2 text-left text-[10px] font-black tracking-[0.2em] text-black/60 uppercase dark:border-white/10 dark:text-white/60">
                                Konfigurasi Utama Alur
                            </h3>
                            <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black tracking-widest text-black/50 uppercase dark:text-white/50">
                                        Nama Alur Kerja
                                    </Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="CONTOH: PENGADAAN REGULER"
                                        className="h-10 rounded-none border-black bg-white text-[10px] font-black tracking-tight text-black uppercase shadow-none transition-colors focus-visible:ring-0 dark:border-white dark:bg-black dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black tracking-widest text-black/50 uppercase dark:text-white/50">
                                        Klasifikasi
                                    </Label>
                                    <SearchableSelect
                                        value={form.data.contract_type || 'all'}
                                        onValueChange={(v) => form.setData('contract_type', v === 'all' ? '' : v)}
                                        placeholder="Pilih Klasifikasi"
                                        searchPlaceholder="Cari klasifikasi..."
                                        options={[
                                            { value: 'all', label: 'Semua Klasifikasi', italic: true },
                                            ...contractTypes.map((t: any) => ({ value: t.name, label: t.name })),
                                        ]}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black tracking-widest text-black/50 uppercase opacity-0 select-none dark:text-white/50">
                                        ‌
                                    </Label>
                                    <label className="group flex h-10 cursor-pointer items-center gap-2.5 border border-black bg-white px-3 transition-colors hover:bg-black dark:border-white dark:bg-black dark:hover:bg-white">
                                        <Checkbox
                                            id="f-default"
                                            checked={form.data.is_default}
                                            onCheckedChange={(checked) => form.setData('is_default', checked as boolean)}
                                            className="h-4 w-4 rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white dark:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
                                        />
                                        <span className="text-[9px] leading-none font-black tracking-widest text-black/40 uppercase transition-colors group-hover:text-white dark:text-white/40 dark:group-hover:text-black">
                                            Alur Standar
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Initiator Control Section */}
                        <div className="space-y-4">
                            <h3 className="border-b border-black/10 pb-2 text-left text-[10px] font-black tracking-[0.2em] text-black/60 uppercase dark:border-white/10 dark:text-white/60">
                                Hak Akses Inisiator
                            </h3>
                            {(() => {
                                const activeRoles = form.data.initiator_roles || [];
                                const activeDepts = form.data.initiator_departments || [];
                                const activeUsers = form.data.initiator_users || [];
                                const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;

                                // Cascading Logic
                                const filteredDepts =
                                    activeRoles.length === 0
                                        ? departments
                                        : departments.filter((d) => users.some((u) => activeRoles.includes(u.role) && u.department_id === d.id));
                                const searchedRoles =
                                    initiatorRoleSearch === ''
                                        ? roles
                                        : roles.filter((r) => r.name.toLowerCase().includes(initiatorRoleSearch.toLowerCase()));
                                const searchedDepts =
                                    initiatorDeptSearch === ''
                                        ? filteredDepts
                                        : filteredDepts.filter((d) => d.name.toLowerCase().includes(initiatorDeptSearch.toLowerCase()));
                                const filteredUsers = users.filter((u) => {
                                    const matchesRole = activeRoles.length === 0 || activeRoles.includes(u.role);
                                    const matchesDept = activeDepts.length === 0 || activeDepts.includes(u.department_id);
                                    const matchesSearch =
                                        initiatorUserSearch === '' || u.name.toLowerCase().includes(initiatorUserSearch.toLowerCase());
                                    return matchesRole && matchesDept && matchesSearch;
                                });

                                return (
                                    <div
                                        className={cn(
                                            'relative flex items-center justify-between border border-black bg-white p-4 transition-all hover:bg-black/5 dark:border-white dark:bg-black dark:hover:bg-white/5',
                                            !isAnySelected && 'border-dashed',
                                        )}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            {isAnySelected ? (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {activeRoles.length > 0 && (
                                                        <div className="flex items-center gap-1.5 rounded-none bg-black p-1 text-white dark:bg-white dark:text-black">
                                                            <Shield size={10} />
                                                            <span className="max-w-[150px] truncate text-[8px] font-black tracking-tighter uppercase">
                                                                {activeRoles.length === 1 ? activeRoles[0] : `${activeRoles.length} ROLE`}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {activeDepts.length > 0 && (
                                                        <div className="flex items-center gap-1.5 rounded-none border border-black p-1 text-black dark:border-white dark:text-white">
                                                            <GitBranch size={10} />
                                                            <span className="max-w-[150px] truncate text-[8px] font-black tracking-tighter uppercase">
                                                                {activeDepts.length === 1
                                                                    ? departments.find((d) => d.id === activeDepts[0])?.name
                                                                    : `${activeDepts.length} DEPT`}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {activeUsers.length > 0 && (
                                                        <div className="flex items-center gap-1.5 rounded-none border border-black/10 bg-black/5 p-1 text-black dark:border-white/10 dark:bg-white/5 dark:text-white">
                                                            <UserCheck size={10} />
                                                            <span className="max-w-[150px] truncate text-[8px] font-black tracking-tighter uppercase">
                                                                {activeUsers.length === 1
                                                                    ? users.find((u) => u.id === activeUsers[0])?.name
                                                                    : `${activeUsers.length} PERSONEL`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className="h-5 rounded-none border-none bg-black/5 px-2 text-[8px] font-black tracking-widest text-black/40 dark:bg-white/5 dark:text-white/40"
                                                    >
                                                        SEMUA PERSONEL
                                                    </Badge>
                                                    <span className="text-[7px] font-bold tracking-tighter text-black/30 uppercase dark:text-white/30">
                                                        Akses Terbuka (Publik)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Dialog open={isInitiatorDialogOpen} onOpenChange={setIsInitiatorDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-2 rounded-none border-2 border-black px-4 text-[9px] font-black uppercase transition-all hover:bg-black hover:text-white"
                                                >
                                                    <Edit3 size={12} /> Atur Akses Inisiator
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-5xl overflow-hidden rounded-none border border-black bg-white p-0 dark:border-white dark:bg-black">
                                                <DialogHeader className="flex-row items-center justify-between space-y-0 bg-black p-4 text-white dark:bg-white dark:text-black">
                                                    <div>
                                                        <DialogTitle className="text-[12px] font-black tracking-[0.2em] uppercase">
                                                            Otoritas Inisiator Kontrak
                                                        </DialogTitle>
                                                        <p className="mt-1 text-[8px] font-bold text-white/50 uppercase dark:text-black/50">
                                                            Gunakan Drill-down Hierarchy (Role → Dept → User)
                                                        </p>
                                                    </div>
                                                </DialogHeader>

                                                <div className="grid min-h-[400px] grid-cols-1 gap-6 bg-white p-6 md:grid-cols-3">
                                                    {/* 1. ROLE */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between border-b pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Shield size={12} className="text-black" />
                                                                <Label className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                                    1. Role / Jabatan
                                                                </Label>
                                                            </div>
                                                            {activeRoles.length > 0 && (
                                                                <Badge className="rounded-none bg-black text-[8px] text-white">
                                                                    {activeRoles.length}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="CARI ROLE..."
                                                                value={initiatorRoleSearch}
                                                                onChange={(e) => setInitiatorRoleSearch(e.target.value)}
                                                                className="h-8 rounded-none border-black bg-white pl-8 text-[10px] font-black text-black uppercase shadow-none transition-colors focus-visible:ring-0 dark:border-white dark:bg-black dark:text-white"
                                                            />
                                                            <Shield
                                                                className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/40 dark:text-white/40"
                                                                size={12}
                                                            />
                                                        </div>
                                                        <div className="customize-scrollbar grid max-h-[300px] grid-cols-1 gap-1 overflow-y-auto pr-1">
                                                            {searchedRoles.map((r) => {
                                                                const isActive = activeRoles.includes(r.name);
                                                                return (
                                                                    <button
                                                                        key={r.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const next = isActive
                                                                                ? activeRoles.filter((n: string) => n !== r.name)
                                                                                : [...activeRoles, r.name];
                                                                            form.setData('initiator_roles', next);
                                                                        }}
                                                                        className={cn(
                                                                            'flex items-center justify-between border p-2.5 text-[9px] font-black uppercase transition-all',
                                                                            isActive
                                                                                ? 'border-black bg-black text-white'
                                                                                : 'border-black/5 bg-white text-black/60 hover:border-black/30 dark:border-white/5 dark:text-white/60',
                                                                        )}
                                                                    >
                                                                        {r.name}
                                                                        {isActive && <CheckCircle2 size={10} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* 2. DEPT */}
                                                    <div className="space-y-3 border-x border-black/5 px-6 dark:border-white/5">
                                                        <div className="flex items-center justify-between border-b pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <GitBranch size={12} className="text-black" />
                                                                <Label className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                                    2. Departemen
                                                                </Label>
                                                            </div>
                                                            {activeDepts.length > 0 && (
                                                                <Badge className="rounded-none bg-black text-[8px] text-white">
                                                                    {activeDepts.length}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="CARI DEPARTEMEN..."
                                                                value={initiatorDeptSearch}
                                                                onChange={(e) => setInitiatorDeptSearch(e.target.value)}
                                                                className="h-8 rounded-none border-black bg-white pl-8 text-[10px] font-black text-black uppercase shadow-none transition-colors focus-visible:ring-0 dark:border-white dark:bg-black dark:text-white"
                                                            />
                                                            <GitBranch
                                                                className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/40 dark:text-white/40"
                                                                size={12}
                                                            />
                                                        </div>
                                                        <div className="customize-scrollbar grid max-h-[300px] grid-cols-1 gap-1 overflow-y-auto pr-1">
                                                            {searchedDepts.map((d) => {
                                                                const isActive = activeDepts.includes(d.id);
                                                                return (
                                                                    <button
                                                                        key={d.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const next = isActive
                                                                                ? activeDepts.filter((id: string) => id !== d.id)
                                                                                : [...activeDepts, d.id];
                                                                            form.setData('initiator_departments', next);
                                                                        }}
                                                                        className={cn(
                                                                            'flex items-center justify-between border p-2.5 text-[9px] font-black uppercase transition-all',
                                                                            isActive
                                                                                ? 'border-black bg-black text-white'
                                                                                : 'border-black/5 bg-white text-black/60 hover:border-black/30 dark:border-white/5 dark:text-white/60',
                                                                        )}
                                                                    >
                                                                        {d.name}
                                                                        {isActive && <CheckCircle2 size={10} />}
                                                                    </button>
                                                                );
                                                            })}
                                                            {searchedDepts.length === 0 && (
                                                                <div className="py-20 text-center text-[8px] font-black text-black/30 uppercase italic dark:text-white/30">
                                                                    Tidak ada departemen tersedia
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 3. USER */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between border-b pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <UsersIcon size={12} className="text-black" />
                                                                <Label className="text-[10px] font-black tracking-widest text-black uppercase dark:text-white">
                                                                    3. User Spesifik
                                                                </Label>
                                                            </div>
                                                            {activeUsers.length > 0 && (
                                                                <Badge className="rounded-none bg-black text-[8px] text-white">
                                                                    {activeUsers.length}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="CARI USER..."
                                                                value={initiatorUserSearch}
                                                                onChange={(e) => setInitiatorUserSearch(e.target.value)}
                                                                className="h-8 rounded-none border-black bg-white pl-8 text-[10px] font-black text-black uppercase shadow-none transition-colors focus-visible:ring-0 dark:border-white dark:bg-black dark:text-white"
                                                            />
                                                            <UsersIcon
                                                                className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/40 dark:text-white/40"
                                                                size={12}
                                                            />
                                                        </div>
                                                        <div className="customize-scrollbar grid max-h-[300px] grid-cols-1 gap-1 overflow-y-auto pr-1">
                                                            {filteredUsers.map((u) => {
                                                                const isSelected = activeUsers.includes(u.id);
                                                                return (
                                                                    <button
                                                                        key={u.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const next = isSelected
                                                                                ? activeUsers.filter((id: string) => id !== u.id)
                                                                                : [...activeUsers, u.id];
                                                                            form.setData('initiator_users', next);
                                                                        }}
                                                                        className={cn(
                                                                            'flex items-center gap-3 border p-2.5 text-left transition-all',
                                                                            isSelected
                                                                                ? 'border-black bg-black text-white'
                                                                                : 'border-transparent bg-white text-black/60 hover:border-black/10 dark:border-white/10 dark:text-white/60',
                                                                        )}
                                                                    >
                                                                        <div className="flex min-w-0 flex-1 flex-col">
                                                                            <span className="truncate text-[10px] leading-none font-black uppercase">
                                                                                {u.name}
                                                                            </span>
                                                                            <span
                                                                                className={cn(
                                                                                    'mt-1 text-[7px] font-bold uppercase opacity-50',
                                                                                    isSelected
                                                                                        ? 'text-black/40 dark:text-white/40'
                                                                                        : 'text-black/40 dark:text-white/40',
                                                                                )}
                                                                            >
                                                                                {u.role}
                                                                            </span>
                                                                        </div>
                                                                        {isSelected && <CheckCircle2 size={12} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <DialogFooter className="flex items-center justify-between border-t border-black/10 bg-black/5 p-3 sm:justify-between dark:border-white/10 dark:bg-white/5">
                                                    <div className="text-[8px] font-black text-black/40 uppercase italic dark:text-white/40">
                                                        Perubahan Tersimpan Otomatis di Draft
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        type="button"
                                                        onClick={() => setIsInitiatorDialogOpen(false)}
                                                        className="h-8 px-8 text-[10px] active:scale-95"
                                                    >
                                                        Tutup
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-black/[0.05] pb-4 dark:border-white/[0.05]">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-black p-2 text-white shadow-xl shadow-black/10 dark:bg-white dark:text-black dark:shadow-white/5">
                                    <GitBranch size={16} />
                                </div>
                                <h3 className="text-[11px] leading-none font-black tracking-widest text-black uppercase dark:text-white">
                                    Tahapan Persetujuan
                                </h3>
                            </div>
                            <Button type="button" variant="outline" onClick={addLocalStep} className="h-10 px-6 shadow-sm active:scale-95">
                                <PlusCircle size={14} /> Tambah Tahap Baru
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {form.data.steps.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-black/20 bg-black/5 py-24 dark:border-white/20 dark:bg-white/5">
                                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-none border border-black/10 bg-white text-black/20 shadow-none dark:border-white/10 dark:bg-black dark:text-white/20">
                                        <PlusCircle size={32} />
                                    </div>
                                    <span className="text-[11px] font-black tracking-[0.4em] text-black/30 uppercase dark:text-white/30">
                                        Struktur Kosong
                                    </span>
                                    <Button
                                        type="button"
                                        variant="link"
                                        onClick={addLocalStep}
                                        className="mt-4 text-[10px] font-black text-black uppercase underline decoration-black/20 underline-offset-8 transition-all hover:decoration-black dark:text-white dark:decoration-white/20 dark:hover:decoration-white"
                                    >
                                        Definisikan Tahapan Persetujuan Awal
                                    </Button>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                    modifiers={[restrictToVerticalAxis]}
                                >
                                    <SortableContext items={form.data.steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="grid gap-4">
                                            {form.data.steps.map((step, idx) => (
                                                <SortableStepItem
                                                    key={step.id}
                                                    step={step}
                                                    idx={idx}
                                                    users={users}
                                                    roles={roles}
                                                    departments={departments}
                                                    contractStatuses={contractStatuses}
                                                    updateLocalStep={(i, data) => {
                                                        const newSteps = [...form.data.steps];
                                                        newSteps[i] = { ...newSteps[i], ...data };
                                                        form.setData('steps', newSteps);
                                                    }}
                                                    removeLocalStep={(i) =>
                                                        form.setData(
                                                            'steps',
                                                            form.data.steps.filter((_, index) => index !== i),
                                                        )
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}

                            {form.data.steps.length > 0 && (
                                <div className="flex items-center gap-4 py-8 opacity-20">
                                    <div className="h-px flex-1 bg-black" />
                                    <div className="flex rotate-[-1deg] items-center gap-2 border-2 border-black px-4 py-2">
                                        <span className="text-[10px] leading-none font-black tracking-[0.5em] uppercase">ALUR SELESAI</span>
                                    </div>
                                    <div className="h-px flex-1 bg-black" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="animate-in fade-in flex h-full flex-col bg-white duration-500 dark:bg-black">
            <DataTable
                title="Master Alur Kerja (Workflow)"
                columns={columns}
                data={workflows.data || []}
                searchKey="name"
                searchPlaceholder="Cari alur kerja atau tipe..."
                searchValue={filters.search || ''}
                onSearchChange={(v) =>
                    router.get(window.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                filters={[
                    {
                        label: 'Klasifikasi Kontrak',
                        key: 'contract_type',
                        options: contractTypes.map((t: any) => ({ label: t.name, value: t.name })),
                    },
                    {
                        label: 'Tipe Inisiator',
                        key: 'initiator_type',
                        options: [
                            { label: 'Publik (Semua)', value: 'all' },
                            { label: 'Role / Jabatan', value: 'role' },
                            { label: 'Personel Spesifik', value: 'user' },
                        ],
                    },
                ]}
                activeFilters={{
                    contract_type: filters.contract_type ? [filters.contract_type] : [],
                    initiator_type: filters.initiator_type ? [filters.initiator_type] : [],
                }}
                onFilterChange={(updatedFilters) => {
                    const newFilters: Record<string, any> = { ...filters, page: 1 };
                    Object.keys(updatedFilters).forEach((key) => {
                        newFilters[key] = updatedFilters[key].length > 0 ? updatedFilters[key][0] : null;
                    });
                    router.get(window.location.pathname, newFilters, { preserveState: true, replace: true });
                }}
                onRowClick={openEdit}
                headerActions={
                    <Button variant="primary" onClick={openCreate} className="h-10 px-8 shadow-xl active:scale-95">
                        <Plus size={14} /> Registrasi Alur Baru
                    </Button>
                }
                bulkActions={
                    canUpdate
                        ? [
                              {
                                  label: 'Hapus Terpilih',
                                  icon: Trash2,
                                  variant: 'destructive',
                                  onClick: (ids) => {
                                      if (confirm(`Hapus ${ids.length} alur kerja terpilih?`)) {
                                          router.post(
                                              '/admin/workflows/bulk-delete',
                                              { ids },
                                              {
                                                  onSuccess: () => showToast(`${ids.length} alur kerja telah dihapus`, 'success'),
                                              },
                                          );
                                      }
                                  },
                              },
                          ]
                        : undefined
                }
            />
        </div>
    );
}
