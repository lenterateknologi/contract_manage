<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Database\Seeder;

class WorkflowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing workflows first (force delete to avoid unique constraint issues with soft deletes)
        Workflow::withTrashed()->forceDelete();

        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;
        $depts = Department::pluck('id', 'code')->all();

        $workflows = [
            [
                'contract_type' => 'General',
                'name' => 'General Standard (Tanpa Pajak)',
                'description' => 'Standard flow for general contracts without Tax review.',
                'department_id' => $depts['MGT'] ?? null,
                'is_default' => true,
                'is_tax_involved' => false,
                'is_active' => true,
            ],
            [
                'contract_type' => 'General',
                'name' => 'General Standard (Dengan Pajak)',
                'description' => 'Standard flow for general contracts with Tax review.',
                'department_id' => $depts['MGT'] ?? null,
                'is_default' => true,
                'is_tax_involved' => true,
                'is_active' => true,
            ],
        ];

        foreach ($workflows as $workflowData) {
            Workflow::create(
                array_merge($workflowData, [
                    'is_template' => true,
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ])
            );
        }
    }
}
