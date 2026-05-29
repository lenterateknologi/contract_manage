import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from './formatters';
export * from './color-utils';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
