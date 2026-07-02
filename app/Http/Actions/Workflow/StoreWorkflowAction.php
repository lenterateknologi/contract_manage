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
            $workflowData = collect($data)->except([
                'initiator_roles', 'initiator_users', 'initiator_departments', 'initiator_divisions',
                'company_group_ids', 'region_ids', 'company_ids', 'steps',
            ])->toArray();
            if (empty($workflowData['contract_type_id'])) {
                $workflowData['contract_type_id'] = null;
            }
            $workflow = Workflow::create($workflowData);

            if ($workflow->is_default) {
                Workflow::where('id', '!=', $workflow->id)
                    ->update(['is_default' => false]);
            }

            // Sync Org Scopes
            $groupIds = $data['company_group_ids'] ?? [];
            $regionIds = $data['region_ids'] ?? [];
            $companyIds = $data['company_ids'] ?? [];

            foreach ($groupIds as $item) {
                $value = is_array($item) ? ($item['value'] ?? null) : $item;
                $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                if ($value) {
                    $workflow->orgScopes()->create(['company_group_id' => $value, 'is_initiator' => $isInitiator]);
                }
            }
            foreach ($regionIds as $item) {
                $value = is_array($item) ? ($item['value'] ?? null) : $item;
                $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                if ($value) {
                    $workflow->orgScopes()->create(['region_id' => $value, 'is_initiator' => $isInitiator]);
                }
            }
            foreach ($companyIds as $item) {
                $value = is_array($item) ? ($item['value'] ?? null) : $item;
                $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                if ($value) {
                    $workflow->orgScopes()->create(['company_id' => $value, 'is_initiator' => $isInitiator]);
                }
            }

            // Sync Initiator Authorities
            if (! empty($data['initiator_roles'])) {
                foreach ($data['initiator_roles'] as $item) {
                    $value = is_array($item) ? ($item['value'] ?? null) : $item;
                    $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                    $resolvedId = $this->resolveRoleId($value);
                    if ($resolvedId) {
                        $workflow->initiatorAuthorities()->create(['role_id' => $resolvedId, 'is_initiator' => $isInitiator]);
                    }
                }
            }
            if (! empty($data['initiator_departments'])) {
                foreach ($data['initiator_departments'] as $item) {
                    $value = is_array($item) ? ($item['value'] ?? null) : $item;
                    $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                    $resolvedId = $this->resolveDepartmentId($value);
                    if ($resolvedId) {
                        $workflow->initiatorAuthorities()->create(['department_id' => $resolvedId, 'is_initiator' => $isInitiator]);
                    }
                }
            }
            if (! empty($data['initiator_divisions'])) {
                foreach ($data['initiator_divisions'] as $item) {
                    $value = is_array($item) ? ($item['value'] ?? null) : $item;
                    $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                    $workflow->initiatorAuthorities()->create(['division_id' => $value, 'is_initiator' => $isInitiator]);
                }
            }
            if (! empty($data['initiator_users'])) {
                foreach ($data['initiator_users'] as $item) {
                    $value = is_array($item) ? ($item['value'] ?? null) : $item;
                    $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                    $resolvedId = $this->resolveUserId($value);
                    if ($resolvedId) {
                        $workflow->initiatorAuthorities()->create(['user_id' => $resolvedId, 'is_initiator' => $isInitiator]);
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
                        'approver_config' => $stepData['approver_config'] ?? null,
                        'filter_department' => $stepData['filter_department'] ?? false,
                        'filter_company_group' => $stepData['filter_company_group'] ?? false,
                        'filter_region' => $stepData['filter_region'] ?? false,
                        'filter_company' => $stepData['filter_company'] ?? false,
                    ]);

                    $stepIdMap[$stepClientId] = $step->id;

                    $rolesToSync = $stepData['approver_config']['roles'] ?? $stepData['role'] ?? [];
                    $deptsToSync = $stepData['approver_config']['departments'] ?? $stepData['department_ids'] ?? [];
                    $divsToSync = $stepData['division_ids'] ?? [];
                    $usersToSync = $stepData['approver_config']['users'] ?? $stepData['user_ids'] ?? [];

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
