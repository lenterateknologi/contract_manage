<?php

namespace Database\Seeders\Business;

use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;
use Illuminate\Database\Seeder;

class OrganizationalSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Company Groups
        $groupPath = database_path('from_tiket/company_group.json');
        if (file_exists($groupPath)) {
            $groupJson = json_decode(file_get_contents($groupPath), true);
            $groups = null;
            foreach ($groupJson as $key => $value) {
                if (is_array($value)) {
                    $groups = $value;
                    break;
                }
            }
            if (! empty($groups)) {
                foreach ($groups as $g) {
                    CompanyGroup::updateOrCreate(
                        ['id' => $g['id']],
                        [
                            'code' => $g['code'],
                            'name' => $g['name'],
                            'description' => $g['description'] ?? null,
                            'is_active' => $g['is_active'] ?? true,
                        ]
                    );
                }
            }
        }

        // 2. Seed Regions
        $regionPath = database_path('from_tiket/region.json');
        if (file_exists($regionPath)) {
            $regionJson = json_decode(file_get_contents($regionPath), true);
            $regions = null;
            foreach ($regionJson as $key => $value) {
                if (is_array($value)) {
                    $regions = $value;
                    break;
                }
            }
            if (! empty($regions)) {
                foreach ($regions as $r) {
                    Region::updateOrCreate(
                        ['id' => $r['id']],
                        [
                            'code' => $r['code'],
                            'name' => $r['name'],
                            'alias' => $r['alias'] ?? null,
                            'is_active' => $r['is_active'] ?? true,
                        ]
                    );
                }
            }
        }

        // 3. Seed Companies
        $companyPath = database_path('from_tiket/company.json');
        if (file_exists($companyPath)) {
            $companyJson = json_decode(file_get_contents($companyPath), true);
            $companies = null;
            foreach ($companyJson as $key => $value) {
                if (is_array($value)) {
                    $companies = $value;
                    break;
                }
            }
            if (! empty($companies)) {
                foreach ($companies as $c) {
                    Company::updateOrCreate(
                        ['id' => $c['id']],
                        [
                            'code' => $c['code'],
                            'name' => $c['name'],
                            'address' => $c['address'] ?? null,
                            'company_group_id' => $c['company_group_id'] ?? null,
                            'region_id' => $c['region_id'] ?? null,
                            'is_active' => $c['is_active'] ?? true,
                        ]
                    );
                }
            }
        }
    }
}
