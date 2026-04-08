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
                'name'       => 'Ahmad Fauzi',
                'email'      => 'ahmad@example.com',
                'password'   => Hash::make('password'),
                'initials'   => 'AF',
                'role'       => 'Initiator',
                'bg_color'   => '#ede9fe',
                'text_color' => '#5b21b6',
            ],
            [
                'name'       => 'Budi Santoso',
                'email'      => 'budi@example.com',
                'password'   => Hash::make('password'),
                'initials'   => 'BS',
                'role'       => 'Legal',
                'bg_color'   => '#e0f2fe',
                'text_color' => '#0369a1',
            ],
            [
                'name'       => 'Citra Dewi',
                'email'      => 'citra@example.com',
                'password'   => Hash::make('password'),
                'initials'   => 'CD',
                'role'       => 'Tax',
                'bg_color'   => '#fef9c3',
                'text_color' => '#854d0e',
            ],
            [
                'name'       => 'Dian Rahayu',
                'email'      => 'dian@example.com',
                'password'   => Hash::make('password'),
                'initials'   => 'DR',
                'role'       => 'Management',
                'bg_color'   => '#dbeafe',
                'text_color' => '#1d4ed8',
            ],
            [
                'name'       => 'Eko Prasetyo',
                'email'      => 'eko@example.com',
                'password'   => Hash::make('password'),
                'initials'   => 'EP',
                'role'       => 'Direksi',
                'bg_color'   => '#dcfce7',
                'text_color' => '#166534',
            ],
            [
                'name'       => 'Fajar Vendor',
                'email'      => 'vendor@example.com',
                'password'   => Hash::make('password'),
                'initials'   => 'FV',
                'role'       => 'Vendor',
                'bg_color'   => '#ffedd5',
                'text_color' => '#9a3412',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['email' => $user['email']], $user);
        }
    }
}
