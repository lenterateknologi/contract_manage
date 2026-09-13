/**
 * Shared utility functions for formatting dates, numbers, and strings.
 */

export * from './time-utils';


/**
 * Format a number or string to Indonesian Rupiah currency.
 * Format: Rp 1.000.000
 */
export function formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined || amount === '') return 'Rp 0';
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
    if (isNaN(val)) return 'Rp 0';

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val);
}

/**
 * Parse a formatted currency string back to a float.
 */
export function parseCurrency(price: string | null | undefined): number {
    if (!price) return 0;
    const clean = price.replace(/[^\d.,]/g, '');
    const hasDot = clean.includes('.');
    const hasComma = clean.includes(',');

    let result = clean;
    if (hasDot && hasComma) {
        if (clean.indexOf('.') < clean.indexOf(',')) {
            result = clean.replace(/\./g, '').replace(',', '.');
        } else {
            result = clean.replace(/,/g, '');
        }
    } else if (hasComma) {
        result = clean.replace(',', '.');
    }

    const val = parseFloat(result);
    return isNaN(val) ? 0 : val;
}

/**
 * Format bytes into human-readable file size string (e.g. 2.4 MB, 500 KB).
 */
export function formatFileSize(bytes: number | null | undefined): string {
    if (bytes == null || isNaN(bytes) || bytes <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
