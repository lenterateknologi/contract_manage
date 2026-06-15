<?php

namespace Database\Seeders\Business;

use App\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            ['name' => 'PT. Global Technology Solutions', 'code' => 'V-001', 'category' => 'IT SERVICES', 'email' => 'contact@globaltech.id', 'is_active' => true],
            ['name' => 'CV. Maju Jaya Logistik', 'code' => 'V-002', 'category' => 'LOGISTICS', 'email' => 'maju.jaya@email.com', 'is_active' => true],
            ['name' => 'PT. Sarana Konstruksi Indonesia', 'code' => 'V-003', 'category' => 'GENERAL SUPPLIER', 'email' => 'sales@saranakonstruksi.co.id', 'is_active' => true],
        ];

        foreach ($vendors as $vendor) {
            Vendor::updateOrCreate(['code' => $vendor['code']], $vendor);
        }
    }
}
