<?php

namespace App\Http\Formatters;

use App\Models\User;

class UserFormatter
{
    /**
     * Format a User model (or object with user attributes) for API/Frontend responses.
     */
    public static function format(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        $attributes = $user->getAttributes();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'initials' => $user->initials ?? '',
            'role' => $user->role,
            'role_id' => array_key_exists('role_id', $attributes) ? $user->role_id : null,
            'department_id' => array_key_exists('division_id', $attributes) ? ($user->division_id ?? (array_key_exists('department_id', $attributes) ? $user->department_id : null)) : (array_key_exists('department_id', $attributes) ? $user->department_id : null),
            'division_id' => array_key_exists('division_id', $attributes) ? $user->division_id : null,
            'department_name' => $user->relationLoaded('department') ? $user->department?->name : null,
            'division_name' => $user->relationLoaded('division') ? $user->division?->name : null,
            'company_name' => $user->relationLoaded('company') ? $user->company?->name : null,
            'company_group_name' => $user->relationLoaded('company') && $user->company?->relationLoaded('companyGroup') ? $user->company?->companyGroup?->name : null,
            'region_name' => $user->relationLoaded('company') && $user->company?->relationLoaded('region') ? $user->company?->region?->name : null,
            'email' => array_key_exists('email', $attributes) ? $user->email : null,
            'is_used' => array_key_exists('is_used', $attributes) ? (bool) $user->is_used : true,
            'is_active' => array_key_exists('is_active', $attributes) ? (bool) $user->is_active : true,
        ];
    }
}
