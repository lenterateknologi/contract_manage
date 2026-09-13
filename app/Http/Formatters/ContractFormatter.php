<?php

namespace App\Http\Formatters;

use App\Enums\WorkflowAction;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\Role;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Services\Chat\ChatService;
use App\Services\Utils\ShortIdService;
use App\Services\Workflow\ContractWorkflowService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ContractFormatter
{
    /**
     * Format a Contract for detail or list responses.
     */
    public static function formatContract(Contract $c, bool $isDetail = true): array
    {
        $c->loadMissing([
            'initiator.department', 'initiator.company',
            'creator.department', 'creator.company',
            'approvals.approver.department', 'approvals.workflowStep',
            'workflowStep.actions', 'histories.actor.department',
            'contractType', 'submissionType', 'vendor', 'parent', 'workflow.steps', 'workflow.contractType',
            'versions.uploader', 'messages.user', 'attachments.uploader', 'formSubmissions.submittedBy',
            'assignedPic.department', 'assignedBy.department', 'statusDetail',
        ]);
        $nextStep = self::getNextStep($c);
        $requiresPicAssignment = $nextStep && $nextStep->approver_type === 'assigned_pic';
        $effectiveStep = $c->workflowStep ?: ($c->workflow ? $c->workflow->steps->first() : null);
        $progress = $c->progressData();

        $shortId = ShortIdService::encode($c->id);

        return [
            'id' => $c->id,
            'short_id' => $shortId,
            'short_url' => ShortIdService::isEnabled() ? url("/contracts/{$shortId}") : url("/contracts/{$c->id}"),
            'form_no' => $c->form_no,
            'contract_no' => $c->contract_no,
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
                'code' => $c->vendor->vendor_code,
                'name' => $c->vendor->vendor_name,
                'detail' => $c->vendor->vendor_detail,
            ] : null,
            'status' => (function () use ($c, $effectiveStep) {
                if ($effectiveStep && ! empty($effectiveStep->meta['target_status']) && ! in_array($c->status, ['approved', 'rejected', 'closed', 'archived'])) {
                    $targetStatus = $effectiveStep->meta['target_status'];
                    if ($c->status !== $targetStatus) {
                        $c->update(['status' => $targetStatus]);
                        $c->status = $targetStatus;
                    }
                    return $targetStatus;
                }
                return $c->status;
            })(),
            'status_info' => (function () use ($c, $effectiveStep) {
                $statusToUse = $c->status;
                if ($effectiveStep && ! empty($effectiveStep->meta['target_status']) && ! in_array($c->status, ['approved', 'rejected', 'closed', 'archived'])) {
                    $statusToUse = $effectiveStep->meta['target_status'];
                }
                $statusDetail = ContractStatus::where('code', $statusToUse)->first() ?: $c->statusDetail;
                return $statusDetail ? [
                    'code' => data_get($statusDetail, 'code'),
                    'label' => data_get($statusDetail, 'label'),
                    'color' => data_get($statusDetail, 'color'),
                    'bg_color' => data_get($statusDetail, 'bg_color'),
                    'icon' => data_get($statusDetail, 'icon'),
                ] : null;
            })(),
            'metadata' => $c->metadata ?? [],
            'display_mode' => data_get($c->workflow?->meta, 'display_mode', 'pdf'),
            'f1_mode' => self::getEffectiveMode($c, 'f1', ($c->contractType?->getInheritedInputMechanism('f1_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
            'f1_form_template_id' => $c->contractType?->getInheritedTemplateId('f1_form_template_id'),
            'f2_mode' => self::getEffectiveMode($c, 'f2', ($c->contractType?->getInheritedInputMechanism('f2_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
            'f2_form_template_id' => $c->contractType?->getInheritedTemplateId('f2_form_template_id'),
            'contract_mode' => self::getEffectiveMode($c, 'contract', ($c->contractType?->getInheritedInputMechanism('contract_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
            'contract_form_template_id' => $c->contractType?->getInheritedTemplateId('contract_form_template_id'),
            'allow_info_edit' => (bool) data_get($effectiveStep?->meta, 'allow_info_edit', true),
            'allow_title_edit' => (bool) data_get($effectiveStep?->meta, 'allow_title_edit', true),
            'allow_vendor_edit' => (bool) data_get($effectiveStep?->meta, 'allow_vendor_edit', true),
            'allow_category_edit' => (bool) data_get($effectiveStep?->meta, 'allow_category_edit', true),
            'allow_f2_contract_no_edit' => (bool) data_get($effectiveStep?->meta, 'allow_f2_contract_no_edit', true),
            'allow_tax_toggle_edit' => (bool) data_get($effectiveStep?->meta, 'allow_tax_toggle_edit', true),
            'allow_price_edit' => (bool) data_get($effectiveStep?->meta, 'allow_price_edit', true),
            'allow_period_edit' => (bool) data_get($effectiveStep?->meta, 'allow_period_edit', true),
            'allow_f1_edit' => (bool) data_get($effectiveStep?->meta, 'allow_f1_edit', true),
            'allow_f2_edit' => (bool) data_get($effectiveStep?->meta, 'allow_f2_edit', true),
            'allow_agreement_edit' => (bool) data_get($effectiveStep?->meta, 'allow_agreement_edit', true),
            'allow_attachment_edit' => (bool) data_get($effectiveStep?->meta, 'allow_attachment_edit', true),
            'allow_reference' => (bool) data_get($effectiveStep?->meta, 'allow_reference', true),
            'show_info' => (bool) data_get($effectiveStep?->meta, 'show_info', true),
            'show_title' => (bool) data_get($effectiveStep?->meta, 'show_title', true),
            'show_vendor' => (bool) data_get($effectiveStep?->meta, 'show_vendor', true),
            'show_category' => (bool) data_get($effectiveStep?->meta, 'show_category', true),
            'show_f2_contract_no' => (bool) data_get($effectiveStep?->meta, 'show_f2_contract_no', true),
            'show_tax_toggle' => (bool) data_get($effectiveStep?->meta, 'show_tax_toggle', true),
            'show_price' => (bool) data_get($effectiveStep?->meta, 'show_price', true),
            'show_period' => (bool) data_get($effectiveStep?->meta, 'show_period', true),


            'f1_file' => $c->versions->where('document_type', 'f1')->first()?->file_name,
            'f2_file' => $c->versions->where('document_type', 'f2')->first()?->file_name,
            'agreement_file' => $c->versions->where('document_type', 'agreement')->first()?->file_name ?: ($c->versions->where('document_type', 'contract')->first()?->file_name),

            'current_version' => $c->current_version,
            'created_at' => $c->created_at->translatedFormat('j M Y, H:i'),
            'created_at_raw' => $c->created_at->toIso8601String(),
            'created_at_formatted' => $c->created_at->translatedFormat('j M Y, H:i'),
            'updated_at' => $c->updated_at->toIso8601String(),
            'updated_at_formatted' => $c->updated_at->translatedFormat('j M Y, H:i'),
            'submitted_at' => $c->submitted_at ? $c->submitted_at->translatedFormat('j M Y, H:i') : ($c->created_at ? $c->created_at->translatedFormat('j M Y, H:i') : null),
            'submitted_at_formatted' => $c->submitted_at ? $c->submitted_at->translatedFormat('j M Y, H:i') : ($c->created_at ? $c->created_at->translatedFormat('j M Y, H:i') : null),
            'creator' => self::formatUser($c->creator),
            'initiator' => self::formatUser($c->initiator),
            'assigned_pic_id' => $c->assigned_pic_id ?? ($c->metadata['assigned_pic_id'] ?? null),
            'assigned_pic' => self::formatUser($c->assignedPic),
            'assigned_at' => $c->assigned_at ? $c->assigned_at->toIso8601String() : ($c->metadata['assigned_at'] ?? null),
            'assigned_at_formatted' => $c->assigned_at ? $c->assigned_at->translatedFormat('j M Y, H:i') : (! empty($c->metadata['assigned_at']) ? Carbon::parse($c->metadata['assigned_at'])->translatedFormat('j M Y, H:i') : null),
            'pic_assigned_at' => (function () use ($c) {
                if ($c->assigned_at) {
                    return $c->assigned_at->translatedFormat('j M Y, H:i');
                }
                if (! empty($c->metadata['pic_assigned_at'])) {
                    return Carbon::parse($c->metadata['pic_assigned_at'])->translatedFormat('j M Y, H:i');
                }
                if (! empty($c->metadata['assigned_at'])) {
                    return Carbon::parse($c->metadata['assigned_at'])->translatedFormat('j M Y, H:i');
                }
                if ($c->relationLoaded('histories')) {
                    $hist = $c->histories->where('action', 'WORKFLOW_ASSIGNED')->sortByDesc('created_at')->first();
                    if ($hist && $hist->created_at) {
                        return $hist->created_at->translatedFormat('j M Y, H:i');
                    }
                }
                if ($c->assigned_pic_id || ! empty($c->metadata['assigned_pic_id'])) {
                    $hist = $c->histories()->where('action', 'WORKFLOW_ASSIGNED')->latest()->first();
                    if ($hist && $hist->created_at) {
                        return $hist->created_at->translatedFormat('j M Y, H:i');
                    }
                }

                return null;
            })(),
            'assigned_by' => self::formatUser($c->assignedBy)
                ?: ($c->approvals->where('sequence', 3)->where('status', 'approved')->first()
                    ? self::formatUser($c->approvals->where('sequence', 3)->where('status', 'approved')->first()->approver)
                    : null),
            'initiated_by_id' => $c->initiated_by_id,
            'kop_sub_topik' => $c->meta?->kop_sub_topik,
            'parent_id' => $c->parent_id,
            'parent' => $c->parent ? [
                'id' => $c->parent->id,
                'form_no' => $c->parent->form_no,
                'contract_no' => $c->parent->contract_no,
                'title' => $c->parent->title,
            ] : null,
            'progress' => $progress,
            'workflow_id' => $c->workflow_id,
            'origin_workflow_id' => $c->origin_workflow_id,
            'origin_workflow' => $c->origin_workflow_id ? [
                'id' => $c->origin_workflow_id,
                'name' => Workflow::where('id', $c->origin_workflow_id)->value('name') ?? $c->workflow?->name,
                'meta' => Workflow::where('id', $c->origin_workflow_id)->value('meta') ?? [],
            ] : null,
            'workflow_step_id' => $c->workflow_step_id,
            'workflow' => $c->workflow ? [
                'id' => $c->workflow->id,
                'name' => $c->workflow->name,
                'contract_type' => $c->workflow->relationLoaded('contractType') ? $c->workflow->contractType : null,
                'meta' => $c->workflow->meta ?? [],
                'steps' => $c->workflow->relationLoaded('steps') ? $c->workflow->steps->map(fn ($s) => [
                    'id' => $s->id,
                    'step' => $s->step,
                    'description' => $s->description,
                    'step_category' => $s->step_category,
                    'meta' => $s->meta ?? [],
                    'actions' => $s->relationLoaded('actions') ? $s->actions->sortBy(fn ($act) => (int) data_get($act->transition_config, 'order', 999))->values()->map(fn ($act) => [
                        'id' => $act->id,
                        'action_code' => $act->action_code instanceof WorkflowAction ? $act->action_code->value : $act->action_code,
                        'alias' => $act->alias,
                        'target_status' => $act->target_status,
                        'required_fields' => $act->required_fields ?? [],
                        'autofilled_fields' => $act->autofilled_fields ?? [],
                    ])->toArray() : [],
                ]) : [],
            ] : null,
            'workflow_step' => WorkflowStepFormatter::formatStep($c->workflowStep, $c),
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
                'approver_config' => $nextStep->approver_config,
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
                'created_at_raw' => $v->created_at->toIso8601String(),
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
            'messages' => (function () use ($c) {
                $chatService = app(ChatService::class);
                return $chatService->formatMessages($c->messages, Auth::id());
            })(),
            'attachments' => $c->attachments->map(fn ($at) => [
                'id' => $at->id,
                'label' => $at->label,
                'category' => $at->category,
                'file_name' => $at->file_name,
                'file_type' => $at->file_type,
                'file_size' => $at->file_path && Storage::disk('local')->exists($at->file_path)
                    ? Storage::disk('local')->size($at->file_path)
                    : null,
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
            'can_approve' => (function () use ($c) {
                if ($c->status === 'in_review' && $c->workflow_step_id && $c->workflowStep) {
                    $hasPendingOrWaiting = $c->approvals
                        ->where('workflow_step_id', $c->workflow_step_id)
                        ->whereIn('status', ['pending', 'waiting'])
                        ->isNotEmpty();

                    if (! $hasPendingOrWaiting) {
                        app(ContractWorkflowService::class)->createApprovalForStep($c, $c->workflowStep);
                        $c->unsetRelation('approvals');
                        $c->load(['approvals.approver', 'approvals.workflowStep']);
                    }
                }

                return $c->approvals->where('status', 'pending')->where('user_id', Auth::id())->filter(function ($a) use ($c) {
                    if ($a->sub_step !== null) {
                        return true;
                    }
                    $hasUnapprovedSubSteps = $c->approvals
                        ->where('workflow_step_id', $a->workflow_step_id)
                        ->whereNotNull('sub_step')
                        ->contains(fn ($sub) => $sub->status !== 'approved');

                    return ! $hasUnapprovedSubSteps;
                })->isNotEmpty();
            })(),
            'pending_approval_id' => $c->approvals->where('status', 'pending')->where('user_id', Auth::id())->filter(function ($a) use ($c) {
                if ($a->sub_step !== null) {
                    return true;
                }
                $hasUnapprovedSubSteps = $c->approvals
                    ->where('workflow_step_id', $a->workflow_step_id)
                    ->whereNotNull('sub_step')
                    ->contains(fn ($sub) => $sub->status !== 'approved');

                return ! $hasUnapprovedSubSteps;
            })->first()?->id,
            'unread_count' => (int) ($c->unread_count ?? 0),
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

    /**
     * Delegate user formatting to UserFormatter.
     */
    public static function formatUser($user): ?array
    {
        return UserFormatter::format($user);
    }

    /**
     * Delegate approval timeline mapping to ApprovalTimelineFormatter.
     */
    public static function mapApprovalTimeline(Contract $c, bool $isDetail = true): array
    {
        return ApprovalTimelineFormatter::map($c, $isDetail);
    }

    private static function getEffectiveMode(Contract $c, string $type, string $default): string
    {
        // 1. Check if interactive data exists (form submissions)
        $hasInteractive = $c->formSubmissions->where('document_type', $type)->isNotEmpty();
        if ($hasInteractive) {
            return 'interactive';
        }

        // 2. Check if uploaded files exist (versions)
        $docType = $type === 'contract' ? 'agreement' : $type;
        $hasUpload = $c->versions->where('document_type', $docType)->isNotEmpty();
        if ($hasUpload) {
            return 'upload';
        }

        // 3. Fallback to current workflow setting (for new data)
        return $default;
    }
}
