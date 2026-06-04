<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CleanMasterDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entities' => 'required|array',
            'entities.*' => 'string|in:company_groups,regions,companies,departments,contract_statuses,contract_types,workflows,contracts,roles,access_mappings,navigation_mappings,form_templates,form_fields',
        ];
    }
}
