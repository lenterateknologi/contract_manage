<?php

namespace App\Http\Requests\Module;

use Illuminate\Foundation\Http\FormRequest;

class StoreModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:m_modules,name',
            'identifier' => 'required|string|max:50|unique:m_modules,identifier',
            'module_group_id' => 'required|uuid|exists:m_module_groups,id',
            'route' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'showed_as_menu' => 'boolean',
            'description' => 'nullable|string',
            'role_id' => 'nullable|uuid|exists:m_roles,id',
        ];
    }
}
