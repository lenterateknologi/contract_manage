/**
 * Validation rules for Organization-related forms (Companies, Regions, Groups).
 */

export const validateCompanyForm = (data: { name: string; code: string; company_group_id: string; region_id: string }) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama perusahaan harus diisi';
    }

    if (!data.code?.trim()) {
        errors.code = 'Kode perusahaan harus diisi';
    }

    if (!data.company_group_id) {
        errors.company_group_id = 'Group perusahaan harus dipilih';
    }

    if (!data.region_id) {
        errors.region_id = 'Region harus dipilih';
    }

    return errors;
};

export const validateRegionForm = (data: { name: string; code: string }) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama region harus diisi';
    }

    if (!data.code?.trim()) {
        errors.code = 'Kode region harus diisi';
    }

    return errors;
};

export const validateCompanyGroupForm = (data: { name: string; code: string }) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama group harus diisi';
    }

    if (!data.code?.trim()) {
        errors.code = 'Kode group harus diisi';
    }

    return errors;
};
