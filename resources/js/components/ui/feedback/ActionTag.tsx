import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    GitBranch,
    LucideIcon,
    Send,
    UserCheck,
    UserPlus
} from 'lucide-react';
import React from 'react';
import type { StatusInfo } from './StatusBadge';

export interface ActionConfig {
    code: string;
    label: string;
    icon: LucideIcon;
    color: string;
    hexColor?: string;
    hexBg?: string;
    badgeClass: string;
    buttonClass: string;
    iconBgClass: string;
    buttonStyle?: React.CSSProperties;
    badgeStyle?: React.CSSProperties;
    iconBgStyle?: React.CSSProperties;
}

export function getActionConfig(
    actionOrCode?: any,
    aliasParam?: string | null,
    _isApproved?: boolean,
    isRejected?: boolean,
    targetStatusParam?: string | null,
    statusInfo?: StatusInfo | null,
    masterStatusesParam?: any[]
): ActionConfig {
    let masterStatuses = masterStatusesParam;
    if (!masterStatuses || masterStatuses.length === 0) {
        try {
            const pageProps = usePage<any>()?.props;
            masterStatuses = pageProps?.masterContractStatuses || [];
        } catch (e) {
            // Outside Inertia context
        }
    }

    let code = '';
    let alias = aliasParam;
    let targetStatus = targetStatusParam;
    let isStep1 = false;
    let inlineStatusInfo: StatusInfo | null = statusInfo || null;

    if (typeof actionOrCode === 'object' && actionOrCode !== null) {
        code = actionOrCode.action_code || actionOrCode.code || '';
        alias = alias || actionOrCode.alias || actionOrCode.name || actionOrCode.label;
        targetStatus = targetStatus || actionOrCode.target_status || actionOrCode.status;
        if (actionOrCode.target_status_info) {
            inlineStatusInfo = actionOrCode.target_status_info;
        }
        if (actionOrCode.step === 1 || actionOrCode.is_initial || actionOrCode.isStep1) {
            isStep1 = true;
        }
    } else if (typeof actionOrCode === 'string') {
        code = actionOrCode;
    }

    const cleanCode = code.toLowerCase().trim();
    const cleanStatus = (targetStatus || '').toLowerCase().trim();
    const cleanAlias = (alias || '').toLowerCase().trim();
    const isEffectivelyRejected = isRejected || cleanCode === 'reject' || cleanStatus === 'rejected' || cleanAlias.includes('tolak') || cleanAlias.includes('reject');

    // Default icon based on action code
    let defaultIcon: LucideIcon = CheckCircle2;
    if (isEffectivelyRejected) {
        defaultIcon = AlertCircle;
    } else {
        switch (cleanCode) {
            case 'reject':
                defaultIcon = AlertCircle;
                break;
            case 'assign':
            case 'assign_pic':
                defaultIcon = UserCheck;
                break;
            case 'add_adhoc':
                defaultIcon = UserPlus;
                break;
            case 'branch':
            case 'cross_workflow':
                defaultIcon = GitBranch;
                break;
            case 'toggle_access':
                defaultIcon = Eye;
                break;
            default:
                defaultIcon = isStep1 ? Send : CheckCircle2;
                break;
        }
    }

    // Default label based on action code
    const resolveDefaultLabel = (): string => {
        if (alias) return alias;
        switch (cleanCode) {
            case 'reject':
                return 'Tolak Kontrak';
            case 'assign':
            case 'assign_pic':
                return 'Tugaskan PIC';
            case 'add_adhoc':
                return 'Persetujuan Tambahan';
            case 'branch':
            case 'cross_workflow':
                return 'Pindah Workflow';
            case 'toggle_access':
                return 'Akses Dokumen';
            case 'approve':
                return isStep1 ? 'Kirim Persetujuan' : 'Setujui Kontrak';
            default:
                return isStep1 ? 'Kirim Persetujuan' : (cleanCode ? cleanCode.toUpperCase() : 'Setujui Kontrak');
        }
    };
    const defaultLabel = resolveDefaultLabel();

    // Tentukan status key efektif: Prioritaskan target_status, jika tidak ada fallback ke status default aksi
    let effectiveStatusKey = cleanStatus && cleanStatus !== 'default' ? cleanStatus : '';
    if (!effectiveStatusKey) {
        if (isEffectivelyRejected) {
            effectiveStatusKey = 'rejected';
        } else {
            switch (cleanCode) {
                case 'reject':
                    effectiveStatusKey = 'rejected';
                    break;
                case 'assign':
                case 'assign_pic':
                    effectiveStatusKey = 'active';
                    break;
                case 'branch':
                case 'cross_workflow':
                    effectiveStatusKey = 'pending';
                    break;
                default:
                    effectiveStatusKey = 'approved';
                    break;
            }
        }
    }

    // Ambil langsung konfigurasi status dari Master Status database
    const masterObj = masterStatuses?.find((s: any) => s.code?.toLowerCase() === effectiveStatusKey);
    const hexColor = masterObj?.color || inlineStatusInfo?.color;
    const hexBg = masterObj?.bg_color || inlineStatusInfo?.bg_color;
    const statusIconName = masterObj?.icon || inlineStatusInfo?.icon;

    // Fallback classes jika belum ada Master Status
    const fallbackBg = cleanCode === 'reject' ? 'bg-rose-700' : 'bg-emerald-700';
    const buttonClass = hexColor
        ? 'hover:opacity-90 active:opacity-100 text-white shadow-sm cursor-pointer'
        : `${fallbackBg} hover:opacity-90 active:opacity-100 text-white shadow-sm cursor-pointer`;
    const iconBgClass = hexColor ? 'text-white' : `${fallbackBg} text-white`;
    const badgeClass = hexColor
        ? 'text-white border border-transparent shadow-xs'
        : `${fallbackBg} text-white border border-transparent shadow-xs`;

    // Ambil icon dari status jika action tidak memiliki custom icon
    let finalIcon = defaultIcon;
    if (statusIconName && (LucideIcons as any)[statusIconName] && cleanCode === 'approve' && !isStep1 && cleanStatus) {
        finalIcon = (LucideIcons as any)[statusIconName];
    }

    const buttonStyle: React.CSSProperties | undefined = hexColor
        ? { backgroundColor: hexColor, color: '#ffffff', borderColor: 'transparent' }
        : undefined;

    const iconBgStyle: React.CSSProperties | undefined = hexColor
        ? { backgroundColor: hexColor, color: '#ffffff' }
        : undefined;

    const badgeStyle: React.CSSProperties | undefined = hexColor
        ? { backgroundColor: hexColor, color: '#ffffff', borderColor: 'transparent' }
        : undefined;

    return {
        code: cleanCode || effectiveStatusKey,
        label: defaultLabel,
        icon: finalIcon,
        color: effectiveStatusKey,
        hexColor,
        hexBg,
        badgeClass,
        buttonClass,
        iconBgClass,
        buttonStyle,
        badgeStyle,
        iconBgStyle,
    };
}

export interface ActionBadgeProps {
    actionCode?: string | null;
    alias?: string | null;
    isApproved?: boolean;
    isRejected?: boolean;
    targetStatus?: string | null;
    showIcon?: boolean;
    size?: 'xs' | 'sm' | 'md';
    className?: string;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({
    actionCode,
    alias,
    isApproved,
    isRejected,
    targetStatus,
    showIcon = true,
    size = 'sm',
    className,
}) => {
    let masterStatuses: any[] = [];
    try {
        const pageProps = usePage<any>()?.props;
        masterStatuses = pageProps?.masterContractStatuses || [];
    } catch (e) {
        // Fallback when outside Inertia context
    }

    const config = getActionConfig(actionCode, alias, isApproved, isRejected, targetStatus, null, masterStatuses);
    const Icon = config.icon;

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[8.5px] gap-1',
        sm: 'px-2 py-0.5 text-[9.5px] gap-1.5',
        md: 'px-2.5 py-1 text-xs gap-1.5',
    };

    const iconSizes = {
        xs: 9,
        sm: 11,
        md: 13,
    };

    return (
        <span
            style={config.badgeStyle}
            className={cn(
                'inline-flex items-center rounded border font-bold uppercase tracking-wider transition-colors',
                config.badgeClass,
                sizeClasses[size],
                className
            )}
        >
            {showIcon && <Icon size={iconSizes[size]} className="shrink-0" />}
            <span className="truncate">{config.label}</span>
        </span>
    );
};

export interface ActionIconProps {
    actionCode?: string | null;
    targetStatus?: string | null;
    size?: number;
    className?: string;
}

export const ActionIcon: React.FC<ActionIconProps> = ({
    actionCode,
    targetStatus,
    size = 14,
    className,
}) => {
    const config = getActionConfig(actionCode, null, false, false, targetStatus);
    const Icon = config.icon;
    return <Icon size={size} className={cn('shrink-0', className)} />;
};

export function getActionBadge(
    actionCode?: string | null,
    alias?: string | null,
    className?: string,
    targetStatus?: string | null
) {
    return <ActionBadge actionCode={actionCode} alias={alias} className={className} targetStatus={targetStatus} />;
}
