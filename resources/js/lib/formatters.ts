/**
 * Shared utility functions for formatting dates, numbers, and strings.
 */

function parseDateInput(date: string | Date | null | undefined): Date | null {
    if (!date) return null;
    if (date instanceof Date) return isNaN(date.getTime()) ? null : date;

    let str = String(date).trim();
    if (!str || str === '-' || str === 'null' || str === 'undefined') return null;

    // Fix format "YYYY-MM-DD HH:mm:ss" for cross-browser Safari/WebKit compatibility
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) {
        str = str.replace(' ', 'T');
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date string or object to a human-readable Indonesian date.
 * Default format: 26 Mei 2026
 */
export function formatDate(
    date: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
    const d = parseDateInput(date);
    if (!d) return '-';
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
 * Default format: 07 Sep 2026, 09:29
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    const d = parseDateInput(date);
    if (!d) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
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
