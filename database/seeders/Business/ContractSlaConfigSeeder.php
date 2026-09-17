<?php

namespace Database\Seeders\Business;

use App\Models\ContractSlaConfig;
use App\Models\ContractType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContractSlaConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Kontrak
        $kontrakType = ContractType::where('name', 'Kontrak')
            ->orWhere('code', 'A-1')
            ->first();

        // 2. Non Kontrak
        $nonKontrakType = ContractType::where('name', 'Non Kontrak')
            ->orWhere('code', 'A-2')
            ->first();

        // 3. NDA
        $ndaType = ContractType::where('name', 'like', '%NDA%')
            ->orWhere('code', 'NDA')
            ->first();

        $seedConfigs = [
            // --- KONTRAK ---
            [
                'contract_type_id' => $kontrakType?->id,
                'name' => 'SLA Standard Kontrak',
                'topic' => 'all',
                'priority' => 'NORMAL',
                'sla_stages' => [
                    ['status' => 'draft', 'duration_hours' => 24],
                    ['status' => 'in_review', 'duration_hours' => 48],
                    ['status' => 'pending', 'duration_hours' => 48],
                ],
                'sla_total_hours' => 120,   // 5 Hari
                'sla_start_hour' => 8,      // 08:00 WIB
                'sla_cutoff_hour' => 16,    // 16:00 WIB
                'working_days' => ['1', '2', '3', '4', '5'], // Senin - Jumat
                'warning_threshold_percent' => 80,
                'is_active' => true,
            ],
            // --- NON KONTRAK ---
            [
                'contract_type_id' => $nonKontrakType?->id,
                'name' => 'SLA Standard Non-Kontrak',
                'topic' => 'all',
                'priority' => 'NORMAL',
                'sla_stages' => [
                    ['status' => 'draft', 'duration_hours' => 24],
                    ['status' => 'in_review', 'duration_hours' => 24],
                    ['status' => 'pending', 'duration_hours' => 24],
                ],
                'sla_total_hours' => 72,    // 3 Hari
                'sla_start_hour' => 8,      // 08:00 WIB
                'sla_cutoff_hour' => 16,    // 16:00 WIB
                'working_days' => ['1', '2', '3', '4', '5'], // Senin - Jumat
                'warning_threshold_percent' => 80,
                'is_active' => true,
            ],
            // --- NDA (Perjanjian Kerahasiaan) ---
            [
                'contract_type_id' => $ndaType?->id,
                'name' => 'SLA Standard Perjanjian Kerahasiaan (NDA)',
                'topic' => 'all',
                'priority' => 'NORMAL',
                'sla_stages' => [
                    ['status' => 'draft', 'duration_hours' => 24],
                    ['status' => 'in_review', 'duration_hours' => 24],
                ],
                'sla_total_hours' => 48,    // 2 Hari
                'sla_start_hour' => 8,      // 08:00 WIB
                'sla_cutoff_hour' => 16,    // 16:00 WIB
                'working_days' => ['1', '2', '3', '4', '5'], // Senin - Jumat
                'warning_threshold_percent' => 80,
                'is_active' => true,
            ],
        ];

        foreach ($seedConfigs as $config) {
            if (empty($config['contract_type_id'])) {
                continue;
            }

            ContractSlaConfig::updateOrCreate(
                [
                    'contract_type_id' => $config['contract_type_id'],
                    'topic' => $config['topic'],
                ],
                $config
            );
        }
    }
}
