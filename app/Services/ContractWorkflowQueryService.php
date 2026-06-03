<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\Contract;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ContractWorkflowQueryService
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
                        ->orWhereNull('contract_type_id')
                        ->orWhere('is_default', true);
                } else {
                    $typeId = \App\Models\ContractType::where('code', $contractType)
                        ->orWhere('name', $contractType)
                        ->value('id');
                    if ($typeId) {
                        $q->where('contract_type_id', $typeId)
                            ->orWhereNull('contract_type_id');
                    } else {
                        $q->whereNull('contract_type_id');
                    }
                    $q->orWhere('is_default', true);
                }
            });
        }

        return $query->where(function ($q) use ($user) {
            // Anyone can initiate if initiator_type is 'all'
            $q->where('initiator_type', 'all');

            if ($user) {
                // Check by Role
                $q->orWhereHas('initiatorRolesData', function ($sq) use ($user) {
                    $sq->where('role_name', $user->role);
                })
                // Check by Department
                    ->orWhereHas('initiatorDepartmentsData', function ($sq) use ($user) {
                        $sq->where('department_id', $user->department_id);
                    })
                // Check by specific User
                    ->orWhereHas('initiatorUsersData', function ($sq) use ($user) {
                        $sq->where('user_id', $user->id);
                    });
            }
        })
            ->with(['steps', 'initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData'])
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
            $level = $step->hierarchy_level ?: 1;
        } else {
            $level = (int) $stepOrLevel;
        }

        $currentDeptId = $initiator->department_id;
        $initiatorRoleName = $initiator->getAttribute('role') ?: ($initiator->role()->first()->name ?? '');
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

        $targetRole = ucfirst($hierarchy[$targetIndex]);
        $targetRoleLower = strtolower($targetRole);

        $query = User::where(DB::raw('LOWER(role)'), $targetRoleLower)
            ->where('is_active', true);

        if ($step) {
            // Apply Organizational Filters from Step
            if ($step->filter_department && $initiator->department_id) {
                $query->where('department_id', $initiator->department_id);
            }

            if ($step->filter_company && $initiator->company_id) {
                $query->where('company_id', $initiator->company_id);
            }

            if ($step->filter_company_group || $step->filter_region) {
                $initiatorCompany = $initiator->company;
                if ($initiatorCompany) {
                    if ($step->filter_company_group && $initiatorCompany->company_group_id) {
                        $query->whereHas('company', function ($q) use ($initiatorCompany) {
                            $q->where('company_group_id', $initiatorCompany->company_group_id);
                        });
                    }
                    if ($step->filter_region && $initiatorCompany->region_id) {
                        $query->whereHas('company', function ($q) use ($initiatorCompany) {
                            $q->where('region_id', $initiatorCompany->region_id);
                        });
                    }
                }
            }

            // If specific roles are defined for this step, ensure the target role is within that set
            $allowedRoles = $step->role;
            if (! empty($allowedRoles)) {
                $query->whereIn(DB::raw('LOWER(role)'), array_map('strtolower', $allowedRoles));
            }

            // "alur workflow yang tersedia" - restrict pool to users allowed by the workflow's global configuration
            $workflow = $step->workflow;
            if ($workflow) {
                // 1. Global Approver Roles
                if (! empty($workflow->approver_roles)) {
                    $query->whereIn(DB::raw('LOWER(role)'), array_map('strtolower', $workflow->approver_roles));
                }

                // 2. Global Approver Departments
                if (! empty($workflow->approver_departments)) {
                    $query->whereIn('department_id', $workflow->approver_departments);
                }

                // 3. Global Approver Users
                if (! empty($workflow->approver_users)) {
                    $query->whereIn('id', $workflow->approver_users);
                }
            }
        }

        $approvers = $query->get();

        // Fallback: If no one in specific department/filters, search more broadly but keep the role
        if ($approvers->isEmpty() && $targetIndex > 0) {
            $fallbackQuery = User::where(DB::raw('LOWER(role)'), $targetRoleLower)
                ->where('is_active', true);

            // Keep company-level filters if possible for fallback
            if ($step && $step->filter_company && $initiator->company_id) {
                $fallbackQuery->where('company_id', $initiator->company_id);
            }

            $approvers = $fallbackQuery->get();
        }

        return $approvers;
    }

    /**
     * Helper to identify if a step is related to Tax/Pajak
     */
    public function isTaxStep(WorkflowStep $step): bool
    {
        $condition = $step->condition_expression ?? '';
        $name = strtolower($step->name ?? $step->description ?? '');
        $roles = array_map('strtolower', (array) $step->role);
        $depts = array_map('strtolower', (array) $step->department_names);

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

        // Check roles
        foreach ($roles as $role) {
            foreach ($managementRoles as $mRole) {
                if (str_contains($role, $mRole)) {
                    return true;
                }
            }
        }

        // Check step name/description
        foreach ($managementRoles as $mRole) {
            if (str_contains($name, $mRole)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Log action to contract messages (unified audit trail)
     */
    public function logHistory(Contract $contract, string $action, string $description, ?string $actorId = null): void
    {
        $contract->histories()->create([
            'action' => $action,
            'description' => $description,
            'actor_id' => $actorId,
        ]);
    }
}
