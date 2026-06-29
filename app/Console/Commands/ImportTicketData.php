<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;
use App\Models\Region;
use App\Models\CompanyGroup;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class ImportTicketData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-ticket-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import Region, CompanyGroup, and Company data from from_tiket JSON files';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting data import from database/from_tiket...');
        
        Model::unguard();
        Schema::disableForeignKeyConstraints();

        $this->info('Clearing old data and resetting foreign keys...');
        User::where('email', '!=', 'admin@example.com')->forceDelete();
        User::query()->update([
            'company_id' => null,
            'company_group_id' => null,
            'region_id' => null,
        ]);
        
        Company::query()->forceDelete();
        CompanyGroup::query()->forceDelete();
        Region::query()->forceDelete();

        // 1. Import Regions
        $this->info('Importing Regions...');
        $regionJson = file_get_contents(database_path('from_tiket/region.json'));
        $regionData = json_decode($regionJson, true);
        $regions = $this->extractArray($regionData);
        
        $regionCount = 0;
        foreach ($regions as $item) {
            Region::create([
                'id' => $item['id'],
                'code' => $item['code'] ?? null,
                'alias' => $item['alias'] ?? null,
                'name' => $item['name'] ?? null,
                'id_portal_master' => isset($item['id_portal_master']) ? (string)$item['id_portal_master'] : null,
                'is_active' => $item['is_active'] ?? true,
                'created_at' => $this->parseDate($item['created_at'] ?? null),
                'updated_at' => $this->parseDate($item['updated_at'] ?? null),
            ]);
            $regionCount++;
        }
        $this->info("Imported $regionCount regions.");

        // 2. Import Company Groups
        $this->info('Importing Company Groups...');
        $groupJson = file_get_contents(database_path('from_tiket/company_group.json'));
        $groupData = json_decode($groupJson, true);
        $groups = $this->extractArray($groupData);
        
        $groupCount = 0;
        foreach ($groups as $item) {
            CompanyGroup::create([
                'id' => $item['id'],
                'code' => $item['code'] ?? null,
                'name' => $item['name'] ?? null,
                'is_active' => $item['is_active'] ?? true,
                'created_at' => $this->parseDate($item['created_at'] ?? null),
                'updated_at' => $this->parseDate($item['updated_at'] ?? null),
            ]);
            $groupCount++;
        }
        $this->info("Imported $groupCount company groups.");

        // 3. Import Companies
        $this->info('Importing Companies...');
        $companyJson = file_get_contents(database_path('from_tiket/company.json'));
        $companyData = json_decode($companyJson, true);
        $companies = $this->extractArray($companyData);
        
        $companyCount = 0;
        foreach ($companies as $item) {
            Company::create([
                'id' => $item['id'],
                'code' => $item['code'] ?? null,
                'alias' => $item['alias'] ?? null,
                'name' => $item['name'] ?? null,
                'address' => $item['address'] ?? null,
                'company_group_id' => $item['company_group_id'] ?? null,
                'region_id' => $item['region_id'] ?? null,
                'is_active' => $item['is_active'] ?? true,
                'created_at' => $this->parseDate($item['created_at'] ?? null),
                'updated_at' => $this->parseDate($item['updated_at'] ?? null),
            ]);
            $companyCount++;
        }
        $this->info("Imported $companyCount companies.");

        // 4. Import Users
        $this->info('Importing Users...');
        $userJson = file_get_contents(database_path('from_tiket/user helpdesk.json'));
        $userData = json_decode($userJson, true);
        $users = $this->extractArray($userData);
        
        $validDepartments = array_flip(DB::table('m_departments')->pluck('id')->toArray());
        $validRoles = array_flip(DB::table('m_roles')->pluck('id')->toArray());

        $seenEmails = [];
        $userCount = 0;
        foreach ($users as $item) {
            // Ignore system admin if it happens to be in the json to avoid conflicts
            if (($item['email'] ?? '') === 'admin@example.com') {
                continue;
            }

            $email = filter_var($item['email'] ?? '', FILTER_VALIDATE_EMAIL) ? $item['email'] : '-';

            User::create([
                'id' => $item['id'],
                'username' => empty($item['username']) ? null : $item['username'],
                'code' => empty($item['code']) ? null : $item['code'],
                'name' => $item['name'] ?? null,
                'email' => $email,
                'password' => $item['password'] ?? null,
                'phone_number' => $item['phone_number'] ?? null,
                'company_id' => $item['company_id'] ?? null,
                'company_group_id' => $item['company_group_id'] ?? null,
                'department_id' => isset($validDepartments[$item['department_id'] ?? '']) ? $item['department_id'] : null,
                'division_id' => $item['division_id'] ?? null,
                'role_id' => isset($validRoles[$item['role_id'] ?? '']) ? $item['role_id'] : null,
                'is_active' => $item['is_active'] ?? true,
                'is_employee' => true,
                'created_at' => $this->parseDate($item['created_at'] ?? null),
                'updated_at' => $this->parseDate($item['updated_at'] ?? null),
            ]);
            $userCount++;
        }
        $this->info("Imported $userCount users.");

        Model::reguard();
        Schema::enableForeignKeyConstraints();
        
        $this->info('Data import completed successfully!');
    }

    private function extractArray($data)
    {
        if (is_array($data)) {
            // Because the keys are weird (e.g. "\nselect * from m_region "), we just grab the first array value
            foreach ($data as $key => $value) {
                if (is_array($value)) {
                    return $value;
                }
            }
        }
        return [];
    }

    private function parseDate($dateStr)
    {
        if (!$dateStr) return now();
        return date('Y-m-d H:i:s', strtotime($dateStr));
    }
}
