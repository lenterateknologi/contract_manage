import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, avatarColor } from '@/lib/utils';
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

export function UserAvatar({ user, size = 'md', className, ...props }: UserAvatarProps) {
    const initials = user?.initials || user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
    const colorClass = avatarColor(user?.name || '');

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
