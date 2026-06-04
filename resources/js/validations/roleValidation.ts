/**
 * Validation rules for Role forms.
 */

export const validateRoleForm = (data: { name: string }) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama role harus diisi';
    }

    return errors;
};
