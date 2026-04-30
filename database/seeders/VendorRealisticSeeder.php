<?php

namespace Database\Seeders;

use App\Models\Vendor;
use App\Models\VendorDocument;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Carbon\Carbon;

class VendorRealisticSeeder extends Seeder
{
    public function run(): void
    {
        $admin = \App\Models\User::firstWhere('email', 'admin@example.com') ?? \App\Models\User::first();
        $adminId = $admin ? $admin->id : null;

        // Bersihkan data vendor eksisting jika diperlukan
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        Vendor::truncate();
        VendorDocument::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        $vendors = [
            [
                'code' => 'VND-2026-001',
                'name' => 'PT Integra Konstruksi Nusantara',
                'company_type' => 'PT',
                'is_individual' => false,
                'category' => 'CONTRACTOR',
                'email' => 'contact@integrakonstruksi.co.id',
                'phone' => '021-88997766',
                'address' => 'Gedung Menara Mulia Lt. 15, Jl. Jend. Gatot Subroto Kav. 9-11, Jakarta Selatan, 12930',
                'website' => 'www.integrakonstruksi.co.id',
                'pic_name' => 'Budi Santoso',
                'pic_position' => 'Senior Technical Director',
                'director_name' => 'Handoko Wijaya',
                'npwp' => '01.234.567.8-011.000',
                'nib' => '8120001829031',
                'siup' => '503/123/SIUP-B/2026',
                'bank_name' => 'Bank Mandiri',
                'bank_account_no' => '122-00-1234567-8',
                'bank_account_name' => 'PT Integra Konstruksi Nusantara',
                'is_active' => true,
                'docs' => [
                    ['type' => 'NPWP', 'name' => 'SKT & NPWP PKP Perusahaan'],
                    ['type' => 'NIB', 'name' => 'NIB OSS Terintegrasi'],
                    ['type' => 'SIUP', 'name' => 'Izin Usaha Sektoral'],
                    ['type' => 'AKTA_PENDIRIAN', 'name' => 'Akta Pendirian PT Integra'],
                ]
            ],
            [
                'code' => 'VND-2026-002',
                'name' => 'CV Mitra Katering Bersama',
                'company_type' => 'CV',
                'is_individual' => false,
                'category' => 'SUPPLIER',
                'email' => 'admin@mitrakatering.com',
                'phone' => '022-7788990',
                'address' => 'Jl. Soekarno Hatta No. 415, Buahbatu, Kota Bandung, Jawa Barat, 40286',
                'website' => 'www.mitrakatering.com',
                'pic_name' => 'Sari Indah',
                'pic_position' => 'Chief Operations Officer',
                'director_name' => 'Ahmad Faisal',
                'npwp' => '02.456.789.1-423.000',
                'nib' => '9120349182390',
                'siup' => '503/456/SIUP-K/2025',
                'bank_name' => 'Bank BCA',
                'bank_account_no' => '4321098765',
                'bank_account_name' => 'CV Mitra Katering Bersama',
                'is_active' => true,
                'docs' => [
                    ['type' => 'AKTA_PENDIRIAN', 'name' => 'Akta Pembentukan CV'],
                    ['type' => 'NIB', 'name' => 'NIB OSS CV Mitra Katering'],
                ]
            ],
            [
                'code' => 'VND-2026-003',
                'name' => 'PT Solusi Informatika Global',
                'company_type' => 'PT',
                'is_individual' => false,
                'category' => 'IT SERVICES',
                'email' => 'hello@solusi-ig.co.id',
                'phone' => '021-55661122',
                'address' => 'Cyber 2 Tower, Jl. H. R. Rasuna Said Blok X-5, Kuningan, Kota Jakarta Selatan, 12950',
                'website' => 'www.solusi-ig.co.id',
                'pic_name' => 'Rina Melati',
                'pic_position' => 'VP of Enterprise Solutions',
                'director_name' => 'Kevin Sanjaya',
                'npwp' => '31.255.456.9-012.000',
                'nib' => '8210986754321',
                'siup' => '120/SIUP/KOMINFO/2026',
                'bank_name' => 'Bank BNI',
                'bank_account_no' => '0219830571',
                'bank_account_name' => 'PT Solusi Informatika Global',
                'is_active' => true,
                'docs' => [
                    ['type' => 'AKTA_PENDIRIAN', 'name' => 'Akta Pendirian PT SIG'],
                    ['type' => 'AKTA_PERUBAHAN', 'name' => 'Akta Perubahan Pengurus Terakhir'],
                    ['type' => 'NPWP', 'name' => 'Sertifikat PKP Elektronik'],
                ]
            ],
            [
                'code' => 'VND-2026-004',
                'name' => 'Agus Pratama (Konsultan Independen)',
                'company_type' => 'INDIVIDU',
                'is_individual' => true,
                'category' => 'CONSULTANT',
                'email' => 'agus.pratama@consultant.id',
                'phone' => '081234567890',
                'address' => 'Jl. Kemang Raya No. 12, Pela Mampang, Mampang Prapatan, Jakarta Selatan, 12730',
                'website' => 'www.agusconsulting.id',
                'pic_name' => 'Agus Pratama',
                'pic_position' => 'Principal Consultant',
                'director_name' => 'Agus Pratama',
                'npwp' => '72.123.456.7-014.000',
                'nib' => '-',
                'siup' => '-',
                'bank_name' => 'Bank BRI',
                'bank_account_no' => '034101002345678',
                'bank_account_name' => 'Agus Pratama',
                'is_active' => true,
                'docs' => [
                    ['type' => 'KTP_DIREKTUR', 'name' => 'KTP Agus Pratama'],
                    ['type' => 'NPWP', 'name' => 'NPWP Pribadi'],
                ]
            ],
            [
                'code' => 'VND-2026-005',
                'name' => 'PT Mega Logistic Sentosa',
                'company_type' => 'PT',
                'is_individual' => false,
                'category' => 'LOGISTICS',
                'email' => 'operations@megalogistic.com',
                'phone' => '031-2345678',
                'address' => 'Jl. Perak Timur No. 512, Pabean Cantian, Kota Surabaya, Jawa Timur, 60165',
                'website' => 'www.megalogistic.com',
                'pic_name' => 'Deni Setiawan',
                'pic_position' => 'Head of Fleet Operations',
                'director_name' => 'Rahmat Yulianto',
                'npwp' => '03.882.119.5-606.000',
                'nib' => '1293847563829',
                'siup' => '503/889/SIUP-B/SBY/2026',
                'bank_name' => 'Bank Danamon',
                'bank_account_no' => '3344556677',
                'bank_account_name' => 'PT Mega Logistic Sentosa',
                'is_active' => true,
                'docs' => [
                    ['type' => 'AKTA_PENDIRIAN', 'name' => 'Akta Pendirian MLS'],
                ]
            ]
        ];

        foreach ($vendors as $vendorData) {
            $docs = $vendorData['docs'];
            unset($vendorData['docs']);

            $vendor = Vendor::create(array_merge($vendorData, [
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ]));

            // Seed documents realistically
            foreach ($docs as $doc) {
                VendorDocument::create([
                    'vendor_id' => $vendor->id,
                    'document_name' => $doc['name'],
                    'document_type' => $doc['type'],
                    'file_url' => '/storage/vendor_documents/' . Str::slug($doc['name']) . '.pdf',
                    'expires_at' => Carbon::now()->addYears(2),
                    'is_verified' => true,
                ]);
            }
        }
    }
}
