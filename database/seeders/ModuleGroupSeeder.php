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
            ['name' => 'Beranda',           'icon' => 'LayoutDashboard'],
            ['name' => 'Manajemen Kontrak', 'icon' => 'FileText'],
            ['name' => 'Desain Template',   'icon' => 'Library'],
            ['name' => 'Konfigurasi Alur',  'icon' => 'GitBranch'],
            ['name' => 'Data Master',       'icon' => 'Database'],
            ['name' => 'Sistem & Laporan',  'icon' => 'ShieldCheck'],
        ];

        $names = array_column($groups, 'name');

        foreach ($groups as $data) {
            $group = ModuleGroup::withTrashed()->where('name', $data['name'])->first();
            if ($group) {
                if ($group->trashed()) {
                    $group->restore();
                }
                $group->update([
                    'icon' => $data['icon'],
                    'updated_by' => $adminId,
                ]);
            } else {
                ModuleGroup::create([
                    'name' => $data['name'],
                    'icon' => $data['icon'],
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
            }
        }

        // Soft-delete removed groups
        ModuleGroup::whereNotIn('name', $names)->delete();
    }
}
