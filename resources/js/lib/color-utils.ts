/**
 * Shared color palette definitions and deterministic hashing helpers for consistent UI components.
 */

export const COMPANY_COLORS = ['bg-primary-muted text-primary', 'bg-info/10 text-info', 'bg-primary/10 text-primary', 'bg-primary/20 text-primary'];

export const GROUP_COLORS = [
    'bg-primary-muted text-primary',
    'bg-success/10 text-success',
    'bg-info/10 text-info',
    'bg-primary/10 text-primary',
    'bg-warning/10 text-warning',
];

export const REGION_COLORS = [
    'bg-primary-muted text-primary',
    'bg-danger/10 text-danger',
    'bg-success/10 text-success',
    'bg-info/10 text-info',
    'bg-primary/10 text-primary',
    'bg-warning/10 text-warning',
];

export const DEPT_COLORS = [
    'bg-primary-muted text-primary',
    'bg-success/10 text-success',
    'bg-info/10 text-info',
    'bg-primary/10 text-primary',
    'bg-warning/10 text-warning',
];

export const VENDOR_COLORS = [
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-info/10 text-info dark:bg-info/20 dark:text-info',
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
];

export const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-info/10 text-info dark:bg-info/20 dark:text-info',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
];

/**
 * Deterministically retrieves a color class from a given list of colors based on a string name.
 */
export function getDeterministicColor(name: string, colors: string[]): string {
    if (!name) return colors[0];
    let h = 0;
    for (let i = 0; i < name.length; i++) {
        h = name.charCodeAt(i) + ((h << 5) - h);
    }
    return colors[Math.abs(h) % colors.length];
}

export function companyColor(name: string): string {
    return getDeterministicColor(name, COMPANY_COLORS);
}

export function groupColor(name: string): string {
    return getDeterministicColor(name, GROUP_COLORS);
}

export function regionColor(name: string): string {
    return getDeterministicColor(name, REGION_COLORS);
}

export function deptColor(name: string): string {
    return getDeterministicColor(name, DEPT_COLORS);
}

export function vendorColor(name: string): string {
    return getDeterministicColor(name, VENDOR_COLORS);
}

export function avatarColor(name: string): string {
    return getDeterministicColor(name, AVATAR_COLORS);
}
