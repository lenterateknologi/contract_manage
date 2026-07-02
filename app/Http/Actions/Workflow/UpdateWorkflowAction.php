<?php

namespace App\Http\Actions\Workflow;

use App\Enums\ApproverType;
use App\Enums\WorkflowPhase;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UpdateWorkflowAction
{
    use HasWorkflowHelpers;

    /**
     * Update the specified workflow in storage.
     */
    public function execute(Workflow $workflow, array $data): Workflow
    {
        return DB::transaction(function () use ($data, $workflow) {
            $workflowData = collect($data)->except([
                'initiator_roles', 'initiator_users', 'initiator_departments', 'initiator_divisions',
                'company_group_ids', 'region_ids', 'company_ids', 'steps',
            ])->toArray();
            if (empty($workflowData['contract_type_id'])) {
                $workflowData['contract_type_id'] = null;
            }
            $workflow->update($workflowData);

            if ($workflow->is_default) {
                Workflow::where('id', '!=', $workflow->id)
                    ->update(['is_default' => false]);
            }

            // Sync Org Scopes
            $workflow->orgScopes()->delete();
            $groupIds = $data['company_group_ids'] ?? [];
            $regionIds = $data['region_ids'] ?? [];
            $companyIds = $data['company_ids'] ?? [];

            foreach ($groupIds as $item) {
                $value = is_array($item) ? ($item['value'] ?? null) : $item;
                $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                if ($value === '__initiator__') {
                    $value = null;
                }
                if ($value || $isInitiator) {
                    $workflow->orgScopes()->create(['company_group_id' => $value, 'is_initiator' => $isInitiator]);
                }
            }
            foreach ($regionIds as $item) {
                $value = is_array($item) ? ($item['value'] ?? null) : $item;
                $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                if ($value === '__initiator__') {
                    $value = null;
                }
                if ($value || $isInitiator) {
                    $workflow->orgScopes()->create(['region_id' => $value, 'is_initiator' => $isInitiator]);
                }
            }
            foreach ($companyIds as $item) {
                $value = is_array($item) ? ($item['value'] ?? null) : $item;
                $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                if ($value === '__initiator__') {
                    $value = null;
                }
                if ($value || $isInitiator) {
                    $workflow->orgScopes()->create(['company_id' => $value, 'is_initiator' => $isInitiator]);
                }
            }

            // Sync Initiator Authorities
            $workflow->initiatorAuthorities()->delete();

            if (! empty($data['initiator_roles'])) {
                $rolesData = $data['initiator_roles'];
                if (is_array($rolesData) && (isset($rolesData['is_initiator']) || isset($rolesData['items']))) {
                    $isInit = (bool) ($rolesData['is_initiator'] ?? false);
                    $items = (array) ($rolesData['items'] ?? []);
                    if ($isInit) {
                        $workflow->initiatorAuthorities()->create(['role_id' => null, 'is_initiator' => true]);
                    } else {
                        foreach ($items as $val) {
                            $resolvedId = $this->resolveRoleId($val);
                            if ($resolvedId) {
                                $workflow->initiatorAuthorities()->create(['role_id' => $resolvedId, 'is_initiator' => false]);
                            }
                        }
                    }
                } else {
                    foreach ((array) $data['initiator_roles'] as $item) {
                        $value = is_array($item) ? ($item['value'] ?? null) : $item;
                        $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                        if ($value === '__initiator__') {
                            $value = null;
                        }
                        $resolvedId = $value ? $this->resolveRoleId($value) : null;
                        if ($resolvedId || $isInitiator) {
                            $workflow->initiatorAuthorities()->create(['role_id' => $resolvedId, 'is_initiator' => $isInitiator]);
                        }
                    }
                }
            }

            if (! empty($data['initiator_departments'])) {
                $deptsData = $data['initiator_departments'];
                if (is_array($deptsData) && (isset($deptsData['is_initiator']) || isset($deptsData['items']))) {
                    $isInit = (bool) ($deptsData['is_initiator'] ?? false);
                    $items = (array) ($deptsData['items'] ?? []);
                    if ($isInit) {
                        $workflow->initiatorAuthorities()->create(['department_id' => null, 'is_initiator' => true]);
                    } else {
                        foreach ($items as $val) {
                            $resolvedId = $this->resolveDepartmentId($val);
                            if ($resolvedId) {
                                $workflow->initiatorAuthorities()->create(['department_id' => $resolvedId, 'is_initiator' => false]);
                            }
                        }
                    }
                } else {
                    foreach ((array) $data['initiator_departments'] as $item) {
                        $value = is_array($item) ? ($item['value'] ?? null) : $item;
                        $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                        if ($value === '__initiator__') {
                            $value = null;
                        }
                        $resolvedId = $value ? $this->resolveDepartmentId($value) : null;
                        if ($resolvedId || $isInitiator) {
                            $workflow->initiatorAuthorities()->create(['department_id' => $resolvedId, 'is_initiator' => $isInitiator]);
                        }
                    }
                }
            }

            if (! empty($data['initiator_divisions'])) {
                foreach ((array) $data['initiator_divisions'] as $item) {
                    $value = is_array($item) ? ($item['value'] ?? null) : $item;
                    $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                    if ($value === '__initiator__') {
                        $value = null;
                    }
                    if ($value || $isInitiator) {
                        $workflow->initiatorAuthorities()->create(['division_id' => $value, 'is_initiator' => $isInitiator]);
                    }
                }
            }

            if (! empty($data['initiator_users'])) {
                $usersData = $data['initiator_users'];
                if (is_array($usersData) && (isset($usersData['is_initiator']) || isset($usersData['items']))) {
                    $isInit = (bool) ($usersData['is_initiator'] ?? false);
                    $items = (array) ($usersData['items'] ?? []);
                    if ($isInit) {
                        $workflow->initiatorAuthorities()->create(['user_id' => null, 'is_initiator' => true]);
                    } else {
                        foreach ($items as $val) {
                            $resolvedId = $this->resolveUserId($val);
                            if ($resolvedId) {
                                $workflow->initiatorAuthorities()->create(['user_id' => $resolvedId, 'is_initiator' => false]);
                            }
                        }
                    }
                } else {
                    foreach ((array) $data['initiator_users'] as $item) {
                        $value = is_array($item) ? ($item['value'] ?? null) : $item;
                        $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                        if ($value === '__initiator__') {
                            $value = null;
                        }
                        $resolvedId = $value ? $this->resolveUserId($value) : null;
                        if ($resolvedId || $isInitiator) {
                            $workflow->initiatorAuthorities()->create(['user_id' => $resolvedId, 'is_initiator' => $isInitiator]);
                        }
                    }
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

            // Shift existing step numbers to avoid unique constraint violations during reordering
            WorkflowStep::where('workflow_id', $workflow->id)->update([
                'step' => DB::raw('step + 10000'),
            ]);

            $stepIdMap = [];
            if (! empty($data['steps'])) {
                foreach ($data['steps'] as $index => $stepData) {
                    $stepId = $stepData['id'] ?? null;
                    $isNew = ! $stepId || str_starts_with($stepId, 'new-') || ! in_array($stepId, $existingStepIds);

                    $stepFields = [
                        'label' => $stepData['label'] ?? null,
                        'description' => $stepData['description'] ?? '',
                        'is_mandatory' => $stepData['is_mandatory'] ?? true,
                        'step' => $index + 1,
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
                        'approver_type' => $stepData['approver_type'] ?? ApproverType::Role->value,
                        'filter_department' => $stepData['filter_department'] ?? false,
                        'filter_company_group' => $stepData['filter_company_group'] ?? false,
                        'filter_region' => $stepData['filter_region'] ?? false,
                        'filter_company' => $stepData['filter_company'] ?? false,
                    ];

                    if ($isNew) {
                        $stepFields['created_by'] = Auth::id();
                        /** @var WorkflowStep $step */
                        $step = $workflow->steps()->create($stepFields);
                    } else {
                        /** @var WorkflowStep $step */
                        $step = WorkflowStep::where('workflow_id', $workflow->id)->findOrFail($stepId);
                        $step->update($stepFields);
                    }

                    $stepClientId = $stepData['id'] ?? "new-{$index}";
                    $stepIdMap[$stepClientId] = $step->id;

                    // Sync Approvers
                    $step->approverAuthorities()->delete();
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
