<?php

namespace App\Http\Actions\Contract;

use App\Models\Contract;
use App\Models\FormTemplate;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetContractDocumentTypesAction
{
    use ApiResponse;

    /**
     * Execute the action to get document types configuration for a contract.
     */
    public function execute(Contract $contract, Request $request, ?string $type = null): JsonResponse
    {
        $contract->loadMissing([
            'contractType.parent',
            'contractType.f1FormTemplate.fields',
            'contractType.f2FormTemplate.fields',
            'contractType.contractFormTemplate.fields',
            'workflowStep',
            'versions',
            'formSubmissions',
        ]);

        $contractType = $contract->contractType;
        $stepMeta = $contract->workflowStep?->meta ?? [];

        // Requested filter type: from route param or query param ?type=
        $filterType = strtolower(trim((string) ($type ?: $request->query('type', ''))));
        if ($filterType === 'contract') {
            $filterType = 'agreement';
        }

        $docConfigs = [
            'f1' => $this->buildDocConfig('f1', 'Form F1 (Permohonan)', 'f1_input_mechanism', 'f1_form_template_id', 'f1_contract_template_id', 'allow_f1_edit', 'require_f1', 'show_tab_f1', $contract, $contractType, $stepMeta),
            'f2' => $this->buildDocConfig('f2', 'Form F2 (Ringkasan)', 'f2_input_mechanism', 'f2_form_template_id', 'f2_contract_template_id', 'allow_f2_edit', 'require_f2', 'show_tab_f2', $contract, $contractType, $stepMeta),
            'agreement' => $this->buildDocConfig('agreement', 'Draft Perjanjian / Agreement', 'contract_input_mechanism', 'contract_form_template_id', null, 'allow_agreement_edit', 'require_agreement', 'show_tab_agreement', $contract, $contractType, $stepMeta),
        ];

        if ($filterType !== '' && array_key_exists($filterType, $docConfigs)) {
            $data = [
                'contract_id' => $contract->id,
                'contract_type_id' => $contract->contract_type_id,
                'contract_type_name' => $contractType?->name,
                'document' => $docConfigs[$filterType],
            ];

            return $this->successResponse($data, "Document type configuration for {$filterType} retrieved successfully.");
        }

        $data = [
            'contract_id' => $contract->id,
            'contract_type_id' => $contract->contract_type_id,
            'contract_type_name' => $contractType?->name,
            'documents' => $docConfigs,
        ];

        return $this->successResponse($data, 'Document type configurations retrieved successfully.');
    }

    private function buildDocConfig(
        string $docType,
        string $label,
        string $mechCol,
        string $tplCol,
        ?string $contractTplCol,
        string $allowEditKey,
        string $requireKey,
        string $showKey,
        Contract $contract,
        mixed $contractType,
        array $stepMeta
    ): array {
        $mechanism = $contractType?->getInheritedInputMechanism($mechCol) ?? 'digital';
        $templateId = $contractType?->getInheritedTemplateId($tplCol);
        $contractTemplateId = $contractTplCol ? $contractType?->getInheritedTemplateId($contractTplCol) : null;

        // Check form submissions
        $subDocType = $docType === 'agreement' ? 'contract' : $docType;
        $hasSubmission = $contract->relationLoaded('formSubmissions')
            ? $contract->formSubmissions->where('document_type', $subDocType)->isNotEmpty()
            : false;

        // Check versions
        $versionDocType = $docType === 'contract' ? 'agreement' : $docType;
        $versions = $contract->relationLoaded('versions')
            ? $contract->versions->where('document_type', $versionDocType)
            : collect();
        $hasFile = $versions->isNotEmpty();
        $latestVersion = $versions->sortByDesc('version_no')->first();

        // Effective mode
        $effectiveMode = match (true) {
            $hasSubmission => 'interactive',
            $hasFile => 'upload',
            $mechanism === 'manual' => 'interactive',
            $mechanism === 'none' => 'none',
            default => 'upload',
        };

        // Form template details
        $formTemplate = null;
        if ($templateId) {
            $tpl = FormTemplate::with(['fields' => fn ($q) => $q->orderBy('order')])->find($templateId);
            if ($tpl) {
                $formTemplate = [
                    'id' => $tpl->id,
                    'name' => $tpl->name,
                    'description' => $tpl->description,
                    'document_type' => $tpl->document_type,
                    'fields_count' => $tpl->fields->count(),
                    'has_letterhead' => (bool) $tpl->has_letterhead,
                    'is_active' => (bool) $tpl->is_active,
                ];
            }
        }

        return [
            'type' => $docType,
            'name' => $label,
            'input_mechanism' => $mechanism,
            'mode' => $effectiveMode,
            'form_template_id' => $templateId,
            'form_template' => $formTemplate,
            'contract_template_id' => $contractTemplateId,
            'allow_edit' => (bool) data_get($stepMeta, $allowEditKey, true),
            'is_required' => (bool) data_get($stepMeta, $requireKey, false),
            'is_visible' => data_get($stepMeta, $showKey, true) !== false,
            'has_submission' => $hasSubmission,
            'has_file' => $hasFile,
            'latest_version' => $latestVersion ? [
                'id' => $latestVersion->id,
                'version_no' => $latestVersion->version_no,
                'file_name' => $latestVersion->file_name,
                'file_size' => $latestVersion->file_size,
                'mime_type' => $latestVersion->mime_type,
                'created_at' => $latestVersion->created_at?->toIso8601String(),
            ] : null,
        ];
    }
}
