<?php

namespace App\Http\Controllers\Contract;

use App\Http\Actions\File\AttachmentFileAction;
use App\Http\Actions\File\AttachmentPdfPreviewAction;
use App\Http\Actions\File\ChangeVersionAction;
use App\Http\Actions\File\CompareVersionsAction;
use App\Http\Actions\File\DeleteAttachmentAction;
use App\Http\Actions\File\DownloadFileAction;
use App\Http\Actions\File\FileContentAction;
use App\Http\Actions\File\GetAgreementVersionsAction;
use App\Http\Actions\File\GetRevisionVersionsAction;
use App\Http\Actions\File\PdfPreviewAction;
use App\Http\Actions\File\UploadAgreementAction;
use App\Http\Actions\File\UploadAttachmentAction;
use App\Http\Actions\File\UploadRevisionAction;
use App\Http\Controllers\Controller;
use App\Http\Queries\Contract\ContractDetailQuery;
use App\Http\Requests\Contract\UploadAgreementRequest;
use App\Http\Requests\Contract\UploadAttachmentRequest;
use App\Http\Requests\Contract\UploadRevisionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class ContractFileController extends Controller
{
    public function __construct(
        protected ContractDetailQuery $contractDetailQuery
    ) {}

    public function uploadRevision(UploadRevisionRequest $request, string $id, UploadRevisionAction $action): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function getRevisionVersions(Request $request, string $id, GetRevisionVersionsAction $action): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function download(string $id, DownloadFileAction $action): mixed
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract);
    }

    public function fileContent(string $id, int $versionNo, Request $request, FileContentAction $action): mixed
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $versionNo, $request);
    }

    public function attachmentFile(string $id, string $atId, AttachmentFileAction $action): mixed
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $atId);
    }

    public function changeVersion(Request $request, string $id, ChangeVersionAction $action): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function pdfPreview(Request $request, string $id, int $versionNo, PdfPreviewAction $action): mixed
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $versionNo, $request);
    }

    public function attachmentPdfPreview(string $id, string $atId, AttachmentPdfPreviewAction $action): mixed
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $atId);
    }



    public function uploadAttachment(UploadAttachmentRequest $request, string $id, UploadAttachmentAction $action): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function deleteAttachment(string $id, string $atId, DeleteAttachmentAction $action): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $atId);
    }

    public function uploadAgreement(UploadAgreementRequest $request, string $id, UploadAgreementAction $action): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, $request);
    }

    public function getAgreementVersions(string $id, GetAgreementVersionsAction $action): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract);
    }

    public function compareAgreementVersions(Request $request, string $id, CompareVersionsAction $action): Response
    {
        $contract = $this->contractDetailQuery->find($id);

        return $action->execute($contract, 'agreement', $request);
    }
}
