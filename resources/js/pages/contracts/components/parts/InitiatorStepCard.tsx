import { cn, formatDateTime } from '@/lib/utils';
import { UserProfile } from '@/pages/contracts/types';
import { Check, Clock, Send } from 'lucide-react';
import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { Badge } from '@/components/ui/feedback/Badge';

interface InitiatorStepCardProps {
    isOnly: boolean;
    creator: UserProfile;
    submittedAt?: string;
    isLite?: boolean;
}

export function InitiatorStepCard({ creator, submittedAt }: InitiatorStepCardProps) {
    return (
        <div className="flex items-center justify-between gap-2 w-full py-0.5">
            <div className="flex items-center gap-2 min-w-0">
                <UserAvatarIcon user={creator} size="sm" className="h-6 w-6 ring-1 ring-surface-base shrink-0 text-[10px]" />
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-text-main truncate text-[11px] font-bold leading-tight">
                        {creator?.name || 'Inisiator'}
                    </span>
                    <Check size={11} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                    <Badge variant="outline" className="px-1.5 py-0 font-bold uppercase text-emerald-700 dark:text-emerald-300 border-emerald-500/25 bg-emerald-500/10 text-[8px] tracking-wider rounded-xs">
                        Diajukan (Pengajuan Awal)
                    </Badge>
                </div>
            </div>
            {submittedAt && (
                <span className="text-muted-foreground shrink-0 font-mono text-[9px] tabular-nums uppercase">
                    {formatDateTime(submittedAt)}
                </span>
            )}
        </div>
    );
}
