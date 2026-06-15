<?php

namespace Database\Seeders\Business;

use App\Models\ContractType;
use Illuminate\Database\Seeder;

class ContractTypeSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = base_path('data_json/tipe-kontrak.json');
        if (! file_exists($jsonPath)) {
            return;
        }

        $jsonData = json_decode(file_get_contents($jsonPath), true);

        foreach ($jsonData['contract_types'] ?? [] as $type) {
            ContractType::updateOrCreate(['code' => $type['code']], [
                'name' => $type['name'],
                'description' => $type['description'] ?? null,
                'is_active' => $type['is_active'] ?? true,
            ]);
        }
    }
}
