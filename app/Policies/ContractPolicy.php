<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\User;

class ContractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     * Logic: Fully workflow-driven + ownership + admin override.
     */
    public function view(User $user, Contract $contract): bool
    {
        // 1. Admin/Super Admin can always view for monitoring/management
        if ($user->isAdmin()) {
            return true;
        }

        // 2. Creator can always view their own creation
        if ($contract->created_by === $user->id) {
            return true;
        }

        // 3. Anyone who is/was involved in the approval process can view
        if ($contract->approvals()->where('user_id', $user->id)->exists()) {
            return true;
        }

        // 4. Specifically assigned persons (PIC / Person who assigned it)
        if ($contract->assigned_pic_id === $user->id || $contract->assigned_by_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Main update permission (Generic)
     */
    public function update(User $user, Contract $contract): bool
    {
        return $this->canPerformEdit($user, $contract, 'allow_info_edit');
    }

    public function updateF1(User $user, Contract $contract): bool
    {
        return $this->canPerformEdit($user, $contract, 'allow_f1_edit');
    }

    public function updateF2(User $user, Contract $contract): bool
    {
        return $this->canPerformEdit($user, $contract, 'allow_f2_edit');
    }

    public function updateAgreement(User $user, Contract $contract): bool
    {
        return $this->canPerformEdit($user, $contract, 'allow_agreement_edit');
    }

    public function updateAttachment(User $user, Contract $contract): bool
    {
        return $this->canPerformEdit($user, $contract, 'allow_attachment_edit');
    }

    public function updateReference(User $user, Contract $contract): bool
    {
        return $this->canPerformEdit($user, $contract, 'allow_reference');
    }

    /**
     * Centralized workflow-driven authorization.
     * No hardcoded status checks here. Everything depends on:
     * 1. Is the action allowed in the current workflow step?
     * 2. Is the user an authorized actor for this step?
     */
    private function canPerformEdit(User $user, Contract $contract, string $metaKey): bool
    {
        // If contract is still in initial state (no step), allow creator
        if (! $contract->workflow_step_id) {
            return $contract->created_by === $user->id || $user->isAdmin();
        }

        // Check permission from workflow configuration (JSON meta)
        $isAllowedInStep = (bool) data_get($contract->workflowStep?->meta, $metaKey, true);

        return $isAllowedInStep && $this->isActor($user, $contract);
    }

    /**
     * Check if user is an authorized actor in the CURRENT workflow step.
     */
    private function isActor(User $user, Contract $contract): bool
    {
        // Admins are universal actors
        if ($user->isAdmin()) {
            return true;
        }

        // Active pending approval for this specific user
        $hasPendingApproval = $contract->approvals()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPendingApproval) {
            return true;
        }

        // Fallback: Check if user matches the role/department defined in the step
        // (Useful for "Open" steps where anyone in a department can act)
        $currentStep = $contract->workflowStep;
        if ($currentStep) {
            $stepRoles = (array) $currentStep->role;
            $roleMatches = empty($stepRoles) || in_array($user->role, $stepRoles);

            $stepDeptIds = (array) ($currentStep->department_ids ?? []);
            $userDeptId = $user->department_id;
            $deptMatches = empty($stepDeptIds) || in_array($userDeptId, $stepDeptIds);

            if ($roleMatches && $deptMatches) {
                return true;
            }
        }

        return false;
    }

    public function delete(User $user, Contract $contract): bool
    {
        return $user->isAdmin();
    }

    public function restore(User $user, Contract $contract): bool
    {
        return $user->isAdmin();
    }

    public function forceDelete(User $user, Contract $contract): bool
    {
        return $user->isSuperAdmin();
    }
}
