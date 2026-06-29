<?php

namespace Database\Seeders\Business;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $legalDept = Department::where('code', 'LGL')->first();
        $adminRole = Role::where('name', 'Admin')->first();
        $managerRole = Role::where('name', 'Manager')->first();
        $staffRole = Role::where('name', 'Staff')->first();

        User::updateOrCreate(['email' => 'admin@example.com'], [
            'name' => 'System Administrator',
            'password' => Hash::make('password'),
            'role_id' => $adminRole?->id,
            'department_id' => $legalDept?->id,
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'staff@example.com'], [
            'name' => 'Ahmad Staff',
            'password' => Hash::make('password'),
            'role_id' => $staffRole?->id,
            'department_id' => $legalDept?->id,
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'manager@example.com'], [
            'name' => 'Budi Manager',
            'password' => Hash::make('password'),
            'role_id' => $managerRole?->id,
            'department_id' => $legalDept?->id,
            'is_active' => true,
        ]);
    }
}
