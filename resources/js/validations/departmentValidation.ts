/**
 * Validation rules for Department forms.
 */

export const validateDepartmentForm = (data: { name: string; code: string }) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama departemen harus diisi';
    }

    if (!data.code?.trim()) {
        errors.code = 'Kode departemen harus diisi';
    }

    return errors;
};
