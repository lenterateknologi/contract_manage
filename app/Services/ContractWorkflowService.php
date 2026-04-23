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
    protected $slaService;

    public function __construct(SLAService $slaService)
    {
        $this->slaService = $slaService;
    }

    public function sendForApproval(Contract $contract, ?string $workflowId = null, ?array $customSteps = null): Contract
    {
        // Resolve metadata info
        $metadata = request()->input('metadata', []);
        $topic = $metadata['topic'] ?? ($contract->metadata['topic'] ?? 'perjanjian');
        $now = now();

        // Get the workflow first to use its SLA settings
        $workflow = null;
        if ($workflowId) {
            $workflow = Workflow::find($workflowId);
        }

        if (!$workflow) {
            $taxRequired = $metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false);
            $typeStr = $contract->contract_type ?: ($contract->contractType ? $contract->contractType->name : 'General');
            $workflow = Workflow::getDefaultByContractType($typeStr, (bool) $taxRequired);
        }

        if (!$workflow) {
            throw new \Exception('No workflow found and no default available for this contract type.');
        }

        // Calculate Deadlines using Workflow-specific SLA settings
        $draftingHours = $workflow->sla_drafting_hours ?: 72; // fallback to 3 days
        $totalHours = $workflow->sla_total_hours ?: 240;      // fallback to 10 days
        $cutoffHour = $workflow->sla_cutoff_hour ?: 16;       // fallback to 16:00

        $draftingDeadline = $this->slaService->calculateBusinessDeadline($now, $draftingHours, $cutoffHour);
        $totalDeadline = null;
        if (strtolower($topic) !== 'review') {
            $totalDeadline = $this->slaService->calculateBusinessDeadline($now, $totalHours, $cutoffHour);
        }

        // Update metadata with SLA and flags
        $metadata = array_merge($contract->metadata ?? [], $metadata, [
            'tax_required' => $metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false),
            'topic' => $topic,
            'drafting_deadline' => $draftingDeadline->toIso8601String(),
            'total_deadline' => $totalDeadline ? $totalDeadline->toIso8601String() : null,
            'current_phase' => 'drafting',
        ]);

        $contract->update(['metadata' => $metadata]);
        $contract = $contract->fresh();

        // Clear any existing approvals before starting fresh
        $contract->approvals()->delete();

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

        // Notification for Helper Mode
        if ($contract->initiated_by_id && $contract->initiated_by_id !== $contract->created_by) {
            $contract->initiator->notify(new \App\Notifications\ContractAssignedNotification($contract));
        }

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
        } elseif (strtolower($step->role) === 'initiator') {
            // Special handling for the original initiator (proxy owner)
            $approvers = collect([$contract->initiator]);
        } elseif (strtolower($step->role) === 'manager' && $step->department_id === null) {
            // Resolution for "Manager Staff" or "Manager Initiator" (Department dynamic based on Initiator)
            $query = User::where('role', 'Manager')
                ->where('department_id', $contract->initiator->department_id);
            $approvers = $query->get();
        } else {
            // Find all users with the required role and in the same department
            $query = User::where('role', $step->role);
            
            // Prioritize step-level department, then fallback to initiator's department if not specified
            $targetDeptId = $step->department_id ?: $contract->initiator->department_id;
            
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
    public function approveContract(Contract $contract, Approval $approval, ?string $comment = null): Contract
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

                // Handle Phase Transition (Drafting -> Agreement)
                // If the step just approved was 'Legal', we move to 'agreement' phase
                if (str_contains(strtolower($approval->role), 'legal')) {
                    $metadata = $contract->metadata ?? [];
                    $metadata['current_phase'] = 'agreement';
                    $metadata['drafting_finished_at'] = now()->toIso8601String();
                    $contract->update(['metadata' => $metadata]);
                }

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
            $roleName = $contract->initiator->role ?? ''; 
            
            // Bypass logic: Skip Step 1 if submitted by Legal/Admin for others (Helper Mode)
            $creator = Auth::user();
            $isLegal = $creator && (str_contains(strtolower($creator->department?->name ?? ''), 'legal') || $creator->role === 'Admin');
            $isHelper = $contract->initiated_by_id && $contract->initiated_by_id !== $contract->created_by;
            
            if ($isLegal && $isHelper) {
                return false; // Bypass departmental review
            }

            return strtolower($roleName) === 'staff';
        }

        // Condition: Skip if initiator is Legal (used for Manager step)
        if (str_contains($condition, 'initiator_not_legal')) {
            $deptName = $contract->initiator->department->name ?? '';
            return !str_contains(strtolower($deptName), 'legal');
        }

        // Condition: Skip Management if Initiator is already Management/Direksi
        if (str_contains($condition, 'initiator_not_manager')) {
            $roleName = $contract->initiator->role ?? '';
            // If the creator is NOT a manager or director, they need management approval
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
