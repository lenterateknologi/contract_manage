<?php

namespace App\Actions\Admin;

use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class WorkflowAction
{
    /**
     * Store a newly created workflow in storage.
     */
    public function store(array $data): Workflow
    {
        return DB::transaction(function () use ($data) {
            $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
            $workflow = Workflow::create($workflowData);

            // Sync Initiators
            if (! empty($data['initiator_roles'])) {
                foreach ($data['initiator_roles'] as $role) {
                    $workflow->initiatorRolesData()->create(['role_name' => $role]);
                }
            }
            if (! empty($data['initiator_departments'])) {
                foreach ($data['initiator_departments'] as $deptId) {
                    $workflow->initiatorDepartmentsData()->create(['department_id' => $deptId]);
                }
            }
            if (! empty($data['initiator_users'])) {
                foreach ($data['initiator_users'] as $userId) {
                    $workflow->initiatorUsersData()->create(['user_id' => $userId]);
                }
            }

            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $step = $workflow->steps()->create([
                        'approver_type' => $stepData['approver_type'] ?? 'role',
                        'description' => $stepData['description'] ?? '',
                        'status_id' => $stepData['status_id'] ?? null,
                        'step' => $index + 1,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                        'step_type' => $stepData['step_type'] ?? 'approval',
                        'step_category' => $stepData['step_category'] ?? null,
                        'is_optional' => $stepData['is_optional'] ?? false,
                        'optional_label' => $stepData['optional_label'] ?? null,
                        'condition_expression' => $stepData['condition_expression'] ?? null,
                        'phase' => $stepData['phase'] ?? 'f1_request',
                        'uploader_type' => $stepData['uploader_type'] ?? null,
                        'reject_target' => $stepData['reject_target'] ?? 'initiator',
                        'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int) $stepData['hierarchy_level'] : null,
                        'role_id' => $stepData['role_id'] ?? null,
                        'company_group_ids' => $stepData['company_group_ids'] ?? null,
                        'region_ids' => $stepData['region_ids'] ?? null,
                        'company_ids' => $stepData['company_ids'] ?? null,
                        'meta' => $stepData['meta'] ?? null,
                    ]);

                    if (! empty($stepData['role'])) {
                        foreach ((array) $stepData['role'] as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }
                    if (! empty($stepData['department_ids'])) {
                        foreach ((array) $stepData['department_ids'] as $deptId) {
                            $step->approverDepartments()->create(['department_id' => $deptId]);
                        }
                    }
                    if (! empty($stepData['user_ids'])) {
                        foreach ((array) $stepData['user_ids'] as $userId) {
                            $step->approverUsers()->create(['user_id' => $userId]);
                        }
                    }
                }
            }

            return $workflow;
        });
    }

    /**
     * Update the specified workflow in storage.
     */
    public function update(Workflow $workflow, array $data): Workflow
    {
        return DB::transaction(function () use ($data, $workflow) {
            // Update basic info
            $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
            $workflow->update($workflowData);

            // Sync Initiators (Role, Dept, User)
            $workflow->initiatorRolesData()->delete();
            if (! empty($data['initiator_roles'])) {
                foreach ((array) $data['initiator_roles'] as $role) {
                    $workflow->initiatorRolesData()->create(['role_name' => $role]);
                }
            }

            $workflow->initiatorDepartmentsData()->delete();
            if (! empty($data['initiator_departments'])) {
                foreach ((array) $data['initiator_departments'] as $deptId) {
                    $workflow->initiatorDepartmentsData()->create(['department_id' => $deptId]);
                }
            }

            $workflow->initiatorUsersData()->delete();
            if (! empty($data['initiator_users'])) {
                foreach ((array) $data['initiator_users'] as $userId) {
                    $workflow->initiatorUsersData()->create(['user_id' => $userId]);
                }
            }

            // Sync Workflow Steps (Upsert Logic)
            $existingStepIds = $workflow->steps->pluck('id')->toArray();
            $inputStepIds = collect($data['steps'] ?? [])->pluck('id')->filter(fn ($id) => $id && ! str_starts_with($id, 'new-'))->toArray();

            // Delete steps that are not in the input
            $stepsToDelete = array_diff($existingStepIds, $inputStepIds);
            if (! empty($stepsToDelete)) {
                WorkflowStep::whereIn('id', $stepsToDelete)->forceDelete();
            }

            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $stepId = $stepData['id'] ?? null;
                    $isNew = ! $stepId || str_starts_with($stepId, 'new-');

                    $stepFields = [
                        'label' => $stepData['label'] ?? null,
                        'description' => $stepData['description'] ?? '',
                        'actor_type' => $stepData['actor_type'] ?? 'approver',
                        'allowed_actions' => $stepData['allowed_actions'] ?? [],
                        'is_mandatory' => $stepData['is_mandatory'] ?? true,
                        'status_id' => $stepData['status_id'] ?? null,
                        'step' => $index + 1,
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                        'step_type' => $stepData['step_type'] ?? 'approval',
                        'step_category' => $stepData['step_category'] ?? null,
                        'is_optional' => $stepData['is_optional'] ?? false,
                        'optional_label' => $stepData['optional_label'] ?? null,
                        'condition_expression' => $stepData['condition_expression'] ?? null,
                        'phase' => $stepData['phase'] ?? 'f1_request',
                        'uploader_type' => $stepData['uploader_type'] ?? null,
                        'reject_target' => $stepData['reject_target'] ?? 'initiator',
                        'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int) $stepData['hierarchy_level'] : null,
                        'role_id' => $stepData['role_id'] ?? null,
                        'company_group_ids' => $stepData['company_group_ids'] ?? null,
                        'region_ids' => $stepData['region_ids'] ?? null,
                        'company_ids' => $stepData['company_ids'] ?? null,
                        'meta' => $stepData['meta'] ?? null,
                    ];

                    if ($isNew) {
                        $stepFields['created_by'] = Auth::id();
                        $step = $workflow->steps()->create($stepFields);
                    } else {
                        $step = WorkflowStep::where('workflow_id', $workflow->id)->findOrFail($stepId);
                        $step->update($stepFields);
                    }

                    // Sync Approvers
                    $step->approverRoles()->delete();
                    if (! empty($stepData['role'])) {
                        foreach ((array) $stepData['role'] as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }

                    $step->approverDepartments()->delete();
                    if (! empty($stepData['department_ids'])) {
                        foreach ((array) $stepData['department_ids'] as $deptId) {
                            $step->approverDepartments()->create(['department_id' => $deptId]);
                        }
                    }

                    $step->approverUsers()->delete();
                    if (! empty($stepData['user_ids'])) {
                        foreach ((array) $stepData['user_ids'] as $userId) {
                            $step->approverUsers()->create(['user_id' => $userId]);
                        }
                    }
                }
            }

            return $workflow;
        });
    }

    /**
     * Remove the specified workflow from storage.
     */
    public function destroy(Workflow $workflow): ?bool
    {
        return $workflow->delete();
    }

    /**
     * Update the workflow steps only.
     */
    public function updateSteps(Workflow $workflow, array $data): Workflow
    {
        return DB::transaction(function () use ($data, $workflow) {
            // Cleanup existing steps
            foreach ($workflow->steps as $oldStep) {
                $oldStep->approverRoles()->delete();
                $oldStep->approverDepartments()->delete();
                $oldStep->approverUsers()->delete();
            }
            $workflow->steps()->forceDelete();

            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $step = $workflow->steps()->create([
                        'approver_type' => $stepData['approver_type'] ?? 'role',
                        'description' => $stepData['description'] ?? '',
                        'status_id' => $stepData['status_id'] ?? null,
                        'step' => $index + 1,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                        'step_type' => $stepData['step_type'] ?? 'approval',
                        'step_category' => $stepData['step_category'] ?? null,
                        'is_optional' => $stepData['is_optional'] ?? false,
                        'optional_label' => $stepData['optional_label'] ?? null,
                        'condition_expression' => $stepData['condition_expression'] ?? null,
                        'phase' => $stepData['phase'] ?? 'f1_request',
                        'uploader_type' => $stepData['uploader_type'] ?? null,
                        'reject_target' => $stepData['reject_target'] ?? 'initiator',
                        'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int) $stepData['hierarchy_level'] : null,
                        'role_id' => $stepData['role_id'] ?? null,
                        'meta' => $stepData['meta'] ?? null,
                    ]);

                    if (! empty($stepData['role'])) {
                        foreach ((array) $stepData['role'] as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }

                    if (! empty($stepData['department_ids'])) {
                        foreach ((array) $stepData['department_ids'] as $deptId) {
                            $step->approverDepartments()->create(['department_id' => $deptId]);
                        }
                    }

                    if (! empty($stepData['user_ids'])) {
                        foreach ((array) $stepData['user_ids'] as $userId) {
                            $step->approverUsers()->create(['user_id' => $userId]);
                        }
                    }
                }
            }

            return $workflow;
        });
    }
}
