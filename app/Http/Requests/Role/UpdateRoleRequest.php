<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role')->id;

        return [
            'name' => 'required|string|max:255|unique:m_roles,name,'.$roleId,
            'description' => 'nullable|string',
        ];
    }
}
