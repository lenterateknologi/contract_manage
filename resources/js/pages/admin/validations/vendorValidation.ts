/**
 * Validation rules for Vendor forms.
 */

export interface VendorFormData {
    name: string;
    code: string;
    email?: string;
    phone?: string;
}

export const validateVendorForm = (data: VendorFormData) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama vendor harus diisi';
    }

    if (!data.code?.trim()) {
        errors.code = 'Kode vendor harus diisi';
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Format email tidak valid';
    }

    return errors;
};
