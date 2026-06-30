<?php

namespace Database\Seeders\Business;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('name', 'Admin')->first();

        User::updateOrCreate(['email' => 'admin@example.com'], [
            'name' => 'System Administrator',
            'password' => Hash::make('password'),
            'role_id' => $adminRole?->id,
            'is_active' => true,
        ]);
    }
}
