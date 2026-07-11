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
            $query->where(function ($q) use ($contractType, $isUuid) {
                if ($isUuid) {
                    $q->where('contract_type_id', $contractType)
                        ->orWhereJsonContains('meta->contract_type_ids', $contractType)
                        ->orWhere('is_default', true);
                } else {
                    $typeId = ContractType::where('code', $contractType)
                        ->orWhere('name', $contractType)
                        ->value('id');
                    if ($typeId) {
                        $q->where('contract_type_id', $typeId)
                            ->orWhereJsonContains('meta->contract_type_ids', $typeId);
                    } else {
                        // No matching type, return only defaults or none
                        $q->whereRaw('1 = 0');
                    }
                    $q->orWhere('is_default', true);
                }
            });
        }

        return $query->where(function ($q) use ($user) {
            // Include workflows available to all
            $q->where('initiator_type', 'all');

            if ($user) {
                $roleId = $this->getUserField($user, 'role_id');
                $deptId = $this->getUserField($user, 'department_id');
                $divId = $this->getUserField($user, 'division_id');

                // Include workflows restricted by initiator_type != 'all' AND matched by user/role/dept/div
                $q->orWhere(function ($sq) use ($user, $roleId, $deptId, $divId) {
                    $sq->where('initiator_type', '!=', 'all')
                        ->where(function ($ssq) use ($user, $roleId, $deptId, $divId) {
                            $ssq->where(function ($q1) use ($roleId, $deptId, $divId) {
                                // 1. Role match: role_id = user.role_id
                                // AND (if workflow has department authorities, one of them must have department_id = user.department_id)
                                // AND (if workflow has division authorities, one of them must have division_id = user.division_id)
                                $q1->whereHas('initiatorAuthorities', function ($roleQuery) use ($roleId) {
                                    $roleQuery->where('role_id', $roleId)
                                        ->where(fn ($sub) => $sub->where('authority_type', 'role')->orWhere(fn ($ss) => $ss->whereNull('authority_type')->whereNotNull('role_id')));
                                })
                                    ->where(function ($deptCheckQuery) use ($deptId) {
                                        $deptCheckQuery->whereDoesntHave('initiatorAuthorities', function ($q) {
                                            $q->where('authority_type', 'department')
                                                ->orWhere(fn ($sub) => $sub->whereNull('authority_type')->whereNotNull('department_id'));
                                        })
                                            ->orWhereHas('initiatorAuthorities', function ($q) use ($deptId) {
                                                if (empty($deptId)) {
                                                    $q->whereRaw('1 = 0'); // force false if user has no department
                                                } else {
                                                    $q->where('department_id', $deptId)
                                                        ->where(fn ($sub) => $sub->where('authority_type', 'department')->orWhere(fn ($ss) => $ss->whereNull('authority_type')->whereNotNull('department_id')));
                                                }
                                            });
                                    })
                                    ->where(function ($divCheckQuery) use ($divId) {
                                        $divCheckQuery->whereDoesntHave('initiatorAuthorities', function ($q) {
                                            $q->where('authority_type', 'division')
                                                ->orWhere(fn ($sub) => $sub->whereNull('authority_type')->whereNotNull('division_id'));
                                        })
                                            ->orWhereHas('initiatorAuthorities', function ($q) use ($divId) {
                                                if (empty($divId)) {
                                                    $q->whereRaw('1 = 0'); // force false if user has no division
                                                } else {
                                                    $q->where('division_id', $divId)
                                                        ->where(fn ($sub) => $sub->where('authority_type', 'division')->orWhere(fn ($ss) => $ss->whereNull('authority_type')->whereNotNull('division_id')));
                                                }
                                            });
                                    });
                            })
                            // OR 2. Department match
                                ->orWhereHas('initiatorAuthorities', function ($q) use ($deptId) {
                                    if (empty($deptId)) {
                                        $q->whereRaw('1 = 0');
                                    } else {
                                        $q->where('department_id', $deptId)
                                            ->where(fn ($sub) => $sub->where('authority_type', 'department')->orWhere(fn ($ss) => $ss->whereNull('authority_type')->whereNotNull('department_id')));
                                    }
                                })
                            // OR 3. Division match
                                ->orWhereHas('initiatorAuthorities', function ($q) use ($divId) {
                                    if (empty($divId)) {
                                        $q->whereRaw('1 = 0');
                                    } else {
                                        $q->where('division_id', $divId)
                                            ->where(fn ($sub) => $sub->where('authority_type', 'division')->orWhere(fn ($ss) => $ss->whereNull('authority_type')->whereNotNull('division_id')));
                                    }
                                })
                            // OR 4. User match
                                ->orWhereHas('initiatorAuthorities', function ($q) use ($user) {
                                    $q->where('user_id', $user->id)
                                        ->where(fn ($sub) => $sub->where('authority_type', 'user')->orWhere(fn ($ss) => $ss->whereNull('authority_type')->whereNotNull('user_id')));
                                });
                        });
                });
            }
        })
            ->with(['steps', 'initiatorAuthorities'])
            ->get();
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
                ->where('is_active', true);

            if ($step && $step->filter_company && $initiator->company_id) {
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
        $isInitDept = $step->filter_department || (! empty($config) && ! empty($config['is_initiator_department']));

        if ($isInitDept) {
            $query->where('division_id', $initiator->division_id ?? '00000000-0000-0000-0000-000000000000');
        }

        if ($step->filter_company) {
            $query->where('company_id', $initiator->company_id ?? '00000000-0000-0000-0000-000000000000');
        }

        if ($step->filter_company_group || $step->filter_region) {
            if (! $initiator->relationLoaded('company')) {
                $initiator->load('company');
            }
            $initiatorCompany = $initiator->company;

            $query->whereHas('company', function ($q) use ($step, $initiatorCompany) {
                if ($step->filter_company_group) {
                    $groupId = $initiatorCompany?->company_group_id ?? '00000000-0000-0000-0000-000000000000';
                    $q->where('company_group_id', $groupId);
                }
                if ($step->filter_region) {
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
        $contract->histories()->create([
            'action' => $action,
            'description' => $description,
            'actor_id' => $actorId,
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
