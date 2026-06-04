<?php

namespace App\Http\Requests\Region;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRegionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $regionId = $this->route('region')->id;

        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:m_regions,code,'.$regionId,
            'alias' => 'nullable|string|max:50',
            'id_portal_master' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ];
    }
}
