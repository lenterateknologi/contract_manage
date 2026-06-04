/**
 * Validation rules for Contract-related forms.
 */

export interface ContractFormData {
    title: string;
    contract_type_id: string;
    workflow_id?: string;
    [key: string]: any;
}

export const validateContractForm = (data: ContractFormData, hasWorkflows: boolean = false) => {
    const errors: Record<string, string> = {};

    if (!data.title?.trim()) {
        errors.title = 'Nama kontrak harus diisi';
    }

    if (!data.contract_type_id) {
        errors.contract_type_id = 'Tipe kontrak harus dipilih';
    }

    if (hasWorkflows && !data.workflow_id) {
        errors.workflow_id = 'Alur kerja harus dipilih';
    }

    return errors;
};
