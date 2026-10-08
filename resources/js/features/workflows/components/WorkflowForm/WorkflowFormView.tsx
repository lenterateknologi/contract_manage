import { workflowsApi } from '../../services/workflowService';
import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Modal } from '@/components/ui/dialogs/Modal';
import { useToast } from '@/components/ui/feedback/Toast';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { cn } from '@/lib/utils';
import { FormSection, ManagementForm } from '@/features/admin/components/ManagementForm';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AuthorityTableManager from '../Authority/AuthorityTableManager';
import ContractTypeTableManager from './ContractTypeTableManager';

const {
    Activity,
    ArrowDown,
    ArrowUp,
    Bookmark,
    Check,
    CheckCircle2,
    CheckSquare2,
    ChevronsDown,
    ChevronsUp,
    Edit3,
    GitBranch,
    GitFork,
    Layers,
    LayoutTemplate,
    MinusSquare,
    Pencil,
    PlusCircle,
    Search,
    Sliders,
    Square,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
} = Icons;
const UsersIcon = Users;

import { CustomActionsManager } from './CustomActionsManager';
import SortableStepItem from './SortableStepItem';
import { WorkflowFlowVisualizer } from './WorkflowFlowVisualizer';
import { BUILTIN_STEP_TEMPLATES, MASTER_ACTIONS } from '../../utils/constants';

// --- Sortable Step Item (Compact) ---

// --- Main Workflow Editor Page ---
export default function WorkflowEditor({
    workflow,
    contractTypes,
    departments,
    divisions = [],
    roles,
    users,
    contractStatuses,
    companyGroups = [],
    organizationGroups = [],
    regions = [],
    companies = [],
    locations = [],
    allWorkflows = [],
    masterWorkflows = [],
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
                t.step_data.description.toLowerCase().includes(q),
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

    const [mainTab, setMainTab] = useState<'settings' | 'categories' | 'authorities' | 'steps' | 'visualizer' | 'custom_actions'>(() => {
        if (typeof window !== 'undefined') {
            const tab = new URLSearchParams(window.location.search).get('tab');
            if (
                tab === 'settings' ||
                tab === 'categories' ||
                tab === 'authorities' ||
                tab === 'steps' ||
                tab === 'visualizer' ||
                tab === 'custom_actions'
            )
                return tab;
        }
        return 'settings';
    });

    const handleTabChange = (tab: 'settings' | 'categories' | 'authorities' | 'steps' | 'visualizer' | 'custom_actions') => {
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
        workflow_type: workflow?.workflow_type || 'standalone',
        parent_workflow_id: workflow?.parent_workflow_id || '',
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
        steps:
            (workflow?.steps || []).map((s: any) => {
                const hasRoles = s.role && s.role.length > 0;
                const hasDepts = s.department_ids && s.department_ids.length > 0;
                const hasUsers = s.user_ids && s.user_ids.length > 0;
                const config = s.approver_config || {};

                return {
                    ...s,
                    approver_authorities: s.approver_authorities || [],
                    approver_config: {
                        custom: config.custom || [],
                        roles: config.roles && config.roles.length > 0 ? config.roles : s.approver_type === 'role' && hasRoles ? s.role : [],
                        departments:
                            config.departments && config.departments.length > 0
                                ? config.departments
                                : s.approver_type === 'role' && hasDepts
                                  ? s.department_ids
                                  : [],
                        users: config.users && config.users.length > 0 ? config.users : s.approver_type === 'user' && hasUsers ? s.user_ids : [],
                        is_default: config.is_default !== undefined ? config.is_default : false,
                    },
                };
            }) || [],
        department_id: workflow?.department_id || null,
        company_group_ids: (workflow?.company_group_ids || []).map((i: any) =>
            typeof i === 'object' ? i : { value: String(i), is_initiator: false },
        ),
        region_ids: (workflow?.region_ids || []).map((i: any) => (typeof i === 'object' ? i : { value: String(i), is_initiator: false })),
        company_ids: (workflow?.company_ids || []).map((i: any) => (typeof i === 'object' ? i : { value: String(i), is_initiator: false })),
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

    // State Simulasi Aktor Khusus (Inisiator, PIC Ditugaskan, Pembuat Kontrak, Approver Tambahan)
    const [simActorModalOpen, setSimActorModalOpen] = useState(false);
    const [simActorType, setSimActorType] = useState<'initiator' | 'assigned_pic' | 'creator' | 'adhoc_approvers'>('initiator');
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

    const [simAdhocIds, setSimAdhocIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(`${SIM_STORAGE_KEY}_adhoc`);
            if (!saved) return [];
            try {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : [saved];
            } catch {
                return [saved];
            }
        } catch {
            return [];
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
        } catch {
            // ignore
        }
    }, [simInitiatorId, SIM_STORAGE_KEY]);

    useEffect(() => {
        try {
            if (simPicId) {
                localStorage.setItem(`${SIM_STORAGE_KEY}_pic`, simPicId);
            } else {
                localStorage.removeItem(`${SIM_STORAGE_KEY}_pic`);
            }
        } catch {
            // ignore
        }
    }, [simPicId, SIM_STORAGE_KEY]);

    useEffect(() => {
        try {
            if (simCreatorId) {
                localStorage.setItem(`${SIM_STORAGE_KEY}_creator`, simCreatorId);
            } else {
                localStorage.removeItem(`${SIM_STORAGE_KEY}_creator`);
            }
        } catch {
            // ignore
        }
    }, [simCreatorId, SIM_STORAGE_KEY]);

    useEffect(() => {
        try {
            if (simAdhocIds && simAdhocIds.length > 0) {
                localStorage.setItem(`${SIM_STORAGE_KEY}_adhoc`, JSON.stringify(simAdhocIds));
            } else {
                localStorage.removeItem(`${SIM_STORAGE_KEY}_adhoc`);
            }
        } catch {
            // ignore
        }
    }, [simAdhocIds, SIM_STORAGE_KEY]);

    const allUsersList = useMemo(() => {
        return (users || []).filter((u: any) => {
            // User aktif jika is_used !== false, !== 0, !== '0', !== null/undefined (atau secara eksplisit true/1)
            if (u.is_used === false || u.is_used === 0 || String(u.is_used) === '0' || String(u.is_used) === 'false') {
                return false;
            }
            return Boolean(
                u.is_used === true || u.is_used === 1 || String(u.is_used) === '1' || String(u.is_used) === 'true' || u.is_used !== undefined,
            );
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
    const simulationContext = useMemo(
        () => ({
            initiatorId: simInitiatorId || undefined,
            picId: simPicId || undefined,
            creatorId: simCreatorId || undefined,
            adhocId: simAdhocIds[0] || undefined,
            adhocIds: simAdhocIds.length > 0 ? simAdhocIds : undefined,
        }),
        [simInitiatorId, simPicId, simCreatorId, simAdhocIds],
    );

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

    const selectedSimAdhocUsers = useMemo(() => {
        return allUsersList.filter((u: any) => simAdhocIds.includes(String(u.id)));
    }, [simAdhocIds, allUsersList]);

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
        const normalized = filtered.map((item: any, index: number) => {
            const updatedActions = (item.actions || []).map((act: any) => {
                if (
                    act.transition_config?.type === 'absolute' &&
                    (selectedStepIds.has(act.transition_config?.step_id) || selectedStepIds.has(act.next_step_id))
                ) {
                    return {
                        ...act,
                        transition_config: {
                            ...act.transition_config,
                            step_id: null,
                            sequence: null,
                        },
                        next_step_id: null,
                    };
                }
                return act;
            });
            return {
                ...item,
                step: index + 1,
                actions: updatedActions,
            };
        });
        form.setData('steps', normalized);
        clearSelection();
    };

    const bulkMoveSelected = useCallback(
        (direction: 'up' | 'down') => {
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
        },
        [selectedStepIds, form],
    );

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

    const [isSaving, setIsSaving] = useState<boolean>(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSaving || form.processing) return;

        setIsSaving(true);
        try {
            if (workflow) {
                const res: any = await workflowsApi.update(workflow.id, form.data);
                if (res) {
                    showToast(res?.message || 'Konfigurasi alur berhasil disimpan', 'success');
                }
            } else {
                const res: any = await workflowsApi.create(form.data);
                if (res) {
                    showToast(res?.message || 'Workflow baru berhasil dibuat', 'success');
                    const newId = res?.data?.id || res?.id;
                    if (newId) {
                        router.visit(route('admin.workflows.edit', newId));
                    } else {
                        router.visit(route('admin.workflows'));
                    }
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Gagal menyimpan alur';
            showToast(msg, 'danger');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Head title={workflow ? 'Edit Workflow' : 'Registrasi Workflow Baru'} />

            <div className="bg-background m-0 flex h-svh max-h-svh w-full flex-col overflow-hidden p-0">
                <div className="bg-background flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none border-0 shadow-none">
                    <ManagementForm
                        title={workflow ? `Konfigurasi tahapan untuk ${form.data.name}` : 'Konfigurasi Tahapan Workflow Baru'}
                        onClose={() => router.visit(route('admin.workflows'))}
                        onSave={handleSubmit}
                        processing={isSaving || form.processing}
                        isDirty={form.isDirty}
                        isEdit={!!workflow}
                        flat={true}
                        tabs={
                            <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 dark:border-zinc-700/80 dark:bg-zinc-800/90">
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('settings')}
                                    className={cn(
                                        'cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition-all select-none',
                                        mainTab === 'settings'
                                            ? 'bg-primary font-bold text-white shadow-xs'
                                            : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                                    )}
                                >
                                    Pengaturan Workflow
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('categories')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all select-none',
                                        mainTab === 'categories'
                                            ? 'bg-primary font-bold text-white shadow-xs'
                                            : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                                    )}
                                >
                                    Kategori Kontrak
                                    <span
                                        className={cn(
                                            'py-0.2 rounded-full px-1.5 text-[10px] transition-colors',
                                            mainTab === 'categories'
                                                ? 'bg-white/20 font-bold text-white'
                                                : 'bg-slate-200/50 font-medium text-slate-600 dark:bg-zinc-800/50 dark:text-zinc-400',
                                        )}
                                    >
                                        {(form.data.contract_type_ids || []).length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('authorities')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all select-none',
                                        mainTab === 'authorities'
                                            ? 'bg-primary font-bold text-white shadow-xs'
                                            : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                                    )}
                                >
                                    Otoritas Inisiator
                                    <span
                                        className={cn(
                                            'py-0.2 rounded-full px-1.5 text-[10px] transition-colors',
                                            mainTab === 'authorities'
                                                ? 'bg-white/20 font-bold text-white'
                                                : 'bg-slate-200/50 font-medium text-slate-600 dark:bg-zinc-800/50 dark:text-zinc-400',
                                        )}
                                    >
                                        {(form.data.initiator_authorities || []).length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('steps')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all select-none',
                                        mainTab === 'steps'
                                            ? 'bg-primary font-bold text-white shadow-xs'
                                            : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                                    )}
                                >
                                    Tahapan Workflow
                                    <span
                                        className={cn(
                                            'py-0.2 rounded-full px-1.5 text-[10px] transition-colors',
                                            mainTab === 'steps'
                                                ? 'bg-white/20 font-bold text-white'
                                                : 'bg-slate-200/50 font-medium text-slate-600 dark:bg-zinc-800/50 dark:text-zinc-400',
                                        )}
                                    >
                                        {form.data.steps.length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('visualizer')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all select-none',
                                        mainTab === 'visualizer'
                                            ? 'bg-primary font-bold text-white shadow-xs'
                                            : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                                    )}
                                >
                                    <Activity size={13} />
                                    Visualisasi Diagram
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('custom_actions')}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all select-none',
                                        mainTab === 'custom_actions'
                                            ? 'bg-primary font-bold text-white shadow-xs'
                                            : 'font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                                    )}
                                >
                                    <Sliders size={13} />
                                    Aksi Kustom / Default
                                    <span
                                        className={cn(
                                            'py-0.2 rounded-full px-1.5 text-[10px] transition-colors',
                                            mainTab === 'custom_actions'
                                                ? 'bg-white/20 font-bold text-white'
                                                : 'bg-slate-200/50 font-medium text-slate-600 dark:bg-zinc-800/50 dark:text-zinc-400',
                                        )}
                                    >
                                        {(form.data.meta?.custom_actions || []).length}
                                    </span>
                                </button>
                            </div>
                        }
                        headerActions={
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={addLocalStep}
                                    variant="ghost"
                                    className="border-primary/20 hover:bg-primary/5 h-9 cursor-pointer rounded-lg border px-4 text-xs font-bold transition-all active:scale-95"
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
                                            <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase dark:text-slate-200">
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

                                            {/* Row 1.5: Deskripsi Alur Kerja */}
                                            <div className="w-full">
                                                <FormTextarea
                                                    label="Deskripsi Alur Kerja"
                                                    rows={3}
                                                    value={form.data.description}
                                                    onChange={(e) => form.setData('description', e.target.value)}
                                                    error={form.errors.description}
                                                    placeholder="Jelaskan ringkasan alur kerja, tujuan, dan peruntukannya..."
                                                    inputSize="compact"
                                                />
                                            </div>

                                            {/* Row 2: Tipe Alur Kerja (Workflow Type) */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                                    Tipe & Hierarki Alur Kerja
                                                </label>
                                                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                                                    <div
                                                        onClick={() => {
                                                            form.setData((prev: any) => ({
                                                                ...prev,
                                                                workflow_type: 'main',
                                                                parent_workflow_id: '',
                                                            }));
                                                        }}
                                                        className={cn(
                                                            'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-all',
                                                            form.data.workflow_type === 'main'
                                                                ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 dark:bg-blue-950/30'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900',
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                                                                <GitBranch size={14} />
                                                                <span>Workflow Utama (Master)</span>
                                                            </div>
                                                            {form.data.workflow_type === 'main' && (
                                                                <CheckCircle2 size={14} className="text-blue-600" />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                                                            Orchestrator utama yang menghubungkan beberapa sub-alur kerja lintas tahapan.
                                                        </p>
                                                    </div>

                                                    <div
                                                        onClick={() => {
                                                            form.setData('workflow_type', 'sub_workflow');
                                                        }}
                                                        className={cn(
                                                            'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-all',
                                                            form.data.workflow_type === 'sub_workflow'
                                                                ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500 dark:bg-purple-950/30'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900',
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400">
                                                                <GitFork size={14} />
                                                                <span>Workflow Bagian (Sub-WF)</span>
                                                            </div>
                                                            {form.data.workflow_type === 'sub_workflow' && (
                                                                <CheckCircle2 size={14} className="text-purple-600" />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                                                            Bagian modul spesifik yang dipanggil atau menjadi cabang dari workflow utama.
                                                        </p>
                                                    </div>

                                                    <div
                                                        onClick={() => {
                                                            form.setData((prev: any) => ({
                                                                ...prev,
                                                                workflow_type: 'standalone',
                                                                parent_workflow_id: '',
                                                            }));
                                                        }}
                                                        className={cn(
                                                            'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-all',
                                                            form.data.workflow_type === 'standalone' || !form.data.workflow_type
                                                                ? 'border-slate-600 bg-slate-50/70 ring-1 ring-slate-600 dark:border-zinc-500 dark:bg-zinc-800/50 dark:ring-zinc-500'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900',
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
                                                                <Activity size={14} />
                                                                <span>Workflow Standar</span>
                                                            </div>
                                                            {(form.data.workflow_type === 'standalone' || !form.data.workflow_type) && (
                                                                <CheckCircle2 size={14} className="text-slate-700 dark:text-zinc-300" />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                                                            Alur mandiri independen yang berjalan sendiri tanpa relasi master-sub.
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* If Sub-Workflow selected: Show Parent Master Workflow Picker */}
                                                {form.data.workflow_type === 'sub_workflow' && (
                                                    <div className="mt-3 space-y-1.5 rounded-lg border border-purple-200/80 bg-purple-50/40 p-3 dark:border-purple-800/50 dark:bg-purple-950/20">
                                                        <label className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 dark:text-purple-300">
                                                            <Layers size={13} />
                                                            Pilih Workflow Utama (Induk / Orchestrator):
                                                        </label>
                                                        <Select
                                                            value={form.data.parent_workflow_id || ''}
                                                            onValueChange={(val) => form.setData('parent_workflow_id', val)}
                                                        >
                                                            <SelectTrigger className="w-full border-purple-200 bg-white text-xs dark:border-purple-800 dark:bg-zinc-900">
                                                                <SelectValue placeholder="-- Pilih Workflow Induk --" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {masterWorkflows
                                                                    .filter((mw: any) => mw.id !== workflow?.id)
                                                                    .map((mw: any) => (
                                                                        <SelectItem key={mw.id} value={mw.id} className="text-xs">
                                                                            {mw.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-[10px] text-purple-600 dark:text-purple-400">
                                                            Menghubungkan alur kerja bagian ini ke Orchestrator untuk tracking dan visualisasi
                                                            terpadu.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Row 3: Checkboxes */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50/40 px-3.5 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                                                    <Checkbox
                                                        id="is_default"
                                                        checked={form.data.is_default}
                                                        onCheckedChange={(c) => form.setData('is_default', !!c)}
                                                        className="h-4 w-4 rounded"
                                                    />
                                                    <label
                                                        htmlFor="is_default"
                                                        className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                                                    >
                                                        Alur Utama (Default)
                                                    </label>
                                                </div>

                                                <div className="flex items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50/40 px-3.5 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                                                    <Checkbox
                                                        id="is_selectable"
                                                        checked={form.data.is_selectable}
                                                        onCheckedChange={(c) => form.setData('is_selectable', !!c)}
                                                        className="h-4 w-4 rounded"
                                                    />
                                                    <label
                                                        htmlFor="is_selectable"
                                                        className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                                                    >
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
                                        locations={locations}
                                        companyGroups={companyGroups}
                                        organizationGroups={organizationGroups}
                                        companies={companies}
                                        regions={regions}
                                        showInitiatorOption={false}
                                    />
                                </FormSection>
                            )}
                            {mainTab === 'steps' && (
                                <div className="flex w-full min-w-0 flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/90">
                                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 text-primary shrink-0 rounded-lg p-1.5">
                                                <GitBranch size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-xs font-bold tracking-wide text-slate-800 uppercase dark:text-zinc-100">
                                                    Tahapan Alur Kerja
                                                </h3>
                                                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                                                    Atur dan kelola tahapan persetujuan kontrak
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Button Simulasi Aktor Modal Trigger */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSimActorSearch('');
                                                    setSimActorModalOpen(true);
                                                }}
                                                className={cn(
                                                    'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all select-none',
                                                    selectedSimInitiator || selectedSimPic || selectedSimCreator || selectedSimAdhocUsers.length > 0
                                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-2xs dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                                                        : 'border-slate-200/80 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700',
                                                )}
                                                title="Atur Pengguna Simulasi (Inisiator, PIC, Pembuat, Approver Tambahan)"
                                            >
                                                <UsersIcon
                                                    size={13}
                                                    className={
                                                        selectedSimInitiator ||
                                                        selectedSimPic ||
                                                        selectedSimCreator ||
                                                        selectedSimAdhocUsers.length > 0
                                                            ? 'text-indigo-600 dark:text-indigo-400'
                                                            : 'text-slate-400 dark:text-zinc-500'
                                                    }
                                                />
                                                <span>Aktor Simulasi</span>
                                                {(selectedSimInitiator ||
                                                    selectedSimPic ||
                                                    selectedSimCreator ||
                                                    selectedSimAdhocUsers.length > 0) && (
                                                    <span className="ml-0.5 flex items-center gap-1 rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                        {
                                                            [
                                                                selectedSimInitiator && 'Inisiator',
                                                                selectedSimPic && 'PIC',
                                                                selectedSimCreator && 'Pembuat',
                                                                selectedSimAdhocUsers.length > 0 && 'Ad-Hoc',
                                                            ].filter(Boolean).length
                                                        }
                                                    </span>
                                                )}
                                            </button>

                                            <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-zinc-700" />

                                            {form.data.steps.length > 0 && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={toggleExpandCollapseAll}
                                                        className="hover:border-primary/40 hover:bg-primary/10 hover:text-primary dark:hover:border-primary/40 dark:hover:text-primary flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                                        title={
                                                            isAllCollapsed ? 'Buka Semua Tahapan (Expand All)' : 'Tutup Semua Tahapan (Minimize All)'
                                                        }
                                                    >
                                                        {isAllCollapsed ? <ChevronsDown size={14} /> : <ChevronsUp size={14} />}
                                                    </button>
                                                    <div className="mx-0.5 h-3 w-px bg-slate-200 dark:bg-zinc-700" />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            selectedStepIds.size === form.data.steps.length ? clearSelection() : selectAllSteps()
                                                        }
                                                        className="hover:text-primary flex items-center gap-1 text-[10px] font-medium text-slate-400 transition-colors"
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
                                            <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px] font-medium">
                                                {form.data.steps.length} Tahap
                                            </span>
                                        </div>
                                    </div>

                                    {/* Modal Simulasi Aktor Khusus (Inisiator, PIC, Pembuat, Approver Tambahan) */}
                                    <Dialog open={simActorModalOpen} onOpenChange={setSimActorModalOpen}>
                                        <DialogContent className="overflow-hidden rounded-[12px] border border-slate-200/80 bg-white p-0 text-slate-800 shadow-2xl sm:max-w-3xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                                            <div className="border-primary/20 bg-primary flex items-center justify-between rounded-t-[12px] border-b px-6 py-4 text-white dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/20 text-white">
                                                        <UsersIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                                            Pengaturan Aktor Simulasi Alur Kerja
                                                        </DialogTitle>
                                                        <DialogDescription className="mt-0.5 text-xs font-medium text-white/80 dark:text-zinc-400">
                                                            Pilih pengguna simulasi untuk mengevaluasi peran Inisiator, PIC, Pembuat Kontrak, atau
                                                            Approver Tambahan
                                                        </DialogDescription>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Role Switcher Subtabs */}
                                            <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 bg-slate-50/90 p-3 dark:border-zinc-800 dark:bg-zinc-800/60">
                                                <button
                                                    type="button"
                                                    onClick={() => setSimActorType('initiator')}
                                                    className={cn(
                                                        'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                                                        simActorType === 'initiator'
                                                            ? 'border-primary text-primary bg-white shadow-xs dark:bg-zinc-900'
                                                            : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/50',
                                                    )}
                                                >
                                                    <UsersIcon size={13} className="shrink-0" />
                                                    <div className="flex flex-col text-left">
                                                        <span>Inisiator</span>
                                                        <span className="max-w-[100px] truncate text-[10px] font-medium text-slate-400 dark:text-zinc-400">
                                                            {selectedSimInitiator ? selectedSimInitiator.name : 'Semua'}
                                                        </span>
                                                    </div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setSimActorType('assigned_pic')}
                                                    className={cn(
                                                        'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                                                        simActorType === 'assigned_pic'
                                                            ? 'border-emerald-600 bg-white text-emerald-700 shadow-xs dark:bg-zinc-900 dark:text-emerald-400'
                                                            : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/50',
                                                    )}
                                                >
                                                    <UserCheck size={13} className="shrink-0" />
                                                    <div className="flex flex-col text-left">
                                                        <span>PIC Ditugaskan</span>
                                                        <span className="max-w-[100px] truncate text-[10px] font-medium text-slate-400 dark:text-zinc-400">
                                                            {selectedSimPic ? selectedSimPic.name : 'Belum dipilih'}
                                                        </span>
                                                    </div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setSimActorType('creator')}
                                                    className={cn(
                                                        'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                                                        simActorType === 'creator'
                                                            ? 'border-amber-600 bg-white text-amber-700 shadow-xs dark:bg-zinc-900 dark:text-amber-400'
                                                            : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/50',
                                                    )}
                                                >
                                                    <Bookmark size={13} className="shrink-0" />
                                                    <div className="flex flex-col text-left">
                                                        <span>Pembuat</span>
                                                        <span className="max-w-[100px] truncate text-[10px] font-medium text-slate-400 dark:text-zinc-400">
                                                            {selectedSimCreator ? selectedSimCreator.name : 'Belum dipilih'}
                                                        </span>
                                                    </div>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setSimActorType('adhoc_approvers')}
                                                    className={cn(
                                                        'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all',
                                                        simActorType === 'adhoc_approvers'
                                                            ? 'border-indigo-600 bg-white text-indigo-700 shadow-xs dark:bg-zinc-900 dark:text-indigo-400'
                                                            : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/50',
                                                    )}
                                                >
                                                    <UserPlus size={13} className="shrink-0" />
                                                    <div className="flex flex-col text-left">
                                                        <span>Approver Tambahan</span>
                                                        <span className="max-w-[100px] truncate text-[10px] font-medium text-slate-400 dark:text-zinc-400">
                                                            {selectedSimAdhocUsers.length > 0
                                                                ? `${selectedSimAdhocUsers.length} Dipilih`
                                                                : 'Belum dipilih'}
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                                                <div className="relative flex-1">
                                                    <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={simActorSearch}
                                                        onChange={(e) => setSimActorSearch(e.target.value)}
                                                        placeholder={`Cari pengguna untuk ${simActorType === 'initiator' ? 'Inisiator' : simActorType === 'assigned_pic' ? 'PIC' : simActorType === 'creator' ? 'Pembuat' : 'Approver Tambahan (Bisa Multi)'}...`}
                                                        className="focus:border-primary h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-xs text-slate-800 transition-all outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                    {filteredSimActorUsers.length} Pengguna
                                                </div>
                                            </div>

                                            <div className="max-h-[55vh] space-y-2 overflow-y-auto p-4">
                                                {filteredSimActorUsers.length === 0 ? (
                                                    <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
                                                        <UsersIcon size={28} className="mx-auto mb-2 opacity-30" />
                                                        <p className="text-xs font-medium">Tidak ada data pengguna yang cocok.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                                                        {filteredSimActorUsers.map((u: any) => {
                                                            const isAdhocMode = simActorType === 'adhoc_approvers';
                                                            const isSelected = isAdhocMode
                                                                ? simAdhocIds.includes(String(u.id))
                                                                : String(u.id) ===
                                                                  String(
                                                                      simActorType === 'initiator'
                                                                          ? simInitiatorId
                                                                          : simActorType === 'assigned_pic'
                                                                            ? simPicId
                                                                            : simCreatorId,
                                                                  );

                                                            return (
                                                                <div
                                                                    key={u.id}
                                                                    onClick={() => {
                                                                        if (simActorType === 'initiator') {
                                                                            setSimInitiatorId(isSelected ? '' : String(u.id));
                                                                        } else if (simActorType === 'assigned_pic') {
                                                                            setSimPicId(isSelected ? '' : String(u.id));
                                                                        } else if (simActorType === 'creator') {
                                                                            setSimCreatorId(isSelected ? '' : String(u.id));
                                                                        } else {
                                                                            const uIdStr = String(u.id);
                                                                            setSimAdhocIds((prev) =>
                                                                                prev.includes(uIdStr)
                                                                                    ? prev.filter((id) => id !== uIdStr)
                                                                                    : [...prev, uIdStr],
                                                                            );
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        'flex cursor-pointer flex-col justify-between gap-1.5 rounded-xl border p-3 shadow-2xs transition-all',
                                                                        isSelected
                                                                            ? 'bg-primary/5 border-primary ring-primary/20 dark:bg-primary/10 ring-2'
                                                                            : 'hover:border-primary/50 border-slate-200/80 bg-white hover:bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80',
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-800 dark:text-zinc-100">
                                                                            {isSelected && <Check size={14} className="text-primary shrink-0" />}
                                                                            <span className="truncate">{u.name}</span>
                                                                        </div>
                                                                        {u.role && (
                                                                            <span className="text-primary bg-primary/10 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold">
                                                                                {u.role}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
                                                                        {u.email}
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-1 text-[10px] text-slate-500 dark:border-zinc-800/60 dark:text-zinc-400">
                                                                        {(u.company?.name || u.company_name) && (
                                                                            <span className="font-semibold text-slate-700 dark:text-zinc-300">
                                                                                {u.company?.name || u.company_name}
                                                                            </span>
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

                                            <DialogFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={() => {
                                                            if (simActorType === 'initiator') setSimInitiatorId('');
                                                            else if (simActorType === 'assigned_pic') setSimPicId('');
                                                            else if (simActorType === 'creator') setSimCreatorId('');
                                                            else setSimAdhocIds([]);
                                                        }}
                                                        className="h-8 rounded-lg px-3 text-xs font-semibold"
                                                    >
                                                        Reset{' '}
                                                        {simActorType === 'initiator'
                                                            ? 'Inisiator'
                                                            : simActorType === 'assigned_pic'
                                                              ? 'PIC'
                                                              : simActorType === 'creator'
                                                                ? 'Pembuat'
                                                                : 'Approver Tambahan'}
                                                    </Button>
                                                    {(simInitiatorId || simPicId || simCreatorId || simAdhocIds.length > 0) && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSimInitiatorId('');
                                                                setSimPicId('');
                                                                setSimCreatorId('');
                                                                setSimAdhocIds([]);
                                                            }}
                                                            className="h-8 rounded-lg px-3 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                        >
                                                            Reset Semua
                                                        </Button>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={() => setSimActorModalOpen(false)}
                                                    className="h-8 rounded-lg px-4 text-xs font-bold"
                                                >
                                                    Selesai
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Bulk Action Toolbar */}
                                    {selectedStepIds.size > 0 && (
                                        <div className="border-primary/20 bg-primary/5 -mt-1 flex items-center gap-2 rounded-lg border px-3 py-2">
                                            <span className="text-primary text-xs font-bold">{selectedStepIds.size} dipilih</span>
                                            <div className="bg-primary/20 h-3 w-px" />
                                            <button
                                                type="button"
                                                onClick={() => bulkMoveSelected('up')}
                                                className="text-primary flex cursor-pointer items-center gap-1 text-[11px] font-semibold hover:underline"
                                            >
                                                <ArrowUp size={12} /> Naik
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => bulkMoveSelected('down')}
                                                className="text-primary flex cursor-pointer items-center gap-1 text-[11px] font-semibold hover:underline"
                                            >
                                                <ArrowDown size={12} /> Turun
                                            </button>
                                            <button
                                                type="button"
                                                onClick={bulkDeleteSelected}
                                                className="ml-2 flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline"
                                            >
                                                <Trash2 size={12} /> Hapus
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearSelection}
                                                className="ml-auto text-[11px] text-slate-400 transition-colors hover:text-slate-600"
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
                                            <span className="text-xs font-medium tracking-widest text-slate-400/80 uppercase">
                                                Belum Ada Tahapan Terdefinisi
                                            </span>
                                            <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
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
                                            <SortableContext items={form.data.steps.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                                                <div className="relative grid gap-4">
                                                    <div className="absolute top-12 bottom-12 left-[19.5px] z-0 w-px bg-slate-100 dark:bg-slate-800" />
                                                    {form.data.steps.map((step: any, idx: number) => (
                                                        <SortableStepItem
                                                            key={step.id}
                                                            roles={roles}
                                                            departments={departments}
                                                            divisions={divisions}
                                                            locations={locations}
                                                            users={users}
                                                            companyGroups={companyGroups}
                                                            organizationGroups={organizationGroups}
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
                                                                const removedStep = form.data.steps[i];
                                                                const removedStepId = removedStep?.id;
                                                                const filtered = form.data.steps.filter((_: any, index: number) => index !== i);
                                                                const normalized = filtered.map((item: any, index: number) => {
                                                                    const updatedActions = (item.actions || []).map((act: any) => {
                                                                        if (
                                                                            removedStepId &&
                                                                            act.transition_config?.type === 'absolute' &&
                                                                            (act.transition_config?.step_id === removedStepId ||
                                                                                act.next_step_id === removedStepId)
                                                                        ) {
                                                                            return {
                                                                                ...act,
                                                                                transition_config: {
                                                                                    ...act.transition_config,
                                                                                    step_id: null,
                                                                                    sequence: null,
                                                                                },
                                                                                next_step_id: null,
                                                                            };
                                                                        }
                                                                        return act;
                                                                    });
                                                                    return {
                                                                        ...item,
                                                                        step: index + 1,
                                                                        actions: updatedActions,
                                                                    };
                                                                });
                                                                form.setData('steps', normalized);
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
                                    <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 pb-1 sm:grid-cols-3 dark:border-zinc-800">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={addLocalStep}
                                            className="h-10 cursor-pointer gap-2 text-xs font-medium shadow-2xs"
                                        >
                                            <PlusCircle size={15} />
                                            <span>Tambah Tahap Default</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setBuiltinTemplateModalOpen(true)}
                                            className="h-10 cursor-pointer justify-between gap-2 border-slate-200 bg-white px-3.5 text-xs font-medium shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <LayoutTemplate size={15} className="text-primary shrink-0" />
                                                <span className="truncate">Template Standar</span>
                                            </div>
                                            <span className="shrink-0 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                                                {BUILTIN_STEP_TEMPLATES.length}
                                            </span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setPresetSelectModalOpen(true)}
                                            className="h-10 cursor-pointer justify-between gap-2 border-slate-200 bg-white px-3.5 text-xs font-medium shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <Bookmark size={15} className="text-primary shrink-0" />
                                                <span className="truncate">Preset Tersimpan</span>
                                            </div>
                                            {presets.length > 0 && (
                                                <span className="bg-primary/10 text-primary shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
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
                                        allWorkflows={allWorkflows}
                                        customActions={form.data.meta?.custom_actions || workflow?.meta?.custom_actions || []}
                                        users={users}
                                        roles={roles}
                                        departments={departments}
                                        divisions={divisions}
                                        locations={locations}
                                        companyGroups={companyGroups}
                                        organizationGroups={organizationGroups}
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
                            {mainTab === 'custom_actions' && (
                                <div className="p-1">
                                    <CustomActionsManager
                                        customActions={form.data.meta?.custom_actions || []}
                                        onChange={(actions) =>
                                            form.setData('meta', {
                                                ...(form.data.meta || {}),
                                                custom_actions: actions,
                                            })
                                        }
                                        steps={form.data.steps}
                                        allWorkflows={allWorkflows}
                                        roles={roles}
                                        departments={departments}
                                        divisions={divisions}
                                        locations={locations}
                                        companyGroups={companyGroups}
                                        organizationGroups={organizationGroups}
                                        companies={companies}
                                        regions={regions}
                                        users={users}
                                        contractStatuses={contractStatuses}
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
                        <Search size={14} className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" />
                        <input
                            type="text"
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            placeholder="Cari template standar (misal: Legal, Atasan, PIC, Signer, Finance)..."
                            className="border-input bg-background focus:ring-ring placeholder:text-muted-foreground h-9 w-full rounded-lg border pr-4 pl-9 text-xs transition-all focus:ring-1 focus:outline-none"
                        />
                    </div>

                    {filteredBuiltinTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-zinc-800">
                            <Search size={24} className="mb-2 text-slate-300 dark:text-zinc-700" />
                            <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Template Tidak Ditemukan</p>
                            <p className="text-muted-foreground mt-0.5 text-[11px]">
                                Tidak ada template yang cocok dengan kata kunci "{templateSearch}".
                            </p>
                        </div>
                    ) : (
                        <div className="custom-scrollbar grid max-h-[480px] grid-cols-1 gap-3 overflow-y-auto p-0.5 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredBuiltinTemplates.map((tpl) => {
                                const stepData = tpl.step_data || {};
                                return (
                                    <div
                                        key={tpl.id}
                                        className="group hover:border-primary/60 flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                                    >
                                        <div className="flex min-w-0 flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-foreground truncate text-xs font-medium">{tpl.name}</span>
                                                <span className="shrink-0 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600 dark:text-indigo-400">
                                                    {tpl.category}
                                                </span>
                                            </div>
                                            <span className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">{tpl.description}</span>

                                            {/* Action Step Pills Preview */}
                                            {stepData.actions && stepData.actions.length > 0 && (
                                                <div className="border-border/40 flex flex-wrap items-center gap-1 border-t pt-1">
                                                    {stepData.actions.map((act: any, aIdx: number) => {
                                                        const actName = act.name || act.action_code || `Aksi ${aIdx + 1}`;
                                                        const isApprove = act.action_code === 'approve' || actName.toLowerCase().includes('setuju');
                                                        const isReject = act.action_code === 'reject' || actName.toLowerCase().includes('tolak');

                                                        return (
                                                            <span
                                                                key={aIdx}
                                                                className={cn(
                                                                    'rounded-md border px-1.5 py-0.5 text-[9px] font-medium tracking-tight',
                                                                    isApprove &&
                                                                        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300',
                                                                    isReject &&
                                                                        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300',
                                                                    !isApprove && !isReject && 'bg-muted text-muted-foreground border-border',
                                                                )}
                                                            >
                                                                {actName}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-border/40 flex items-center gap-1.5 border-t pt-1">
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
                                                className="h-7.5 w-full text-xs font-medium"
                                            >
                                                + Sisipkan Template
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-slate-100 pt-2 dark:border-zinc-800">
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
                            <Search size={14} className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" />
                            <input
                                type="text"
                                value={presetSearch}
                                onChange={(e) => setPresetSearch(e.target.value)}
                                placeholder="Cari nama preset atau deskripsi tahapan..."
                                className="border-input bg-background focus:ring-ring placeholder:text-muted-foreground h-9 w-full rounded-lg border pr-4 pl-9 text-xs transition-all focus:ring-1 focus:outline-none"
                            />
                        </div>
                    )}

                    {presets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center dark:border-zinc-800">
                            <Bookmark size={28} className="mb-2 text-slate-300 dark:text-zinc-700" />
                            <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Belum Ada Preset Tersimpan</p>
                            <p className="text-muted-foreground mt-0.5 text-[11px]">
                                Anda belum menyimpan preset tahapan apa pun ke database server.
                            </p>
                        </div>
                    ) : filteredPresets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-zinc-800">
                            <Search size={24} className="mb-2 text-slate-300 dark:text-zinc-700" />
                            <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Preset Tidak Ditemukan</p>
                            <p className="text-muted-foreground mt-0.5 text-[11px]">
                                Tidak ada preset yang cocok dengan kata kunci "{presetSearch}".
                            </p>
                        </div>
                    ) : (
                        <div className="custom-scrollbar grid max-h-[480px] grid-cols-1 gap-3 overflow-y-auto p-0.5 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredPresets.map((preset) => {
                                const stepData = preset.step_data || {};
                                return (
                                    <div
                                        key={preset.id}
                                        className="group hover:border-primary/60 flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                                    >
                                        <div className="flex min-w-0 flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-foreground truncate text-xs font-medium">{preset.name}</span>
                                                <span className="bg-primary/10 text-primary shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium">
                                                    Preset
                                                </span>
                                            </div>
                                            <span className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                                                {stepData.description ||
                                                    stepData.name ||
                                                    stepData.label ||
                                                    `Role: ${stepData.approver_type || 'Custom'}`}
                                            </span>

                                            {/* Action Step Pills Preview */}
                                            {stepData.actions && stepData.actions.length > 0 && (
                                                <div className="border-border/40 flex flex-wrap items-center gap-1 border-t pt-1">
                                                    {stepData.actions.map((act: any, aIdx: number) => {
                                                        const actName =
                                                            act.master_action?.name || act.master_action_name || act.label || `Action ${aIdx + 1}`;
                                                        const isApprove =
                                                            actName.toLowerCase().includes('setuju') || actName.toLowerCase().includes('approve');
                                                        const isReject =
                                                            actName.toLowerCase().includes('tolak') || actName.toLowerCase().includes('reject');

                                                        return (
                                                            <span
                                                                key={aIdx}
                                                                className={cn(
                                                                    'rounded-md border px-1.5 py-0.5 text-[9px] font-medium tracking-tight',
                                                                    isApprove &&
                                                                        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300',
                                                                    isReject &&
                                                                        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300',
                                                                    !isApprove && !isReject && 'bg-muted text-muted-foreground border-border',
                                                                )}
                                                            >
                                                                {actName}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-border/40 flex items-center gap-1.5 border-t pt-1">
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
                                                className="h-7.5 flex-1 text-xs font-medium"
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
                                                className="border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground h-7.5 w-7.5 shrink-0 rounded-lg border"
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

                    <div className="flex justify-end border-t border-slate-100 pt-2 dark:border-zinc-800">
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
                <div className="space-y-4 p-6">
                    <FormInput
                        label="Nama Preset"
                        value={presetNameInput}
                        onChange={(e) => setPresetNameInput(e.target.value)}
                        placeholder="Contoh: Approval Direksi & Finance"
                        required
                        autoFocus
                    />

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <Button type="button" variant="outline" onClick={() => setPresetModalOpen(false)} className="h-10 px-4 text-xs font-bold">
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={async () => {
                                if (!presetNameInput.trim() || !targetPresetStep) return;
                                try {
                                    const res: any = await workflowsApi.presets.create({
                                        name: presetNameInput.trim(),
                                        step_data: targetPresetStep,
                                    });
                                    if (res) {
                                        setPresetModalOpen(false);
                                        const presetItem = res?.data || res;
                                        if (presetItem) {
                                            setPresets((prev) => [presetItem, ...prev]);
                                        }
                                        showToast(`Preset "${presetNameInput.trim()}" berhasil disimpan!`, 'success');
                                    }
                                } catch (err: any) {
                                    showToast(err.response?.data?.message || 'Gagal menyimpan preset', 'danger');
                                }
                            }}
                            className="bg-primary hover:bg-primary/90 h-10 border-none px-5 text-xs font-bold text-white"
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
                <div className="space-y-4 p-6">
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

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <Button type="button" variant="outline" onClick={() => setEditPresetModalOpen(false)} className="h-10 px-4 text-xs font-bold">
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={async () => {
                                if (!editPresetName.trim() || !editingPreset) return;
                                const updatedStepData = {
                                    ...(editingPreset.step_data || {}),
                                    name: editPresetDescription.trim(),
                                    description: editPresetDescription.trim(),
                                    label: editPresetDescription.trim(),
                                };
                                try {
                                    const res: any = await workflowsApi.presets.update(editingPreset.id, {
                                        name: editPresetName.trim(),
                                        step_data: updatedStepData,
                                    });
                                    if (res) {
                                        setEditPresetModalOpen(false);
                                        const updatedItem = res?.data || res;
                                        setPresets((prev) =>
                                            prev.map((p) =>
                                                p.id === editingPreset.id
                                                    ? updatedItem || { ...p, name: editPresetName.trim(), step_data: updatedStepData }
                                                    : p,
                                            ),
                                        );
                                        showToast(`Preset "${editPresetName.trim()}" berhasil diperbarui!`, 'success');
                                    }
                                } catch (err: any) {
                                    showToast(err.response?.data?.message || 'Gagal memperbarui preset', 'danger');
                                }
                            }}
                            className="bg-primary hover:bg-primary/90 h-10 border-none px-5 text-xs font-bold text-white"
                        >
                            Simpan Perubahan
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
