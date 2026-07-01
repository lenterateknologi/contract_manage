<?php

namespace App\Http\Formatters;

use App\Enums\WorkflowAction;
use App\Models\Contract;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkflowStep;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Support\Facades\Auth;

class ContractFormatter
{
    public static function formatContract(Contract $c, bool $isDetail = true): array
    {
        $c->loadMissing([
            'initiator.department', 'initiator.company',
            'creator.department', 'creator.company',
            'approvals.approver.department', 'approvals.workflowStep',
            'workflowStep.actions', 'histories.actor.department',
            'contractType', 'submissionType', 'vendor.documents', 'parent', 'workflow.steps',
            'versions.uploader', 'messages.user', 'attachments.uploader', 'formSubmissions.submittedBy',
            'assignedPic.department', 'assignedBy.department',
        ]);
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
            'contract_type' => $c->contractType->name ?? '—',
            'contract_type_id' => $c->contract_type_id,
            'submission_type' => $c->submissionType->name ?? '—',
            'submission_type_id' => $c->submission_type_id,
            'created_by' => $c->created_by,
            'transaction_type' => $c->transaction_type,
            'p1_entity' => $c->meta?->p1_entity,
            'p1_signer' => $c->meta?->p1_signer,
            'p1_signer_position' => $c->meta?->p1_signer_position,
            'p1_address' => $c->meta?->p1_address,
            'p2_entity' => $c->meta?->p2_entity,
            'p2_signer' => $c->meta?->p2_signer,
            'p2_signer_position' => $c->meta?->p2_signer_position,
            'p2_address' => $c->meta?->p2_address,
            'vendor_id' => $c->vendor_id,
            'vendor' => $c->vendor ? [
                'id' => $c->vendor->id,
                'name' => $c->vendor->name,
                'pic_name' => $c->vendor->pic_name,
                'pic_position' => $c->vendor->pic_position,
                'address' => $c->vendor->address,
                'documents' => $c->vendor->relationLoaded('documents') ? $c->vendor->documents : [],
            ] : null,
            'status' => $c->status,
            'metadata' => $c->metadata ?? [],
            'display_mode' => data_get($c->workflow?->meta, 'display_mode', 'pdf'),
            'f1_mode' => self::getEffectiveMode($c, 'f1', data_get($c->workflow?->meta, 'f1_mode', 'upload')),
            'f1_form_template_id' => data_get($c->workflow?->meta, 'f1_form_template_id'),
            'f2_mode' => self::getEffectiveMode($c, 'f2', data_get($c->workflow?->meta, 'f2_mode', 'upload')),
            'f2_form_template_id' => data_get($c->workflow?->meta, 'f2_form_template_id'),
            'contract_mode' => self::getEffectiveMode($c, 'contract', data_get($c->workflow?->meta, 'contract_mode', 'upload')),
            'contract_form_template_id' => data_get($c->workflow?->meta, 'contract_form_template_id'),
            'allow_info_edit' => (bool) data_get($c->workflowStep?->meta, 'allow_info_edit', true),
            'allow_f1_edit' => (bool) data_get($c->workflowStep?->meta, 'allow_f1_edit', true),
            'allow_f2_edit' => (bool) data_get($c->workflowStep?->meta, 'allow_f2_edit', true),
            'allow_agreement_edit' => (bool) data_get($c->workflowStep?->meta, 'allow_agreement_edit', true),
            'allow_attachment_edit' => (bool) data_get($c->workflowStep?->meta, 'allow_attachment_edit', true),
            'allow_reference' => (bool) data_get($c->workflowStep?->meta, 'allow_reference', true),

            // Specialized permissions
            'can_fill_crown_no' => Auth::user()?->role === Role::ADMIN || Auth::user()?->role === 'Legal Staff' || Auth::user()?->role === 'PIC Legal',
            'can_set_digital_signature' => Auth::user()?->role === Role::ADMIN || Auth::user()?->role === 'PIC Legal',

            'current_version' => $c->current_version,
            'created_at' => $c->created_at->format('d/m/Y'),
            'updated_at' => $c->updated_at->toIso8601String(),
            'updated_at_formatted' => $c->updated_at->format('d/m/Y H:i'),
            'submitted_at' => $c->submitted_at ? $c->submitted_at->format('d/m/Y H:i') : null,
            'creator' => self::formatUser($c->creator),
            'initiator' => self::formatUser($c->initiator),
            'assigned_pic' => self::formatUser($c->assignedPic),
            'assigned_by' => self::formatUser($c->assignedBy)
                ?: ($c->approvals->where('sequence', 3)->where('status', 'approved')->first()
                    ? self::formatUser($c->approvals->where('sequence', 3)->where('status', 'approved')->first()->approver)
                    : null),
            'initiated_by_id' => $c->initiated_by_id,
            'kop_sub_topik' => $c->meta?->kop_sub_topik,
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
                'contract_type' => $c->workflow->contractType,
                'meta' => $c->workflow->meta ?? [],
                'steps' => $c->workflow->relationLoaded('steps') ? $c->workflow->steps->map(fn ($s) => [
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
                'actions' => $c->workflowStep->actions->map(function ($action) {
                    /* @var \App\Models\WorkflowStepAction $action */
                    $code = $action->action_code instanceof WorkflowAction ? $action->action_code->value : $action->action_code;

                    return [
                        'id' => $action->id,
                        'action_code' => $code,
                        'master_action_code' => $code,
                        'alias' => $action->alias,
                        'next_workflow_id' => $action->next_workflow_id,
                        'next_workflow_step_id' => $action->next_workflow_step_id,
                        'next_step_id' => $action->next_step_id,
                        'assignee_config' => $action->assignee_config,
                        'transition_config' => $action->transition_config,
                        'required_fields' => $action->required_fields,
                        'autofilled_fields' => $action->autofilled_fields,
                        'signing_parties' => $action->signing_parties,
                    ];
                })->toArray(),
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
            'approvals' => self::mapApprovalTimeline($c, $isDetail),
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
            'can_approve' => Auth::user()?->isAdmin() || $c->approvals->where('status', 'pending')->where('user_id', Auth::id())->filter(function ($a) use ($c) {
                if ($a->sub_step !== null) {
                    return true;
                }
                $hasUnapprovedSubSteps = $c->approvals
                    ->where('sequence', $a->sequence)
                    ->whereNotNull('sub_step')
                    ->contains(fn ($sub) => $sub->status !== 'approved');

                return ! $hasUnapprovedSubSteps;
            })->isNotEmpty(),
            'pending_approval_id' => $c->approvals->where('status', 'pending')->where('user_id', Auth::id())->filter(function ($a) use ($c) {
                if ($a->sub_step !== null) {
                    return true;
                }
                $hasUnapprovedSubSteps = $c->approvals
                    ->where('sequence', $a->sequence)
                    ->whereNotNull('sub_step')
                    ->contains(fn ($sub) => $sub->status !== 'approved');

                return ! $hasUnapprovedSubSteps;
            })->first()?->id,
        ];
    }

    public static function parsePrice(?string $price): float
    {
        if (empty($price)) {
            return 0.0;
        }
        $clean = preg_replace('/[^\d.,]/', '', $price);
        $hasDot = str_contains($clean, '.');
        $hasComma = str_contains($clean, ',');

        if ($hasDot && $hasComma) {
            if (strpos($clean, '.') < strpos($clean, ',')) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasComma) {
            if (preg_match('/,\d{2}$/', $clean)) {
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasDot) {
            if (substr_count($clean, '.') > 1) {
                $clean = str_replace('.', '', $clean);
            } else {
                if (preg_match('/\.\d{3}$/', $clean)) {
                    $clean = str_replace('.', '', $clean);
                }
            }
        }

        return (float) $clean;
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

        $attributes = $user->getAttributes();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'initials' => array_key_exists('initials', $attributes) ? $user->initials : ($user->getAttribute('initials') ?? ''),
            'role' => array_key_exists('role', $attributes) ? $user->role : null,
            'role_id' => array_key_exists('role_id', $attributes) ? $user->role_id : null,
            'department_id' => $user->division_id ?? (array_key_exists('department_id', $attributes) ? $user->department_id : null),
            'department_name' => $user->relationLoaded('department') ? $user->department?->name : null,
            'email' => $user->email,
        ];
    }

    private static function getEffectiveMode(Contract $c, string $type, string $default): string
    {
        // 1. Check if interactive data exists (form submissions)
        // Ensure relation is loaded or check DB
        $hasInteractive = $c->formSubmissions->where('document_type', $type)->isNotEmpty();
        if ($hasInteractive) {
            return 'interactive';
        }

        // 2. Check if uploaded files exist (versions)
        // Normalize 'contract' to 'agreement' document_type in versions table
        $docType = $type === 'contract' ? 'agreement' : $type;
        $hasUpload = $c->versions->where('document_type', $docType)->isNotEmpty();
        if ($hasUpload) {
            return 'upload';
        }

        // 3. Fallback to current workflow setting (for new data)
        return $default;
    }

    public static function mapApprovalTimeline($c, bool $isDetail = true): array
    {
        if (! $c->workflow) {
            return [];
        }

        $timeline = [];
        $workflowSteps = $c->workflow->steps->sortBy('step');
        $workflowService = app(ContractWorkflowService::class);

        foreach ($workflowSteps as $step) {
            $isStepSkipped = ! $workflowService->shouldExecuteStep($c, $step);

            $regularApprovals = $c->approvals->where('workflow_step_id', $step->id)->filter(fn ($a) => $a->role !== Role::ADHOC_APPROVER && $a->role !== 'Penandatangan');
            $adhocApprovals = $c->approvals->where('workflow_step_id', $step->id)->filter(fn ($a) => $a->role === Role::ADHOC_APPROVER || $a->role === 'Penandatangan');

            $deptNames = (array) $step->department_names;
            $deptName = count($deptNames) > 0 ? implode(', ', $deptNames) : null;

            if (! $deptName && $step->approver_type === 'initiator' && $c->initiator?->department) {
                $deptName = $c->initiator->department->name;
            }

            $targetApprovers = null;
            $targetEmails = null;

            // Resolve potential approvers for placeholders
            // Skip this heavy logic in list mode
            if ($isDetail) {
                if ($step->approver_type === 'user') {
                    $targetApprovers = $step->users->pluck('name')->implode(', ');
                    $targetEmails = $step->users->pluck('email')->implode(', ');
                } elseif ($step->approver_type === 'atasan') {
                    $approvers = $workflowService->resolveHierarchyApprover($c, $step);
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
                    $targetDeptIds = (array) ($step->department_ids ?? []);
                    $query = User::whereHas('roleRelation', fn ($q) => $q->whereIn('name', $roles));

                    $config = $step->approver_config;
                    $isInitDept = $step->filter_department || (! empty($config) && ! empty($config['is_initiator_department']));

                    if ($isInitDept) {
                        $query->where('division_id', $c->initiator->division_id ?? '00000000-0000-0000-0000-000000000000');
                    } elseif (! empty($targetDeptIds)) {
                        $query->whereIn('division_id', $targetDeptIds);
                    }

                    $initiatorCompany = $c->initiator?->company;
                    if ($step->filter_company_group || $step->filter_region) {
                        $query->whereHas('company', function ($q) use ($step, $initiatorCompany) {
                            if ($step->filter_company_group) {
                                $groupId = $initiatorCompany?->company_group_id ?? '00000000-0000-0000-0000-000000000000';
                                $q->where('company_group_id', $groupId);
                            }
                            if ($step->filter_region) {
                                $regionId = $initiatorCompany?->region_id ?? '00000000-0000-0000-0000-000000000000';
                                $q->where('region_id', $regionId);
                            }
                        });
                    }

                    if ($step->filter_company) {
                        $companyId = $c->initiator->company_id ?? '00000000-0000-0000-0000-000000000000';
                        $query->where('company_id', $companyId);
                    }

                    $approvers = $query->get();
                    $targetApprovers = $approvers->pluck('name')->implode(', ');
                    $targetEmails = $approvers->pluck('email')->implode(', ');
                }

                if (empty($targetApprovers)) {
                    $targetApprovers = 'Belum di-set';
                }
            } else {
                // List mode minimal resolution
                if ($step->approver_type === 'initiator') {
                    $targetApprovers = $c->initiator?->name;
                } elseif ($step->approver_type === 'assigned_pic' && $c->assigned_pic_id) {
                    $targetApprovers = $c->assignedPic?->name;
                } else {
                    $targetApprovers = is_array($step->role) ? implode(', ', $step->role) : $step->role;
                }
            }

            // 1. ADD AD-HOC (SUB-STEPS) FIRST - they always happen before the main step action
            foreach ($adhocApprovals as $a) {
                $isSigner = $a->role === 'Penandatangan';

                $timeline[] = [
                    'id' => $a->id,
                    'workflow_step_id' => $a->workflow_step_id,
                    'user_id' => $a->user_id,
                    'approver_name' => $a->approver_name,
                    'role' => $a->role,
                    'department_name' => $a->approver?->department->name ?? $deptName,
                    'target_approvers' => $a->approver_name,
                    'target_emails' => $a->approver?->email,
                    'sequence' => $step->step,
                    'sub_step' => $a->sub_step,
                    'status' => $a->status,
                    'comment' => $a->comment,
                    'decided_at' => $a->decided_at?->format('d/m/Y H:i'),
                    'created_at' => $a->created_at?->toIso8601String(),
                    'is_active' => $a->is_active,
                    'step_type' => 'APPROVAL',
                    'step_name' => $isSigner ? $a->role : Role::ADHOC_APPROVER,
                    'step_description' => $isSigner ? 'Proses penandatanganan dokumen' : 'Persetujuan tambahan di luar alur kerja template',
                    'step_category' => $isSigner ? 'signing' : null,
                    'approver' => self::formatUser($a->approver),
                ];
            }

            // 2. ADD MAIN STEP (REGULAR APPROVAL OR PLACEHOLDER)
            if ($isStepSkipped) {
                // Only show skipped main step if there are no regular approvals (prevents duplicates if manually added then skipped)
                if ($regularApprovals->isEmpty()) {
                    $timeline[] = [
                        'id' => 'skipped-'.$step->id,
                        'user_id' => null,
                        'approver_name' => 'Langkah Dilewati',
                        'role' => is_array($step->role) ? implode(', ', $step->role) : $step->role,
                        'department_name' => $deptName,
                        'target_approvers' => 'Syarat tidak terpenuhi',
                        'target_emails' => null,
                        'sequence' => $step->step,
                        'status' => 'SKIPPED',
                        'note' => 'Langkah ini dilewati berdasarkan logika sistem.',
                        'step_type' => 'APPROVAL',
                        'step_name' => $step->name,
                        'step_description' => $step->description,
                        'step_category' => $step->step_category,
                    ];
                }
            } else {
                if ($regularApprovals->isNotEmpty()) {
                    $isRoleBased = $step->approver_type === 'role';
                    $hasDecision = $regularApprovals->contains(fn ($a) => in_array($a->status, ['approved', 'rejected']));

                    // Grouping for multiple pending role-based approvers
                    $isAllPending = $regularApprovals->every(fn ($a) => $a->status === 'pending');
                    if ($isAllPending && $regularApprovals->count() > 1 && $isRoleBased) {
                        $first = $regularApprovals->first();
                        $candidateNames = $regularApprovals->map(fn ($a) => $a->approver->name ?? $a->approver_name)->implode(', ');
                        $candidateEmails = $regularApprovals->map(fn ($a) => $a->approver?->email)->filter()->implode(', ');

                        $timeline[] = [
                            'id' => 'step-group-'.$step->id,
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
                            'is_active' => (bool) $first->is_active,
                            'step_type' => 'APPROVAL',
                            'step_name' => $step->name,
                            'step_description' => $step->description,
                            'step_category' => $step->step_category,
                            'approver' => null,
                        ];
                    } else {
                        $approvalsToDisplay = $regularApprovals;
                        if ($isRoleBased && $hasDecision) {
                            $approvalsToDisplay = $regularApprovals->filter(fn ($a) => in_array($a->status, ['approved', 'rejected']));
                        }

                        foreach ($approvalsToDisplay as $a) {
                            $timeline[] = [
                                'id' => $a->id,
                                'workflow_step_id' => $a->workflow_step_id,
                                'user_id' => $a->user_id,
                                'approver_name' => $a->approver_name,
                                'role' => $a->role,
                                'department_name' => $deptName,
                                'target_approvers' => $targetApprovers,
                                'target_emails' => $a->approver?->email ?: $targetEmails,
                                'sequence' => $step->step,
                                'sub_step' => $a->sub_step,
                                'status' => $a->status,
                                'comment' => $a->comment,
                                'decided_at' => $a->decided_at?->format('d/m/Y H:i'),
                                'created_at' => $a->created_at?->toIso8601String(),
                                'is_active' => $a->is_active,
                                'step_type' => 'APPROVAL',
                                'step_name' => $step->name,
                                'step_description' => $step->description,
                                'step_category' => $step->step_category,
                                'approver' => self::formatUser($a->approver),
                            ];
                        }
                    }
                } else {
                    // Placeholder for future step
                    $roleLabel = is_array($step->role) ? implode(', ', $step->role) : $step->role;
                    $stepTargetApprovers = $targetApprovers;
                    $approverName = $roleLabel;

                    if ($step->approver_type === 'assigned_pic') {
                        $stepTargetApprovers = 'PIC (Belum Ditugaskan)';
                        $approverName = 'PIC (Belum Ditugaskan)';
                    }

                    $isCurrentStep = $c->workflow_step_id === $step->id;

                    $timeline[] = [
                        'id' => 'step-'.$step->id,
                        'user_id' => null,
                        'approver_name' => $approverName,
                        'role' => $roleLabel,
                        'department_name' => $deptName,
                        'target_approvers' => $stepTargetApprovers,
                        'target_emails' => $targetEmails,
                        'sequence' => $step->step,
                        'status' => $isCurrentStep ? 'pending' : 'SELANJUTNYA',
                        'note' => null,
                        'approved_at' => null,
                        'approver' => null,
                        'is_active' => $isCurrentStep,
                        'step_type' => 'APPROVAL',
                        'step_name' => $step->name,
                        'step_description' => $step->description,
                        'step_category' => $step->step_category,
                    ];
                }
            }
        }

        return $timeline;
    }
}
