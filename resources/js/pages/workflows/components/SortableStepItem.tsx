import { AdvancedStepSettingsModal } from './modals/AdvancedStepSettingsModal';
import { ConditionExpressionModal } from './modals/ConditionExpressionModal';
import { Button } from '@/components/ui/buttons/Button';
import { Badge } from '@/components/ui/feedback/Badge';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { useToast } from '@/components/ui/feedback/Toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ArrowDown,
    ArrowUp,
    Bookmark,
    Briefcase,
    Calendar,
    CheckCircle2,
    CheckSquare2,
    ChevronUp,
    Copy,
    DollarSign,
    Edit3,
    Eye,
    FileCode,
    FileSpreadsheet,
    FileText,
    GitBranch,
    GitCommit,
    Hash,
    History,
    Info,
    Key,
    Link,
    MessageSquare,
    Paperclip,
    Percent,
    PlusCircle,
    Settings2,
    Shield,
    ShieldCheck,
    Sliders,
    Square,
    Trash2,
    UserCheck,
    Users,
    Users as UsersIcon,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApproveModal } from './modals/ApproveModal';
import { AssignModal } from './modals/AssignModal';
import { ForwardModal } from './modals/ForwardModal';
import { RejectModal } from './modals/RejectModal';
import { SignerModal } from './modals/SignerModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialogs/Dialog';
import AuthoritySelector from './AuthoritySelector';
import AuthorityTableManager from './AuthorityTableManager';

import { ALL_ROLES, APPROVER_TYPE_STYLES } from '../constants';

import { useWorkflowStepState } from '../hooks/useWorkflowStepState';
import { StepActionConfigCard } from './StepActionConfigCard';
import { StepSimulatorButtons } from './StepSimulatorButtons';
import { StepEligibleUsersPopover } from './StepEligibleUsersPopover';
import { FormInput } from '@/components/ui/inputs/FormInput';


export default function SortableStepItem({
    step,
    idx,
    totalSteps,
    contractStatuses = [],
    updateLocalStep,
    removeLocalStep,
    duplicateLocalStep,
    moveLocalStep,
    isExpanded,
    setIsExpanded,
    roles = [],
    departments = [],
    divisions = [],
    users = [],
    companyGroups = [],
    companies = [],
    regions = [],
    allWorkflows = [],
    allWorkflowSteps = [],
    onSavePreset,
    isSelected = false,
    onToggleSelect,
    onMoveKeyboard,
    simulationContext,
    onOpenSimulationModal,
}: {
    step: any;
    idx: number;
    totalSteps: number;
    contractStatuses?: any[];
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
    duplicateLocalStep: (idx: number) => void;
    moveLocalStep: (idx: number, direction: 'up' | 'down') => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    roles?: any[];
    departments?: any[];
    divisions?: any[];
    users?: any[];
    companyGroups?: any[];
    companies?: any[];
    regions?: any[];
    allWorkflows?: any[];
    allWorkflowSteps?: any[];
    onSavePreset?: (step: any) => void;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    onMoveKeyboard?: (idx: number, direction: 'up' | 'down') => void;
    simulationContext?: {
        initiatorId?: string;
        picId?: string;
        creatorId?: string;
    };
    onOpenSimulationModal?: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : (isExpanded ? 30 : 'auto'),
        opacity: isDragging ? 0.5 : 1,
    };

    const { showToast } = useToast();

    const { activeModal, setActiveModal, activeActionForModal, parsedCondition, handleConditionChange, actions, addAction, updateAction, removeAction, cloneAction } =
        useWorkflowStepState({ step, idx, updateLocalStep });

    const isConditionEnabled = step.condition_expression !== null;
    const handleToggleCondition = () => {
        if (isConditionEnabled) {
            updateLocalStep(idx, {
                condition_expression: null,
                meta: {
                    ...(step.meta || {}),
                    condition_key: null,
                    condition_operator: null,
                    condition_value: null,
                },
            });
        } else {
            updateLocalStep(idx, {
                condition_expression: 'METADATA_KEY',
                meta: {
                    ...(step.meta || {}),
                    condition_key: 'METADATA_KEY',
                    condition_operator: 'truthy',
                    condition_value: '',
                },
            });
        }
    };

    const formatUserDetail = (u: any) => {
        const pt = u.company?.name || u.company_name || '';
        const dept = u.department?.name || u.org_name || '';
        const role = u.role || 'Staff';
        const details = [role, pt, dept].filter(Boolean).join(' • ');
        return details ? `${u.name} (${details})` : u.name;
    };

    // Filtered users for select dropdowns
    const userOptions = useMemo(() => {
        return (users || [])
            .filter((u: any) => u.is_used !== false && u.is_used !== 0 && String(u.is_used) !== '0')
            .map((u: any) => ({
                value: String(u.id),
                label: formatUserDetail(u),
                department_id: u.department_id,
            }));
    }, [users]);

    const legalUserOptions = useMemo(() => {
        let list = (users || [])
            .filter((u: any) => u.is_used !== false && u.is_used !== 0 && String(u.is_used) !== '0')
            .filter(
                (u) => u.role?.toLowerCase().includes('legal') || u.role?.toLowerCase().includes('admin') || u.role?.toLowerCase().includes('staff'),
            );
        if (list.length === 0) {
            list = (users || []).filter((u: any) => u.is_used !== false && u.is_used !== 0 && String(u.is_used) !== '0');
        }
        return list.map((u) => ({
            value: String(u.id),
            label: formatUserDetail(u),
        }));
    }, [users]);
    const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
    const [conditionModalOpen, setConditionModalOpen] = useState(false);
    const [actorsModalOpen, setActorsModalOpen] = useState(false);
    const [stepTab, setStepTab] = useState<'config' | 'actions' | 'advanced'>('config');

    const updateConfig = (key: 'custom' | 'roles' | 'departments' | 'users' | 'is_default' | 'is_initiator_role' | 'is_initiator_department' | 'use_combination', value: any) => {
        const nextConfig = {
            custom: [],
            roles: [],
            departments: [],
            users: [],
            is_default: false,
            is_initiator_role: false,
            is_initiator_department: false,
            use_combination: true,
            ...(step.approver_config || {}),
            [key]: value
        };
        if (nextConfig.is_default) {
            nextConfig.custom = ['initiator'];
            nextConfig.roles = [];
            nextConfig.departments = [];
            nextConfig.users = [];
            nextConfig.is_initiator_role = false;
            nextConfig.is_initiator_department = false;
        }
        if (nextConfig.is_initiator_role) {
            nextConfig.roles = [];
        }
        if (nextConfig.is_initiator_department) {
            nextConfig.departments = [];
        }

        // Determine approver_type
        let appType = 'role';
        if (nextConfig.custom && nextConfig.custom.length > 0) {
            appType = nextConfig.custom[0];
        } else if (nextConfig.users && nextConfig.users.length > 0) {
            appType = 'user';
        } else if (nextConfig.is_initiator_role || (nextConfig.roles && nextConfig.roles.length > 0)) {
            appType = 'role';
        } else if (nextConfig.is_initiator_department || (nextConfig.departments && nextConfig.departments.length > 0)) {
            appType = 'role';
        }

        updateLocalStep(idx, {
            approver_config: nextConfig,
            approver_type: appType,
            role: nextConfig.roles,
            department_ids: nextConfig.departments,
            user_ids: nextConfig.users,
            filter_department: nextConfig.is_initiator_department
        });
    };


    const simInitiatorUser = useMemo(() => {
        if (!simulationContext?.initiatorId) return null;
        return (users || []).find((u: any) => String(u.id) === String(simulationContext.initiatorId)) || null;
    }, [simulationContext?.initiatorId, users]);

    const simPicUser = useMemo(() => {
        if (!simulationContext?.picId) return null;
        return (users || []).find((u: any) => String(u.id) === String(simulationContext.picId)) || null;
    }, [simulationContext?.picId, users]);

    const simCreatorUser = useMemo(() => {
        if (!simulationContext?.creatorId) return null;
        return (users || []).find((u: any) => String(u.id) === String(simulationContext.creatorId)) || null;
    }, [simulationContext?.creatorId, users]);

    const currentAssignAction = useMemo(() => {
        if (activeActionForModal && (
            activeActionForModal.action_code === 'assign' ||
            activeActionForModal.action_code === 'assign_pic' ||
            activeActionForModal.master_action_id === 'assign' ||
            activeActionForModal.master_action?.code === 'assign' ||
            activeActionForModal.master_action_name?.toLowerCase()?.includes('tugas') ||
            activeActionForModal.master_action_name?.toLowerCase()?.includes('assign') ||
            activeActionForModal.alias?.toLowerCase()?.includes('tugas') ||
            activeActionForModal.alias?.toLowerCase()?.includes('assign')
        )) {
            return activeActionForModal;
        }
        return (actions || []).find(
            (a: any) =>
                a.action_code === 'assign' ||
                a.action_code === 'assign_pic' ||
                a.master_action_id === 'assign' ||
                a.master_action?.code === 'assign' ||
                a.master_action_name?.toLowerCase()?.includes('tugas') ||
                a.master_action_name?.toLowerCase()?.includes('assign') ||
                a.alias?.toLowerCase()?.includes('tugas') ||
                a.alias?.toLowerCase()?.includes('assign')
        );
    }, [activeActionForModal, actions]);

    const assigneeOptions = useMemo(() => {
        const enrichedList = (users || []).map((u: any) => {
            const dName = u.department_name || u.department?.name || departments.find((d: any) => String(d.id) === String(u.department_id))?.name || null;
            const divName = u.division_name || u.division?.name || divisions.find((d: any) => String(d.id) === String(u.division_id || u.department?.division_id))?.name || null;
            return {
                ...u,
                department_name: dName,
                division_name: divName,
            };
        });

        if (!currentAssignAction) {
            return enrichedList;
        }

        const cfg = currentAssignAction.assignee_config || {};
        const authorities: any[] = cfg.authorities || currentAssignAction.authorities || currentAssignAction.assignee_authorities || [];

        // 1. Evaluasi jika menggunakan tabel otoritas (authorities)
        if (authorities && authorities.length > 0) {
            const filtered = enrichedList.filter((user) => {
                const userId = String(user.id);
                const userRoleId = String(user.role_id || user.role || '');
                const userDeptId = String(user.department_id || user.department?.id || '');
                const userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
                const userCompId = String(user.company_id || user.company?.id || '');
                const userCgId = String(user.company_group_id || user.company?.company_group_id || '');
                const userRegionId = String(user.region_id || user.company?.region_id || '');

                return authorities.some((auth) => {
                    // Custom Actor match
                    if (auth.authority_type === 'custom') {
                        const customType = auth.role_id || auth.user_id || auth.authority_type;
                        if (customType === 'initiator' && simInitiatorUser) {
                            return String(simInitiatorUser.id) === userId;
                        }
                        if (customType === 'assigned_pic' && simPicUser) {
                            return String(simPicUser.id) === userId;
                        }
                        if (customType === 'creator' && simCreatorUser) {
                            return String(simCreatorUser.id) === userId;
                        }
                        return false;
                    }

                    // Direct single user
                    if (auth.authority_type === 'user' && auth.user_id) {
                        return String(auth.user_id) === userId;
                    }

                    // Group combination match
                    if (auth.authority_type === 'group' || !auth.authority_type) {
                        // Check Role
                        if (auth.role_use_initiator) {
                            if (simInitiatorUser) {
                                const initRoleId = String(simInitiatorUser.role_id || simInitiatorUser.role || '');
                                if (userRoleId !== initRoleId) return false;
                            }
                        } else if (auth.role_id) {
                            const targetRole = roles.find(r => String(r.id) === String(auth.role_id) || r.name === auth.role_id);
                            const matchRoleId = targetRole ? String(targetRole.id) : String(auth.role_id);
                            const matchRoleName = targetRole ? targetRole.name.toLowerCase() : String(auth.role_id).toLowerCase();
                            const isRoleMatch = userRoleId === matchRoleId || userRoleId.toLowerCase() === matchRoleName;
                            if (!isRoleMatch) return false;
                        }

                        // Check Department
                        if (auth.department_use_initiator) {
                            if (simInitiatorUser) {
                                const initDeptId = String(simInitiatorUser.department_id || simInitiatorUser.department?.id || '');
                                if (userDeptId !== initDeptId) return false;
                            }
                        } else if (auth.department_id) {
                            if (userDeptId !== String(auth.department_id)) return false;
                        }

                        // Check Division
                        if (auth.division_use_initiator) {
                            if (simInitiatorUser) {
                                const initDivId = String(simInitiatorUser.division_id || simInitiatorUser.division?.id || simInitiatorUser.department?.division_id || '');
                                if (userDivId !== initDivId) return false;
                            }
                        } else if (auth.division_id) {
                            if (userDivId !== String(auth.division_id)) return false;
                        }

                        // Check Company Group
                        if (auth.company_group_use_initiator) {
                            if (simInitiatorUser) {
                                const initCgId = String(simInitiatorUser.company_group_id || simInitiatorUser.company?.company_group_id || '');
                                if (userCgId !== initCgId) return false;
                            }
                        } else if (auth.company_group_id) {
                            if (userCgId !== String(auth.company_group_id)) return false;
                        }

                        // Check Company PT
                        if (auth.company_use_initiator) {
                            if (simInitiatorUser) {
                                const initCompId = String(simInitiatorUser.company_id || simInitiatorUser.company?.id || '');
                                if (userCompId !== initCompId) return false;
                            }
                        } else if (auth.company_id) {
                            if (userCompId !== String(auth.company_id)) return false;
                        }

                        // Check Region
                        if (auth.region_use_initiator) {
                            if (simInitiatorUser) {
                                const initRegionId = String(simInitiatorUser.region_id || simInitiatorUser.company?.region_id || '');
                                if (userRegionId !== initRegionId) return false;
                            }
                        } else if (auth.region_id) {
                            if (userRegionId !== String(auth.region_id)) return false;
                        }

                        return true;
                    }

                    return false;
                });
            });

            return filtered;
        }

        // 2. Evaluasi jika menggunakan konfigurasi direct fields (roles, departments, divisions, dll.)
        const customActors: string[] = cfg.custom || [];
        const explicitUsers: any[] = cfg.users || [];
        const targetRoles: string[] = cfg.roles || [];
        const targetDepts: string[] = cfg.departments || [];
        const targetDivs: string[] = cfg.divisions || [];
        const targetGroups: string[] = cfg.company_groups || [];
        const targetRegions: string[] = cfg.regions || [];

        const hasAnyConfig = customActors.length > 0 || explicitUsers.length > 0 || targetRoles.length > 0 || targetDepts.length > 0 || targetDivs.length > 0 || targetGroups.length > 0 || targetRegions.length > 0 || cfg.is_initiator_role || cfg.is_initiator_department;

        if (!hasAnyConfig) {
            return enrichedList;
        }

        return enrichedList.filter((user) => {
            const userId = String(user.id);
            const userRoleId = String(user.role_id || user.role || '');
            const userDeptId = String(user.department_id || user.department?.id || '');
            const userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
            const userCompId = String(user.company_id || user.company?.id || '');
            const userCgId = String(user.company_group_id || user.company?.company_group_id || '');
            const userRegionId = String(user.region_id || user.company?.region_id || '');

            if (explicitUsers.some((uid: any) => String(uid) === userId)) return true;

            if (customActors.includes('initiator') && simInitiatorUser && String(simInitiatorUser.id) === userId) return true;
            if (customActors.includes('assigned_pic') && simPicUser && String(simPicUser.id) === userId) return true;
            if (customActors.includes('creator') && simCreatorUser && String(simCreatorUser.id) === userId) return true;

            let roleMatch = targetRoles.length === 0 && !cfg.is_initiator_role;
            if (cfg.is_initiator_role && simInitiatorUser) {
                const initRoleId = String(simInitiatorUser.role_id || simInitiatorUser.role || '');
                if (userRoleId === initRoleId) roleMatch = true;
            } else if (targetRoles.length > 0) {
                const userRole = (user.role || '').toLowerCase();
                roleMatch = targetRoles.some((r: string) => {
                    const targetRole = roles.find(rl => String(rl.id) === String(r) || rl.name === r);
                    const matchRoleId = targetRole ? String(targetRole.id) : String(r);
                    const matchRoleName = targetRole ? targetRole.name.toLowerCase() : String(r).toLowerCase();
                    return userRoleId === matchRoleId || userRole === matchRoleName;
                });
            }

            let deptMatch = targetDepts.length === 0 && !cfg.is_initiator_department;
            if (cfg.is_initiator_department && simInitiatorUser) {
                const initDeptId = String(simInitiatorUser.department_id || simInitiatorUser.department?.id || '');
                if (userDeptId === initDeptId) deptMatch = true;
            } else if (targetDepts.length > 0) {
                deptMatch = targetDepts.some((dId: string) => String(dId) === userDeptId);
            }

            let divMatch = targetDivs.length === 0;
            if (targetDivs.length > 0) {
                divMatch = targetDivs.some((dId: string) => String(dId) === userDivId);
            }

            let groupMatch = targetGroups.length === 0;
            if (targetGroups.length > 0) {
                groupMatch = targetGroups.some((gId: string) => String(gId) === userCgId);
            }

            let regionMatch = targetRegions.length === 0;
            if (targetRegions.length > 0) {
                regionMatch = targetRegions.some((rId: string) => String(rId) === userRegionId);
            }

            return roleMatch && deptMatch && divMatch && groupMatch && regionMatch;
        });
    }, [
        currentAssignAction,
        users,
        roles,
        departments,
        divisions,
        companyGroups,
        companies,
        regions,
        simInitiatorUser,
        simPicUser,
        simCreatorUser,
    ]);

    const signerOptions = useMemo(() => {
        return users;
    }, [users]);

    const approverLabel = useMemo(() => {
        const cfg = step.approver_config || {};
        const parts: string[] = [];

        if (cfg.custom && cfg.custom.length > 0) {
            cfg.custom.forEach((c: string) => {
                if (c === 'initiator') parts.push('INISIATOR');
                if (c === 'assigned_pic') parts.push('PIC DITUGASKAN');
                if (c === 'atasan') parts.push('ATASAN LANGSUNG');
                if (c === 'creator') parts.push('PEMBUAT');
            });
        }
        if (cfg.is_initiator_role) {
            parts.push('ROLE INISIATOR');
        } else if (cfg.roles && cfg.roles.length > 0) {
            parts.push(`ROLE: ${cfg.roles.join(', ')}`);
        }
        if (cfg.is_initiator_department) {
            parts.push('DIVISI INISIATOR');
        } else if (cfg.departments && cfg.departments.length > 0) {
            const pool = divisions.length > 0 ? divisions : departments;
            const deptNames = cfg.departments.map((id: string) => pool.find((d) => String(d.id) === id)?.name || id);
            parts.push(`DIVISI: ${deptNames.join(', ')}`);
        }
        if (cfg.users && cfg.users.length > 0) {
            const userNames = cfg.users.map((id: any) => (users || []).find((u) => String(u.id) === String(id))?.name || id);
            parts.push(`USER: ${userNames.join(', ')}`);
        }

        if (parts.length === 0) {
            switch (step.approver_type) {
                case 'initiator':
                    return 'INISIATOR';
                case 'assigned_pic':
                    return 'PIC DITUGASKAN';
                case 'creator':
                    return 'PEMBUAT';
                case 'role': {
                    const rolesList = step.role || [];
                    const deptsList = step.department_ids || [];
                    if (rolesList.length === 0 && deptsList.length === 0) {
                        return 'ROLE POOL (SEMUA)';
                    }
                    const partsList = [];
                    if (rolesList.length > 0) {
                        partsList.push(rolesList.join(', '));
                    }
                    if (deptsList.length > 0) {
                        const pool = divisions.length > 0 ? divisions : departments;
                        const deptNames = deptsList.map((id: string) => pool.find((d) => String(d.id) === id)?.name || id);
                        partsList.push(`[${deptNames.join(', ')}]`);
                    }
                    return `ROLE: ${partsList.join(' ')}`;
                }
                case 'user': {
                    const usersList = step.user_ids || [];
                    if (usersList.length === 0) {
                        return 'USER POOL (SEMUA)';
                    }
                    const userNames = usersList.map((id: any) => (users || []).find((u) => String(u.id) === String(id))?.name || id);
                    return `USER: ${userNames.join(', ')}`;
                }
                default:
                    return '—';
            }
        }

        return parts.join(' | ');
    }, [step.approver_config, step.approver_type, step.role, step.department_ids, step.user_ids, departments, divisions, users]);

    const selectedStatus = useMemo(() => {
        return (contractStatuses || []).find((s: any) => s.code === step.meta?.target_status);
    }, [contractStatuses, step.meta?.target_status]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    onMoveKeyboard?.(idx, 'up');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    onMoveKeyboard?.(idx, 'down');
                }
            }}
            className={cn(
                'group/step relative flex flex-col transition-all duration-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-within:z-30 hover:z-20 w-full min-w-0 max-w-full overflow-hidden select-none',
                isExpanded
                    ? 'border border-primary/40 dark:border-primary/50 bg-white dark:bg-zinc-900 shadow-xs ring-1 ring-primary/10 p-3'
                    : 'border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs p-2.5',
                isDragging && 'z-50 scale-[1.01] shadow-lg border-primary',
                isSelected && 'ring-2 ring-primary border-primary bg-primary/[0.02] dark:bg-primary/[0.05]',
            )}
        >
            <div
                {...attributes}
                {...listeners}
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    'group/header relative flex items-center cursor-grab active:cursor-grabbing gap-2.5 transition-all duration-200',
                    !step.approver_type && 'bg-destructive/10 p-2 rounded-lg border border-dashed border-destructive/30',
                )}
            >
                {/* Column 1: Bulk Select Checkbox */}
                {onToggleSelect && (
                    <div className="flex shrink-0 items-center justify-center">
                        <div
                            onClick={(e) => { e.stopPropagation(); onToggleSelect(step.id); }}
                            className={cn(
                                'flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-all cursor-pointer z-10',
                                isSelected
                                    ? 'bg-primary border-primary text-primary-foreground shadow-2xs opacity-100'
                                    : 'bg-background border-input opacity-60 hover:opacity-100 hover:border-primary'
                            )}
                            title={isSelected ? 'Batalkan pilihan' : 'Pilih tahap ini'}
                        >
                            {isSelected && (
                                <svg viewBox="0 0 10 8" className="h-3 w-3 text-white fill-none stroke-current stroke-[2]">
                                    <polyline points="1,4 3.5,6.5 9,1" />
                                </svg>
                            )}
                        </div>
                    </div>
                )}

                {/* Column 2: Modern Step Counting Badge */}
                <div className="flex shrink-0 items-center justify-center">
                    <div className="flex h-6 min-w-6 px-1.5 items-center justify-center rounded-md bg-secondary text-secondary-foreground border border-border text-[11px] font-medium shadow-2xs group-hover/header:border-primary/40 group-hover/header:text-primary transition-colors">
                        <span className="text-[10px] text-muted-foreground mr-0.5">#</span>
                        {step.step || idx + 1}
                    </div>
                </div>

                {/* Column 3: Status, Deskripsi & Summary Info */}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap overflow-hidden">
                        {/* Target Status Badge */}
                        {selectedStatus && (
                            <span
                                className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider shrink-0 shadow-2xs"
                                style={{
                                    backgroundColor: selectedStatus.bg_color || (selectedStatus.color ? `${selectedStatus.color}15` : 'hsl(var(--primary) / 0.1)'),
                                    borderColor: selectedStatus.color ? `${selectedStatus.color}35` : 'hsl(var(--primary) / 0.2)',
                                    color: selectedStatus.color || 'hsl(var(--primary))',
                                }}
                            >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selectedStatus.color || 'currentColor' }} />
                                <span>{selectedStatus.label || selectedStatus.name || selectedStatus.code}</span>
                            </span>
                        )}

                        {/* Deskripsi Step */}
                        {step.description ? (
                            <span className="text-xs font-medium text-foreground leading-snug truncate">
                                {step.description}
                            </span>
                        ) : (
                            <span className="text-xs font-normal text-muted-foreground italic">
                                Tanpa Deskripsi
                            </span>
                        )}


                        {/* Conditional Flag */}
                        {step.condition_expression && (
                            <Badge variant="outline" className="inline-flex items-center gap-1 text-[9.5px] font-medium text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 py-0.5 px-2 rounded-md uppercase tracking-wider shrink-0">
                                <GitBranch size={10} /> BERSYARAT
                            </Badge>
                        )}

                        {/* Data Filters Indicator */}
                        {(step.filter_department || step.filter_company_group || step.filter_region || step.filter_company) && (
                            <Badge variant="outline" className="inline-flex items-center gap-1 text-[9.5px] font-medium text-indigo-700 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400 py-0.5 px-2 rounded-md uppercase tracking-wider shrink-0">
                                <Shield size={10} className="shrink-0" />
                                <div className="flex gap-1">
                                    {step.filter_department && <span>UNIT</span>}
                                    {step.filter_company_group && <span>GROUP</span>}
                                    {step.filter_region && <span>REG</span>}
                                    {step.filter_company && <span>COMP</span>}
                                </div>
                            </Badge>
                        )}
                    </div>

                    {/* Right Toolbar Controls */}
                    <div className="flex shrink-0 items-center gap-1.5">
                        <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5 border border-border/60 shadow-2xs">
                            {/* Simulator Icon Button beside Preset */}
                            <StepSimulatorButtons
                                actions={actions}
                                idx={idx}
                                totalSteps={totalSteps}
                                allWorkflows={allWorkflows}
                                allWorkflowSteps={allWorkflowSteps}
                                setActiveModal={setActiveModal}
                            />

                            {/* Eligible Access Users Popover (Icon Orang) */}
                            <StepEligibleUsersPopover
                                step={step}
                                idx={idx}
                                users={users}
                                roles={roles}
                                departments={departments}
                                divisions={divisions}
                                companyGroups={companyGroups}
                                companies={companies}
                                regions={regions}
                                simulationContext={simulationContext}
                                onOpenSimulationModal={onOpenSimulationModal}
                            />
                            {onSavePreset && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSavePreset(step);
                                    }}
                                    className="hover:text-amber-600 h-7 w-7 rounded-md text-amber-500/80 transition-all hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    title="Simpan sebagai Preset"
                                >
                                    <Bookmark size={12} />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateLocalStep(idx);
                                }}
                                className="hover:text-primary h-7 w-7 rounded-md text-muted-foreground transition-all hover:bg-background"
                                title="Duplikat Tahap"
                            >
                                <Copy size={12} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeLocalStep(idx);
                                }}
                                className="hover:text-destructive h-7 w-7 rounded-md text-muted-foreground transition-all hover:bg-destructive/10"
                                title="Hapus Tahap"
                            >
                                <Trash2 size={12} />
                            </Button>
                        </div>

                        {/* Chevron Collapse/Expand Indicator */}
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 border border-border/60 text-muted-foreground group-hover/header:text-foreground group-hover/header:border-border transition-all">
                            <ChevronUp size={13} className={cn('transition-transform duration-200', !isExpanded && 'rotate-180')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Premium Expansion Block --- */}
            {isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-3 relative overflow-hidden w-full min-w-0 max-w-full duration-300 mt-2">
                    {/* Inner Step Tab Switcher Header (with Right-aligned Add Action Button) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-800/60 rounded-lg w-fit">
                            <button
                                type="button"
                                onClick={() => setStepTab('config')}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer select-none',
                                    stepTab === 'config'
                                        ? 'bg-primary text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-700/50',
                                )}
                            >
                                <Settings2 size={13} />
                                Konfigurasi Langkah
                            </button>
                            <button
                                type="button"
                                onClick={() => setStepTab('actions')}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer select-none',
                                    stepTab === 'actions'
                                        ? 'bg-primary text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-700/50',
                                )}
                            >
                                <Zap size={13} />
                                Konfigurasi Aksi
                                <span className={cn(
                                    'rounded-full px-1.5 py-0.2 text-[9px] font-bold',
                                    stepTab === 'actions'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                                )}>
                                    {actions.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStepTab('advanced')}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer select-none',
                                    stepTab === 'advanced'
                                        ? 'bg-primary text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-700/50',
                                )}
                            >
                                <Shield size={13} />
                                Pengaturan Lanjutan
                            </button>
                        </div>

                        {/* Quick Add Action Button directly in Tab Bar Header */}
                        {stepTab === 'actions' && (
                            <button
                                type="button"
                                onClick={addAction}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white shadow-2xs hover:bg-primary/90 transition-all text-xs font-bold cursor-pointer"
                            >
                                <PlusCircle size={13} />
                                Tambah Aksi
                            </button>
                        )}
                    </div>

                    <div className="relative z-10 py-1.5">
                        {stepTab === 'config' && (
                            <div className="space-y-3.5 animate-in fade-in duration-200 w-full">
                                {/* Step Core Configuration Card */}
                                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 space-y-4 shadow-2xs">
                                    {/* Top Controls Grid: Deskripsi Tahap, Status Target & Atur Aktor */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                                        {/* Deskripsi Tahap */}
                                        <div className="md:col-span-6 space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                                Deskripsi Tahap
                                            </label>
                                            <FormInput
                                                value={step.description || step.label || ''}
                                                onChange={(e) => updateLocalStep(idx, { description: e.target.value, label: e.target.value })}
                                                placeholder="Contoh: Review & Persetujuan Legal"
                                                variant="outline"
                                                className="h-9.5 rounded-lg border-slate-200/80 bg-white text-xs font-medium transition-all outline-none focus:border-primary dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-100"
                                            />
                                        </div>

                                        {/* Status Kontrak Target */}
                                        <div className="md:col-span-3 space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                                Status Target
                                            </label>
                                            <Select
                                                value={step.meta?.target_status || 'default'}
                                                onValueChange={(v) => {
                                                    updateLocalStep(idx, {
                                                        meta: {
                                                            ...(step.meta || {}),
                                                            target_status: v === 'default' ? null : v,
                                                        },
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="h-9.5 rounded-lg border-slate-200/80 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium focus:border-primary dark:border-zinc-700">
                                                    <SelectValue placeholder="Pilih Status" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl bg-white dark:bg-zinc-950">
                                                    <SelectItem value="default" className="py-1.5 text-xs font-medium text-slate-500 uppercase">
                                                        DEFAULT (OTOMATIS)
                                                    </SelectItem>
                                                    {contractStatuses.map((status: any) => (
                                                        <SelectItem
                                                            key={status.id}
                                                            value={status.code}
                                                            className="py-1.5 text-xs font-medium uppercase"
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <div
                                                                    className="h-2 w-2 rounded-full shrink-0"
                                                                    style={{ backgroundColor: status.color || '#cbd5e1' }}
                                                                />
                                                                <span>
                                                                    {status.code?.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Button Atur Aktor & Otoritas */}
                                        <div className="md:col-span-3 space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                                Otoritas Aktor
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setActorsModalOpen(true)}
                                                className={cn(
                                                    "h-9.5 w-full px-3 text-xs font-bold rounded-lg border transition-all inline-flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs",
                                                    (step.approver_authorities && step.approver_authorities.length > 0)
                                                        ? "bg-primary text-white border-primary hover:bg-primary/90"
                                                        : "bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <UsersIcon size={13} className="shrink-0" />
                                                    <span className="truncate">Atur Aktor</span>
                                                </div>
                                                <span className={cn(
                                                    "px-1.5 py-0.2 rounded-full font-bold text-[10px] shrink-0",
                                                    (step.approver_authorities && step.approver_authorities.length > 0)
                                                        ? "bg-white/25 text-white"
                                                        : "bg-primary text-white"
                                                )}>
                                                    {(step.approver_authorities || []).length}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Condition Expression Sub-Card */}
                                    <div className="rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 p-3.5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GitBranch size={14} className="text-slate-500 dark:text-zinc-400" />
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                                        Kondisi Eksekusi (Metadata Expression)
                                                    </h5>
                                                    <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                                                        Jalankan langkah ini hanya jika metadata kontrak memenuhi kondisi tertentu.
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleToggleCondition}
                                                className={cn(
                                                    'flex h-6 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase transition-all shadow-2xs',
                                                    isConditionEnabled
                                                        ? 'bg-primary text-white'
                                                        : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-300',
                                                )}
                                            >
                                                {isConditionEnabled ? 'AKTIF' : 'NON-AKTIF'}
                                            </button>
                                        </div>

                                        {isConditionEnabled ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 animate-in fade-in-50 duration-200">
                                                {/* Key Input */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                                                        <Key className="h-3 w-3 text-slate-400" />
                                                        <span>Metadata Key</span>
                                                    </label>
                                                    <FormInput
                                                        value={parsedCondition.key}
                                                        onChange={(e) => handleConditionChange({ key: e.target.value })}
                                                        placeholder="Contoh: contract.has_tax"
                                                        variant="outline"
                                                        className="h-9.5 rounded-lg border-slate-200 bg-white text-xs font-medium transition-all outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900"
                                                    />
                                                </div>

                                                {/* Operator Input */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                                        Operator
                                                    </label>
                                                    <Select
                                                        value={parsedCondition.operator}
                                                        onValueChange={(v) => handleConditionChange({ operator: v })}
                                                    >
                                                        <SelectTrigger className="h-9.5 rounded-lg border-slate-200 bg-white text-xs font-medium transition-all focus:border-primary dark:border-zinc-700 dark:bg-zinc-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl bg-white dark:bg-zinc-950">
                                                            <SelectItem value="truthy" className="py-1.5 text-xs font-medium uppercase">
                                                                TRUTHY (Ada / Bernilai Benar)
                              								</SelectItem>
                                                            <SelectItem value="==" className="py-1.5 text-xs font-medium uppercase">
                                                                == (Sama Dengan)
                                                            </SelectItem>
                                                            <SelectItem value="!=" className="py-1.5 text-xs font-medium uppercase">
                                                                != (Tidak Sama)
                                                            </SelectItem>
                                                            <SelectItem value=">" className="py-1.5 text-xs font-medium uppercase">
                                                                &gt; (Lebih Dari)
                                                            </SelectItem>
                                                            <SelectItem value="<" className="py-1.5 text-xs font-medium uppercase">
                                                                &lt; (Kurang Dari)
                                                            </SelectItem>
                                                            <SelectItem value="contains" className="py-1.5 text-xs font-medium uppercase">
                                                                CONTAINS (Mengandung Teks)
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Expected Value Input */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                                        Expected Value
                                                    </label>
                                                    {parsedCondition.operator !== 'truthy' ? (
                                                        <FormInput
                                                            value={parsedCondition.value}
                                                            onChange={(e) => handleConditionChange({ value: e.target.value })}
                                                            placeholder="Nilai yang diharapkan"
                                                            variant="outline"
                                                            className="h-9.5 rounded-lg border-slate-200 bg-white text-xs font-medium transition-all outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900"
                                                        />
                                                    ) : (
                                                        <div className="h-9.5 rounded-lg border border-slate-200/60 bg-slate-100/60 dark:border-zinc-800 dark:bg-zinc-900/60 px-3 flex items-center text-xs font-medium text-slate-400 dark:text-zinc-500">
                                                            Otomatis dicek bernilai Truthy
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/60 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                                Langkah ini selalu diproses pada setiap alur workflow (tanpa syarat kondisi).
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Dialog Otoritas Langkah */}
                        <Dialog open={actorsModalOpen} onOpenChange={setActorsModalOpen}>
                            <DialogContent className="sm:max-w-[96vw] w-[96vw] max-w-[96vw] h-[90vh] max-h-[90vh] border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-[12px] border p-0 shadow-2xl overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[12px] shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                            <UsersIcon size={18} />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                                Aktor & Otoritas Tahap {step.step || idx + 1}: {step.description || step.label || 'Tanpa Nama'}
                                            </DialogTitle>
                                            <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                                Tentukan aktor dan hak otoritas persetujuan untuk tahap ini
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white dark:bg-zinc-900 flex-1 overflow-y-auto">
                                    <AuthorityTableManager
                                        title="Otoritas Langkah"
                                        authorities={step.approver_authorities || []}
                                        onChange={(vals) => updateLocalStep(idx, { approver_authorities: vals })}
                                        users={users}
                                        roles={roles}
                                        departments={departments}
                                        divisions={divisions}
                                        companyGroups={companyGroups}
                                        companies={companies}
                                        regions={regions}
                                        showCustom={true}
                                        simulationContext={simulationContext}
                                        onOpenSimulationModal={onOpenSimulationModal}
                                    />
                                </div>

                                <DialogFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-end">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => setActorsModalOpen(false)}
                                        className="h-8 text-xs font-bold px-4 rounded-lg"
                                    >
                                        Selesai
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {stepTab === 'actions' && (
                            <div className="space-y-3.5 animate-in fade-in duration-200">
                                {actions.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center space-y-2.5 bg-slate-50/50 dark:bg-zinc-900/30">
                                        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500">
                                            <Zap size={18} />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                                            Belum ada aksi yang dikonfigurasi untuk langkah ini.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={addAction}
                                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-bold shadow-2xs hover:bg-primary/90 transition-all cursor-pointer"
                                        >
                                            <PlusCircle size={13} />
                                            Tambah Aksi Pertama
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3.5 py-1">
                                        {actions.map((act: any, actIdx: number) => {
                                            return (
                                                <div key={act.id || actIdx} className="animate-in fade-in relative duration-300 focus-within:z-40 hover:z-30">
                                                    <StepActionConfigCard
                                                        act={act}
                                                        actIdx={actIdx}
                                                        idx={idx}
                                                        step={step}
                                                        allWorkflows={allWorkflows}
                                                        allWorkflowSteps={allWorkflowSteps}
                                                        roles={roles}
                                                        departments={departments}
                                                        divisions={divisions}
                                                        companyGroups={companyGroups}
                                                        regions={regions}
                                                        users={users}
                                                        contractStatuses={contractStatuses}
                                                        updateAction={updateAction}
                                                        removeAction={removeAction}
                                                        cloneAction={cloneAction}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {stepTab === 'advanced' && (() => {
                            const isSectionChecked = (keys: string[]) => {
                                if (keys.length === 0) return false;
                                return keys.every((k) => (k.startsWith('require_') ? !!step.meta?.[k] : step.meta?.[k] !== false));
                            };

                            const toggleSection = (keys: string[]) => {
                                if (keys.length === 0) return;
                                const allChecked = isSectionChecked(keys);
                                const newVal = !allChecked;
                                const updates: Record<string, boolean> = {};
                                keys.forEach((k) => {
                                    updates[k] = newVal;
                                });
                                updateLocalStep(idx, {
                                    meta: {
                                        ...(step.meta || {}),
                                        ...updates,
                                    },
                                });
                            };

                            return (
                            <div className="space-y-4 animate-in fade-in duration-200 w-full">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <Settings2 size={14} className="text-slate-400" />
                                        <h4 className="text-xs font-bold tracking-wide text-slate-800 dark:text-zinc-100">
                                            Pengaturan Lanjutan Tahap (Perilaku & Hak Akses)
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[11px] border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold"
                                            onClick={() => {
                                                updateLocalStep(idx, {
                                                    meta: {
                                                        ...(step.meta || {}),
                                                        allow_info_edit: true, allow_f1_edit: true, allow_f2_edit: true, allow_agreement_edit: true, allow_attachment_edit: true, allow_reference: true, show_f2_contract_no: true, show_tax_toggle: true, show_price: true, show_period: true, show_tab_f1: true, show_tab_f2: true, show_tab_agreement: true, show_tab_attachments: true, show_tab_references: true, show_tab_timeline: true, show_tab_chat: true, allow_f2_contract_no_edit: true, allow_tax_toggle_edit: true, allow_price_edit: true, allow_period_edit: true, show_info: true, allow_timeline_edit: true, allow_chat_edit: true, show_action_panel: true, show_document_detail: true, show_tab_members: true,
                                                    },
                                                });
                                            }}
                                        >
                                            Centang Semua
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[11px] border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 font-bold"
                                            onClick={() => {
                                                updateLocalStep(idx, {
                                                    meta: {
                                                        ...(step.meta || {}),
                                                        allow_info_edit: false, allow_f1_edit: false, allow_f2_edit: false, allow_agreement_edit: false, allow_attachment_edit: false, allow_reference: false, show_f2_contract_no: false, show_tax_toggle: false, show_price: false, show_period: false, show_tab_f1: false, show_tab_f2: false, show_tab_agreement: false, show_tab_attachments: false, show_tab_references: false, show_tab_timeline: false, show_tab_chat: false, allow_f2_contract_no_edit: false, allow_tax_toggle_edit: false, allow_price_edit: false, allow_period_edit: false, show_info: false, allow_timeline_edit: false, allow_chat_edit: false, show_action_panel: false, show_document_detail: false, show_tab_members: false,
                                                    },
                                                });
                                            }}
                                        >
                                            Kosongkan Semua
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-primary text-white border-b border-primary/20 dark:bg-zinc-800/90 dark:border-zinc-700/80 dark:text-zinc-200">
                                            <tr>
                                                <th className="px-4 py-2.5 font-bold text-white dark:text-zinc-200">
                                                    <span className="flex items-center gap-1.5">
                                                        <Settings2 size={13} className="text-white/80 dark:text-zinc-400" />
                                                        Fitur / Tab
                                                    </span>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold text-center w-32 text-white dark:text-zinc-200">
                                                    <span className="flex items-center justify-center gap-1">
                                                        <Edit3 size={13} className="text-white/80 dark:text-zinc-400" />
                                                        Dapat Diedit
                                                    </span>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold text-center w-28 text-white dark:text-zinc-200">
                                                    <span className="flex items-center justify-center gap-1">
                                                        <Eye size={13} className="text-white/80 dark:text-zinc-400" />
                                                        Tampilkan
                                                    </span>
                                                </th>
                                                <th className="px-4 py-2.5 font-bold text-center w-28 text-white dark:text-zinc-200">
                                                    <span className="flex items-center justify-center gap-1">
                                                        <CheckSquare2 size={13} className="text-white/80 dark:text-zinc-400" />
                                                        Wajib Diisi
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800/80">
                                            {/* Tab 1: Dokumen */}
                                            <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                                <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                                    Tab 1: Dokumen (Sub-dokumen F1, F2, & Perjanjian)
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['allow_f1_edit', 'allow_f2_edit', 'allow_agreement_edit'])}
                                                        onCheckedChange={() => toggleSection(['allow_f1_edit', 'allow_f2_edit', 'allow_agreement_edit'])}
                                                        title="Centang/Kosongkan Semua Dapat Diedit di Dokumen"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['show_tab_f1', 'show_tab_f2', 'show_tab_agreement'])}
                                                        onCheckedChange={() => toggleSection(['show_tab_f1', 'show_tab_f2', 'show_tab_agreement'])}
                                                        title="Centang/Kosongkan Semua Tampilkan di Dokumen"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['require_f1', 'require_f2', 'require_agreement'])}
                                                        onCheckedChange={() => toggleSection(['require_f1', 'require_f2', 'require_agreement'])}
                                                        title="Centang/Kosongkan Semua Wajib Diisi di Dokumen"
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 pl-6 flex items-center gap-2">
                                                    <FileText size={14} className="text-primary dark:text-primary-400" />
                                                    Sub-tab F1 (Permohonan)
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_f1_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_f1_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tab_f1 !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tab_f1: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={!!step.meta?.require_f1} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), require_f1: !!c } })} /></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 pl-6 flex items-center gap-2">
                                                    <FileSpreadsheet size={14} className="text-primary dark:text-primary-400" />
                                                    Sub-tab F2 (Ringkasan)
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_f2_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_f2_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tab_f2 !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tab_f2: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={!!step.meta?.require_f2} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), require_f2: !!c } })} /></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 pl-6 flex items-center gap-2">
                                                    <FileCode size={14} className="text-primary dark:text-primary-400" />
                                                    Sub-tab Perjanjian / Draft
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_agreement_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_agreement_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tab_agreement !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tab_agreement: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={!!step.meta?.require_agreement} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), require_agreement: !!c } })} /></td>
                                            </tr>

                                            {/* Informational Section: Informasi Kontrak */}
                                            <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                                <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                                    Informasi Kontrak (Panel & Field Data Utama)
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['allow_info_edit', 'allow_title_edit', 'allow_vendor_edit', 'allow_category_edit', 'allow_f2_contract_no_edit', 'allow_tax_toggle_edit', 'allow_price_edit', 'allow_period_edit'])}
                                                        onCheckedChange={() => toggleSection(['allow_info_edit', 'allow_title_edit', 'allow_vendor_edit', 'allow_category_edit', 'allow_f2_contract_no_edit', 'allow_tax_toggle_edit', 'allow_price_edit', 'allow_period_edit'])}
                                                        title="Centang/Kosongkan Semua Dapat Diedit di Informasi Kontrak"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['show_info', 'show_title', 'show_vendor', 'show_category', 'show_f2_contract_no', 'show_tax_toggle', 'show_price', 'show_period'])}
                                                        onCheckedChange={() => toggleSection(['show_info', 'show_title', 'show_vendor', 'show_category', 'show_f2_contract_no', 'show_tax_toggle', 'show_price', 'show_period'])}
                                                        title="Centang/Kosongkan Semua Tampilkan di Informasi Kontrak"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className="text-slate-300 dark:text-zinc-600">-</span>
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 pl-6 flex items-center gap-2">
                                                    <Info size={14} className="text-primary dark:text-primary-400" />
                                                    Info Kontrak Utama (Kanan)
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_info_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_info_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_info !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_info: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-600 dark:text-zinc-400 pl-10 flex items-center gap-2">
                                                    <FileText size={13} className="text-primary/70 dark:text-primary-400/70" />
                                                    ↳ Field Judul Kontrak
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_title_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_title_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_title !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_title: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-600 dark:text-zinc-400 pl-10 flex items-center gap-2">
                                                    <Users size={13} className="text-primary/70 dark:text-primary-400/70" />
                                                    ↳ Field Pihak Kedua (Vendor)
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_vendor_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_vendor_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_vendor !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_vendor: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-600 dark:text-zinc-400 pl-10 flex items-center gap-2">
                                                    <Bookmark size={13} className="text-primary/70 dark:text-primary-400/70" />
                                                    ↳ Field Kategori Kontrak
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_category_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_category_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_category !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_category: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-600 dark:text-zinc-400 pl-10 flex items-center gap-2">
                                                    <Hash size={13} className="text-primary/70 dark:text-primary-400/70" />
                                                    ↳ Field No. Kontrak
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_f2_contract_no_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_f2_contract_no_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_f2_contract_no !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_f2_contract_no: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-600 dark:text-zinc-400 pl-10 flex items-center gap-2">
                                                    <Percent size={13} className="text-primary/70 dark:text-primary-400/70" />
                                                    ↳ Field Penentuan Pajak
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_tax_toggle_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_tax_toggle_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tax_toggle !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tax_toggle: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-600 dark:text-zinc-400 pl-10 flex items-center gap-2">
                                                    <DollarSign size={13} className="text-primary/70 dark:text-primary-400/70" />
                                                    ↳ Field Nilai / Harga Kontrak
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_price_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_price_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_price !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_price: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-medium text-slate-600 dark:text-zinc-400 pl-10 flex items-center gap-2">
                                                    <Calendar size={13} className="text-primary/70 dark:text-primary-400/70" />
                                                    ↳ Field Masa Berlaku Kontrak
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_period_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_period_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_period !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_period: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>

                                            {/* Tab 2: Riwayat & Alur */}
                                            <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                                <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                                    Tab 2: Riwayat & Alur (Sub-tab Alur & Audit Log)
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['allow_timeline_edit'])}
                                                        onCheckedChange={() => toggleSection(['allow_timeline_edit'])}
                                                        title="Centang/Kosongkan Semua Dapat Diedit di Riwayat & Alur"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['show_tab_timeline'])}
                                                        onCheckedChange={() => toggleSection(['show_tab_timeline'])}
                                                        title="Centang/Kosongkan Semua Tampilkan di Riwayat & Alur"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className="text-slate-300 dark:text-zinc-600">-</span>
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 pl-6 flex items-center gap-2">
                                                    <GitCommit size={14} className="text-primary dark:text-primary-400" />
                                                    Sub-tab Alur Approval & Proses
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_timeline_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_timeline_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tab_timeline !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tab_timeline: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>

                                            {/* Tab 3: Diskusi & Member */}
                                            <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                                <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                                    Tab 3: Diskusi & Member (Sub-tab Chat & Member)
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['allow_chat_edit'])}
                                                        onCheckedChange={() => toggleSection(['allow_chat_edit'])}
                                                        title="Centang/Kosongkan Semua Dapat Diedit di Diskusi & Member"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['show_tab_chat', 'show_tab_members'])}
                                                        onCheckedChange={() => toggleSection(['show_tab_chat', 'show_tab_members'])}
                                                        title="Centang/Kosongkan Semua Tampilkan di Diskusi & Member"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className="text-slate-300 dark:text-zinc-600">-</span>
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 pl-6 flex items-center gap-2">
                                                    <MessageSquare size={14} className="text-primary dark:text-primary-400" />
                                                    Sub-tab Chat & Diskusi Tim
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_chat_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_chat_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tab_chat !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tab_chat: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 pl-6 flex items-center gap-2">
                                                    <Users size={14} className="text-primary dark:text-primary-400" />
                                                    Sub-tab Member / Anggota Tim
                                                </td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tab_members !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tab_members: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>

                                            {/* Tab Lainnya & Panel Utama */}
                                            <tr className="bg-slate-100/90 dark:bg-zinc-800/80 border-y border-slate-200 dark:border-zinc-700">
                                                <td className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                                                    Tab Lainnya & Panel Utama
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['allow_attachment_edit', 'allow_reference'])}
                                                        onCheckedChange={() => toggleSection(['allow_attachment_edit', 'allow_reference'])}
                                                        title="Centang/Kosongkan Semua Dapat Diedit di Tab Lainnya & Panel"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={isSectionChecked(['show_tab_attachments', 'show_tab_references', 'show_action_panel', 'show_document_detail'])}
                                                        onCheckedChange={() => toggleSection(['show_tab_attachments', 'show_tab_references', 'show_action_panel', 'show_document_detail'])}
                                                        title="Centang/Kosongkan Semua Tampilkan di Tab Lainnya & Panel"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className="text-slate-300 dark:text-zinc-600">-</span>
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                                    <Paperclip size={14} className="text-primary dark:text-primary-400" />
                                                    Tab Lampiran Berkas
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_attachment_edit !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_attachment_edit: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tab_attachments !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tab_attachments: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                                    <Link size={14} className="text-primary dark:text-primary-400" />
                                                    Tab Kontrak Referensi
                                                </td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.allow_reference !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), allow_reference: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_tab_references !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_tab_references: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                                    <Sliders size={14} className="text-primary dark:text-primary-400" />
                                                    Panel Aksi Approval (Kanan)
                                                </td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_action_panel !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_action_panel: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-2 font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                                                    <FileText size={14} className="text-primary dark:text-primary-400" />
                                                    Container Detail Dokumen
                                                </td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                                <td className="px-4 py-2 text-center"><Checkbox checked={step.meta?.show_document_detail !== false} onCheckedChange={(c) => updateLocalStep(idx, { meta: { ...(step.meta || {}), show_document_detail: !!c } })} /></td>
                                                <td className="px-4 py-2 text-center"><span className="text-slate-300 dark:text-zinc-600">-</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* --- Interactive Simulated Modals (accessible outside the expansion block) --- */}
            <ApproveModal
                isOpen={activeModal === 'approve'}
                onClose={() => setActiveModal(null)}
                step={step}
                idx={idx}
                userOptions={userOptions}
                showToast={showToast}
            />

            <RejectModal isOpen={activeModal === 'reject'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />

            <AssignModal
                isOpen={activeModal === 'assign_pic'}
                onClose={() => setActiveModal(null)}
                assigneeOptions={assigneeOptions || []}
                action={currentAssignAction}
                step={step}
                idx={idx}
                actionAlias={currentAssignAction?.alias || currentAssignAction?.name || 'Tugaskan PIC'}
                showToast={showToast}
            />

            <SignerModal
                isOpen={activeModal === 'sign'}
                onClose={() => setActiveModal(null)}
                step={step}
                idx={idx}
                showToast={showToast}
                userOptions={signerOptions || []}
            />
            <ForwardModal isOpen={activeModal === 'forward'} onClose={() => setActiveModal(null)} step={step} idx={idx} showToast={showToast} />

            <ConditionExpressionModal
                open={conditionModalOpen}
                onOpenChange={setConditionModalOpen}
                step={step}
                idx={idx}
                updateLocalStep={updateLocalStep}
                parsedCondition={parsedCondition}
                handleConditionChange={handleConditionChange}
            />
        </div>
    );
}
