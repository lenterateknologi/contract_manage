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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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

    public function vendorDocumentFile(Request $request, string $id, string $docId): mixed
    {
        $contract = $this->contractDetailQuery->find($id);

        return $this->serveVendorDocument($request, $contract, $docId);
    }

    public function vendorDocumentPdfPreview(Request $request, string $id, string $docId): mixed
    {
        $contract = $this->contractDetailQuery->find($id);

        return $this->serveVendorDocument($request, $contract, $docId);
    }

    protected function serveVendorDocument(Request $request, $contract, string $docId): mixed
    {
        $fileName = $request->query('fileName');

        if (! $fileName) {
            if (str_contains($docId, '.') || str_contains($docId, '__')) {
                $fileName = $docId;
            } else {
                $vendor = $contract->vendor;
                $vendorDetail = $vendor ? ($vendor->vendor_detail ?? []) : [];
                $attachments = $this->extractVendorAttachments($vendorDetail);
                $fileName = $attachments[$docId] ?? null;
            }
        }

        if (! $fileName) {
            abort(404, 'Dokumen vendor tidak ditemukan.');
        }

        $baseUrl = rtrim(config('services.coma.base_url'), '/');
        $token = Cache::remember('coma_api_token', 300, function () use ($baseUrl) {
            $resp = Http::timeout(15)->post("{$baseUrl}/api/Authentication/authenticate", [
                'username' => config('services.coma.username'),
                'password' => config('services.coma.password'),
            ]);
            return ($resp->successful() && $resp->json('status') === 'success') ? $resp->json('data') : null;
        });

        if (! $token) {
            abort(502, 'Gagal terhubung ke layanan vendor COMA.');
        }

        $fileResp = Http::timeout(45)
            ->withToken($token)
            ->get("{$baseUrl}/api/FileUpload/DownloadFile", ['fileName' => $fileName]);

        if (! $fileResp->successful()) {
            abort(404, 'Dokumen tidak ditemukan di COMA.');
        }

        $body = $fileResp->json();
        $rawBase64 = is_array($body) ? ($body['data'] ?? null) : null;
        $binaryData = $rawBase64 ? base64_decode($rawBase64) : $fileResp->body();

        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        $contentType = $mimeTypes[$ext] ?? 'application/octet-stream';

        return response($binaryData, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'inline; filename="'.basename($fileName).'"',
        ]);
    }

    protected function extractVendorAttachments($obj, string $prefix = ''): array
    {
        $results = [];
        if (! is_array($obj)) {
            return $results;
        }

        $idx = 0;
        foreach ($obj as $key => $val) {
            $lowerKey = strtolower($key);
            $isAttachmentKey = str_contains($lowerKey, 'attachment') || str_contains($lowerKey, 'file');

            if ($isAttachmentKey && is_string($val) && trim($val) !== '') {
                $docKey = 'vdoc-'.$idx;
                $results[$docKey] = trim($val);
                $results[$key] = trim($val);
                $idx++;
            } elseif (is_array($val)) {
                $nested = $this->extractVendorAttachments($val, $key);
                $results = array_merge($results, $nested);
            }
        }

        return $results;
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
        $type = $request->query('type', 'agreement');

        return $action->execute($contract, $type, $request);
    }
}
