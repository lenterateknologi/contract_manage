<?php

namespace Database\Seeders\System;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'description' => 'Akses penuh ke seluruh sistem.'],
            ['name' => 'Admin', 'description' => 'Administrator sistem operasional.'],
            ['name' => 'Manager', 'description' => 'Penyetuju level departemen.'],
            ['name' => 'Director', 'description' => 'Penyetuju level direksi.'],
            ['name' => 'Reviewer', 'description' => 'Pemeriksa dokumen (Legal/Tax/Finance).'],
            ['name' => 'Staff', 'description' => 'Pengguna operasional (Inisiator).'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['name' => $role['name']], $role);
        }
    }
}
