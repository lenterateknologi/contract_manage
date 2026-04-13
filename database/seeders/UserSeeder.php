<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad@example.com',
                'password' => Hash::make('password'),
                'initials' => 'AF',
                'role' => 'Initiator',
                'bg_color' => '#ede9fe',
                'text_color' => '#5b21b6',
                'username' => '1000000000000001',
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'password' => Hash::make('password'),
                'initials' => 'BS',
                'role' => 'Legal',
                'bg_color' => '#e0f2fe',
                'text_color' => '#0369a1',
                'username' => '1000000000000002',
            ],
            [
                'name' => 'Citra Dewi',
                'email' => 'citra@example.com',
                'password' => Hash::make('password'),
                'initials' => 'CD',
                'role' => 'Tax',
                'bg_color' => '#fef9c3',
                'text_color' => '#854d0e',
                'username' => '1000000000000003',
            ],
            [
                'name' => 'Dian Rahayu',
                'email' => 'dian@example.com',
                'password' => Hash::make('password'),
                'initials' => 'DR',
                'role' => 'Management',
                'bg_color' => '#dbeafe',
                'text_color' => '#1d4ed8',
                'username' => '1000000000000004',
            ],
            [
                'name' => 'Eko Prasetyo',
                'email' => 'eko@example.com',
                'password' => Hash::make('password'),
                'initials' => 'EP',
                'role' => 'Direksi',
                'bg_color' => '#dcfce7',
                'text_color' => '#166534',
                'username' => '1000000000000005',
            ],
            [
                'name' => 'Fajar Vendor',
                'email' => 'vendor@example.com',
                'password' => Hash::make('password'),
                'initials' => 'FV',
                'role' => 'Vendor',
                'bg_color' => '#ffedd5',
                'text_color' => '#9a3412',
                'username' => '1000000000000006',
            ],
            [
                'name' => 'Super Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'initials' => 'SA',
                'role' => 'Admin',
                'bg_color' => '#fee2e2',
                'text_color' => '#991b1b',
                'username' => '1000000000000007',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['email' => $user['email']], $user);
        }

        // Seed 50 more random users
        $roles = ['Initiator', 'Legal', 'Tax', 'Management', 'Direksi', 'Vendor'];
        for ($i = 1; $i <= 50; $i++) {
            $role = $roles[array_rand($roles)];
            $name = fake()->name();
            $initials = collect(explode(' ', $name))->map(fn ($n) => strtoupper(substr($n, 0, 1)))->take(2)->join('');

            User::create([
                'name' => $name,
                'email' => "user{$i}_".fake()->unique()->safeEmail(),
                'username' => '2000'.str_pad($i, 12, '0', STR_PAD_LEFT),
                'password' => Hash::make('password'),
                'role' => $role,
                'initials' => $initials,
                'bg_color' => fake()->hexColor(),
                'text_color' => '#ffffff',
            ]);
        }
    }
}
