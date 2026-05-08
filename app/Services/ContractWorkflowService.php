<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\Approval;
use App\Models\ContractType;
use App\Models\ContractStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
            throw new \Exception('Alur kerja tidak ditemukan dan tidak ada alur default untuk tipe kontrak ini.');
        }

        // Special logic for NDA - recording only, directly to archived
        if (strtolower($topic) === 'nda') {
            $contract->update([
                'status' => 'archived',
                'workflow_id' => $workflow->id,
                'workflow_step_id' => null,
                'submitted_at' => now(),
            ]);

            $contract->histories()->create([
                'action' => 'CONTRACT_ARCHIVED',
                'description' => 'NDA Langsung diarsipkan (Recording Only)',
                'actor_id' => Auth::id(),
            ]);

            return $contract->fresh();
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

        // Handle initial step skipping (e.g. if initiator is already sending, skip redundant self-approval)
        while ($firstStep) {
            // Check if step should be executed based on conditions
            if (!$this->shouldExecuteStep($contract, $firstStep)) {
                $firstStep = $this->findNextValidStep($contract, $firstStep);
                continue;
            }

            break;
        }

        if (!$firstStep) {
            throw new \Exception('Tidak ada tahapan alur kerja yang valid untuk permintaan ini.');
        }

        // Update contract with workflow info and submission timestamp
        $contract->update([
            'workflow_id' => $workflow->id,
            'workflow_step_id' => $firstStep->id,
            'status' => $firstStep->step === 1 ? 'draft' : 'in_review',
            'submitted_at' => $firstStep->step === 1 ? $contract->submitted_at : now(),
        ]);

        // Create approval record for the first step
        $this->createApprovalForStep($contract, $firstStep);

        // Notification for Helper Mode
        if ($contract->initiated_by_id && $contract->initiated_by_id !== $contract->created_by) {
            if ($contract->initiator) {
                // $contract->initiator->notify(new \App\Notifications\ContractAssignedNotification($contract));
            }
        }

        // Log the action
        $this->logHistory($contract, 'CONTRACT_SENT', 'Kontrak dikirim untuk persetujuan', Auth::id());

        // Handle auto-approval if the initiator is also the first approver
        $this->handleAutoApproval($contract, Auth::user());

        return $contract->fresh();
    }

    /**
     * Create approval records for a workflow step
     */
    public function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {
        // Get roles list (handle both array and string cases)
        $roles = (array)$step->role;
        $lowerRoles = array_map('strtolower', $roles);
        $approvers = collect();

        // Special handling for joint_upload (SEQ 12 flow)
        if ($step->step_category === 'joint_upload') {
            $metadata = $contract->metadata ?? [];
            $order = $metadata['step_12_order'] ?? null;
            $finished = $metadata['step_12_finished'] ?? [];

            if ($order) {
                $remaining = array_diff($order, $finished);
                if (!empty($remaining)) {
                    $nextActorKey = array_values($remaining)[0];
                    if ($nextActorKey === 'initiator') {
                        $approvers = collect([$contract->initiator]);
                        $roles = ['Initiator'];
                    } else {
                        // Legal PIC
                        $picId = $metadata['assigned_pic_id'] ?? null;
                        $pic = $picId ? User::find($picId) : null;
                        $approvers = $pic ? collect([$pic]) : collect();
                        $roles = ['Staff Legal'];
                    }
                }
            }
        }

        // Special handling for SIGNING (Dual-Party Signing)
        if ($step->step_type === 'SIGNING') {
            $metadata = $contract->metadata ?? [];
            $signing = $metadata['signing_state'] ?? ['phase' => 'SETUP', 'progress' => 0];
            $phase = $signing['phase'] ?? 'SETUP';

            if ($phase === 'SETUP') {
                if ($step->approver_type === 'assigned_pic' && $contract->assigned_pic_id) {
                    $pic = User::find($contract->assigned_pic_id);
                    $approvers = $pic ? collect([$pic]) : collect();
                } else {
                    // Anyone in Legal can perform SETUP
                    $query = User::whereIn('role', ['Staff Legal', 'Admin']);
                    if ($step->department_id) {
                        $query->where('department_id', $step->department_id);
                    }
                    $approvers = $query->get();
                }
                $roles = ['Staff Legal (Setup)'];
            } elseif ($phase === 'P1_PENDING') {
                $p1UserId = $signing['p1_user_id'] ?? null;
                $approvers = $p1UserId ? collect([User::find($p1UserId)]) : collect();
                $roles = ['Pihak 1'];
            } elseif ($phase === 'P2_PENDING') {
                $p2UserId = $signing['p2_user_id'] ?? null;
                $approvers = $p2UserId ? collect([User::find($p2UserId)]) : collect();
                $roles = ['Pihak 2'];
            }
        }

        // Determine approvers based on approver_type (Strategy)
        if ($approvers->isEmpty()) {
            if ($step->approver_type === 'atasan') {
                // Hierarchical resolution
                $approvers = $this->resolveHierarchyApprover($contract, $step->hierarchy_level ?: 1);
            } elseif ($step->approver_type === 'user') {
                $approvers = $step->users;
            } elseif ($step->approver_type === 'initiator' || in_array('initiator', $lowerRoles)) {
                // Special handling for the original initiator (proxy owner)
                $approvers = collect([$contract->initiator]);
            } else {
                // Check for assigned PIC from metadata or contract column (Assignment flow)
                $metadata = $contract->metadata ?? [];
                $picId = $contract->assigned_pic_id ?? ($metadata['assigned_pic_id'] ?? null);
                
                if ($step->approver_type === 'assigned_pic' && $picId) {
                    $pic = User::find($picId);
                    if ($pic) {
                        $approvers = collect([$pic]);
                    }
                }

                if ($approvers->isEmpty()) {
                    // Find all users with any of the required roles and in the same department
                    $query = User::whereIn('role', $roles);
                    
                    // Prioritize step-level departments via pivot, then fallback to single column
                    $targetDeptIds = !empty($step->department_ids) ? $step->department_ids : ($step->department_id ? [$step->department_id] : []);
                    
                    if (!empty($targetDeptIds)) {
                        $query->whereIn('department_id', $targetDeptIds);
                    }
                    
                    $approvers = $query->get();

                    // Final fallback: if no specific department match found, only get role-based
                    if ($approvers->isEmpty()) {
                        $approvers = User::whereIn('role', $roles)->get();
                    }
                }
            }
        }

        // INJECT: Additional Management Approvers (from contract metadata)
        // Only apply to steps involving high-level management roles
        if ($this->isManagementStep($step)) {
            $metadata = $contract->metadata ?? [];
            $customUserIds = $metadata['custom_management_users'] ?? [];
            
            if (!empty($customUserIds) && is_array($customUserIds)) {
                $customUsers = User::whereIn('id', $customUserIds)->where('is_active', true)->get();
                // Merge while ensuring unique user IDs
                $approvers = $approvers->concat($customUsers)->unique('id');
            }
        }

        foreach ($approvers as $approver) {
            Approval::create([
                'contract_id' => $contract->id,
                'workflow_step_id' => $step->id,
                'user_id' => $approver->id,
                'approver_name' => $approver->name,
                'role' => count($roles) > 0 ? $roles[0] : 'Approver',
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
    public function approveContract(Contract $contract, Approval $approval, ?string $comment = null, ?string $attachmentPath = null, ?string $assignedPicId = null, ?string $executionOrder = null): Contract
    {
        // 1. DUP PREVENTION: Check if this approval is already decided or if the step is already completed for role-based workflows
        if (!in_array($approval->status, ['pending', 'waiting'])) {
            return $contract;
        }

        $isRoleBased = $approval->workflowStep->approver_type === 'role';
        
        // For role-based, if another record for this step is already approved, bypass
        if ($isRoleBased) {
            $alreadyApproved = $contract->approvals()
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->where('status', 'approved')
                ->exists();
            
            if ($alreadyApproved) {
                // If somehow this one was still pending but another one approved, just mark this one as 'skipped' or delete it
                $approval->delete();
                return $contract;
            }
        }

        // Mark this approval as approved
        $approval->approve($comment, $attachmentPath);

        // Log the action
        $this->logHistory($contract, 'APPROVAL_APPROVED', "Disetujui oleh {$approval->approver_name} ({$approval->role})", Auth::id());

        // Handle PIC Assignment if provided (Step 3 flow)
        if ($assignedPicId) {
            $metadata = $contract->metadata ?? [];
            $metadata['assigned_pic_id'] = $assignedPicId;
            $metadata['assigned_by_id'] = Auth::id();

            $contract->update([
                'assigned_pic_id' => $assignedPicId,
                'assigned_by_id' => Auth::id(),
                'metadata' => $metadata
            ]);
            
            $pic = User::find($assignedPicId);
            $this->logHistory($contract, 'WORKFLOW_ASSIGNED', "PIC ditugaskan ke: " . ($pic ? $pic->name : $assignedPicId), Auth::id());
        }

        // Check if all approvals for current step are complete
        // LOGIC CHANGE: For 'role' type approvals, any ONE person can approve to move the workflow.
        // For 'user' type approvals, ALL specified users must approve.
        $currentStepApprovals = $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->get();

        $isRoleBased = $approval->workflowStep->approver_type === 'role';
        
        $allApproved = $isRoleBased 
            ? $currentStepApprovals->contains(fn($a) => $a->status === 'approved')
            : $currentStepApprovals->every(fn($a) => $a->status === 'approved');

        // SPECIAL LOGIC: Joint Upload (SEQ 12)
        if ($approval->workflowStep->step_category === 'joint_upload') {
            $metadata = $contract->metadata ?? [];
            
            // If order not set yet, Legal PIC just chose
            if (!isset($metadata['step_12_order'])) {
                $order = $executionOrder ?? 'legal_first';
                $metadata['step_12_order'] = ($order === 'initiator_first') ? ['initiator', 'legal'] : ['legal', 'initiator'];
                $metadata['step_12_finished'] = [];
                
                if ($order === 'legal_first') {
                    $metadata['step_12_finished'][] = 'legal';
                }
                
                $contract->update(['metadata' => $metadata]);
                $this->logHistory($contract, 'WORKFLOW_ORDER_SET', "Urutan penyelesaian diatur: " . ($order === 'initiator_first' ? 'Inisiator dulu' : 'Legal dulu'), Auth::id());
                
                // Check if more actors remaining
                $remaining = array_diff($metadata['step_12_order'], $metadata['step_12_finished']);
                if (!empty($remaining)) {
                    $this->createApprovalForStep($contract, $approval->workflowStep);
                    return $contract->fresh();
                }
            } else {
                // Subsequent actor finishing
                $isInitiator = $approval->user_id === $contract->initiated_by_id;
                $actorKey = $isInitiator ? 'initiator' : 'legal';
                
                $finished = $metadata['step_12_finished'] ?? [];
                $finished[] = $actorKey;
                $metadata['step_12_finished'] = array_unique($finished);
                $contract->update(['metadata' => $metadata]);
                
                $remaining = array_diff($metadata['step_12_order'], $metadata['step_12_finished']);
                if (!empty($remaining)) {
                    $this->createApprovalForStep($contract, $approval->workflowStep);
                    return $contract->fresh();
                }
            }
            
            // If we reach here, all joint steps are finished
            $allApproved = true;
        }

        // SPECIAL LOGIC: Physical Signing (SIGNING)
        if ($approval->workflowStep->step_type === 'SIGNING') {
            $metadata = $contract->metadata ?? [];
            $signing = $metadata['signing_state'] ?? ['phase' => 'SETUP', 'progress' => 0];
            $phase = $signing['phase'] ?? 'SETUP';

            if ($phase === 'SETUP') {
                // Transition to P1_PENDING
                // p1_user_id and p2_user_id should have been passed from request
                $p1UserId = request()->input('p1_user_id');
                $p2UserId = request()->input('p2_user_id');
                
                $signing['phase'] = 'P1_PENDING';
                $signing['p1_user_id'] = $p1UserId;
                $signing['p2_user_id'] = $p2UserId;
                $signing['progress'] = 0;
                $signing['setup_at'] = now()->toIso8601String();
                $signing['setup_by'] = Auth::id();

                $metadata['signing_state'] = $signing;
                $contract->update(['metadata' => $metadata]);
                
                $p1 = User::find($p1UserId);
                $p2 = User::find($p2UserId);
                $this->logHistory($contract, 'SIGNING_SETUP', "Delegasi Penandatanganan: P1 ({$p1?->name}) & P2 ({$p2?->name})", Auth::id());

                $this->createApprovalForStep($contract, $approval->workflowStep);
                return $contract->fresh();
            } elseif ($phase === 'P1_PENDING') {
                // P1 uploaded their version
                $signing['phase'] = 'P2_PENDING';
                $signing['progress'] = 50;
                $signing['p1_finished_at'] = now()->toIso8601String();
                
                $metadata['signing_state'] = $signing;
                $contract->update(['metadata' => $metadata]);
                
                $this->logHistory($contract, 'SIGNING_P1_COMPLETE', "Pihak 1 telah mengunggah dokumen ttd (Progres 50%)", Auth::id());

                $this->createApprovalForStep($contract, $approval->workflowStep);
                return $contract->fresh();
            } elseif ($phase === 'P2_PENDING') {
                // P2 uploaded final version
                $signing['phase'] = 'COMPLETED';
                $signing['progress'] = 100;
                $signing['p2_finished_at'] = now()->toIso8601String();
                
                $metadata['signing_state'] = $signing;
                $contract->update(['metadata' => $metadata]);
                
                $this->logHistory($contract, 'SIGNING_COMPLETED', "Penandatanganan selesai (Progres 100%)", Auth::id());
                
                $allApproved = true;
            }
        }

        if ($allApproved) {
            // If role-based and finished by one, delete others
            if ($isRoleBased) {
                $contract->approvals()
                    ->where('workflow_step_id', $approval->workflow_step_id)
                    ->whereIn('status', ['pending', 'waiting'])
                    ->delete();
            }

            // Update metadata if needed (Phase Transition)
            $isLegalStep = str_contains(strtolower($approval->role), 'legal') || 
                          str_contains(strtolower($approval->workflowStep?->description ?? ''), 'legal');
                          
            if ($isLegalStep) {
                $metadata = $contract->metadata ?? [];
                $metadata['current_phase'] = 'agreement';
                $metadata['drafting_finished_at'] = now()->toIso8601String();
                $contract->update(['metadata' => $metadata]);
            }

            // Move to next valid step (supporting branched logic)
            $nextStep = $this->findNextValidStep($contract, $approval->workflowStep);

            if ($nextStep) {
                // Update contract with next step and status from that step
                $statusId = $nextStep->status_id ?: $contract->status_id;
                
                $contract->update([
                    'workflow_step_id' => $nextStep->id,
                    'status_id' => $statusId,
                    // Backward compatibility for status string if exists
                    'status' => $nextStep->status ? $nextStep->status->code : $contract->status,
                ]);

                // Create approvals for next step
                $this->createApprovalForStep($contract, $nextStep);

                // Log the transition
                $this->logHistory($contract, 'WORKFLOW_ADVANCED', "Alur kerja berlanjut ke tahap {$nextStep->step}: {$nextStep->description}", Auth::id());

                // Recursive Auto-Approval: If the current user is also an approver for the next step,
                // and it's a pure review step, approve it automatically.
                $this->handleAutoApproval($contract, Auth::user());
            } else {
                // No more steps - contract is approved or archived
                // Check if the final step had a specific status (like 'archived' for CLOSING steps)
                $finalStatusId = $approval->workflowStep->status_id;
                $finalStatus = $approval->workflowStep->status;

                if ($approval->workflowStep->step_type === 'CLOSING' && $finalStatus) {
                    $contract->update([
                        'status_id' => $finalStatus->id,
                        'status' => $finalStatus->code,
                        'workflow_step_id' => null,
                    ]);
                    $this->logHistory($contract, 'CONTRACT_COMPLETED', 'Alur kerja selesai (Arsip).', Auth::id());
                } else {
                    $approvedStatus = ContractStatus::where('code', 'approved')->first();
                    $contract->update([
                        'status' => 'approved',
                        'status_id' => $approvedStatus?->id,
                        'workflow_step_id' => null,
                    ]);
                    $this->logHistory($contract, 'CONTRACT_APPROVED', 'Seluruh persetujuan selesai. Kontrak disetujui.', Auth::id());
                }
            }
        }

        return $contract->fresh();
    }

    /**
     * Reject a contract and move it back to drafting/revision
     */
    public function rejectContract(Contract $contract, Approval $approval, string $reason, ?string $attachmentPath = null): Contract
    {
        // Mark approval as rejected
        $approval->reject($reason, $attachmentPath);

        // CLEANUP: If this step had multiple potential approvers, delete the other pending ones
        Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('status', 'pending')
            ->delete();

        $currentStep = $approval->workflowStep;
        $targetSequence = $currentStep->reject_target;
        
        $description = "Rejected by {$approval->approver_name} ({$approval->role}): {$reason}.";

        if ($targetSequence) {
            // Find the target step by sequence number in the same workflow
            $targetStep = WorkflowStep::where('workflow_id', $currentStep->workflow_id)
                ->where('step', $targetSequence)
                ->first();
                
            if ($targetStep) {
                $statusId = $targetStep->status_id;
                if (!$statusId) {
                    $revisionStatus = ContractStatus::where('code', 'revision')->first();
                    $statusId = $revisionStatus?->id;
                }
                $contract->update([
                    'workflow_step_id' => $targetStep->id,
                    'status_id' => $statusId,
                    'status' => $targetStep->status ? $targetStep->status->code : 'revision',
                ]);
                
                // Create new approval for the target step
                $this->createApprovalForStep($contract, $targetStep);
                
                $description .= " Sent back to Step {$targetSequence}: {$targetStep->description}.";
            } else {
                // Fallback to revision (initiator) if target step sequence not found
                $revisionStatus = ContractStatus::where('code', 'revision')->first();
                $contract->update([
                    'status' => 'revision',
                    'status_id' => $revisionStatus?->id,
                    'workflow_step_id' => null,
                ]);
                $description .= " Sent back to Initiator (Target Step {$targetSequence} not found).";
            }
        } else {
            // Standard return to initiator (No target defined) - Point to Step 1
            $targetStep = WorkflowStep::where('workflow_id', $contract->workflow_id)
                ->where('step', 1)
                ->first();

            $revisionStatus = ContractStatus::where('code', 'revision')->first();
            $contract->update([
                'status' => 'revision',
                'status_id' => $revisionStatus?->id,
                'workflow_step_id' => $targetStep ? $targetStep->id : null,
            ]);
            $description .= " Sent back to Initiator for revision at Step 1.";
        }

        // Reject all other pending approvals for this step
        $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('status', 'pending')
            ->get()
            ->each(fn($a) => $a->reject('Ditolak oleh ' . $approval->approver_name));

        // Log the action
        $this->logHistory($contract, 'APPROVAL_REJECTED', $description, Auth::id());

        return $contract->fresh();
    }

    /**
     * Finds the next step in the sequence that satisfies its entry conditions.
     */
    public function findNextValidStep(Contract $contract, WorkflowStep $currentStep): ?WorkflowStep
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

    /**
     * Determine if a workflow step should be executed based on conditions
     */
    public function shouldExecuteStep(Contract $contract, WorkflowStep $step): bool
    {
        // Condition: Optional Step (e.g. Tax)
        if ($step->is_optional) {
            $selectedOptionalSteps = $contract->metadata['optional_steps'] ?? [];
            return in_array($step->id, $selectedOptionalSteps);
        }

        $condition = $step->condition_expression ?? '';

        // Dynamic Meta Key logic: if condition is set and not a special 'initiator_' keyword
        if (!empty($condition) && !str_starts_with($condition, 'initiator_')) {
            $metadata = $contract->metadata ?? [];
            $val = $metadata[$condition] ?? null;

            // If the meta key exists and is truthy, the step is active
            if (in_array($val, [true, 'true', 1, '1', 'on', 'yes'], true)) {
                return true;
            }
            
            // Otherwise, skip the step
            return false;
        }

        // Condition: Direct Supervisor Review (only if initiator is Staff)
        if (str_contains($condition, 'initiator_is_staff')) {
            $roleName = $contract->initiator->role ?? ''; 
            
            // Bypass logic: Skip Step 1 if submitted by Legal/Admin for others (Helper Mode)
            $creator = Auth::user();
            $isLegal = $creator && ($creator->department?->code === 'LGL' || $creator->role === 'Admin');
            $isHelper = $contract->initiated_by_id && $contract->initiated_by_id !== $contract->created_by;
            
            if ($isLegal && $isHelper) {
                return false; // Bypass departmental review
            }

            return strtolower($roleName) === 'staff';
        }

        // Condition: Skip if initiator is Legal (used for Manager step)
        if (str_contains($condition, 'initiator_not_legal')) {
            return ($contract->initiator->department?->code !== 'LGL');
        }

        // Condition: Skip Management if Initiator is already Management/Direksi
        if (str_contains($condition, 'initiator_not_manager')) {
            $roleName = strtolower($contract->initiator->role ?? '');
            // If the creator is NOT a manager or director, they need management approval
            $exemptRoles = ['manager', 'director', 'direktur', 'direksi', 'admin'];
            return !in_array($roleName, $exemptRoles);
        }

        // If no recognized condition, execute by default
        return true;
    }

    /**
     * Resolve specific reviewer names based on dynamic mapping or search.
     * This replaces the previous hardcoded logic for specific names.
     */
    public function resolveSpecialReviewer(Contract $contract, string $reviewerName): ?User
    {
        return User::where('name', 'ilike', $reviewerName)
            ->where('is_active', true)
            ->first();
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

    /**
     * Get workflows available for a specific user to initiate
     */
    public function getAvailableWorkflows(User $user, ?string $contractType = null): Collection
    {
        $query = Workflow::where('is_active', true);
        
        if ($contractType) {
            // Case-insensitive search for contract type
            $query->where(function($q) use ($contractType) {
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
            ->with(['steps', 'steps.selectionRules', 'initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData'])
            ->get();
    }

    /**
     * Handles automatic approval if the current user is also an approver for the next step(s).
     * This prevents redundant work for the same person in consecutive review steps.
     */
    private function handleAutoApproval(Contract $contract, ?User $user)
    {
        if (!$user) return;

        // Find pending approvals for this user in the CURRENT step
        $pendingApprovals = $contract->approvals()
            ->where('workflow_step_id', $contract->workflow_step_id)
            ->where('status', 'pending')
            ->where('user_id', $user->id)
            ->get();

        foreach ($pendingApprovals as $approval) {
            // Only auto-approve if it's a review-only step (no drafting/upload actions needed)
            $step = $approval->workflowStep;
            // Standardized types: APPROVAL, REVIEW, UPLOAD, CLOSING, SELECTION, SIGNING
            // We EXCLUDE UPLOAD and SIGNING from auto-approval as they require physical actions/files
            $autoApproveTypes = ['REVIEW', 'APPROVAL', 'SELECTION'];
            
            if (in_array(strtoupper($step->step_type), $autoApproveTypes)) {
                $this->approveContract($contract, $approval, 'Sistem: Persetujuan Otomatis (Sama dengan penyetujui/inisiator sebelumnya)');
            }
        }
    }

    /**
     * Resolve hierarchical approver (Manager -> VP -> Director)
     */
    public function resolveHierarchyApprover(Contract $contract, int $level = 1): Collection
    {
        $initiator = $contract->initiator;
        if (!$initiator) return collect();

        $currentDeptId = $initiator->department_id;
        $initiatorRole = strtolower($initiator->role ?? '');

        // Define hierarchy order
        $hierarchy = ['staff', 'manager', 'vp', 'director'];
        
        // Find current level index
        $currentIndex = array_search($initiatorRole, $hierarchy);
        if ($currentIndex === false) $currentIndex = -1;

        // Target level is relative to current role or absolute hierarchy level
        // For level 1: if staff, target is manager. if manager, target is vp.
        $targetIndex = $currentIndex + $level;
        if ($targetIndex >= count($hierarchy)) $targetIndex = count($hierarchy) - 1;

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
        $roles = array_map('strtolower', (array)$step->role);
        $depts = array_map('strtolower', (array)$step->department_names);

        return str_contains($condition, 'has_tax') || 
               str_contains($condition, 'pajak') ||
               str_contains($condition, 'meta_is_tax') ||
               str_contains($name, 'tax') ||
               str_contains($name, 'pajak') ||
               collect($roles)->contains(fn($r) => str_contains($r, 'tax') || str_contains($r, 'pajak')) ||
               collect($depts)->contains(fn($d) => str_contains($d, 'tax') || str_contains($d, 'pajak'));
    }

    /**
     * Helper to identify if a step involves high-level management
     */
    public function isManagementStep(WorkflowStep $step): bool
    {
        $managementRoles = ['director', 'vp', 'coo', 'direksi', 'direktur', 'ceo', 'cfo', 'gm', 'general manager', 'management', 'manajemen'];
        $roles = array_map('strtolower', (array)$step->role);
        $name = strtolower($step->name ?? $step->description ?? '');

        // Check roles
        foreach ($roles as $role) {
            foreach ($managementRoles as $mRole) {
                if (str_contains($role, $mRole)) return true;
            }
        }

        // Check step name/description
        foreach ($managementRoles as $mRole) {
            if (str_contains($name, $mRole)) return true;
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
