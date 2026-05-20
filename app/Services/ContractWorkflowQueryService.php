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
    public function getAvailableWorkflows(User $user, ?string $contractType = null): Collection
    {
        $query = Workflow::where('is_active', true);

        if ($contractType) {
            // Case-insensitive search for contract type
            $query->where(function ($q) use ($contractType) {
                $q->where('contract_type', 'ilike', $contractType)
                    ->orWhere('is_default', true); // Show global defaults as fallback
            });
        }

        return $query->where(function ($q) use ($user) {
            // Anyone can initiate if initiator_type is 'all'
            $q->where('initiator_type', 'all')
                // Check by Role
                ->orWhereHas('initiatorRolesData', function ($sq) use ($user) {
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
        })
            ->with(['steps', 'initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData'])
            ->get();
    }

    /**
     * Resolve hierarchical approver (Manager -> VP -> Director)
     */
    public function resolveHierarchyApprover(Contract $contract, int $level = 1): Collection
    {
        $initiator = $contract->initiator;
        if (! $initiator) {
            return collect();
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
        // For level 1: if staff, target is manager. if manager, target is vp.
        $targetIndex = $currentIndex + $level;
        if ($targetIndex >= count($hierarchy)) {
            $targetIndex = count($hierarchy) - 1;
        }

        $targetRole = ucfirst($hierarchy[$targetIndex]);
        $targetRoleLower = strtolower($targetRole);

        $approvers = User::where(DB::raw('LOWER(role)'), $targetRoleLower)
            ->where('department_id', $currentDeptId)
            ->where('is_active', true)
            ->get();

        // If no one in current department, maybe search in parent department or management
        if ($approvers->isEmpty() && $targetIndex > 1) {
            $approvers = User::where('role', $targetRole)->where('is_active', true)->get();
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
