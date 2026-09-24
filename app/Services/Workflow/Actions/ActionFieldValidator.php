<?php

namespace App\Services\Workflow\Actions;

use App\Enums\WorkflowAction;
use App\Models\Contract;
use App\Models\FormSubmissionHistory;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;

class ActionFieldValidator
{
    /**
     * Validate required fields configured on a step or specific step action.
     *
     * @throws \Exception
     */
    public function validate(Contract $contract, WorkflowStep $step, ?WorkflowStepAction $action = null, ?string $assignedPicId = null): void
    {
        $actionCode = $action?->action_code instanceof WorkflowAction
            ? $action->action_code->value
            : (is_object($action?->action_code) ? ($action->action_code->value ?? (string) $action->action_code) : ($action?->action_code ?? null));

        // If action is explicit reject/revisi, bypass main approve requirements
        if ($actionCode && in_array(strtolower($actionCode), ['reject', 'revisi', 'return'])) {
            return;
        }

        // If action has explicitly configured required_fields array, only validate those fields
        if ($action && is_array($action->required_fields)) {
            $actionReqFields = $action->required_fields;
            $stepMeta = [];
        } else {
            $isNonStandard = in_array($actionCode, ['branch', 'reject', 'add_adhoc', 'cross_workflow']);
            $stepMeta = $isNonStandard ? [] : ($step->meta ?? []);
            $actionReqFields = [];
        }

        // 1. PIC Validation
        $requirePic = (! empty($stepMeta['require_pic']) && (! $actionCode || in_array($actionCode, ['approve', 'assign', 'assign_pic'])))
            || in_array('pic', $actionReqFields)
            || in_array('assigned_pic', $actionReqFields);
        if ($requirePic) {
            $hasPic = ! empty($contract->assigned_pic_id) || ! empty($assignedPicId) || ! empty($contract->metadata['assigned_pic_id']);
            if (! $hasPic) {
                throw new \Exception('Tidak dapat melanjutkan persetujuan. Data PIC (Penanggung Jawab) wajib diisi / ditugaskan terlebih dahulu.');
            }
        }

        $currentStepId = $step->id;
        $currentStepNo = $step->step ?? $contract->current_step_number;
        $iteration = $contract->workflow_iteration ?? 1;

        // Helper to check if a document exists and matches the current step or current iteration
        $checkDocumentStepFulfillment = function (string|array $types) use ($contract, $currentStepId, $currentStepNo, $iteration) {
            $typeArr = (array) $types;

            // 1. Check t_contract_versions with matching step or iteration
            $hasMatchingVersion = $contract->versions()
                ->whereIn('document_type', $typeArr)
                ->where(function ($q) use ($currentStepId, $currentStepNo, $iteration) {
                    $q->where('workflow_step_id', $currentStepId)
                      ->orWhere('step_number', $currentStepNo)
                      ->orWhere(function ($q2) use ($iteration) {
                          $q2->where('workflow_iteration', $iteration)
                             ->whereNull('workflow_step_id')
                             ->whereNull('step_number');
                      });
                })->exists();

            if ($hasMatchingVersion) {
                return true;
            }

            // 2. Check t_form_submissions with matching step or iteration
            $hasMatchingSubmission = $contract->formSubmissions()
                ->whereIn('document_type', $typeArr)
                ->where(function ($q) use ($currentStepId, $currentStepNo, $iteration) {
                    $q->where('workflow_step_id', $currentStepId)
                      ->orWhere('step_number', $currentStepNo)
                      ->orWhere(function ($q2) use ($iteration) {
                          $q2->where('workflow_iteration', $iteration)
                             ->whereNull('workflow_step_id')
                             ->whereNull('step_number');
                      });
                })->exists();

            if ($hasMatchingSubmission) {
                return true;
            }

            // 3. Check FormSubmissionHistory records matching step or iteration
            $hasMatchingHistory = FormSubmissionHistory::whereHas('submission', function ($q) use ($contract, $typeArr) {
                $q->where('contract_id', $contract->id)->whereIn('document_type', $typeArr);
            })->where(function ($q) use ($currentStepId, $currentStepNo, $iteration) {
                $q->where('workflow_step_id', $currentStepId)
                  ->orWhere('step_number', $currentStepNo)
                  ->orWhere('workflow_iteration', $iteration);
            })->exists();

            if ($hasMatchingHistory) {
                return true;
            }

            // 4. Fallback for Step 1 / Initial Draft if step_id was not explicitly populated
            if ((int) $currentStepNo <= 1) {
                return $contract->versions()->whereIn('document_type', $typeArr)->exists()
                    || $contract->formSubmissions()->whereIn('document_type', $typeArr)->exists();
            }

            return false;
        };

        // 2. F1 Validation
        $requireF1 = (! empty($stepMeta['require_f1']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('f1', $actionReqFields);
        if ($requireF1) {
            $hasF1 = $checkDocumentStepFulfillment('f1')
                || ! empty($contract->f1_file)
                || ! empty($contract->metadata['f1_file'])
                || ! empty($contract->metadata['f1_form_data'])
                || ! empty($contract->f1_items);
            if (! $hasF1) {
                throw new \Exception('Tidak dapat melanjutkan persetujuan. Sub-dokumen F1 (Permohonan) wajib diisi/diunggah pada tahap ini terlebih dahulu.');
            }
        }

        // 3. F2 Validation
        $requireF2 = (! empty($stepMeta['require_f2']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('f2', $actionReqFields);
        if ($requireF2) {
            $hasF2 = $checkDocumentStepFulfillment('f2')
                || ! empty($contract->f2_file)
                || ! empty($contract->metadata['f2_file'])
                || ! empty($contract->metadata['f2_form_data']);
            if (! $hasF2) {
                throw new \Exception('Tidak dapat melanjutkan persetujuan. Sub-dokumen F2 (Ringkasan) wajib diisi/diunggah pada tahap ini terlebih dahulu.');
            }
        }

        // 4. Agreement Validation
        $requireAgreement = (! empty($stepMeta['require_agreement']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('agreement', $actionReqFields);
        if ($requireAgreement) {
            $hasAgreement = $checkDocumentStepFulfillment(['agreement', 'contract'])
                || ! empty($contract->agreement_file)
                || ! empty($contract->agreement_content)
                || ! empty($contract->metadata['agreement_file'])
                || ! empty($contract->metadata['agreement_content'])
                || $contract->attachments()->where(function ($q) {
                    $q->whereIn('category', ['Perjanjian', 'agreement', 'draft', 'kontrak', 'Draft Kontrak'])
                      ->orWhere('file_type', 'like', '%word%')
                      ->orWhere('file_type', 'like', '%pdf%')
                      ->orWhere('label', 'like', '%Draft%')
                      ->orWhere('label', 'like', '%Perjanjian%');
                })->exists();
            if (! $hasAgreement) {
                throw new \Exception('Tidak dapat melanjutkan persetujuan. Sub-dokumen Perjanjian / Draft wajib diisi/diunggah pada tahap ini terlebih dahulu.');
            }
        }

        // 5. Contract Info Validation
        $requireTitle = (! empty($stepMeta['require_title']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('title', $actionReqFields);
        if ($requireTitle && empty($contract->title)) {
            throw new \Exception('Tidak dapat melanjutkan persetujuan. Field Judul Kontrak wajib diisi terlebih dahulu.');
        }

        $requireVendor = (! empty($stepMeta['require_vendor']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('vendor', $actionReqFields);
        $hasVendorOrParty2 = ! empty($contract->vendor_id)
            || ! empty($contract->p2_entity)
            || ! empty(data_get($contract->metadata, 'second_party_id'))
            || ! empty(data_get($contract->metadata, 'p2_vendor_id'))
            || ! empty(data_get($contract->metadata, 'meta_p2_entity'));
        if ($requireVendor && ! $hasVendorOrParty2) {
            throw new \Exception('Tidak dapat melanjutkan persetujuan. Field Pihak Kedua wajib dipilih terlebih dahulu.');
        }

        $requireCategory = (! empty($stepMeta['require_category']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('category', $actionReqFields);
        if ($requireCategory && empty($contract->contract_type_id)) {
            throw new \Exception('Tidak dapat melanjutkan persetujuan. Field Kategori Kontrak wajib dipilih terlebih dahulu.');
        }

        $requireF2ContractNo = (! empty($stepMeta['require_f2_contract_no']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('contract_no', $actionReqFields) || in_array('f2_contract_no', $actionReqFields);
        if ($requireF2ContractNo && empty($contract->contract_no)) {
            throw new \Exception('Tidak dapat melanjutkan persetujuan. Field Nomor Kontrak wajib diisi terlebih dahulu.');
        }

        $requireTaxToggle = (! empty($stepMeta['require_tax_toggle']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('tax_toggle', $actionReqFields) || in_array('tax', $actionReqFields);
        if ($requireTaxToggle && is_null($contract->tax_required) && is_null(data_get($contract->metadata, 'tax_required'))) {
            throw new \Exception('Tidak dapat melanjutkan persetujuan. Field Penentuan Pajak wajib ditentukan terlebih dahulu.');
        }

        $requirePrice = (! empty($stepMeta['require_price']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('price', $actionReqFields);
        if ($requirePrice && (is_null($contract->price) || $contract->price === '')) {
            throw new \Exception('Tidak dapat melanjutkan persetujuan. Field Nilai / Harga Kontrak wajib diisi terlebih dahulu.');
        }

        $requirePeriod = (! empty($stepMeta['require_period']) && (! $actionCode || $actionCode === 'approve'))
            || in_array('period', $actionReqFields);
        if ($requirePeriod && ((empty($contract->contract_date) && empty($contract->start_date)) || empty($contract->end_date))) {
            throw new \Exception('Tidak dapat melanjutkan persetujuan. Field Masa Berlaku Kontrak wajib diisi lengkap terlebih dahulu.');
        }
    }
}
