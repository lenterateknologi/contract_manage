import { AVATAR_SIZE_MAP, type AvatarSize, cn, getUserAvatarData } from '@/lib/utils';
import { UserProfile } from '@/pages/contracts/types';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

export type UserAvatarVariant = 'icon' | 'name' | 'role';

export interface UserAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    user?: UserProfile | any | null;
    name?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    department?: string | null;
    size?: AvatarSize;
    variant?: UserAvatarVariant;
    avatarClassName?: string;
    nameClassName?: string;
    roleClassName?: string;
}

/**
 * Core Avatar Icon circle only.
 */
export function UserAvatarIcon({
    user,
    name: nameProp,
    avatarUrl: avatarUrlProp,
    size = 'md',
    className,
}: {
    user?: any;
    name?: string | null;
    avatarUrl?: string | null;
    size?: AvatarSize;
    className?: string;
}) {
    const data = getUserAvatarData(user);
    const name = nameProp || data.name;
    const avatarUrl = avatarUrlProp || data.avatarUrl;
    const initials = data.initials;
    const colorClass = data.colorClass;
    const sizeClasses = AVATAR_SIZE_MAP[size] || AVATAR_SIZE_MAP.md;

    return (
        <AvatarPrimitive.Root
            className={cn(
                'relative flex shrink-0 overflow-hidden rounded-full shadow-xs select-none',
                sizeClasses.root,
                className,
            )}
        >
            {avatarUrl && (
                <AvatarPrimitive.Image
                    src={avatarUrl}
                    alt={name}
                    className="aspect-square h-full w-full object-cover"
                />
            )}
            <AvatarPrimitive.Fallback
                className={cn(
                    'flex h-full w-full items-center justify-center font-bold tracking-tight uppercase',
                    sizeClasses.text,
                    colorClass,
                )}
            >
                {initials}
            </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
    );
}

/**
 * Avatar with user's name beside it.
 */
export function UserAvatarWithName({
    user,
    name: nameProp,
    avatarUrl,
    size = 'md',
    className,
    avatarClassName,
    nameClassName,
}: {
    user?: any;
    name?: string | null;
    avatarUrl?: string | null;
    size?: AvatarSize;
    className?: string;
    avatarClassName?: string;
    nameClassName?: string;
}) {
    const data = getUserAvatarData(user);
    const displayName = nameProp || data.name;

    return (
        <div className={cn('inline-flex items-center gap-2 min-w-0', className)}>
            <UserAvatarIcon
                user={user}
                name={displayName}
                avatarUrl={avatarUrl}
                size={size}
                className={avatarClassName}
            />
            <span className={cn('truncate text-xs font-semibold text-text-main', nameClassName)}>
                {displayName}
            </span>
        </div>
    );
}

/**
 * Avatar with user's name and role / department below it.
 */
export function UserAvatarWithRole({
    user,
    name: nameProp,
    avatarUrl,
    role: roleProp,
    department: deptProp,
    size = 'md',
    className,
    avatarClassName,
    nameClassName,
    roleClassName,
}: {
    user?: any;
    name?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    department?: string | null;
    size?: AvatarSize;
    className?: string;
    avatarClassName?: string;
    nameClassName?: string;
    roleClassName?: string;
}) {
    const data = getUserAvatarData(user);
    const displayName = nameProp || data.name;
    const roleText = roleProp || data.role || '';
    const deptText = deptProp || data.department || '';
    const subtitle = [roleText, deptText].filter(Boolean).join(' • ') || 'Staff';

    return (
        <div className={cn('inline-flex items-center gap-2.5 min-w-0', className)}>
            <UserAvatarIcon
                user={user}
                name={displayName}
                avatarUrl={avatarUrl}
                size={size}
                className={avatarClassName}
            />
            <div className="flex flex-col min-w-0 text-left leading-tight">
                <span className={cn('truncate text-xs font-semibold text-text-main', nameClassName)}>
                    {displayName}
                </span>
                <span className={cn('truncate text-[10px] font-medium text-text-desc mt-0.5', roleClassName)}>
                    {subtitle}
                </span>
            </div>
        </div>
    );
}

/**
 * Unified UserAvatar component supporting 3 variants:
 * - variant="icon" (default: avatar icon only)
 * - variant="name" (avatar icon + name)
 * - variant="role" (avatar icon + name + role/department)
 */
export function UserAvatar({
    user,
    name,
    avatarUrl,
    role,
    department,
    size = 'md',
    variant = 'icon',
    className,
    avatarClassName,
    nameClassName,
    roleClassName,
    ...props
}: UserAvatarProps) {
    if (variant === 'name') {
        return (
            <UserAvatarWithName
                user={user}
                name={name}
                avatarUrl={avatarUrl}
                size={size}
                className={className}
                avatarClassName={avatarClassName}
                nameClassName={nameClassName}
                {...props}
            />
        );
    }

    if (variant === 'role') {
        return (
            <UserAvatarWithRole
                user={user}
                name={name}
                avatarUrl={avatarUrl}
                role={role}
                department={department}
                size={size}
                className={className}
                avatarClassName={avatarClassName}
                nameClassName={nameClassName}
                roleClassName={roleClassName}
                {...props}
            />
        );
    }

    return (
        <UserAvatarIcon
            user={user}
            name={name}
            avatarUrl={avatarUrl}
            size={size}
            className={cn(className, avatarClassName)}
        />
    );
}

export default UserAvatar;
