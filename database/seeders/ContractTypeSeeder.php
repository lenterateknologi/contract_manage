<?php

namespace Database\Seeders;

use App\Models\ContractType;
use Illuminate\Database\Seeder;

class ContractTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Sewa', 'description' => 'Perjanjian sewa menyewa properti atau aset.'],
            ['name' => 'Vendor', 'description' => 'Perjanjian pengadaan barang atau jasa dari pihak ketiga.'],
            ['name' => 'Kemitraan', 'description' => 'Perjanjian kolaborasi strategis antar entitas.'],
            ['name' => 'Jasa', 'description' => 'Perjanjian penyediaan layanan profesional.'],
        ];

        foreach ($types as $t) {
            ContractType::updateOrCreate(['name' => $t['name']], $t);
        }
    }
}
