import React from 'react';
import { ContractStatus, UserProfile } from '@/types/contracts';

// ─── Status config ─────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
    draft: 'Draft', in_review: 'In Review', revision: 'Revision',
    approved: 'Approved', locked: 'Locked', archived: 'Archived',
    pending: 'Pending', rejected: 'Rejected', waiting: 'Waiting',
};

const STATUS_CLS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 border border-gray-200',
    in_review: 'bg-amber-50 text-amber-800 border border-amber-200',
    revision: 'bg-red-50 text-red-800 border border-red-200',
    approved: 'bg-green-50 text-green-800 border border-green-200',
    locked: 'bg-violet-50 text-violet-800 border border-violet-200',
    archived: 'bg-gray-100 text-gray-500 border border-gray-200',
    pending: 'bg-amber-50 text-amber-800 border border-amber-200',
    rejected: 'bg-red-50 text-red-800 border border-red-200',
    waiting: 'bg-gray-100 text-gray-500 border border-gray-200',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
    const cls = STATUS_CLS[status] ?? STATUS_CLS.draft;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>
            {label ?? STATUS_LABEL[status] ?? status}
        </span>
    );
}

// ─── Avatar ─────────────────────────────────────────────────────────
export function Avatar({ user, size = 'sm' }: { user: UserProfile | null | undefined; size?: 'sm' | 'md' | 'lg' }) {
    const sizeMap = { sm: 'w-5 h-5 text-[9px]', md: 'w-7 h-7 text-[11px]', lg: 'w-8 h-8 text-[12px]' };
    if (!user) return null;
    return (
        <span
            className={`inline-flex items-center justify-center rounded-full font-bold flex-shrink-0 ${sizeMap[size]}`}
            style={{ background: user.bg_color, color: user.text_color }}
        >
            {user.initials}
        </span>
    );
}

// ─── Progress bar ────────────────────────────────────────────────────
export function ProgressBar({ done, total, pct }: { done: number; total: number; pct: number }) {
    return (
        <div>
            <div className="text-[10px] text-gray-400 mb-1">{done}/{total}</div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden w-20">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── Action icon colors ──────────────────────────────────────────────
export const ACTION_COLORS: Record<string, string> = {
    CONTRACT_CREATED: '#8b5cf6',
    FILE_UPLOADED: '#2563eb',
    APPROVAL_APPROVED: '#16a34a',
    APPROVAL_REJECTED: '#dc2626',
    CONTRACT_APPROVED: '#16a34a',
};
