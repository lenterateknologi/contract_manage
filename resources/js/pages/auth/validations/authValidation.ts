/**
 * Validation rules for Authentication (Login, Register).
 */

export const validateLoginForm = (data: { email: string; password: string }) => {
    const errors: Record<string, string> = {};

    if (!data.email?.trim()) {
        errors.email = 'Email atau username harus diisi';
    }

    if (!data.password) {
        errors.password = 'Password harus diisi';
    }

    return errors;
};

export const validateRegisterForm = (data: any) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama lengkap harus diisi';
    }

    if (!data.email?.trim()) {
        errors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Format email tidak valid';
    }

    if (!data.password) {
        errors.password = 'Password harus diisi';
    } else if (data.password.length < 8) {
        errors.password = 'Password minimal 8 karakter';
    }

    if (data.password !== data.password_confirmation) {
        errors.password_confirmation = 'Konfirmasi password tidak cocok';
    }

    return errors;
};
