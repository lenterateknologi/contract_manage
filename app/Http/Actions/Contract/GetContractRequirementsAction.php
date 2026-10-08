<?php

namespace App\Http\Actions\Contract;

use App\Enums\WorkflowAction;
use App\Models\Master\WorkflowStep;
use App\Models\Transaction\Contract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class GetContractRequirementsAction
{
    /**
     * Requirement definitions mapping.
     */
    protected array $requirementDefinitions = [
        'pic' => [
            'label' => 'Data PIC (Penanggung Jawab)',
            'type' => 'pic',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'assigned_pic' => [
            'label' => 'Data PIC (Penanggung Jawab)',
            'type' => 'pic',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'f1' => [
            'label' => 'Sub-dokumen F1 (Permohonan)',
            'type' => 'doc',
            'target_tab' => 'documents',
            'target_subtab' => 'f1',
            'doc_type' => 'f1',
        ],
        'f2' => [
            'label' => 'Sub-dokumen F2 (Ringkasan)',
            'type' => 'doc',
            'target_tab' => 'documents',
            'target_subtab' => 'f2',
            'doc_type' => 'f2',
        ],
        'agreement' => [
            'label' => 'Sub-dokumen Draft Perjanjian',
            'type' => 'doc',
            'target_tab' => 'documents',
            'target_subtab' => 'agreement',
            'doc_type' => 'agreement',
        ],
        'contract' => [
            'label' => 'Sub-dokumen Draft Perjanjian',
            'type' => 'doc',
            'target_tab' => 'documents',
            'target_subtab' => 'agreement',
            'doc_type' => 'agreement',
        ],
        'title' => [
            'label' => 'Judul Kontrak',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'first_party' => [
            'label' => 'Pihak Pertama',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'p1' => [
            'label' => 'Pihak Pertama',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'vendor' => [
            'label' => 'Pihak Kedua (Vendor)',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'category' => [
            'label' => 'Kategori / Klasifikasi Kontrak',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'contract_no' => [
            'label' => 'Nomor Kontrak (F2)',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'f2_contract_no' => [
            'label' => 'Nomor Kontrak (F2)',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'tax_toggle' => [
            'label' => 'Penentuan Pajak',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'tax' => [
            'label' => 'Penentuan Pajak',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'price' => [
            'label' => 'Nilai / Harga Kontrak',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
        'period' => [
            'label' => 'Masa Berlaku Kontrak',
            'type' => 'field',
            'target_tab' => 'overview',
            'target_subtab' => null,
            'doc_type' => null,
        ],
    ];

    public function execute(Contract $contract, Request $request): JsonResponse
    {
        $user = Auth::user();

        // 1. Authorization & Authority Check
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Token otentikasi diperlukan.',
                'data' => null,
                'errors' => ['auth' => 'Unauthenticated'],
            ], 401);
        }

        if (! Gate::allows('view', $contract)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki otoritas untuk melihat syarat pada pengajuan kontrak ini.',
                'data' => null,
                'errors' => ['forbidden' => 'Unauthorized access to contract requirements'],
            ], 403);
        }

        // Eager load relations if missing
        $contract->loadMissing([
            'workflow.steps.actions',
            'workflowStep.actions',
            'workflowStep.approverAuthorities',
            'versions',
            'formSubmissions',
            'vendor',
            'initiator',
            'creator',
            'assignedPic',
            'approvals',
        ]);

        // 2. Resolve Step and Step Actions
        $stepId = $request->query('step_id');
        $stepNumber = $request->query('step_number');
        $actionCode = $request->query('action_code') ?: $request->query('action');
        $actionId = $request->query('action_id');
        $docTypeFilter = $request->query('doc_type') ?: $request->query('subtab');

        $effectiveStep = null;

        if ($stepId) {
            $effectiveStep = $contract->workflow?->steps?->firstWhere('id', $stepId) ?? WorkflowStep::find($stepId);
        } elseif ($stepNumber !== null) {
            $effectiveStep = $contract->workflow?->steps?->firstWhere('step', (int) $stepNumber);
        }

        if (! $effectiveStep) {
            $effectiveStep = $contract->workflowStep;
        }

        if (! $effectiveStep && $contract->workflow_step_id) {
            $effectiveStep = WorkflowStep::find($contract->workflow_step_id);
        }

        if (! $effectiveStep && $contract->workflow) {
            $effectiveStep = $contract->workflow->steps()->orderBy('step')->first();
        }

        // Resolve Step Action if specified
        $stepAction = null;
        if ($effectiveStep) {
            if ($actionId) {
                $stepAction = $effectiveStep->actions->firstWhere('id', $actionId);
            } elseif ($actionCode) {
                $stepAction = $effectiveStep->actions->first(function ($act) use ($actionCode) {
                    $code = $act->action_code instanceof WorkflowAction ? $act->action_code->value : ($act->action_code ?? '');

                    return strcasecmp((string) $code, (string) $actionCode) === 0;
                });
            }
        }

        // 3. Determine all required keys
        $requiredKeys = [];
        $stepMeta = $effectiveStep?->meta ?? [];

        // PIC requirement
        if (! empty($stepMeta['require_pic']) || $effectiveStep?->approver_type === 'assigned_pic') {
            $requiredKeys[] = 'pic';
        }

        // Meta step requirements
        $metaKeys = [
            'require_f1' => 'f1',
            'require_f2' => 'f2',
            'require_agreement' => 'agreement',
            'require_title' => 'title',
            'require_first_party' => 'first_party',
            'require_vendor' => 'vendor',
            'require_category' => 'category',
            'require_f2_contract_no' => 'f2_contract_no',
            'require_tax_toggle' => 'tax_toggle',
            'require_price' => 'price',
            'require_period' => 'period',
        ];

        foreach ($metaKeys as $metaField => $key) {
            if (! empty($stepMeta[$metaField])) {
                $requiredKeys[] = $key;
            }
        }

        // Action required fields
        if ($stepAction && is_array($stepAction->required_fields)) {
            $requiredKeys = array_merge($requiredKeys, $stepAction->required_fields);
        } elseif ($effectiveStep) {
            foreach ($effectiveStep->actions as $act) {
                if (! empty($act->required_fields) && is_array($act->required_fields)) {
                    $requiredKeys = array_merge($requiredKeys, $act->required_fields);
                }
            }
        }

        // Normalize keys and deduplicate
        $requiredKeys = array_values(array_unique(array_filter($requiredKeys)));

        // 4. Evaluate each requirement
        $items = [];
        foreach ($requiredKeys as $key) {
            $def = $this->requirementDefinitions[$key] ?? [
                'label' => ucwords(str_replace('_', ' ', $key)),
                'type' => 'field',
                'target_tab' => 'overview',
                'target_subtab' => null,
                'doc_type' => null,
            ];

            // Apply doc_type / subtab filter if requested
            if ($docTypeFilter) {
                $normalizedFilter = strtolower($docTypeFilter);
                $isMatchingDoc = ($def['doc_type'] && strtolower($def['doc_type']) === $normalizedFilter)
                    || ($def['target_subtab'] && strtolower($def['target_subtab']) === $normalizedFilter)
                    || ($normalizedFilter === 'overview' && $def['target_tab'] === 'overview')
                    || ($normalizedFilter === 'documents' && $def['target_tab'] === 'documents');

                if (! $isMatchingDoc) {
                    continue;
                }
            }

            $evaluation = $this->evaluateRequirement($contract, $key, $effectiveStep);

            $items[] = [
                'id' => $key,
                'label' => $def['label'],
                'type' => $def['type'],
                'is_fulfilled' => $evaluation['is_fulfilled'],
                'target_tab' => $def['target_tab'],
                'target_subtab' => $def['target_subtab'],
                'reason' => $evaluation['reason'],
                'details' => $evaluation['details'] ?? null,
            ];
        }

        $totalCount = count($items);
        $fulfilledCount = count(array_filter($items, fn ($i) => $i['is_fulfilled']));
        $unfulfilledCount = $totalCount - $fulfilledCount;
        $allFulfilled = $totalCount === 0 || $fulfilledCount === $totalCount;
        $progress = $totalCount > 0 ? (int) round(($fulfilledCount / $totalCount) * 100) : 100;

        $isCurrentActor = (bool) $contract->approvals()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        return response()->json([
            'success' => true,
            'message' => 'Contract requirements retrieved successfully',
            'data' => [
                'has_access' => true,
                'can_view_requirements' => true,
                'is_current_actor' => $isCurrentActor,
                'contract_id' => $contract->id,
                'contract_title' => $contract->title,
                'contract_status' => $contract->status,
                'workflow' => $contract->workflow ? [
                    'id' => $contract->workflow->id,
                    'name' => $contract->workflow->name,
                ] : null,
                'current_step' => $effectiveStep ? [
                    'id' => $effectiveStep->id,
                    'step' => $effectiveStep->step,
                    'name' => $effectiveStep->name,
                    'approver_type' => $effectiveStep->approver_type,
                    'is_current_actor' => $isCurrentActor,
                ] : null,
                'summary' => [
                    'total_requirements' => $totalCount,
                    'fulfilled_requirements' => $fulfilledCount,
                    'unfulfilled_requirements' => $unfulfilledCount,
                    'is_all_fulfilled' => $allFulfilled,
                    'progress_percentage' => $progress,
                ],
                'requirements' => $items,
            ],
            'errors' => null,
        ]);
    }

    /**
     * Evaluate single requirement fulfillment.
     */
    protected function evaluateRequirement(Contract $contract, string $key, ?WorkflowStep $step): array
    {
        $iteration = $contract->workflow_iteration ?? 1;
        $stepId = $step?->id;
        $stepNo = $step?->step ?? $contract->current_step_number;

        switch ($key) {
            case 'pic':
            case 'assigned_pic':
                $hasPic = ! empty($contract->assigned_pic_id) || ! empty($contract->metadata['assigned_pic_id']);
                $picName = $contract->assignedPic?->name;

                return [
                    'is_fulfilled' => $hasPic,
                    'reason' => $hasPic
                        ? ($picName ? "PIC telah ditugaskan: {$picName}." : 'PIC telah ditugaskan.')
                        : 'Data PIC (Penanggung Jawab) wajib ditugaskan terlebih dahulu.',
                    'details' => ['assigned_pic_id' => $contract->assigned_pic_id, 'pic_name' => $picName],
                ];

            case 'f1':
                $hasDoc = $this->checkDocumentFulfillment($contract, ['f1'], $stepId, $stepNo, $iteration);
                $version = $contract->versions?->where('document_type', 'f1')->first();

                return [
                    'is_fulfilled' => $hasDoc,
                    'reason' => $hasDoc
                        ? 'Sub-dokumen F1 (Permohonan) sudah diunggah / diisi.'
                        : 'Sub-dokumen F1 (Permohonan) wajib diisi atau diunggah.',
                    'details' => ['version_no' => $version?->version_no, 'file_name' => $version?->file_name],
                ];

            case 'f2':
                $hasDoc = $this->checkDocumentFulfillment($contract, ['f2'], $stepId, $stepNo, $iteration);
                $version = $contract->versions?->where('document_type', 'f2')->first();

                return [
                    'is_fulfilled' => $hasDoc,
                    'reason' => $hasDoc
                        ? 'Sub-dokumen F2 (Ringkasan) sudah diunggah / diisi.'
                        : 'Sub-dokumen F2 (Ringkasan) wajib diisi atau diunggah.',
                    'details' => ['version_no' => $version?->version_no, 'file_name' => $version?->file_name],
                ];

            case 'agreement':
            case 'contract':
                $hasDoc = $this->checkDocumentFulfillment($contract, ['agreement', 'contract'], $stepId, $stepNo, $iteration);
                $version = $contract->versions?->whereIn('document_type', ['agreement', 'contract'])->first();

                return [
                    'is_fulfilled' => $hasDoc,
                    'reason' => $hasDoc
                        ? 'Sub-dokumen Draft Perjanjian sudah diunggah.'
                        : 'Sub-dokumen Draft Perjanjian wajib diunggah terlebih dahulu.',
                    'details' => ['version_no' => $version?->version_no, 'file_name' => $version?->file_name],
                ];

            case 'title':
                $hasVal = ! empty(trim((string) $contract->title));

                return [
                    'is_fulfilled' => $hasVal,
                    'reason' => $hasVal ? 'Judul kontrak sudah diisi.' : 'Judul kontrak wajib diisi.',
                    'details' => ['title' => $contract->title],
                ];

            case 'first_party':
            case 'p1':
                $hasVal = ! empty($contract->company_id)
                    || ! empty($contract->first_party_id)
                    || ! empty($contract->p1_entity)
                    || ! empty($contract->metadata['first_party_id'])
                    || ! empty($contract->metadata['meta_p1_entity'])
                    || ! empty($contract->initiator?->company_id);

                return [
                    'is_fulfilled' => $hasVal,
                    'reason' => $hasVal ? 'Data Pihak Pertama sudah diisi.' : 'Pihak Pertama wajib dipilih / diisi.',
                    'details' => null,
                ];

            case 'vendor':
                $hasVal = ! empty($contract->vendor_id)
                    || ! empty($contract->vendor?->id)
                    || ! empty($contract->p2_entity)
                    || ! empty($contract->metadata['second_party_id'])
                    || ! empty($contract->metadata['meta_p2_entity']);

                return [
                    'is_fulfilled' => $hasVal,
                    'reason' => $hasVal ? 'Data Pihak Kedua (Vendor) sudah diisi.' : 'Pihak Kedua (Vendor) wajib diisi.',
                    'details' => ['vendor_name' => $contract->vendor?->name],
                ];

            case 'category':
                $hasVal = ! empty($contract->contract_type_id) || ! empty($contract->contract_type);

                return [
                    'is_fulfilled' => $hasVal,
                    'reason' => $hasVal ? 'Kategori kontrak sudah dipilih.' : 'Kategori kontrak wajib dipilih.',
                    'details' => null,
                ];

            case 'contract_no':
            case 'f2_contract_no':
                $hasVal = ! empty(trim((string) $contract->contract_no));

                return [
                    'is_fulfilled' => $hasVal,
                    'reason' => $hasVal ? 'Nomor kontrak sudah diisi.' : 'Nomor kontrak wajib diisi.',
                    'details' => ['contract_no' => $contract->contract_no],
                ];

            case 'tax_toggle':
            case 'tax':
                $hasVal = ($contract->tax_required !== null) || isset($contract->metadata['tax_required']);

                return [
                    'is_fulfilled' => $hasVal,
                    'reason' => $hasVal ? 'Penentuan pajak sudah ditentukan.' : 'Penentuan pajak wajib dipilih.',
                    'details' => ['tax_required' => (bool) $contract->tax_required],
                ];

            case 'price':
                $hasVal = $contract->price !== null && $contract->price !== '';

                return [
                    'is_fulfilled' => $hasVal,
                    'reason' => $hasVal ? 'Nilai kontrak sudah diisi.' : 'Nilai / harga kontrak wajib diisi.',
                    'details' => ['price' => $contract->price],
                ];

            case 'period':
                $hasVal = (! empty($contract->contract_date) || ! empty($contract->start_date)) && ! empty($contract->end_date);

                return [
                    'is_fulfilled' => $hasVal,
                    'reason' => $hasVal ? 'Masa berlaku kontrak sudah lengkap.' : 'Masa berlaku kontrak (tanggal mulai & selesai) wajib diisi.',
                    'details' => ['start_date' => $contract->start_date ?: $contract->contract_date, 'end_date' => $contract->end_date],
                ];

            default:
                return [
                    'is_fulfilled' => true,
                    'reason' => 'Syarat telah terpenuhi.',
                    'details' => null,
                ];
        }
    }

    /**
     * Check document fulfillment across versions, submissions, and metadata.
     */
    protected function checkDocumentFulfillment(Contract $contract, array $types, ?string $stepId, ?int $stepNo, int $iteration): bool
    {
        // 1. Check in t_contract_versions
        $hasVersion = $contract->versions()
            ->whereIn('document_type', $types)
            ->where(function ($q) use ($stepId, $stepNo, $iteration) {
                $q->where('workflow_step_id', $stepId)
                    ->orWhere('step_number', $stepNo)
                    ->orWhere(function ($q2) use ($iteration) {
                        $q2->where('workflow_iteration', $iteration)
                            ->whereNull('workflow_step_id')
                            ->whereNull('step_number');
                    })
                    ->orWhere('version_no', '>', 0);
            })->exists();

        if ($hasVersion) {
            return true;
        }

        // 2. Check in form submissions
        $hasSubmission = $contract->formSubmissions()
            ->whereIn('document_type', $types)
            ->where(function ($q) use ($stepId, $stepNo, $iteration) {
                $q->where('workflow_step_id', $stepId)
                    ->orWhere('step_number', $stepNo)
                    ->orWhere(function ($q2) use ($iteration) {
                        $q2->where('workflow_iteration', $iteration)
                            ->whereNull('workflow_step_id')
                            ->whereNull('step_number');
                    })
                    ->orWhere('current_version', '>', 0);
            })->exists();

        if ($hasSubmission) {
            return true;
        }

        // 3. Fallback direct attributes
        if (in_array('f1', $types) && ($contract->f1_file || ! empty($contract->metadata['f1_file']) || ! empty($contract->metadata['f1_form_data']))) {
            return true;
        }
        if (in_array('f2', $types) && ($contract->f2_file || ! empty($contract->metadata['f2_file']) || ! empty($contract->metadata['f2_form_data']))) {
            return true;
        }
        if ((in_array('agreement', $types) || in_array('contract', $types)) && ($contract->agreement_file || ! empty($contract->metadata['agreement_file']) || ! empty($contract->metadata['agreement_content']))) {
            return true;
        }

        return false;
    }
}
