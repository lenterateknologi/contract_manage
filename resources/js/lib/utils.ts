import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from './color-utils';
export * from './avatar-utils';
export * from './time-utils';
export * from './status-utils';
export * from './badge-utils';
export * from './formatters';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
