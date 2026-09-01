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
        $groupId = $this->route('group') ? ($this->route('group')->id ?? $this->route('group')) : $this->route('id');

        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_company_groups,code,'.$groupId,
            'is_used' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ];
    }
}
