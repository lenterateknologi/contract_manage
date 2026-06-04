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
            'company_group_id' => 'required|uuid|exists:m_company_groups,id',
            'region_id' => 'required|uuid|exists:m_regions,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_companies,code',
            'address' => 'nullable|string',
        ];
    }
}
