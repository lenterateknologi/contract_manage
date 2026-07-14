import { FormSection, ManagementForm } from '@/pages/admin/components/ManagementForm';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Edit3, GitBranch, LayoutTemplate, PlusCircle, Shield, Trash2, Users as UsersIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AuthorityTableManager from './components/AuthorityTableManager';
import ContractTypeTableManager from './components/ContractTypeTableManager';

import SortableStepItem from './components/SortableStepItem';
import { MASTER_ACTIONS } from './constants';

// --- Sortable Step Item (Compact) ---

// --- Main Workflow Editor Page ---
export default function WorkflowEditor({
    auth,
    workflow,
    contractTypes,
    departments,
    divisions = [],
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

    const [expandedStepIds, _setExpandedStepIds] = useState<Record<string, boolean>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('workflow_expanded_steps');
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });

    const setExpandedStepIds = (updater: any) => {
        _setExpandedStepIds((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (typeof window !== 'undefined') {
                localStorage.setItem('workflow_expanded_steps', JSON.stringify(next));
            }
            return next;
        });
    };
    const [mainTab, setMainTab] = useState<'settings' | 'steps'>(() => {
        if (typeof window !== 'undefined') {
            const tab = new URLSearchParams(window.location.search).get('tab');
            if (tab === 'settings' || tab === 'steps') return tab;
        }
        return 'settings';
    });

    const handleTabChange = (tab: 'settings' | 'steps') => {
        setMainTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };


    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const form = useForm({
        name: workflow?.name || '',
        contract_type_ids: workflow?.contract_type_ids || (workflow?.contract_type_id ? [workflow.contract_type_id] : []),
        description: workflow?.description || '',
        is_default: !!workflow?.is_default,
        is_selectable: !!workflow?.is_selectable,
        initiator_type: workflow?.initiator_type || 'all',

        approver_roles: workflow?.approver_roles || [],
        approver_departments: workflow?.approver_departments || [],
        approver_users: workflow?.approver_users || [],
        legal_roles: workflow?.legal_roles || [],
        legal_departments: workflow?.legal_departments || [],
        legal_users: workflow?.legal_users || [],
        steps: (workflow?.steps || []).map((s: any) => {
            const hasRoles = s.role && s.role.length > 0;
            const hasDepts = s.department_ids && s.department_ids.length > 0;
            const hasUsers = s.user_ids && s.user_ids.length > 0;
            const config = s.approver_config || {};

            return {
                ...s,
                approver_authorities: s.approver_authorities || [],
                approver_config: {
                    custom: config.custom || [],
                    roles: config.roles && config.roles.length > 0 ? config.roles : (s.approver_type === 'role' && hasRoles ? s.role : []),
                    departments: config.departments && config.departments.length > 0 ? config.departments : (s.approver_type === 'role' && hasDepts ? s.department_ids : []),
                    users: config.users && config.users.length > 0 ? config.users : (s.approver_type === 'user' && hasUsers ? s.user_ids : []),
                    is_default: config.is_default !== undefined ? config.is_default : false,
                }
            };
        }) || [],
        department_id: workflow?.department_id || null,
        company_group_ids: (workflow?.company_group_ids || []).map((i: any) =>
            typeof i === 'object' ? i : { value: String(i), is_initiator: false }
        ),
        region_ids: (workflow?.region_ids || []).map((i: any) =>
            typeof i === 'object' ? i : { value: String(i), is_initiator: false }
        ),
        company_ids: (workflow?.company_ids || []).map((i: any) =>
            typeof i === 'object' ? i : { value: String(i), is_initiator: false }
        ),
        initiator_authorities: workflow?.initiator_authorities || [],
        meta: workflow?.meta || {},
    });





    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIdx = form.data.steps.findIndex((i: any) => i.id === active.id);
            const newIdx = form.data.steps.findIndex((i: any) => i.id === over.id);

            const newSteps = arrayMove(form.data.steps, oldIdx, newIdx).map((step: any, index: number) => ({
                ...step,
                step: index + 1,
            }));

            form.setData('steps', newSteps);
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
                approver_config: {
                    custom: [],
                    roles: [],
                    departments: [],
                    users: [],
                    is_default: false,
                    use_combination: true,
                },
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
        if (form.processing) return;

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

            <div className="flex h-[calc(100vh-4rem)] flex-col bg-white dark:bg-black">
                <ManagementForm
                    title={workflow ? 'Parameter Alur' : 'Registrasi Alur'}
                    subtitle={workflow ? `Konfigurasi tahapan untuk ${form.data.name}` : 'Mendefinisikan alur approval baru'}
                    onClose={() => router.visit(route('admin.workflows'))}
                    onSave={handleSubmit}
                    processing={form.processing}
                    isDirty={form.isDirty}
                    isEdit={!!workflow}
                    onCollapseAll={() => setExpandedStepIds({})}
                    flat={true}
                    tabs={
                        <div className="flex bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                            <button
                                type="button"
                                onClick={() => handleTabChange('settings')}
                                className={cn(
                                    'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                    mainTab === 'settings'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                                )}
                            >
                                Pengaturan Workflow
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTabChange('steps')}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all',
                                    mainTab === 'steps'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                                )}
                            >
                                Tahapan Workflow
                                <span className={cn(
                                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                                    mainTab === 'steps'
                                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                )}>
                                    {form.data.steps.length}
                                </span>
                            </button>
                        </div>
                    }
                    headerActions={
                        <div className="flex items-center gap-2">
                            {mainTab === 'steps' && form.data.steps.length > 0 && (
                                <>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const allExpanded = form.data.steps.reduce((acc: any, s: any) => {
                                                acc[s.id] = true;
                                                return acc;
                                            }, {});
                                            setExpandedStepIds(allExpanded);
                                        }}
                                        variant="ghost"
                                        className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                                    >
                                        Expand Semua
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setExpandedStepIds({})}
                                        variant="ghost"
                                        className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                                    >
                                        Collapse Semua
                                    </Button>
                                </>
                            )}
                            <Button
                                type="button"
                                onClick={addLocalStep}
                                variant="ghost"
                                className="border-primary/20 hover:bg-primary/5 h-9 rounded-lg border px-4 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            >
                                <PlusCircle size={14} className="mr-1.5" /> Tambah Tahap
                            </Button>
                        </div>
                    }
                >

                    <div className="space-y-8">
                        {mainTab === 'settings' && (
                            <FormSection>
                                <div className="space-y-10">
                                    {/* --- Section 1: Informasi Dasar --- */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                            <Edit3 size={14} className="text-primary" />
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Informasi Dasar</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Row 1: Nama Alur Kerja */}
                                            <div>
                                                <FormInput
                                                    label={
                                                        <>
                                                            <Edit3 size={10} /> Nama Alur Kerja
                                                        </>
                                                    }
                                                    type="text"
                                                    autoFocus
                                                    value={form.data.name}
                                                    onChange={(e) => form.setData('name', e.target.value)}
                                                    error={form.errors.name}
                                                    placeholder="Contoh: ALUR PERSETUJUAN KONTRAK LOGISTIK"
                                                    variant="filled"
                                                    size="sm"
                                                />
                                            </div>
                                            {/* Row 2: Status Alur, Dapat Dipilih */}
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                        Status Alur
                                                    </label>
                                                    <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 dark:border-slate-800 dark:bg-card /50">
                                                        <Checkbox
                                                            id="is_default"
                                                            checked={form.data.is_default}
                                                            onCheckedChange={(c) => form.setData('is_default', !!c)}
                                                            className="h-4 w-4"
                                                        />
                                                        <label
                                                            htmlFor="is_default"
                                                            className="text-primary cursor-pointer text-xs font-medium dark:text-white"
                                                        >
                                                            Alur Default
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                        Tampil sebagai pilihan
                                                    </label>
                                                    <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 dark:border-slate-800 dark:bg-card /50">
                                                        <Checkbox
                                                            id="is_selectable"
                                                            checked={form.data.is_selectable}
                                                            onCheckedChange={(c) => form.setData('is_selectable', !!c)}
                                                            className="h-4 w-4"
                                                        />
                                                        <label
                                                            htmlFor="is_selectable"
                                                            className="text-primary cursor-pointer text-xs font-medium dark:text-white"
                                                        >
                                                            Dapat dipilih
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <ContractTypeTableManager
                                            contractTypeIds={form.data.contract_type_ids || []}
                                            onChange={(vals) => form.setData('contract_type_ids', vals)}
                                            contractTypes={contractTypes}
                                        />
                                    </div>

                                    <div className="space-y-4 mt-6">
                                        <AuthorityTableManager
                                            title="Otoritas Inisiator"
                                            authorities={form.data.initiator_authorities || []}
                                            onChange={(vals) => form.setData('initiator_authorities', vals)}
                                            users={users}
                                            roles={roles}
                                            departments={departments}
                                            divisions={divisions}
                                            companyGroups={companyGroups}
                                            regions={regions}
                                        />
                                    </div>
                                </div>
                            </FormSection>
                        )}
                        {mainTab === 'steps' && (
                            <>
                                {/* --- Workflow Steps & Visualization Section --- */}
                                <div className="space-y-4">
                                    {form.data.steps.length === 0 ? (
                                        <div className="border-primary/5 bg-primary/[0.01] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-24 text-center dark:border-white/5 dark:bg-white/[0.01]">
                                            <div className="bg-primary/5 mb-4 rounded-2xl p-4">
                                                <PlusCircle size={32} className="text-primary/20" />
                                            </div>
                                            <span className="text-xs font-medium uppercase tracking-widest text-slate-400/80">
                                                Belum Ada Tahapan Terdefinisi
                                            </span>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
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
                                                            divisions={divisions}
                                                            users={users}
                                                            companyGroups={companyGroups}
                                                            regions={regions}
                                                            step={step}
                                                            idx={idx}
                                                            isExpanded={!!expandedStepIds[step.id]}
                                                            setIsExpanded={(val) =>
                                                                setExpandedStepIds((prev: any) => ({
                                                                    ...prev,
                                                                    [step.id]: val,
                                                                }))
                                                            }
                                                            totalSteps={form.data.steps.length}
                                                            contractStatuses={contractStatuses}
                                                            allWorkflows={allWorkflows.filter(
                                                                (w: any) =>
                                                                    !form.data.contract_type_ids ||
                                                                    form.data.contract_type_ids.length === 0 ||
                                                                    !w.contract_type_id ||
                                                                    form.data.contract_type_ids.includes(String(w.contract_type_id)),
                                                            )}
                                                            allWorkflowSteps={form.data.steps}
                                                            duplicateLocalStep={(i: number) => {
                                                                const s = [...form.data.steps];
                                                                const duplicated = {
                                                                    ...s[i],
                                                                    id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                                                };
                                                                s.splice(i + 1, 0, duplicated);
                                                                const normalized = s.map((item: any, index: number) => ({
                                                                    ...item,
                                                                    step: index + 1,
                                                                }));
                                                                form.setData('steps', normalized);
                                                            }}
                                                            updateLocalStep={(i, data) => {
                                                                const s = [...form.data.steps];
                                                                s[i] = { ...s[i], ...data };
                                                                form.setData('steps', s);
                                                            }}
                                                            removeLocalStep={(i: number) => {
                                                                const filtered = form.data.steps.filter(
                                                                    (_: any, index: number) => index !== i,
                                                                );
                                                                const normalized = filtered.map((item: any, index: number) => ({
                                                                    ...item,
                                                                    step: index + 1,
                                                                }));
                                                                form.setData('steps', normalized);
                                                            }}
                                                            moveLocalStep={(i: number, direction: 'up' | 'down') => {
                                                                const nextIndex = direction === 'up' ? i - 1 : i + 1;
                                                                if (nextIndex < 0 || nextIndex >= form.data.steps.length) return;

                                                                const updatedSteps = [...form.data.steps];
                                                                const temp = updatedSteps[i];
                                                                updatedSteps[i] = updatedSteps[nextIndex];
                                                                updatedSteps[nextIndex] = temp;

                                                                const normalized = updatedSteps.map((item: any, index: number) => ({
                                                                    ...item,
                                                                    step: index + 1,
                                                                }));
                                                                form.setData('steps', normalized);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    )}
                                </div>
                                {form.data.steps.length > 0 && (
                                    <div className="flex items-center gap-4 py-8">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-[10px] font-semibold tracking-widest text-slate-400 dark:border-white/5 dark:bg-white/[0.02]">
                                            <CheckCircle2 size={12} className="opacity-50" /> AKHIR ALUR KERJA
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
                                    </div>
                                )}
                                <div className="flex justify-center pb-6">
                                    <button
                                        type="button"
                                        onClick={addLocalStep}
                                        className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-8 py-3 text-sm font-bold text-primary transition-all hover:border-primary/60 hover:bg-primary/10 dark:border-primary/20 dark:bg-primary/[0.05] dark:hover:border-primary/40 dark:hover:bg-primary/10"
                                    >
                                        <PlusCircle size={16} />
                                        Tambah Step
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </ManagementForm >
            </div >
        </>
    );
}
