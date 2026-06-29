<?php

namespace App\Http\Requests\Contract;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AddAdhocApproverRequest extends FormRequest
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
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'uuid|exists:m_users,id',
            'user_id' => 'nullable|uuid|exists:m_users,id',
            'note' => 'nullable|string|max:1000',
            'target_step_id' => 'nullable|uuid|exists:m_workflow_steps,id',
            'is_sequential' => 'nullable|boolean',
            'role' => 'nullable|string|max:100',
        ];
    }
}
