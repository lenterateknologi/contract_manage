<?php

namespace App\Http\Requests\Contract;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateContractRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'contract_type_id' => 'nullable|uuid|exists:m_contract_types,id',
            'contract_type_parent_id' => 'nullable|uuid|exists:m_contract_types,id',
            'submission_type_id' => 'nullable|uuid|exists:m_submission_types,id',
            'form_no' => 'nullable|string',
            'contract_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'contract_no' => 'nullable|string|max:255',
            'transaction_type' => 'nullable|string',
            'tax_required' => 'nullable|boolean',
            'initiated_by_id' => 'nullable|uuid|exists:m_users,id',
            'vendor_id' => 'nullable|uuid|exists:m_vendors,id',
            'kop_sub_topik' => 'nullable|string',
            'parent_id' => 'nullable|exists:t_contracts,id',
            'p1_entity' => 'nullable|string',
            'p1_signer' => 'nullable|string',
            'p1_signer_position' => 'nullable|string',
            'p1_address' => 'nullable|string',
            'p2_entity' => 'nullable|string',
            'p2_signer' => 'nullable|string',
            'p2_signer_position' => 'nullable|string',
            'p2_address' => 'nullable|string',
            'category' => 'nullable|string',
            'project_name' => 'nullable|string',
            'topic' => 'nullable|string',
            'workflow_id' => 'nullable|uuid|exists:m_workflows,id',
            'metadata' => 'nullable|array',
            'assigned_pic_id' => 'nullable|uuid|exists:m_users,id',
        ];
    }
}
