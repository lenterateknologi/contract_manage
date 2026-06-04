<?php

namespace App\Http\Requests\ContractType;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContractTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $typeId = $this->route('type')->id;

        return [
            'code' => 'required|string|max:100|unique:m_contract_types,code,'.$typeId,
            'name' => 'required|string|max:255|unique:m_contract_types,name,'.$typeId,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|uuid|exists:m_contract_types,id|not_in:'.$typeId,
            'f1_input_mechanism' => 'nullable|string|in:manual,digital,folder',
            'f1_form_template_id' => 'nullable|uuid|exists:m_form_templates,id',
            'f1_contract_template_id' => 'nullable|uuid|exists:m_contract_templates,id',
            'f2_input_mechanism' => 'nullable|string|in:manual,digital,folder',
            'f2_form_template_id' => 'nullable|uuid|exists:m_form_templates,id',
            'f2_contract_template_id' => 'nullable|uuid|exists:m_contract_templates,id',
        ];
    }
}
