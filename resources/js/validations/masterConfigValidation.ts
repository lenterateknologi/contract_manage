/**
 * Validation rules for Master Configuration (Contract Types & Statuses).
 */

export const validateContractTypeForm = (data: { name: string; code: string }) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama tipe kontrak harus diisi';
    }

    if (!data.code?.trim()) {
        errors.code = 'Kode tipe kontrak harus diisi';
    }

    return errors;
};

export const validateContractStatusForm = (data: { label: string; code: string; color: string }) => {
    const errors: Record<string, string> = {};

    if (!data.label?.trim()) {
        errors.label = 'Label status harus diisi';
    }

    if (!data.code?.trim()) {
        errors.code = 'Kode status harus diisi';
    }

    if (!data.color?.trim()) {
        errors.color = 'Warna status harus dipilih';
    }

    return errors;
};
