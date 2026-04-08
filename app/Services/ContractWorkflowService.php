<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\Approval;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ContractWorkflowService
{
    /**
     * Send contract for approval (initiate workflow)
     */
    public function sendForApproval(Contract $contract): Contract
    {
        // Get default workflow for contract type
        $workflow = Workflow::getDefaultByContractType($contract->contract_type);

        if (!$workflow) {
            throw new \Exception('No default workflow found for contract type: ' . $contract->contract_type);
        }

        // Get first workflow step
        $firstStep = $workflow->steps()->orderBy('step')->first();

        if (!$firstStep) {
            throw new \Exception('No workflow steps defined for this workflow');
        }

        // Update contract with workflow info and submission timestamp
        $contract->update([
            'workflow_id' => $workflow->id,
            'workflow_step_id' => $firstStep->id,
            'status' => 'in_review',
            'submitted_at' => now(),
        ]);

        // Create approval record for the first step
        $this->createApprovalForStep($contract, $firstStep);

        // Log the action
        $contract->histories()->create([
            'action' => 'CONTRACT_SENT',
            'description' => 'Contract sent for approval',
            'actor_id' => auth()->id(),
        ]);

        return $contract->fresh();
    }

    /**
     * Create approval records for a workflow step
     */
    private function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {
        // Find all users with the required role
        $approvers = User::where('role', $step->role)->get();

        foreach ($approvers as $approver) {
            Approval::create([
                'contract_id' => $contract->id,
                'workflow_step_id' => $step->id,
                'user_id' => $approver->id,
                'approver_name' => $approver->name,
                'role' => $step->role,
                'job_title' => $approver->job_title ?? null,
                'status' => 'pending',
            ]);
        }
    }

    /**
     * Approve a contract (handles approval and moves to next step if all approved)
     */
    public function approveContract(Contract $contract, Approval $approval, string $comment = null): Contract
    {
        // Mark this approval as approved
        $approval->approve($comment);

        // Log the action
        $contract->histories()->create([
            'action' => 'APPROVAL_APPROVED',
            'description' => "Approved by {$approval->approver_name} ({$approval->role})",
            'actor_id' => auth()->id(),
        ]);

        // Check if all approvals for current step are complete
        $currentStepApprovals = $contract->workflowApprovals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->get();

        $allApproved = $currentStepApprovals->every(fn($a) => $a->status === 'approved');

        if ($allApproved) {
            // Move to next step
            $nextStep = $approval->workflowStep->nextStep();

            if ($nextStep) {
                // Update contract with next step
                $contract->update([
                    'workflow_step_id' => $nextStep->id,
                ]);

                // Create approvals for next step
                $this->createApprovalForStep($contract, $nextStep);

                // Log the transition
                $contract->histories()->create([
                    'action' => 'WORKFLOW_ADVANCED',
                    'description' => "Workflow advanced to step {$nextStep->step}: {$nextStep->description}",
                    'actor_id' => auth()->id(),
                ]);
            } else {
                // No more steps - contract is approved
                $contract->update([
                    'status' => 'approved',
                ]);

                // Log completion
                $contract->histories()->create([
                    'action' => 'CONTRACT_APPROVED',
                    'description' => 'All approvals completed. Contract approved.',
                    'actor_id' => auth()->id(),
                ]);
            }
        }

        return $contract->fresh();
    }

    /**
     * Reject a contract and move it back to draft
     */
    public function rejectContract(Contract $contract, Approval $approval, string $reason): Contract
    {
        // Mark approval as rejected
        $approval->reject($reason);

        // Reset contract to draft status
        $contract->update([
            'status' => 'revision',
            'workflow_step_id' => null,
        ]);

        // Reject all other pending approvals for this step
        $contract->workflowApprovals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('status', 'pending')
            ->each(fn($a) => $a->reject('Rejected by ' . $approval->approver_name));

        // Log the action
        $contract->histories()->create([
            'action' => 'APPROVAL_REJECTED',
            'description' => "Rejected by {$approval->approver_name} ({$approval->role}): {$reason}",
            'actor_id' => auth()->id(),
        ]);

        return $contract->fresh();
    }

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
        return Contract::whereHas('workflowApprovals', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->where('status', 'pending');
        })
            ->with('workflow', 'workflowStep', 'workflowApprovals')
            ->get();
    }
}
