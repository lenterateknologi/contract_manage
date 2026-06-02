<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\Role;
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
     */
    public function view(User $user, Contract $contract): bool
    {
        // Admin can view everything
        if ($user->role === Role::ADMIN || $user->role === Role::SUPER_ADMIN) {
            return true;
        }

        // Creator can view their own contracts
        if ($contract->created_by === $user->id) {
            return true;
        }

        // Only allow viewing drafts if you are the creator or admin
        if ($contract->status === 'draft') {
            return false;
        }

        // Pic or Manager can view
        if ($contract->assigned_pic_id === $user->id || $contract->manager_id === $user->id) {
            return true;
        }

        // Approvers can view
        if ($contract->approvals()->where('user_id', $user->id)->exists()) {
            return true;
        }

        // Role/Dept based visibility (implement based on business rules if needed)

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
     * Determine whether the user can update the model.
     */
    public function update(User $user, Contract $contract): bool
    {
        // Admin can always update
        if ($user->role === Role::ADMIN || $user->role === Role::SUPER_ADMIN) {
            return true;
        }

        // If no workflow step is active, default to allowing creator if still draft
        if (! $contract->workflow_step_id) {
            return $contract->created_by === $user->id && $contract->status === 'draft';
        }

        // Use granular permissions from workflow step
        // We assume the user is authorized to perform the update if the workflow step says so,
        // but typically we should also check if the user is an active approver or the creator.

        $canEditInfo = (bool) data_get($contract->workflowStep?->meta, 'allow_info_edit', true);

        // Basic check: Must be the creator OR an active approver for this step
        $isCreator = $contract->created_by === $user->id;
        $isApprover = $contract->approvals()->where('user_id', $user->id)->where('workflow_step_id', $contract->workflow_step_id)->where('status', 'pending')->exists();

        return $canEditInfo && ($isCreator || $isApprover);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Contract $contract): bool
    {
        return $user->role === Role::ADMIN || $user->role === Role::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Contract $contract): bool
    {
        return $user->role === Role::ADMIN || $user->role === Role::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Contract $contract): bool
    {
        return $user->role === Role::ADMIN || $user->role === Role::SUPER_ADMIN;
    }
}
