<?php

namespace App\Http\Requests\Module;

use Illuminate\Foundation\Http\FormRequest;

class UpdateModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:m_modules,name,'.$this->route('module')->id,
            'identifier' => 'required|string|max:50|unique:m_modules,identifier,'.$this->route('module')->id,
            'module_group_id' => 'required|uuid|exists:m_module_groups,id',
            'route' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'showed_as_menu' => 'boolean',
            'description' => 'nullable|string',
        ];
    }
}
