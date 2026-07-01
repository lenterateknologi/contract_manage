import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
    status: string;
}

const config: Record<string, { bg: string; dot: string; text: string; label: string }> = {
    draft: { bg: 'bg-surface-muted', dot: 'bg-text-soft', text: 'text-text-desc', label: 'Draft' },
    queue: { bg: 'bg-surface-muted', dot: 'bg-text-soft', text: 'text-text-desc', label: 'Antrian' },
    in_review: { bg: 'bg-warning/10', dot: 'bg-warning', text: 'text-warning', label: 'Review' },
    revision: { bg: 'bg-danger/10', dot: 'bg-danger', text: 'text-danger', label: 'Revisi' },
    pending: { bg: 'bg-warning/10', dot: 'bg-warning', text: 'text-warning', label: 'Pending' },
    approved: { bg: 'bg-success/10', dot: 'bg-success', text: 'text-success', label: 'Disetujui' },
    active: { bg: 'bg-primary/10', dot: 'bg-primary', text: 'text-primary', label: 'Aktif' },
    expired: { bg: 'bg-danger/10', dot: 'bg-danger', text: 'text-danger', label: 'Expired' },
    archived: { bg: 'bg-surface-muted', dot: 'bg-text-soft', text: 'text-text-soft', label: 'Arsip' },
    rejected: { bg: 'bg-danger/10', dot: 'bg-danger', text: 'text-danger', label: 'Ditolak' },
};

const fallback = { bg: 'bg-surface-muted', dot: 'bg-text-soft', text: 'text-text-desc', label: 'Unknown' };

export const StatusBadge = ({ status }: StatusBadgeProps) => {
    const s = config[status?.toLowerCase() as keyof typeof config] || fallback;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-tight uppercase',
                s.bg,
                s.text,
            )}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
            {s.label}
        </span>
    );
};

export default StatusBadge;
