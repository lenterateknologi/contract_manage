<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WorkflowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $workflows = [
            [
                'contract_type' => 'Service Agreement',
                'name' => 'Standard Service Agreement Workflow',
                'description' => 'Default workflow for Service Agreements',
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'contract_type' => 'Non-Disclosure Agreement',
                'name' => 'Standard NDA Workflow',
                'description' => 'Default workflow for NDAs',
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'contract_type' => 'Purchase Agreement',
                'name' => 'Standard Purchase Agreement Workflow',
                'description' => 'Default workflow for Purchase Agreements',
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'contract_type' => 'Employment Agreement',
                'name' => 'Standard Employment Agreement Workflow',
                'description' => 'Default workflow for Employment Agreements',
                'is_default' => true,
                'is_active' => true,
            ],
        ];

        $sampleUserId = '123e4567-e89b-12d3-a456-426614174000';

        foreach ($workflows as $workflow) {
            DB::table('workflows')->insert(
                array_merge($workflow, [
                    'created_by' => $sampleUserId,
                    'updated_by' => $sampleUserId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
