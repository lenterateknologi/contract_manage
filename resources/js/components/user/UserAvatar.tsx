import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types/contracts';

interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
    user?: UserProfile | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
    xl: 'h-12 w-12 text-base',
};

const AVATAR_COLORS = [
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'bg-primary/10 text-primary border border-primary/20',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
];

function getAvatarColor(name: string): string {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function UserAvatar({ user, size = 'md', className, ...props }: UserAvatarProps) {
    const initials = user?.initials || user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
    const colorClass = getAvatarColor(user?.name || '');

    return (
        <AvatarPrimitive.Root
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full shadow-sm',
                sizeMap[size],
                className
            )}
            {...props}
        >
            <AvatarPrimitive.Image
                src={user?.avatar_url}
                alt={user?.name}
                className="aspect-square h-full w-full object-cover"
            />
            <AvatarPrimitive.Fallback
                className={cn(
                    'flex h-full w-full items-center justify-center font-bold uppercase',
                    colorClass
                )}
            >
                {initials}
            </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
    );
}
