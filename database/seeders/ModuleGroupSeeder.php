<?php

namespace Database\Seeders;

use App\Models\ModuleGroup;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModuleGroupSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        $groups = [
            'Dashboard',
            'Manajemen Kontrak',
            'Form Digital',
            'Konfigurasi Sistem',
        ];

        foreach ($groups as $index => $name) {
            ModuleGroup::updateOrCreate(
                ['name' => $name],
                [
                    'sequence' => $index,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]
            );
        }
    }
}
