import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSelect } from '@/components/ui/forms/CompactSelect';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/overlays/Dialog';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Briefcase,
    CheckCircle2,
    Edit3,
    GitBranch,
    GripVertical,
    Info,
    LayoutTemplate,
    PlusCircle,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users as UsersIcon,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

// --- Sortable Step Item (Compact) ---
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

    const activeRoles = Array.isArray(step.role) ? step.role : step.role ? [step.role] : [];
    const activeDepts = Array.isArray(step.department_ids) ? step.department_ids : step.department_ids ? [step.department_ids] : [];
    const activeUsers = Array.isArray(step.user_ids) ? step.user_ids : [];

    const filteredDepartments = useMemo(() => {
        const base =
            activeRoles.length === 0
                ? departments
                : departments.filter((d) => users.some((u) => activeRoles.includes(u.role) && u.department_id === d.id));
        return deptSearchText ? base.filter((d) => d.name.toLowerCase().includes(deptSearchText.toLowerCase())) : base;
    }, [departments, activeRoles, users, deptSearchText]);

    const filteredRolesBySearch = useMemo(() => {
        return roleSearchText ? roles.filter((r) => r.name.toLowerCase().includes(roleSearchText.toLowerCase())) : roles;
    }, [roles, roleSearchText]);

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
                'group/step border-primary/10 dark:bg-card hover:bg-primary/[0.02] relative flex gap-3 rounded-xl border bg-white p-3 transition-all dark:hover:bg-white/[0.02]',
                isDragging && 'border-primary ring-primary/5 z-50 scale-[1.01] shadow-xl ring-2 dark:border-white',
                !isAnySelected && 'border-primary/20 border-dashed',
            )}
        >
            <div className="flex shrink-0 flex-col items-center gap-1.5">
                <div
                    {...attributes}
                    {...listeners}
                    className="border-primary/10 bg-primary/[0.03] hover:bg-primary flex h-7 w-7 cursor-grab items-center justify-center rounded-lg border transition-all group-hover/step:shadow-md hover:text-white dark:bg-white/[0.03]"
                >
                    <GripVertical size={12} className="opacity-30" />
                </div>
                <div className="flex flex-col items-center leading-none">
                    <span className="text-primary/20 text-[10px] font-semibold uppercase dark:text-white/20">STP</span>
                    <span className="text-[13px] font-bold">{idx + 1}</span>
                </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    {!isAnySelected ? (
                        <div className="flex items-center gap-2">
                            <span className="bg-primary/5 text-primary/40 rounded px-1.5 py-0.5 text-xs font-bold tracking-widest uppercase dark:bg-white/5 dark:text-white/40">
                                Akses Terbuka
                            </span>
                            <span className="text-primary/20 text-xs font-bold tracking-tighter uppercase italic dark:text-white/20">
                                Personel Terkait
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {activeRoles.length > 0 && (
                                <div className="bg-primary flex items-center gap-1.5 rounded-md px-2 py-0.5 text-white shadow-sm dark:bg-white dark:text-black">
                                    <Shield size={10} />
                                    <span className="text-xs font-bold tracking-tight uppercase">
                                        {activeRoles.length === 1 ? activeRoles[0] : `${activeRoles.length} ROLE`}
                                    </span>
                                </div>
                            )}
                            {activeDepts.length > 0 && (
                                <div className="border-primary/20 text-primary flex items-center gap-1.5 rounded-md border px-2 py-0.5 dark:border-white/20 dark:text-white">
                                    <GitBranch size={10} />
                                    <span className="text-xs font-bold tracking-tight uppercase">
                                        {activeDepts.length === 1
                                            ? departments.find((d) => d.id === activeDepts[0])?.name
                                            : `${activeDepts.length} DEPT`}
                                    </span>
                                </div>
                            )}
                            {activeUsers.length > 0 && (
                                <div className="bg-primary/[0.05] border-primary/10 text-primary flex items-center gap-1.5 rounded-md border px-2 py-0.5 dark:bg-white/[0.05] dark:text-white">
                                    <UserCheck size={10} />
                                    <span className="text-xs font-bold tracking-tight uppercase">
                                        {activeUsers.length === 1
                                            ? users.find((u) => u.id === activeUsers[0])?.name
                                            : `${activeUsers.length} PERSONEL`}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        {step.status_id && (
                            <div className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
                                <LayoutTemplate size={10} /> {contractStatuses.find((s) => s.id === step.status_id)?.label || 'STATUS'}
                            </div>
                        )}
                        {step.description && (
                            <span className="text-primary/30 max-w-[200px] truncate text-xs font-bold tracking-tight uppercase italic dark:text-white/40">
                                {step.description}
                            </span>
                        )}
                    </div>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-primary/10 hover:bg-primary h-7 gap-1.5 rounded-lg px-3 text-xs font-bold tracking-widest uppercase transition-all hover:text-white active:scale-95"
                            >
                                <Edit3 size={12} /> Atur
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="border-primary/10 max-w-5xl overflow-hidden rounded-[2rem] border bg-white p-0 shadow-2xl dark:bg-black">
                            <DialogHeader className="bg-primary p-6 text-white dark:bg-white dark:text-black">
                                <div className="flex items-center gap-3">
                                    <GitBranch size={20} />
                                    <div>
                                        <DialogTitle className="mb-0.5 text-lg font-bold tracking-tight uppercase">
                                            Konfigurasi Tahap {idx + 1}
                                        </DialogTitle>
                                        <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase dark:text-black/50">
                                            Tentukan personel penyetuju melalui hirarki
                                        </p>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="border-primary/5 bg-primary/[0.01] grid grid-cols-2 gap-4 border-b p-6">
                                <CompactInput
                                    label="Judul Tahapan"
                                    value={step.description || ''}
                                    onChange={(e) => updateLocalStep(idx, { description: e.target.value })}
                                    icon={Info}
                                />
                                <CompactSelect
                                    label="Target Status"
                                    value={step.status_id || 'none'}
                                    onChange={(v) => updateLocalStep(idx, { status_id: v === 'none' ? null : v })}
                                    options={[
                                        { label: '-- TETAP --', value: 'none' },
                                        ...contractStatuses.map((s: any) => ({ label: s.label, value: s.id })),
                                    ]}
                                    icon={LayoutTemplate}
                                />
                            </div>

                            <div className="grid min-h-[400px] grid-cols-3 gap-6 p-6">
                                {[
                                    {
                                        label: 'Filter Role',
                                        icon: Shield,
                                        active: activeRoles,
                                        search: roleSearchText,
                                        setSearch: setRoleSearchText,
                                        data: filteredRolesBySearch,
                                        onSelect: (r: any) =>
                                            updateLocalStep(idx, {
                                                role: activeRoles.includes(r.name)
                                                    ? activeRoles.filter((n: string) => n !== r.name)
                                                    : [...activeRoles, r.name],
                                            }),
                                        display: (r: any) => r.name,
                                    },
                                    {
                                        label: 'Filter Dept',
                                        icon: GitBranch,
                                        active: activeDepts,
                                        search: deptSearchText,
                                        setSearch: setDeptSearchText,
                                        data: filteredDepartments,
                                        onSelect: (d: any) =>
                                            updateLocalStep(idx, {
                                                department_ids: activeDepts.includes(d.id)
                                                    ? activeDepts.filter((id: string) => id !== d.id)
                                                    : [...activeDepts, d.id],
                                            }),
                                        display: (d: any) => d.name,
                                    },
                                    {
                                        label: 'Target Personel',
                                        icon: UsersIcon,
                                        active: activeUsers,
                                        search: userSearchText,
                                        setSearch: setUserSearchText,
                                        data: filteredUsersByHierarchy,
                                        onSelect: (u: any) =>
                                            updateLocalStep(idx, {
                                                user_ids: activeUsers.includes(u.id)
                                                    ? activeUsers.filter((id: string) => id !== u.id)
                                                    : [...activeUsers, u.id],
                                            }),
                                        display: (u: any) => u.name,
                                        sub: (u: any) => u.role,
                                    },
                                ].map((col, cIdx) => (
                                    <div key={col.label} className={cn('space-y-3', cIdx === 1 && 'border-primary/5 border-x px-6')}>
                                        <div className="border-primary/5 flex items-center justify-between border-b pb-2">
                                            <div className="flex items-center gap-2">
                                                <col.icon size={12} className="text-primary/40" />
                                                <span className="text-primary/60 text-xs font-bold tracking-widest uppercase">{col.label}</span>
                                            </div>
                                            {col.active.length > 0 && (
                                                <div className="bg-primary flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
                                                    {col.active.length}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Search className="text-primary/20 absolute top-1/2 left-2.5 -translate-y-1/2" size={12} />
                                            <input
                                                placeholder="CARI..."
                                                value={col.search}
                                                onChange={(e) => col.setSearch(e.target.value)}
                                                className="border-primary/10 bg-primary/[0.01] focus:ring-primary/20 h-8 w-full rounded-lg border pr-3 pl-8 text-xs font-bold uppercase transition-all outline-none focus:ring-1"
                                            />
                                        </div>
                                        <div className="custom-scrollbar max-h-[250px] space-y-0.5 overflow-y-auto pr-1">
                                            {col.data.map((item: any) => {
                                                const id = item.id || item.name;
                                                const isActive = col.active.includes(id);
                                                return (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        onClick={() => col.onSelect(item)}
                                                        className={cn(
                                                            'flex w-full items-center justify-between rounded-lg border p-2 text-left transition-all',
                                                            isActive
                                                                ? 'bg-primary border-primary text-white shadow-md'
                                                                : 'hover:bg-primary/[0.03] border-transparent',
                                                        )}
                                                    >
                                                        <div className="flex min-w-0 flex-col">
                                                            <span className="truncate text-xs font-bold uppercase">{col.display(item)}</span>
                                                            {col.sub && (
                                                                <span
                                                                    className={cn(
                                                                        'text-[10px] font-bold uppercase opacity-50',
                                                                        isActive ? 'text-white/60' : 'text-primary/40',
                                                                    )}
                                                                >
                                                                    {col.sub(item)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isActive && <CheckCircle2 size={10} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <DialogFooter className="bg-primary/[0.02] border-primary/5 border-t p-4">
                                <Button
                                    type="button"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="h-9 rounded-xl px-8 text-xs font-bold tracking-widest uppercase shadow-lg"
                                >
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLocalStep(idx)}
                        className="h-7 w-7 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white dark:hover:text-white transition-all active:scale-95"
                    >
                        <Trash2 size={12} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- Main Workflow Editor Page ---
export default function WorkflowEditor({ auth, workflow, contractTypes, departments, roles, users, contractStatuses }: any) {
    const { showToast } = useToast();
    const [isInitiatorDialogOpen, setIsInitiatorDialogOpen] = useState(false);
    const [initiatorUserSearch, setInitiatorUserSearch] = useState('');
    const [initiatorRoleSearch, setInitiatorRoleSearch] = useState('');
    const [initiatorDeptSearch, setInitiatorDeptSearch] = useState('');

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const form = useForm({
        name: workflow?.name || '',
        contract_type: workflow?.contract_type || '',
        description: workflow?.description || '',
        is_default: !!workflow?.is_default,
        initiator_type: workflow?.initiator_type || 'all',
        initiator_roles: workflow?.initiator_roles || [],
        initiator_users: workflow?.initiator_users || [],
        initiator_departments: workflow?.initiator_departments || [],
        steps: workflow?.steps || [],
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIdx = form.data.steps.findIndex((i: any) => i.id === active.id);
            const newIdx = form.data.steps.findIndex((i: any) => i.id === over.id);
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

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            onSuccess: () => showToast('Konfigurasi alur berhasil disimpan', 'success'),
            onError: (err: any) => showToast(err.error || 'Gagal menyimpan alur', 'danger'),
        };

        if (workflow) form.put(route('admin.workflows.update', workflow.id), options);
        else form.post(route('admin.workflows.store'), options);
    };

    return (
        <>
            <Head title={workflow ? 'Edit Workflow' : 'Registrasi Workflow Baru'} />

            <div className="flex h-full flex-col bg-white dark:bg-black">
                <ManagementForm
                    title={workflow ? 'Parameter Alur' : 'Registrasi Alur'}
                    subtitle={workflow ? `Konfigurasi tahapan untuk ${form.data.name}` : 'Mendefinisikan alur approval baru'}
                    onClose={() => router.visit(route('admin.workflows'))}
                    onSave={handleSubmit}
                    processing={form.processing}
                    isDirty={form.isDirty}
                    isEdit={!!workflow}
                >
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* LEFT COLUMN: Metadata & Initiator */}
                        <div className="space-y-6 lg:col-span-4">
                            <FormSection title="Arsitektur Alur" subtitle="Identitas & Target">
                                <div className="space-y-4">
                                    <CompactInput
                                        label="Nama Alur"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="CONTOH: PENGADAAN JASA"
                                        icon={Briefcase}
                                    />
                                    <CompactSelect
                                        label="Klasifikasi"
                                        value={form.data.contract_type || 'all'}
                                        onChange={(v) => form.setData('contract_type', v === 'all' ? '' : String(v))}
                                        options={[
                                            { label: 'GLOBAL', value: 'all' },
                                            ...contractTypes.map((t: any) => ({ label: t.name, value: t.name })),
                                        ]}
                                        icon={LayoutTemplate}
                                    />
                                    <div
                                        onClick={() => form.setData('is_default', !form.data.is_default)}
                                        className="bg-primary/[0.02] border-primary/5 group hover:bg-primary/[0.04] flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all"
                                    >
                                        <Checkbox checked={form.data.is_default} onCheckedChange={() => {}} className="h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span className="text-primary text-xs font-bold uppercase dark:text-white">Default</span>
                                            <span className="text-primary/30 text-[10px] font-bold uppercase dark:text-white/30">
                                                Prioritas Sistem
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection title="Inisiator" subtitle="Otoritas Akses">
                                {(() => {
                                    const activeRoles = form.data.initiator_roles || [];
                                    const activeDepts = form.data.initiator_departments || [];
                                    const activeUsers = form.data.initiator_users || [];
                                    const isAnySelected = activeRoles.length > 0 || activeDepts.length > 0 || activeUsers.length > 0;
                                    const filteredDepts =
                                        activeRoles.length === 0
                                            ? departments
                                            : departments.filter((d: any) =>
                                                  users.some((u: any) => activeRoles.includes(u.role) && u.department_id === d.id),
                                              );
                                    const filteredUsers = users.filter(
                                        (u: any) =>
                                            (activeRoles.length === 0 || activeRoles.includes(u.role)) &&
                                            (activeDepts.length === 0 || activeDepts.includes(u.department_id)) &&
                                            (!initiatorUserSearch || u.name.toLowerCase().includes(initiatorUserSearch.toLowerCase())),
                                    );

                                    return (
                                        <div
                                            className={cn(
                                                'bg-primary/[0.01] rounded-xl border border-dashed p-4 transition-all',
                                                isAnySelected ? 'border-primary/20' : 'border-primary/10',
                                            )}
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <span className="text-primary/60 text-xs font-bold uppercase dark:text-white/60">Akses Inisiasi</span>
                                                <Dialog open={isInitiatorDialogOpen} onOpenChange={setIsInitiatorDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="h-7 rounded-lg px-3 text-[11px] font-bold uppercase transition-all"
                                                        >
                                                            <Edit3 size={10} className="mr-1.5" /> Atur
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-5xl overflow-hidden rounded-[2rem] bg-white p-0 shadow-2xl dark:bg-black">
                                                        <DialogHeader className="bg-primary p-6 text-white">
                                                            <div className="flex items-center gap-3">
                                                                <UsersIcon size={20} />
                                                                <DialogTitle className="text-lg font-bold uppercase">Otoritas Inisiator</DialogTitle>
                                                            </div>
                                                        </DialogHeader>
                                                        <div className="grid min-h-[400px] grid-cols-3 gap-6 p-6">
                                                            {[
                                                                {
                                                                    label: 'Role',
                                                                    active: activeRoles,
                                                                    search: initiatorRoleSearch,
                                                                    setSearch: setInitiatorRoleSearch,
                                                                    data: roles,
                                                                    onSelect: (r: any) =>
                                                                        form.setData(
                                                                            'initiator_roles',
                                                                            activeRoles.includes(r.name)
                                                                                ? activeRoles.filter((n: any) => n !== r.name)
                                                                                : [...activeRoles, r.name],
                                                                        ),
                                                                    display: (r: any) => r.name,
                                                                },
                                                                {
                                                                    label: 'Dept',
                                                                    active: activeDepts,
                                                                    search: initiatorDeptSearch,
                                                                    setSearch: setInitiatorDeptSearch,
                                                                    data: filteredDepts,
                                                                    onSelect: (d: any) =>
                                                                        form.setData(
                                                                            'initiator_departments',
                                                                            activeDepts.includes(d.id)
                                                                                ? activeDepts.filter((id: any) => id !== d.id)
                                                                                : [...activeDepts, d.id],
                                                                        ),
                                                                    display: (d: any) => d.name,
                                                                },
                                                                {
                                                                    label: 'User',
                                                                    active: activeUsers,
                                                                    search: initiatorUserSearch,
                                                                    setSearch: setInitiatorUserSearch,
                                                                    data: filteredUsers,
                                                                    onSelect: (u: any) =>
                                                                        form.setData(
                                                                            'initiator_users',
                                                                            activeUsers.includes(u.id)
                                                                                ? activeUsers.filter((id: any) => id !== u.id)
                                                                                : [...activeUsers, u.id],
                                                                        ),
                                                                    display: (u: any) => u.name,
                                                                },
                                                            ].map((col, idx) => (
                                                                <div
                                                                    key={col.label}
                                                                    className={cn('space-y-3', idx === 1 && 'border-primary/5 border-x px-6')}
                                                                >
                                                                    <span className="text-primary/40 border-primary/5 flex justify-between border-b pb-2 text-[10px] font-bold uppercase">
                                                                        {col.label}{' '}
                                                                        {col.active.length > 0 && (
                                                                            <span className="text-primary">{col.active.length}</span>
                                                                        )}
                                                                    </span>
                                                                    <div className="relative">
                                                                        <Search
                                                                            className="text-primary/20 absolute top-1/2 left-2 -translate-y-1/2"
                                                                            size={12}
                                                                        />
                                                                        <input
                                                                            placeholder="CARI..."
                                                                            value={col.search}
                                                                            onChange={(e) => col.setSearch(e.target.value)}
                                                                            className="border-primary/10 bg-primary/[0.01] h-8 w-full rounded-lg border pr-3 pl-8 text-[9px] font-bold uppercase outline-none"
                                                                        />
                                                                    </div>
                                                                    <div className="custom-scrollbar max-h-[250px] space-y-0.5 overflow-y-auto pr-1">
                                                                        {col.data
                                                                            .filter(
                                                                                (d: any) =>
                                                                                    !col.search ||
                                                                                    col.display(d).toLowerCase().includes(col.search.toLowerCase()),
                                                                            )
                                                                            .map((item: any) => (
                                                                                <button
                                                                                    key={item.id || item.name}
                                                                                    type="button"
                                                                                    onClick={() => col.onSelect(item)}
                                                                                    className={cn(
                                                                                        'flex w-full items-center justify-between rounded-lg p-2 text-[9px] font-bold uppercase transition-all',
                                                                                        col.active.includes(item.id || item.name)
                                                                                            ? 'bg-primary text-white'
                                                                                            : 'hover:bg-primary/5',
                                                                                    )}
                                                                                >
                                                                                    <span>{col.display(item)}</span>
                                                                                    {col.active.includes(item.id || item.name) && (
                                                                                        <CheckCircle2 size={10} />
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <DialogFooter className="bg-primary/[0.02] border-primary/5 border-t p-4">
                                                            <Button
                                                                type="button"
                                                                onClick={() => setIsInitiatorDialogOpen(false)}
                                                                className="h-9 rounded-xl px-8 text-[10px] font-bold"
                                                            >
                                                                Selesai
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {!isAnySelected ? (
                                                    <span className="text-primary/30 text-xs font-bold uppercase italic dark:text-white/30">
                                                        Akses Publik (Semua Personel)
                                                    </span>
                                                ) : (
                                                    <>
                                                        {activeRoles.map((r: any) => (
                                                            <div
                                                                key={r}
                                                                className="bg-primary rounded-md px-2 py-0.5 text-[10px] font-bold text-white uppercase"
                                                            >
                                                                {r}
                                                            </div>
                                                        ))}
                                                        {activeDepts.map((id: any) => (
                                                            <div
                                                                key={id}
                                                                className="border-primary text-primary rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase"
                                                            >
                                                                {departments.find((d: any) => d.id === id)?.name}
                                                            </div>
                                                        ))}
                                                        {activeUsers.map((id: any) => (
                                                            <div
                                                                key={id}
                                                                className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                                                            >
                                                                {users.find((u: any) => u.id === id)?.name}
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </FormSection>
                        </div>

                        {/* RIGHT COLUMN: Approval Steps */}
                        <div className="space-y-6 lg:col-span-8">
                            <FormSection 
                                title="Struktur Tahapan" 
                                subtitle="Hirarki Approval Berjenjang"
                                headerAction={
                                    <Button type="button" onClick={addLocalStep} className="group h-8 rounded-lg px-4 text-xs font-bold shadow-md">
                                        <PlusCircle size={12} className="mr-1.5 transition-transform group-hover:rotate-90" /> Tambah Tahap
                                    </Button>
                                }
                            >
                                {form.data.steps.length === 0 ? (
                                    <div className="border-primary/5 bg-primary/[0.01] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-20 text-center dark:border-white/5 dark:bg-white/[0.01]">
                                        <PlusCircle size={32} className="text-primary/10 mb-4 dark:text-white/10" />
                                        <span className="text-primary/20 mb-4 text-xs font-bold tracking-widest uppercase dark:text-white/20">
                                            Alur Belum Terdefinisi
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addLocalStep}
                                            className="h-8 rounded-lg px-6 text-xs font-bold uppercase"
                                        >
                                            Mulai Membangun
                                        </Button>
                                    </div>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                        modifiers={[restrictToVerticalAxis]}
                                    >
                                        <SortableContext items={form.data.steps.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                                            <div className="relative grid gap-3">
                                                <div className="bg-dashed border-primary/10 absolute top-6 bottom-6 left-[17px] z-0 w-px border-l border-dashed" />
                                                {form.data.steps.map((step: any, idx: number) => (
                                                    <SortableStepItem
                                                        key={step.id}
                                                        step={step}
                                                        idx={idx}
                                                        users={users}
                                                        roles={roles}
                                                        departments={departments}
                                                        contractStatuses={contractStatuses}
                                                        updateLocalStep={(i, data) => {
                                                            const s = [...form.data.steps];
                                                            s[i] = { ...s[i], ...data };
                                                            form.setData('steps', s);
                                                        }}
                                                        removeLocalStep={(i: number) =>
                                                            form.setData(
                                                                'steps',
                                                                form.data.steps.filter((_: any, index: number) => index !== i),
                                                            )
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}

                                {form.data.steps.length > 0 && (
                                    <div className="flex items-center gap-4 py-6">
                                        <div className="via-primary/5 to-primary/5 h-px flex-1 bg-gradient-to-r from-transparent" />
                                        <div className="border-primary/10 bg-primary/[0.01] text-primary/30 flex items-center gap-2 rounded-xl border px-4 py-2 text-[8px] font-bold tracking-[0.3em] uppercase dark:border-white/10 dark:bg-white/[0.01] dark:text-white/30">
                                            <CheckCircle2 size={12} /> FINISH
                                        </div>
                                        <div className="via-primary/5 to-primary/5 h-px flex-1 bg-gradient-to-l from-transparent" />
                                    </div>
                                )}
                            </FormSection>
                        </div>
                    </div>
                </ManagementForm>
            </div>
        </>
    );
}
