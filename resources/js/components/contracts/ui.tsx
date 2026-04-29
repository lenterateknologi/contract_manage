import { UserProfile } from '@/types/contracts';
import { cn } from '@/lib/utils';

// ─── Status config ─────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    revision: 'Revision',
    approved: 'Approved',
    locked: 'Locked',
    archived: 'Archived',
    pending: 'Pending',
    rejected: 'Rejected',
    waiting: 'Waiting',
};

const STATUS_CLS: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground border border-border',
    in_review: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
    revision: 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
    approved: 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30',
    locked: 'bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-900/30',
    archived: 'bg-muted text-muted-foreground border border-border',
    pending: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
    rejected: 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
    waiting: 'bg-muted text-muted-foreground border border-border',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
    const cls = STATUS_CLS[status] ?? STATUS_CLS.draft;
    return (
        <span className={cn('inline-flex items-center rounded-lg px-2.5 py-1 text-[10.5px] font-bold tracking-tight uppercase border transition-all duration-300', cls)}>
            {label ?? STATUS_LABEL[status] ?? status}
        </span>
    );
}

// ─── Avatar ─────────────────────────────────────────────────────────
export function Avatar({
    user,
    size = 'sm',
    className = '',
}: {
    user: UserProfile | null | undefined;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeMap = { sm: 'w-5 h-5 text-xs', md: 'w-7 h-7 text-xs', lg: 'w-8 h-8 text-xs' };
    if (!user) return null;
    return (
        <span
            className={`inline-flex flex-shrink-0 items-center justify-center rounded-full font-bold ${sizeMap[size]} ${className}`}
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
            <div className="text-muted-foreground mb-1 text-xs">
                {done}/{total}
            </div>
            <div className="bg-muted h-1 w-20 overflow-hidden rounded-full">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── Action icon colors ──────────────────────────────────────────────
export const ACTION_COLORS: Record<string, string> = {
    CONTRACT_CREATED: 'var(--chart-1)',
    FILE_UPLOADED: 'var(--chart-2)',
    APPROVAL_APPROVED: 'var(--chart-3)',
    APPROVAL_REJECTED: 'var(--destructive)',
    CONTRACT_APPROVED: 'var(--chart-4)',
};
