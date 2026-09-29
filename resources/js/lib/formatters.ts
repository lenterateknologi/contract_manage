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

/**
 * Format a number to ID locale string with thousands separator (e.g. 500.000).
 */
export function formatNumber(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === '') return '';
    const clean = typeof val === 'string' ? val.replace(/\D/g, '') : String(val);
    if (!clean) return '';
    const num = parseInt(clean, 10);
    return isNaN(num) ? '' : new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Extract human-readable, specific error message from Axios / API Error.
 * Handles 413 (Payload Too Large), 422 (Validation Errors), 403, 401, 500, etc.
 */
export function parseApiErrorMessage(error: any, fallbackMessage = 'Terjadi kesalahan sistem.'): string {
    if (!error) return fallbackMessage;

    const status = error.response?.status;
    const data = error.response?.data;

    // HTTP 413: Content / Payload Too Large
    if (status === 413) {
        return 'Ukuran berkas terlalu besar (413 Content Too Large). Silakan kurangi ukuran berkas atau kompres sebelum mengunggah.';
    }

    // HTTP 419: CSRF Token Expired
    if (status === 419) {
        return 'Sesi keamanan kedaluwarsa (419). Silakan muat ulang (refresh) halaman.';
    }

    // HTTP 429: Rate Limit
    if (status === 429) {
        return 'Terlalu banyak permintaan (429). Silakan tunggu beberapa saat lagi.';
    }

    // HTTP 401: Unauthorized
    if (status === 401) {
        return 'Sesi login telah berakhir (401). Silakan login kembali.';
    }

    // Validation Errors (422) or structured errors object
    if (data?.errors && typeof data.errors === 'object') {
        const errorValues = Object.values(data.errors).flat().filter(Boolean);
        if (errorValues.length > 0) {
            return String(errorValues[0]);
        }
    }

    // Specific backend message
    if (data?.message && typeof data.message === 'string' && data.message.trim() !== '') {
        return data.message;
    }

    // If data itself is a string error message
    if (typeof data === 'string' && data.trim() !== '' && !data.includes('<!DOCTYPE')) {
        return data.trim();
    }

    // HTTP Status Fallbacks
    if (status === 403) {
        return 'Anda tidak memiliki hak akses untuk melakukan aksi ini (403 Forbidden).';
    }
    if (status === 404) {
        return 'Data atau berkas tidak ditemukan (404 Not Found).';
    }
    if (status >= 500) {
        return `Terjadi kesalahan pada server (${status}). Silakan coba lagi nanti atau hubungi administrator.`;
    }

    // Network / Client error message
    if (error.message) {
        if (error.message === 'Network Error') {
            return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
        }
        return error.message;
    }

    return fallbackMessage;
}
