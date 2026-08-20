import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/profile/UserAvatar';

export { UserAvatar as Avatar };

export { StatusBadge } from '@/components/ui/feedback/StatusBadge';

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
