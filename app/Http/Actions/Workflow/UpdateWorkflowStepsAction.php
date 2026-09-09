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
            $existingStepIds = $workflow->steps()->pluck('id')->toArray();
            $incomingStepIds = [];

            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $stepData) {
                    if (! empty($stepData['id']) && in_array($stepData['id'], $existingStepIds)) {
                        $incomingStepIds[] = $stepData['id'];
                    }
                }
            }

            // Delete steps that are no longer in the incoming list
            $deletedStepIds = array_diff($existingStepIds, $incomingStepIds);
            if (! empty($deletedStepIds)) {
                WorkflowStep::whereIn('id', $deletedStepIds)->delete();
            }

            // Set negative temporary step numbers to prevent unique collision during reordering
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $stepId = $stepData['id'] ?? null;
                    if ($stepId && in_array($stepId, $existingStepIds)) {
                        WorkflowStep::where('id', $stepId)->update(['step' => -($index + 1)]);
                    }
                }
            }

            $stepIdMap = [];
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $stepId = $stepData['id'] ?? null;
                    $attributes = [
                        'label' => $stepData['label'] ?? null,
                        'is_visible' => isset($stepData['is_visible']) ? (bool) $stepData['is_visible'] : true,
                        'is_mandatory' => $stepData['is_mandatory'] ?? true,
                        'approver_type' => $stepData['approver_type'] ?? 'role',
                        'description' => $stepData['description'] ?? '',
                        'step' => $index + 1,
                        'updated_by' => Auth::id(),
                        'is_active' => isset($stepData['is_active']) ? (bool) $stepData['is_active'] : true,
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
                    ];

                    /** @var WorkflowStep $step */
                    if ($stepId && in_array($stepId, $existingStepIds)) {
                        $step = WorkflowStep::find($stepId);
                        $step->update($attributes);
                    } else {
                        $attributes['created_by'] = Auth::id();
                        $step = $workflow->steps()->create($attributes);
                    }

                    $stepClientId = $stepData['id'] ?? $index;
                    $stepIdMap[$stepClientId] = $step->id;

                    // Sync Approvers
                    $step->approverAuthorities()->delete();
                    if (isset($stepData['approver_authorities'])) {
                        foreach ((array) $stepData['approver_authorities'] as $auth) {
                            $authType = ($auth['authority_type'] ?? null) === 'custom' ? ($auth['user_id'] ?? null) : ($auth['authority_type'] ?? null);
                            $userId = in_array($authType, ['initiator', 'assigned_pic', 'creator', 'atasan', 'adhoc_approvers', 'adhoc', 'group', 'role', 'department', 'division', 'company_group', 'company', 'region']) ? null : (! empty($auth['user_id']) ? $this->resolveUserId($auth['user_id']) : null);

                            $step->approverAuthorities()->create([
                                'authority_type' => $authType,
                                'role_id' => ! empty($auth['role_id']) && $authType !== $auth['role_id'] ? $this->resolveRoleId($auth['role_id']) : null,
                                'department_id' => ! empty($auth['department_id']) ? $this->resolveDepartmentId($auth['department_id']) : null,
                                'division_id' => $auth['division_id'] ?? null,
                                'user_id' => $userId,
                                'company_group_id' => $auth['company_group_id'] ?? null,
                                'company_id' => $auth['company_id'] ?? null,
                                'region_id' => $auth['region_id'] ?? null,
                                'role_use_initiator' => $auth['role_use_initiator'] ?? false,
                                'department_use_initiator' => $auth['department_use_initiator'] ?? false,
                                'division_use_initiator' => $auth['division_use_initiator'] ?? false,
                                'company_group_use_initiator' => $auth['company_group_use_initiator'] ?? false,
                                'company_use_initiator' => $auth['company_use_initiator'] ?? false,
                                'region_use_initiator' => $auth['region_use_initiator'] ?? false,
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

            // Re-sync active in-progress contracts for this workflow so new actors get their pending tasks
            $activeContracts = \App\Models\Contract::where('workflow_id', $workflow->id)
                ->where('status', 'in_review')
                ->with(['initiator.department', 'initiator.company', 'creator'])
                ->get();

            $workflowService = app(\App\Services\Workflow\ContractWorkflowService::class);
            foreach ($activeContracts as $contract) {
                if ($contract->workflow_step_id) {
                    $currentStep = WorkflowStep::find($contract->workflow_step_id);
                    if ($currentStep) {
                        $workflowService->createApprovalForStep($contract, $currentStep);
                    }
                }
            }

            return $workflow;
        });
    }
}
