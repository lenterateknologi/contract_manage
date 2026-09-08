import { UserAvatarIcon } from '@/components/profile/UserAvatar';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user: User | null; showEmail?: boolean }) {
    if (!user) return null;

    return (
        <>
            <UserAvatarIcon user={user} size="md" className="h-8 w-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && <span className="text-muted-foreground truncate text-xs group-hover:text-white">{user.email}</span>}
            </div>
        </>
    );
}
