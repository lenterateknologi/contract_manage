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

        // Approvers can view
        if ($contract->approvals()->where('user_id', $user->id)->exists()) {
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
     * Determine whether the user can update the model's main info.
     */
    public function update(User $user, Contract $contract): bool
    {
        // If no workflow step is active, default to allowing creator
        if (! $contract->workflow_step_id) {
            return $contract->created_by === $user->id;
        }

        $canEdit = (bool) data_get($contract->workflowStep?->meta, 'allow_info_edit', true);

        return $canEdit && $this->isActor($user, $contract);
    }

    /**
     * Determine whether the user can update F1 form.
     */
    public function updateF1(User $user, Contract $contract): bool
    {
        if (! $contract->workflow_step_id) {
            return $contract->created_by === $user->id;
        }

        $canEdit = (bool) data_get($contract->workflowStep?->meta, 'allow_f1_edit', true);

        return $canEdit && $this->isActor($user, $contract);
    }

    /**
     * Determine whether the user can update F2 form.
     */
    public function updateF2(User $user, Contract $contract): bool
    {
        if (! $contract->workflow_step_id) {
            return $contract->created_by === $user->id;
        }

        $canEdit = (bool) data_get($contract->workflowStep?->meta, 'allow_f2_edit', true);

        return $canEdit && $this->isActor($user, $contract);
    }

    /**
     * Determine whether the user can update agreement/contract document.
     */
    public function updateAgreement(User $user, Contract $contract): bool
    {
        if (! $contract->workflow_step_id) {
            return $contract->created_by === $user->id;
        }

        $canEdit = (bool) data_get($contract->workflowStep?->meta, 'allow_agreement_edit', true);

        return $canEdit && $this->isActor($user, $contract);
    }

    /**
     * Determine whether the user can update attachments.
     */
    public function updateAttachment(User $user, Contract $contract): bool
    {
        if (! $contract->workflow_step_id) {
            return $contract->created_by === $user->id;
        }

        $canEdit = (bool) data_get($contract->workflowStep?->meta, 'allow_attachment_edit', true);

        return $canEdit && $this->isActor($user, $contract);
    }

    /**
     * Determine whether the user can update contract references.
     */
    public function updateReference(User $user, Contract $contract): bool
    {
        if (! $contract->workflow_step_id) {
            return $contract->created_by === $user->id;
        }

        $canEdit = (bool) data_get($contract->workflowStep?->meta, 'allow_reference', true);

        return $canEdit && $this->isActor($user, $contract);
    }

    /**
     * Check if user is the creator or an active approver for the current step.
     */
    private function isActor(User $user, Contract $contract): bool
    {
        // Creator can always act if it's their own contract and it's in a state they can act on
        if ($contract->created_by === $user->id) {
            return true;
        }

        // Active approver for the current step
        return $contract->approvals()
            ->where('user_id', $user->id)
            ->where('workflow_step_id', $contract->workflow_step_id)
            ->where('status', 'pending')
            ->exists();
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
