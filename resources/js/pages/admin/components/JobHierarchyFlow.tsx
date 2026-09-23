import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    Node,
    Edge,
    BackgroundVariant,
    NodeProps,
    MarkerType,
    ReactFlowInstance,
    applyNodeChanges,
    applyEdgeChanges,
    OnNodesChange,
    OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Building2,
    MapPin,
    Building,
    Briefcase,
    Users,
    ChevronRight,
    Search,
    SlidersHorizontal,
    Layers,
    UserCheck,
    Mail,
    IdCard,
    X,
    Filter,
    Check,
    User as UserIcon,
    UserX,
    ChevronDown,
    RotateCcw,
    ChevronUp,
    Crosshair,
    Navigation,
    Network,
    Shield,
    FolderClosed,
    FolderTree,
    GitBranch,
    Tags,
    Sparkles,
    RefreshCw,
    Award,
    Crown,
    Flame,
    Workflow,
    ArrowDown,
    ExternalLink,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { HierarchyUser, MultiSelectDropdown } from './OrgHierarchyFlow';

const JOB_STORAGE_KEY = 'job_hierarchy_view_settings_v3';

interface SavedJobHierarchySettings {
    groupByMode?: 'job_title' | 'role';
    usedFilter?: 'used_only' | 'all';
    selectedGroups?: string[];
    selectedOrganizationGroups?: string[];
    selectedRegions?: string[];
    selectedLocations?: string[];
    selectedCompanies?: string[];
    selectedDivisions?: string[];
    selectedDepartments?: string[];
    selectedSubdepartments?: string[];
    selectedSections?: string[];
    selectedJobLevelGroups?: string[];
    selectedJobLevels?: string[];
    selectedJobTitles?: string[];
    selectedRoles?: string[];
    isConfigOpen?: boolean;
    visibleTiers?: Record<string, boolean>;
}

const loadSavedJobSettings = (): SavedJobHierarchySettings => {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem(JOB_STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {
        // Ignore JSON parse errors
    }
    return {};
};

interface MasterItem {
    id: string;
    name: string;
    code?: string;
    job_level_id?: string;
    job_level_group_id?: string;
    group_name?: string;
    idjoblevel?: number;
    is_used?: boolean;
}

interface Props {
    users: HierarchyUser[];
    masterGroups?: MasterItem[];
    masterOrganizationGroups?: MasterItem[];
    masterRegions?: MasterItem[];
    masterLocations?: MasterItem[];
    masterCompanies?: MasterItem[];
    masterDivisions?: MasterItem[];
    masterDepartments?: MasterItem[];
    masterSubdepartments?: MasterItem[];
    masterSections?: MasterItem[];
    masterJobLevelGroups?: MasterItem[];
    masterJobLevels?: MasterItem[];
    masterJobTitles?: MasterItem[];
    masterRoles?: MasterItem[];
    // External filter props
    groupByMode?: 'job_title' | 'role';
    onGroupByModeChange?: (mode: 'job_title' | 'role') => void;
    usedFilter?: 'used_only' | 'all';
    searchQuery?: string;
    selectedGroups?: string[];
    selectedOrganizationGroups?: string[];
    selectedRegions?: string[];
    selectedLocations?: string[];
    selectedCompanies?: string[];
    selectedDivisions?: string[];
    selectedDepartments?: string[];
    selectedSubdepartments?: string[];
    selectedSections?: string[];
    selectedJobLevelGroups?: string[];
    selectedJobLevels?: string[];
    selectedJobTitles?: string[];
    selectedRoles?: string[];
    visibleTiers?: Record<string, boolean>;
}

export type SeniorityTierKey =
    | 'tier_1_c_level'
    | 'tier_2_vp'
    | 'tier_3_head'
    | 'tier_4_gm'
    | 'tier_5_manager'
    | 'tier_6_asst_manager'
    | 'tier_7_supervisor'
    | 'tier_8_staff'
    | 'tier_9_non_staff';

export interface TierDefinition {
    key: SeniorityTierKey;
    rank: number;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    headerColor: string;
    headerBorder: string;
    badgeBg: string;
    edgeColor: string;
}

export const SENIORITY_TIERS: TierDefinition[] = [
    {
        key: 'tier_1_c_level',
        rank: 1,
        title: 'Direksi & C-Level (Board / Management)',
        subtitle: 'CEO, President, Director, Direksi, MD, DMD, Chief',
        icon: Crown,
        headerColor: 'from-amber-500/15 via-amber-500/5 to-transparent text-amber-600 dark:text-amber-400',
        headerBorder: 'border-amber-400/50 dark:border-amber-500/50',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/80',
        edgeColor: '#f59e0b',
    },
    {
        key: 'tier_2_vp',
        rank: 2,
        title: 'Vice President (VP / EVP / SVP / AVP)',
        subtitle: 'Executive VP, Senior VP, Vice President, Assistant VP',
        icon: Award,
        headerColor: 'from-indigo-500/15 via-indigo-500/5 to-transparent text-indigo-600 dark:text-indigo-400',
        headerBorder: 'border-indigo-400/50 dark:border-indigo-500/50',
        badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800/80',
        edgeColor: '#6366f1',
    },
    {
        key: 'tier_3_head',
        rank: 3,
        title: 'Division Head & Department Head',
        subtitle: 'Division Head, Dept Head, Head of Unit, Project Head',
        icon: Workflow,
        headerColor: 'from-violet-500/15 via-violet-500/5 to-transparent text-violet-600 dark:text-violet-400',
        headerBorder: 'border-violet-400/50 dark:border-violet-500/50',
        badgeBg: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 border-violet-300/80 dark:border-violet-800/80',
        edgeColor: '#8b5cf6',
    },
    {
        key: 'tier_4_gm',
        rank: 4,
        title: 'Senior Manager & General Manager (GM)',
        subtitle: 'General Manager (GM), Senior Manager, Group Manager',
        icon: Award,
        headerColor: 'from-purple-500/15 via-purple-500/5 to-transparent text-purple-600 dark:text-purple-400',
        headerBorder: 'border-purple-400/50 dark:border-purple-500/50',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300/80 dark:border-purple-800/80',
        edgeColor: '#a855f7',
    },
    {
        key: 'tier_5_manager',
        rank: 5,
        title: 'Manager',
        subtitle: 'Manager, Manager Kebun, Department Manager',
        icon: Briefcase,
        headerColor: 'from-blue-500/15 via-blue-500/5 to-transparent text-blue-600 dark:text-blue-400',
        headerBorder: 'border-blue-400/50 dark:border-blue-500/50',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300/80 dark:border-blue-800/80',
        edgeColor: '#3b82f6',
    },
    {
        key: 'tier_6_asst_manager',
        rank: 6,
        title: 'Assistant Manager & Superintendent (Askep)',
        subtitle: 'Assistant Manager, Askep, Superintendent',
        icon: Workflow,
        headerColor: 'from-teal-500/15 via-teal-500/5 to-transparent text-teal-600 dark:text-teal-400',
        headerBorder: 'border-teal-400/50 dark:border-teal-500/50',
        badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300/80 dark:border-teal-800/80',
        edgeColor: '#14b8a6',
    },
    {
        key: 'tier_7_supervisor',
        rank: 7,
        title: 'Supervisor & Senior Officer',
        subtitle: 'Supervisor, Senior Officer, Senior Assistant',
        icon: UserCheck,
        headerColor: 'from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-600 dark:text-emerald-400',
        headerBorder: 'border-emerald-400/50 dark:border-emerald-500/50',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/80',
        edgeColor: '#10b981',
    },
    {
        key: 'tier_8_staff',
        rank: 8,
        title: 'Staff & Officer',
        subtitle: 'Officer, Assistant, Staff, Specialist, Pelaksana Staff',
        icon: Users,
        headerColor: 'from-sky-500/15 via-sky-500/5 to-transparent text-sky-600 dark:text-sky-400',
        headerBorder: 'border-sky-400/50 dark:border-sky-500/50',
        badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300/80 dark:border-sky-800/80',
        edgeColor: '#0ea5e9',
    },
    {
        key: 'tier_9_non_staff',
        rank: 9,
        title: 'Pelaksana & Non-Staff',
        subtitle: 'Foreman, Operator, Harian, Magang / Mahasiswa',
        icon: Layers,
        headerColor: 'from-slate-500/15 via-slate-500/5 to-transparent text-slate-600 dark:text-slate-400',
        headerBorder: 'border-slate-300/60 dark:border-slate-700/60',
        badgeBg: 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-300 border-slate-300/60 dark:border-zinc-700/60',
        edgeColor: '#64748b',
    },
];

export const ROLE_TIERS: TierDefinition[] = [
    {
        key: 'tier_1_c_level',
        rank: 1,
        title: 'Super Admin & C-Level (Direksi)',
        subtitle: 'Super Admin, Admin, CEO, COO, CFO, Director, Management',
        icon: Crown,
        headerColor: 'from-amber-500/15 via-amber-500/5 to-transparent text-amber-600 dark:text-amber-400',
        headerBorder: 'border-amber-400/50 dark:border-amber-500/50',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/80',
        edgeColor: '#f59e0b',
    },
    {
        key: 'tier_2_vp',
        rank: 2,
        title: 'Role VP (Vice President)',
        subtitle: 'VP, Vice President, Executive VP, SVP',
        icon: Award,
        headerColor: 'from-indigo-500/15 via-indigo-500/5 to-transparent text-indigo-600 dark:text-indigo-400',
        headerBorder: 'border-indigo-400/50 dark:border-indigo-500/50',
        badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800/80',
        edgeColor: '#6366f1',
    },
    {
        key: 'tier_3_head',
        rank: 3,
        title: 'Role Head (Div & Dept Head)',
        subtitle: 'Head, Division Head, Department Head, Unit Head',
        icon: Workflow,
        headerColor: 'from-violet-500/15 via-violet-500/5 to-transparent text-violet-600 dark:text-violet-400',
        headerBorder: 'border-violet-400/50 dark:border-violet-500/50',
        badgeBg: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 border-violet-300/80 dark:border-violet-800/80',
        edgeColor: '#8b5cf6',
    },
    {
        key: 'tier_4_gm',
        rank: 4,
        title: 'Role General Manager (GM)',
        subtitle: 'General Manager (GM), Senior Manager',
        icon: Award,
        headerColor: 'from-purple-500/15 via-purple-500/5 to-transparent text-purple-600 dark:text-purple-400',
        headerBorder: 'border-purple-400/50 dark:border-purple-500/50',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300/80 dark:border-purple-800/80',
        edgeColor: '#a855f7',
    },
    {
        key: 'tier_5_manager',
        rank: 5,
        title: 'Role Manager',
        subtitle: 'Manager, Dept Manager, Area Manager',
        icon: Briefcase,
        headerColor: 'from-blue-500/15 via-blue-500/5 to-transparent text-blue-600 dark:text-blue-400',
        headerBorder: 'border-blue-400/50 dark:border-blue-500/50',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300/80 dark:border-blue-800/80',
        edgeColor: '#3b82f6',
    },
    {
        key: 'tier_6_asst_manager',
        rank: 6,
        title: 'Role Assistant Manager',
        subtitle: 'Assistant Manager, Ast Manager, Askep',
        icon: Workflow,
        headerColor: 'from-teal-500/15 via-teal-500/5 to-transparent text-teal-600 dark:text-teal-400',
        headerBorder: 'border-teal-400/50 dark:border-teal-500/50',
        badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300/80 dark:border-teal-800/80',
        edgeColor: '#14b8a6',
    },
    {
        key: 'tier_7_supervisor',
        rank: 7,
        title: 'Role Supervisor',
        subtitle: 'Supervisor, Senior Officer',
        icon: UserCheck,
        headerColor: 'from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-600 dark:text-emerald-400',
        headerBorder: 'border-emerald-400/50 dark:border-emerald-500/50',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/80',
        edgeColor: '#10b981',
    },
    {
        key: 'tier_8_staff',
        rank: 8,
        title: 'Role Staff & Creator',
        subtitle: 'Staff, Officer, Creator, Assistant, Member',
        icon: Users,
        headerColor: 'from-sky-500/15 via-sky-500/5 to-transparent text-sky-600 dark:text-sky-400',
        headerBorder: 'border-sky-400/50 dark:border-sky-500/50',
        badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300/80 dark:border-sky-800/80',
        edgeColor: '#0ea5e9',
    },
    {
        key: 'tier_9_non_staff',
        rank: 9,
        title: 'Role Pelaksana & Lainnya',
        subtitle: 'Non-Staff, Magang, Viewer, Default',
        icon: Layers,
        headerColor: 'from-slate-500/15 via-slate-500/5 to-transparent text-slate-600 dark:text-slate-400',
        headerBorder: 'border-slate-300/60 dark:border-slate-700/60',
        badgeBg: 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-slate-300 border-slate-300/60 dark:border-zinc-700/60',
        edgeColor: '#64748b',
    },
];

/**
 * Classify any user into one of the hierarchical seniority tiers
 * Mode-aware: If mode is 'role', classifies by Role hierarchy.
 * If mode is 'job_title', classifies by Job Title and Job Level hierarchy.
 */
function classifyUserTier(u: HierarchyUser, mode: 'job_title' | 'role' = 'job_title'): SeniorityTierKey {
    // ----------------------------------------------------
    // A. CLASSIFICATION BY ROLE AKSES (when mode === 'role')
    // ----------------------------------------------------
    if (mode === 'role') {
        const roleStr = (u.role_name || '').toUpperCase().trim();

        // 1. C-Level / Board Roles (Super Admin, Admin, CEO, COO, CFO, Director, Management)
        if (/\b(SUPER ADMIN|ADMIN|CEO|COO|CFO|DIRECTOR|MANAGEMENT|PRESIDENT|DIREKSI|KOMISARIS)\b/.test(roleStr)) {
            return 'tier_1_c_level';
        }

        // 2. VP Roles
        if (/\b(VP|VICE PRESIDENT|EVP|SVP|AVP)\b/.test(roleStr)) {
            return 'tier_2_vp';
        }

        // 3. Head Roles (Head, Div Head, Dept Head, Unit Head)
        if (/\b(HEAD|DIV HEAD|DEPT HEAD|SECTION HEAD|HEAD OF)\b/.test(roleStr)) {
            return 'tier_3_head';
        }

        // 4. GM & Senior Manager Roles
        if (/\b(GM|GENERAL MANAGER|SENIOR MANAGER|SR\. MANAGER|GROUP MANAGER)\b/.test(roleStr)) {
            return 'tier_4_gm';
        }

        // 5. Manager Roles (must NOT contain Ast/Asst/Assistant)
        if (/\b(MANAGER|MGR)\b/.test(roleStr) && !/\b(ASSISTANT|ASST|AST|DEPUTY)\b/.test(roleStr)) {
            return 'tier_5_manager';
        }

        // 6. Assistant Manager / Superintendent Roles (Ast Manager, Asst Manager, Askep)
        if (/\b(ASSISTANT MANAGER|ASST\. MANAGER|ASST MANAGER|AST MANAGER|AST\. MANAGER|ASKEP|SUPERINTENDENT|ASST|AST)\b/.test(roleStr)) {
            return 'tier_6_asst_manager';
        }

        // 7. Supervisor Roles
        if (/\b(SUPERVISOR|SPV|SENIOR OFFICER|SR\. OFFICER)\b/.test(roleStr)) {
            return 'tier_7_supervisor';
        }

        // 9. Non-Staff Roles
        if (/\b(NON STAFF|NON-STAFF|OPERATOR|FOREMAN|KHT|HARIAN|MAHASISWA|MAGANG|INTERN)\b/.test(roleStr)) {
            return 'tier_9_non_staff';
        }

        // 8. Staff / Member / Reviewer / Approver / Default
        return 'tier_8_staff';
    }

    // ----------------------------------------------------
    // B. CLASSIFICATION BY JOB TITLE & LEVEL (when mode === 'job_title')
    // ----------------------------------------------------
    const titleStr = (u.job_title_name || '').toUpperCase();
    const rank = (u as any).job_level_rank || 0;
    const searchString = `${u.job_level_name || ''} ${(u as any).job_level_code || ''} ${u.job_title_name || ''}`.toUpperCase();

    // 1. Check Job Title First for VP (e.g. VP FINANCE, VP HR, EVP, SVP, AVP)
    if (
        /\b(VP|VICE PRESIDENT|EVP|SVP|AVP)\b/.test(titleStr) ||
        [76, 51, 52].includes(rank)
    ) {
        return 'tier_2_vp';
    }

    // 2. Check Job Title First for Head (e.g. BUSINESS DEVELOPMENT HEAD, TAX HEAD, DIV HEAD, DEPT HEAD)
    if (
        /\b(HEAD|DIV HEAD|DEPT HEAD|SECTION HEAD|HEAD OF)\b/.test(titleStr) ||
        [44, 45, 46, 47].includes(rank)
    ) {
        return 'tier_3_head';
    }

    // 3. Direct database master tier mapping from m_job_levels (editable in /admin/core/job-levels)
    const dbTier = (u as any).hierarchy_tier;
    if (dbTier) {
        const tierMap: Record<number, SeniorityTierKey> = {
            1: 'tier_1_c_level',
            2: 'tier_2_vp',
            3: 'tier_3_head',
            4: 'tier_4_gm',
            5: 'tier_5_manager',
            6: 'tier_6_asst_manager',
            7: 'tier_7_supervisor',
            8: 'tier_8_staff',
            9: 'tier_9_non_staff',
        };
        if (tierMap[dbTier]) {
            return tierMap[dbTier];
        }
    }

    // 4. C-Level / Direksi / President / Director / CEO / MD / DMD
    if (
        [74, 73, 65, 66, 48, 49, 50].includes(rank) ||
        /\b(DIRECTOR|CHIEF|CEO|MD|DMD|MANAGEMENT|PRESIDENT|DIREKSI|KOMISARIS)\b/.test(searchString)
    ) {
        return 'tier_1_c_level';
    }

    // 4. Senior Manager & General Manager
    if (
        [72, 71, 43, 42, 41, 40].includes(rank) ||
        /\b(GM|GENERAL MANAGER|SENIOR MANAGER|SR\. MANAGER|GROUP MANAGER)\b/.test(searchString)
    ) {
        return 'tier_4_gm';
    }

    // 5. Manager
    if (
        [70, 69, 68, 39, 38, 37, 36, 35].includes(rank) ||
        (searchString.includes('MANAGER') &&
            !searchString.includes('ASSISTANT') &&
            !searchString.includes('ASST') &&
            !searchString.includes('SENIOR') &&
            !searchString.includes('GENERAL') &&
            !searchString.includes('GROUP'))
    ) {
        return 'tier_5_manager';
    }

    // 6. Assistant Manager & Superintendent (Askep)
    if (
        [64, 63, 62, 61, 60, 59, 34, 33, 32, 31, 30].includes(rank) ||
        /\b(ASSISTANT MANAGER|ASST\. MANAGER|ASST MANAGER|ASKEP|SUPERINTENDENT)\b/.test(searchString)
    ) {
        return 'tier_6_asst_manager';
    }

    // 7. Supervisor & Senior Officer
    if (
        [58, 57, 56, 55, 54, 53, 29, 28].includes(rank) ||
        /\b(SUPERVISOR|SENIOR OFFICER|SENIOR ASSISTAN|SR\. OFFICER|SPV)\b/.test(searchString)
    ) {
        return 'tier_7_supervisor';
    }

    // 9. Non-Staff / Foreman / Operator / Mahasiswa / KHT
    if (
        (rank >= 1 && rank <= 23) ||
        (u as any).job_level_group_name === 'NON STAFF' ||
        /\b(NON STAFF|NON-STAFF|OPERATOR|FOREMAN|KHT|HARIAN|MAHASISWA|MAGANG|INTERN|MHS)\b/.test(searchString)
    ) {
        return 'tier_9_non_staff';
    }

    // 8. Default to Staff & Officer
    return 'tier_8_staff';
}

interface JobTreeNodeData extends Record<string, unknown> {
    nodeId?: string;
    title: string;
    label?: string;
    subtitle?: string;
    levelKey: string;
    levelLabel: string;
    code?: string;
    color?: string;
    badgeBg?: string;
    users: HierarchyUser[];
    totalUsers: number;
    subItemsCount?: number;
    hasChildren?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    onSelect?: (data: JobTreeNodeData) => void;
    onSelectUser?: (user: HierarchyUser) => void;
}

// 1. Tier Header Card (Level 1: Direksi/VP, Level 2: GM, Level 3: Manager, etc.)
const JobTierNode = ({ data }: NodeProps<Node<JobTreeNodeData>>) => {
    const isExpanded = data.isExpanded !== false;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const isRoleMode = data.levelKey?.startsWith('tier_') && data.levelLabel?.includes('ROLE');

    return (
        <div
            className={cn(
                'relative px-5 py-4 rounded-2xl border-2 shadow-xl transition-all w-[380px] cursor-grab active:cursor-grabbing backdrop-blur-md select-none',
                isRoleMode
                    ? isDark
                        ? 'bg-gradient-to-br from-slate-900/95 via-zinc-900/90 to-zinc-950/95 border-violet-500/40 text-slate-100 shadow-violet-950/30'
                        : 'bg-gradient-to-br from-white via-violet-50/25 to-white border-violet-300/70 text-slate-900 shadow-violet-100/60'
                    : isDark
                        ? 'bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border-amber-500/40 text-slate-100 shadow-amber-950/30'
                        : 'bg-gradient-to-br from-white via-amber-50/25 to-white border-amber-300/70 text-slate-900 shadow-amber-100/60'
            )}
            onClick={() => {
                if (typeof data.onSelect === 'function') data.onSelect(data);
            }}
        >
            {/* Top Handle for Seniority connection from higher tier */}
            <Handle
                id="tier-top"
                type="target"
                position={Position.Top}
                className={cn(
                    '!w-3.5 !h-3.5 !-top-2 border-2 border-white dark:border-slate-900',
                    isRoleMode ? '!bg-violet-500' : '!bg-amber-500'
                )}
            />

            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'p-2.5 rounded-xl border shrink-0',
                            isRoleMode
                                ? 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                        )}
                    >
                        {isRoleMode ? <Shield className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                    </div>
                    <div>
                        <span className={cn('text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border', data.badgeBg || (isRoleMode ? 'bg-violet-100 text-violet-800 border-violet-300' : 'bg-amber-100 text-amber-800 border-amber-300'))}>
                            {data.levelLabel || (isRoleMode ? 'JENJANG ROLE' : 'JENJANG JABATAN')}
                        </span>
                        <h4 className="font-extrabold text-sm tracking-tight mt-1 line-clamp-1">
                            {String(data.title || data.label || 'Jenjang Jabatan')}
                        </h4>
                        {data.subtitle && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {data.subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                    {isRoleMode ? <Shield className="w-3.5 h-3.5 text-violet-500" /> : <Briefcase className="w-3.5 h-3.5 text-amber-500" />}
                    {Number(data.subItemsCount || 0)} {isRoleMode ? 'Role Akses' : 'Posisi Jabatan'}
                </span>
                <span
                    className={cn(
                        'flex items-center gap-1.5 font-extrabold px-2 py-0.5 rounded-full border',
                        isRoleMode
                            ? 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20'
                            : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                    )}
                >
                    <Users className="w-3.5 h-3.5" />
                    {Number(data.totalUsers || 0)} Karyawan
                </span>
            </div>

            {Boolean(data.hasChildren) && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (typeof data.onToggle === 'function') (data.onToggle as () => void)();
                    }}
                    className={cn(
                        'absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-white shadow-md transition-colors z-10 cursor-pointer flex items-center gap-1 text-[10px] font-bold',
                        isRoleMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-amber-600 hover:bg-amber-500'
                    )}
                    title={isExpanded ? (isRoleMode ? 'Sembunyikan Role' : 'Sembunyikan Posisi') : (isRoleMode ? 'Buka Role' : 'Tampilkan Posisi')}
                >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>{isExpanded ? 'Sembunyikan' : isRoleMode ? 'Buka Role' : 'Buka Posisi'}</span>
                </button>
            )}

            {/* Bottom Handle for Seniority hierarchy line down to next tier */}
            <Handle
                id="tier-bottom"
                type="source"
                position={Position.Bottom}
                className={cn(
                    '!w-3.5 !h-3.5 !-bottom-2 border-2 border-white dark:border-slate-900',
                    isRoleMode ? '!bg-violet-500' : '!bg-amber-500'
                )}
            />

            {/* Right Handle to connect cleanly to horizontal position cards on the right */}
            <Handle
                id="tier-right"
                type="source"
                position={Position.Right}
                className={cn(
                    '!w-3.5 !h-3.5 !-right-2 border-2 border-white dark:border-slate-900',
                    isRoleMode ? '!bg-violet-500' : '!bg-cyan-500'
                )}
            />
        </div>
    );
};

// 2. ROLE HEADER CARD (Compact parent node representing the Role Akses, e.g. "Head", "Manager", "VP")
const RoleHeaderCard = ({ data }: NodeProps<Node<JobTreeNodeData>>) => {
    const { title, totalUsers, subItemsCount, isExpanded, onToggle, onSelect } = data;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <div
            className={cn(
                'w-[260px] rounded-2xl border-2 shadow-lg transition-all text-left relative cursor-grab active:cursor-grabbing backdrop-blur-md p-3.5 select-none',
                isDark
                    ? 'bg-gradient-to-br from-slate-900/95 via-zinc-900/90 to-zinc-950/95 border-violet-500/40 text-slate-100 shadow-violet-950/40'
                    : 'bg-gradient-to-br from-white via-violet-50/40 to-white border-violet-300 text-slate-900 shadow-violet-100/70'
            )}
            onClick={() => {
                if (typeof onSelect === 'function') onSelect(data);
            }}
        >
            {/* Left handle connects from Tier node */}
            <Handle
                id="role-left"
                type="target"
                position={Position.Left}
                className="!w-3.5 !h-3.5 !bg-violet-500 border-2 border-white dark:border-zinc-900 !-left-2"
            />

            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-600 dark:text-violet-400 shrink-0">
                        <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25">
                            ROLE AKSES
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate mt-1 leading-tight" title={title}>
                            {title}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-violet-200/60 dark:border-violet-800/60 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                    <Network className="w-3 h-3 text-violet-500" />
                    {subItemsCount || 0} Divisi
                </span>
                <span className="flex items-center gap-1 font-extrabold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/80 px-2 py-0.5 rounded-full border border-violet-300 dark:border-violet-800 text-[10px]">
                    <Users className="w-3 h-3" />
                    {totalUsers || 0} Orang
                </span>
            </div>

            {/* Right handle connects to Division child cards */}
            <Handle
                id="role-right"
                type="source"
                position={Position.Right}
                className="!w-3.5 !h-3.5 !bg-violet-500 border-2 border-white dark:border-zinc-900 !-right-2"
            />
        </div>
    );
};

// 3. DIVISION UNIFIED CARD (Contains Division Name + List of Employees with that Role in that Division)
const DivisionUnifiedCard = ({ data }: NodeProps<Node<JobTreeNodeData>>) => {
    const { title, subtitle, users, totalUsers, onSelect, onSelectUser } = data;
    const [filterText, setFilterText] = useState('');
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const displayed = useMemo(() => {
        if (!filterText.trim()) return users.slice(0, 50);
        const q = filterText.toLowerCase();
        return users
            .filter(
                (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.nik?.toLowerCase().includes(q) ||
                    u.department_name?.toLowerCase().includes(q) ||
                    u.job_title_name?.toLowerCase().includes(q)
            )
            .slice(0, 50);
    }, [users, filterText]);

    return (
        <div
            className={cn(
                'w-[320px] rounded-2xl border-2 shadow-lg transition-all text-left relative cursor-grab active:cursor-grabbing backdrop-blur-md overflow-hidden',
                isDark
                    ? 'bg-gradient-to-b from-slate-900 via-zinc-900 to-zinc-950 border-purple-500/30 text-slate-100 shadow-purple-950/40'
                    : 'bg-gradient-to-b from-white via-purple-50/20 to-white border-purple-200 text-slate-900 shadow-slate-200/80'
            )}
        >
            {/* Left handle connects from Role Header Card */}
            <Handle
                id="div-left"
                type="target"
                position={Position.Left}
                className="!w-3.5 !h-3.5 !bg-purple-500 border-2 border-white dark:border-zinc-900 !-left-2"
            />

            {/* Division Header */}
            <div
                className="p-3 border-b border-purple-500/15 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-transparent cursor-pointer transition-colors hover:bg-purple-500/15"
                onClick={() => {
                    if (typeof onSelect === 'function') onSelect(data);
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg border bg-purple-500/15 border-purple-500/25 text-purple-600 dark:text-purple-400 shrink-0">
                            <Network className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/25">
                                DIVISI / UNIT
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5 leading-tight" title={title}>
                                {title}
                            </h4>
                            {subtitle && (
                                <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/70 border-purple-300/80 dark:border-purple-800">
                        <Users className="w-3 h-3" />
                        {totalUsers} orang
                    </span>
                </div>
            </div>

            {/* In-Card Search (shown if > 2 people) */}
            {totalUsers > 2 && (
                <div className="px-3 pt-2 pb-1 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/80">
                    <div className="relative">
                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Cari ${totalUsers} orang...`}
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="h-6 w-full rounded-lg border border-slate-200/80 bg-white pl-7 pr-2 text-[10px] text-slate-900 focus:border-purple-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                        />
                    </div>
                </div>
            )}

            {/* Employee List inside the Division Card */}
            <div className="p-2 max-h-[250px] overflow-y-auto space-y-1.5 [scrollbar-width:thin]">
                {displayed.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                        Tidak ada orang ditemukan.
                    </div>
                ) : (
                    displayed.map((u) => (
                        <div
                            key={u.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (typeof onSelectUser === 'function') {
                                    onSelectUser(u);
                                } else if (typeof onSelect === 'function') {
                                    onSelect(data);
                                }
                            }}
                            className="p-1.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/50 border border-transparent flex items-center gap-2 cursor-pointer transition-all hover:bg-purple-500/10 dark:hover:bg-purple-950/40 hover:border-purple-500/20 group"
                        >
                            <div className="h-6 w-6 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0 border bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/25 group-hover:scale-105 transition-transform">
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                    {u.name}
                                </div>
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                    <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                                        {u.job_title_name || u.department_name || 'Staff'}
                                    </span>
                                    <span>·</span>
                                    <span className="font-mono text-[9px] text-slate-400">{u.nik}</span>
                                </div>
                                {u.reporting_to && (
                                    <div className="text-[8.5px] text-amber-600 dark:text-amber-400 truncate font-semibold flex items-center gap-1 mt-0.5">
                                        <UserCheck size={9} className="shrink-0" />
                                        <span>Atasan: {u.reporting_to}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {totalUsers > 50 && !filterText && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onSelect === 'function') onSelect(data);
                        }}
                        className="text-center py-1.5 text-[10px] font-bold hover:underline cursor-pointer text-purple-600 dark:text-purple-400"
                    >
                        + Buka {totalUsers - 50} orang lainnya di panel...
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. UNIFIED Position Card (Used in Jabatan mode: 1 Single Card containing Position Name AND its List of Employees)
const UnifiedJobPositionCard = ({ data }: NodeProps<Node<JobTreeNodeData>>) => {
    const { title, levelKey, levelLabel, users, totalUsers, onSelect, onSelectUser } = data;
    const [filterText, setFilterText] = useState('');
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const displayed = useMemo(() => {
        if (!filterText.trim()) return users.slice(0, 50);
        const q = filterText.toLowerCase();
        return users
            .filter(
                (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.nik?.toLowerCase().includes(q) ||
                    u.department_name?.toLowerCase().includes(q)
            )
            .slice(0, 50);
    }, [users, filterText]);

    const gradeLabel = users[0]?.job_level_name || 'Level Terstandar';

    return (
        <div
            className={cn(
                'w-[350px] rounded-2xl border-2 shadow-lg transition-all text-left relative cursor-grab active:cursor-grabbing backdrop-blur-md overflow-hidden',
                isDark
                    ? 'bg-gradient-to-b from-slate-900 via-zinc-900 to-zinc-950 border-cyan-500/30 text-slate-100 shadow-cyan-950/40'
                    : 'bg-gradient-to-b from-white via-slate-50/50 to-white border-cyan-200 text-slate-900 shadow-slate-200/80'
            )}
        >
            {/* Left Handle connects from Tier Header on the left */}
            <Handle
                id="pos-left"
                type="target"
                position={Position.Left}
                className="!w-3.5 !h-3.5 border-2 border-white dark:border-zinc-900 !-left-2 !bg-cyan-500"
            />
            {/* Top Handle for vertical fallback */}
            <Handle
                id="pos-top"
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 border-2 border-white dark:border-zinc-900 !-top-1.5 opacity-0 pointer-events-none !bg-cyan-500"
            />

            {/* Position Header */}
            <div
                className="p-3.5 border-b cursor-pointer transition-colors bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent border-cyan-500/15 hover:bg-cyan-500/15"
                onClick={() => {
                    if (typeof onSelect === 'function') onSelect(data);
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg border shrink-0 bg-cyan-500/15 border-cyan-500/25 text-cyan-600 dark:text-cyan-400">
                            <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25">
                                {gradeLabel}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-1 leading-tight" title={title}>
                                {title}
                            </h4>
                        </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border text-cyan-700 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-950/70 border-cyan-300/80 dark:border-cyan-800">
                        <Users className="w-3 h-3" />
                        {totalUsers} orang
                    </span>
                </div>
            </div>

            {/* In-Card Search (shown if > 2 people) */}
            {totalUsers > 2 && (
                <div className="px-3 pt-2.5 pb-1 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/80">
                    <div className="relative">
                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Cari di ${totalUsers} orang...`}
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="h-6 w-full rounded-lg border border-slate-200/80 bg-white pl-7 pr-2 text-[10px] text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                        />
                    </div>
                </div>
            )}

            {/* Employee List inside the Unified Card */}
            <div className="p-2 max-h-[260px] overflow-y-auto space-y-1.5 [scrollbar-width:thin]">
                {displayed.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-400">
                        Tidak ada orang ditemukan.
                    </div>
                ) : (
                    displayed.map((u) => (
                        <div
                            key={u.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (typeof onSelectUser === 'function') {
                                    onSelectUser(u);
                                } else if (typeof onSelect === 'function') {
                                    onSelect(data);
                                }
                            }}
                            className="p-1.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/50 border border-transparent flex items-center gap-2 cursor-pointer transition-all hover:bg-cyan-500/10 dark:hover:bg-cyan-950/40 hover:border-cyan-500/20 group"
                        >
                            <div className="h-6 w-6 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0 border bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25 group-hover:scale-105 transition-transform">
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                                    {u.name}
                                </div>
                                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                    <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                                        {u.department_name || u.division_name}
                                    </span>
                                    <span>·</span>
                                    <span className="font-mono text-[9px] text-slate-400">{u.nik}</span>
                                </div>
                                {u.reporting_to && (
                                    <div className="text-[8.5px] text-amber-600 dark:text-amber-400 truncate font-semibold flex items-center gap-1 mt-0.5">
                                        <UserCheck size={9} className="shrink-0" />
                                        <span>Atasan: {u.reporting_to}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {totalUsers > 50 && !filterText && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onSelect === 'function') onSelect(data);
                        }}
                        className="text-center py-1.5 text-[10px] font-bold hover:underline cursor-pointer text-cyan-600 dark:text-cyan-400"
                    >
                        + Buka {totalUsers - 50} orang lainnya di panel...
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-3 !h-3 !bg-cyan-500 border-2 border-white dark:border-zinc-900 !-bottom-1.5 opacity-0 pointer-events-none"
            />
        </div>
    );
};

const nodeTypes = {
    job_tier_node: JobTierNode,
    role_header_card: RoleHeaderCard,
    division_unified_card: DivisionUnifiedCard,
    job_position_card: UnifiedJobPositionCard,
};

export function JobHierarchyFlow({
    users,
    masterGroups = [],
    masterOrganizationGroups = [],
    masterRegions = [],
    masterLocations = [],
    masterCompanies = [],
    masterDivisions = [],
    masterDepartments = [],
    masterSubdepartments = [],
    masterSections = [],
    masterJobLevelGroups = [],
    masterJobLevels = [],
    masterJobTitles = [],
    masterRoles = [],
    // Group by mode (job_title vs role)
    groupByMode: extGroupByMode,
    onGroupByModeChange: extOnGroupByModeChange,
    usedFilter: extUsedFilter,
    searchQuery: extSearchQuery,
    selectedGroups: extSelectedGroups,
    selectedOrganizationGroups: extSelectedOrgGroups,
    selectedRegions: extSelectedRegions,
    selectedLocations: extSelectedLocations,
    selectedCompanies: extSelectedCompanies,
    selectedDivisions: extSelectedDivisions,
    selectedDepartments: extSelectedDepartments,
    selectedSubdepartments: extSelectedSubdepartments,
    selectedSections: extSelectedSections,
    selectedJobLevelGroups: extSelectedJobLevelGroups,
    selectedJobLevels: extSelectedJobLevels,
    selectedJobTitles: extSelectedJobTitles,
    selectedRoles: extSelectedRoles,
    visibleTiers: extVisibleTiers,
}: Readonly<Props>) {
    const savedInitial = useMemo(() => loadSavedJobSettings(), []);

    const [internalGroupByMode, setInternalGroupByMode] = useState<'job_title' | 'role'>(() => {
        return savedInitial.groupByMode || 'job_title';
    });
    const groupByMode = extGroupByMode ?? internalGroupByMode;

    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const searchQuery = extSearchQuery ?? internalSearchQuery;
    const [userSearchText, setUserSearchText] = useState('');
    const [selectedNode, setSelectedNode] = useState<JobTreeNodeData | null>(null);
    const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
    const [isSyncing, setIsSyncing] = useState(false);

    // Filter is_used: 'used_only' | 'all'
    const [internalUsedFilter, setInternalUsedFilter] = useState<'used_only' | 'all'>(() => {
        return savedInitial.usedFilter || 'used_only';
    });
    const usedFilter = extUsedFilter ?? internalUsedFilter;

    // Minimizable Toolbar State
    const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

    const [isConfigOpen, setIsConfigOpen] = useState<boolean>(() => {
        return savedInitial.isConfigOpen !== undefined ? savedInitial.isConfigOpen : true;
    });

    // Multi-select state filters
    const [internalSelectedGroups, setInternalSelectedGroups] = useState<string[]>(() => savedInitial.selectedGroups || []);
    const [internalSelectedOrganizationGroups, setInternalSelectedOrganizationGroups] = useState<string[]>(() => savedInitial.selectedOrganizationGroups || []);
    const [internalSelectedRegions, setInternalSelectedRegions] = useState<string[]>(() => savedInitial.selectedRegions || []);
    const [internalSelectedLocations, setInternalSelectedLocations] = useState<string[]>(() => savedInitial.selectedLocations || []);
    const [internalSelectedCompanies, setInternalSelectedCompanies] = useState<string[]>(() => savedInitial.selectedCompanies || []);
    const [internalSelectedDivisions, setInternalSelectedDivisions] = useState<string[]>(() => savedInitial.selectedDivisions || []);
    const [internalSelectedDepartments, setInternalSelectedDepartments] = useState<string[]>(() => savedInitial.selectedDepartments || []);
    const [internalSelectedSubdepartments, setInternalSelectedSubdepartments] = useState<string[]>(() => savedInitial.selectedSubdepartments || []);
    const [internalSelectedSections, setInternalSelectedSections] = useState<string[]>(() => savedInitial.selectedSections || []);
    const [internalSelectedJobLevelGroups, setInternalSelectedJobLevelGroups] = useState<string[]>(() => savedInitial.selectedJobLevelGroups || []);
    const [internalSelectedJobLevels, setInternalSelectedJobLevels] = useState<string[]>(() => savedInitial.selectedJobLevels || []);
    const [internalSelectedJobTitles, setInternalSelectedJobTitles] = useState<string[]>(() => savedInitial.selectedJobTitles || []);
    const [internalSelectedRoles, setInternalSelectedRoles] = useState<string[]>(() => savedInitial.selectedRoles || []);

    const selectedGroups = extSelectedGroups ?? internalSelectedGroups;
    const selectedOrganizationGroups = extSelectedOrgGroups ?? internalSelectedOrganizationGroups;
    const selectedRegions = extSelectedRegions ?? internalSelectedRegions;
    const selectedLocations = extSelectedLocations ?? internalSelectedLocations;
    const selectedCompanies = extSelectedCompanies ?? internalSelectedCompanies;
    const selectedDivisions = extSelectedDivisions ?? internalSelectedDivisions;
    const selectedDepartments = extSelectedDepartments ?? internalSelectedDepartments;
    const selectedSubdepartments = extSelectedSubdepartments ?? internalSelectedSubdepartments;
    const selectedSections = extSelectedSections ?? internalSelectedSections;
    const selectedJobLevelGroups = extSelectedJobLevelGroups ?? internalSelectedJobLevelGroups;
    const selectedJobLevels = extSelectedJobLevels ?? internalSelectedJobLevels;
    const selectedJobTitles = extSelectedJobTitles ?? internalSelectedJobTitles;
    const selectedRoles = extSelectedRoles ?? internalSelectedRoles;

    const [internalVisibleTiers, setInternalVisibleTiers] = useState<Record<string, boolean>>(() => {
        return (
            savedInitial.visibleTiers || {
                tier_1_c_level: true,
                tier_2_vp: true,
                tier_3_head: true,
                tier_4_gm: true,
                tier_5_manager: true,
                tier_6_asst_manager: true,
                tier_7_supervisor: true,
                tier_8_staff: true,
                tier_9_non_staff: true,
            }
        );
    });
    const visibleTiers = extVisibleTiers ?? internalVisibleTiers;

    // Auto-save client-side cache to localStorage
    useEffect(() => {
        try {
            const stateToSave: SavedJobHierarchySettings = {
                usedFilter,
                selectedGroups,
                selectedOrganizationGroups,
                selectedRegions,
                selectedLocations,
                selectedCompanies,
                selectedDivisions,
                selectedDepartments,
                selectedSubdepartments,
                selectedSections,
                selectedJobLevelGroups,
                selectedJobLevels,
                selectedJobTitles,
                selectedRoles,
                isConfigOpen,
                visibleTiers,
            };
            localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch {
            // Handle quota or permission errors silently
        }
    }, [
        usedFilter,
        selectedGroups,
        selectedOrganizationGroups,
        selectedRegions,
        selectedLocations,
        selectedCompanies,
        selectedDivisions,
        selectedDepartments,
        selectedSubdepartments,
        selectedSections,
        selectedJobLevelGroups,
        selectedJobLevels,
        selectedJobTitles,
        selectedRoles,
        isConfigOpen,
        visibleTiers,
    ]);

    // Available options filtered by usedFilter
    const getFilteredMaster = (items: MasterItem[]) => {
        if (usedFilter === 'used_only') {
            return items.filter((i) => (i.is_used !== undefined ? Boolean(i.is_used) : true));
        }
        return items;
    };

    const optGroups = useMemo(() => getFilteredMaster(masterGroups), [masterGroups, usedFilter]);
    const optOrganizationGroups = useMemo(() => getFilteredMaster(masterOrganizationGroups), [masterOrganizationGroups, usedFilter]);
    const optRegions = useMemo(() => getFilteredMaster(masterRegions), [masterRegions, usedFilter]);
    const optLocations = useMemo(() => getFilteredMaster(masterLocations), [masterLocations, usedFilter]);
    const optCompanies = useMemo(() => getFilteredMaster(masterCompanies), [masterCompanies, usedFilter]);
    const optDivisions = useMemo(() => getFilteredMaster(masterDivisions), [masterDivisions, usedFilter]);
    const optDepartments = useMemo(() => getFilteredMaster(masterDepartments), [masterDepartments, usedFilter]);
    const optSubdepartments = useMemo(() => getFilteredMaster(masterSubdepartments), [masterSubdepartments, usedFilter]);
    const optSections = useMemo(() => getFilteredMaster(masterSections), [masterSections, usedFilter]);
    const optJobLevelGroups = useMemo(() => getFilteredMaster(masterJobLevelGroups), [masterJobLevelGroups, usedFilter]);
    const optJobLevels = useMemo(() => getFilteredMaster(masterJobLevels), [masterJobLevels, usedFilter]);
    const optJobTitles = useMemo(() => getFilteredMaster(masterJobTitles), [masterJobTitles, usedFilter]);
    const optRoles = useMemo(() => masterRoles, [masterRoles]);

    // Reset all multiple filters & clear client-side saved cache
    const resetAllFilters = () => {
        setSelectedGroups([]);
        setSelectedOrganizationGroups([]);
        setSelectedRegions([]);
        setSelectedLocations([]);
        setSelectedCompanies([]);
        setSelectedDivisions([]);
        setSelectedDepartments([]);
        setSelectedSubdepartments([]);
        setSelectedSections([]);
        setSelectedJobLevelGroups([]);
        setSelectedJobLevels([]);
        setSelectedJobTitles([]);
        setSelectedRoles([]);
        setSearchQuery('');
        try {
            localStorage.removeItem(JOB_STORAGE_KEY);
        } catch {
            // Ignore
        }
    };

    const hasActiveMultiFilters =
        selectedGroups.length > 0 ||
        selectedOrganizationGroups.length > 0 ||
        selectedRegions.length > 0 ||
        selectedLocations.length > 0 ||
        selectedCompanies.length > 0 ||
        selectedDivisions.length > 0 ||
        selectedDepartments.length > 0 ||
        selectedSubdepartments.length > 0 ||
        selectedSections.length > 0 ||
        selectedJobLevelGroups.length > 0 ||
        selectedJobLevels.length > 0 ||
        selectedJobTitles.length > 0 ||
        selectedRoles.length > 0 ||
        Boolean(searchQuery.trim());

    const toggleCollapse = (id: string) => {
        setCollapsedNodeIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSyncData = () => {
        setIsSyncing(true);
        router.get(
            '/admin/members',
            { refresh: 1, tab: 'job' },
            {
                preserveState: false,
                preserveScroll: true,
                onFinish: () => setIsSyncing(false),
            }
        );
    };

    // Filter users by full multi-select criteria
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            // Strictly check employee's own is_used status when usedFilter is 'used_only'
            if (usedFilter === 'used_only' && !u.is_used) {
                return false;
            }

            // Group Filter
            if (selectedGroups.length > 0 && !selectedGroups.some((g) => g.toLowerCase() === u.group_name?.toLowerCase())) {
                return false;
            }
            // Organization Group Filter
            if (selectedOrganizationGroups.length > 0 && !selectedOrganizationGroups.some((og) => og.toLowerCase() === (u.org_group_name || '').toLowerCase())) {
                return false;
            }
            // Region Filter
            if (selectedRegions.length > 0 && !selectedRegions.some((r) => r.toLowerCase() === u.region_name?.toLowerCase())) {
                return false;
            }
            // Location Filter
            if (selectedLocations.length > 0 && !selectedLocations.some((l) => l.toLowerCase() === u.location_name?.toLowerCase())) {
                return false;
            }
            // Company Filter
            if (selectedCompanies.length > 0 && !selectedCompanies.some((c) => c.toLowerCase() === u.company_name?.toLowerCase())) {
                return false;
            }
            // Division Filter
            if (selectedDivisions.length > 0 && !selectedDivisions.some((div) => div.toLowerCase() === (u.division_name || '').toLowerCase())) {
                return false;
            }
            // Department Filter
            if (selectedDepartments.length > 0 && !selectedDepartments.some((d) => d.toLowerCase() === u.department_name?.toLowerCase())) {
                return false;
            }
            // Subdepartment Filter
            if (selectedSubdepartments.length > 0 && !selectedSubdepartments.some((sub) => sub.toLowerCase() === (u.subdepartment_name || '').toLowerCase())) {
                return false;
            }
            // Section Filter
            if (selectedSections.length > 0 && !selectedSections.some((sec) => sec.toLowerCase() === (u.section_name || '').toLowerCase())) {
                return false;
            }
            // Job Level Group Filter
            if (selectedJobLevelGroups.length > 0 && !selectedJobLevelGroups.some((jlg) => jlg.toLowerCase() === ((u as any).job_level_group_name || '').toLowerCase())) {
                return false;
            }
            // Job Level Filter
            if (selectedJobLevels.length > 0 && !selectedJobLevels.some((jl) => jl.toLowerCase() === (u.job_level_name || '').toLowerCase())) {
                return false;
            }
            // Job Title Filter
            if (selectedJobTitles.length > 0 && !selectedJobTitles.some((j) => j.toLowerCase() === u.job_title_name?.toLowerCase())) {
                return false;
            }
            // Role Access Filter
            if (selectedRoles.length > 0 && !selectedRoles.some((r) => r.toLowerCase() === (u.role_name || '').toLowerCase())) {
                return false;
            }

            // Global search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matches =
                    u.name?.toLowerCase().includes(q) ||
                    u.nik?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q) ||
                    u.group_name?.toLowerCase().includes(q) ||
                    (u.org_group_name && u.org_group_name.toLowerCase().includes(q)) ||
                    u.region_name?.toLowerCase().includes(q) ||
                    u.company_name?.toLowerCase().includes(q) ||
                    (u.division_name && u.division_name.toLowerCase().includes(q)) ||
                    u.department_name?.toLowerCase().includes(q) ||
                    (u.subdepartment_name && u.subdepartment_name.toLowerCase().includes(q)) ||
                    (u.section_name && u.section_name.toLowerCase().includes(q)) ||
                    ((u as any).job_level_group_name && (u as any).job_level_group_name.toLowerCase().includes(q)) ||
                    (u.job_level_name && u.job_level_name.toLowerCase().includes(q)) ||
                    u.job_title_name?.toLowerCase().includes(q) ||
                    (u.role_name && u.role_name.toLowerCase().includes(q));
                if (!matches) return false;
            }

            return true;
        });
    }, [
        users,
        usedFilter,
        selectedGroups,
        selectedOrganizationGroups,
        selectedRegions,
        selectedLocations,
        selectedCompanies,
        selectedDivisions,
        selectedDepartments,
        selectedSubdepartments,
        selectedSections,
        selectedJobLevelGroups,
        selectedJobLevels,
        selectedJobTitles,
        selectedRoles,
        searchQuery,
    ]);

    /**
     * Compute Initial Layout for Nodes and Edges
     * Unified clean layout: Tier Node -> Unified Position Cards (1 card per position)
     */
    const computedFlow = useMemo(() => {
        const generatedNodes: Node<JobTreeNodeData>[] = [];
        const generatedEdges: Edge[] = [];

        const currentTierDefs = groupByMode === 'role' ? ROLE_TIERS : SENIORITY_TIERS;

        // 1. Group filtered users by Seniority / Role Tier
        const usersByTier = new Map<SeniorityTierKey, HierarchyUser[]>();
        currentTierDefs.forEach((t) => usersByTier.set(t.key, []));

        filteredUsers.forEach((u) => {
            const tierKey = classifyUserTier(u, groupByMode);
            usersByTier.get(tierKey)?.push(u);
        });

        // 2. Filter active tiers that have users and are enabled in visibleTiers
        const activeTiers = currentTierDefs.filter((t) => {
            if (visibleTiers[t.key] === false) return false;
            const count = (usersByTier.get(t.key) || []).length;
            return count > 0;
        });

        let currentY = 50;
        const TIER_X = 50;
        const TIER_WIDTH = 380;
        const TIER_TO_POSITION_GAP = 120; // horizontal gap between Tier card and first Position card
        const POSITION_CARD_WIDTH = 350;
        const POSITION_HORIZONTAL_GAP = 35;
        const POSITION_STEP = POSITION_CARD_WIDTH + POSITION_HORIZONTAL_GAP;

        let previousTierNodeId: string | null = null;

        activeTiers.forEach((tierDef, tierIdx) => {
            const tierUsers = usersByTier.get(tierDef.key) || [];
            const tierNodeId = `tier__${tierDef.key}`;
            const isTierCollapsed = collapsedNodeIds.has(tierNodeId);

            // Group users in this tier by either Job Title or Role Akses based on groupByMode
            const groupMap = new Map<string, HierarchyUser[]>();
            tierUsers.forEach((u) => {
                const groupKey = groupByMode === 'role'
                    ? (u.role_name || 'Member')
                    : (u.job_title_name || 'Tanpa Posisi');
                if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
                groupMap.get(groupKey)!.push(u);
            });

            const distinctGroupKeys = Array.from(groupMap.keys()).sort();

            // Tier Header Node placed cleanly on the Left Backbone Column (TIER_X)
            generatedNodes.push({
                id: tierNodeId,
                type: 'job_tier_node',
                position: { x: TIER_X, y: currentY },
                draggable: true,
                data: {
                    nodeId: tierNodeId,
                    title: tierDef.title,
                    label: tierDef.title,
                    subtitle: tierDef.subtitle,
                    levelKey: tierDef.key,
                    levelLabel: groupByMode === 'role'
                        ? `JENJANG ROLE ${tierDef.rank} · ${tierDef.title.split(' ')[0]}`
                        : `LEVEL ${tierDef.rank} · ${tierDef.title.split(' ')[0]}`,
                    badgeBg: tierDef.badgeBg,
                    users: tierUsers,
                    totalUsers: tierUsers.length,
                    subItemsCount: distinctGroupKeys.length,
                    hasChildren: distinctGroupKeys.length > 0,
                    isExpanded: !isTierCollapsed,
                    onToggle: () => toggleCollapse(tierNodeId),
                    onSelect: (d) => setSelectedNode(d),
                },
            });

            // Connect Seniority Backbone Line straight DOWN from previous Tier to current Tier
            if (previousTierNodeId) {
                generatedEdges.push({
                    id: `edge_seniority_${previousTierNodeId}_${tierNodeId}`,
                    source: previousTierNodeId,
                    sourceHandle: 'tier-bottom',
                    target: tierNodeId,
                    targetHandle: 'tier-top',
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: tierDef.edgeColor, strokeWidth: 3 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: tierDef.edgeColor,
                        width: 18,
                        height: 18,
                    },
                });
            }
            previousTierNodeId = tierNodeId;

            // Render Cards horizontally to the RIGHT of this Tier Line
            if (!isTierCollapsed) {
                if (groupByMode === 'role') {
                    // =========================================================================
                    // ROLE MODE: Tier -> Role Card -> Division Cards (with employee lists)
                    // =========================================================================
                    let rolePositionX = TIER_X + TIER_WIDTH + TIER_TO_POSITION_GAP;
                    let maxDivisionRowsInTier = 1;

                    distinctGroupKeys.forEach((roleName) => {
                        const roleUsers = groupMap.get(roleName) || [];
                        const roleNodeId = `role_card__${tierDef.key}__${roleName}`;

                        // Group role users by division
                        const divMap = new Map<string, HierarchyUser[]>();
                        roleUsers.forEach((u) => {
                            const div = u.division_name || u.company_name || 'Umum / Lainnya';
                            if (!divMap.has(div)) divMap.set(div, []);
                            divMap.get(div)!.push(u);
                        });

                        const distinctDivisions = Array.from(divMap.keys()).sort();
                        if (distinctDivisions.length > maxDivisionRowsInTier) {
                            maxDivisionRowsInTier = distinctDivisions.length;
                        }

                        // 1. ROLE CARD
                        generatedNodes.push({
                            id: roleNodeId,
                            type: 'role_header_card',
                            position: { x: rolePositionX, y: currentY },
                            draggable: true,
                            data: {
                                nodeId: roleNodeId,
                                title: roleName,
                                label: roleName,
                                levelKey: 'role',
                                levelLabel: 'Role Akses',
                                users: roleUsers,
                                totalUsers: roleUsers.length,
                                subItemsCount: distinctDivisions.length,
                                onSelect: (d) => setSelectedNode(d),
                            },
                        });

                        // Connector: Tier Node -> Role Card
                        generatedEdges.push({
                            id: `edge_${tierNodeId}_${roleNodeId}`,
                            source: tierNodeId,
                            sourceHandle: 'tier-right',
                            target: roleNodeId,
                            targetHandle: 'role-left',
                            type: 'straight',
                            style: { stroke: '#8b5cf6', strokeWidth: 2 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#8b5cf6',
                                width: 14,
                                height: 14,
                            },
                        });

                        // 2. DIVISION CARDS (Rendered to the right of the Role Card)
                        const DIVISION_X = rolePositionX + 260 + 80;
                        const DIVISION_HEIGHT = 270;
                        const DIVISION_GAP = 25;

                        distinctDivisions.forEach((divName, divIdx) => {
                            const divUsers = divMap.get(divName) || [];
                            const divNodeId = `div_card__${tierDef.key}__${roleName}__${divName}`;
                            const divY = currentY + divIdx * (DIVISION_HEIGHT + DIVISION_GAP);

                            generatedNodes.push({
                                id: divNodeId,
                                type: 'division_unified_card',
                                position: { x: DIVISION_X, y: divY },
                                draggable: true,
                                data: {
                                    nodeId: divNodeId,
                                    title: divName,
                                    label: divName,
                                    subtitle: `Role: ${roleName}`,
                                    levelKey: 'division',
                                    levelLabel: 'Divisi',
                                    users: divUsers,
                                    totalUsers: divUsers.length,
                                    onSelect: (d) => setSelectedNode(d),
                                    onSelectUser: (u) => {
                                        setSelectedNode({
                                            title: u.name,
                                            label: u.name,
                                            levelKey: 'user',
                                            levelLabel: `${u.role_name || 'Role'} · ${u.division_name || 'Divisi'}`,
                                            users: [u],
                                            totalUsers: 1,
                                            badgeBg: 'bg-violet-100 text-violet-800 border-violet-300',
                                        });
                                    },
                                },
                            });

                            // Connector: Role Card -> Division Card
                            generatedEdges.push({
                                id: `edge_${roleNodeId}_${divNodeId}`,
                                source: roleNodeId,
                                sourceHandle: 'role-right',
                                target: divNodeId,
                                targetHandle: 'div-left',
                                type: 'smoothstep',
                                style: { stroke: '#a855f7', strokeWidth: 1.8 },
                                markerEnd: {
                                    type: MarkerType.ArrowClosed,
                                    color: '#a855f7',
                                    width: 12,
                                    height: 12,
                                },
                            });
                        });

                        // Advance X for next role branch (account for division width)
                        rolePositionX += 260 + 80 + 320 + 80;
                    });

                    // Dynamic row height spacing for next tier
                    const tierRowHeight = Math.max(380, maxDivisionRowsInTier * 295 + 60);
                    currentY += tierRowHeight;
                } else {
                    // =========================================================================
                    // JABATAN MODE: Tier -> Unified Position Cards
                    // =========================================================================
                    let positionX = TIER_X + TIER_WIDTH + TIER_TO_POSITION_GAP;

                    distinctGroupKeys.forEach((groupName) => {
                        const groupUsers = groupMap.get(groupName) || [];
                        const positionId = `card__${tierDef.key}__${groupName}`;

                        // Unified Card (contains Position info + its Employees list)
                        generatedNodes.push({
                            id: positionId,
                            type: 'job_position_card',
                            position: { x: positionX, y: currentY },
                            draggable: true,
                            data: {
                                nodeId: positionId,
                                title: groupName,
                                label: groupName,
                                levelKey: 'job_title',
                                levelLabel: 'Posisi / Jabatan',
                                users: groupUsers,
                                totalUsers: groupUsers.length,
                                onSelect: (d) => setSelectedNode(d),
                                onSelectUser: (u) => {
                                    setSelectedNode({
                                        title: u.name,
                                        label: u.name,
                                        levelKey: 'user',
                                        levelLabel: u.job_title_name || 'Karyawan',
                                        users: [u],
                                        totalUsers: 1,
                                        badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
                                    });
                                },
                            },
                        });

                        // Straight horizontal line connector directly to Card
                        generatedEdges.push({
                            id: `edge_${tierNodeId}_${positionId}`,
                            source: tierNodeId,
                            sourceHandle: 'tier-right',
                            target: positionId,
                            targetHandle: 'pos-left',
                            type: 'straight',
                            style: { stroke: '#06b6d4', strokeWidth: 2 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#06b6d4',
                                width: 14,
                                height: 14,
                            },
                        });

                        // Advance X for the next card in this tier row
                        positionX += POSITION_STEP;
                    });

                    // Calculate height spacing so the next tier node has clean vertical clearance
                    const tierRowHeight = (!isTierCollapsed && distinctGroupKeys.length > 0) ? 380 : 180;
                    currentY += tierRowHeight;
                }
            } else {
                currentY += 180;
            }
        });

        return { nodes: generatedNodes, edges: generatedEdges };
    }, [filteredUsers, collapsedNodeIds, visibleTiers, groupByMode]);

    // Live Node & Edge States for interactive Drag & Drop
    const [nodes, setNodes] = useState<Node<JobTreeNodeData>[]>(computedFlow.nodes);
    const [edges, setEdges] = useState<Edge[]>(computedFlow.edges);

    useEffect(() => {
        setNodes(computedFlow.nodes);
        setEdges(computedFlow.edges);
    }, [computedFlow]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    // Filter people list in the open drawer
    const displayedUsersInDrawer = useMemo(() => {
        if (!selectedNode) return [];
        if (!userSearchText.trim()) return selectedNode.users;
        const q = userSearchText.toLowerCase();
        return selectedNode.users.filter(
            (u) =>
                u.name?.toLowerCase().includes(q) ||
                u.nik?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.department_name?.toLowerCase().includes(q) ||
                u.job_title_name?.toLowerCase().includes(q)
        );
    }, [selectedNode, userSearchText]);

    return (
        <div className="flex h-full w-full flex-col bg-slate-50 dark:bg-zinc-950 relative overflow-hidden">
            {/* Flow Canvas with Drag & Drop */}
            <div className="flex-1 w-full h-full min-h-[500px] relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    onInit={setReactFlowInstance}
                    nodesDraggable={true}
                    elementsSelectable={true}
                    fitView
                    minZoom={0.1}
                    maxZoom={1.8}
                    attributionPosition="bottom-left"
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} />
                    <Controls position="bottom-right" className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !rounded-lg !shadow-md" />
                    <MiniMap
                        position="bottom-left"
                        nodeColor={(n) => {
                            if (n.type === 'job_tier_node') return '#f59e0b';
                            return '#06b6d4';
                        }}
                        className="!bg-white/80 dark:!bg-slate-900/80 !border-slate-200 dark:!border-slate-800 !rounded-lg !shadow-md"
                    />
                </ReactFlow>
            </div>

            {/* Right Side Drawer for Detailed People List when Node Clicked */}
            {selectedNode && (
                <div className="absolute inset-y-0 right-0 w-96 max-w-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
                    {/* Drawer Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-start justify-between bg-slate-50 dark:bg-zinc-900">
                        <div>
                            <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border', selectedNode.badgeBg || 'bg-amber-100 text-amber-800 border-amber-300')}>
                                {selectedNode.levelLabel}
                            </span>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-1 break-words">
                                {selectedNode.title}
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Total <strong>{selectedNode.totalUsers}</strong> orang terdaftar di hierarki ini
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Search inside Drawer */}
                    <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter nama atau NIK di list ini..."
                                value={userSearchText}
                                onChange={(e) => setUserSearchText(e.target.value)}
                                className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 focus:border-primary focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                            />
                            {userSearchText && (
                                <button
                                    onClick={() => setUserSearchText('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List of People */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-zinc-800/60 [scrollbar-width:thin]">
                        {displayedUsersInDrawer.length === 0 ? (
                            <div className="text-center py-10 text-xs text-slate-400">
                                Tidak ada orang ditemukan dengan filter pencarian ini.
                            </div>
                        ) : (
                            displayedUsersInDrawer.map((u) => (
                                <div key={u.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/20">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={u.name}>
                                                {u.name}
                                            </h4>
                                            <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded">
                                                {u.role_name || 'Staff'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">
                                                {u.job_title_name}
                                            </p>
                                            {u.job_level_name && (
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 shrink-0">
                                                    {u.job_level_name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                            {u.reporting_to && (
                                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-sans font-semibold">
                                                    <UserCheck size={11} className="shrink-0" />
                                                    <span className="truncate">Atasan Langsung: {u.reporting_to}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <IdCard size={11} className="text-slate-400 shrink-0" />
                                                <span>NIK: {u.nik}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Mail size={11} className="text-slate-400 shrink-0" />
                                                <a href={`mailto:${u.email}`} className="hover:text-primary truncate">
                                                    {u.email}
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Building size={11} className="shrink-0" />
                                                <span className="truncate">
                                                    {u.company_name}
                                                    {u.org_group_name ? ` · Org: ${u.org_group_name}` : ''}
                                                    {u.division_name ? ` · Div: ${u.division_name}` : ''}
                                                    {` · Dept: ${u.department_name}`}
                                                    {u.subdepartment_name ? ` · Sub: ${u.subdepartment_name}` : ''}
                                                    {u.section_name ? ` · Sec: ${u.section_name}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-right">
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                            Tutup Panel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
