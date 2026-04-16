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
        // Clear existing workflows first
        Workflow::query()->delete();

        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;
        $depts = Department::pluck('id', 'code')->all();

        $workflows = [
            [
                'contract_type' => 'General',
                'name' => 'General Standard Workflow',
                'description' => 'Standard flow for general contracts.',
                'department_id' => $depts['MGT'] ?? null,
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'contract_type' => 'Service',
                'name' => 'IT Procurement Workflow',
                'description' => 'Specialized workflow for IT service requests.',
                'department_id' => $depts['ITC'] ?? null,
                'is_default' => false,
                'is_active' => true,
            ],
            [
                'contract_type' => 'NDA',
                'name' => 'Legal Compliance Workflow',
                'description' => 'Workflow for NDAs and regular legal documents.',
                'department_id' => $depts['LGL'] ?? null,
                'is_default' => false,
                'is_active' => true,
            ],
            [
                'contract_type' => 'Procurement',
                'name' => 'Purchasing Control Workflow',
                'description' => 'Approval flow for purchasing and procurement.',
                'department_id' => $depts['PRC'] ?? null,
                'is_default' => false,
                'is_active' => true,
            ],
        ];

        foreach ($workflows as $workflowData) {
            Workflow::create(
                array_merge($workflowData, [
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ])
            );
        }
    }
}
