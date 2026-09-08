/**
 * Shared utility functions for User Avatars, Colors, and Initials.
 */

export const AVATAR_COLORS = [
    'bg-violet-500 text-white',
    'bg-blue-500 text-white',
    'bg-cyan-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-orange-500 text-white',
    'bg-rose-500 text-white',
    'bg-pink-500 text-white',
    'bg-indigo-500 text-white',
    'bg-teal-500 text-white',
    'bg-lime-500 text-white',
    'bg-fuchsia-500 text-white',
];

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const AVATAR_SIZE_MAP: Record<AvatarSize, { root: string; text: string }> = {
    xs: { root: 'h-5 w-5', text: 'text-[9px]' },
    sm: { root: 'h-6 w-6', text: 'text-[10px]' },
    md: { root: 'h-8 w-8', text: 'text-xs' },
    lg: { root: 'h-10 w-10', text: 'text-sm' },
    xl: { root: 'h-12 w-12', text: 'text-base' },
};

/**
 * Returns a consistent Tailwind bg + text color class pair based on input string (e.g. name or ID).
 */
export function getAvatarColor(name?: string | null): string {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0;
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

// Alias for getAvatarColor
export const avatarColor = getAvatarColor;

/**
 * Extracts initials from a user's full name (up to 2 characters).
 */
export function getInitials(name?: string | null, fallback = '?'): string {
    if (!name || typeof name !== 'string') return fallback;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return fallback;
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface UserAvatarData {
    name: string;
    avatarUrl?: string;
    initials: string;
    colorClass: string;
    role?: string;
    department?: string;
    email?: string;
}

/**
 * Normalizes any user object shape into standard avatar props.
 */
export function getUserAvatarData(user?: any): UserAvatarData {
    const name = user?.name || user?.username || 'Unknown';
    const avatarUrl = user?.avatar_url || user?.avatar || user?.photo || user?.profile_photo_url || undefined;
    const initials = user?.initials || getInitials(name);
    const colorClass = getAvatarColor(name);
    const role = user?.role || user?.role_name || user?.position || undefined;
    const department = user?.department_name || user?.department?.name || user?.division_name || undefined;
    const email = user?.email || undefined;

    return {
        name,
        avatarUrl,
        initials,
        colorClass,
        role,
        department,
        email,
    };
}
