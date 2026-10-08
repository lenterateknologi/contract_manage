<?php

namespace App\Http\Formatters;

use App\Models\Master\User;

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

        $manager = null;
        if ($withManager) {
            if ($user->relationLoaded('supervisor') && $user->spv_id && $user->supervisor) {
                $manager = self::format($user->supervisor, false);
            } elseif ($user->relationLoaded('reportingTo') && $user->idreporting_to && $user->reportingTo) {
                $manager = self::format($user->reportingTo, false);
            } elseif (! empty($user->reporting_to)) {
                $manager = [
                    'id' => null,
                    'name' => $user->reporting_to,
                    'initials' => '',
                    'role' => 'Atasan Langsung',
                    'email' => null,
                    'department_name' => null,
                    'division_name' => null,
                    'company_name' => null,
                ];
            }
        }

        $dept = $user->relationLoaded('department') ? $user->department : null;
        $comp = $user->relationLoaded('company') ? $user->company : null;
        $div = $user->relationLoaded('division') ? $user->division : null;
        $loc = $user->relationLoaded('location') ? $user->location : null;

        $deptAttrs = $dept ? $dept->getAttributes() : [];
        $userAttrs = $user->getAttributes();
        $compAttrs = $comp ? $comp->getAttributes() : [];

        return [
            'id' => $user->id,
            'name' => $userAttrs['name'] ?? null,
            'nik' => $userAttrs['nik'] ?? null,
            'jobtitle_name' => $userAttrs['jobtitle_name'] ?? null,
            'initials' => $userAttrs['initials'] ?? '',
            'role' => $userAttrs['role'] ?? ($user->relationLoaded('roleRelation') ? $user->roleRelation?->name : null),
            'role_id' => $userAttrs['role_id'] ?? null,
            'department_id' => $userAttrs['division_id'] ?? ($userAttrs['department_id'] ?? null),
            'division_id' => $userAttrs['division_id'] ?? null,
            'department_name' => $deptAttrs['name'] ?? null,
            'division_name' => $div?->name,
            'department' => $dept ? [
                'id' => $dept->id,
                'name' => $deptAttrs['name'] ?? null,
                'code' => $deptAttrs['code'] ?? null,
                'idorg_group' => $deptAttrs['idorg_group'] ?? null,
                'org_group_name' => $deptAttrs['org_group_name'] ?? null,
            ] : null,
            'organization_group_id' => $deptAttrs['idorg_group'] ?? null,
            'idorg_group' => $deptAttrs['idorg_group'] ?? ($userAttrs['idorg_group'] ?? null),
            'org_group_name' => $deptAttrs['org_group_name'] ?? ($userAttrs['org_name'] ?? null),
            'company_id' => $userAttrs['company_id'] ?? null,
            'company_name' => $compAttrs['name'] ?? null,
            'company_group_id' => $userAttrs['company_group_id'] ?? ($compAttrs['company_group_id'] ?? null),
            'company_group_name' => $comp?->relationLoaded('companyGroup') ? $comp->companyGroup?->name : null,
            'region_id' => $userAttrs['region_id'] ?? ($compAttrs['region_id'] ?? null),
            'region_name' => $comp?->relationLoaded('region') ? $comp->region?->name : null,
            'location_id' => $userAttrs['location_id'] ?? null,
            'idlocation' => $userAttrs['idlocation'] ?? null,
            'location_name' => $userAttrs['location_name'] ?? ($loc?->name ?? null),
            'email' => $userAttrs['email'] ?? null,
            'phone_number' => $userAttrs['phone_number'] ?? ($userAttrs['mobile_no'] ?? null),
            'mobile_no' => $userAttrs['mobile_no'] ?? null,
            'reporting_to' => $userAttrs['reporting_to'] ?? null,
            'manager' => $manager,
            'is_used' => (bool) ($userAttrs['is_used'] ?? true),
            'is_active' => (bool) ($userAttrs['is_active'] ?? true),
        ];
    }
}
