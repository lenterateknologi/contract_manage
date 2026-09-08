/**
 * Shared utility functions and configurations for various badge elements across the app.
 */

import { AlertCircle, AlertTriangle, CheckCircle2, Clock, type LucideIcon } from 'lucide-react';
import { isStatusTerminal } from './status-utils';

export interface ExpiryBadgeConfig {
    label: string;
    countdownLabel: string;
    color: string;
    icon: LucideIcon;
    diffDays: number;
    isExpired: boolean;
    isToday: boolean;
    urgency: 'expired' | 'critical' | 'warning' | 'normal';
}

/**
 * Helper to format duration text for expiry countdown.
 * e.g. "Expired dalam waktu 5 hari", "Expired dalam waktu 2 bulan", "Expired sejak 10 hari lalu", "Expired hari ini"
 */
export function formatExpiryDurationText(diffDays: number): string {
    if (diffDays < 0) {
        const absDays = Math.abs(diffDays);
        if (absDays >= 365) {
            const years = Math.floor(absDays / 365);
            const remainingMonths = Math.floor((absDays % 365) / 30);
            return remainingMonths > 0 ? `Expired sejak ${years} thn ${remainingMonths} bln lalu` : `Expired sejak ${years} thn lalu`;
        }
        if (absDays >= 30) {
            const months = Math.floor(absDays / 30);
            const remainingDays = absDays % 30;
            return remainingDays > 0 ? `Expired sejak ${months} bln ${remainingDays} hr lalu` : `Expired sejak ${months} bln lalu`;
        }
        return `Expired sejak ${absDays} hari lalu`;
    }

    if (diffDays === 0) {
        return 'Expired hari ini';
    }

    if (diffDays >= 365) {
        const years = Math.floor(diffDays / 365);
        const remainingMonths = Math.floor((diffDays % 365) / 30);
        return remainingMonths > 0 ? `Expired dalam waktu ${years} thn ${remainingMonths} bln` : `Expired dalam waktu ${years} thn`;
    }

    if (diffDays >= 30) {
        const months = Math.floor(diffDays / 30);
        const remainingDays = diffDays % 30;
        return remainingDays > 0 ? `Expired dalam waktu ${months} bln ${remainingDays} hr` : `Expired dalam waktu ${months} bln`;
    }

    return `Expired dalam waktu ${diffDays} hari`;
}

/**
 * Computes badge properties for contract expiry days.
 */
export function getExpiryBadgeConfig(endDate?: string | null): ExpiryBadgeConfig | null {
    if (!endDate) return null;
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return null;

    const now = new Date();
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = endMidnight.getTime() - nowMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const isExpired = diffDays < 0;
    const isToday = diffDays === 0;
    const countdownLabel = formatExpiryDurationText(diffDays);

    let color = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40';
    let icon: LucideIcon = CheckCircle2;
    let label = `${diffDays} Hari Lagi`;
    let urgency: 'expired' | 'critical' | 'warning' | 'normal' = 'normal';

    if (isExpired) {
        color = 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
        icon = AlertCircle;
        label = `Expired ${Math.abs(diffDays)} Hari`;
        urgency = 'expired';
    } else if (isToday) {
        color = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse';
        icon = AlertTriangle;
        label = 'Expired Hari Ini';
        urgency = 'critical';
    } else if (diffDays <= 7) {
        color = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
        icon = AlertTriangle;
        label = `${diffDays} Hari Lagi`;
        urgency = 'critical';
    } else if (diffDays <= 30) {
        color = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40';
        icon = AlertTriangle;
        label = `${diffDays} Hari Lagi`;
        urgency = 'warning';
    } else if (diffDays <= 90) {
        color = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/40';
        icon = Clock;
        label = `${diffDays} Hari Lagi`;
        urgency = 'normal';
    }

    return {
        label,
        countdownLabel,
        color,
        icon,
        diffDays,
        isExpired,
        isToday,
        urgency,
    };
}

export interface SlaCountdownConfig {
    timeLeft: string;
    urgency: 'normal' | 'warning' | 'danger';
    isOverdue: boolean;
}

/**
 * Computes SLA countdown time and urgency.
 */
export function getSlaCountdownConfig(deadline?: string | null, status?: string | null): SlaCountdownConfig {
    if (!deadline || isStatusTerminal(status)) {
        return {
            timeLeft: '-',
            urgency: 'normal',
            isOverdue: false,
        };
    }

    const target = new Date(deadline).getTime();
    if (isNaN(target)) {
        return {
            timeLeft: '-',
            urgency: 'normal',
            isOverdue: false,
        };
    }

    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
        return {
            timeLeft: 'OVERDUE',
            urgency: 'danger',
            isOverdue: true,
        };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return {
            timeLeft: `${days}d ${hours}h`,
            urgency: days < 1 ? 'warning' : 'normal',
            isOverdue: false,
        };
    }

    return {
        timeLeft: `${hours}h ${minutes}m`,
        urgency: hours < 4 ? 'danger' : 'warning',
        isOverdue: false,
    };
}

export interface ContractTypeBadgeConfig {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
}

/**
 * Returns stylish class mappings for contract type badges.
 */
export function getContractTypeBadgeConfig(typeName?: string | null): ContractTypeBadgeConfig {
    const name = (typeName || 'UMUM').toUpperCase().trim();

    if (name.includes('NDA') || name.includes('RAHASIA')) {
        return {
            label: name,
            bgClass: 'bg-purple-50 dark:bg-purple-950/40',
            textClass: 'text-purple-700 dark:text-purple-300',
            borderClass: 'border-purple-200 dark:border-purple-800',
        };
    }

    if (name.includes('MOU') || name.includes('NOTA')) {
        return {
            label: name,
            bgClass: 'bg-blue-50 dark:bg-blue-950/40',
            textClass: 'text-blue-700 dark:text-blue-300',
            borderClass: 'border-blue-200 dark:border-blue-800',
        };
    }

    if (name.includes('VENDOR') || name.includes('PKS') || name.includes('KERJASAMA')) {
        return {
            label: name,
            bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
            textClass: 'text-indigo-700 dark:text-indigo-300',
            borderClass: 'border-indigo-200 dark:border-indigo-800',
        };
    }

    if (name.includes('SPK') || name.includes('PERINTAH')) {
        return {
            label: name,
            bgClass: 'bg-amber-50 dark:bg-amber-950/40',
            textClass: 'text-amber-700 dark:text-amber-300',
            borderClass: 'border-amber-200 dark:border-amber-800',
        };
    }

    return {
        label: name,
        bgClass: 'bg-zinc-100 dark:bg-zinc-800',
        textClass: 'text-zinc-700 dark:text-zinc-300',
        borderClass: 'border-zinc-200 dark:border-zinc-700',
    };
}
