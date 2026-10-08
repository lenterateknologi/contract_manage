<?php

namespace App\Http\Formatters;

use App\Enums\WorkflowAction;
use App\Models\Master\Role;
use App\Models\Master\Workflow;
use App\Models\Master\WorkflowStep;
use App\Models\Transaction\Contract;
use App\Services\Utils\CurrencyUtil;
use App\Services\Utils\DateUtil;
use App\Services\Utils\FileUtil;
use App\Services\Utils\ShortIdService;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Support\Facades\Auth;

class ContractFormatter
{
    /**
     * Format a Contract for detail or list responses.
     */
    public static function formatContract(Contract $c, bool $isDetail = true): array
    {
        if ($isDetail) {
            // Auto-sync current step approvers with latest master authority & role settings
            $isActiveWorkflow = $c->workflow_step_id && $c->workflowStep && ! in_array($c->status, ['approved', 'rejected', 'finished', 'cancelled', 'draft']);
            if ($isActiveWorkflow) {
                try {
                    app(ContractWorkflowService::class)->createApprovalForStep($c, $c->workflowStep);
                    $c->unsetRelation('approvals');
                } catch (\Throwable $e) {
                    // Ignore sync errors during formatting
                }
            }

            $c->loadMissing([
                'initiator.department', 'initiator.company', 'initiator.division', 'initiator.location', 'initiator.supervisor.department', 'initiator.reportingTo.department',
                'creator.department', 'creator.company', 'creator.division', 'creator.location', 'creator.supervisor.department', 'creator.reportingTo.department',
                'approvals.approver.department', 'approvals.workflowStep.workflow.steps',
                'workflowStep.actions', 'workflowStep.workflow.steps', 'histories.actor.department',
                'contractType', 'submissionType', 'vendor', 'parent', 'workflow.steps', 'workflow.contractType',
                'versions.uploader', 'attachments.uploader', 'formSubmissions.submittedBy',
                'assignedPic.department', 'assignedPic.company', 'assignedPic.division', 'assignedPic.location', 'assignedPic.supervisor.department', 'assignedPic.reportingTo.department',
                'assignedBy.department', 'assignedBy.company', 'assignedBy.location', 'statusDetail', 'purchaseOrders.creator', 'docReviews.user',
            ]);
        }
        $nextStep = $isDetail ? self::getNextStep($c) : null;
        $requiresPicAssignment = $nextStep && $nextStep->approver_type === 'assigned_pic';
        $effectiveStep = $c->workflowStep ?: ($c->workflow && $c->workflow->relationLoaded('steps') ? $c->workflow->steps->first() : null);
        $progress = $c->progressData($isDetail);
        $shortId = ShortIdService::encode($c->id);

        if (! $isDetail) {
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
                'transaction_type' => $c->transaction_type,
                'vendor' => $c->vendor ? [
                    'id' => $c->vendor->id,
                    'code' => $c->vendor->vendor_code,
                    'name' => $c->vendor->vendor_name,
                ] : null,
                'status' => $c->status,
                'status_info' => $c->relationLoaded('statusDetail') && $c->statusDetail ? [
                    'code' => data_get($c->statusDetail, 'code'),
                    'label' => data_get($c->statusDetail, 'label'),
                    'color' => data_get($c->statusDetail, 'color'),
                    'bg_color' => data_get($c->statusDetail, 'bg_color'),
                    'icon' => data_get($c->statusDetail, 'icon'),
                ] : null,
                'creator' => UserFormatter::format($c->creator),
                'initiator' => UserFormatter::format($c->initiator),
                'assigned_pic' => UserFormatter::format($c->assignedPic),
                'progress' => $progress,
                'created_at' => $c->created_at->translatedFormat('j M Y, H:i'),
                'created_at_formatted' => $c->created_at->translatedFormat('j M Y, H:i'),
                'updated_at' => $c->updated_at->toIso8601String(),
                'updated_at_formatted' => $c->updated_at->translatedFormat('j M Y, H:i'),
                'can_approve' => (function () use ($c) {
                    if (! Auth::check()) {
                        return false;
                    }
                    $userId = Auth::id();
                    if ($c->relationLoaded('approvals')) {
                        return $c->approvals->where('workflow_step_id', $c->workflow_step_id)->where('status', 'pending')->where('user_id', $userId)->isNotEmpty();
                    }

                    return false;
                })(),
                'is_current_actor' => (function () use ($c) {
                    if (! Auth::check()) {
                        return false;
                    }
                    $userId = Auth::id();
                    if ($c->relationLoaded('approvals')) {
                        return $c->approvals->where('workflow_step_id', $c->workflow_step_id)->where('status', 'pending')->where('user_id', $userId)->isNotEmpty();
                    }

                    return false;
                })(),
                'pending_approval_id' => $c->relationLoaded('approvals')
                    ? $c->approvals->where('workflow_step_id', $c->workflow_step_id)->where('status', 'pending')->where('user_id', Auth::id())->first()?->id
                    : null,
                'unread_count' => (int) ($c->unread_count ?? 0),
            ];
        }

        $actionReqFields = [];
        if ($effectiveStep && $isDetail) {
            $actions = $effectiveStep->relationLoaded('actions') ? $effectiveStep->actions : $effectiveStep->actions()->get();
            foreach ($actions as $act) {
                if (! empty($act->required_fields) && is_array($act->required_fields)) {
                    $actionReqFields = array_merge($actionReqFields, $act->required_fields);
                }
            }
        }
        $actionReqFields = array_unique($actionReqFields);

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
            'tax_required' => (bool) $c->tax_required,
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
            'status_info' => (function () use ($c) {
                $statusDetail = $c->relationLoaded('statusDetail') ? $c->statusDetail : null;

                return $statusDetail ? [
                    'code' => data_get($statusDetail, 'code'),
                    'label' => data_get($statusDetail, 'label'),
                    'color' => data_get($statusDetail, 'color'),
                    'bg_color' => data_get($statusDetail, 'bg_color'),
                    'icon' => data_get($statusDetail, 'icon'),
                ] : null;
            })(),
            'metadata' => $c->metadata ?? [],
            'meta' => $c->metadata ?? [],
            'allow' => [
                'info_edit' => (bool) data_get($effectiveStep?->meta, 'allow_info_edit', true),
                'title_edit' => (bool) data_get($effectiveStep?->meta, 'allow_title_edit', true),
                'first_party_edit' => (bool) data_get($effectiveStep?->meta, 'allow_first_party_edit', true),
                'vendor_edit' => (bool) data_get($effectiveStep?->meta, 'allow_vendor_edit', true),
                'category_edit' => (bool) data_get($effectiveStep?->meta, 'allow_category_edit', true),
                'f2_contract_no_edit' => (bool) data_get($effectiveStep?->meta, 'allow_f2_contract_no_edit', true),
                'tax_toggle_edit' => (bool) data_get($effectiveStep?->meta, 'allow_tax_toggle_edit', true),
                'price_edit' => (bool) data_get($effectiveStep?->meta, 'allow_price_edit', true),
                'period_edit' => (bool) data_get($effectiveStep?->meta, 'allow_period_edit', true),
                'f1_edit' => (bool) data_get($effectiveStep?->meta, 'allow_f1_edit', true),
                'f2_edit' => (bool) data_get($effectiveStep?->meta, 'allow_f2_edit', true),
                'agreement_edit' => (bool) data_get($effectiveStep?->meta, 'allow_agreement_edit', true),
                'attachment_edit' => (bool) data_get($effectiveStep?->meta, 'allow_attachment_edit', true),
                'reference' => (bool) data_get($effectiveStep?->meta, 'allow_reference', true),
            ],
            // Root-level aliases for direct property access compatibility
            'allow_info_edit' => (bool) data_get($effectiveStep?->meta, 'allow_info_edit', true),
            'allow_title_edit' => (bool) data_get($effectiveStep?->meta, 'allow_title_edit', true),
            'allow_first_party_edit' => (bool) data_get($effectiveStep?->meta, 'allow_first_party_edit', true),
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
            'show' => [
                'info' => (bool) data_get($effectiveStep?->meta, 'show_info', true),
                'title' => (bool) data_get($effectiveStep?->meta, 'show_title', true),
                'first_party' => (bool) data_get($effectiveStep?->meta, 'show_first_party', true),
                'vendor' => (bool) data_get($effectiveStep?->meta, 'show_vendor', true),
                'category' => (bool) data_get($effectiveStep?->meta, 'show_category', true),
                'f2_contract_no' => (bool) data_get($effectiveStep?->meta, 'show_f2_contract_no', true),
                'tax_toggle' => (bool) data_get($effectiveStep?->meta, 'show_tax_toggle', true),
                'price' => (bool) data_get($effectiveStep?->meta, 'show_price', true),
                'period' => (bool) data_get($effectiveStep?->meta, 'show_period', true),
            ],
            'required' => [
                'f1' => (bool) (data_get($effectiveStep?->meta, 'require_f1', false) || in_array('f1', $actionReqFields)),
                'f2' => (bool) (data_get($effectiveStep?->meta, 'require_f2', false) || in_array('f2', $actionReqFields)),
                'agreement' => (bool) (data_get($effectiveStep?->meta, 'require_agreement', false) || in_array('agreement', $actionReqFields)),
                'title' => (bool) (data_get($effectiveStep?->meta, 'require_title', false) || in_array('title', $actionReqFields)),
                'first_party' => (bool) (data_get($effectiveStep?->meta, 'require_first_party', false) || in_array('first_party', $actionReqFields) || in_array('p1', $actionReqFields)),
                'vendor' => (bool) (data_get($effectiveStep?->meta, 'require_vendor', false) || in_array('vendor', $actionReqFields)),
                'category' => (bool) (data_get($effectiveStep?->meta, 'require_category', false) || in_array('category', $actionReqFields)),
                'f2_contract_no' => (bool) (data_get($effectiveStep?->meta, 'require_f2_contract_no', false) || in_array('contract_no', $actionReqFields) || in_array('f2_contract_no', $actionReqFields)),
                'tax_toggle' => (bool) (data_get($effectiveStep?->meta, 'require_tax_toggle', false) || in_array('tax_toggle', $actionReqFields) || in_array('tax', $actionReqFields)),
                'price' => (bool) (data_get($effectiveStep?->meta, 'require_price', false) || in_array('price', $actionReqFields)),
                'period' => (bool) (data_get($effectiveStep?->meta, 'require_period', false) || in_array('period', $actionReqFields)),
            ],
            'modes' => [
                'display' => data_get($c->workflow?->meta, 'display_mode', 'pdf'),
                'f1' => self::getEffectiveMode($c, 'f1', ($c->contractType?->getInheritedInputMechanism('f1_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
                'f1_form_template_id' => $c->contractType?->getInheritedTemplateId('f1_form_template_id'),
                'f2' => self::getEffectiveMode($c, 'f2', ($c->contractType?->getInheritedInputMechanism('f2_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
                'f2_form_template_id' => $c->contractType?->getInheritedTemplateId('f2_form_template_id'),
                'contract' => self::getEffectiveMode($c, 'contract', ($c->contractType?->getInheritedInputMechanism('contract_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
                'contract_form_template_id' => $c->contractType?->getInheritedTemplateId('contract_form_template_id'),
            ],
            'f1_mode' => self::getEffectiveMode($c, 'f1', ($c->contractType?->getInheritedInputMechanism('f1_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
            'f1_form_template_id' => $c->contractType?->getInheritedTemplateId('f1_form_template_id'),
            'f2_mode' => self::getEffectiveMode($c, 'f2', ($c->contractType?->getInheritedInputMechanism('f2_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
            'f2_form_template_id' => $c->contractType?->getInheritedTemplateId('f2_form_template_id'),
            'contract_mode' => self::getEffectiveMode($c, 'contract', ($c->contractType?->getInheritedInputMechanism('contract_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
            'contract_form_template_id' => $c->contractType?->getInheritedTemplateId('contract_form_template_id'),
            'agreement_mode' => self::getEffectiveMode($c, 'contract', ($c->contractType?->getInheritedInputMechanism('contract_input_mechanism') === 'manual') ? 'interactive' : 'upload'),
            'agreement_form_template_id' => $c->contractType?->getInheritedTemplateId('contract_form_template_id'),
            'f1_file' => $c->relationLoaded('versions') ? $c->versions->where('document_type', 'f1')->first()?->file_name : null,
            'f2_file' => $c->relationLoaded('versions') ? $c->versions->where('document_type', 'f2')->first()?->file_name : null,
            'agreement_file' => $c->relationLoaded('versions') ? ($c->versions->where('document_type', 'agreement')->first()?->file_name ?: ($c->versions->where('document_type', 'contract')->first()?->file_name)) : null,

            'current_version' => $c->current_version,
            'created_at' => DateUtil::format($c->created_at),
            'created_at_raw' => $c->created_at->toIso8601String(),
            'created_at_formatted' => DateUtil::format($c->created_at),
            'updated_at' => $c->updated_at->toIso8601String(),
            'updated_at_formatted' => DateUtil::format($c->updated_at),
            'submitted_at' => DateUtil::format($c->submitted_at ?? $c->created_at),
            'submitted_at_formatted' => DateUtil::format($c->submitted_at ?? $c->created_at),
            'creator' => UserFormatter::format($c->creator),
            'initiator' => UserFormatter::format($c->initiator),
            'assigned_pic' => UserFormatter::format($c->assignedPic),
            'assigned_at' => $c->assigned_at ? $c->assigned_at->toIso8601String() : ($c->metadata['assigned_at'] ?? null),
            'assigned_at_formatted' => DateUtil::format($c->assigned_at ?? ($c->metadata['assigned_at'] ?? null)),
            'pic_assigned_at' => (function () use ($c, $isDetail) {
                if ($c->assigned_at) {
                    return DateUtil::format($c->assigned_at);
                }
                if (! empty($c->metadata['pic_assigned_at'])) {
                    return DateUtil::format($c->metadata['pic_assigned_at']);
                }
                if (! empty($c->metadata['assigned_at'])) {
                    return DateUtil::format($c->metadata['assigned_at']);
                }
                if ($c->relationLoaded('histories')) {
                    $hist = $c->histories->where('action', 'WORKFLOW_ASSIGNED')->sortByDesc('created_at')->first();
                    if ($hist && $hist->created_at) {
                        return DateUtil::format($hist->created_at);
                    }
                }
                if ($isDetail && ($c->assigned_pic_id || ! empty($c->metadata['assigned_pic_id']))) {
                    $hist = $c->histories()->where('action', 'WORKFLOW_ASSIGNED')->latest()->first();
                    if ($hist && $hist->created_at) {
                        return DateUtil::format($hist->created_at);
                    }
                }

                return null;
            })(),
            'finished_at' => $c->finished_at ? $c->finished_at->toIso8601String() : ($c->metadata['finished_at'] ?? ($c->metadata['finish_at'] ?? null)),
            'finished_at_formatted' => DateUtil::format($c->finished_at ?? ($c->metadata['finished_at'] ?? ($c->metadata['finish_at'] ?? null))),
            'closed_at' => $c->closed_at ? $c->closed_at->toIso8601String() : ($c->metadata['closed_at'] ?? null),
            'closed_at_formatted' => DateUtil::format($c->closed_at ?? ($c->metadata['closed_at'] ?? null)),
            'submission_age' => DateUtil::duration($c->created_at, $c->closed_at),
            'pic_age' => DateUtil::duration($c->assigned_at, $c->finished_at),
            'assigned_by' => ($c->relationLoaded('assignedBy') && $c->assignedBy)
                ? UserFormatter::format($c->assignedBy)
                : (($c->relationLoaded('approvals') && $c->approvals->where('sequence', 3)->where('status', 'approved')->first())
                    ? UserFormatter::format($c->approvals->where('sequence', 3)->where('status', 'approved')->first()->approver)
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
            'purchase_orders' => ($isDetail && $c->relationLoaded('purchaseOrders')) ? $c->purchaseOrders->map(fn ($po) => [
                'id' => $po->id,
                'po_number' => $po->po_number,
                'title' => $po->title,
                'po_date' => $po->po_date?->format('Y-m-d'),
                'amount' => (float) $po->amount,
                'currency' => $po->currency ?? 'IDR',
                'vendor_name' => $po->vendor_name,
                'status' => $po->status ?? 'active',
                'description' => $po->description,
                'file_path' => $po->file_path,
                'created_at' => $po->created_at?->toIso8601String(),
                'creator' => UserFormatter::format($po->creator),
            ])->toArray() : [],
            'progress' => $progress,
            'workflow_id' => $c->workflow_id,
            'origin_workflow_id' => $c->origin_workflow_id,
            'origin_workflow_step_id' => $c->origin_workflow_step_id,
            'is_in_sub_workflow' => (bool) ($c->is_in_sub_workflow ?? false),
            'current_sub_workflow_id' => $c->current_sub_workflow_id,
            'sub_workflow' => ($isDetail && $c->current_sub_workflow_id) ? [
                'id' => $c->current_sub_workflow_id,
                'name' => Workflow::where('id', $c->current_sub_workflow_id)->value('name'),
                'meta' => Workflow::where('id', $c->current_sub_workflow_id)->value('meta') ?? [],
            ] : null,
            'branch_step_number' => $c->branch_step_number,
            'origin_workflow' => ($isDetail && $c->origin_workflow_id) ? [
                'id' => $c->origin_workflow_id,
                'name' => Workflow::where('id', $c->origin_workflow_id)->value('name') ?? $c->workflow?->name,
                'meta' => Workflow::where('id', $c->origin_workflow_id)->value('meta') ?? [],
            ] : null,
            'origin_workflow_step' => ($isDetail && $c->origin_workflow_step_id) ? [
                'id' => $c->origin_workflow_step_id,
                'step' => $c->originWorkflowStep?->step,
                'label' => $c->originWorkflowStep?->label,
                'name' => $c->originWorkflowStep?->name,
            ] : null,
            'workflow_step_id' => $c->workflow_step_id,
            'workflow' => $c->workflow ? [
                'id' => $c->workflow->id,
                'name' => $c->workflow->name,
                'contract_type' => $c->workflow->relationLoaded('contractType') ? $c->workflow->contractType : null,
                'meta' => $c->workflow->meta ?? [],
                'steps' => ($isDetail && $c->workflow->relationLoaded('steps')) ? $c->workflow->steps->map(fn ($s) => [
                    'id' => $s->id,
                    'step' => $s->step,
                    'name' => $s->name,
                    'description' => $s->description,
                    'approver_type' => $s->approver_type,
                    'step_category' => $s->step_category,
                    'meta' => $s->meta ?? [],
                    'approver_authorities' => $s->relationLoaded('approverAuthorities') ? $s->approverAuthorities->map(fn ($auth) => [
                        'id' => $auth->id,
                        'authority_type' => $auth->authority_type,
                        'user_id' => $auth->user_id,
                        'role_id' => $auth->role_id,
                        'department_id' => $auth->department_id,
                        'division_id' => $auth->division_id,
                    ])->toArray() : [],
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
            'versions' => $isDetail ? $c->versions->map(fn ($v) => [
                'id' => $v->id,
                'document_type' => $v->document_type,
                'version_no' => $v->version_no,
                'workflow_step_id' => $v->workflow_step_id,
                'step_number' => $v->step_number,
                'workflow_iteration' => $v->workflow_iteration,
                'file_name' => $v->file_name,
                'change_log' => $v->change_log,
                'uploaded_by' => $v->uploaded_by,
                'is_final' => (bool) $v->is_final,
                'file_hash' => $v->file_hash,
                'has_file' => (bool) $v->file_path,
                'created_at' => $v->created_at->toDateString(),
                'created_at_raw' => $v->created_at->toIso8601String(),
                'uploader' => UserFormatter::format($v->uploader),
            ])->sortByDesc('version_no')->values() : [],
            'approvals' => $isDetail ? ApprovalTimelineFormatter::map($c, $isDetail) : [],
            'histories' => $isDetail ? $c->histories->map(fn ($h) => [
                'action' => $h->action,
                'description' => $h->description,
                'actor_id' => $h->actor_id,
                'created_at' => $h->created_at->format('Y-m-d H:i'),
                'actor' => UserFormatter::format($h->actor),
            ])->sortByDesc('created_at')->values() : [],
            'attachments' => $isDetail ? $c->attachments->map(fn ($at) => [
                'id' => $at->id,
                'label' => $at->label,
                'category' => $at->category,
                'file_name' => $at->file_name,
                'file_type' => $at->file_type,
                'file_size' => FileUtil::size($at->file_path),
                'created_at' => $at->created_at->toDateString(),
                'uploader' => UserFormatter::format($at->uploader),
            ]) : [],
            'form_submissions' => $isDetail ? $c->formSubmissions->map(fn ($fs) => [
                'id' => $fs->id,
                'document_type' => $fs->document_type,
                'form_template_id' => $fs->form_template_id,
                'current_version' => $fs->current_version,
                'workflow_step_id' => $fs->workflow_step_id,
                'step_number' => $fs->step_number,
                'workflow_iteration' => $fs->workflow_iteration,
                'submitted_by' => $fs->submitted_by,
                'updated_at' => $fs->updated_at->format('Y-m-d H:i'),
            ]) : [],
            'can_approve' => (function () use ($c) {
                if (! Auth::check()) {
                    return false;
                }
                $userId = Auth::id();
                if ($c->relationLoaded('approvals')) {
                    $hasPending = $c->approvals->where('workflow_step_id', $c->workflow_step_id)->where('status', 'pending')->where('user_id', $userId)->isNotEmpty();
                    if ($hasPending) {
                        return true;
                    }
                }
                $isActiveWorkflow = $c->workflow_step_id && $c->workflowStep && ! in_array($c->status, ['approved', 'rejected', 'finished', 'cancelled', 'draft']);
                if ($isActiveWorkflow) {
                    $resolved = app(ContractWorkflowService::class)->resolveApproversForStep($c, $c->workflowStep);

                    return collect($resolved['approvers'] ?? [])->pluck('id')->contains($userId);
                }

                return false;
            })(),
            'is_current_actor' => (function () use ($c) {
                if (! Auth::check()) {
                    return false;
                }
                $userId = Auth::id();
                if ($c->relationLoaded('approvals')) {
                    $hasPending = $c->approvals->where('workflow_step_id', $c->workflow_step_id)->where('status', 'pending')->where('user_id', $userId)->isNotEmpty();
                    if ($hasPending) {
                        return true;
                    }
                }
                $isActiveWorkflow = $c->workflow_step_id && $c->workflowStep && ! in_array($c->status, ['approved', 'rejected', 'finished', 'cancelled', 'draft']);
                if ($isActiveWorkflow) {
                    $resolved = app(ContractWorkflowService::class)->resolveApproversForStep($c, $c->workflowStep);

                    return collect($resolved['approvers'] ?? [])->pluck('id')->contains($userId);
                }

                return false;
            })(),
            'pending_approval_id' => $c->relationLoaded('approvals')
                ? ($c->approvals->where('workflow_step_id', $c->workflow_step_id)->where('status', 'pending')->where('user_id', Auth::id())->first()?->id
                    ?? $c->approvals->where('workflow_step_id', $c->workflow_step_id)->where('user_id', Auth::id())->first()?->id)
                : null,
            'unread_count' => (int) ($c->unread_count ?? 0),
            'doc_reviews' => $isDetail ? (function () use ($c) {
                $reviewsMap = [];
                // 1. From relational database table t_contract_doc_reviews
                if ($c->relationLoaded('docReviews') && $c->docReviews) {
                    foreach ($c->docReviews as $review) {
                        $sKey = $review->workflow_step_id ? 'step_'.$review->workflow_step_id : 'general';
                        if (! isset($reviewsMap[$sKey])) {
                            $reviewsMap[$sKey] = [];
                        }
                        $reviewsMap[$sKey][$review->document_type] = [
                            'reviewed' => true,
                            'reviewed_at' => $review->reviewed_at?->toIso8601String(),
                            'user_id' => $review->user_id,
                            'user_name' => $review->user_name ?? $review->user?->name,
                            'user_role' => $review->user_role ?? $review->user?->role,
                            'ip_address' => $review->ip_address,
                            'user_agent' => $review->user_agent,
                            'device' => data_get($review->metadata, 'device', 'Web'),
                        ];
                    }
                }
                // 2. Merge with metadata if not already present
                $metaReviews = data_get($c->metadata, 'doc_reviews', []);
                if (is_array($metaReviews)) {
                    foreach ($metaReviews as $sKey => $docs) {
                        if (! isset($reviewsMap[$sKey])) {
                            $reviewsMap[$sKey] = [];
                        }
                        if (is_array($docs)) {
                            foreach ($docs as $docType => $val) {
                                if (! isset($reviewsMap[$sKey][$docType])) {
                                    $reviewsMap[$sKey][$docType] = $val;
                                }
                            }
                        }
                    }
                }

                return $reviewsMap;
            })() : [],
        ];
    }

    public static function parsePrice(?string $price): float
    {
        return CurrencyUtil::parse($price);
    }

    public static function getNextStep(Contract $contract): ?WorkflowStep
    {
        if (! $contract->workflowStep || ! $contract->workflow) {
            return null;
        }

        return app(ContractWorkflowService::class)->findNextValidStep($contract, $contract->workflowStep);
    }

    private static function getEffectiveMode(Contract $c, string $type, string $default): string
    {
        // 1. Check if interactive data exists (form submissions)
        $hasInteractive = $c->relationLoaded('formSubmissions')
            ? $c->formSubmissions->where('document_type', $type)->isNotEmpty()
            : false;
        if ($hasInteractive) {
            return 'interactive';
        }

        // 2. Check if uploaded files exist (versions)
        $docType = $type === 'contract' ? 'agreement' : $type;
        $hasUpload = $c->relationLoaded('versions')
            ? $c->versions->where('document_type', $docType)->isNotEmpty()
            : false;
        if ($hasUpload) {
            return 'upload';
        }

        // 3. Fallback to current workflow setting (for new data)
        return $default;
    }
}
