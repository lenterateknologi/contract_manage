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

        $dept = $user->relationLoaded('department') ? $user->getRelation('department') : null;
        $deptAttrs = $dept ? $dept->getAttributes() : [];

        $comp = $user->relationLoaded('company') ? $user->getRelation('company') : null;
        $compAttrs = $comp ? $comp->getAttributes() : [];

        $div = $user->relationLoaded('division') ? $user->getRelation('division') : null;
        $divAttrs = $div ? $div->getAttributes() : [];

        $loc = $user->relationLoaded('location') ? $user->getRelation('location') : null;
        $locAttrs = $loc ? $loc->getAttributes() : [];

        return [
            'id' => $user->id,
            'name' => $attributes['name'] ?? null,
            'nik' => $attributes['nik'] ?? null,
            'jobtitle_name' => $attributes['jobtitle_name'] ?? null,
            'initials' => $user->initials ?? '',
            'role' => $user->role,
            'role_id' => $attributes['role_id'] ?? null,
            'department_id' => $attributes['division_id'] ?? ($attributes['department_id'] ?? null),
            'division_id' => $attributes['division_id'] ?? null,
            'department_name' => $deptAttrs['name'] ?? null,
            'division_name' => $divAttrs['name'] ?? null,
            'department' => $dept ? [
                'id' => $deptAttrs['id'] ?? null,
                'name' => $deptAttrs['name'] ?? null,
                'code' => $deptAttrs['code'] ?? null,
                'idorg_group' => $deptAttrs['idorg_group'] ?? null,
                'org_group_name' => $deptAttrs['org_group_name'] ?? null,
            ] : null,
            'organization_group_id' => $deptAttrs['idorg_group'] ?? null,
            'idorg_group' => $deptAttrs['idorg_group'] ?? ($attributes['idorg_group'] ?? null),
            'org_group_name' => $deptAttrs['org_group_name'] ?? ($attributes['org_name'] ?? null),
            'company_id' => $attributes['company_id'] ?? null,
            'company_name' => $compAttrs['name'] ?? null,
            'company_group_id' => $attributes['company_group_id'] ?? ($compAttrs['company_group_id'] ?? null),
            'company_group_name' => $comp && $comp->relationLoaded('companyGroup') && $comp->getRelation('companyGroup') ? ($comp->getRelation('companyGroup')->getAttributes()['name'] ?? null) : null,
            'region_id' => $attributes['region_id'] ?? ($compAttrs['region_id'] ?? null),
            'region_name' => $comp && $comp->relationLoaded('region') && $comp->getRelation('region') ? ($comp->getRelation('region')->getAttributes()['name'] ?? null) : null,
            'location_id' => $attributes['location_id'] ?? null,
            'idlocation' => $attributes['idlocation'] ?? null,
            'location_name' => $attributes['location_name'] ?? ($locAttrs['name'] ?? null),
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
