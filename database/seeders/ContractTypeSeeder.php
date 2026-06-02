<?php

namespace Database\Seeders;

use App\Models\ContractType;
use Illuminate\Database\Seeder;

class ContractTypeSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = base_path('data_json/tipe-kontrak.json');
        if (! file_exists($jsonPath)) {
            $this->command->warn('tipe-kontrak.json not found!');

            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $types = $data['contract_types'] ?? [];

        foreach ($types as $t) {
            ContractType::withTrashed()->updateOrCreate(
                ['code' => $t['code']],
                [
                    'name' => $t['name'],
                    'description' => $t['description'] ?? "Tipe kontrak {$t['name']}",
                    'deleted_at' => null,
                ],
            );
        }

        // Ensure A1 workflow is set on contract types later in A1WorkflowSeeder
    }
}
