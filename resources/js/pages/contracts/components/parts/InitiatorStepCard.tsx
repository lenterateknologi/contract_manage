import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { formatDateTime } from '@/lib/utils';
import { UserProfile } from '@/pages/contracts/types';

interface InitiatorStepCardProps {
    isOnly: boolean;
    creator: UserProfile;
    submittedAt?: string;
    isLite?: boolean;
}

export function InitiatorStepCard({ creator, submittedAt }: InitiatorStepCardProps) {
    return (
        <div className="flex w-full items-center justify-between gap-2 py-0.5">
            <div className="flex min-w-0 items-center gap-2">
                <UserAvatarIcon user={creator} size="sm" className="ring-surface-base h-6 w-6 shrink-0 text-[10px] ring-1" />
                <div className="flex min-w-0 items-center gap-1">
                    <span className="text-text-main truncate text-[11px] leading-tight font-bold">{creator?.name || 'Inisiator'}</span>
                </div>
            </div>
            {submittedAt && (
                <span className="text-muted-foreground shrink-0 font-mono text-[9px] uppercase tabular-nums">{formatDateTime(submittedAt)}</span>
            )}
        </div>
    );
}
