<?php

namespace Database\Seeders;

use App\Models\ContractType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContractTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Perjanjian Kerja Sama (PKS)', 'code' => 'PKS', 'description' => 'Perjanjian umum antara dua pihak untuk kerja sama bisnis.', 'type' => 'f1'],
            ['name' => 'Perjanjian Jasa', 'code' => 'JASA', 'description' => 'Digunakan untuk layanan profesional (konsultan, IT, dll).', 'type' => 'f1'],
            ['name' => 'Perjanjian Pengadaan Barang', 'code' => 'PGB', 'description' => 'Untuk pembelian barang dari vendor (biasanya terkait PO/SPK).', 'type' => 'f1'],
            ['name' => 'Perjanjian Sewa', 'code' => 'SEWA', 'description' => 'Untuk penyewaan aset (gedung, kendaraan, alat, dll).', 'type' => 'f1'],
            ['name' => 'Perjanjian Kerahasiaan (NDA)', 'code' => 'NDA', 'description' => 'Untuk menjaga kerahasiaan informasi antar pihak.', 'type' => 'f1'],
            ['name' => 'Perjanjian Lisensi', 'code' => 'LISENSI', 'description' => 'Hak penggunaan produk, software, atau brand.', 'type' => 'f1'],
            ['name' => 'Perjanjian Distribusi', 'code' => 'DIST', 'description' => 'Mengatur distribusi produk oleh pihak ketiga.', 'type' => 'f1'],
            ['name' => 'Perjanjian Outsourcing', 'code' => 'OUTS', 'description' => 'Untuk penggunaan tenaga kerja pihak ketiga.', 'type' => 'f1'],
            ['name' => 'Perjanjian Joint Venture', 'code' => 'JV', 'description' => 'Kerja sama investasi antara dua pihak atau lebih.', 'type' => 'f1'],
            ['name' => 'Addendum / Perpanjangan Kontrak', 'code' => 'ADD', 'description' => 'Perubahan atau perpanjangan dari kontrak existing.', 'type' => 'f1'],
            ['name' => 'Perjanjian Internal (Intercompany)', 'code' => 'INTERNAL', 'description' => 'Perjanjian antar entitas dalam satu grup perusahaan.', 'type' => 'f1'],
            ['name' => 'Perjanjian Khusus (Custom)', 'code' => 'CUSTOM', 'description' => 'Tipe fleksibel untuk kebutuhan yang tidak masuk kategori di atas.', 'type' => 'f1'],
        ];

        foreach ($types as $t) {
            ContractType::updateOrCreate(['code' => $t['code']], $t);
        }
    }
}
