<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('master data sidebar.json');
        if (file_exists($jsonPath)) {
            $jsonData = json_decode(file_get_contents($jsonPath), true);
            if (! empty($jsonData['roles'])) {
                foreach ($jsonData['roles'] as $role) {
                    Role::withTrashed()->updateOrCreate(
                        ['id' => $role['id']],
                        ['name' => $role['name'], 'description' => $role['description'] ?? null, 'deleted_at' => null],
                    );
                }

                return;
            }
        }

        $roles = [
            ['id' => '372d99de-1b85-4832-882d-7bde7f67f2a8', 'name' => 'Admin', 'description' => 'Super Administrator with full access'],
            ['id' => 'b42030a5-9a0b-4388-bc56-48de5f2556b9', 'name' => 'Manager', 'description' => 'Department head or team manager with approval authority'],
            ['id' => 'fda004ef-7a3e-41b2-98c1-6448754aaac3', 'name' => 'Staff', 'description' => 'Regular employee with initiation and review authority'],
            ['id' => '14daa17a-981d-4e18-9f30-c8663867d16f', 'name' => 'Director', 'description' => 'Executive level with final approval authority'],
            ['id' => 'c73a12d3-5dcc-41f3-ae60-ed2b4d3ec0f2', 'name' => 'Vendor', 'description' => 'External party with restricted access'],
            ['id' => 'b8131509-14ce-4b35-8c66-bbd546088ea2', 'name' => 'VP', 'description' => 'Vice President with high-level approval authority'],
            ['id' => 'de0f3016-504e-4940-ad6d-f2f3969df19e', 'name' => 'CEO', 'description' => 'Chief Executive Officer with ultimate approval authority'],
        ];

        foreach ($roles as $role) {
            Role::withTrashed()->updateOrCreate(
                ['id' => $role['id']],
                ['name' => $role['name'], 'description' => $role['description'], 'deleted_at' => null],
            );
        }
    }
}
