<?php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->role === 'Admin' || $this->user()->role === 'Super Admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->route('user');
        $userId = $user instanceof User ? $user->id : $user;

        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:m_users,email,'.$userId,
            'username' => 'required|string|max:20|unique:m_users,username,'.$userId,
            'role' => 'required|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'department_id' => 'nullable|uuid|exists:m_departments,id',
            'company_id' => 'nullable|uuid|exists:m_companies,id',
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8',
        ];
    }
}
