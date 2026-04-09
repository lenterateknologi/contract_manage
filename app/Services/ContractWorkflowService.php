<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\Approval;
use App\Models\ContractType;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ContractWorkflowService
{
    /**
     * Send contract for approval (initiate workflow)
     */
    public function sendForApproval(Contract $contract, string $workflowId = null, array $customSteps = null): Contract
    {
        $workflow = null;

        if ($workflowId) {
            $workflow = Workflow::find($workflowId);
        } elseif ($customSteps) {
            // Create ad-hoc workflow
            $workflow = Workflow::create([
                'contract_type' => $contract->contract_type_id ? ContractType::find($contract->contract_type_id)->name : 'General',
                'name' => 'Custom Request for ' . $contract->contract_no,
                'description' => 'Automatically generated for custom approval flow',
                'is_default' => false,
                'is_template' => false,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            foreach ($customSteps as $index => $stepData) {
                $workflow->steps()->create([
                    'step' => $index + 1,
                    'role' => $stepData['role'],
                    'user_id' => $stepData['user_id'] ?? null,
                    'description' => $stepData['description'] ?? "Approval step " . ($index + 1),
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);
            }
        }

        // Fallback to default if no workflow selected and no custom steps
        if (!$workflow) {
            $workflow = Workflow::getDefaultByContractType($contract->contract_type);
        }

        if (!$workflow) {
            throw new \Exception('No workflow found and no default available for this contract type.');
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
            'description' => 'Contract sent for approval' . ($customSteps ? ' (Custom Flow)' : ''),
            'actor_id' => auth()->id(),
        ]);

        return $contract->fresh();
    }

    /**
     * Create approval records for a workflow step
     */
    private function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {
        // Determine approvers
        if ($step->user_id) {
            $approvers = User::where('id', $step->user_id)->get();
        } else {
            // Find all users with the required role
            $approvers = User::where('role', $step->role)->get();
        }

        foreach ($approvers as $approver) {
            Approval::create([
                'contract_id' => $contract->id,
                'workflow_step_id' => $step->id,
                'user_id' => $approver->id,
                'approver_name' => $approver->name,
                'role' => $step->role,
                'job_title' => $approver->job_title ?? null,
                'status' => 'pending',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
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
        $currentStepApprovals = $contract->approvals()
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

        $currentStep = $approval->workflowStep;
        $workflow = $contract->workflow;
        
        // Find Legal step in this workflow
        $legalStep = $workflow->steps()->where('role', 'Legal')->first();

        // Determine target
        if ($currentStep->role === 'Legal' || $currentStep->step === 1 || !$legalStep) {
            // If Legal rejects, or Step 1 rejects, or no Legal step exists: Return to Initiator
            $contract->update([
                'status' => 'revision',
                'workflow_step_id' => null,
            ]);
            $description = "Rejected by {$approval->approver_name} ({$approval->role}): {$reason}. Sent back to Initiator.";
        } else {
            // Management/Direksi/Vendor rejects: Return to Legal
            $contract->update([
                'status' => 'in_review',
                'workflow_step_id' => $legalStep->id,
            ]);
            
            // Create fresh approvals for Legal
            $this->createApprovalForStep($contract, $legalStep);
            
            $description = "Rejected by {$approval->approver_name} ({$approval->role}): {$reason}. Sent back to Legal for re-review.";
        }

        // Reject all other pending approvals for this step
        $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('status', 'pending')
            ->get()
            ->each(fn($a) => $a->reject('Rejected by ' . $approval->approver_name));

        // Log the action
        $contract->histories()->create([
            'action' => 'APPROVAL_REJECTED',
            'description' => $description,
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
        return Contract::whereHas('approvals', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->where('status', 'pending');
        })
            ->with('workflow', 'workflowStep', 'approvals')
            ->get();
    }
}
