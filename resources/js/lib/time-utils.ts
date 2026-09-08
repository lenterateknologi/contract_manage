/**
 * Shared utility functions for parsing, formatting, and handling dates and times.
 */

const ID_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
const ID_MONTHS_LONG = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];
const ID_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Parses various date inputs (string, Date, ISO timestamp, Carbon string) into a valid Date object.
 */
export function parseDateInput(date: string | Date | null | undefined): Date | null {
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
 * Default format: 8 Sep 2026 (or customizable via options)
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
 * Format a date to Indonesian format e.g. "8 Sep 2026"
 */
export function formatDateIndo(date: string | Date | null | undefined): string {
    const d = parseDateInput(date);
    if (!d) return '-';
    return `${d.getDate()} ${ID_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format a date to Indonesian long format e.g. "8 September 2026"
 */
export function formatDateLong(date: string | Date | null | undefined): string {
    const d = parseDateInput(date);
    if (!d) return '-';
    return `${d.getDate()} ${ID_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format time string e.g. "09:41" or "09:41 WIB"
 */
export function formatTime(date: string | Date | null | undefined, withZone = false): string {
    const d = parseDateInput(date);
    if (!d) return '-';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return withZone ? `${hours}:${minutes} WIB` : `${hours}:${minutes}`;
}

/**
 * Format a date string or object to Indonesian date and time.
 * Default format: 08 Sep 2026, 09:29
 */
export function formatDateTime(date: string | Date | null | undefined, withZone = false): string {
    const d = parseDateInput(date);
    if (!d) return '-';

    const day = d.getDate();
    const month = ID_MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const zoneStr = withZone ? ' WIB' : '';

    return `${day} ${month} ${year}, ${hours}:${minutes}${zoneStr}`;
}

/**
 * Splits date and time into two parts for structured multi-line rendering.
 * Example output: { dateStr: '8 Sep 2026', timeStr: '09:41 WIB' }
 */
export function formatDateAndTimeParts(
    date: string | Date | null | undefined,
    fallbackStr?: string,
): { dateStr: string; timeStr: string } {
    const d = parseDateInput(date);
    if (!d) {
        if (fallbackStr && fallbackStr.includes(',')) {
            const [dPart, tPart] = fallbackStr.split(',');
            return {
                dateStr: dPart.trim(),
                timeStr: tPart ? `${tPart.trim()} WIB` : '',
            };
        }
        return { dateStr: fallbackStr || '—', timeStr: '' };
    }

    const dateStr = `${d.getDate()} ${ID_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes} WIB`;

    return { dateStr, timeStr };
}

/**
 * Formats a date range filter text.
 * Example: "1 Jan 2026 – 31 Jan 2026", "Dari 1 Jan 2026", "Sampai 31 Jan 2026", or "-"
 */
export function formatDateRange(
    dateFrom?: string | Date | null,
    dateTo?: string | Date | null,
): string {
    const fromStr = dateFrom ? formatDate(dateFrom) : null;
    const toStr = dateTo ? formatDate(dateTo) : null;

    if (fromStr && toStr && fromStr !== '-' && toStr !== '-') {
        return `${fromStr} – ${toStr}`;
    }
    if (fromStr && fromStr !== '-') {
        return `Dari ${fromStr}`;
    }
    if (toStr && toStr !== '-') {
        return `Sampai ${toStr}`;
    }
    return '-';
}

/**
 * Formats date for form builder or optional time input.
 */
export function formatDateWithOptionalTime(dateStrInput?: string | null, field?: any): string {
    let dateObj = new Date();
    if (dateStrInput) {
        const parsed = parseDateInput(dateStrInput);
        if (parsed) dateObj = parsed;
    }
    const dateStr = dateObj.toLocaleDateString('en-CA');
    const isDateOnly = field?.type === 'date' || field?.options?.value_type === 'date';
    if (isDateOnly) return dateStr;
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
}

/**
 * Relative time helper (e.g. "Baru saja", "5 menit lalu", "2 jam lalu", "Kemarin", "3 hari lalu")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    const d = parseDateInput(date);
    if (!d) return '-';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    if (diffDay === 1) return 'Kemarin';
    if (diffDay < 7) return `${diffDay} hari yang lalu`;

    return formatDate(d);
}
