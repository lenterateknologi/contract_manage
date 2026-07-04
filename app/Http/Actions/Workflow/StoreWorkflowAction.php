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
                'company_group_ids', 'region_ids', 'company_ids', 'steps', 'initiator_authorities',
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
                if ($value === '__initiator__') {
                    $value = null;
                }
                if ($value || $isInitiator) {
                    $workflow->orgScopes()->create(['company_group_id' => $value, 'is_initiator' => $isInitiator, 'scope_type' => 'company_group']);
                }
            }
            foreach ($regionIds as $item) {
                $value = is_array($item) ? ($item['value'] ?? null) : $item;
                $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                if ($value === '__initiator__') {
                    $value = null;
                }
                if ($value || $isInitiator) {
                    $workflow->orgScopes()->create(['region_id' => $value, 'is_initiator' => $isInitiator, 'scope_type' => 'region']);
                }
            }
            foreach ($companyIds as $item) {
                $value = is_array($item) ? ($item['value'] ?? null) : $item;
                $isInitiator = is_array($item) ? (bool) ($item['is_initiator'] ?? false) : false;
                if ($value === '__initiator__') {
                    $value = null;
                }
                if ($value || $isInitiator) {
                    $workflow->orgScopes()->create(['company_id' => $value, 'is_initiator' => $isInitiator, 'scope_type' => 'company']);
                }
            }

            // Sync Initiator Authorities
            if (! empty($data['initiator_authorities'])) {
                foreach ((array) $data['initiator_authorities'] as $auth) {
                    $workflow->initiatorAuthorities()->create([
                        'authority_type' => $auth['authority_type'] ?? null,
                        'role_id' => ! empty($auth['role_id']) ? $this->resolveRoleId($auth['role_id']) : null,
                        'department_id' => ! empty($auth['department_id']) ? $this->resolveDepartmentId($auth['department_id']) : null,
                        'division_id' => $auth['division_id'] ?? null,
                        'user_id' => ! empty($auth['user_id']) ? $this->resolveUserId($auth['user_id']) : null,
                        'company_group_id' => $auth['company_group_id'] ?? null,
                        'region_id' => $auth['region_id'] ?? null,
                        'use_initiator_property' => (bool) ($auth['use_initiator_property'] ?? false),
                    ]);
                }
            } else {
                if (! empty($data['initiator_roles'])) {
                    $rolesData = $data['initiator_roles'];
                    if (is_array($rolesData) && (isset($rolesData['is_initiator']) || isset($rolesData['items']))) {
                        $isInit = (bool) ($rolesData['is_initiator'] ?? false);
                        $items = (array) ($rolesData['items'] ?? []);
                        if ($isInit) {
                            $workflow->initiatorAuthorities()->create(['role_id' => null, 'use_initiator_property' => true, 'authority_type' => 'role']);
                        } else {
                            foreach ($items as $val) {
                                $resolvedId = $this->resolveRoleId($val);
                                if ($resolvedId) {
                                    $workflow->initiatorAuthorities()->create(['role_id' => $resolvedId, 'use_initiator_property' => false, 'authority_type' => 'role']);
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
                                $workflow->initiatorAuthorities()->create(['role_id' => $resolvedId, 'use_initiator_property' => $isInitiator, 'authority_type' => 'role']);
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
                            $workflow->initiatorAuthorities()->create(['department_id' => null, 'use_initiator_property' => true, 'authority_type' => 'department']);
                        } else {
                            foreach ($items as $val) {
                                $resolvedId = $this->resolveDepartmentId($val);
                                if ($resolvedId) {
                                    $workflow->initiatorAuthorities()->create(['department_id' => $resolvedId, 'use_initiator_property' => false, 'authority_type' => 'department']);
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
                                $workflow->initiatorAuthorities()->create(['department_id' => $resolvedId, 'use_initiator_property' => $isInitiator, 'authority_type' => 'department']);
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
                            $workflow->initiatorAuthorities()->create(['division_id' => $value, 'use_initiator_property' => $isInitiator, 'authority_type' => 'division']);
                        }
                    }
                }
                if (! empty($data['initiator_users'])) {
                    $usersData = $data['initiator_users'];
                    if (is_array($usersData) && (isset($usersData['is_initiator']) || isset($usersData['items']))) {
                        $isInit = (bool) ($usersData['is_initiator'] ?? false);
                        $items = (array) ($usersData['items'] ?? []);
                        if ($isInit) {
                            $workflow->initiatorAuthorities()->create(['user_id' => null, 'use_initiator_property' => true, 'authority_type' => 'user']);
                        } else {
                            foreach ($items as $val) {
                                $resolvedId = $this->resolveUserId($val);
                                if ($resolvedId) {
                                    $workflow->initiatorAuthorities()->create(['user_id' => $resolvedId, 'use_initiator_property' => false, 'authority_type' => 'user']);
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
                                $workflow->initiatorAuthorities()->create(['user_id' => $resolvedId, 'use_initiator_property' => $isInitiator, 'authority_type' => 'user']);
                            }
                        }
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

                    if (! empty($stepData['approver_authorities'])) {
                        foreach ((array) $stepData['approver_authorities'] as $auth) {
                            $step->approverAuthorities()->create([
                                'authority_type' => $auth['authority_type'] ?? null,
                                'role_id' => ! empty($auth['role_id']) ? $this->resolveRoleId($auth['role_id']) : null,
                                'department_id' => ! empty($auth['department_id']) ? $this->resolveDepartmentId($auth['department_id']) : null,
                                'division_id' => $auth['division_id'] ?? null,
                                'user_id' => ! empty($auth['user_id']) ? $this->resolveUserId($auth['user_id']) : null,
                                'company_group_id' => $auth['company_group_id'] ?? null,
                                'region_id' => $auth['region_id'] ?? null,
                                'use_initiator_property' => (bool) ($auth['use_initiator_property'] ?? false),
                            ]);
                        }
                    } else {
                        $approverConfig = $stepData['approver_config'] ?? [];
                        $rolesToSync = $approverConfig['roles'] ?? $stepData['role'] ?? [];
                        $deptsToSync = $approverConfig['departments'] ?? $stepData['department_ids'] ?? [];
                        $divsToSync = $stepData['division_ids'] ?? [];
                        $usersToSync = $approverConfig['users'] ?? $stepData['user_ids'] ?? [];
                        $isInitiatorRole = (bool) ($approverConfig['is_initiator_role'] ?? false);
                        $isInitiatorDept = (bool) ($approverConfig['is_initiator_department'] ?? false);

                        if ($isInitiatorRole) {
                            $step->approverAuthorities()->create(['role_id' => null, 'use_initiator_property' => true, 'authority_type' => 'role']);
                        } else {
                            foreach ((array) $rolesToSync as $role) {
                                if ($role) {
                                    $resolvedId = $this->resolveRoleId($role);
                                    if ($resolvedId) {
                                        $step->approverAuthorities()->create(['role_id' => $resolvedId, 'use_initiator_property' => false, 'authority_type' => 'role']);
                                    }
                                }
                            }
                        }

                        if ($isInitiatorDept) {
                            $step->approverAuthorities()->create(['department_id' => null, 'use_initiator_property' => true, 'authority_type' => 'department']);
                        } else {
                            foreach ((array) $deptsToSync as $deptId) {
                                $resolvedId = $this->resolveDepartmentId($deptId);
                                if ($resolvedId) {
                                    $step->approverAuthorities()->create(['department_id' => $resolvedId, 'use_initiator_property' => false, 'authority_type' => 'department']);
                                }
                            }
                        }

                        foreach ((array) $divsToSync as $divId) {
                            if ($divId) {
                                $step->approverAuthorities()->create(['division_id' => $divId, 'use_initiator_property' => false, 'authority_type' => 'division']);
                            }
                        }
                        foreach ((array) $usersToSync as $userId) {
                            $resolvedId = $this->resolveUserId($userId);
                            if ($resolvedId) {
                                $step->approverAuthorities()->create(['user_id' => $resolvedId, 'use_initiator_property' => false, 'authority_type' => 'user']);
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
