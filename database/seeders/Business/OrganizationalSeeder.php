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
        $jsonPath = base_path('data_json/tipe-kontrak.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        foreach ($jsonData['company_groups'] ?? [] as $group) {
            CompanyGroup::updateOrCreate(['code' => $group['code']], $group);
        }

        foreach ($jsonData['regions'] ?? [] as $region) {
            Region::updateOrCreate(['code' => $region['code']], $region);
        }

        foreach ($jsonData['companies'] ?? [] as $company) {
            $group = CompanyGroup::where('code', $company['company_group_code'])->first();
            $region = Region::where('code', $company['region_code'])->first();
            Company::updateOrCreate(['code' => $company['code']], [
                'name' => $company['name'],
                'company_group_id' => $group?->id,
                'region_id' => $region?->id,
                'is_active' => $company['is_active'] ?? true,
            ]);
        }
    }
}
