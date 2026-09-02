<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|max:50|unique:m_vendors,code',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'company_type' => 'nullable|string|max:100',
            'pic_name' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ];
    }
}
