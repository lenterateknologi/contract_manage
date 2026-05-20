<?php

namespace Database\Seeders;

use App\Models\ContractType;
use Illuminate\Database\Seeder;

class ContractTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Perjanjian Kerja Sama (PKS)', 'code' => 'PKS', 'description' => 'Perjanjian umum antara dua pihak untuk kerja sama bisnis.'],
            ['name' => 'Perjanjian Jasa', 'code' => 'JASA', 'description' => 'Digunakan untuk layanan profesional (konsultan, IT, dll).'],
            ['name' => 'Perjanjian Pengadaan Barang', 'code' => 'PGB', 'description' => 'Untuk pembelian barang dari vendor (biasanya terkait PO/SPK).'],
            ['name' => 'Perjanjian Sewa', 'code' => 'SEWA', 'description' => 'Untuk penyewaan aset (gedung, kendaraan, alat, dll).'],
            ['name' => 'Perjanjian Kerahasiaan (NDA)', 'code' => 'NDA', 'description' => 'Untuk menjaga kerahasiaan informasi antar pihak.'],
            ['name' => 'Perjanjian Lisensi', 'code' => 'LISENSI', 'description' => 'Hak penggunaan produk, software, atau brand.'],
            ['name' => 'Perjanjian Distribusi', 'code' => 'DIST', 'description' => 'Mengatur distribusi produk oleh pihak ketiga.'],
            ['name' => 'Perjanjian Outsourcing', 'code' => 'OUTS', 'description' => 'Untuk penggunaan tenaga kerja pihak ketiga.'],
            ['name' => 'Perjanjian Joint Venture', 'code' => 'JV', 'description' => 'Kerja sama investasi antara dua pihak atau lebih.'],
            ['name' => 'Addendum / Perpanjangan Kontrak', 'code' => 'ADD', 'description' => 'Perubahan atau perpanjangan dari kontrak existing.'],
            ['name' => 'Perjanjian Internal (Intercompany)', 'code' => 'INTERNAL', 'description' => 'Perjanjian antar entitas dalam satu grup perusahaan.'],
            ['name' => 'Perjanjian Khusus (Custom)', 'code' => 'CUSTOM', 'description' => 'Tipe fleksibel untuk kebutuhan yang tidak masuk kategori di atas.'],
        ];

        foreach ($types as $t) {
            ContractType::withTrashed()->updateOrCreate(
                ['code' => $t['code']],
                array_merge($t, ['deleted_at' => null]),
            );
        }
    }
}
