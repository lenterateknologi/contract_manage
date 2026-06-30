import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/profile/UserAvatar';

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
    SKIPPED: 'Dilewati',
    SELANJUTNYA: 'Selanjutnya',
};

const STATUS_CLS: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    in_review: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800',
    revision: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800',
    locked: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800',
    archived: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700',
    pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800',
    waiting: 'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-900/30 dark:text-slate-600 dark:border-slate-800',
    SKIPPED: 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 dark:bg-slate-800 dark:text-slate-500',
    SELANJUTNYA: 'bg-slate-50 text-slate-400 border-slate-100 border-dashed dark:bg-slate-900/10 dark:text-slate-600',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
    const cls = STATUS_CLS[status] ?? STATUS_CLS.draft;
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-lg border px-2 py-0.5 text-[9px] font-semibold  uppercase transition-all duration-300',
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
