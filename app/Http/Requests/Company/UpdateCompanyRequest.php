<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->route('company')->id;

        return [
            'company_group_id' => 'required|uuid|exists:m_company_groups,id',
            'region_id' => 'required|uuid|exists:m_regions,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_companies,code,'.$companyId,
            'address' => 'nullable|string',
        ];
    }
}
