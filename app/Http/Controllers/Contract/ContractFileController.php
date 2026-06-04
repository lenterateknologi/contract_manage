<?php

namespace App\Http\Controllers\Contract;

use App\Actions\Contract\ApproveContractAction;
use App\Actions\Contract\ExportContractAction;
use App\Actions\Contract\FileAction;
use App\Actions\Contract\RejectContractAction;
use App\Actions\Contract\StoreContractAction;
use App\Actions\Contract\UpdateContractAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\UploadRevisionRequest;
use App\Models\Contract;
use App\Services\ContractWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class ContractFileController extends Controller
{
    private ContractWorkflowService $workflowService;

    private StoreContractAction $storeAction;

    private UpdateContractAction $updateAction;

    private ApproveContractAction $approveAction;

    private RejectContractAction $rejectAction;

    private FileAction $fileAction;

    private ExportContractAction $exportAction;

    public function __construct(
        ContractWorkflowService $workflowService,
        StoreContractAction $storeAction,
        UpdateContractAction $updateAction,
        ApproveContractAction $approveAction,
        RejectContractAction $rejectAction,
        FileAction $fileAction,
        ExportContractAction $exportAction,
    ) {
        $this->workflowService = $workflowService;
        $this->storeAction = $storeAction;
        $this->updateAction = $updateAction;
        $this->approveAction = $approveAction;
        $this->rejectAction = $rejectAction;
        $this->fileAction = $fileAction;
        $this->exportAction = $exportAction;
    }

    public function uploadRevision(UploadRevisionRequest $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->uploadRevision($contract, $request);
    }

    public function getRevisionVersions(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->getRevisionVersions($contract, $request);
    }

    public function download(string $id): mixed
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->download($contract);
    }

    public function fileContent(string $id, int $versionNo, Request $request): mixed
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->fileContent($contract, $versionNo, $request);
    }

    public function attachmentFile(string $id, string $atId): mixed
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->attachmentFile($contract, $atId);
    }

    public function changeVersion(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->changeVersion($contract, $request);
    }

    public function pdfPreview(Request $request, string $id, int $versionNo): mixed
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->pdfPreview($contract, $versionNo, $request);
    }

    public function attachmentPdfPreview(string $id, string $atId): mixed
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->attachmentPdfPreview($contract, $atId);
    }

    public function vendorDocumentFile(string $id, string $docId): mixed
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->vendorDocumentFile($contract, $docId);
    }

    public function vendorDocumentPdfPreview(string $id, string $docId): mixed
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->vendorDocumentPdfPreview($contract, $docId);
    }

    public function uploadAttachment(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->uploadAttachment($contract, $request);
    }

    public function deleteAttachment(string $id, string $atId): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->deleteAttachment($contract, $atId);
    }

    public function uploadAgreement(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->uploadAgreement($contract, $request);
    }

    public function getAgreementVersions(string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->getAgreementVersions($contract);
    }

    public function compareAgreementVersions(Request $request, string $id): Response
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->compareVersions($contract, 'agreement', $request);
    }

    public function compareFormVersions(Request $request, string $id, string $type): Response
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->compareVersions($contract, $type, $request);
    }
}
