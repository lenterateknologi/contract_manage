import { cn } from '@/lib/utils';
import { UserProfile } from '@/types/contracts';
import { UserAvatar } from '../user/UserAvatar';

export { UserAvatar as Avatar };

// ─── Status config ─────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
    draft: 'Draft',
    in_review: 'Review',
    revision: 'Revisi',
    approved: 'Disetujui',
    locked: 'Terkunci',
    archived: 'Arsip',
    pending: 'Menunggu',
    rejected: 'Ditolak',
    waiting: 'Menunggu',
};

const STATUS_CLS: Record<string, string> = {
    draft: 'bg-black/5 text-black/60 dark:bg-white/5 dark:text-white/60 border border-black/10 dark:border-white/10',
    in_review: 'bg-black/10 text-black dark:bg-white/10 dark:text-white border border-black/20 dark:border-white/20',
    revision: 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white',
    approved: 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white',
    locked: 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white',
    archived: 'bg-black/5 text-black/60 dark:bg-white/5 dark:text-white/60 border border-black/10 dark:border-white/10',
    pending: 'bg-black/10 text-black dark:bg-white/10 dark:text-white border border-black/20 dark:border-white/20',
    rejected: 'bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white',
    waiting: 'bg-black/5 text-black/60 dark:bg-white/5 dark:text-white/60 border border-black/10 dark:border-white/10',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
    const cls = STATUS_CLS[status] ?? STATUS_CLS.draft;
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-lg border px-2.5 py-1 text-[10.5px] font-bold tracking-tight uppercase transition-all duration-300',
                cls,
            )}
        >
            {label ?? STATUS_LABEL[status] ?? status}
        </span>
    );
}

// ─── Progress bar ────────────────────────────────────────────────────
export function ProgressBar({ done, total, pct }: { done: number; total: number; pct: number }) {
    return (
        <div>
            <div className="mb-1 text-xs text-black/40 dark:text-white/40">
                {done}/{total}
            </div>
            <div className="h-1 w-20 overflow-hidden rounded-full border border-black/5 bg-black/5 dark:border-white/5 dark:bg-white/5">
                <div className="h-full rounded-full bg-black transition-all dark:bg-white" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── Action icon colors ──────────────────────────────────────────────
export const ACTION_COLORS: Record<string, string> = {
    CONTRACT_CREATED: '#000000',
    FILE_UPLOADED: '#000000',
    APPROVAL_APPROVED: '#000000',
    APPROVAL_REJECTED: '#000000',
    CONTRACT_APPROVED: '#000000',
};
