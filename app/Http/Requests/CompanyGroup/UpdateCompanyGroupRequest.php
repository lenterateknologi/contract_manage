<?php

namespace App\Http\Requests\CompanyGroup;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $groupId = $this->route('group')->id;

        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_company_groups,code,'.$groupId,
            'description' => 'nullable|string',
        ];
    }
}
