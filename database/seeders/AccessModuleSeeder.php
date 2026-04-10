<?php

namespace Database\Seeders;

use App\Models\AccessModule;
use App\Models\Module;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AccessModuleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $roles = Role::all();
        $modules = Module::all();

        foreach ($roles as $role) {
            foreach ($modules as $module) {
                if ($module->title === 'Audit Trail' && $role->name !== 'Admin') {
                    continue;
                }

                if (str_starts_with($module->url, '/admin') && $role->name !== 'Admin') {
                    continue;
                }

                \Illuminate\Support\Facades\DB::table('access_modules')->updateOrInsert(
                    [
                        'role_id' => $role->id,
                        'module_id' => $module->id,
                    ],
                    [
                        'can_read' => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'created_by' => $admin->id,
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
