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
import { ArrowDown, ArrowUp, Bookmark, Check, CheckCircle2, CheckSquare2, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Edit3, GitBranch, LayoutTemplate, MinusSquare, Pencil, PlusCircle, Search, Shield, Square, Trash2, UserCheck, Users, Users as UsersIcon, X } from 'lucide-react';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import AuthorityTableManager from './components/AuthorityTableManager';
import ContractTypeTableManager from './components/ContractTypeTableManager';
import { Modal } from '@/components/ui/dialogs/Modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialogs/Dialog';

import SortableStepItem from './components/SortableStepItem';
import { DraggablePresetCard } from './components/DraggablePresetCard';
import { MASTER_ACTIONS, APPROVER_TYPE_STYLES, getActionTheme, BUILTIN_STEP_TEMPLATES } from './constants';
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
    const [presetSelectModalOpen, setPresetSelectModalOpen] = useState<boolean>(false);
    const [presetSearch, setPresetSearch] = useState('');
    const [builtinTemplateModalOpen, setBuiltinTemplateModalOpen] = useState<boolean>(false);
    const [templateSearch, setTemplateSearch] = useState('');
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

    const filteredPresets = useMemo(() => {
        if (!presetSearch) return presets;
        const q = presetSearch.toLowerCase();
        return presets.filter((p: any) => {
            const stepData = p.step_data || {};
            return (
                p.name?.toLowerCase().includes(q) ||
                stepData.description?.toLowerCase().includes(q) ||
                stepData.name?.toLowerCase().includes(q) ||
                stepData.label?.toLowerCase().includes(q)
            );
        });
    }, [presets, presetSearch]);

    const filteredBuiltinTemplates = useMemo(() => {
        if (!templateSearch) return BUILTIN_STEP_TEMPLATES;
        const q = templateSearch.toLowerCase();
        return BUILTIN_STEP_TEMPLATES.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q) ||
                t.step_data.description.toLowerCase().includes(q)
        );
    }, [templateSearch]);

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

    const isAllCollapsed = useMemo(() => {
        if (!form.data?.steps || form.data.steps.length === 0) return false;
        return form.data.steps.every((s: any) => expandedStepIds[s.id] === false);
    }, [form.data?.steps, expandedStepIds]);

    const toggleExpandCollapseAll = useCallback(() => {
        const nextState: Record<string, boolean> = {};
        const willExpand = isAllCollapsed;
        form.data.steps.forEach((s: any) => {
            nextState[s.id] = willExpand;
        });
        setExpandedStepIds(nextState);
    }, [form.data?.steps, isAllCollapsed]);

    // State Simulasi Aktor Khusus (Inisiator, PIC Ditugaskan, Pembuat Kontrak)
    const [simActorModalOpen, setSimActorModalOpen] = useState(false);
    const [simActorType, setSimActorType] = useState<'initiator' | 'assigned_pic' | 'creator'>('initiator');
    const [simActorSearch, setSimActorSearch] = useState('');

    // Key cache client-side untuk simulasi aktor
    const SIM_STORAGE_KEY = `wf_sim_actors_${workflow?.id || 'new'}`;

    // ID User yang terpilih untuk simulasi peran (tersimpan di client-side cache localStorage)
    const [simInitiatorId, setSimInitiatorId] = useState<string>(() => {
        try {
            return localStorage.getItem(`${SIM_STORAGE_KEY}_initiator`) || '';
        } catch {
            return '';
        }
    });

    const [simPicId, setSimPicId] = useState<string>(() => {
        try {
            return localStorage.getItem(`${SIM_STORAGE_KEY}_pic`) || '';
        } catch {
            return '';
        }
    });

    const [simCreatorId, setSimCreatorId] = useState<string>(() => {
        try {
            return localStorage.getItem(`${SIM_STORAGE_KEY}_creator`) || '';
        } catch {
            return '';
        }
    });

    // Simpan ke localStorage setiap kali user mengubah data simulasi
    useEffect(() => {
        try {
            if (simInitiatorId) {
                localStorage.setItem(`${SIM_STORAGE_KEY}_initiator`, simInitiatorId);
            } else {
                localStorage.removeItem(`${SIM_STORAGE_KEY}_initiator`);
            }
        } catch (e) {}
    }, [simInitiatorId, SIM_STORAGE_KEY]);

    useEffect(() => {
        try {
            if (simPicId) {
                localStorage.setItem(`${SIM_STORAGE_KEY}_pic`, simPicId);
            } else {
                localStorage.removeItem(`${SIM_STORAGE_KEY}_pic`);
            }
        } catch (e) {}
    }, [simPicId, SIM_STORAGE_KEY]);

    useEffect(() => {
        try {
            if (simCreatorId) {
                localStorage.setItem(`${SIM_STORAGE_KEY}_creator`, simCreatorId);
            } else {
                localStorage.removeItem(`${SIM_STORAGE_KEY}_creator`);
            }
        } catch (e) {}
    }, [simCreatorId, SIM_STORAGE_KEY]);

    const allUsersList = useMemo(() => {
        return (users || []).filter((u: any) => {
            // User aktif jika is_used !== false, !== 0, !== '0', !== null/undefined (atau secara eksplisit true/1)
            if (u.is_used === false || u.is_used === 0 || String(u.is_used) === '0' || String(u.is_used) === 'false') {
                return false;
            }
            return Boolean(u.is_used === true || u.is_used === 1 || String(u.is_used) === '1' || String(u.is_used) === 'true' || u.is_used !== undefined);
        });
    }, [users]);

    // Menampilkan semua pengguna untuk simulasi tanpa filter otoritas
    const activeSimActorUsers = useMemo(() => {
        return allUsersList;
    }, [allUsersList]);

    const filteredSimActorUsers = useMemo(() => {
        if (!simActorSearch.trim()) return activeSimActorUsers;
        const q = simActorSearch.toLowerCase().trim();
        return activeSimActorUsers.filter((u: any) => {
            const name = (u.name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const role = (u.role || '').toLowerCase();
            const pt = (u.company?.name || u.company_name || '').toLowerCase();
            const dept = (u.department?.name || u.org_name || '').toLowerCase();
            return name.includes(q) || email.includes(q) || role.includes(q) || pt.includes(q) || dept.includes(q);
        });
    }, [activeSimActorUsers, simActorSearch]);

    // Context simulasi yang diteruskan ke SortableStepItem & AuthorityTableManager
    const simulationContext = useMemo(() => ({
        initiatorId: simInitiatorId || undefined,
        picId: simPicId || undefined,
        creatorId: simCreatorId || undefined,
    }), [simInitiatorId, simPicId, simCreatorId]);

    // Lookup user objects untuk simulasi terpilih
    const selectedSimInitiator = useMemo(() => {
        return allUsersList.find((u: any) => String(u.id) === String(simInitiatorId)) || null;
    }, [simInitiatorId, allUsersList]);

    const selectedSimPic = useMemo(() => {
        return allUsersList.find((u: any) => String(u.id) === String(simPicId)) || null;
    }, [simPicId, allUsersList]);

    const selectedSimCreator = useMemo(() => {
        return allUsersList.find((u: any) => String(u.id) === String(simCreatorId)) || null;
    }, [simCreatorId, allUsersList]);

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
                                        showInitiatorOption={false}
                                    />
                                </FormSection>
                            )}
                        {mainTab === 'steps' && (
                            <div className="w-full min-w-0 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5 gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 text-primary p-1.5 rounded-lg shrink-0">
                                                <GitBranch size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-zinc-100">Tahapan Alur Kerja</h3>
                                                <p className="text-[10px] text-slate-500 dark:text-zinc-400">Atur dan kelola tahapan persetujuan kontrak</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Button Simulasi Aktor Modal Trigger */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSimActorSearch('');
                                                    setSimActorModalOpen(true);
                                                }}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-bold transition-all border cursor-pointer select-none",
                                                    (selectedSimInitiator || selectedSimPic || selectedSimCreator)
                                                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs"
                                                        : "bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-700/80 hover:bg-white dark:hover:bg-zinc-700 hover:border-slate-300"
                                                )}
                                                title="Atur Pengguna Simulasi (Inisiator, PIC, Pembuat)"
                                            >
                                                <UsersIcon size={13} className={selectedSimInitiator || selectedSimPic || selectedSimCreator ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500"} />
                                                <span>Aktor Simulasi</span>
                                                {(selectedSimInitiator || selectedSimPic || selectedSimCreator) && (
                                                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-600 text-white font-medium ml-0.5">
                                                        {[selectedSimInitiator && 'Inisiator', selectedSimPic && 'PIC', selectedSimCreator && 'Pembuat'].filter(Boolean).length}
                                                    </span>
                                                )}
                                            </button>

                                            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700 mx-0.5" />

                                            {form.data.steps.length > 0 && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={toggleExpandCollapseAll}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-primary/40 dark:hover:text-primary cursor-pointer"
                                                        title={isAllCollapsed ? 'Buka Semua Tahapan (Expand All)' : 'Tutup Semua Tahapan (Minimize All)'}
                                                    >
                                                        {isAllCollapsed ? <ChevronsDown size={14} /> : <ChevronsUp size={14} />}
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
                                            <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                                {form.data.steps.length} Tahap
                                            </span>
                                        </div>
                                    </div>

                                    {/* Modal Simulasi Aktor Khusus (Inisiator, PIC, Pembuat) */}
                                    <Dialog open={simActorModalOpen} onOpenChange={setSimActorModalOpen}>
                                        <DialogContent className="sm:max-w-3xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-[12px] border p-0 shadow-2xl overflow-hidden">
                                            <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[12px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                                        <UsersIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                                            Pengaturan Aktor Simulasi Alur Kerja
                                                        </DialogTitle>
                                                        <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                                            Pilih pengguna simulasi untuk mengevaluasi peran Inisiator, PIC, atau Pembuat Kontrak
                                                        </DialogDescription>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Role Switcher Subtabs */}
                                            <div className="p-3 bg-slate-50/90 dark:bg-zinc-800/60 border-b border-slate-200/80 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => setSimActorType('initiator')}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                                                        simActorType === 'initiator'
                                                            ? "bg-white dark:bg-zinc-900 border-primary text-primary shadow-xs"
                                                            : "bg-transparent border-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700/50"
                                                    )}
                                                >
                                                    <UsersIcon size={13} className="shrink-0" />
                                                    <div className="flex flex-col text-left">
                                                        <span>Inisiator Kontrak</span>
                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-400 truncate max-w-[120px]">
                                                            {selectedSimInitiator ? selectedSimInitiator.name : 'Semua (Default)'}
                                                        </span>
                                                    </div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setSimActorType('assigned_pic')}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                                                        simActorType === 'assigned_pic'
                                                            ? "bg-white dark:bg-zinc-900 border-emerald-600 text-emerald-700 dark:text-emerald-400 shadow-xs"
                                                            : "bg-transparent border-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700/50"
                                                    )}
                                                >
                                                    <UserCheck size={13} className="shrink-0" />
                                                    <div className="flex flex-col text-left">
                                                        <span>PIC Ditugaskan</span>
                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-400 truncate max-w-[120px]">
                                                            {selectedSimPic ? selectedSimPic.name : 'Belum dipilih'}
                                                        </span>
                                                    </div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setSimActorType('creator')}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                                                        simActorType === 'creator'
                                                            ? "bg-white dark:bg-zinc-900 border-amber-600 text-amber-700 dark:text-amber-400 shadow-xs"
                                                            : "bg-transparent border-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700/50"
                                                    )}
                                                >
                                                    <Bookmark size={13} className="shrink-0" />
                                                    <div className="flex flex-col text-left">
                                                        <span>Pembuat Kontrak</span>
                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-400 truncate max-w-[120px]">
                                                            {selectedSimCreator ? selectedSimCreator.name : 'Belum dipilih'}
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="p-4 bg-slate-50/50 dark:bg-zinc-800/30 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
                                                <div className="relative flex-1">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={simActorSearch}
                                                        onChange={(e) => setSimActorSearch(e.target.value)}
                                                        placeholder={`Cari pengguna untuk ${simActorType === 'initiator' ? 'Inisiator' : simActorType === 'assigned_pic' ? 'PIC' : 'Pembuat'}...`}
                                                        className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg outline-none focus:border-primary transition-all text-slate-800 dark:text-zinc-200"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                                                    {filteredSimActorUsers.length} Pengguna
                                                </div>
                                            </div>

                                            <div className="p-4 max-h-[55vh] overflow-y-auto space-y-2">
                                                {filteredSimActorUsers.length === 0 ? (
                                                    <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
                                                        <UsersIcon size={28} className="mx-auto mb-2 opacity-30" />
                                                        <p className="text-xs font-medium">Tidak ada data pengguna yang cocok.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                        {filteredSimActorUsers.map((u: any) => {
                                                            const currentSelectedId =
                                                                simActorType === 'initiator'
                                                                    ? simInitiatorId
                                                                    : simActorType === 'assigned_pic'
                                                                    ? simPicId
                                                                    : simCreatorId;
                                                            const isSelected = String(u.id) === String(currentSelectedId);

                                                            return (
                                                                <div
                                                                    key={u.id}
                                                                    onClick={() => {
                                                                        if (simActorType === 'initiator') {
                                                                            setSimInitiatorId(isSelected ? '' : String(u.id));
                                                                        } else if (simActorType === 'assigned_pic') {
                                                                            setSimPicId(isSelected ? '' : String(u.id));
                                                                        } else {
                                                                            setSimCreatorId(isSelected ? '' : String(u.id));
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer shadow-2xs",
                                                                        isSelected
                                                                            ? "bg-primary/5 border-primary ring-2 ring-primary/20 dark:bg-primary/10"
                                                                            : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-primary/50 hover:bg-slate-50/80 dark:hover:bg-zinc-800/80"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="font-bold text-xs text-slate-800 dark:text-zinc-100 truncate flex items-center gap-1.5">
                                                                            {isSelected && <Check size={14} className="text-primary shrink-0" />}
                                                                            <span className="truncate">{u.name}</span>
                                                                        </div>
                                                                        {u.role && (
                                                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                                                                                {u.role}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                                                        {u.email}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                                                                        {(u.company?.name || u.company_name) && (
                                                                            <span className="font-semibold text-slate-700 dark:text-zinc-300">{u.company?.name || u.company_name}</span>
                                                                        )}
                                                                        {(u.department?.name || u.org_name) && (
                                                                            <>
                                                                                <span>•</span>
                                                                                <span>{u.department?.name || u.org_name}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <DialogFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={() => {
                                                            if (simActorType === 'initiator') setSimInitiatorId('');
                                                            else if (simActorType === 'assigned_pic') setSimPicId('');
                                                            else setSimCreatorId('');
                                                        }}
                                                        className="h-8 text-xs font-semibold px-3 rounded-lg"
                                                    >
                                                        Reset {simActorType === 'initiator' ? 'Inisiator' : simActorType === 'assigned_pic' ? 'PIC' : 'Pembuat'}
                                                    </Button>
                                                    {(simInitiatorId || simPicId || simCreatorId) && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSimInitiatorId('');
                                                                setSimPicId('');
                                                                setSimCreatorId('');
                                                            }}
                                                            className="h-8 text-xs font-semibold px-3 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                        >
                                                            Reset Semua
                                                        </Button>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={() => setSimActorModalOpen(false)}
                                                    className="h-8 text-xs font-bold px-4 rounded-lg"
                                                >
                                                    Selesai
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

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
                                                            simulationContext={simulationContext}
                                                            onOpenSimulationModal={() => {
                                                                setSimActorType('initiator');
                                                                setSimActorSearch('');
                                                                setSimActorModalOpen(true);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    )}

                                    {/* Tambah Step button placed inside Tahapan Alur Kerja Card */}
                                    {/* Triple Direct Buttons: Tambah Tahap Default, Template Standar, & Gunakan Preset */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 pb-1 border-t border-slate-100 dark:border-zinc-800">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={addLocalStep}
                                            className="h-10 text-xs font-medium gap-2 shadow-2xs cursor-pointer"
                                        >
                                            <PlusCircle size={15} />
                                            <span>Tambah Tahap Default</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setBuiltinTemplateModalOpen(true)}
                                            className="h-10 text-xs font-medium gap-2 justify-between px-3.5 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-2xs cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <LayoutTemplate size={15} className="text-primary shrink-0" />
                                                <span className="truncate">Template Standar</span>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium shrink-0">
                                                {BUILTIN_STEP_TEMPLATES.length}
                                            </span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setPresetSelectModalOpen(true)}
                                            className="h-10 text-xs font-medium gap-2 justify-between px-3.5 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-2xs cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <Bookmark size={15} className="text-primary shrink-0" />
                                                <span className="truncate">Preset Tersimpan</span>
                                            </div>
                                            {presets.length > 0 && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium shrink-0">
                                                    {presets.length}
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                        )}
                        {mainTab === 'visualizer' && (
                            <div className="p-1">
                                <WorkflowFlowVisualizer
                                    steps={form.data.steps}
                                    workflow={workflow}
                                    users={users}
                                    roles={roles}
                                    departments={departments}
                                    divisions={divisions}
                                    companyGroups={companyGroups}
                                    companies={companies}
                                    regions={regions}
                                    simulationContext={simulationContext}
                                    onOpenSimulationModal={() => {
                                        setSimActorSearch('');
                                        setSimActorModalOpen(true);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </ManagementForm>
            </div>
        </div>

        {/* --- Modal Pilih Template Tahapan Standar Bawaan --- */}
        <Modal
            isOpen={builtinTemplateModalOpen}
            onClose={() => setBuiltinTemplateModalOpen(false)}
            title={
                <div className="flex items-center gap-2">
                    <LayoutTemplate size={18} className="text-primary" />
                    <span>Pilih Template Standar</span>
                </div>
            }
            description="Pilih salah satu template tahapan bawaan sistem untuk disisipkan langsung ke alur kerja ini."
            maxWidth="4xl"
        >
            <div className="space-y-3.5">
                {/* Search Bar Template */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Cari template standar (misal: Legal, Atasan, PIC, Signer, Finance)..."
                        className="w-full h-9 pl-9 pr-4 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
                    />
                </div>

                {filteredBuiltinTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                        <Search size={24} className="text-slate-300 dark:text-zinc-700 mb-2" />
                        <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Template Tidak Ditemukan</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Tidak ada template yang cocok dengan kata kunci "{templateSearch}".
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto p-0.5 custom-scrollbar">
                        {filteredBuiltinTemplates.map((tpl) => {
                            const stepData = tpl.step_data || {};
                            return (
                                <div
                                    key={tpl.id}
                                    className="group border border-slate-200/80 dark:border-zinc-800 hover:border-primary/60 bg-white dark:bg-zinc-900 rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs"
                                >
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-foreground truncate">
                                                {tpl.name}
                                            </span>
                                            <span className="text-[9px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md shrink-0">
                                                {tpl.category}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                            {tpl.description}
                                        </span>

                                        {/* Action Step Pills Preview */}
                                        {stepData.actions && stepData.actions.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/40">
                                                {stepData.actions.map((act: any, aIdx: number) => {
                                                    const actName = act.name || act.action_code || `Aksi ${aIdx + 1}`;
                                                    const isApprove = act.action_code === 'approve' || actName.toLowerCase().includes('setuju');
                                                    const isReject = act.action_code === 'reject' || actName.toLowerCase().includes('tolak');

                                                    return (
                                                        <span
                                                            key={aIdx}
                                                            className={cn(
                                                                'text-[9px] font-medium px-1.5 py-0.5 rounded-md border tracking-tight',
                                                                isApprove && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40',
                                                                isReject && 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40',
                                                                !isApprove && !isReject && 'bg-muted text-muted-foreground border-border'
                                                            )}
                                                        >
                                                            {actName}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={() => {
                                                const newStep = {
                                                    ...JSON.parse(JSON.stringify(tpl.step_data)),
                                                    id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                                    step: form.data.steps.length + 1,
                                                };
                                                form.setData('steps', [...form.data.steps, newStep]);
                                                setBuiltinTemplateModalOpen(false);
                                                showToast(`Tahap "${tpl.name}" berhasil ditambahkan!`, 'success');
                                            }}
                                            className="w-full h-7.5 text-xs font-medium"
                                        >
                                            + Sisipkan Template
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBuiltinTemplateModalOpen(false)}
                        className="h-8 px-4 text-xs font-medium"
                    >
                        Tutup
                    </Button>
                </div>
            </div>
        </Modal>

        {/* --- Custom Modal Pilih Preset yang Tersimpan (Lebar & Modern) --- */}
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
            maxWidth="4xl"
        >
            <div className="space-y-3.5">
                {/* Search Bar Preset */}
                {presets.length > 0 && (
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={presetSearch}
                            onChange={(e) => setPresetSearch(e.target.value)}
                            placeholder="Cari nama preset atau deskripsi tahapan..."
                            className="w-full h-9 pl-9 pr-4 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
                        />
                    </div>
                )}

                {presets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                        <Bookmark size={28} className="text-slate-300 dark:text-zinc-700 mb-2" />
                        <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Belum Ada Preset Tersimpan</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Anda belum menyimpan preset tahapan apa pun ke database server.
                        </p>
                    </div>
                ) : filteredPresets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                        <Search size={24} className="text-slate-300 dark:text-zinc-700 mb-2" />
                        <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Preset Tidak Ditemukan</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Tidak ada preset yang cocok dengan kata kunci "{presetSearch}".
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto p-0.5 custom-scrollbar">
                        {filteredPresets.map((preset) => {
                            const stepData = preset.step_data || {};
                            return (
                                <div
                                    key={preset.id}
                                    className="group border border-slate-200/80 dark:border-zinc-800 hover:border-primary/60 bg-white dark:bg-zinc-900 rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs"
                                >
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-foreground truncate">
                                                {preset.name}
                                            </span>
                                            <span className="text-[9px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-md shrink-0">
                                                Preset
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                            {stepData.description || stepData.name || stepData.label || `Role: ${stepData.approver_type || 'Custom'}`}
                                        </span>

                                        {/* Action Step Pills Preview */}
                                        {stepData.actions && stepData.actions.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/40">
                                                {stepData.actions.map((act: any, aIdx: number) => {
                                                    const actName = act.master_action?.name || act.master_action_name || act.label || `Action ${aIdx + 1}`;
                                                    const isApprove = actName.toLowerCase().includes('setuju') || actName.toLowerCase().includes('approve');
                                                    const isReject = actName.toLowerCase().includes('tolak') || actName.toLowerCase().includes('reject');

                                                    return (
                                                        <span
                                                            key={aIdx}
                                                            className={cn(
                                                                'text-[9px] font-medium px-1.5 py-0.5 rounded-md border tracking-tight',
                                                                isApprove && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40',
                                                                isReject && 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40',
                                                                !isApprove && !isReject && 'bg-muted text-muted-foreground border-border'
                                                            )}
                                                        >
                                                            {actName}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                                        <Button
                                            type="button"
                                            variant="primary"
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
                                            className="flex-1 h-7.5 text-xs font-medium"
                                        >
                                            + Sisipkan
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditPreset(preset);
                                            }}
                                            className="h-7.5 w-7.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                                            title="Ubah Preset"
                                        >
                                            <Pencil size={12} />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPresetSelectModalOpen(false)}
                        className="h-8 px-4 text-xs font-medium"
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
