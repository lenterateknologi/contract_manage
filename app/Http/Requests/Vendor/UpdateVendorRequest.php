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
            'code'         => 'required|string|max:50|unique:m_vendors,code,'.$vendorId,
            'name'         => 'required|string|max:255',
            'email'        => 'nullable|email|max:255',
            'phone'        => 'nullable|string|max:50',
            'address'      => 'nullable|string',
            'company_type' => 'nullable|string|max:100',
            'pic_name'     => 'nullable|string|max:255',
            'npwp'         => 'nullable|string|max:50',
            'is_active'    => 'boolean',
        ];
    }
}
