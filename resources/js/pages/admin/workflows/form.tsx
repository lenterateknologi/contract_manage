import { FormSection, ManagementForm } from '@/components/admin/ManagementForm';
import { WorkflowVisualizer } from '@/components/admin/WorkflowVisualizer';
import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Checkbox } from '@/components/ui/base/Checkbox';
import { SearchableMultiSelect } from '@/components/ui/forms/SearchableMultiSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Edit3, ExternalLink, GitBranch, LayoutTemplate, PlusCircle, Shield, Users as UsersIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import OrgScopeSelector from './components/OrgScopeSelector';
import SortableStepItem from './components/SortableStepItem';
import { MASTER_ACTIONS } from './constants';

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
    allWorkflows = [],
    formTemplates = [],
}: any) {
    const { showToast } = useToast();
    const [isOrgExpanded, setIsOrgExpanded] = useState(false);

    const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
    const [mainTab, setMainTab] = useState<'settings' | 'steps'>('settings');
    const [activeTab, setActiveTab] = useState<'list' | 'visual'>('list');

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const form = useForm({
        name: workflow?.name || '',
        contract_type_id: workflow?.contract_type_id || '',
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
        meta: workflow?.meta || {},
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
        localStorage.setItem('workflow_master_statuses', JSON.stringify(contractStatuses));
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
        const approveMaster = MASTER_ACTIONS.find((ma: any) => ma.code === 'approve');
        const rejectMaster = MASTER_ACTIONS.find((ma: any) => ma.code === 'reject');
        form.setData('steps', [
            ...form.data.steps,
            {
                id: `new-${Date.now()}`,
                label: '',
                approver_type: 'role',
                step_category: null,
                actions: [
                    {
                        id: `new-action-approve-${Date.now()}`,
                        master_action_id: approveMaster?.id || '',
                        master_action: approveMaster || null,
                        next_step_id: null,
                        next_workflow_id: null,
                        next_workflow_step_id: null,
                        required_fields: [],
                        autofilled_fields: [],
                    },
                    {
                        id: `new-action-reject-${Date.now()}`,
                        master_action_id: rejectMaster?.id || '',
                        master_action: rejectMaster || null,
                        next_step_id: null,
                        next_workflow_id: null,
                        next_workflow_step_id: null,
                        required_fields: [],
                        autofilled_fields: [],
                    },
                ],
                condition_expression: null,
                role: [],
                department_ids: [],
                user_ids: [],
                filter_department: false,
                filter_company_group: false,
                filter_region: false,
                filter_company: false,
                step: form.data.steps.length + 1,
            },
        ]);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            preserveScroll: true,
            preserveState: true,
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
                    onCollapseAll={() => setExpandedStepId(null)}
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
                    {/* Main Tabs */}
                    <div className="mb-6 flex border-b border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setMainTab('settings')}
                            className={cn(
                                'border-b-2 px-6 py-3 text-[11px] font-black tracking-wider uppercase transition-all',
                                mainTab === 'settings'
                                    ? 'border-primary text-primary dark:text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
                            )}
                        >
                            Pengaturan Workflow
                        </button>
                        <button
                            type="button"
                            onClick={() => setMainTab('steps')}
                            className={cn(
                                'flex items-center gap-2 border-b-2 px-6 py-3 text-[11px] font-black tracking-wider uppercase transition-all',
                                mainTab === 'steps'
                                    ? 'border-primary text-primary dark:text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
                            )}
                        >
                            Tahapan Workflow
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] dark:bg-slate-800">{form.data.steps.length}</span>
                        </button>
                    </div>

                    <div className="space-y-8">
                        {mainTab === 'settings' && (
                            <FormSection>
                                <div className="space-y-10">
                                    {/* --- Section 1: Informasi Dasar --- */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                            <Edit3 size={14} className="text-primary" />
                                            <h3 className="text-[11px] font-black text-slate-900 uppercase dark:text-white">Informasi Dasar</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                            <div className="lg:col-span-6">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                                        <Edit3 size={10} /> Nama Alur Kerja
                                                    </label>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        value={form.data.name}
                                                        onChange={(e) => form.setData('name', e.target.value)}
                                                        className={cn(
                                                            'focus:border-primary focus:ring-primary dark:focus:border-primary h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-bold transition-all focus:bg-white focus:ring-1 dark:border-slate-800 dark:bg-slate-900/50 dark:focus:bg-slate-900',
                                                            form.errors.name && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                                                        )}
                                                        placeholder="Contoh: ALUR PERSETUJUAN KONTRAK LOGISTIK"
                                                    />
                                                    {form.errors.name && (
                                                        <p className="mt-1 text-[10px] font-bold text-red-500">{form.errors.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="lg:col-span-3">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                                        <LayoutTemplate size={10} /> Jenis Kontrak
                                                    </label>
                                                    <Select
                                                        value={form.data.contract_type_id || 'all'}
                                                        onValueChange={(v) => form.setData('contract_type_id', v === 'all' ? '' : String(v))}
                                                    >
                                                        <SelectTrigger className="focus:border-primary focus:ring-primary dark:focus:border-primary h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-black tracking-tight uppercase transition-all focus:ring-1 dark:border-slate-800 dark:bg-slate-900/50">
                                                            <SelectValue placeholder="SEMUA JENIS" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                            <SelectItem value="all" className="py-2.5 text-[10px] font-black uppercase">
                                                                SEMUA JENIS
                                                            </SelectItem>
                                                            {contractTypes.map((t: any) => (
                                                                <SelectItem
                                                                    key={t.id}
                                                                    value={t.id}
                                                                    className="py-2.5 text-[10px] font-black uppercase"
                                                                >
                                                                    {t.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-3">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                                        Status Alur
                                                    </label>
                                                    <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 dark:border-slate-800 dark:bg-slate-900/50">
                                                        <Checkbox
                                                            id="is_default"
                                                            checked={form.data.is_default}
                                                            onCheckedChange={(c) => form.setData('is_default', !!c)}
                                                            className="h-4 w-4"
                                                        />
                                                        <label
                                                            htmlFor="is_default"
                                                            className="text-primary cursor-pointer text-[10px] font-bold uppercase dark:text-white"
                                                        >
                                                            Alur Default
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- Advanced Workflow Configurations (1x3 Grid) --- */}
                                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                                        {/* Column 1: Pengaturan Mode Dokumen */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                                <LayoutTemplate size={14} className="text-primary" />
                                                <h3 className="text-[11px] font-black text-slate-900 uppercase dark:text-white">
                                                    Mode Dokumen
                                                </h3>
                                            </div>
                                            <div className="space-y-3">
                                                {/* MODE F1 */}
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                        <LayoutTemplate size={10} /> Mode F1
                                                    </label>
                                                    <Select
                                                        value={form.data.meta?.f1_mode || 'upload'}
                                                        onValueChange={(v) => form.setData('meta', { ...form.data.meta, f1_mode: v, ...(v !== 'interactive' && { f1_form_template_id: null }) })}
                                                    >
                                                        <SelectTrigger className="focus:border-primary focus:ring-primary dark:focus:border-primary h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold uppercase transition-all focus:ring-1 dark:border-slate-800 dark:bg-black/50">
                                                            <SelectValue placeholder="UPLOAD FORM" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                            <SelectItem value="upload" className="py-2 text-[10px] font-bold uppercase">UPLOAD FORM</SelectItem>
                                                            <SelectItem value="interactive" className="py-2 text-[10px] font-bold uppercase">FORM BUILDER</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {form.data.meta?.f1_mode === 'interactive' && (
                                                        <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
                                                            <label className="text-[9px] font-bold tracking-widest text-primary uppercase">Template Form F1</label>
                                                            <Select
                                                                value={form.data.meta?.f1_form_template_id || ''}
                                                                onValueChange={(v) => form.setData('meta', { ...form.data.meta, f1_form_template_id: v })}
                                                            >
                                                                <SelectTrigger className="focus:border-primary focus:ring-primary h-9 rounded-xl border-primary/30 bg-white text-[11px] font-bold uppercase transition-all focus:ring-1 dark:border-primary/20 dark:bg-slate-900">
                                                                    <SelectValue placeholder="Pilih Template..." />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                                    {formTemplates.map((t: any) => (
                                                                        <SelectItem key={t.id} value={t.id} className="py-2 text-[10px] font-bold uppercase">{t.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* MODE F2 */}
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                        <LayoutTemplate size={10} /> Mode F2
                                                    </label>
                                                    <Select
                                                        value={form.data.meta?.f2_mode || 'upload'}
                                                        onValueChange={(v) => form.setData('meta', { ...form.data.meta, f2_mode: v, ...(v !== 'interactive' && { f2_form_template_id: null }) })}
                                                    >
                                                        <SelectTrigger className="focus:border-primary focus:ring-primary dark:focus:border-primary h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold uppercase transition-all focus:ring-1 dark:border-slate-800 dark:bg-black/50">
                                                            <SelectValue placeholder="UPLOAD FORM" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                            <SelectItem value="upload" className="py-2 text-[10px] font-bold uppercase">UPLOAD FORM</SelectItem>
                                                            <SelectItem value="interactive" className="py-2 text-[10px] font-bold uppercase">FORM BUILDER</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {form.data.meta?.f2_mode === 'interactive' && (
                                                        <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
                                                            <label className="text-[9px] font-bold tracking-widest text-primary uppercase">Template Form F2</label>
                                                            <Select
                                                                value={form.data.meta?.f2_form_template_id || ''}
                                                                onValueChange={(v) => form.setData('meta', { ...form.data.meta, f2_form_template_id: v })}
                                                            >
                                                                <SelectTrigger className="focus:border-primary focus:ring-primary h-9 rounded-xl border-primary/30 bg-white text-[11px] font-bold uppercase transition-all focus:ring-1 dark:border-primary/20 dark:bg-slate-900">
                                                                    <SelectValue placeholder="Pilih Template..." />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                                    {formTemplates.map((t: any) => (
                                                                        <SelectItem key={t.id} value={t.id} className="py-2 text-[10px] font-bold uppercase">{t.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* MODE KONTRAK AGREEMENT */}
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                        <LayoutTemplate size={10} /> Mode Agreement
                                                    </label>
                                                    <Select
                                                        value={form.data.meta?.contract_mode || 'upload'}
                                                        onValueChange={(v) => form.setData('meta', { ...form.data.meta, contract_mode: v, ...(v !== 'interactive' && { contract_form_template_id: null }) })}
                                                    >
                                                        <SelectTrigger className="focus:border-primary focus:ring-primary dark:focus:border-primary h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold uppercase transition-all focus:ring-1 dark:border-slate-800 dark:bg-black/50">
                                                            <SelectValue placeholder="UPLOAD FORM" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                            <SelectItem value="upload" className="py-2 text-[10px] font-bold uppercase">UPLOAD FORM</SelectItem>
                                                            <SelectItem value="interactive" className="py-2 text-[10px] font-bold uppercase">FORM BUILDER</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {form.data.meta?.contract_mode === 'interactive' && (
                                                        <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
                                                            <label className="text-[9px] font-bold tracking-widest text-primary uppercase">Template Agreement</label>
                                                            <Select
                                                                value={form.data.meta?.contract_form_template_id || ''}
                                                                onValueChange={(v) => form.setData('meta', { ...form.data.meta, contract_form_template_id: v })}
                                                            >
                                                                <SelectTrigger className="focus:border-primary focus:ring-primary h-9 rounded-xl border-primary/30 bg-white text-[11px] font-bold uppercase transition-all focus:ring-1 dark:border-primary/20 dark:bg-slate-900">
                                                                    <SelectValue placeholder="Pilih Template..." />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                                                                    {formTemplates.map((t: any) => (
                                                                        <SelectItem key={t.id} value={t.id} className="py-2 text-[10px] font-bold uppercase">{t.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column 2: Ruang Lingkup Organisasi */}
                                        <OrgScopeSelector
                                            form={form}
                                            companyGroups={companyGroups}
                                            regions={regions}
                                            companies={companies}
                                            isOrgExpanded={isOrgExpanded}
                                            setIsOrgExpanded={setIsOrgExpanded}
                                        />

                                        {/* Column 3: Otoritas Akses (Initiator) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                                <Shield size={14} className="text-primary" />
                                                <h3 className="text-[11px] font-black text-slate-900 uppercase dark:text-white">
                                                    Otoritas Inisiator
                                                </h3>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Selector 1: Role */}
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                        <Shield size={10} /> Role
                                                    </label>
                                                    <SearchableMultiSelect
                                                        values={form.data.initiator_roles || []}
                                                        onValuesChange={(vals: string[]) => form.setData('initiator_roles', vals)}
                                                        options={roles.map((r: any) => ({ value: r.name, label: r.name }))}
                                                        placeholder="Semua Role..."
                                                        triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-[11px] font-bold uppercase bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                                                    />
                                                </div>

                                                {/* Selector 2: Unit / Department */}
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                        <UsersIcon size={10} /> Unit / Department
                                                    </label>
                                                    <SearchableMultiSelect
                                                        values={form.data.initiator_departments?.map(String) || []}
                                                        onValuesChange={(vals: string[]) => form.setData('initiator_departments', vals)}
                                                        options={departments.map((d: any) => ({ value: String(d.id), label: d.name }))}
                                                        placeholder="Semua Unit..."
                                                        triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-[11px] font-bold uppercase bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                                                    />
                                                </div>

                                                {/* Selector 3: User */}
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                        <UsersIcon size={10} /> User
                                                    </label>
                                                    <SearchableMultiSelect
                                                        values={form.data.initiator_users?.map(String) || []}
                                                        onValuesChange={(vals: string[]) => form.setData('initiator_users', vals)}
                                                        options={users.map((u: any) => ({
                                                            value: String(u.id),
                                                            label: `${u.name} (${u.role})`,
                                                        }))}
                                                        placeholder="Semua User..."
                                                        triggerClassName="min-h-9 h-auto py-1.5 px-3 rounded-xl text-[11px] font-bold uppercase bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900/50 dark:border-slate-800 dark:focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FormSection>
                        )}
                        {mainTab === 'steps' && (
                            <>
                                {/* --- Workflow Steps & Visualization Section --- */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl">
                                                <GitBranch size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-slate-900 uppercase dark:text-white">
                                                    Tahapan Alur Kerja
                                                </h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                    Konfigurasi Urutan Approval & Penugasan
                                                </p>
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
                                                    <SortableContext
                                                        items={form.data.steps.map((s: any) => s.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
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
                                                                    allWorkflows={allWorkflows.filter(
                                                                        (w: any) =>
                                                                            !form.data.contract_type_id ||
                                                                            w.contract_type_id === form.data.contract_type_id ||
                                                                            !w.contract_type_id,
                                                                    )}
                                                                    allWorkflowSteps={form.data.steps}
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
                            </>
                        )}
                    </div>
                </ManagementForm>
            </div>
        </>
    );
}
