/**
 * Validation rules for Workflow forms.
 */

export interface WorkflowFormData {
    name: string;
    steps?: any[];
}

export const validateWorkflowForm = (data: WorkflowFormData) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
        errors.name = 'Nama alur kerja harus diisi';
    }

    if (data.steps && data.steps.length === 0) {
        errors.general = 'Alur kerja minimal harus memiliki satu tahapan';
    }

    return errors;
};
