<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrganizationalMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('SET session_replication_role = "replica";');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS = 0;');
        }

        Company::truncate();
        Region::truncate();
        CompanyGroup::truncate();

        if ($driver === 'pgsql') {
            DB::statement('SET session_replication_role = "origin";');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
        }

        $jsonPath = base_path('data_json/tipe-kontrak.json');
        if (! file_exists($jsonPath)) {
            $this->command->warn('tipe-kontrak.json not found!');

            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);

        // 1. Create Company Groups
        $groupsMap = [];
        $groupList = $data['company_groups'] ?? [];
        foreach ($groupList as $g) {
            $groupsMap[$g['code']] = CompanyGroup::create([
                'name' => $g['name'],
                'code' => $g['code'],
                'description' => $g['description'] ?? "Grup perusahaan {$g['name']}.",
                'is_active' => filter_var($g['is_active'], FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        // 2. Create Regions
        $regionsMap = [];
        $regionList = $data['regions'] ?? [];
        foreach ($regionList as $r) {
            $regionsMap[$r['code']] = Region::create([
                'name' => $r['name'],
                'code' => $r['code'],
                'alias' => $r['alias'] ?? null,
                'id_portal_master' => $r['id_portal_master'] ?? null,
                'description' => $r['description'] ?? "Wilayah {$r['name']}.",
                'is_active' => filter_var($r['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        // 3. Create Companies
        $companyList = $data['companies'] ?? [];
        foreach ($companyList as $c) {
            $groupId = isset($c['company_group_code']) && isset($groupsMap[$c['company_group_code']]) ? $groupsMap[$c['company_group_code']]->id : null;
            $regionId = isset($c['region_code']) && isset($regionsMap[$c['region_code']]) ? $regionsMap[$c['region_code']]->id : null;

            Company::create([
                'name' => $c['name'],
                'code' => $c['code'],
                'alias' => $c['alias'] ?? null,
                'address' => $c['address'] ?? null,
                'company_group_id' => $groupId,
                'region_id' => $regionId,
                'is_active' => filter_var($c['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        $this->command->info('Organizational Master Data seeded successfully from JSON!');
    }
}
