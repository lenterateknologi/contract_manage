<?php

namespace App\Http\Requests\CompanyGroup;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_company_groups,code',
            'description' => 'nullable|string',
        ];
    }
}
