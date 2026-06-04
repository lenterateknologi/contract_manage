<?php

namespace App\Http\Requests\Workflow;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'contract_type_id' => 'nullable|uuid|exists:m_contract_types,id',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'initiator_type' => 'nullable|string|in:all,role,user',
            'scope' => 'nullable|string',
            'workflow_category' => 'nullable|string',
            'company_group_ids' => 'nullable|array',
            'region_ids' => 'nullable|array',
            'company_ids' => 'nullable|array',
            'initiator_roles' => 'nullable|array',
            'initiator_users' => 'nullable|array',
            'initiator_departments' => 'nullable|array',
            'meta' => 'nullable|array',
            'steps' => 'nullable|array',
            'steps.*.id' => 'nullable|string',
            'steps.*.label' => 'nullable|string',
            'steps.*.is_mandatory' => 'nullable|boolean',
            'steps.*.role' => 'nullable',
            'steps.*.description' => 'nullable|string',
            'steps.*.approver_type' => 'nullable|string',
            'steps.*.step_category' => 'nullable|string',
            'steps.*.is_optional' => 'boolean',
            'steps.*.optional_label' => 'nullable|string',
            'steps.*.condition_expression' => 'nullable|string',
            'steps.*.phase' => 'nullable|string',
            'steps.*.uploader_type' => 'nullable|string',
            'steps.*.hierarchy_level' => 'nullable|integer',
            'steps.*.role_id' => 'nullable|string',
            'steps.*.user_ids' => 'nullable|array',
            'steps.*.department_ids' => 'nullable|array',
            'steps.*.meta' => 'nullable|array',
            'steps.*.company_group_ids' => 'nullable|array',
            'steps.*.region_ids' => 'nullable|array',
            'steps.*.company_ids' => 'nullable|array',
            'steps.*.filter_department' => 'nullable|boolean',
            'steps.*.filter_company_group' => 'nullable|boolean',
            'steps.*.filter_region' => 'nullable|boolean',
            'steps.*.filter_company' => 'nullable|boolean',
            'steps.*.actions' => 'nullable|array',
            'steps.*.actions.*.id' => 'nullable|string',
            'steps.*.actions.*.master_action_id' => 'nullable|string',
            'steps.*.actions.*.master_action_name' => 'nullable|string',
            'steps.*.actions.*.next_step_id' => 'nullable|string',
            'steps.*.actions.*.next_workflow_id' => 'nullable|string',
            'steps.*.actions.*.next_workflow_step_id' => 'nullable|string',
            'steps.*.actions.*.required_fields' => 'nullable|array',
            'steps.*.actions.*.autofilled_fields' => 'nullable|array',
            'steps.*.actions.*.transition_config' => 'nullable|array',
            'steps.*.actions.*.signing_parties' => 'nullable|array',
            'steps.*.actions.*.assignee_config' => 'nullable|array',
            'steps.*.actions.*.alias' => 'nullable|string',
            'steps.*.actions.*.description' => 'nullable|string',
            'steps.*.actions.*.is_active' => 'nullable|boolean',
        ];
    }
}
