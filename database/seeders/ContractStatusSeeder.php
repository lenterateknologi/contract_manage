<?php

namespace Database\Seeders;

use App\Models\ContractStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class ContractStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        $jsonPath = base_path('data_json/tipe-kontrak.json');
        if (! file_exists($jsonPath)) {
            $this->command->warn('tipe-kontrak.json not found!');

            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $statuses = $data['contract_statuses'] ?? [];

        foreach ($statuses as $status) {
            ContractStatus::withTrashed()->updateOrCreate(
                ['code' => $status['code']],
                [
                    'label' => $status['label'],
                    'color' => $status['color'],
                    'bg_color' => $status['bg_color'],
                    'icon' => $status['icon'],
                    'description' => $status['description'],
                    'is_active' => filter_var($status['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                    'deleted_at' => null,
                ],
            );
        }
    }
}
