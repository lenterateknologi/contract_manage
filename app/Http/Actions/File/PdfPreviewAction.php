<?php

namespace App\Http\Actions\File;

use App\Http\Actions\Export\ExportFormSubmissionPdfAction;
use App\Models\Contract;
use App\Models\ContractVersion;
use App\Services\Utils\PdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PdfPreviewAction
{
    public function __construct(
        protected ExportFormSubmissionPdfAction $exportAction,
        protected PdfService $pdfService
    ) {}

    public function execute(Contract $contract, int $versionNo, Request $request): mixed
    {
        $type = $request->query('type', 'contract');

        /** @var ContractVersion|null $version */
        $version = $contract->versions()
            ->where('document_type', $type)
            ->where('version_no', $versionNo)
            ->first();

        if (! $version && ($type === 'f1' || $type === 'f2')) {
            return $this->exportAction->execute($contract, $type, 'inline', $versionNo);
        }

        if (! $version || ! $version->file_path || ! Storage::disk('local')->exists($version->file_path)) {
            return response()->json(['message' => 'Source file not found.'], 404);
        }

        $sourcePath = Storage::disk('local')->path($version->file_path);
        $pdfDir = Storage::disk('local')->path("contracts/{$contract->id}/pdfs");
        $pdfPath = $pdfDir.'/'.pathinfo($version->file_path, PATHINFO_FILENAME).'.pdf';

        if ($this->pdfService->convertToPdf($sourcePath, $pdfDir, $pdfPath, (string) $contract->id)) {
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($pdfPath).'"',
            ]);
        }

        return response()->json(['message' => 'Failed to generate PDF.'], 500);
    }
}
