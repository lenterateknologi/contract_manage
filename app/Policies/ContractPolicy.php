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

        // 2. Creator or Initiator can always view
        if ($contract->created_by === $user->id || $contract->initiated_by_id === $user->id) {
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

        // 5. Active/potential actor for the current workflow step
        if ($this->isActor($user, $contract)) {
            return true;
        }

        // 6. User has permission to read contracts module and the contract falls within their organizational scope
        if ($this->canReadInOrgScope($user, $contract)) {
            return true;
        }

        return false;
    }

    /**
     * Check if user has permission to read contracts and the contract is within their organizational scope.
     */
    private function canReadInOrgScope(User $user, Contract $contract): bool
    {
        // Check if role has read access to /contracts module
        $roleId = $user->role_id;
        if (! $roleId) {
            return false;
        }

        $canReadModule = \App\Models\AccessModule::where('role_id', $roleId)
            ->whereHas('module', fn ($q) => $q->where('route', '/contracts'))
            ->where('can_read', true)
            ->exists();

        if (! $canReadModule) {
            return false;
        }

        // Check organizational scope matching ContractFilterScopeService rules
        $settings = $user->getContractFilterSettings();
        $isGlobalFull = in_array($user->role, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);

        $contractOrg = $contract->initiator ?: $contract->creator;
        if (! $contractOrg) {
            return true;
        }

        // Department check
        $depFull = $isGlobalFull || ($settings['can_change_department'] ?? false);
        if (! $depFull) {
            $allowedDeps = array_filter(array_merge([$user->department_id], $settings['allowed_departments'] ?? []));
            if (! empty($allowedDeps) && ! in_array($contractOrg->department_id, $allowedDeps)) {
                return false;
            }
        }

        // Company check
        $compFull = $isGlobalFull || ($settings['can_change_company'] ?? false);
        if (! $compFull) {
            $allowedCompanies = array_filter(array_merge([$user->company_id], $settings['allowed_companies'] ?? []));
            if (! empty($allowedCompanies) && ! in_array($contractOrg->company_id, $allowedCompanies)) {
                return false;
            }
        }

        // Division check
        $divFull = $isGlobalFull || ($settings['can_change_division'] ?? false);
        if (! $divFull) {
            $allowedDivs = array_filter(array_merge([$user->division_id], $settings['allowed_divisions'] ?? []));
            if (! empty($allowedDivs) && ! in_array($contractOrg->division_id, $allowedDivs)) {
                return false;
            }
        }

        return true;
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
        // Admin, Super Admin, Creator, and Initiator always have upload/edit permission for contract files
        if ($user->isAdmin() || $user->isSuperAdmin() || $contract->created_by === $user->id || $contract->initiator_id === $user->id) {
            return true;
        }

        // If contract is still in initial state (no step), allow creator or admin
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
            $stepRoles = array_map('strtolower', array_filter((array) $currentStep->role));
            $roleMatches = empty($stepRoles) || in_array(strtolower((string) $user->role), $stepRoles);

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
