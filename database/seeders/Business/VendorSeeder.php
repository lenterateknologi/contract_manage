<?php

namespace Database\Seeders\Business;

use App\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            [
                'code' => 'V-001',
                'name' => 'PT. Global Technology Solutions',
                'company_type' => 'PT',
                'category' => 'IT SERVICES',
                'email' => 'contact@globaltech.id',
                'phone' => '021-5551234',
                'website' => 'https://globaltech.id',
                'pic_name' => 'John Doe',
                'pic_position' => 'IT Manager',
                'director_name' => 'Jane Smith',
                'npwp' => '01.234.567.8-901.000',
                'nib' => '9120001234567',
                'siup' => '503/123/SIUP/2026',
                'bank_name' => 'Bank Mandiri',
                'bank_account_no' => '1234567890',
                'bank_account_name' => 'PT. Global Technology Solutions',
                'address' => 'Jl. Jenderal Sudirman No. 21, Jakarta Selatan',
                'is_individual' => false,
                'is_active' => true,
            ],
            [
                'code' => 'V-002',
                'name' => 'CV. Maju Jaya Logistik',
                'company_type' => 'CV',
                'category' => 'LOGISTICS',
                'email' => 'maju.jaya@email.com',
                'phone' => '021-8884321',
                'website' => 'https://majujayalogistik.co.id',
                'pic_name' => 'Budi Santoso',
                'pic_position' => 'Operational Lead',
                'director_name' => 'Hendra Wijaya',
                'npwp' => '02.345.678.9-012.000',
                'nib' => '8120007654321',
                'siup' => '503/456/SIUP/2026',
                'bank_name' => 'Bank BCA',
                'bank_account_no' => '9876543210',
                'bank_account_name' => 'CV. Maju Jaya Logistik',
                'address' => 'Jl. Kawasan Industri Pulogadung No. 45, Jakarta Timur',
                'is_individual' => false,
                'is_active' => true,
            ],
            [
                'code' => 'V-003',
                'name' => 'PT. Sarana Konstruksi Indonesia',
                'company_type' => 'PT',
                'category' => 'GENERAL SUPPLIER',
                'email' => 'sales@saranakonstruksi.co.id',
                'phone' => '021-9990001',
                'website' => 'https://saranakonstruksi.co.id',
                'pic_name' => 'Siti Aminah',
                'pic_position' => 'Procurement Manager',
                'director_name' => 'Rahmat Hidayat',
                'npwp' => '03.456.789.0-123.000',
                'nib' => '7120003456789',
                'siup' => '503/789/SIUP/2026',
                'bank_name' => 'Bank BNI',
                'bank_account_no' => '5554443322',
                'bank_account_name' => 'PT. Sarana Konstruksi Indonesia',
                'address' => 'Jl. Gatot Subroto No. 102, Jakarta Selatan',
                'is_individual' => false,
                'is_active' => true,
            ],
        ];

        foreach ($vendors as $vendor) {
            Vendor::updateOrCreate(['code' => $vendor['code']], $vendor);
        }
    }
}
