<?php

namespace App\Http\Actions\Workflow;

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

                    // Sync Approvers
                    $step->approverAuthorities()->delete();
                    if (isset($stepData['approver_authorities'])) {
                        foreach ((array) $stepData['approver_authorities'] as $auth) {
                            $step->approverAuthorities()->create([
                                'authority_type' => ($auth['authority_type'] ?? null) === 'custom' ? ($auth['user_id'] ?? null) : ($auth['authority_type'] ?? null),
                                'role_id' => ! empty($auth['role_id']) ? $this->resolveRoleId($auth['role_id']) : null,
                                'department_id' => ! empty($auth['department_id']) ? $this->resolveDepartmentId($auth['department_id']) : null,
                                'division_id' => $auth['division_id'] ?? null,
                                'user_id' => ($auth['authority_type'] ?? null) === 'custom' ? null : (! empty($auth['user_id']) ? $this->resolveUserId($auth['user_id']) : null),
                                'company_group_id' => $auth['company_group_id'] ?? null,
                                'region_id' => $auth['region_id'] ?? null,
                                'use_initiator_property' => (bool) ($auth['use_initiator_property'] ?? false),
                                'role_use_initiator' => (bool) ($auth['role_use_initiator'] ?? false),
                                'department_use_initiator' => (bool) ($auth['department_use_initiator'] ?? false),
                                'division_use_initiator' => (bool) ($auth['division_use_initiator'] ?? false),
                                'company_group_use_initiator' => (bool) ($auth['company_group_use_initiator'] ?? false),
                                'region_use_initiator' => (bool) ($auth['region_use_initiator'] ?? false),
                            ]);
                        }
                    } else {
                        $rolesToSync = $stepData['approver_config']['roles'] ?? $stepData['role'] ?? [];
                        $deptsToSync = $stepData['approver_config']['departments'] ?? $stepData['department_ids'] ?? [];
                        $usersToSync = $stepData['approver_config']['users'] ?? $stepData['user_ids'] ?? [];
                        $divsToSync = $stepData['division_ids'] ?? [];

                        foreach ((array) $rolesToSync as $role) {
                            if ($role) {
                                $resolvedId = $this->resolveRoleId($role);
                                if ($resolvedId) {
                                    $step->approverAuthorities()->create(['role_id' => $resolvedId]);
                                }
                            }
                        }
                        foreach ((array) $deptsToSync as $deptId) {
                            $resolvedId = $this->resolveDepartmentId($deptId);
                            if ($resolvedId) {
                                $step->approverAuthorities()->create(['department_id' => $resolvedId]);
                            }
                        }
                        foreach ((array) $divsToSync as $divId) {
                            if ($divId) {
                                $step->approverAuthorities()->create(['division_id' => $divId]);
                            }
                        }
                        foreach ((array) $usersToSync as $userId) {
                            $resolvedId = $this->resolveUserId($userId);
                            if ($resolvedId) {
                                $step->approverAuthorities()->create(['user_id' => $resolvedId]);
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
