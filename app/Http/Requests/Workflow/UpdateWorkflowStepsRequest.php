<?php

namespace App\Http\Requests\Workflow;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkflowStepsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'steps' => 'nullable|array',
            'steps.*.id' => 'nullable|string',
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
            'steps.*.label' => 'nullable|string',
            'steps.*.is_mandatory' => 'nullable|boolean',
            'steps.*.meta' => 'nullable|array',
            'steps.*.company_group_ids' => 'nullable|array',
            'steps.*.region_ids' => 'nullable|array',
            'steps.*.company_ids' => 'nullable|array',
            'steps.*.filter_department' => 'nullable|boolean',
            'steps.*.filter_company_group' => 'nullable|boolean',
            'steps.*.filter_region' => 'nullable|boolean',
            'steps.*.filter_company' => 'nullable|boolean',
                        'steps.*.approver_authorities' => 'nullable|array',
            'steps.*.approver_authorities.*.authority_type' => 'required|string',
            'steps.*.approver_authorities.*.role_id' => 'nullable|string',
            'steps.*.approver_authorities.*.department_id' => 'nullable|string',
            'steps.*.approver_authorities.*.division_id' => 'nullable|string',
            'steps.*.approver_authorities.*.user_id' => 'nullable|string',
            'steps.*.approver_authorities.*.company_group_id' => 'nullable|string',
            'steps.*.approver_authorities.*.region_id' => 'nullable|string',
            'steps.*.approver_authorities.*.use_initiator_property' => 'nullable|boolean',
            'steps.*.approver_authorities.*.role_use_initiator' => 'nullable|boolean',
            'steps.*.approver_authorities.*.department_use_initiator' => 'nullable|boolean',
            'steps.*.approver_authorities.*.division_use_initiator' => 'nullable|boolean',
            'steps.*.approver_authorities.*.company_group_use_initiator' => 'nullable|boolean',
            'steps.*.approver_authorities.*.region_use_initiator' => 'nullable|boolean',
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
