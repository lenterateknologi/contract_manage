<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $vendorId = $this->route('vendor')->id;

        return [
            'code' => 'required|string|max:50|unique:m_vendors,code,'.$vendorId,
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            'company_type' => 'nullable|string|max:100',
            'is_individual' => 'boolean',
            'website' => 'nullable|string|max:255',
            'pic_name' => 'nullable|string|max:255',
            'pic_position' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:50',
            'nib' => 'nullable|string|max:50',
            'siup' => 'nullable|string|max:50',
            'director_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_no' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
        ];
    }
}
