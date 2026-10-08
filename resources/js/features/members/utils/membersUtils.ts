import { HierarchyLevelKey, LevelConfig, SavedMembersFilterSettings } from '../types';
import {
    Briefcase,
    Building,
    Building2,
    FolderClosed,
    FolderTree,
    GitBranch,
    Layers,
    MapPin,
    Network,
    Shield,
    UserCheck,
    User as UserIcon,
} from 'lucide-react';

export const MEMBERS_FILTER_STORAGE_KEY = 'admin_members_filter_settings_v1';

export const loadSavedMembersFilterSettings = (): SavedMembersFilterSettings => {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem(MEMBERS_FILTER_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // ignore
    }
    return {};
};

export const ALL_LEVELS: LevelConfig[] = [
    {
        key: 'group',
        label: 'Company Group',
        field: 'group_name',
        icon: Layers,
        color: 'text-indigo-600 dark:text-indigo-400',
        badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300',
    },
    {
        key: 'org_group',
        label: 'Group Organisasi',
        field: 'org_group_name',
        icon: FolderClosed,
        color: 'text-sky-600 dark:text-sky-400',
        badgeBg: 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300',
    },
    {
        key: 'region',
        label: 'Region',
        field: 'region_name',
        icon: MapPin,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
    },
    {
        key: 'location',
        label: 'Location',
        field: 'location_name',
        icon: Building2,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
    },
    {
        key: 'company',
        label: 'Company',
        field: 'company_name',
        icon: Building,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
    },
    {
        key: 'division',
        label: 'Division',
        field: 'division_name',
        icon: Network,
        color: 'text-teal-600 dark:text-teal-400',
        badgeBg: 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300',
    },
    {
        key: 'department',
        label: 'Department',
        field: 'department_name',
        icon: Briefcase,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300',
    },
    {
        key: 'subdepartment',
        label: 'Sub-Departemen',
        field: 'subdepartment_name',
        icon: FolderTree,
        color: 'text-fuchsia-600 dark:text-fuchsia-400',
        badgeBg: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:border-fuchsia-800 dark:text-fuchsia-300',
    },
    {
        key: 'section',
        label: 'Seksi / Rayon',
        field: 'section_name',
        icon: GitBranch,
        color: 'text-pink-600 dark:text-pink-400',
        badgeBg: 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/40 dark:border-pink-800 dark:text-pink-300',
    },
    {
        key: 'job_level',
        label: 'Job Level',
        field: 'job_level_name',
        icon: Layers,
        color: 'text-orange-600 dark:text-orange-400',
        badgeBg: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300',
    },
    {
        key: 'job_title',
        label: 'Job Title',
        field: 'job_title_name',
        icon: UserCheck,
        color: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
    },
    {
        key: 'role',
        label: 'Role Akses',
        field: 'role_name',
        icon: Shield,
        color: 'text-violet-600 dark:text-violet-400',
        badgeBg: 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-300',
    },
    {
        key: 'employee',
        label: 'List Employee (Orang)',
        icon: UserIcon,
        color: 'text-cyan-600 dark:text-cyan-400',
        badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-300',
    },
];

export const getFilteredMaster = (items: any[], usedFilter: 'used_only' | 'all') => {
    if (!Array.isArray(items)) return [];
    if (usedFilter === 'used_only') {
        return items.filter((i) => (i.is_used !== undefined ? Boolean(i.is_used) : true));
    }
    return items;
};
