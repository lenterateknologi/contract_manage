<?php

namespace App\Actions\Workflow;

use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UpdateWorkflowStepsAction
{
    use HasWorkflowHelpers;

    /**
     * Update the workflow steps only.
     */
    public function execute(Workflow $workflow, array $data): Workflow
    {
        return DB::transaction(function () use ($data, $workflow) {
            // Cleanup existing steps
            $workflow->steps()->forceDelete();

            $stepIdMap = [];
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    /** @var WorkflowStep $step */
                    $step = $workflow->steps()->create([
                        'label' => $stepData['label'] ?? null,
                        'is_mandatory' => $stepData['is_mandatory'] ?? true,
                        'approver_type' => $stepData['approver_type'] ?? 'role',
                        'description' => $stepData['description'] ?? '',
                        'step' => $index + 1,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                        'step_category' => $stepData['step_category'] ?? null,
                        'is_optional' => $stepData['is_optional'] ?? false,
                        'optional_label' => $stepData['optional_label'] ?? null,
                        'condition_expression' => $stepData['condition_expression'] ?? null,
                        'phase' => $stepData['phase'] ?? 'f1_request',
                        'uploader_type' => $stepData['uploader_type'] ?? null,
                        'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int) $stepData['hierarchy_level'] : null,
                        'role_id' => $stepData['role_id'] ?? null,
                        'meta' => $stepData['meta'] ?? null,
                        'approver_config' => $stepData['approver_config'] ?? null,
                        'company_group_ids' => $stepData['company_group_ids'] ?? null,
                        'region_ids' => $stepData['region_ids'] ?? null,
                        'company_ids' => $stepData['company_ids'] ?? null,
                        'filter_department' => $stepData['filter_department'] ?? false,
                        'filter_company_group' => $stepData['filter_company_group'] ?? false,
                        'filter_region' => $stepData['filter_region'] ?? false,
                        'filter_company' => $stepData['filter_company'] ?? false,
                    ]);

                    $stepClientId = $stepData['id'] ?? $index;
                    $stepIdMap[$stepClientId] = $step->id;

                    $rolesToSync = $stepData['approver_config']['roles'] ?? $stepData['role'] ?? [];
                    if (! empty($rolesToSync)) {
                        foreach ((array) $rolesToSync as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }

                    $deptsToSync = $stepData['approver_config']['departments'] ?? $stepData['department_ids'] ?? [];
                    if (! empty($deptsToSync)) {
                        foreach ((array) $deptsToSync as $deptId) {
                            $resolvedId = $this->resolveDepartmentId($deptId);
                            if ($resolvedId) {
                                $step->approverDepartments()->create(['department_id' => $resolvedId]);
                            }
                        }
                    }

                    $usersToSync = $stepData['approver_config']['users'] ?? $stepData['user_ids'] ?? [];
                    if (! empty($usersToSync)) {
                        foreach ((array) $usersToSync as $userId) {
                            $resolvedId = $this->resolveUserId($userId);
                            if ($resolvedId) {
                                $step->approverUsers()->create(['user_id' => $resolvedId]);
                            }
                        }
                    }
                }

                // Second pass to sync step actions
                foreach ($data['steps'] as $index => $stepData) {
                    $stepClientId = $stepData['id'] ?? $index;
                    $stepId = $stepIdMap[$stepClientId] ?? null;
                    if ($stepId) {
                        $step = WorkflowStep::find($stepId);
                        if ($step) {
                            $this->syncStepActions($step, $stepData['actions'] ?? [], $stepIdMap);
                        }
                    }
                }
            }

            return $workflow;
        });
    }
}
