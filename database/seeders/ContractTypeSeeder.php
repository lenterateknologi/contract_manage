<?php

namespace Database\Seeders;

use App\Models\ContractType;
use Illuminate\Database\Seeder;

class ContractTypeSeeder extends Seeder
{
    public function run(): void
    {
        // Mapping of old names to new professional names for integrity
        $mapping = [
            'Sewa' => 'Perjanjian Sewa',
            'Vendor' => 'Perjanjian Pengadaan Barang',
            'Kemitraan' => 'Perjanjian Kerja Sama (PKS)',
            'Jasa' => 'Perjanjian Jasa',
        ];

        foreach ($mapping as $oldName => $newName) {
            ContractType::where('name', $oldName)->update(['name' => $newName]);
        }

        $types = [
            ['name' => 'Perjanjian Kerja Sama (PKS)', 'description' => 'Perjanjian umum antara dua pihak untuk kerja sama bisnis.', 'type' => 'f1'],
            ['name' => 'Perjanjian Jasa', 'description' => 'Digunakan untuk layanan profesional (konsultan, IT, dll).', 'type' => 'f1'],
            ['name' => 'Perjanjian Pengadaan Barang', 'description' => 'Untuk pembelian barang dari vendor (biasanya terkait PO/SPK).', 'type' => 'f1'],
            ['name' => 'Perjanjian Sewa', 'description' => 'Untuk penyewaan aset (gedung, kendaraan, alat, dll).', 'type' => 'f1'],
            ['name' => 'Perjanjian Kerahasiaan (NDA)', 'description' => 'Untuk menjaga kerahasiaan informasi antar pihak.', 'type' => 'f1'],
            ['name' => 'Perjanjian Lisensi', 'description' => 'Hak penggunaan produk, software, atau brand.', 'type' => 'f1'],
            ['name' => 'Perjanjian Distribusi', 'description' => 'Mengatur distribusi produk oleh pihak ketiga.', 'type' => 'f1'],
            ['name' => 'Perjanjian Outsourcing', 'description' => 'Untuk penggunaan tenaga kerja pihak ketiga.', 'type' => 'f1'],
            ['name' => 'Perjanjian Joint Venture', 'description' => 'Kerja sama investasi antara dua pihak atau lebih.', 'type' => 'f1'],
            ['name' => 'Addendum / Perpanjangan Kontrak', 'description' => 'Perubahan atau perpanjangan dari kontrak existing.', 'type' => 'f1'],
            ['name' => 'Perjanjian Internal (Intercompany)', 'description' => 'Perjanjian antar entitas dalam satu grup perusahaan.', 'type' => 'f1'],
            ['name' => 'Perjanjian Khusus (Custom)', 'description' => 'Tipe fleksibel untuk kebutuhan yang tidak masuk kategori di atas.', 'type' => 'f1'],
        ];

        foreach ($types as $t) {
            ContractType::updateOrCreate(['name' => $t['name']], $t);
        }
    }
}
