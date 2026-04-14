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

        $groups = [
            'Dashboard',
            'Manajemen Kontrak',
            'Form Digital',
            'Konfigurasi Sistem',
        ];

        // Cleanup: Remove any groups not in our list to ensure a clean state
        ModuleGroup::whereNotIn('title', $groups)->delete();

        foreach ($groups as $index => $title) {
            ModuleGroup::updateOrCreate(
                ['title' => $title],
                [
                    'sort_number' => $index,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ]
            );
        }
    }
}
