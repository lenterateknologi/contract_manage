/**
 * Validation rules for User forms.
 */

export interface UserFormData {
    name: string;
    email: string;
    username: string;
    role?: string;
    department_id?: string;
    company_id?: string;
    password?: string;
    password_confirmation?: string;
}

export const validateUserForm = (data: UserFormData, isUpdate: boolean = false) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama harus diisi';
    }

    if (!data.email?.trim()) {
        errors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Format email tidak valid';
    }

    if (!data.username?.trim()) {
        errors.username = 'Username harus diisi';
    }

    if (!isUpdate && !data.password) {
        errors.password = 'Password harus diisi';
    }

    if (data.password && data.password !== data.password_confirmation) {
        errors.password_confirmation = 'Konfirmasi password tidak cocok';
    }

    return errors;
};
