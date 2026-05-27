/**
 * Shared utility functions for formatting dates, numbers, and strings.
 */

/**
 * Format a date string or object to a human-readable Indonesian date.
 * Default format: 26 Mei 2026
 */
export function formatDate(date: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', options);
}

/**
 * Format a date string or object to a short Indonesian date.
 * Default format: 26/05/26
 */
export function formatDateShort(date: string | Date | null | undefined): string {
    return formatDate(date, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/**
 * Format a date string or object to Indonesian date and time.
 * Default format: 26/05/2026 14:30
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/\./g, ':');
}

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
        maximumFractionDigits: 0
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
