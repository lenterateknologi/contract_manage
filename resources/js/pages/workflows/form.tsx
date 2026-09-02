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
import { Bookmark, CheckCircle2, CheckSquare2, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Edit3, GitBranch, LayoutTemplate, MinusSquare, Pencil, PlusCircle, Shield, Square, Trash2, Users as UsersIcon } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import AuthorityTableManager from './components/AuthorityTableManager';
import ContractTypeTableManager from './components/ContractTypeTableManager';
import { Modal } from '@/components/ui/dialogs/Modal';

import SortableStepItem from './components/SortableStepItem';
import { DraggablePresetCard } from './components/DraggablePresetCard';
import { MASTER_ACTIONS, APPROVER_TYPE_STYLES, getActionTheme } from './constants';
import { WorkflowFlowVisualizer } from './components/WorkflowFlowVisualizer';
import { Activity } from 'lucide-react';

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
    stepPresets = [],
}: any) {
    const { showToast } = useToast();

    const [presets, setPresets] = useState<any[]>(stepPresets);
    const [isPresetsMinimized, setIsPresetsMinimized] = useState<boolean>(true);
    const [addChoiceModalOpen, setAddChoiceModalOpen] = useState<boolean>(false);
    const [presetSelectModalOpen, setPresetSelectModalOpen] = useState<boolean>(false);
    const [presetModalOpen, setPresetModalOpen] = useState(false);
    const [presetNameInput, setPresetNameInput] = useState('');
    const [targetPresetStep, setTargetPresetStep] = useState<any>(null);

    // Edit Preset State
    const [editingPreset, setEditingPreset] = useState<any>(null);
    const [editPresetModalOpen, setEditPresetModalOpen] = useState(false);
    const [editPresetName, setEditPresetName] = useState('');
    const [editPresetDescription, setEditPresetDescription] = useState('');

    const handleEditPreset = (preset: any) => {
        const stepData = preset.step_data || {};
        setEditingPreset(preset);
        setEditPresetName(preset.name || '');
        setEditPresetDescription(stepData.description || stepData.name || stepData.label || '');
        setEditPresetModalOpen(true);
    };

    useEffect(() => {
        if (stepPresets) {
            setPresets(stepPresets);
        }
    }, [stepPresets]);

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

    const [mainTab, setMainTab] = useState<'settings' | 'categories' | 'authorities' | 'steps' | 'visualizer'>(() => {
        if (typeof window !== 'undefined') {
            const tab = new URLSearchParams(window.location.search).get('tab');
            if (tab === 'settings' || tab === 'categories' || tab === 'authorities' || tab === 'steps' || tab === 'visualizer') return tab;
        }
        return 'settings';
    });

    const handleTabChange = (tab: 'settings' | 'categories' | 'authorities' | 'steps' | 'visualizer') => {
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

    const [selectedStepIds, setSelectedStepIds] = useState<Set<string>>(new Set());

    const toggleSelectStep = (stepId: string) => {
        setSelectedStepIds((prev) => {
            const next = new Set(prev);
            if (next.has(stepId)) {
                next.delete(stepId);
            } else {
                next.add(stepId);
            }
            return next;
        });
    };

    const selectAllSteps = () => {
        const allIds = form.data.steps.map((s: any) => s.id);
        setSelectedStepIds(new Set(allIds));
    };

    const clearSelection = () => {
        setSelectedStepIds(new Set());
    };

    const bulkDeleteSelected = () => {
        if (selectedStepIds.size === 0) return;
        const filtered = form.data.steps.filter((s: any) => !selectedStepIds.has(s.id));
        const normalized = filtered.map((item: any, index: number) => ({
            ...item,
            step: index + 1,
        }));
        form.setData('steps', normalized);
        clearSelection();
    };

    const bulkMoveSelected = useCallback((direction: 'up' | 'down') => {
        if (selectedStepIds.size === 0) return;
        const steps = [...form.data.steps];
        if (direction === 'up') {
            for (let i = 1; i < steps.length; i++) {
                if (selectedStepIds.has(steps[i].id) && !selectedStepIds.has(steps[i - 1].id)) {
                    const temp = steps[i];
                    steps[i] = steps[i - 1];
                    steps[i - 1] = temp;
                }
            }
        } else {
            for (let i = steps.length - 2; i >= 0; i--) {
                if (selectedStepIds.has(steps[i].id) && !selectedStepIds.has(steps[i + 1].id)) {
                    const temp = steps[i];
                    steps[i] = steps[i + 1];
                    steps[i + 1] = temp;
                }
            }
        }
        const normalized = steps.map((item: any, index: number) => ({
            ...item,
            step: index + 1,
        }));
        form.setData('steps', normalized);
    }, [selectedStepIds, form]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedStepIds.size === 0) return;
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                bulkMoveSelected('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                bulkMoveSelected('down');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedStepIds, bulkMoveSelected]);



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

            <div className="flex flex-col h-svh max-h-svh overflow-hidden bg-background w-full p-0 m-0">
                <div className="flex flex-col flex-1 min-h-0 w-full rounded-none border-0 bg-background shadow-none overflow-hidden">
                    <ManagementForm
                        title={workflow ? `Konfigurasi tahapan untuk ${form.data.name}` : 'Konfigurasi Tahapan Workflow Baru'}
                        onClose={() => router.visit(route('admin.workflows'))}
                        onSave={handleSubmit}
                        processing={form.processing}
                        isDirty={form.isDirty}
                        isEdit={!!workflow}
                        flat={true}
                        tabs={
                            <div className="flex bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80">
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('settings')}
                                    className={cn(
                                        'px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
                                        mainTab === 'settings'
                                            ? 'bg-primary text-white font-bold shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium',
                                    )}
                                >
                                    Pengaturan Workflow
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('categories')}
                                    className={cn(
                                        'flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
                                        mainTab === 'categories'
                                            ? 'bg-primary text-white font-bold shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium',
                                    )}
                                >
                                    Kategori Kontrak
                                    <span className={cn(
                                        'rounded-full px-1.5 py-0.2 text-[10px] transition-colors',
                                        mainTab === 'categories'
                                            ? 'bg-white/20 text-white font-bold'
                                            : 'bg-slate-200/50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 font-medium'
                                    )}>
                                        {(form.data.contract_type_ids || []).length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('authorities')}
                                    className={cn(
                                        'flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
                                        mainTab === 'authorities'
                                            ? 'bg-primary text-white font-bold shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium',
                                    )}
                                >
                                    Otoritas Inisiator
                                    <span className={cn(
                                        'rounded-full px-1.5 py-0.2 text-[10px] transition-colors',
                                        mainTab === 'authorities'
                                            ? 'bg-white/20 text-white font-bold'
                                            : 'bg-slate-200/50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 font-medium'
                                    )}>
                                        {(form.data.initiator_authorities || []).length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('steps')}
                                    className={cn(
                                        'flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
                                        mainTab === 'steps'
                                            ? 'bg-primary text-white font-bold shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium',
                                    )}
                                >
                                    Tahapan Workflow
                                    <span className={cn(
                                        'rounded-full px-1.5 py-0.2 text-[10px] transition-colors',
                                        mainTab === 'steps'
                                            ? 'bg-white/20 text-white font-bold'
                                            : 'bg-slate-200/50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 font-medium'
                                    )}>
                                        {form.data.steps.length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('visualizer')}
                                    className={cn(
                                        'flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none',
                                        mainTab === 'visualizer'
                                            ? 'bg-primary text-white font-bold shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium',
                                    )}
                                >
                                    <Activity size={13} />
                                    Visualisasi Diagram
                                </button>
                            </div>
                        }
                        headerActions={
                            <div className="flex items-center gap-2">
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

                        <div>
                            {mainTab === 'settings' && (
                                <FormSection className="space-y-6 p-3">
                                    {/* Section 1: Informasi Utama Alur Kerja */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
                                            <Edit3 size={15} className="text-primary" />
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                                Informasi Utama Alur Kerja
                                            </h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {/* Row 1: Nama Alur Kerja */}
                                            <div className="w-full">
                                                <FormInput
                                                    label="Nama Alur Kerja"
                                                    type="text"
                                                    autoFocus
                                                    value={form.data.name}
                                                    onChange={(e) => form.setData('name', e.target.value)}
                                                    error={form.errors.name}
                                                    placeholder="Contoh: ALUR PERSETUJUAN KONTRAK LOGISTIK"
                                                    variant="outline"
                                                    inputSize="compact"
                                                />
                                            </div>

                                            {/* Row 2: Checkboxes */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30">
                                                    <Checkbox
                                                        id="is_default"
                                                        checked={form.data.is_default}
                                                        onCheckedChange={(c) => form.setData('is_default', !!c)}
                                                        className="h-4 w-4 rounded"
                                                    />
                                                    <label htmlFor="is_default" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                                                        Alur Utama (Default)
                                                    </label>
                                                </div>

                                                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30">
                                                    <Checkbox
                                                        id="is_selectable"
                                                        checked={form.data.is_selectable}
                                                        onCheckedChange={(c) => form.setData('is_selectable', !!c)}
                                                        className="h-4 w-4 rounded"
                                                    />
                                                    <label htmlFor="is_selectable" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                                                        Tampil Sebagai Pilihan Opsi
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FormSection>
                            )}

                            {mainTab === 'categories' && (
                                <div className="p-3">
                                    <ContractTypeTableManager
                                        contractTypeIds={form.data.contract_type_ids || []}
                                        onChange={(vals) => form.setData('contract_type_ids', vals)}
                                        contractTypes={contractTypes}
                                    />
                                </div>
                            )}

                            {mainTab === 'authorities' && (
                                <FormSection className="p-3">
                                    <AuthorityTableManager
                                        title="Otoritas Inisiator"
                                        authorities={form.data.initiator_authorities || []}
                                        onChange={(vals) => form.setData('initiator_authorities', vals)}
                                        users={users}
                                        roles={roles}
                                        departments={departments}
                                        divisions={divisions}
                                        companyGroups={companyGroups}
                                        companies={companies}
                                        regions={regions}
                                    />
                                </FormSection>
                            )}
                        {mainTab === 'steps' && (
                            <div
                                className={cn(
                                    'grid gap-6 items-stretch transition-[grid-template-columns] duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] min-h-[500px]',
                                    isPresetsMinimized ? 'grid-cols-1 lg:grid-cols-[1fr_56px]' : 'grid-cols-1 lg:grid-cols-[7fr_3fr]'
                                )}
                            >
                                {/* Left Column: Active Workflow Steps List */}
                                <div className="min-w-0 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-4 h-full">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
                                                <GitBranch size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-zinc-100">Tahapan Alur Kerja</h3>
                                                <p className="text-[10px] text-slate-500 dark:text-zinc-400">Atur dan kelola tahapan persetujuan kontrak</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {form.data.steps.length > 0 && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const allExpanded: Record<string, boolean> = {};
                                                            form.data.steps.forEach((s: any) => {
                                                                allExpanded[s.id] = true;
                                                            });
                                                            setExpandedStepIds(allExpanded);
                                                        }}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-primary/40 dark:hover:text-primary cursor-pointer"
                                                        title="Buka Semua Tahapan (Expand All)"
                                                    >
                                                        <ChevronsDown size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedStepIds({})}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-primary/40 dark:hover:text-primary cursor-pointer"
                                                        title="Tutup Semua Tahapan (Minimize All)"
                                                    >
                                                        <ChevronsUp size={14} />
                                                    </button>
                                                    <div className="h-3 w-px bg-slate-200 dark:bg-zinc-700 mx-0.5" />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            selectedStepIds.size === form.data.steps.length
                                                                ? clearSelection()
                                                                : selectAllSteps()
                                                        }
                                                        className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-primary transition-colors"
                                                        title={selectedStepIds.size === form.data.steps.length ? 'Batalkan semua' : 'Pilih semua'}
                                                    >
                                                        {selectedStepIds.size === form.data.steps.length ? (
                                                            <CheckSquare2 size={13} className="text-primary" />
                                                        ) : selectedStepIds.size > 0 ? (
                                                            <MinusSquare size={13} className="text-primary" />
                                                        ) : (
                                                            <Square size={13} />
                                                        )}
                                                        {selectedStepIds.size > 0 ? `${selectedStepIds.size}/${form.data.steps.length}` : 'Pilih'}
                                                    </button>
                                                </>
                                            )}
                                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                                {form.data.steps.length} Tahap
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bulk Action Toolbar */}
                                    {selectedStepIds.size > 0 && (
                                        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 -mt-1">
                                            <span className="text-xs font-bold text-primary">{selectedStepIds.size} dipilih</span>
                                            <div className="h-3 w-px bg-primary/20" />
                                            <button
                                                type="button"
                                                onClick={() => bulkMoveSelected('up')}
                                                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                            >
                                                <ArrowUp size={12} /> Naik
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => bulkMoveSelected('down')}
                                                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                                            >
                                                <ArrowDown size={12} /> Turun
                                            </button>
                                            <button
                                                type="button"
                                                onClick={bulkDeleteSelected}
                                                className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline ml-2 cursor-pointer"
                                            >
                                                <Trash2 size={12} /> Hapus
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearSelection}
                                                className="ml-auto text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                Batalkan
                                            </button>
                                        </div>
                                    )}

                                    {form.data.steps.length === 0 ? (
                                        <div className="border-primary/5 bg-primary/[0.01] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-24 text-center dark:border-white/5 dark:bg-white/[0.01]">
                                            <div className="bg-primary/5 mb-4 rounded-2xl p-4">
                                                <PlusCircle size={32} className="text-primary/20" />
                                            </div>
                                            <span className="text-xs font-medium uppercase tracking-widest text-slate-400/80">
                                                Belum Ada Tahapan Terdefinisi
                                            </span>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
                                                Klik tombol "Tambah Tahap" atau pilih dari Preset di sebelah kanan
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
                                                            companies={companies}
                                                            regions={regions}
                                                            step={step}
                                                            idx={idx}
                                                            isExpanded={expandedStepIds[step.id] !== false}
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
                                                             onSavePreset={(st: any) => {
                                                                setTargetPresetStep(st);
                                                                setPresetNameInput(st.name || `Preset Tahap ${st.step}`);
                                                                setPresetModalOpen(true);
                                                            }}
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
                                                                form.setData('steps', filtered);
                                                            }}
                                                            moveLocalStep={(i: number, direction: 'up' | 'down') => {
                                                                const nextIndex = direction === 'up' ? i - 1 : i + 1;
                                                                if (nextIndex < 0 || nextIndex >= form.data.steps.length) return;

                                                                const updatedSteps = [...form.data.steps];
                                                                const [movedItem] = updatedSteps.splice(i, 1);
                                                                updatedSteps.splice(nextIndex, 0, movedItem);

                                                                const normalizedSteps = updatedSteps.map((item: any, index: number) => ({
                                                                    ...item,
                                                                    step: index + 1,
                                                                }));
                                                                form.setData('steps', normalizedSteps);
                                                            }}
                                                            isSelected={selectedStepIds.has(step.id)}
                                                            onToggleSelect={toggleSelectStep}
                                                            onMoveKeyboard={(i, direction) => {
                                                                const nextIndex = direction === 'up' ? i - 1 : i + 1;
                                                                if (nextIndex < 0 || nextIndex >= form.data.steps.length) return;
                                                                const updatedSteps = [...form.data.steps];
                                                                const [movedItem] = updatedSteps.splice(i, 1);
                                                                updatedSteps.splice(nextIndex, 0, movedItem);
                                                                const normalizedSteps = updatedSteps.map((item: any, index: number) => ({
                                                                    ...item,
                                                                    step: index + 1,
                                                                }));
                                                                form.setData('steps', normalizedSteps);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    )}

                                    {/* Tambah Step button placed inside Tahapan Alur Kerja Card */}
                                    <div className="flex justify-center pt-2 pb-2">
                                        <button
                                            type="button"
                                            onClick={() => setAddChoiceModalOpen(true)}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-3 text-sm font-bold text-primary transition-all duration-300 hover:border-primary/60 hover:bg-primary/10 dark:border-primary/20 dark:bg-primary/[0.05] dark:hover:border-primary/40 dark:hover:bg-primary/10 cursor-pointer"
                                        >
                                            <PlusCircle size={16} />
                                            Tambah Step
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Step Presets Panel (Ultra Smooth Collapsible Sidebar) */}
                                <div
                                    className={cn(
                                        'w-full h-full bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl flex flex-col gap-4 overflow-hidden transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
                                        isPresetsMinimized ? 'p-2' : 'p-4'
                                    )}
                                >
                                    <div
                                        onClick={() => setIsPresetsMinimized((prev) => !prev)}
                                        className={cn(
                                            'flex items-center cursor-pointer select-none group transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
                                            isPresetsMinimized ? 'flex-col gap-3 py-2 items-center justify-center' : 'justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5'
                                        )}
                                        title={isPresetsMinimized ? `Buka Preset Tahapan (${presets.length} Preset)` : 'Kecilkan Preset Tahapan (Minimize)'}
                                    >
                                        <div className={cn('flex items-center gap-2 transition-all duration-700', isPresetsMinimized && 'flex-col items-center')}>
                                            <div className="bg-primary/10 text-primary dark:text-primary-400 p-2 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                                                <LayoutTemplate size={18} />
                                            </div>
                                            {!isPresetsMinimized && (
                                                <div className="flex flex-col overflow-hidden transition-all duration-500 animate-in fade-in">
                                                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-zinc-100 group-hover:text-primary transition-colors whitespace-nowrap">
                                                        Preset Tahapan
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 whitespace-nowrap">Tersimpan di Database (Server)</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isPresetsMinimized && (
                                                <span className="text-[10px] font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300 px-2 py-0.5 rounded-full animate-in fade-in duration-500">
                                                    {presets.length} Preset
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={cn('transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] overflow-hidden', isPresetsMinimized ? 'max-h-0 opacity-0' : 'max-h-[700px] opacity-100')}>
                                        {presets.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 px-2 text-center border border-dashed border-slate-200/80 dark:border-zinc-800 rounded-lg">
                                                <Bookmark size={24} className="text-slate-300 dark:text-zinc-700 mb-2" />
                                                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Belum Ada Preset</p>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                                Klik tombol <span className="font-bold text-primary">Simpan sebagai Preset</span> pada tahapan di sebelah kiri untuk menyimpannya.
                                                </p>
                                            </div>
                                        ) : (
                                             <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                                                 {presets.map((preset) => {
                                                     const stepData = preset.step_data || {};
                                                     const approverType = stepData.approver_type || 'role';
                                                     const appStyle = APPROVER_TYPE_STYLES[approverType] || {
                                                         label: approverType.toUpperCase(),
                                                         badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
                                                         borderClass: 'border-l-slate-400',
                                                     };

                                                    return (
                                                        <div
                                                            key={preset.id}
                                                            className="group relative flex flex-col gap-3 transition-all duration-300 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-primary/80 hover:bg-white dark:hover:bg-slate-900/60 rounded-lg p-3.5"
                                                        >
                                                            {/* Header Row */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div className="border-primary/20 bg-primary/10 text-primary dark:text-primary-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-bold">
                                                                        <Bookmark size={14} />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                                            {preset.name}
                                                                        </span>
                                                                        {(stepData.description || stepData.name || stepData.label) && (
                                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                                                {stepData.description || stepData.name || stepData.label}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const newStep = {
                                                                                ...JSON.parse(JSON.stringify(stepData)),
                                                                                id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                                                                step: form.data.steps.length + 1,
                                                                            };
                                                                            form.setData('steps', [...form.data.steps, newStep]);
                                                                            showToast(`Tahap dari preset "${preset.name}" berhasil ditambahkan!`, 'success');
                                                                        }}
                                                                        className="h-7 w-7 inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-lg transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                                                                        title="Gunakan Preset Ini"
                                                                    >
                                                                        <PlusCircle size={15} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEditPreset(preset);
                                                                        }}
                                                                        className="h-7 w-7 inline-flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 border border-slate-200 dark:border-slate-800 hover:border-primary/40 rounded-lg transition-colors cursor-pointer"
                                                                        title="Ubah Preset"
                                                                    >
                                                                        <Pencil size={12} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (confirm(`Hapus preset "${preset.name}"?`)) {
                                                                                router.delete(route('admin.workflows.presets.destroy', preset.id), {
                                                                                    preserveScroll: true,
                                                                                    onSuccess: () => showToast(`Preset "${preset.name}" dihapus`, 'info'),
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="h-7 w-7 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 rounded-lg transition-colors cursor-pointer"
                                                                        title="Hapus Preset"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Step Actions Preview */}
                                                            {stepData.actions && stepData.actions.length > 0 && (
                                                                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                                                                    {stepData.actions.map((act: any, aIdx: number) => {
                                                                        let code = act.action_code || act.code || '';
                                                                        let name = act.alias || act.label || '';

                                                                        if (act.master_action_id) {
                                                                            const ma = MASTER_ACTIONS.find((m: any) => m.id === act.master_action_id || m.code === act.action_code);
                                                                            if (ma) {
                                                                                code = code || ma.code;
                                                                                name = name || ma.name;
                                                                            }
                                                                        } else if (act.master_action) {
                                                                            code = code || act.master_action.code || act.master_action.name?.toLowerCase();
                                                                            name = name || act.master_action.name;
                                                                        }

                                                                        if (!code && act.name) {
                                                                            code = act.name.toLowerCase();
                                                                        }
                                                                        if (!name) {
                                                                            name = act.name || act.label || `Aksi ${aIdx + 1}`;
                                                                        }

                                                                        if (name.toLowerCase().includes('setuju') || name.toLowerCase().includes('approve')) code = 'approve';
                                                                        else if (name.toLowerCase().includes('tolak') || name.toLowerCase().includes('reject')) code = 'reject';
                                                                        else if (name.toLowerCase().includes('tugas') || name.toLowerCase().includes('assign')) code = 'assign';

                                                                        const { color, icon: IconComponent } = getActionTheme(code, name);

                                                                        return (
                                                                            <span
                                                                                key={aIdx}
                                                                                className={cn(
                                                                                    'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-semibold text-white uppercase shadow-none',
                                                                                    color
                                                                                )}
                                                                            >
                                                                                <IconComponent size={10} className="opacity-90" />
                                                                                <span>{name}</span>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {mainTab === 'visualizer' && (
                            <div className="p-1">
                                <WorkflowFlowVisualizer steps={form.data.steps} workflow={workflow} />
                            </div>
                        )}
                    </div>
                </ManagementForm>
            </div>
        </div>

        {/* --- Custom Modal Pilih Jenis Tambah Step (Default vs Preset) --- */}
        <Modal
            isOpen={addChoiceModalOpen}
            onClose={() => setAddChoiceModalOpen(false)}
            title={
                <div className="flex items-center gap-2">
                    <PlusCircle size={18} className="text-primary" />
                    <span>Tambah Tahapan Alur Kerja</span>
                </div>
            }
            description="Pilih untuk membuat tahapan alur kerja baru secara kosongan (default) atau gunakan preset yang tersimpan."
            maxWidth="md"
        >
            <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opsi 1: Step Default */}
                    <div
                        onClick={() => {
                            setAddChoiceModalOpen(false);
                            addLocalStep();
                        }}
                        className="group border border-slate-200 dark:border-slate-800 hover:border-primary bg-slate-50/50 dark:bg-slate-900/50 hover:bg-primary/5 rounded-xl p-3.5 cursor-pointer transition-all flex flex-col gap-2.5"
                    >
                        <div className="bg-primary/10 text-primary p-2 rounded-lg w-fit group-hover:scale-105 transition-transform">
                            <PlusCircle size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                                Tahap Default
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                Buat tahapan baru secara kosong dengan alur konfigurasinya dari awal.
                            </p>
                        </div>
                    </div>

                    {/* Opsi 2: Ambil dari Preset */}
                    <div
                        onClick={() => {
                            setAddChoiceModalOpen(false);
                            setPresetSelectModalOpen(true);
                        }}
                        className="group border border-slate-200 dark:border-slate-800 hover:border-primary bg-slate-50/50 dark:bg-slate-900/50 hover:bg-primary/5 rounded-xl p-3.5 cursor-pointer transition-all flex flex-col gap-2.5"
                    >
                        <div className="bg-primary/10 text-primary dark:text-primary-400 p-2 rounded-lg w-fit group-hover:scale-105 transition-transform">
                            <Bookmark size={18} />
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                                    Gunakan Preset
                                </h4>
                                <span className="text-[9px] font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300 px-2 py-0.5 rounded-full">
                                    {presets.length}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                Pilih dari koleksi preset alur kerja yang tersimpan di server.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddChoiceModalOpen(false)}
                        className="h-8 px-3.5 text-xs font-bold"
                    >
                        Batal
                    </Button>
                </div>
            </div>
        </Modal>

        {/* --- Custom Modal Pilih Preset yang Tersimpan --- */}
        <Modal
            isOpen={presetSelectModalOpen}
            onClose={() => setPresetSelectModalOpen(false)}
            title={
                <div className="flex items-center gap-2">
                    <Bookmark size={18} className="text-primary" />
                    <span>Pilih Preset Tahapan</span>
                </div>
            }
            description="Pilih salah satu preset tahapan yang tersimpan untuk disisipkan ke alur kerja ini."
            maxWidth="lg"
        >
            <div className="space-y-3">
                {presets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <Bookmark size={28} className="text-slate-300 dark:text-slate-700 mb-1.5" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Preset Tersimpan</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Anda belum menyimpan preset tahapan apa pun ke database server.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto p-0.5 custom-scrollbar">
                        {presets.map((preset) => {
                            const stepData = preset.step_data || {};
                            return (
                                <div
                                    key={preset.id}
                                    className="group border border-slate-200 dark:border-slate-800 hover:border-primary bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-3 transition-all flex flex-col justify-between gap-2.5"
                                >
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                {preset.name}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300 px-1.5 py-0.2 rounded-full">
                                                Preset
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                            {stepData.description || stepData.name || stepData.label || `Role: ${stepData.approver_type || 'Custom'}`}
                                        </span>

                                        {/* Action Step Pills Preview */}
                                        {stepData.actions && stepData.actions.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                                {stepData.actions.map((act: any, aIdx: number) => {
                                                    const actName = act.master_action?.name || act.master_action_name || act.label || `Action ${aIdx + 1}`;
                                                    const isApprove = actName.toLowerCase().includes('setuju') || actName.toLowerCase().includes('approve');
                                                    const isReject = actName.toLowerCase().includes('tolak') || actName.toLowerCase().includes('reject');

                                                    return (
                                                        <span
                                                            key={aIdx}
                                                            className={cn(
                                                                'text-[8.5px] font-semibold px-1.5 py-0.2 rounded border tracking-tight',
                                                                isApprove && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40',
                                                                isReject && 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40',
                                                                !isApprove && !isReject && 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                            )}
                                                        >
                                                            {actName}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-1">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                const newStep = {
                                                    ...JSON.parse(JSON.stringify(preset.step_data)),
                                                    id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                                    step: form.data.steps.length + 1,
                                                };
                                                form.setData('steps', [...form.data.steps, newStep]);
                                                setPresetSelectModalOpen(false);
                                                showToast(`Tahap dari preset "${preset.name}" berhasil ditambahkan!`, 'success');
                                            }}
                                            className="flex-1 h-7 text-[11px] font-bold bg-primary hover:bg-primary/90 text-white border-none"
                                        >
                                            + Gunakan Preset Ini
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditPreset(preset);
                                            }}
                                            className="h-7 w-7 inline-flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 border border-slate-200 dark:border-slate-800 hover:border-primary/40 rounded-lg transition-colors cursor-pointer shrink-0"
                                            title="Ubah Preset"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPresetSelectModalOpen(false)}
                        className="h-8 px-3.5 text-xs font-bold"
                    >
                        Tutup
                    </Button>
                </div>
            </div>
        </Modal>

        {/* --- Custom Modal Simpan Preset --- */}
        <Modal
            isOpen={presetModalOpen}
            onClose={() => setPresetModalOpen(false)}
            title={
                <div className="flex items-center gap-2">
                    <Bookmark size={18} className="text-primary" />
                    <span>Simpan Preset Tahapan</span>
                </div>
            }
            description="Masukkan nama identifikasi untuk preset tahapan ini agar dapat digunakan kembali secara berulang."
            maxWidth="md"
        >
            <div className="p-6 space-y-4">
                <FormInput
                    label="Nama Preset"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    placeholder="Contoh: Approval Direksi & Finance"
                    required
                    autoFocus
                />

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPresetModalOpen(false)}
                        className="h-10 px-4 text-xs font-bold"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            if (!presetNameInput.trim() || !targetPresetStep) return;
                            router.post(
                                route('admin.workflows.presets.store'),
                                { name: presetNameInput.trim(), step_data: targetPresetStep },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setPresetModalOpen(false);
                                        showToast(`Preset "${presetNameInput.trim()}" berhasil disimpan!`, 'success');
                                    },
                                }
                            );
                        }}
                        className="h-10 px-5 text-xs font-bold bg-primary text-white hover:bg-primary/90 border-none"
                    >
                        Simpan Preset
                    </Button>
                </div>
            </div>
        </Modal>

        {/* --- Custom Modal Ubah Preset --- */}
        <Modal
            isOpen={editPresetModalOpen}
            onClose={() => setEditPresetModalOpen(false)}
            title={
                <div className="flex items-center gap-2">
                    <Bookmark size={18} className="text-primary" />
                    <span>Ubah Preset Tahapan</span>
                </div>
            }
            description="Perbarui nama atau deskripsi tahapan untuk preset ini."
            maxWidth="md"
        >
            <div className="p-6 space-y-4">
                <FormInput
                    label="Nama Preset"
                    value={editPresetName}
                    onChange={(e) => setEditPresetName(e.target.value)}
                    placeholder="Contoh: Approval Direksi & Finance"
                    required
                    autoFocus
                />

                <FormInput
                    label="Deskripsi / Judul Tahap"
                    value={editPresetDescription}
                    onChange={(e) => setEditPresetDescription(e.target.value)}
                    placeholder="Contoh: Review Legal Staff & Finance"
                />

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditPresetModalOpen(false)}
                        className="h-10 px-4 text-xs font-bold"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            if (!editPresetName.trim() || !editingPreset) return;
                            const updatedStepData = {
                                ...(editingPreset.step_data || {}),
                                name: editPresetDescription.trim(),
                                description: editPresetDescription.trim(),
                                label: editPresetDescription.trim(),
                            };
                            router.put(
                                route('admin.workflows.presets.update', editingPreset.id),
                                { name: editPresetName.trim(), step_data: updatedStepData },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setEditPresetModalOpen(false);
                                        showToast(`Preset "${editPresetName.trim()}" berhasil diperbarui!`, 'success');
                                    },
                                }
                            );
                        }}
                        className="h-10 px-5 text-xs font-bold bg-primary text-white hover:bg-primary/90 border-none"
                    >
                        Simpan Perubahan
                    </Button>
                </div>
            </div>
        </Modal>
    </>
);
}
