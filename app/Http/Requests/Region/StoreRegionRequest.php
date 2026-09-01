<?php

namespace App\Http\Requests\Region;

use Illuminate\Foundation\Http\FormRequest;

class StoreRegionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_regions,code',
            'alias' => 'nullable|string|max:50',
            'region_ad' => 'nullable|string|max:100',
            'is_used' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ];
    }
}
