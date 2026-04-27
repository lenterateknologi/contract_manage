<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        $vendors = [
            [
                'code' => 'VND001',
                'name' => 'PT Teknologi Maju Jaya',
                'category' => 'Supplier',
                'email' => 'sales@tmj.co.id',
                'phone' => '021-5551234',
                'address' => 'Jl. Sudirman No. 45, Jakarta Selatan',
            ],
            [
                'code' => 'VND002',
                'name' => 'Global Consulting Group',
                'category' => 'Consultant',
                'email' => 'info@globalconsult.com',
                'phone' => '021-5556789',
                'address' => 'Equity Tower Lt. 22, SCBD, Jakarta',
            ],
            [
                'code' => 'VND003',
                'name' => 'Cahaya Konstruksi Utama',
                'category' => 'Contractor',
                'email' => 'project@cahaya-konstruksi.id',
                'phone' => '021-5559900',
                'address' => 'Jl. Gatot Subroto No. 12, Jakarta Pusat',
            ],
            [
                'code' => 'VND004',
                'name' => 'Smart Maintenance Services',
                'category' => 'Maintenance',
                'email' => 'service@smartmain.co.id',
                'phone' => '021-5554433',
                'address' => 'Kawasan Industri Pulogadung Blok C-4',
            ],
        ];

        foreach ($vendors as $vendorData) {
            Vendor::withTrashed()->updateOrCreate(
                ['code' => $vendorData['code']],
                array_merge($vendorData, [
                    'is_active' => true,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                    'deleted_at' => null,
                ])
            );
        }
    }
}
