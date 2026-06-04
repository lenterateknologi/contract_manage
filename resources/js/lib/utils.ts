import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from './color-utils';
export * from './formatters';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
