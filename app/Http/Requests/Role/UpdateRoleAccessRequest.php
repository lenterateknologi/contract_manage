<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'accesses' => 'required|array',
            'accesses.*.module_id' => 'required|uuid|exists:m_modules,id',
            'accesses.*.can_read' => 'boolean',
            'accesses.*.can_create' => 'boolean',
            'accesses.*.can_update' => 'boolean',
            'accesses.*.can_delete' => 'boolean',
            'accesses.*.can_approve' => 'boolean',
            'accesses.*.can_bulk_approve' => 'boolean',
            'accesses.*.can_bulk_delete' => 'boolean',
        ];
    }
}
