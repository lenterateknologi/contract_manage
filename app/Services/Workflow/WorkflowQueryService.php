<?php

namespace App\Services\Workflow;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractType;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class WorkflowQueryService
{
    /**
     * Get pending approvals for a user
     */
    public function getPendingApprovalsForUser(User $user): Collection
    {
        return Approval::where('user_id', $user->id)
            ->where('status', 'pending')
            ->with('contract', 'workflowStep')
            ->get();
    }

    /**
     * Get contracts awaiting current user's approval
     */
    public function getContractsAwaitingMyApproval(User $user): Collection
    {
        return Contract::whereHas('approvals', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->where('status', 'pending');
        })
            ->with('workflow', 'workflowStep', 'approvals')
            ->get();
    }

    /**
     * Get workflows available for a specific user to initiate
     */
    public function getAvailableWorkflows(?User $user, ?string $contractType = null): Collection
    {
        $query = Workflow::where('is_active', true);

        if ($contractType) {
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $contractType);
            $typeId = $isUuid ? $contractType : ContractType::where('code', $contractType)->orWhere('name', $contractType)->value('id');

            if ($typeId) {
                $query->where(function ($q) use ($typeId) {
                    $q->where('contract_type_id', $typeId)
                        ->orWhereJsonContains('meta->contract_type_ids', $typeId)
                        ->orWhere(function ($dq) {
                            $dq->whereNull('contract_type_id')
                                ->where(fn ($sub) => $sub->whereNull('meta->contract_type_ids')->orWhereJsonLength('meta->contract_type_ids', 0));
                        });
                });
            }
        }

        $workflows = $query->with([
            'steps',
            'contractType',
            'initiatorAuthorities.role',
            'initiatorAuthorities.department',
            'initiatorAuthorities.division',
            'initiatorAuthorities.user',
            'initiatorAuthorities.companyGroup',
            'initiatorAuthorities.region',
            'initiatorAuthorities.organizationGroup',
        ])->get();

        if (! $user) {
            return $workflows->filter(fn ($w) => $w->initiator_type === 'all' && $w->initiatorAuthorities->isEmpty())->values();
        }

        return $workflows->filter(function ($w) use ($user) {
            // Workflows with no specific initiator authorities and initiator_type 'all' are available to everyone
            if ($w->initiator_type === 'all' && $w->initiatorAuthorities->isEmpty()) {
                return true;
            }

            if ($w->initiatorAuthorities->isEmpty()) {
                return false;
            }

            $userRoleId = $user->role_id;
            $userDeptId = $user->department_id;
            $userDivId = $user->division_id;
            if (! $userDivId && $user->relationLoaded('department') && $user->getRelation('department')) {
                $userDivId = $user->getRelation('department')->division_id;
            }

            // Check if any single rule directly matches the user
            $roleRules = $w->initiatorAuthorities->whereNotNull('role_id');
            $deptRules = $w->initiatorAuthorities->whereNotNull('department_id');
            $divRules = $w->initiatorAuthorities->whereNotNull('division_id');
            $otherRules = $w->initiatorAuthorities->filter(fn ($r) => empty($r->role_id) && empty($r->department_id) && empty($r->division_id));

            // 1. Check composite role + department/division constraint
            if ($roleRules->isNotEmpty()) {
                $roleMatches = $roleRules->contains(fn ($r) => (string) $r->role_id === (string) $userRoleId);
                if ($roleMatches) {
                    $deptMatches = $deptRules->isEmpty() || $deptRules->contains(fn ($r) => (string) $r->department_id === (string) $userDeptId);
                    $divMatches = $divRules->isEmpty() || $divRules->contains(fn ($r) => (string) $r->division_id === (string) $userDivId);
                    if ($deptMatches && $divMatches) {
                        return true;
                    }
                }
            }

            // 2. Check department-only or division-only rules (when not combined with role)
            if ($roleRules->isEmpty()) {
                if ($deptRules->isNotEmpty() && $deptRules->contains(fn ($r) => (string) $r->department_id === (string) $userDeptId)) {
                    return true;
                }
                if ($divRules->isNotEmpty() && $divRules->contains(fn ($r) => (string) $r->division_id === (string) $userDivId)) {
                    return true;
                }
            }

            // 3. Check specific user or universal matching rules (e.g. org_group, user_id, location, etc.)
            foreach ($otherRules as $rule) {
                if (\App\Models\Authority::ruleMatchesUser($rule, $user)) {
                    return true;
                }
            }

            return false;
        })->values();
    }

    /**
     * Resolve hierarchical approver (Manager -> VP -> Director)
     */
    public function resolveHierarchyApprover(Contract $contract, WorkflowStep|int $stepOrLevel): Collection
    {
        $initiator = $contract->initiator;

        $step = null;
        if ($stepOrLevel instanceof WorkflowStep) {
            $step = $stepOrLevel;
            $level = ($step->getAttributes()['hierarchy_level'] ?? null) ?: 1;
        } else {
            $level = (int) $stepOrLevel;
        }

        $initiatorRoleName = $initiator->getAttribute('role') ?: ($initiator->roleRelation()->first()->name ?? '');
        $initiatorRole = strtolower($initiatorRoleName);

        // Define hierarchy order
        $hierarchy = ['staff', 'manager', 'vp', 'director'];

        // Find current level index
        $currentIndex = array_search($initiatorRole, $hierarchy);
        if ($currentIndex === false) {
            $currentIndex = -1;
        }

        // Target level is relative to current role or absolute hierarchy level
        $targetIndex = $currentIndex + $level;
        if ($targetIndex >= count($hierarchy)) {
            $targetIndex = count($hierarchy) - 1;
        }

        $targetRoleLower = strtolower($hierarchy[$targetIndex]);

        $query = User::whereHas('roleRelation', fn ($q) => $q->where(DB::raw('LOWER(name)'), $targetRoleLower))
            ->where('is_used', true)
            ->where('is_active', true);

        if ($step) {
            $this->applyStepFilters($query, $step, $initiator);

            // restrict pool to users allowed by the workflow's global configuration
            $step->loadMissing('workflow');
            $workflow = $step->workflow;
            if ($workflow) {
                if (! empty($workflow->approver_roles)) {
                    $query->whereHas('roleRelation', fn ($q) => $q->whereIn(DB::raw('LOWER(name)'), array_map('strtolower', (array) $workflow->approver_roles)));
                }
                if (! empty($workflow->approver_departments)) {
                    $query->whereIn('division_id', (array) $workflow->approver_departments);
                }
                if (! empty($workflow->approver_users)) {
                    $query->whereIn('id', (array) $workflow->approver_users);
                }
            }
        }

        $approvers = $query->get();

        // Fallback: If no one in specific department/filters, search more broadly but keep the role
        if ($approvers->isEmpty() && $targetIndex > 0) {
            $fallbackQuery = User::whereHas('roleRelation', fn ($q) => $q->where(DB::raw('LOWER(name)'), $targetRoleLower))
                ->where('is_used', true)
                ->where('is_active', true);

            $filterCompany = (bool) data_get($step?->getAttributes(), 'filter_company', false);
            if ($step && $filterCompany && $initiator->company_id) {
                $fallbackQuery->where('company_id', $initiator->company_id);
            }

            $approvers = $fallbackQuery->get();
        }

        return $approvers;
    }

    /**
     * Apply organizational filters from a workflow step to a user query
     */
    public function applyStepFilters(Builder $query, WorkflowStep $step, User $initiator): void
    {
        $config = $step->approver_config;
        $filterDept = (bool) data_get($step->getAttributes(), 'filter_department', false);
        $filterCompany = (bool) data_get($step->getAttributes(), 'filter_company', false);
        $filterCompanyGroup = (bool) data_get($step->getAttributes(), 'filter_company_group', false);
        $filterRegion = (bool) data_get($step->getAttributes(), 'filter_region', false);

        $isInitDept = $filterDept || (! empty($config) && ! empty($config['is_initiator_department']));

        if ($isInitDept) {
            $query->where('division_id', $initiator->division_id ?? '00000000-0000-0000-0000-000000000000');
        }

        if ($filterCompany) {
            $query->where('company_id', $initiator->company_id ?? '00000000-0000-0000-0000-000000000000');
        }

        if ($filterCompanyGroup || $filterRegion) {
            if (! $initiator->relationLoaded('company')) {
                $initiator->load('company');
            }
            $initiatorCompany = $initiator->company;

            $query->whereHas('company', function ($q) use ($filterCompanyGroup, $filterRegion, $initiatorCompany) {
                if ($filterCompanyGroup) {
                    $groupId = $initiatorCompany?->company_group_id ?? '00000000-0000-0000-0000-000000000000';
                    $q->where('company_group_id', $groupId);
                }
                if ($filterRegion) {
                    $regionId = $initiatorCompany?->region_id ?? '00000000-0000-0000-0000-000000000000';
                    $q->where('region_id', $regionId);
                }
            });
        }

        $allowedRoles = $step->role;
        if (! empty($allowedRoles)) {
            $query->whereHas('roleRelation', fn ($q) => $q->whereIn(DB::raw('LOWER(name)'), array_map('strtolower', (array) $allowedRoles)));
        }
    }

    /**
     * Helper to identify if a step is related to Tax/Pajak
     */
    public function isTaxStep(WorkflowStep $step): bool
    {
        $condition = $step->condition_expression ?? '';
        $name = strtolower($step->name ?? $step->description ?? '');
        $roles = array_map('strtolower', (array) $step->role);
        $depts = array_map('strtolower', (array) ($step->department_names ?? []));

        return str_contains($condition, 'has_tax') ||
               str_contains($condition, 'pajak') ||
               str_contains($condition, 'meta_is_tax') ||
               str_contains($name, 'tax') ||
               str_contains($name, 'pajak') ||
               collect($roles)->contains(fn ($r) => str_contains($r, 'tax') || str_contains($r, 'pajak')) ||
               collect($depts)->contains(fn ($d) => str_contains($d, 'tax') || str_contains($d, 'pajak'));
    }

    /**
     * Helper to identify if a step involves high-level management
     */
    public function isManagementStep(WorkflowStep $step): bool
    {
        $managementRoles = ['director', 'vp', 'coo', 'direksi', 'direktur', 'ceo', 'cfo', 'gm', 'general manager', 'management', 'manajemen'];
        $roles = array_map('strtolower', (array) $step->role);
        $name = strtolower($step->name ?? $step->description ?? '');

        foreach ($roles as $role) {
            foreach ($managementRoles as $mRole) {
                if (str_contains($role, $mRole)) {
                    return true;
                }
            }
        }

        foreach ($managementRoles as $mRole) {
            if (str_contains($name, $mRole)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Log action to contract histories
     */
    public function logHistory(Contract $contract, string $action, string $description, ?string $actorId = null): void
    {
        $resolvedActorId = $actorId ?: Auth::id() ?: $contract->assigned_pic_id ?: $contract->created_by ?: $contract->initiated_by_id ?: User::value('id');

        $contract->histories()->create([
            'action' => $action,
            'description' => $description,
            'actor_id' => $resolvedActorId,
        ]);
    }

    private function getUserField($user, string $field)
    {
        if (! $user) {
            return null;
        }
        if (array_key_exists($field, $user->getAttributes())) {
            return $user->$field;
        }

        return User::where('id', $user->id)->value($field);
    }
}
