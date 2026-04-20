<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\Approval;
use App\Models\ContractType;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;

class ContractWorkflowService
{
    public function sendForApproval(Contract $contract, string $workflowId = null, array $customSteps = null): Contract
    {
        // Resolve tax requirement
        $metadata = request()->input('metadata', []);
        $taxRequired = $metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false);

        // Update metadata if provided (for branching flags)
        $contract->update(['metadata' => array_merge($contract->metadata ?? [], $metadata)]);
        $contract = $contract->fresh(); // Refresh to get updated metadata

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
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            foreach ($customSteps as $index => $stepData) {
                $step = $workflow->steps()->create([
                    'step' => $index + 1,
                    'role' => $stepData['role'] ?? 'Approval Step',
                    'approver_type' => !empty($stepData['user_ids']) ? 'user' : 'role',
                    'description' => $stepData['description'] ?? "Approval step " . ($index + 1),
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                if (!empty($stepData['user_ids'])) {
                    $step->users()->sync($stepData['user_ids']);
                }
            }
        }

        // Fallback to default if no workflow selected and no custom steps
        if (!$workflow) {
            $typeStr = $contract->contract_type ?: ($contract->contractType ? $contract->contractType->name : 'General');
            $workflow = Workflow::getDefaultByContractType($typeStr, (bool) $taxRequired);
        }

        if (!$workflow) {
            throw new \Exception('No workflow found and no default available for this contract type.');
        }


        // Get first workflow step
        $firstStep = $workflow->steps()->orderBy('step')->first();

        // Handle branching for the first step (e.g. skip if condition not met)
        if ($firstStep && !$this->shouldExecuteStep($contract, $firstStep)) {
            $firstStep = $this->findNextValidStep($contract, $firstStep);
        }

        if (!$firstStep) {
            throw new \Exception('No valid workflow steps available for this request.');
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
            'actor_id' => Auth::id(),
        ]);

        return $contract->fresh();
    }

    /**
     * Create approval records for a workflow step
     */
    private function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {
        // Determine approvers
        if ($step->approver_type === 'user') {
            $approvers = $step->users;
        } else {
            // Find all users with the required role and in the same department
            $query = User::where('role', $step->role);
            
            // Prioritize step-level department, then fallback to initiator's department if not specified
            $targetDeptId = $step->department_id ?: $contract->creator->department_id;
            
            if ($targetDeptId) {
                $query->where('department_id', $targetDeptId);
            }
            
            $approvers = $query->get();
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
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'sequence'   => $step->step,
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
            'actor_id' => Auth::id(),
        ]);

        // Check if all approvals for current step are complete
        $currentStepApprovals = $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->get();

        $allApproved = $currentStepApprovals->every(fn($a) => $a->status === 'approved');

        if ($allApproved) {
            // Move to next valid step (supporting branched logic)
            $nextStep = $this->findNextValidStep($contract, $approval->workflowStep);

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
                    'actor_id' => Auth::id(),
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
                    'actor_id' => Auth::id(),
                ]);
            }
        }

        return $contract->fresh();
    }

    /**
     * Reject a contract and move it back to drafting/revision
     */
    public function rejectContract(Contract $contract, Approval $approval, string $reason): Contract
    {
        // Mark approval as rejected
        $approval->reject($reason);

        // ALWAYS return to revision (Initiator) as per BRD "Flow A"
        $contract->update([
            'status' => 'revision',
            'workflow_step_id' => null,
        ]);
        
        $description = "Rejected by {$approval->approver_name} ({$approval->role}): {$reason}. Sent back to Initiator for revision.";

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
            'actor_id' => Auth::id(),
        ]);

        return $contract->fresh();
    }

    /**
     * Finds the next step in the sequence that satisfies its entry conditions.
     */
    private function findNextValidStep(Contract $contract, WorkflowStep $currentStep): ?WorkflowStep
    {
        $allSteps = WorkflowStep::where('workflow_id', $currentStep->workflow_id)
            ->where('step', '>', $currentStep->step)
            ->orderBy('step')
            ->get();

        foreach ($allSteps as $step) {
            if ($this->shouldExecuteStep($contract, $step)) {
                return $step;
            }
        }

        return null;
    }

    private function shouldExecuteStep(Contract $contract, WorkflowStep $step): bool
    {
        $condition = $step->condition_expression ?? '';
        
        // Condition: Direct Supervisor Review (only if initiator is Staff)
        if (str_contains($condition, 'initiator_is_staff')) {
            $roleName = $contract->creator->role ?? ''; 
            return strtolower($roleName) === 'staff';
        }

        // Condition: Skip Management if Initiator is already Management/Direksi
        if (str_contains($condition, 'initiator_not_manager')) {
            $roleName = $contract->creator->role ?? '';
            // If the creator is NOT a manager or director, they need management approval
            // Positions that count as manager here: 'Manager', 'Director', 'Direktur'
            $exemptRoles = ['manager', 'director', 'direktur', 'direksi', 'admin'];
            return !in_array(strtolower($roleName), $exemptRoles);
        }

        // If no recognized condition, execute by default
        return true;
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
