<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WorkflowStepSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sampleUserId = '123e4567-e89b-12d3-a456-426614174000';

        // Get all workflows
        $workflows = DB::table('workflows')->get();

        foreach ($workflows as $workflow) {
            // Define steps for each workflow type
            $steps = match ($workflow->contract_type) {
                'Service Agreement' => [
                    ['role' => 'Legal', 'step' => 1, 'description' => 'Legal Review'],
                    ['role' => 'Tax', 'step' => 2, 'description' => 'Tax Review'],
                    ['role' => 'Management', 'step' => 3, 'description' => 'Management Approval'],
                    ['role' => 'Direksi', 'step' => 4, 'description' => 'Director Approval'],
                ],
                'Non-Disclosure Agreement' => [
                    ['role' => 'Legal', 'step' => 1, 'description' => 'Legal Review'],
                    ['role' => 'Management', 'step' => 2, 'description' => 'Management Approval'],
                ],
                'Purchase Agreement' => [
                    ['role' => 'Procurement', 'step' => 1, 'description' => 'Procurement Review'],
                    ['role' => 'Legal', 'step' => 2, 'description' => 'Legal Review'],
                    ['role' => 'Finance', 'step' => 3, 'description' => 'Finance Review'],
                    ['role' => 'Direksi', 'step' => 4, 'description' => 'Director Approval'],
                ],
                'Employment Agreement' => [
                    ['role' => 'HR', 'step' => 1, 'description' => 'HR Review'],
                    ['role' => 'Legal', 'step' => 2, 'description' => 'Legal Review'],
                    ['role' => 'Management', 'step' => 3, 'description' => 'Management Approval'],
                ],
                default => [
                    ['role' => 'Legal', 'step' => 1, 'description' => 'Legal Review'],
                    ['role' => 'Management', 'step' => 2, 'description' => 'Management Approval'],
                ],
            };

            foreach ($steps as $step) {
                DB::table('workflow_steps')->insert([
                    'workflow_id' => $workflow->id,
                    'role' => $step['role'],
                    'step' => $step['step'],
                    'description' => $step['description'],
                    'is_active' => true,
                    'created_by' => $sampleUserId,
                    'updated_by' => $sampleUserId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
