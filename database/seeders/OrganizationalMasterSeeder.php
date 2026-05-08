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
        // PostgreSQL equivalent to disable foreign key checks
        DB::statement('SET session_replication_role = "replica";');
        
        Company::truncate();
        Region::truncate();
        CompanyGroup::truncate();
        
        DB::statement('SET session_replication_role = "origin";');

        // 1. Create Company Groups from provided list
        $groupList = [
            ['code' => 'EXT', 'name' => 'EXTERNAL'],
            ['code' => 'FNB', 'name' => 'FAJAR NIAGA BERJAYA'],
            ['code' => 'FPS', 'name' => 'FANGIONO PERKASA SEJATI'],
            ['code' => 'FAP', 'name' => 'FAP AGRI'],
            ['code' => 'FRG', 'name' => 'FIRST RESOURCES GROUP'],
            ['code' => 'HAM', 'name' => 'HARMONI AGRI MANDIRI'],
            ['code' => 'KAS', 'name' => 'KALIMANTAN AGRO SEJAHTERA'],
            ['code' => 'LKT', 'name' => 'LENTERA KREASI TEKNOLOGI'],
            ['code' => 'NON', 'name' => 'NON GROUP'],
            ['code' => 'NTG', 'name' => 'NUSANTARA TIMUR GROUP'],
            ['code' => 'PALMA', 'name' => 'PALM ASIA AGRI'],
        ];

        $groups = [];
        foreach ($groupList as $g) {
            $groups[$g['code']] = CompanyGroup::create([
                'name' => $g['name'],
                'code' => $g['code'],
                'description' => "Grup perusahaan {$g['name']}.",
                'is_active' => true,
            ]);
        }

        // 2. Create Regions from provided list
        $lktGroup = $groups['LKT'];
        
        $regionList = [
            ['code' => '03', 'alias' => 'BPN', 'id_portal_master' => '14', 'name' => 'KALIMANTAN TIMUR'],
            ['code' => '05', 'alias' => 'JKT', 'id_portal_master' => '16', 'name' => 'JAKARTA'],
            ['code' => '06', 'alias' => 'MRK', 'id_portal_master' => '17', 'name' => 'MERAUKE'],
            ['code' => '04', 'alias' => 'NNK', 'id_portal_master' => '15', 'name' => 'KALIMANTAN UTARA'],
            ['code' => '01', 'alias' => 'PKU', 'id_portal_master' => '12', 'name' => 'RIAU'],
            ['code' => '02', 'alias' => 'PTK', 'id_portal_master' => '13', 'name' => 'KALIMANTAN BARAT'],
        ];
        
        foreach ($regionList as $r) {
            $region = Region::create([
                'name' => $r['name'],
                'code' => "REG-{$r['code']}", // Adding prefix to keep code unique/structured
                'alias' => $r['alias'],
                'id_portal_master' => $r['id_portal_master'],
                'description' => "Wilayah {$r['name']}.",
                'is_active' => true,
            ]);

            // 3. Create Dummy Companies for each Region (Linking to both LKT Group and the Region)
            $companyNames = [
                "PT. {$r['alias']} JAYA ABADI",
                "PT. {$r['alias']} SUMBER MAKMUR",
                "PT. {$r['alias']} LESTARI"
            ];

            foreach ($companyNames as $index => $name) {
                Company::create([
                    'name' => $name,
                    'code' => "{$r['alias']}-" . ($index + 1),
                    'alias' => $r['alias'] . " " . ($index + 1),
                    'address' => "Alamat dummy di {$r['name']}",
                    'company_group_id' => $lktGroup->id,
                    'region_id' => $region->id,
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('Organizational Master Data seeded successfully with provided regions and dummy companies!');
    }
}
