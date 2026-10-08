import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    Handle,
    MarkerType,
    MiniMap,
    Node,
    NodeProps,
    OnEdgesChange,
    OnNodesChange,
    Position,
    ReactFlow,
    ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Award,
    Briefcase,
    Building,
    ChevronDown,
    ChevronUp,
    Crown,
    IdCard,
    Layers,
    Mail,
    Network,
    Search,
    Shield,
    UserCheck,
    Users,
    Workflow,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HierarchyUser } from '../OrgHierarchy/OrgHierarchyFlow';

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
    if (/\b(VP|VICE PRESIDENT|EVP|SVP|AVP)\b/.test(titleStr) || [76, 51, 52].includes(rank)) {
        return 'tier_2_vp';
    }

    // 2. Check Job Title First for Head (e.g. BUSINESS DEVELOPMENT HEAD, TAX HEAD, DIV HEAD, DEPT HEAD)
    if (/\b(HEAD|DIV HEAD|DEPT HEAD|SECTION HEAD|HEAD OF)\b/.test(titleStr) || [44, 45, 46, 47].includes(rank)) {
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
    if ([74, 73, 65, 66, 48, 49, 50].includes(rank) || /\b(DIRECTOR|CHIEF|CEO|MD|DMD|MANAGEMENT|PRESIDENT|DIREKSI|KOMISARIS)\b/.test(searchString)) {
        return 'tier_1_c_level';
    }

    // 4. Senior Manager & General Manager
    if ([72, 71, 43, 42, 41, 40].includes(rank) || /\b(GM|GENERAL MANAGER|SENIOR MANAGER|SR\. MANAGER|GROUP MANAGER)\b/.test(searchString)) {
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
    if ([58, 57, 56, 55, 54, 53, 29, 28].includes(rank) || /\b(SUPERVISOR|SENIOR OFFICER|SENIOR ASSISTAN|SR\. OFFICER|SPV)\b/.test(searchString)) {
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
                'relative w-[380px] cursor-grab rounded-2xl border-2 px-5 py-4 shadow-xl backdrop-blur-md transition-all select-none active:cursor-grabbing',
                isRoleMode
                    ? isDark
                        ? 'border-violet-500/40 bg-gradient-to-br from-slate-900/95 via-zinc-900/90 to-zinc-950/95 text-slate-100 shadow-violet-950/30'
                        : 'border-violet-300/70 bg-gradient-to-br from-white via-violet-50/25 to-white text-slate-900 shadow-violet-100/60'
                    : isDark
                      ? 'border-amber-500/40 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 text-slate-100 shadow-amber-950/30'
                      : 'border-amber-300/70 bg-gradient-to-br from-white via-amber-50/25 to-white text-slate-900 shadow-amber-100/60',
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
                className={cn('!-top-2 !h-3.5 !w-3.5 border-2 border-white dark:border-slate-900', isRoleMode ? '!bg-violet-500' : '!bg-amber-500')}
            />

            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'shrink-0 rounded-xl border p-2.5',
                            isRoleMode
                                ? 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                        )}
                    >
                        {isRoleMode ? <Shield className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
                    </div>
                    <div>
                        <span
                            className={cn(
                                'rounded-md border px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase',
                                data.badgeBg ||
                                    (isRoleMode ? 'border-violet-300 bg-violet-100 text-violet-800' : 'border-amber-300 bg-amber-100 text-amber-800'),
                            )}
                        >
                            {data.levelLabel || (isRoleMode ? 'JENJANG ROLE' : 'JENJANG JABATAN')}
                        </span>
                        <h4 className="mt-1 line-clamp-1 text-sm font-extrabold tracking-tight">
                            {String(data.title || data.label || 'Jenjang Jabatan')}
                        </h4>
                        {data.subtitle && <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">{data.subtitle}</p>}
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2.5 text-xs dark:border-slate-800">
                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                    {isRoleMode ? <Shield className="h-3.5 w-3.5 text-violet-500" /> : <Briefcase className="h-3.5 w-3.5 text-amber-500" />}
                    {Number(data.subItemsCount || 0)} {isRoleMode ? 'Role Akses' : 'Posisi Jabatan'}
                </span>
                <span
                    className={cn(
                        'flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-extrabold',
                        isRoleMode
                            ? 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    )}
                >
                    <Users className="h-3.5 w-3.5" />
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
                        'absolute -bottom-3 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md transition-colors',
                        isRoleMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-amber-600 hover:bg-amber-500',
                    )}
                    title={isExpanded ? (isRoleMode ? 'Sembunyikan Role' : 'Sembunyikan Posisi') : isRoleMode ? 'Buka Role' : 'Tampilkan Posisi'}
                >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    <span>{isExpanded ? 'Sembunyikan' : isRoleMode ? 'Buka Role' : 'Buka Posisi'}</span>
                </button>
            )}

            {/* Bottom Handle for Seniority hierarchy line down to next tier */}
            <Handle
                id="tier-bottom"
                type="source"
                position={Position.Bottom}
                className={cn(
                    '!-bottom-2 !h-3.5 !w-3.5 border-2 border-white dark:border-slate-900',
                    isRoleMode ? '!bg-violet-500' : '!bg-amber-500',
                )}
            />

            {/* Right Handle to connect cleanly to horizontal position cards on the right */}
            <Handle
                id="tier-right"
                type="source"
                position={Position.Right}
                className={cn('!-right-2 !h-3.5 !w-3.5 border-2 border-white dark:border-slate-900', isRoleMode ? '!bg-violet-500' : '!bg-cyan-500')}
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
                'relative w-[260px] cursor-grab rounded-2xl border-2 p-3.5 text-left shadow-lg backdrop-blur-md transition-all select-none active:cursor-grabbing',
                isDark
                    ? 'border-violet-500/40 bg-gradient-to-br from-slate-900/95 via-zinc-900/90 to-zinc-950/95 text-slate-100 shadow-violet-950/40'
                    : 'border-violet-300 bg-gradient-to-br from-white via-violet-50/40 to-white text-slate-900 shadow-violet-100/70',
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
                className="!-left-2 !h-3.5 !w-3.5 border-2 border-white !bg-violet-500 dark:border-zinc-900"
            />

            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="shrink-0 rounded-xl border border-violet-500/25 bg-violet-500/15 p-2 text-violet-600 dark:text-violet-400">
                        <Shield className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="rounded border border-violet-500/25 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-violet-700 uppercase dark:text-violet-300">
                            ROLE AKSES
                        </span>
                        <h4 className="mt-1 truncate text-sm leading-tight font-extrabold text-slate-900 dark:text-slate-100" title={title}>
                            {title}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-violet-200/60 pt-2 text-[11px] dark:border-violet-800/60">
                <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                    <Network className="h-3 w-3 text-violet-500" />
                    {subItemsCount || 0} Divisi
                </span>
                <span className="flex items-center gap-1 rounded-full border border-violet-300 bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-700 dark:border-violet-800 dark:bg-violet-950/80 dark:text-violet-300">
                    <Users className="h-3 w-3" />
                    {totalUsers || 0} Orang
                </span>
            </div>

            {/* Right handle connects to Division child cards */}
            <Handle
                id="role-right"
                type="source"
                position={Position.Right}
                className="!-right-2 !h-3.5 !w-3.5 border-2 border-white !bg-violet-500 dark:border-zinc-900"
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
                    u.job_title_name?.toLowerCase().includes(q),
            )
            .slice(0, 50);
    }, [users, filterText]);

    return (
        <div
            className={cn(
                'relative w-[320px] cursor-grab overflow-hidden rounded-2xl border-2 text-left shadow-lg backdrop-blur-md transition-all active:cursor-grabbing',
                isDark
                    ? 'border-purple-500/30 bg-gradient-to-b from-slate-900 via-zinc-900 to-zinc-950 text-slate-100 shadow-purple-950/40'
                    : 'border-purple-200 bg-gradient-to-b from-white via-purple-50/20 to-white text-slate-900 shadow-slate-200/80',
            )}
        >
            {/* Left handle connects from Role Header Card */}
            <Handle
                id="div-left"
                type="target"
                position={Position.Left}
                className="!-left-2 !h-3.5 !w-3.5 border-2 border-white !bg-purple-500 dark:border-zinc-900"
            />

            {/* Division Header */}
            <div
                className="cursor-pointer border-b border-purple-500/15 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-transparent p-3 transition-colors hover:bg-purple-500/15"
                onClick={() => {
                    if (typeof onSelect === 'function') onSelect(data);
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="shrink-0 rounded-lg border border-purple-500/25 bg-purple-500/15 p-1.5 text-purple-600 dark:text-purple-400">
                            <Network className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="rounded border border-purple-500/25 bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-purple-700 uppercase dark:text-purple-300">
                                DIVISI / UNIT
                            </span>
                            <h4 className="mt-0.5 truncate text-xs leading-tight font-bold text-slate-900 dark:text-slate-100" title={title}>
                                {title}
                            </h4>
                            {subtitle && <p className="truncate text-[9.5px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
                        </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-purple-300/80 bg-purple-100/80 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:border-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
                        <Users className="h-3 w-3" />
                        {totalUsers} orang
                    </span>
                </div>
            </div>

            {/* In-Card Search (shown if > 2 people) */}
            {totalUsers > 2 && (
                <div className="border-b border-slate-100 bg-slate-50/50 px-3 pt-2 pb-1 dark:border-zinc-800/80 dark:bg-zinc-900/50">
                    <div className="relative">
                        <Search size={11} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Cari ${totalUsers} orang...`}
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="h-6 w-full rounded-lg border border-slate-200/80 bg-white pr-2 pl-7 text-[10px] text-slate-900 focus:border-purple-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                        />
                    </div>
                </div>
            )}

            {/* Employee List inside the Division Card */}
            <div className="max-h-[250px] [scrollbar-width:thin] space-y-1.5 overflow-y-auto p-2">
                {displayed.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">Tidak ada orang ditemukan.</div>
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
                            className="group flex cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-slate-50/80 p-1.5 transition-all hover:border-purple-500/20 hover:bg-purple-500/10 dark:bg-zinc-800/50 dark:hover:bg-purple-950/40"
                        >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-purple-500/25 bg-purple-500/15 text-[10px] font-extrabold text-purple-700 transition-transform group-hover:scale-105 dark:text-purple-300">
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[11px] font-bold text-slate-900 transition-colors group-hover:text-purple-600 dark:text-slate-100 dark:group-hover:text-purple-400">
                                    {u.name}
                                </div>
                                <div className="flex items-center gap-1 truncate text-[9px] text-slate-500 dark:text-slate-400">
                                    <span className="truncate font-medium text-slate-600 dark:text-slate-300">
                                        {u.job_title_name || u.department_name || 'Staff'}
                                    </span>
                                    <span>·</span>
                                    <span className="font-mono text-[9px] text-slate-400">{u.nik}</span>
                                </div>
                                {u.reporting_to && (
                                    <div className="mt-0.5 flex items-center gap-1 truncate text-[8.5px] font-semibold text-amber-600 dark:text-amber-400">
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
                        className="cursor-pointer py-1.5 text-center text-[10px] font-bold text-purple-600 hover:underline dark:text-purple-400"
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
            .filter((u) => u.name?.toLowerCase().includes(q) || u.nik?.toLowerCase().includes(q) || u.department_name?.toLowerCase().includes(q))
            .slice(0, 50);
    }, [users, filterText]);

    const gradeLabel = users[0]?.job_level_name || 'Level Terstandar';

    return (
        <div
            className={cn(
                'relative w-[350px] cursor-grab overflow-hidden rounded-2xl border-2 text-left shadow-lg backdrop-blur-md transition-all active:cursor-grabbing',
                isDark
                    ? 'border-cyan-500/30 bg-gradient-to-b from-slate-900 via-zinc-900 to-zinc-950 text-slate-100 shadow-cyan-950/40'
                    : 'border-cyan-200 bg-gradient-to-b from-white via-slate-50/50 to-white text-slate-900 shadow-slate-200/80',
            )}
        >
            {/* Left Handle connects from Tier Header on the left */}
            <Handle
                id="pos-left"
                type="target"
                position={Position.Left}
                className="!-left-2 !h-3.5 !w-3.5 border-2 border-white !bg-cyan-500 dark:border-zinc-900"
            />
            {/* Top Handle for vertical fallback */}
            <Handle
                id="pos-top"
                type="target"
                position={Position.Top}
                className="pointer-events-none !-top-1.5 !h-3 !w-3 border-2 border-white !bg-cyan-500 opacity-0 dark:border-zinc-900"
            />

            {/* Position Header */}
            <div
                className="cursor-pointer border-b border-cyan-500/15 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent p-3.5 transition-colors hover:bg-cyan-500/15"
                onClick={() => {
                    if (typeof onSelect === 'function') onSelect(data);
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="shrink-0 rounded-lg border border-cyan-500/25 bg-cyan-500/15 p-1.5 text-cyan-600 dark:text-cyan-400">
                            <Briefcase className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="rounded border border-cyan-500/25 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-cyan-700 uppercase dark:text-cyan-300">
                                {gradeLabel}
                            </span>
                            <h4 className="mt-1 truncate text-xs leading-tight font-bold text-slate-900 dark:text-slate-100" title={title}>
                                {title}
                            </h4>
                        </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-cyan-300/80 bg-cyan-100/80 px-2 py-0.5 text-[10px] font-extrabold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300">
                        <Users className="h-3 w-3" />
                        {totalUsers} orang
                    </span>
                </div>
            </div>

            {/* In-Card Search (shown if > 2 people) */}
            {totalUsers > 2 && (
                <div className="border-b border-slate-100 bg-slate-50/50 px-3 pt-2.5 pb-1 dark:border-zinc-800/80 dark:bg-zinc-900/50">
                    <div className="relative">
                        <Search size={11} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Cari di ${totalUsers} orang...`}
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="h-6 w-full rounded-lg border border-slate-200/80 bg-white pr-2 pl-7 text-[10px] text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                        />
                    </div>
                </div>
            )}

            {/* Employee List inside the Unified Card */}
            <div className="max-h-[260px] [scrollbar-width:thin] space-y-1.5 overflow-y-auto p-2">
                {displayed.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-400">Tidak ada orang ditemukan.</div>
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
                            className="group flex cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-slate-50/80 p-1.5 transition-all hover:border-cyan-500/20 hover:bg-cyan-500/10 dark:bg-zinc-800/50 dark:hover:bg-cyan-950/40"
                        >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-500/25 bg-cyan-500/15 text-[10px] font-extrabold text-cyan-700 transition-transform group-hover:scale-105 dark:text-cyan-300">
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[11px] font-bold text-slate-900 transition-colors group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">
                                    {u.name}
                                </div>
                                <div className="flex items-center gap-1 truncate text-[9px] text-slate-500 dark:text-slate-400">
                                    <span className="truncate font-medium text-slate-600 dark:text-slate-300">
                                        {u.department_name || u.division_name}
                                    </span>
                                    <span>·</span>
                                    <span className="font-mono text-[9px] text-slate-400">{u.nik}</span>
                                </div>
                                {u.reporting_to && (
                                    <div className="mt-0.5 flex items-center gap-1 truncate text-[8.5px] font-semibold text-amber-600 dark:text-amber-400">
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
                        className="cursor-pointer py-1.5 text-center text-[10px] font-bold text-cyan-600 hover:underline dark:text-cyan-400"
                    >
                        + Buka {totalUsers - 50} orang lainnya di panel...
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="pointer-events-none !-bottom-1.5 !h-3 !w-3 border-2 border-white !bg-cyan-500 opacity-0 dark:border-zinc-900"
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
    const [internalSelectedOrganizationGroups, setInternalSelectedOrganizationGroups] = useState<string[]>(
        () => savedInitial.selectedOrganizationGroups || [],
    );
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
            },
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
            if (
                selectedOrganizationGroups.length > 0 &&
                !selectedOrganizationGroups.some((og) => og.toLowerCase() === (u.org_group_name || '').toLowerCase())
            ) {
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
            if (
                selectedSubdepartments.length > 0 &&
                !selectedSubdepartments.some((sub) => sub.toLowerCase() === (u.subdepartment_name || '').toLowerCase())
            ) {
                return false;
            }
            // Section Filter
            if (selectedSections.length > 0 && !selectedSections.some((sec) => sec.toLowerCase() === (u.section_name || '').toLowerCase())) {
                return false;
            }
            // Job Level Group Filter
            if (
                selectedJobLevelGroups.length > 0 &&
                !selectedJobLevelGroups.some((jlg) => jlg.toLowerCase() === ((u as any).job_level_group_name || '').toLowerCase())
            ) {
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
                const groupKey = groupByMode === 'role' ? u.role_name || 'Member' : u.job_title_name || 'Tanpa Posisi';
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
                    levelLabel:
                        groupByMode === 'role'
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
                    const tierRowHeight = !isTierCollapsed && distinctGroupKeys.length > 0 ? 380 : 180;
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

    const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);

    const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

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
                u.job_title_name?.toLowerCase().includes(q),
        );
    }, [selectedNode, userSearchText]);

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950">
            {/* Flow Canvas with Drag & Drop */}
            <div className="relative h-full min-h-[500px] w-full flex-1">
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
                    <Controls
                        position="bottom-right"
                        className="!rounded-lg !border-slate-200 !bg-white !shadow-md dark:!border-slate-800 dark:!bg-slate-900"
                    />
                    <MiniMap
                        position="bottom-left"
                        nodeColor={(n) => {
                            if (n.type === 'job_tier_node') return '#f59e0b';
                            return '#06b6d4';
                        }}
                        className="!rounded-lg !border-slate-200 !bg-white/80 !shadow-md dark:!border-slate-800 dark:!bg-slate-900/80"
                    />
                </ReactFlow>
            </div>

            {/* Right Side Drawer for Detailed People List when Node Clicked */}
            {selectedNode && (
                <div className="animate-in slide-in-from-right absolute inset-y-0 right-0 z-40 flex w-96 max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl duration-200 dark:border-zinc-800 dark:bg-zinc-900">
                    {/* Drawer Header */}
                    <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div>
                            <span
                                className={cn(
                                    'rounded-md border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                                    selectedNode.badgeBg || 'border-amber-300 bg-amber-100 text-amber-800',
                                )}
                            >
                                {selectedNode.levelLabel}
                            </span>
                            <h2 className="mt-1 text-sm font-bold break-words text-slate-900 dark:text-white">{selectedNode.title}</h2>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                Total <strong>{selectedNode.totalUsers}</strong> orang terdaftar di hierarki ini
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="cursor-pointer rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-slate-200"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Search inside Drawer */}
                    <div className="border-b border-slate-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="relative">
                            <Search size={13} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter nama atau NIK di list ini..."
                                value={userSearchText}
                                onChange={(e) => setUserSearchText(e.target.value)}
                                className="focus:border-primary h-8 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-8 text-xs text-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-slate-100"
                            />
                            {userSearchText && (
                                <button
                                    onClick={() => setUserSearchText('')}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List of People */}
                    <div className="flex-1 [scrollbar-width:thin] space-y-2.5 divide-y divide-slate-100 overflow-y-auto p-4 dark:divide-zinc-800/60">
                        {displayedUsersInDrawer.length === 0 ? (
                            <div className="py-10 text-center text-xs text-slate-400">Tidak ada orang ditemukan dengan filter pencarian ini.</div>
                        ) : (
                            displayedUsersInDrawer.map((u) => (
                                <div key={u.id} className="flex items-start gap-3 pt-2.5 first:pt-0">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <h4 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100" title={u.name}>
                                                {u.name}
                                            </h4>
                                            <span className="py-0.2 rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-slate-300">
                                                {u.role_name || 'Staff'}
                                            </span>
                                        </div>

                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <p className="truncate text-[11px] font-medium text-amber-600 dark:text-amber-400">{u.job_title_name}</p>
                                            {u.job_level_name && (
                                                <span className="shrink-0 rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                                                    {u.job_level_name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1 space-y-0.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                            {u.reporting_to && (
                                                <div className="flex items-center gap-1.5 font-sans font-semibold text-amber-600 dark:text-amber-400">
                                                    <UserCheck size={11} className="shrink-0" />
                                                    <span className="truncate">Atasan Langsung: {u.reporting_to}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <IdCard size={11} className="shrink-0 text-slate-400" />
                                                <span>NIK: {u.nik}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Mail size={11} className="shrink-0 text-slate-400" />
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
                    <div className="border-t border-slate-200 bg-slate-50 p-3 text-right dark:border-zinc-800 dark:bg-zinc-900">
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="cursor-pointer rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-slate-200 dark:hover:bg-zinc-800"
                        >
                            Tutup Panel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
