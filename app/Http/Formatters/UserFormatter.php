<?php

namespace App\Http\Formatters;

use App\Models\User;

class UserFormatter
{
    /**
     * Format a User model (or object with user attributes) for API/Frontend responses.
     */
    public static function format(?User $user, bool $withManager = true): ?array
    {
        if (! $user) {
            return null;
        }

        $attributes = $user->getAttributes();

        $manager = null;
        if ($withManager) {
            if ($user->relationLoaded('supervisor') && array_key_exists('spv_id', $attributes) && $user->getRelation('supervisor')) {
                $manager = self::format($user->getRelation('supervisor'), false);
            } elseif ($user->relationLoaded('reportingTo') && array_key_exists('idreporting_to', $attributes) && $user->getRelation('reportingTo')) {
                $manager = self::format($user->getRelation('reportingTo'), false);
            } elseif (! empty($attributes['reporting_to'])) {
                $manager = [
                    'id' => null,
                    'name' => $attributes['reporting_to'],
                    'initials' => '',
                    'role' => 'Atasan Langsung',
                    'email' => null,
                    'department_name' => null,
                    'division_name' => null,
                    'company_name' => null,
                ];
            }
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'nik' => $attributes['nik'] ?? null,
            'jobtitle_name' => $attributes['jobtitle_name'] ?? null,
            'initials' => $user->initials ?? '',
            'role' => $user->role,
            'role_id' => $attributes['role_id'] ?? null,
            'department_id' => $attributes['division_id'] ?? ($attributes['department_id'] ?? null),
            'division_id' => $attributes['division_id'] ?? null,
            'department_name' => $user->relationLoaded('department') ? $user->department?->name : null,
            'division_name' => $user->relationLoaded('division') ? $user->division?->name : null,
            'company_id' => $attributes['company_id'] ?? null,
            'company_name' => $user->relationLoaded('company') ? $user->company?->name : null,
            'company_group_id' => $attributes['company_group_id'] ?? ($user->relationLoaded('company') ? $user->company?->company_group_id : null),
            'company_group_name' => $user->relationLoaded('company') && $user->company?->relationLoaded('companyGroup') ? $user->company?->companyGroup?->name : null,
            'region_id' => $attributes['region_id'] ?? ($user->relationLoaded('company') ? $user->company?->region_id : null),
            'region_name' => $user->relationLoaded('company') && $user->company?->relationLoaded('region') ? $user->company?->region?->name : null,
            'location_id' => $attributes['location_id'] ?? null,
            'idlocation' => $attributes['idlocation'] ?? null,
            'location_name' => $attributes['location_name'] ?? ($user->relationLoaded('location') ? $user->location?->name : null),
            'email' => $attributes['email'] ?? null,
            'phone_number' => $attributes['phone_number'] ?? ($attributes['mobile_no'] ?? null),
            'mobile_no' => $attributes['mobile_no'] ?? null,
            'reporting_to' => $attributes['reporting_to'] ?? null,
            'manager' => $manager,
            'is_used' => isset($attributes['is_used']) ? (bool) $attributes['is_used'] : true,
            'is_active' => isset($attributes['is_active']) ? (bool) $attributes['is_active'] : true,
        ];
    }
}
