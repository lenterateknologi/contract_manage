<?php

namespace App\Http\Requests\Contract;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ApproveContractRequest extends FormRequest
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
            'note' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240', // 10MB limit
            'assigned_pic_id' => 'nullable|uuid|exists:m_users,id',
            'execution_order' => 'nullable|string',
            'signer_user_ids' => 'nullable|array',
            'signer_user_ids.*' => 'uuid|exists:m_users,id',
            'p1_user_id' => 'nullable|uuid|exists:m_users,id',
            'p2_user_id' => 'nullable|uuid|exists:m_users,id',
            'action_code' => 'nullable|string',
            'target_step_id' => 'nullable|uuid|exists:m_workflow_steps,id',
        ];
    }
}
