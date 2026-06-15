<?php

namespace App\Http\Actions\Workflow;

use App\Enums\ApproverType;
use App\Enums\WorkflowPhase;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StoreWorkflowAction
{
    use HasWorkflowHelpers;

    /**
     * Store a newly created workflow in storage.
     */
    public function execute(array $data): Workflow
    {
        return DB::transaction(function () use ($data) {
            $workflowData = collect($data)->except(['initiator_roles', 'initiator_users', 'initiator_departments', 'steps'])->toArray();
            if (empty($workflowData['contract_type_id'])) {
                $workflowData['contract_type_id'] = null;
            }
            $workflow = Workflow::create($workflowData);

            if ($workflow->is_default) {
                Workflow::where('id', '!=', $workflow->id)
                    ->update(['is_default' => false]);
            }

            // Sync Initiators
            if (! empty($data['initiator_roles'])) {
                foreach ($data['initiator_roles'] as $role) {
                    $workflow->initiatorRolesData()->create(['role_name' => $role]);
                }
            }
            if (! empty($data['initiator_departments'])) {
                foreach ($data['initiator_departments'] as $deptId) {
                    $resolvedId = $this->resolveDepartmentId($deptId);
                    if ($resolvedId) {
                        $workflow->initiatorDepartmentsData()->create(['department_id' => $resolvedId]);
                    }
                }
            }
            if (! empty($data['initiator_users'])) {
                foreach ($data['initiator_users'] as $userId) {
                    $resolvedId = $this->resolveUserId($userId);
                    if ($resolvedId) {
                        $workflow->initiatorUsersData()->create(['user_id' => $resolvedId]);
                    }
                }
            }

            $stepIdMap = [];
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $stepClientId = $stepData['id'] ?? "new-{$index}";
                    /** @var WorkflowStep $step */
                    $step = $workflow->steps()->create([
                        'label' => $stepData['label'] ?? null,
                        'is_mandatory' => $stepData['is_mandatory'] ?? true,
                        'approver_type' => $stepData['approver_type'] ?? ApproverType::Role->value,
                        'description' => $stepData['description'] ?? '',
                        'step' => $index + 1,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                        'is_active' => true,
                        'step_category' => $stepData['step_category'] ?? null,
                        'is_optional' => $stepData['is_optional'] ?? false,
                        'optional_label' => $stepData['optional_label'] ?? null,
                        'condition_expression' => $stepData['condition_expression'] ?? null,
                        'phase' => $stepData['phase'] ?? WorkflowPhase::F1Request->value,
                        'uploader_type' => $stepData['uploader_type'] ?? null,
                        'hierarchy_level' => isset($stepData['hierarchy_level']) ? (int) $stepData['hierarchy_level'] : null,
                        'role_id' => $stepData['role_id'] ?? null,
                        'company_group_ids' => $stepData['company_group_ids'] ?? null,
                        'region_ids' => $stepData['region_ids'] ?? null,
                        'company_ids' => $stepData['company_ids'] ?? null,
                        'meta' => $stepData['meta'] ?? null,
                        'filter_department' => $stepData['filter_department'] ?? false,
                        'filter_company_group' => $stepData['filter_company_group'] ?? false,
                        'filter_region' => $stepData['filter_region'] ?? false,
                        'filter_company' => $stepData['filter_company'] ?? false,
                    ]);

                    $stepIdMap[$stepClientId] = $step->id;

                    if (! empty($stepData['role'])) {
                        foreach ((array) $stepData['role'] as $role) {
                            $step->approverRoles()->create(['role_name' => $role]);
                        }
                    }
                    if (! empty($stepData['department_ids'])) {
                        foreach ((array) $stepData['department_ids'] as $deptId) {
                            $resolvedId = $this->resolveDepartmentId($deptId);
                            if ($resolvedId) {
                                $step->approverDepartments()->create(['department_id' => $resolvedId]);
                            }
                        }
                    }
                    if (! empty($stepData['user_ids'])) {
                        foreach ((array) $stepData['user_ids'] as $userId) {
                            $resolvedId = $this->resolveUserId($userId);
                            if ($resolvedId) {
                                $step->approverUsers()->create(['user_id' => $resolvedId]);
                            }
                        }
                    }
                }

                // Second pass to sync step actions
                foreach ($data['steps'] as $index => $stepData) {
                    $stepClientId = $stepData['id'] ?? "new-{$index}";
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
