<?php

namespace App\Http\Controllers\Contract;

use App\Actions\File\AttachmentFileAction;
use App\Actions\File\AttachmentPdfPreviewAction;
use App\Actions\File\ChangeVersionAction;
use App\Actions\File\CompareVersionsAction;
use App\Actions\File\DeleteAttachmentAction;
use App\Actions\File\DownloadFileAction;
use App\Actions\File\FileContentAction;
use App\Actions\File\GetAgreementVersionsAction;
use App\Actions\File\GetRevisionVersionsAction;
use App\Actions\File\PdfPreviewAction;
use App\Actions\File\UploadAgreementAction;
use App\Actions\File\UploadAttachmentAction;
use App\Actions\File\UploadRevisionAction;
use App\Actions\File\VendorDocumentFileAction;
use App\Actions\File\VendorDocumentPdfPreviewAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\UploadAgreementRequest;
use App\Http\Requests\Contract\UploadAttachmentRequest;
use App\Http\Requests\Contract\UploadRevisionRequest;
use App\Models\Contract;
use App\Services\ContractWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class ContractFileController extends Controller
{
    public function __construct(
        protected ContractWorkflowService $workflowService,
    ) {}

    public function uploadRevision(UploadRevisionRequest $request, string $id, UploadRevisionAction $action): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function getRevisionVersions(Request $request, string $id, GetRevisionVersionsAction $action): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function download(string $id, DownloadFileAction $action): mixed
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract);
    }

    public function fileContent(string $id, int $versionNo, Request $request, FileContentAction $action): mixed
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $versionNo, $request);
    }

    public function attachmentFile(string $id, string $atId, AttachmentFileAction $action): mixed
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $atId);
    }

    public function changeVersion(Request $request, string $id, ChangeVersionAction $action): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function pdfPreview(Request $request, string $id, int $versionNo, PdfPreviewAction $action): mixed
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $versionNo, $request);
    }

    public function attachmentPdfPreview(string $id, string $atId, AttachmentPdfPreviewAction $action): mixed
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $atId);
    }

    public function vendorDocumentFile(string $id, string $docId, VendorDocumentFileAction $action): mixed
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $docId);
    }

    public function vendorDocumentPdfPreview(string $id, string $docId, VendorDocumentPdfPreviewAction $action): mixed
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $docId);
    }

    public function uploadAttachment(UploadAttachmentRequest $request, string $id, UploadAttachmentAction $action): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function deleteAttachment(string $id, string $atId, DeleteAttachmentAction $action): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $atId);
    }

    public function uploadAgreement(UploadAgreementRequest $request, string $id, UploadAgreementAction $action): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $request);
    }

    public function getAgreementVersions(string $id, GetAgreementVersionsAction $action): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract);
    }

    public function compareAgreementVersions(Request $request, string $id, CompareVersionsAction $action): Response
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, 'agreement', $request);
    }

    public function compareFormVersions(Request $request, string $id, string $type, CompareVersionsAction $action): Response
    {
        $contract = Contract::findOrFail($id);

        return $action->execute($contract, $type, $request);
    }
}
