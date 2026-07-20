<?php

namespace App\Http\Requests\Module;

use Illuminate\Foundation\Http\FormRequest;

class StoreModuleGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:m_module_groups,name',
            'icon' => 'nullable|string|max:50',
            'role_id' => 'nullable|exists:m_roles,id',
        ];
    }
}
