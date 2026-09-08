/**
 * Shared utility functions and configurations for Contract and Workflow statuses.
 */

export type StatusKey =
    | 'draft'
    | 'queue'
    | 'in_review'
    | 'revision'
    | 'pending'
    | 'approved'
    | 'active'
    | 'expired'
    | 'archived'
    | 'rejected'
    | 'locked'
    | 'cancelled';

export interface StatusConfig {
    label: string;
    bg: string;
    dot: string;
    text: string;
    border?: string;
    icon?: string;
    description?: string;
}

export interface StatusInfo {
    label?: string;
    color?: string;
    bg_color?: string;
    icon?: string | null;
}

export const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
    draft: {
        label: 'Draft',
        bg: 'bg-slate-100 dark:bg-slate-800',
        dot: 'bg-slate-400',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        icon: 'FileText',
        description: 'Draf kontrak sedang disusun dan belum diajukan',
    },
    queue: {
        label: 'Antrian',
        bg: 'bg-slate-100 dark:bg-slate-800',
        dot: 'bg-slate-400',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        icon: 'ListOrdered',
        description: 'Menunggu giliran proses dalam antrian',
    },
    in_review: {
        label: 'Review',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-900/40',
        icon: 'Clock',
        description: 'Kontrak sedang dalam peninjauan oleh reviewer',
    },
    revision: {
        label: 'Revisi',
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        dot: 'bg-rose-500',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-900/40',
        icon: 'RefreshCw',
        description: 'Kontrak memerlukan perbaikan dari inisiator',
    },
    pending: {
        label: 'Pending',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-900/40',
        icon: 'AlertCircle',
        description: 'Menunggu tindakan persetujuan atau tanda tangan',
    },
    approved: {
        label: 'Disetujui',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-900/40',
        icon: 'CheckCircle',
        description: 'Kontrak telah selesai disetujui semua pihak',
    },
    active: {
        label: 'Aktif',
        bg: 'bg-indigo-50 dark:bg-indigo-950/30',
        dot: 'bg-indigo-500',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-900/40',
        icon: 'Zap',
        description: 'Kontrak sedang berjalan aktif',
    },
    expired: {
        label: 'Expired',
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        dot: 'bg-rose-500',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-900/40',
        icon: 'AlertTriangle',
        description: 'Masa berlaku kontrak telah habis',
    },
    archived: {
        label: 'Arsip',
        bg: 'bg-slate-100 dark:bg-slate-800',
        dot: 'bg-slate-400',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        icon: 'Archive',
        description: 'Kontrak telah diarsipkan',
    },
    rejected: {
        label: 'Ditolak',
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        dot: 'bg-rose-500',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-900/40',
        icon: 'XCircle',
        description: 'Pengajuan kontrak ditolak',
    },
    signed: {
        label: 'Ditandatangani',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        dot: 'bg-purple-500',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-900/40',
        icon: 'FileCheck',
        description: 'Dokumen telah selesai ditandatangani para pihak',
    },
    closed: {
        label: 'Selesai',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-900/40',
        icon: 'CheckCheck',
        description: 'Dokumen telah selesai dan diproses final',
    },
    completed: {
        label: 'Selesai',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-900/40',
        icon: 'CheckCheck',
        description: 'Dokumen telah selesai masa berlakunya / tuntas',
    },
    locked: {
        label: 'Terkunci',
        bg: 'bg-slate-100 dark:bg-slate-800',
        dot: 'bg-slate-500',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        icon: 'Lock',
        description: 'Dokumen dikunci dari perubahan',
    },
    cancelled: {
        label: 'Dibatalkan',
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        dot: 'bg-zinc-400',
        text: 'text-zinc-600 dark:text-zinc-400',
        border: 'border-zinc-200 dark:border-zinc-700',
        icon: 'Ban',
        description: 'Pengajuan kontrak dibatalkan oleh inisiator',
    },
};

export const STATUS_FALLBACK: StatusConfig = {
    label: 'Unknown',
    bg: 'bg-slate-100 dark:bg-slate-800',
    dot: 'bg-slate-400',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'FileText',
    description: 'Status tidak diketahui',
};

/**
 * Get status config by key with optional custom override info.
 */
export function getStatusConfig(status?: string | null, statusInfo?: StatusInfo | null): StatusConfig {
    const key = (status || '').toLowerCase().trim();
    const base = STATUS_CONFIG_MAP[key] || STATUS_FALLBACK;

    if (statusInfo?.label) {
        return { ...base, label: statusInfo.label };
    }
    return base;
}

/**
 * Get formatted status label in Indonesian.
 */
export function getStatusLabel(status?: string | null, customLabel?: string | null): string {
    if (customLabel) return customLabel;
    const config = getStatusConfig(status);
    return config.label;
}

/**
 * Status predicates/helpers
 */
export function isStatusDraft(status?: string | null): boolean {
    return (status || '').toLowerCase() === 'draft';
}

export function isStatusInReview(status?: string | null): boolean {
    return ['in_review', 'pending', 'queue'].includes((status || '').toLowerCase());
}

export function isStatusApproved(status?: string | null): boolean {
    return ['approved', 'active'].includes((status || '').toLowerCase());
}

export function isStatusRejected(status?: string | null): boolean {
    return ['rejected', 'cancelled'].includes((status || '').toLowerCase());
}

export function isStatusRevision(status?: string | null): boolean {
    return (status || '').toLowerCase() === 'revision';
}

export function isStatusTerminal(status?: string | null): boolean {
    return ['approved', 'rejected', 'archived', 'expired', 'cancelled'].includes((status || '').toLowerCase());
}

/**
 * Checks if a hex color code is considered light (for dark-mode contrast adjustments).
 */
export function isLightColor(hexColor?: string | null): boolean {
    if (!hexColor) return false;
    const clean = hexColor.replace('#', '').trim().toLowerCase();
    if (clean === 'fff' || clean === 'ffffff' || clean === 'white') return true;
    if (clean.length === 6) {
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 200;
    }
    return false;
}

/**
 * List of standard statuses for filter dropdowns.
 */
export const STATUS_FILTER_OPTIONS = [
    { label: 'Semua Status', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Dalam Review', value: 'in_review' },
    { label: 'Revisi', value: 'revision' },
    { label: 'Pending', value: 'pending' },
    { label: 'Disetujui', value: 'approved' },
    { label: 'Aktif', value: 'active' },
    { label: 'Ditolak', value: 'rejected' },
    { label: 'Expired', value: 'expired' },
    { label: 'Arsip', value: 'archived' },
];
