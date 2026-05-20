import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { WorkflowVisualizer } from '@/components/admin/WorkflowVisualizer';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronUp,
    Edit3,
    ExternalLink,
    GitBranch,
    Info,
    LayoutTemplate,
    PlusCircle,
    Search,
    Settings2,
    Shield,
    Users as UsersIcon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import OrgScopeSelector from './components/OrgScopeSelector';
import SortableStepItem from './components/SortableStepItem';

// --- Sortable Step Item (Compact) ---

// --- Main Workflow Editor Page ---
export default function WorkflowEditor({
    auth,
    workflow,
    contractTypes,
    departments,
    roles,
    users,
    contractStatuses,
    companyGroups = [],
    regions = [],
    companies = [],
}: any) {
    const { showToast } = useToast();
    const [isOrgExpanded, setIsOrgExpanded] = useState(false);
    const [isInitiatorExpanded, setIsInitiatorExpanded] = useState(false);

    const [initiatorUserSearch, setInitiatorUserSearch] = useState('');
    const [initiatorRoleSearch, setInitiatorRoleSearch] = useState('');
    const [initiatorDeptSearch, setInitiatorDeptSearch] = useState('');

    const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'list' | 'visual'>('list');

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
        approver_roles: workflow?.approver_roles || [],
        approver_departments: workflow?.approver_departments || [],
        approver_users: workflow?.approver_users || [],
        legal_roles: workflow?.legal_roles || [],
        legal_departments: workflow?.legal_departments || [],
        legal_users: workflow?.legal_users || [],
        steps: workflow?.steps || [],
        department_id: workflow?.department_id || null,
        company_group_ids: workflow?.company_group_ids || [],
        region_ids: workflow?.region_ids || [],
        company_ids: workflow?.company_ids || [],
    });

    useEffect(() => {
        const hasRoles = form.data.initiator_roles.length > 0 || form.data.initiator_departments.length > 0;
        const hasUsers = form.data.initiator_users.length > 0;

        let type = 'all';
        if (hasUsers) type = 'user';
        else if (hasRoles) type = 'role';

        if (form.data.initiator_type !== type) {
            form.setData('initiator_type', type);
        }
    }, [form.data.initiator_roles, form.data.initiator_departments, form.data.initiator_users]);

    const handleOpenVisualizer = () => {
        // Save current steps and master data to localStorage for the new tab to pick up
        localStorage.setItem('workflow_preview_steps', JSON.stringify(form.data.steps));
        localStorage.setItem('workflow_master_groups', JSON.stringify(companyGroups));
        localStorage.setItem('workflow_master_regions', JSON.stringify(regions));
        localStorage.setItem('workflow_master_companies', JSON.stringify(companies));
        window.open(route('admin.workflows.visualize'), '_blank');
    };

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
                label: '',
                actor_type: 'approver',
                allowed_actions: ['approve', 'reject'],
                condition_expression: null,
                status_id: null,
                role: [],
                department_ids: [],
                user_ids: [],
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
                    headerActions={
                        <Button
                            type="button"
                            onClick={addLocalStep}
                            variant="ghost"
                            className="border-primary/20 hover:bg-primary/5 h-9 rounded-xl border px-4 text-xs font-bold transition-all active:scale-95"
                        >
                            <PlusCircle size={14} className="mr-1.5" /> Tambah Tahap
                        </Button>
                    }
                >
                    <div className="space-y-8">
                        <FormSection>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    <div className="lg:col-span-8">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                                <Edit3 size={10} /> Nama Alur Kerja
                                            </label>
                                            <input
                                                type="text"
                                                value={form.data.name}
                                                onChange={(e) => form.setData('name', e.target.value)}
                                                className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 text-xs font-bold transition-all focus:border-slate-900 focus:bg-white focus:ring-0 dark:border-slate-800 dark:bg-slate-900/50 dark:focus:border-white dark:focus:bg-slate-900"
                                                placeholder="Contoh: ALUR PERSETUJUAN KONTRAK LOGISTIK"
                                            />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-4">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                                <LayoutTemplate size={10} /> Jenis Kontrak
                                            </label>
                                            <Select
                                                value={form.data.contract_type || 'all'}
                                                onValueChange={(v) => form.setData('contract_type', v === 'all' ? '' : String(v))}
                                            >
                                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-black tracking-tight uppercase transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-900/50 dark:focus:border-white">
                                                    <SelectValue placeholder="SEMUA JENIS" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                    <SelectItem value="all" className="py-2.5 text-[10px] font-black uppercase">
                                                        SEMUA JENIS
                                                    </SelectItem>
                                                    {contractTypes.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.name} className="py-2.5 text-[10px] font-black uppercase">
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* --- Configuration Grid (Org Scope & Authority) --- */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    {/* Column 1: Ruang Lingkup Organisasi */}
                                    <OrgScopeSelector
                                        form={form}
                                        companyGroups={companyGroups}
                                        regions={regions}
                                        companies={companies}
                                        isOrgExpanded={isOrgExpanded}
                                        setIsOrgExpanded={setIsOrgExpanded}
                                    />

                                    {/* Column 2: Otoritas Akses (Initiator) */}
                                    <div className={cn('transition-all duration-300', isInitiatorExpanded ? 'lg:col-span-2' : 'lg:col-span-1')}>
                                        <div
                                            className={cn(
                                                'flex h-full flex-col rounded-2xl border bg-slate-50 p-5 transition-all dark:bg-slate-900/50',
                                                form.data.initiator_roles.length > 0 ||
                                                    form.data.initiator_departments.length > 0 ||
                                                    form.data.initiator_users.length > 0
                                                    ? 'border-slate-200 dark:border-slate-800'
                                                    : 'border-dashed border-slate-200 dark:border-slate-800',
                                            )}
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl">
                                                        <Shield size={16} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase dark:text-white">
                                                        Otoritas Inisiator
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsInitiatorExpanded(!isInitiatorExpanded)}
                                                    className={cn(
                                                        'h-8 gap-2 rounded-lg px-4 text-[10px] font-bold tracking-tight uppercase transition-all',
                                                        isInitiatorExpanded
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400',
                                                    )}
                                                >
                                                    {isInitiatorExpanded ? <ChevronUp size={12} /> : <Settings2 size={12} />}
                                                    {isInitiatorExpanded ? 'TUTUP' : 'ATUR'}
                                                </Button>
                                            </div>
                                            {/* ... Initiator Summary and Content ... */}
                                            {!isInitiatorExpanded && (
                                                <div className="flex flex-wrap gap-2">
                                                    {form.data.initiator_roles.length === 0 &&
                                                    form.data.initiator_departments.length === 0 &&
                                                    form.data.initiator_users.length === 0 ? (
                                                        <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-400 italic">
                                                            <Info size={12} /> Seluruh Personel (Global)
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {form.data.initiator_roles.map((roleId: string) => (
                                                                <div
                                                                    key={roleId}
                                                                    className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700"
                                                                >
                                                                    <span className="text-[9px] opacity-50">ROLE:</span> {roleId}
                                                                </div>
                                                            ))}
                                                            {form.data.initiator_departments.map((deptId: string) => {
                                                                const dept = departments.find((d: any) => String(d.id) === String(deptId));
                                                                return (
                                                                    <div
                                                                        key={deptId}
                                                                        className="flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700"
                                                                    >
                                                                        <span className="text-[9px] opacity-50">UNIT:</span> {dept?.name || deptId}
                                                                    </div>
                                                                );
                                                            })}
                                                            {form.data.initiator_users.map((userId: string) => {
                                                                const user = users.find((u: any) => String(u.id) === String(userId));
                                                                return (
                                                                    <div
                                                                        key={userId}
                                                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700"
                                                                    >
                                                                        <span className="text-[9px] opacity-50">USER:</span> {user?.name || userId}
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {isInitiatorExpanded && (
                                                <div className="mt-6 flex-1 border-t border-slate-200 pt-6 dark:border-slate-800">
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                        {/* Role Column */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Shield size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">ROLE POOL</span>
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData('initiator_roles', [])}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.initiator_roles || form.data.initiator_roles.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA ROLE</span>
                                                                    {(!form.data.initiator_roles || form.data.initiator_roles.length === 0) && (
                                                                        <CheckCircle2 size={10} />
                                                                    )}
                                                                </button>
                                                                {roles
                                                                    .filter(
                                                                        (r: any) =>
                                                                            !initiatorRoleSearch ||
                                                                            r.name.toLowerCase().includes(initiatorRoleSearch.toLowerCase()),
                                                                    )
                                                                    .map((role: any) => {
                                                                        const isSelected = form.data.initiator_roles.includes(role.name);
                                                                        return (
                                                                            <button
                                                                                key={role.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newRoles = isSelected
                                                                                        ? form.data.initiator_roles.filter(
                                                                                              (r: string) => r !== role.name,
                                                                                          )
                                                                                        : [...form.data.initiator_roles, role.name];
                                                                                    form.setData('initiator_roles', newRoles);
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
                                                                                )}
                                                                            >
                                                                                <span className="text-[10px] font-bold uppercase">{role.name}</span>
                                                                                {isSelected && <CheckCircle2 size={10} />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                        {/* Unit Column */}
                                                        <div className="space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <UsersIcon size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">UNIT POOL</span>
                                                            </div>
                                                            <div className="group/search relative">
                                                                <Search
                                                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300"
                                                                    size={13}
                                                                />
                                                                <input
                                                                    placeholder="CARI UNIT..."
                                                                    value={initiatorDeptSearch}
                                                                    onChange={(e) => setInitiatorDeptSearch(e.target.value)}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData('initiator_departments', [])}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.initiator_departments ||
                                                                            form.data.initiator_departments.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA UNIT</span>
                                                                    {(!form.data.initiator_departments ||
                                                                        form.data.initiator_departments.length === 0) && <CheckCircle2 size={10} />}
                                                                </button>
                                                                {departments
                                                                    .filter(
                                                                        (d: any) =>
                                                                            !initiatorDeptSearch ||
                                                                            d.name.toLowerCase().includes(initiatorDeptSearch.toLowerCase()),
                                                                    )
                                                                    .map((dept: any) => {
                                                                        const isSelected = form.data.initiator_departments.includes(String(dept.id));
                                                                        return (
                                                                            <button
                                                                                key={dept.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const next = isSelected
                                                                                        ? form.data.initiator_departments.filter(
                                                                                              (id: string) => id !== String(dept.id),
                                                                                          )
                                                                                        : [...form.data.initiator_departments, String(dept.id)];
                                                                                    form.setData('initiator_departments', next);
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
                                                                                )}
                                                                            >
                                                                                <span className="text-[10px] font-bold uppercase">{dept.name}</span>
                                                                                {isSelected && <CheckCircle2 size={10} />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                        {/* User Column */}
                                                        <div className="space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <UsersIcon size={12} className="text-slate-400" />
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">USER POOL</span>
                                                            </div>
                                                            <div className="group/search relative">
                                                                <Search
                                                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-300"
                                                                    size={13}
                                                                />
                                                                <input
                                                                    placeholder="CARI USER..."
                                                                    value={initiatorUserSearch}
                                                                    onChange={(e) => setInitiatorUserSearch(e.target.value)}
                                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[10px] font-bold uppercase outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-black/50"
                                                                />
                                                            </div>
                                                            <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => form.setData('initiator_users', [])}
                                                                    className={cn(
                                                                        'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                        !form.data.initiator_users || form.data.initiator_users.length === 0
                                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                                            : 'border-transparent text-slate-400 italic hover:bg-slate-100',
                                                                    )}
                                                                >
                                                                    <span className="text-[10px] font-bold uppercase">SEMUA USER</span>
                                                                    {(!form.data.initiator_users || form.data.initiator_users.length === 0) && (
                                                                        <CheckCircle2 size={10} />
                                                                    )}
                                                                </button>
                                                                {users
                                                                    .filter(
                                                                        (u: any) =>
                                                                            !initiatorUserSearch ||
                                                                            u.name.toLowerCase().includes(initiatorUserSearch.toLowerCase()),
                                                                    )
                                                                    .map((user: any) => {
                                                                        const isSelected = form.data.initiator_users.includes(String(user.id));
                                                                        return (
                                                                            <button
                                                                                key={user.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const next = isSelected
                                                                                        ? form.data.initiator_users.filter(
                                                                                              (id: string) => id !== String(user.id),
                                                                                          )
                                                                                        : [...form.data.initiator_users, String(user.id)];
                                                                                    form.setData('initiator_users', next);
                                                                                }}
                                                                                className={cn(
                                                                                    'flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all',
                                                                                    isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
                                                                                )}
                                                                            >
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[10px] font-bold uppercase">
                                                                                        {user.name}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-medium tracking-tight text-slate-400 uppercase">
                                                                                        {user.role}
                                                                                    </span>
                                                                                </div>
                                                                                {isSelected && <CheckCircle2 size={10} />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FormSection>

                        {/* --- Workflow Steps & Visualization Section --- */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl">
                                        <GitBranch size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-slate-900 uppercase dark:text-white">Tahapan Alur Kerja</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Konfigurasi Urutan Approval & Penugasan</p>
                                    </div>
                                </div>
                                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('list')}
                                        className={cn(
                                            'rounded-md px-4 py-1.5 text-[9px] font-bold uppercase transition-all',
                                            activeTab === 'list'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                                : 'text-slate-400',
                                        )}
                                    >
                                        Daftar Langkah
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('visual')}
                                        className={cn(
                                            'rounded-md px-4 py-1.5 text-[9px] font-bold uppercase transition-all',
                                            activeTab === 'visual'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                                : 'text-slate-400',
                                        )}
                                    >
                                        Visualisasi
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'visual' ? (
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                                    <WorkflowVisualizer
                                        steps={form.data.steps}
                                        companyGroups={companyGroups}
                                        regions={regions}
                                        companies={companies}
                                        className="h-[600px]"
                                    />
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleOpenVisualizer}
                                            className="h-8 rounded-lg px-4 text-[10px] font-black tracking-wider uppercase"
                                        >
                                            <ExternalLink size={12} className="mr-2" />
                                            Buka di Tab Baru
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {form.data.steps.length === 0 ? (
                                        <div className="border-primary/5 bg-primary/[0.01] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-24 text-center dark:border-white/5 dark:bg-white/[0.01]">
                                            <div className="bg-primary/5 mb-4 rounded-2xl p-4">
                                                <PlusCircle size={32} className="text-primary/20" />
                                            </div>
                                            <span className="text-primary/30 text-xs font-black tracking-[0.2em] uppercase">
                                                Belum Ada Tahapan Terdefinisi
                                            </span>
                                            <p className="mt-2 text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                                                Klik tombol "Tambah Tahap" di header untuk memulai
                                            </p>
                                        </div>
                                    ) : (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                            modifiers={[restrictToVerticalAxis]}
                                        >
                                            <SortableContext items={form.data.steps.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                                                <div className="relative grid gap-4">
                                                    <div className="absolute top-12 bottom-12 left-[19.5px] z-0 w-px bg-slate-100 dark:bg-slate-800" />
                                                    {form.data.steps.map((step: any, idx: number) => (
                                                        <SortableStepItem
                                                            key={step.id}
                                                            roles={roles}
                                                            departments={departments}
                                                            users={users}
                                                            step={step}
                                                            idx={idx}
                                                            totalSteps={form.data.steps.length}
                                                            contractStatuses={contractStatuses}
                                                            duplicateLocalStep={(i: number) => {
                                                                const newStep = { ...form.data.steps[i], id: `new-${Date.now()}` };
                                                                const s = [...form.data.steps];
                                                                s.splice(i + 1, 0, newStep);
                                                                form.setData('steps', s);
                                                            }}
                                                            moveLocalStep={(i: number, direction: 'up' | 'down') => {
                                                                if (direction === 'up' && i > 0) {
                                                                    form.setData('steps', arrayMove(form.data.steps, i, i - 1));
                                                                } else if (direction === 'down' && i < form.data.steps.length - 1) {
                                                                    form.setData('steps', arrayMove(form.data.steps, i, i + 1));
                                                                }
                                                            }}
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
                                                            isExpanded={expandedStepId === step.id}
                                                            setIsExpanded={(expanded) => setExpandedStepId(expanded ? step.id : null)}
                                                        />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    )}
                                </div>
                            )}
                        </div>

                        {form.data.steps.length > 0 && (
                            <div className="flex items-center gap-4 py-8">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-[9px] font-black tracking-[0.3em] text-slate-400 uppercase dark:border-white/5 dark:bg-white/[0.02]">
                                    <CheckCircle2 size={12} className="opacity-50" /> AKHIR ALUR KERJA
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                            </div>
                        )}
                    </div>
                </ManagementForm>
            </div>
        </>
    );
}
