<?php

namespace App\Http\Formatters;

use App\Enums\WorkflowAction;
use App\Models\Contract;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Support\Facades\Storage;

class ApprovalTimelineFormatter
{
    /**
     * Map full approval timeline with dynamic workflow execution chunks, ad-hoc approvals, and target approver resolution.
     */
    public static function map(Contract $c, bool $isDetail = true): array
    {
        if (! $c->workflow && $c->approvals->isEmpty()) {
            return [];
        }

        $workflowService = app(ContractWorkflowService::class);

        // 1. Build chronological execution chunks based on real approval timestamps
        $executedApprovals = $c->approvals->sort(function ($a, $b) use ($c) {
            if ($a->created_at && $b->created_at && $a->created_at->ne($b->created_at)) {
                return $a->created_at <=> $b->created_at;
            }
            // If one is approved/rejected and the other is pending/waiting at same timestamp, completed one came first
            $aDone = in_array($a->status, ['approved', 'rejected']);
            $bDone = in_array($b->status, ['approved', 'rejected']);
            if ($aDone !== $bDone) {
                return $aDone ? -1 : 1;
            }
            if ($a->decided_at && $b->decided_at && $a->decided_at->ne($b->decided_at)) {
                return $a->decided_at <=> $b->decided_at;
            }
            $aWfId = $a->workflow_id ?? $a->workflowStep?->workflow_id;
            $bWfId = $b->workflow_id ?? $b->workflowStep?->workflow_id;
            if ($aWfId && $bWfId && $aWfId !== $bWfId) {
                // If returning from sub-workflow to origin, sub-workflow execution comes first
                if ($c->origin_workflow_id) {
                    if ($aWfId !== $c->origin_workflow_id) return -1;
                    if ($bWfId !== $c->origin_workflow_id) return 1;
                }
            }
            if ($a->sequence != $b->sequence) {
                return $a->sequence <=> $b->sequence;
            }
            if ($a->sub_step !== null && $b->sub_step !== null && $a->sub_step != $b->sub_step) {
                return $a->sub_step <=> $b->sub_step;
            }
            return ($a->sort_order ?? 0) <=> ($b->sort_order ?? 0);
        })->values();
        $chunks = [];

        if ($executedApprovals->isEmpty()) {
            if ($c->workflow) {
                $chunks[] = [
                    'workflow_id' => $c->workflow->id,
                    'workflow' => $c->workflow,
                    'is_current' => true,
                    'step_ids' => collect(),
                    'approvals' => collect(),
                ];
            }
        } else {
            foreach ($executedApprovals as $appr) {
                $wfId = $appr->workflow_id ?? $appr->workflowStep?->workflow_id ?? $c->workflow_id;
                $step = $appr->workflowStep;
                $wf = null;
                if ($wfId === $c->workflow_id && $c->workflow) {
                    $wf = $c->workflow;
                } elseif ($step?->relationLoaded('workflow')) {
                    $wf = $step->workflow;
                } else {
                    $wf = $step?->workflow;
                }
                if (! $wf && $c->workflow) {
                    $wf = $c->workflow;
                }

                $lastIdx = count($chunks) - 1;
                $batchNo = $appr->batch_no ?? 1;
                if ($lastIdx < 0 || $chunks[$lastIdx]['workflow_id'] !== $wfId || ($chunks[$lastIdx]['batch_no'] ?? null) !== $batchNo) {
                    $chunks[] = [
                        'workflow_id' => $wfId,
                        'workflow' => $wf,
                        'batch_no' => $batchNo,
                        'is_current' => false,
                        'step_ids' => collect($appr->workflow_step_id ? [$appr->workflow_step_id] : []),
                        'approvals' => collect([$appr]),
                    ];
                } else {
                    if ($appr->workflow_step_id && ! $chunks[$lastIdx]['step_ids']->contains($appr->workflow_step_id)) {
                        $chunks[$lastIdx]['step_ids']->push($appr->workflow_step_id);
                    }
                    $chunks[$lastIdx]['approvals']->push($appr);
                }
            }

            // Determine if the last chunk matches current contract workflow
            $lastIdx = count($chunks) - 1;
            if ($chunks[$lastIdx]['workflow_id'] === $c->workflow_id) {
                $chunks[$lastIdx]['is_current'] = true;
            } elseif ($c->workflow) {
                // If current contract workflow is not in the last chunk, append it for future/active steps
                $chunks[] = [
                    'workflow_id' => $c->workflow->id,
                    'workflow' => $c->workflow,
                    'batch_no' => $c->workflow_iteration ?? 1,
                    'is_current' => true,
                    'step_ids' => collect(),
                    'approvals' => collect(),
                ];
            }
        }

        // Handle sub-workflow origin projection
        if ($c->origin_workflow_id && $c->origin_workflow_id !== $c->workflow_id) {
            $hasOriginAtStart = ! empty($chunks) && $chunks[0]['workflow_id'] === $c->origin_workflow_id;
            $originWf = \App\Models\Workflow::with('steps.approverAuthorities.role', 'steps.approverAuthorities.division', 'steps.actions')->find($c->origin_workflow_id);

            if ($originWf) {
                if (! $hasOriginAtStart) {
                    $originStep1 = $originWf->steps->sortBy('step')->first();
                    array_unshift($chunks, [
                        'workflow_id' => $originWf->id,
                        'workflow' => $originWf,
                        'is_current' => false,
                        'step_ids' => collect($originStep1 ? [$originStep1->id] : []),
                        'approvals' => collect(),
                    ]);
                }

                $returnStepNum = 2;
                if (isset($c->metadata['branch_from_step_num'])) {
                    $returnMode = 'branch_next';
                    if ($c->workflow) {
                        $subSteps = $c->workflow->relationLoaded('steps')
                            ? $c->workflow->steps
                            : $c->workflow->steps()->with('actions')->get();
                        $subSteps->loadMissing('actions');

                        foreach ($subSteps->flatMap->actions as $act) {
                            $trans = $act->transition_config ?? [];
                            if (($trans['type'] ?? '') === 'cross_workflow' && isset($trans['return_mode'])) {
                                $returnMode = $trans['return_mode'];
                                break;
                            }
                        }
                    }
                    $returnStepNum = ($returnMode === 'branch_origin' || $returnMode === 'origin_step')
                        ? (int) $c->metadata['branch_from_step_num']
                        : (int) $c->metadata['branch_from_step_num'] + 1;
                } elseif ($c->workflow) {
                    $subSteps = $c->workflow->relationLoaded('steps')
                        ? $c->workflow->steps
                        : $c->workflow->steps()->with('actions')->get();
                    $subSteps->loadMissing('actions');

                    foreach ($subSteps->flatMap->actions as $act) {
                        $trans = $act->transition_config ?? [];
                        if (($trans['type'] ?? '') === 'cross_workflow') {
                            $wfId = $trans['workflow_id'] ?? null;
                            if ($wfId === 'origin_workflow' || $wfId === 'origin' || $wfId === $c->origin_workflow_id) {
                                if (isset($trans['sequence'])) {
                                    $returnStepNum = (int) $trans['sequence'];
                                }
                                break;
                            }
                        }
                    }
                }

                $chunks[] = [
                    'workflow_id' => $originWf->id,
                    'workflow' => $originWf,
                    'is_current' => false,
                    'is_future_origin' => true,
                    'from_step' => $returnStepNum,
                    'step_ids' => collect(),
                    'approvals' => collect(),
                ];
            }
        }

        // Normalize earlier chunks if contract returned to origin
        if (! ($c->origin_workflow_id && $c->origin_workflow_id !== $c->workflow_id)) {
            $lastIdx = count($chunks) - 1;
            for ($i = 0; $i < $lastIdx; $i++) {
                if ($chunks[$i]['workflow_id'] === $chunks[$lastIdx]['workflow_id']) {
                    $resumeStep = $chunks[$lastIdx]['approvals']->map(fn ($a) => $a->workflowStep?->step)->filter()->min() ?? ($c->workflowStep?->step ?? 1);
                    $chunks[$lastIdx]['from_step'] = $resumeStep;
                }
            }
        }

        $timeline = [];
        $globalOrder = 0;

        foreach ($chunks as $chunk) {
            $workflow = $chunk['workflow'];
            if (! $workflow) {
                continue;
            }

            $isCurrentChunk = $chunk['is_current'];
            $steps = $workflow->relationLoaded('steps')
                ? $workflow->steps->sortBy('step')
                : $workflow->steps()->with('approverAuthorities.role', 'approverAuthorities.division', 'actions', 'workflow')->orderBy('step')->get();

            $steps->loadMissing(['approverAuthorities.role', 'approverAuthorities.division', 'actions', 'workflow']);

            // Ensure every step has workflow loaded
            $steps->each(function ($step) use ($workflow) {
                if (! $step->relationLoaded('workflow')) {
                    $step->setRelation('workflow', $workflow);
                }
            });

            $currentStepObj = $steps->firstWhere('id', $c->workflow_step_id);
            $currentStepNumber = $currentStepObj ? $currentStepObj->step : ($c->workflowStep?->step ?? 0);

            if ($chunk['is_future_origin'] ?? false) {
                $fromStep = $chunk['from_step'] ?? 2;
                $stepsToProcess = $steps->filter(fn ($s) => $s->step >= $fromStep);
            } elseif (isset($chunk['from_step'])) {
                $stepsToProcess = $steps->filter(fn ($s) => $s->step >= $chunk['from_step']);
            } elseif (isset($chunk['max_step'])) {
                $stepsToProcess = $steps->filter(fn ($s) => $s->step <= $chunk['max_step'] && $chunk['step_ids']->contains($s->id));
            } elseif (! $isCurrentChunk) {
                $stepsToProcess = $steps->filter(fn ($s) => $chunk['step_ids']->contains($s->id));
            } else {
                $stepsToProcess = $steps;
            }

            foreach ($stepsToProcess as $step) {
                $isVisible = $step->getAttributes()['is_visible'] ?? $step->is_visible ?? true;
                if ($isVisible === false) {
                    continue;
                }

                $stepAuthorities = $step->relationLoaded('approverAuthorities')
                    ? $step->approverAuthorities
                    : $step->approverAuthorities()->get();

                $isAdhocStep = $stepAuthorities->contains(fn ($a) => in_array($a->authority_type, ['adhoc_approvers', 'adhoc'])) ||
                    (! empty($step->approver_config['custom']) && (in_array('adhoc_approvers', (array) $step->approver_config['custom']) || in_array('adhoc', (array) $step->approver_config['custom'])));

                $isSigningStep = $step->step_category === 'signing';

                $stepApprovals = $chunk['approvals']->where('workflow_step_id', $step->id);
                $regularApprovals = $stepApprovals->filter(fn ($a) => $a->role !== config('master.roles.adhoc_approver') && $a->role !== 'Penandatangan');
                $adhocApprovals = $stepApprovals->filter(function ($a) use ($isAdhocStep, $isSigningStep) {
                    if ($a->role === 'Penandatangan') {
                        return $isSigningStep;
                    }
                    if ($a->role === config('master.roles.adhoc_approver') || $a->role === 'Persetujuan Tambahan' || $a->sub_step !== null) {
                        return true;
                    }
                    return false;
                })->sort(function ($a, $b) {
                    if ($a->sub_step !== null && $b->sub_step !== null && $a->sub_step != $b->sub_step) {
                        return $a->sub_step <=> $b->sub_step;
                    }
                    if ($a->sort_order !== null && $b->sort_order !== null && $a->sort_order != $b->sort_order) {
                        return $a->sort_order <=> $b->sort_order;
                    }
                    return $a->created_at <=> $b->created_at;
                })->values();

                $hasApprovals = $regularApprovals->isNotEmpty() || $adhocApprovals->isNotEmpty();
                $isCurrentStep = $isCurrentChunk && ($c->workflow_step_id === $step->id);

                if (! $isCurrentChunk && ! $hasApprovals && ! $isCurrentStep && ! ($chunk['is_future_origin'] ?? false)) {
                    continue;
                }

                $isStepSkipped = ! $workflowService->shouldExecuteStep($c, $step);
                $stepLabel = data_get($step, 'label') ?: (data_get($step, 'name') ?: 'Persetujuan Step '.$step->step);

                $deptNames = (array) $step->department_names;
                $deptName = count($deptNames) > 0 ? implode(', ', $deptNames) : null;

                if (! $deptName && $step->approver_type === 'initiator' && $c->relationLoaded('initiator') && $c->initiator?->relationLoaded('department') && $c->initiator?->department) {
                    $deptName = $c->initiator->department->name;
                }

                $targetApprovers = null;
                $targetEmails = null;
                $stepSqlQueries = [];

                if ($isDetail) {
                    $resolved = $workflowService->resolveApproversForStep($c, $step);
                    $approvers = $resolved['approvers'];
                    $stepSqlQueries = $resolved['sql_queries'] ?? [];
                    $targetApprovers = $approvers->pluck('name')->implode(', ');
                    $targetEmails = $approvers->pluck('email')->implode(', ');

                    if (empty($targetApprovers)) {
                        $targetApprovers = is_array($step->role) ? implode(', ', $step->role) : ($step->role ?: null);
                    }
                } else {
                    if ($step->approver_type === 'initiator') {
                        $targetApprovers = $c->initiator?->name;
                    } elseif ($step->approver_type === 'assigned_pic' && $c->assigned_pic_id) {
                        $targetApprovers = $c->assignedPic?->name;
                    } else {
                        $targetApprovers = is_array($step->role) ? implode(', ', $step->role) : ($step->role ?: null);
                    }
                }

                $stepWorkflowPayload = [
                    'id' => $step->id,
                    'step' => $step->step,
                    'label' => $stepLabel,
                    'description' => $step->description,
                    'workflow_id' => $step->workflow_id,
                    'workflow' => [
                        'id' => $workflow->id,
                        'name' => $workflow->name,
                        'workflow_type' => data_get($workflow, 'workflow_type', 'main'),
                        'is_sub_workflow' => (data_get($workflow, 'workflow_type') === 'sub_workflow') || (bool) data_get($workflow->meta, 'is_sub_workflow', false),
                    ],
                    'meta' => $step->meta ?? [],
                    'action_configs' => $step->relationLoaded('actions') ? $step->actions->map(fn ($act) => [
                        'id' => $act->id,
                        'action_code' => $act->action_code instanceof WorkflowAction ? $act->action_code->value : $act->action_code,
                        'alias' => $act->alias,
                        'target_status' => $act->target_status,
                        'required_fields' => $act->required_fields ?? [],
                        'autofilled_fields' => $act->autofilled_fields ?? [],
                        'is_visible' => (bool) ($act->is_visible ?? true),
                    ])->toArray() : [],
                ];

                // 1. ADD AD-HOC (SUB-STEPS) FIRST
                foreach ($adhocApprovals as $a) {
                    $isSigner = $a->role === 'Penandatangan';
                    $approverDeptName = ($a->relationLoaded('approver') && $a->approver?->relationLoaded('department'))
                        ? $a->approver?->department?->name
                        : null;

                    $timeline[] = [
                        'id' => $a->id,
                        'workflow_step_id' => $a->workflow_step_id,
                        'user_id' => $a->user_id,
                        'approver_name' => $a->approver_name,
                        'role' => $a->role,
                        'department_name' => $approverDeptName ?? $deptName,
                        'target_approvers' => $a->approver_name,
                        'target_emails' => $a->approver?->email,
                        'sequence' => $step->step,
                        'sub_step' => $a->sub_step,
                        'batch_no' => $a->batch_no ?? 1,
                        'is_adhoc' => (bool) ($a->is_adhoc ?? ($a->role === 'Persetujuan Tambahan')),
                        'status' => $a->status,
                        'action_id' => $a->action_id,
                        'action_code' => $a->action_code,
                        'action_alias' => $a->action_alias,
                        'comment' => $a->comment,
                        'attachment_path' => $a->attachment_path,
                        'attachment_name' => $a->attachment_path ? basename($a->attachment_path) : null,
                        'file_size' => $a->attachment_path && Storage::disk('local')->exists($a->attachment_path)
                            ? Storage::disk('local')->size($a->attachment_path)
                            : null,
                        'has_attachment' => (bool) $a->attachment_path,
                        'decided_at' => $a->decided_at?->toIso8601String(),
                        'created_at' => $a->created_at?->toIso8601String(),
                        'is_active' => $a->is_active,
                        'step_type' => 'APPROVAL',
                        'step_name' => $isSigner ? $a->role : config('master.roles.adhoc_approver'),
                        'step_description' => $isSigner ? 'Proses penandatanganan dokumen' : 'Persetujuan tambahan di luar alur kerja template',
                        'step_category' => $isSigner ? 'signing' : null,
                        'sort_order' => $globalOrder++,
                        'workflow_step' => $stepWorkflowPayload,
                        'approver' => UserFormatter::format($a->approver),
                    ];
                }

                // 2. ADD MAIN STEP (REGULAR APPROVAL OR PLACEHOLDER)
                if ($isStepSkipped) {
                    if ($regularApprovals->isEmpty()) {
                        $timeline[] = [
                            'id' => 'skipped-'.$step->id,
                            'workflow_step_id' => $step->id,
                            'user_id' => null,
                            'approver_name' => 'Langkah Dilewati',
                            'role' => is_array($step->role) ? implode(', ', $step->role) : $step->role,
                            'department_name' => $deptName,
                            'target_approvers' => 'Syarat tidak terpenuhi',
                            'target_emails' => null,
                            'sequence' => $step->step,
                            'batch_no' => $chunk['batch_no'] ?? 1,
                            'is_adhoc' => false,
                            'status' => 'SKIPPED',
                            'note' => 'Langkah ini dilewati berdasarkan logika sistem.',
                            'step_type' => 'APPROVAL',
                            'step_name' => $stepLabel,
                            'step_description' => $step->description,
                            'step_category' => $step->step_category,
                            'sort_order' => $globalOrder++,
                            'workflow_step' => $stepWorkflowPayload,
                        ];
                    }
                } else {
                    if ($regularApprovals->isNotEmpty()) {
                        $isRoleBased = $step->approver_type === 'role';
                        $hasDecision = $regularApprovals->contains(fn ($a) => in_array($a->status, ['approved', 'rejected']));
                        $hasPending = $regularApprovals->contains(fn ($a) => in_array($a->status, ['pending', 'waiting']));

                        if ($isCurrentStep && $hasDecision && $hasPending) {
                            foreach ($regularApprovals->filter(fn ($a) => in_array($a->status, ['approved', 'rejected'])) as $a) {
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
                                    'batch_no' => $a->batch_no ?? ($chunk['batch_no'] ?? 1),
                                    'is_adhoc' => (bool) ($a->is_adhoc ?? false),
                                    'status' => $a->status,
                                    'action_id' => $a->action_id,
                                    'action_code' => $a->action_code,
                                    'action_alias' => $a->action_alias,
                                    'comment' => $a->comment,
                                    'attachment_path' => $a->attachment_path,
                                    'attachment_name' => $a->attachment_path ? basename($a->attachment_path) : null,
                                    'file_size' => $a->attachment_path && Storage::disk('local')->exists($a->attachment_path)
                                        ? Storage::disk('local')->size($a->attachment_path)
                                        : null,
                                    'has_attachment' => (bool) $a->attachment_path,
                                    'decided_at' => $a->decided_at?->toIso8601String(),
                                    'created_at' => $a->created_at?->toIso8601String(),
                                    'step_entry_at' => $a->created_at?->toIso8601String(),
                                    'is_active' => $a->is_active,
                                    'step_type' => 'APPROVAL',
                                    'step_name' => $stepLabel,
                                    'step_description' => $step->description,
                                    'step_category' => $step->step_category,
                                    'sort_order' => $globalOrder++,
                                    'workflow_step' => [
                                        'id' => $step->id,
                                        'step' => $step->step,
                                        'label' => $stepLabel,
                                        'description' => $step->description,
                                        'workflow_id' => $step->workflow_id,
                                        'workflow' => [
                                            'id' => $workflow->id,
                                            'name' => $workflow->name,
                                        ],
                                        'meta' => $step->meta ?? [],
                                        'action_configs' => $step->relationLoaded('actions') ? $step->actions->map(fn ($act) => [
                                            'id' => $act->id,
                                            'action_code' => $act->action_code instanceof WorkflowAction ? $act->action_code->value : $act->action_code,
                                            'alias' => $act->alias,
                                            'target_status' => $act->target_status,
                                            'required_fields' => $act->required_fields ?? [],
                                            'autofilled_fields' => $act->autofilled_fields ?? [],
                                            'is_visible' => (bool) ($act->is_visible ?? true),
                                        ])->toArray() : [],
                                    ],
                                    'approver' => UserFormatter::format($a->approver),
                                ];
                            }

                            $pendingItems = $regularApprovals->filter(fn ($a) => in_array($a->status, ['pending', 'waiting']));
                            $first = $pendingItems->first();
                            $candidateNames = $pendingItems->map(fn ($a) => $a->approver->name ?? $a->approver_name)->implode(', ');
                            $candidateEmails = $pendingItems->map(fn ($a) => $a->approver?->email)->filter()->implode(', ');

                            $timeline[] = [
                                'id' => 'step-group-'.$step->id,
                                'workflow_step_id' => $step->id,
                                'user_id' => null,
                                'approver_name' => $first->role,
                                'role' => $first->role,
                                'department_name' => $deptName,
                                'target_approvers' => $candidateNames ?: $targetApprovers,
                                'target_emails' => $candidateEmails ?: $targetEmails,
                                'sequence' => $step->step,
                                'batch_no' => $first->batch_no ?? ($chunk['batch_no'] ?? 1),
                                'is_adhoc' => (bool) ($first->is_adhoc ?? false),
                                'status' => 'pending',
                                'comment' => null,
                                'decided_at' => null,
                                'created_at' => null,
                                'is_active' => (bool) $first->is_active,
                                'step_type' => 'APPROVAL',
                                'step_name' => $stepLabel,
                                'step_description' => $step->description,
                                'step_category' => $step->step_category,
                                'sort_order' => $globalOrder++,
                                'workflow_step' => [
                                    'id' => $step->id,
                                    'step' => $step->step,
                                    'label' => $stepLabel,
                                    'description' => $step->description,
                                    'workflow_id' => $step->workflow_id,
                                    'workflow' => [
                                        'id' => $workflow->id,
                                        'name' => $workflow->name,
                                    ],
                                    'meta' => $step->meta ?? [],
                                    'action_configs' => $step->relationLoaded('actions') ? $step->actions->map(fn ($act) => [
                                        'id' => $act->id,
                                        'action_code' => $act->action_code instanceof WorkflowAction ? $act->action_code->value : $act->action_code,
                                        'alias' => $act->alias,
                                        'target_status' => $act->target_status,
                                        'required_fields' => $act->required_fields ?? [],
                                        'autofilled_fields' => $act->autofilled_fields ?? [],
                                        'is_visible' => (bool) ($act->is_visible ?? true),
                                    ])->toArray() : [],
                                ],
                                'approver' => null,
                            ];
                        } elseif ($regularApprovals->every(fn ($a) => $a->status === 'pending') && $regularApprovals->count() > 1 && $isRoleBased) {
                            $first = $regularApprovals->first();
                            $candidateNames = $regularApprovals->map(fn ($a) => $a->approver->name ?? $a->approver_name)->implode(', ');
                            $candidateEmails = $regularApprovals->map(fn ($a) => $a->approver?->email)->filter()->implode(', ');

                            $timeline[] = [
                                'id' => 'step-group-'.$step->id,
                                'workflow_step_id' => $step->id,
                                'user_id' => null,
                                'approver_name' => $first->role,
                                'role' => $first->role,
                                'department_name' => $deptName,
                                'target_approvers' => $candidateNames ?: $targetApprovers,
                                'target_emails' => $candidateEmails ?: $targetEmails,
                                'sequence' => $step->step,
                                'batch_no' => $first->batch_no ?? ($chunk['batch_no'] ?? 1),
                                'is_adhoc' => (bool) ($first->is_adhoc ?? false),
                                'status' => 'pending',
                                'comment' => null,
                                'decided_at' => null,
                                'created_at' => null,
                                'is_active' => (bool) $first->is_active,
                                'step_type' => 'APPROVAL',
                                'step_name' => $stepLabel,
                                'step_description' => $step->description,
                                'step_category' => $step->step_category,
                                'sort_order' => $globalOrder++,
                                'workflow_step' => [
                                    'id' => $step->id,
                                    'step' => $step->step,
                                    'label' => $stepLabel,
                                    'description' => $step->description,
                                    'workflow_id' => $step->workflow_id,
                                    'workflow' => [
                                        'id' => $workflow->id,
                                        'name' => $workflow->name,
                                        'workflow_type' => data_get($workflow, 'workflow_type', 'main'),
                                        'is_sub_workflow' => (data_get($workflow, 'workflow_type') === 'sub_workflow') || (bool) data_get($workflow->meta, 'is_sub_workflow', false),
                                    ],
                                    'meta' => $step->meta ?? [],
                                    'action_configs' => $step->relationLoaded('actions') ? $step->actions->map(fn ($act) => [
                                        'id' => $act->id,
                                        'action_code' => $act->action_code instanceof WorkflowAction ? $act->action_code->value : $act->action_code,
                                        'alias' => $act->alias,
                                        'target_status' => $act->target_status,
                                        'required_fields' => $act->required_fields ?? [],
                                        'autofilled_fields' => $act->autofilled_fields ?? [],
                                        'is_visible' => (bool) ($act->is_visible ?? true),
                                    ])->toArray() : [],
                                ],
                                'approver' => null,
                            ];
                        } else {
                            $approvalsToDisplay = $regularApprovals;
                            if ($isRoleBased && $hasDecision && ! $isCurrentStep) {
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
                                    'batch_no' => $a->batch_no ?? ($chunk['batch_no'] ?? 1),
                                    'is_adhoc' => (bool) ($a->is_adhoc ?? false),
                                    'status' => $a->status,
                                    'action_id' => $a->action_id,
                                    'action_code' => $a->action_code,
                                    'action_alias' => $a->action_alias,
                                    'comment' => $a->comment,
                                    'attachment_path' => $a->attachment_path,
                                    'attachment_name' => $a->attachment_path ? basename($a->attachment_path) : null,
                                    'file_size' => $a->attachment_path && Storage::disk('local')->exists($a->attachment_path)
                                        ? Storage::disk('local')->size($a->attachment_path)
                                        : null,
                                    'has_attachment' => (bool) $a->attachment_path,
                                    'decided_at' => $a->decided_at?->toIso8601String(),
                                    'created_at' => $a->created_at?->toIso8601String(),
                                    'step_entry_at' => $a->created_at?->toIso8601String(),
                                    'is_active' => $a->is_active,
                                    'step_type' => 'APPROVAL',
                                    'step_name' => $stepLabel,
                                    'step_description' => $step->description,
                                    'step_category' => $step->step_category,
                                    'sort_order' => $globalOrder++,
                                    'workflow_step' => [
                                         'id' => $step->id,
                                         'step' => $step->step,
                                         'label' => $stepLabel,
                                         'description' => $step->description,
                                         'workflow_id' => $step->workflow_id,
                                         'workflow' => [
                                             'id' => $workflow->id,
                                             'name' => $workflow->name,
                                             'workflow_type' => data_get($workflow, 'workflow_type', 'main'),
                                             'is_sub_workflow' => (data_get($workflow, 'workflow_type') === 'sub_workflow') || (bool) data_get($workflow->meta, 'is_sub_workflow', false),
                                         ],
                                         'meta' => $step->meta ?? [],
                                         'action_configs' => $step->relationLoaded('actions') ? $step->actions->map(fn ($act) => [
                                             'id' => $act->id,
                                             'action_code' => $act->action_code instanceof WorkflowAction ? $act->action_code->value : $act->action_code,
                                             'alias' => $act->alias,
                                             'target_status' => $act->target_status,
                                             'required_fields' => $act->required_fields ?? [],
                                             'autofilled_fields' => $act->autofilled_fields ?? [],
                                             'is_visible' => (bool) ($act->is_visible ?? true),
                                         ])->toArray() : [],
                                     ],
                                     'approver' => UserFormatter::format($a->approver),
                                 ];
                             }
                         }
                     } else {
                         $authoritiesPayload = [];
                         $authorities = collect();
                         if ($step->relationLoaded('approverAuthorities') || $step->approverAuthorities()->exists()) {
                             $authorities = $step->relationLoaded('approverAuthorities')
                                 ? $step->approverAuthorities
                                 : $step->approverAuthorities()->with(['role', 'department', 'division', 'companyGroup', 'company', 'region'])->get();

                             $authoritiesPayload = $authorities->map(fn ($a) => [
                                 'id' => $a->id,
                                 'authority_type' => $a->authority_type,
                                 'role_name' => $a->relationLoaded('role') ? $a->role?->name : null,
                                 'department_name' => $a->relationLoaded('department') ? $a->department?->name : null,
                                 'division_name' => $a->relationLoaded('division') ? $a->division?->name : null,
                                 'company_group_name' => $a->relationLoaded('companyGroup') ? $a->companyGroup?->name : null,
                                 'company_name' => $a->relationLoaded('company') ? $a->company?->name : null,
                                 'region_name' => $a->relationLoaded('region') ? $a->region?->name : null,
                                 'role_use_initiator' => (bool) $a->role_use_initiator,
                                 'department_use_initiator' => (bool) $a->department_use_initiator,
                                 'division_use_initiator' => (bool) $a->division_use_initiator,
                                 'company_group_use_initiator' => (bool) $a->company_group_use_initiator,
                                 'company_use_initiator' => (bool) $a->company_use_initiator,
                                 'region_use_initiator' => (bool) $a->region_use_initiator,
                             ])->values()->toArray();
                         }

                         $isAdhocStep = $authorities->contains(fn ($a) => in_array($a->authority_type, ['adhoc_approvers', 'adhoc'])) ||
                             (! empty($step->approver_config['custom']) && (in_array('adhoc_approvers', (array) $step->approver_config['custom']) || in_array('adhoc', (array) $step->approver_config['custom'])));

                         if ($adhocApprovals->isNotEmpty() && ($isAdhocStep || empty($targetApprovers))) {
                             continue;
                         }

                         if (! $isCurrentChunk && ! ($chunk['is_future_origin'] ?? false)) {
                             continue;
                         }

                         $roleLabel = is_array($step->role) ? implode(', ', array_filter($step->role)) : $step->role;
                         $stepTargetApprovers = $targetApprovers;
                         $approverName = $roleLabel;

                         if ($step->approver_type === 'assigned_pic') {
                             $picName = $c->assignedPic?->name ?? ($c->assigned_pic_id ? \App\Models\User::find($c->assigned_pic_id)?->name : null);
                             $stepTargetApprovers = $picName ?: 'PIC (Belum Ditugaskan)';
                             $approverName = $picName ?: 'PIC (Belum Ditugaskan)';
                         } elseif ($isAdhocStep) {
                             $stepTargetApprovers = 'Persetujuan Tambahan (Ditentukan saat pengajuan)';
                             $approverName = 'Persetujuan Tambahan';
                             $roleLabel = 'Persetujuan Tambahan';
                         }

                         $mainStatus = 'SELANJUTNYA';
                         if ($isCurrentStep) {
                             $hasActiveAdhoc = $adhocApprovals->whereIn('status', ['pending', 'waiting'])->isNotEmpty();
                             $mainStatus = $hasActiveAdhoc ? 'waiting' : 'pending';
                         } elseif ($step->step < $currentStepNumber) {
                             $mainStatus = 'SKIPPED';
                         }

                         $timeline[] = [
                             'id' => 'step-'.$step->id,
                             'workflow_step_id' => $step->id,
                             'user_id' => null,
                             'approver_name' => $approverName,
                             'role' => $roleLabel,
                             'department_name' => $deptName,
                             'target_approvers' => $stepTargetApprovers,
                             'target_emails' => $targetEmails,
                             'sequence' => $step->step,
                             'batch_no' => $chunk['batch_no'] ?? 1,
                             'is_adhoc' => false,
                             'status' => $mainStatus,
                             'note' => null,
                             'approved_at' => null,
                             'decided_at' => null,
                             'created_at' => $isCurrentStep ? $c->updated_at?->toIso8601String() : null,
                             'step_entry_at' => $isCurrentStep ? $c->updated_at?->toIso8601String() : null,
                            'approver' => null,
                            'is_active' => $isCurrentStep,
                            'step_type' => 'APPROVAL',
                            'step_name' => $stepLabel,
                            'step_description' => $step->description,
                            'step_category' => $step->step_category,
                            'sort_order' => $globalOrder++,
                            'workflow_step' => $stepWorkflowPayload,
                            'approver_authorities' => $authoritiesPayload,
                            'debug_sql_queries' => $stepSqlQueries,
                        ];
                    }
                }
            }
        }

        return $timeline;
    }
}
