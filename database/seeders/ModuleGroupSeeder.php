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
            'Template Library',
            'Workflow Engine',
            'Master Data',
            'System & Security',
        ];

        foreach ($groups as $index => $name) {
            $group = ModuleGroup::withTrashed()->where('name', $name)->first();
            if ($group) {
                if ($group->trashed()) $group->restore();
                $group->update([
                    'sequence' => $index,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
            } else {
                ModuleGroup::create([
                    'name' => $name,
                    'sequence' => $index,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
            }
        }

        // Clean up removed groups
        ModuleGroup::whereNotIn('name', $groups)->delete();
    }
}
