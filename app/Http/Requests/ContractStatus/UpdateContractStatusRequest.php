<?php

namespace App\Http\Requests\ContractStatus;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContractStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $statusId = $this->route('status')->id;

        return [
            'code' => 'required|string|max:50|unique:m_contract_statuses,code,'.$statusId,
            'label' => 'required|string|max:255',
            'color' => 'required|string|max:20',
            'bg_color' => 'required|string|max:20',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
