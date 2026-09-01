<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_companies,code',
            'alias' => 'nullable|string|max:50',
            'npwp' => 'nullable|string|max:50',
            'company_group_name' => 'nullable|string|max:255',
            'company_group_id' => 'nullable|uuid|exists:m_company_groups,id',
            'region_name' => 'nullable|string|max:150',
            'region_id' => 'nullable|uuid|exists:m_regions,id',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:150',
            'oracle_code' => 'nullable|string|max:50',
            'is_used' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ];
    }
}
