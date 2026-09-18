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
            'attachment' => 'nullable|file|max:20480', // 20MB limit
            'attachments' => 'nullable|array',
            'attachments.*' => 'nullable|file|max:20480',
            'assigned_pic_id' => 'nullable|uuid|exists:m_users,id',
            'execution_order' => 'nullable|string',
            'action_code' => 'nullable|string',
            'action_id' => 'nullable|string',
            'target_step_id' => 'nullable|uuid|exists:m_workflow_steps,id',
        ];
    }
}
