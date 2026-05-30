<?php

namespace App\Formatters;

use App\Models\Contract;
use App\Models\User;
use App\Models\WorkflowStep;
use App\Services\ContractWorkflowService;
use Illuminate\Support\Facades\Auth;

class ContractFormatter
{
    public static function formatContract(Contract $c): array
    {
        $nextStep = self::getNextStep($c);
        $requiresPicAssignment = $nextStep && $nextStep->approver_type === 'assigned_pic';
        $progress = $c->progressData();

        return [
            'id' => $c->id,
            'contract_no' => $c->contract_no,
            'crown_no' => $c->crown_no,
            'title' => $c->title,
            'description' => $c->description,
            'contract_date' => $c->contract_date,
            'end_date' => $c->end_date,
            'contract_type' => $c->contractType?->name ?? '—',
            'contract_type_id' => $c->contract_type_id,
            'submission_type' => $c->submissionType?->name ?? '—',
            'submission_type_id' => $c->submission_type_id,
            'created_by' => $c->created_by,
            'transaction_type' => $c->transaction_type,
            'p1_entity' => $c->p1_entity,
            'p1_signer' => $c->p1_signer,
            'p1_signer_position' => $c->p1_signer_position,
            'p1_address' => $c->p1_address,
            'p2_entity' => $c->p2_entity,
            'p2_signer' => $c->p2_signer,
            'p2_signer_position' => $c->p2_signer_position,
            'p2_address' => $c->p2_address,
            'vendor' => $c->vendor ? [
                'id' => $c->vendor->id,
                'name' => $c->vendor->name,
                'pic_name' => $c->vendor->pic_name,
                'pic_position' => $c->vendor->pic_position,
                'address' => $c->vendor->address,
            ] : null,
            'status' => $c->status,
            'metadata' => $c->metadata ?? [],
            'display_mode' => $c->statusDetail?->display_mode ?? 'interactive',
            'allow_info_edit' => $c->workflowStep?->step === 1 || $c->status === 'draft',
            'allow_reference' => $c->workflowStep?->step === 1 || $c->status === 'draft',
            'current_version' => $c->current_version,
            'created_at' => $c->created_at->format('d/m/Y'),
            'submitted_at' => $c->submitted_at ? $c->submitted_at->format('d/m/Y H:i') : null,
            'creator' => self::formatUser($c->creator),
            'initiator' => self::formatUser($c->initiator),
            'assigned_pic' => self::formatUser($c->assignedPic),
            'assigned_by' => self::formatUser($c->assignedBy)
                ?: ($c->approvals->where('sequence', 3)->where('status', 'approved')->first()
                    ? self::formatUser($c->approvals->where('sequence', 3)->where('status', 'approved')->first()->approver)
                    : null),
            'initiated_by_id' => $c->initiated_by_id,
            'kop_sub_topik' => $c->kop_sub_topik,
            'parent_id' => $c->parent_id,
            'parent' => $c->parent ? [
                'id' => $c->parent->id,
                'contract_no' => $c->parent->contract_no,
                'title' => $c->parent->title,
            ] : null,
            'progress' => $progress,
            'workflow_id' => $c->workflow_id,
            'workflow_step_id' => $c->workflow_step_id,
            'workflow' => $c->workflow ? [
                'id' => $c->workflow->id,
                'name' => $c->workflow->name,
                'contract_type' => $c->workflow->contract_type,
                'steps' => $c->workflow->relationLoaded('steps') ? $c->workflow->steps->map(fn($s) => [
                    'id' => $s->id,
                    'step' => $s->step,
                    'description' => $s->description,
                    'step_category' => $s->step_category,
                ]) : [],
            ] : null,
            'workflow_step' => $c->workflowStep ? [
                'id' => $c->workflowStep->id,
                'step' => $c->workflowStep->step,
                'role' => is_array($c->workflowStep->role) ? implode(', ', $c->workflowStep->role) : $c->workflowStep->role,
                'description' => $c->workflowStep->description,
                'step_type' => 'APPROVAL',
                'step_category' => $c->workflowStep->step_category,
                'target_approvers' => $c->approvals->where('sequence', $c->workflowStep->step)->whereIn('status', ['pending', 'waiting'])->first()?->target_approvers,
                'actions' => $c->workflowStep->actions ? $c->workflowStep->actions->map(fn ($action) => [
                    'id' => $action->id,
                    'action_code' => $action->action_code instanceof \App\Enums\WorkflowAction ? $action->action_code->value : $action->action_code,
                    'alias' => $action->alias,
                    'next_workflow_id' => $action->next_workflow_id,
                    'next_workflow_step_id' => $action->next_workflow_step_id,
                    'assignee_config' => $action->assignee_config,
                    'required_fields' => $action->required_fields,
                    'autofilled_fields' => $action->autofilled_fields,
                    'signing_parties' => $action->signing_parties,
                ])->toArray() : [],
            ] : null,
            'next_step' => $nextStep ? [
                'id' => $nextStep->id,
                'name' => $nextStep->name,
                'approver_type' => $nextStep->approver_type,
                'department_id' => count($nextStep->department_ids ?? []) > 0 ? $nextStep->department_ids[0] : null,
                'department_ids' => $nextStep->department_ids,
                'roles' => $nextStep->role ? (is_array($nextStep->role) ? $nextStep->role : [$nextStep->role]) : [],
                'step_type' => 'APPROVAL',
                'step_category' => $nextStep->step_category,
                'meta' => $nextStep->meta ?? [],
            ] : null,
            'requires_pic_assignment' => $requiresPicAssignment,
            'versions' => $c->versions->map(fn ($v) => [
                'id' => $v->id,
                'document_type' => $v->document_type,
                'version_no' => $v->version_no,
                'file_name' => $v->file_name,
                'change_log' => $v->change_log,
                'uploaded_by' => $v->uploaded_by,
                'is_final' => (bool) $v->is_final,
                'file_hash' => $v->file_hash,
                'has_file' => (bool) $v->file_path,
                'created_at' => $v->created_at->toDateString(),
                'uploader' => self::formatUser($v->uploader),
            ])->sortByDesc('version_no')->values(),
            'approvals' => self::mapApprovalTimeline($c),
            'histories' => $c->histories->map(fn ($h) => [
                'action' => $h->action,
                'description' => $h->description,
                'actor_id' => $h->actor_id,
                'created_at' => $h->created_at->format('Y-m-d H:i'),
                'actor' => self::formatUser($h->actor),
            ])->sortByDesc('created_at')->values(),
            'messages' => $c->messages->map(fn ($m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'message' => $m->message,
                'read_by' => $m->read_by ?? [],
                'created_at' => $m->created_at->format('Y-m-d H:i'),
                'attachment_url' => $m->attachment_url,
                'attachment_name' => $m->attachment_name,
                'user' => self::formatUser($m->user),
            ]),
            'attachments' => $c->attachments->map(fn ($at) => [
                'id' => $at->id,
                'label' => $at->label,
                'category' => $at->category,
                'file_name' => $at->file_name,
                'file_type' => $at->file_type,
                'created_at' => $at->created_at->toDateString(),
                'uploader' => self::formatUser($at->uploader),
            ]),
            'form_submissions' => $c->formSubmissions->map(fn ($fs) => [
                'id' => $fs->id,
                'document_type' => $fs->document_type,
                'form_template_id' => $fs->form_template_id,
                'current_version' => $fs->current_version,
                'submitted_by' => $fs->submitted_by,
                'updated_at' => $fs->updated_at->format('Y-m-d H:i'),
            ]),
            'can_approve' => $c->approvals->where('status', 'pending')->where('user_id', Auth::id())->isNotEmpty() && ($c->status === 'in_review' || $c->status === 'revision' || $c->status === 'draft'),
            'pending_approval_id' => $c->approvals->where('status', 'pending')->where('user_id', Auth::id())->first()?->id,
        ];
    }

    public static function getNextStep(Contract $contract): ?WorkflowStep
    {
        if (! $contract->workflowStep || ! $contract->workflow) {
            return null;
        }

        return app(ContractWorkflowService::class)->findNextValidStep($contract, $contract->workflowStep);
    }

    public static function formatUser($user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'initials' => $user->initials,
            'role' => $user->role,
            'role_id' => $user->role_id,
            'department_id' => $user->department_id,
            'department_name' => $user->department?->name,
            'email' => $user->email,
            'bg_color' => $user->bg_color,
            'text_color' => $user->text_color,
        ];
    }

    public static function mapApprovalTimeline($c): array
    {
        if (! $c->workflow) {
            return [];
        }

        $timeline = [];
        $workflowSteps = $c->workflow->steps->sortBy('step');
        $workflowService = app(ContractWorkflowService::class);

        foreach ($workflowSteps as $step) {
            if (! $workflowService->shouldExecuteStep($c, $step)) {
                continue;
            }
            $approvals = $c->approvals->where('workflow_step_id', $step->id);

            $deptNames = (array) $step->department_names;
            $deptName = count($deptNames) > 0 ? implode(', ', $deptNames) : null;

            if (! $deptName && $step->approver_type === 'initiator' && $c->initiator?->department) {
                $deptName = $c->initiator->department->name;
            }

            $targetApprovers = null;
            $targetEmails = null;
            if ($step->approver_type === 'user') {
                $targetApprovers = $step->users->pluck('name')->implode(', ');
                $targetEmails = $step->users->pluck('email')->implode(', ');
            } elseif ($step->approver_type === 'atasan') {
                $approvers = $workflowService->resolveHierarchyApprover($c, $step->hierarchy_level ?: 1);
                $targetApprovers = $approvers->pluck('name')->implode(', ');
                $targetEmails = $approvers->pluck('email')->implode(', ');
            } elseif ($step->approver_type === 'initiator') {
                $targetApprovers = $c->initiator?->name;
                $targetEmails = $c->initiator?->email;
            } elseif ($step->approver_type === 'assigned_pic') {
                if ($c->assigned_pic_id) {
                    $targetApprovers = $c->assignedPic?->name;
                    $targetEmails = $c->assignedPic?->email;
                } else {
                    $targetApprovers = 'PIC (Belum Ditugaskan)';
                }
            } elseif ($step->approver_type === 'role') {
                $roles = (array) $step->role;
                $targetDeptIds = ! empty($step->department_ids) ? $step->department_ids : ($step->department_id ? [$step->department_id] : []);
                $query = User::whereIn('role', $roles);
                if (! empty($targetDeptIds)) {
                    $query->whereIn('department_id', $targetDeptIds);
                }
                $approvers = $query->get();
                if ($approvers->isEmpty()) {
                    $approvers = User::whereIn('role', $roles)->get();
                }
                $targetApprovers = $approvers->pluck('name')->implode(', ');
                $targetEmails = $approvers->pluck('email')->implode(', ');
            }

            $regularApprovals = $approvals->filter(fn ($a) => $a->role !== 'Persetujuan Tambahan');
            $adhocApprovals = $approvals->filter(fn ($a) => $a->role === 'Persetujuan Tambahan');

            if ($regularApprovals->isNotEmpty()) {
                $isRoleBased = $step->approver_type === 'role';
                $hasDecision = $regularApprovals->contains(fn ($a) => in_array($a->status, ['approved', 'rejected']));
                $isAllPending = $regularApprovals->every(fn ($a) => $a->status === 'pending');

                if ($isAllPending && $regularApprovals->count() > 1) {
                    $first = $regularApprovals->first();
                    $candidateNames = $regularApprovals->map(fn ($a) => $a->approver?->name ?? $a->approver_name)->implode(', ');
                    $candidateEmails = $regularApprovals->map(fn ($a) => $a->approver?->email)->filter()->implode(', ');

                    $timeline[] = [
                        'id' => 'step-group-' . $step->id,
                        'user_id' => null,
                        'approver_name' => $first->role,
                        'role' => $first->role,
                        'department_name' => $deptName,
                        'target_approvers' => $candidateNames ?: $targetApprovers,
                        'target_emails' => $candidateEmails ?: $targetEmails,
                        'sequence' => $step->step,
                        'status' => 'pending',
                        'comment' => null,
                        'decided_at' => null,
                        'step_type' => 'APPROVAL',
                        'step_name' => $step->name,
                        'step_description' => $step->description,
                        'approver' => null,
                    ];
                } else {
                    $approvalsToDisplay = $regularApprovals;
                    if ($isRoleBased && $hasDecision) {
                        $approvalsToDisplay = $regularApprovals->filter(fn ($a) => in_array($a->status, ['approved', 'rejected']));
                    }

                    foreach ($approvalsToDisplay as $a) {
                        $rowTargetApprovers = $targetApprovers;

                        $timeline[] = [
                            'id' => $a->id,
                            'user_id' => $a->user_id,
                            'approver_name' => $a->approver_name,
                            'role' => $a->role,
                            'department_name' => $deptName,
                            'target_approvers' => $rowTargetApprovers,
                            'target_emails' => $a->approver?->email ?: $targetEmails,
                            'sequence' => $step->step,
                            'status' => $a->status,
                            'comment' => $a->comment,
                            'decided_at' => $a->decided_at?->format('d/m/Y H:i'),
                            'created_at' => $a->created_at?->toIso8601String(),
                            'is_active' => $a->is_active,
                            'step_type' => 'APPROVAL',
                            'step_name' => $step->name,
                            'step_description' => $step->description,
                            'approver' => self::formatUser($a->approver),
                        ];
                    }
                }
            } else {
                $roleLabel = is_array($step->role) ? implode(', ', $step->role) : $step->role;
                $stepTargetApprovers = $targetApprovers;
                $approverName = 'Menunggu ' . $roleLabel;

                if ($step->approver_type === 'assigned_pic') {
                    $stepTargetApprovers = 'PIC (Belum Ditugaskan)';
                    $approverName = 'PIC (Belum Ditugaskan)';
                }

                $timeline[] = [
                    'id' => 'step-' . $step->id,
                    'user_id' => null,
                    'approver_name' => $approverName,
                    'role' => $roleLabel,
                    'department_name' => $deptName,
                    'target_approvers' => $stepTargetApprovers,
                    'target_emails' => $targetEmails,
                    'sequence' => $step->step,
                    'status' => 'SELANJUTNYA',
                    'note' => null,
                    'approved_at' => null,
                    'approver' => null,
                ];
            }

            foreach ($adhocApprovals as $a) {
                $timeline[] = [
                    'id' => $a->id,
                    'user_id' => $a->user_id,
                    'approver_name' => $a->approver_name,
                    'role' => 'Persetujuan Tambahan',
                    'department_name' => $a->approver?->department?->name ?? $deptName,
                    'target_approvers' => $a->approver_name,
                    'target_emails' => $a->approver?->email,
                    'sequence' => $step->step,
                    'status' => $a->status,
                    'comment' => $a->comment,
                    'decided_at' => $a->decided_at?->format('d/m/Y H:i'),
                    'created_at' => $a->created_at?->toIso8601String(),
                    'is_active' => $a->is_active,
                    'step_type' => 'APPROVAL',
                    'step_name' => 'Persetujuan Tambahan',
                    'step_description' => 'Persetujuan tambahan di luar alur kerja template',
                    'approver' => self::formatUser($a->approver),
                ];
            }
        }

        return $timeline;
    }
}
