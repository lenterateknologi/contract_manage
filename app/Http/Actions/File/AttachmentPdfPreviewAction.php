<?php

namespace App\Http\Actions\File;

use App\Models\Contract;
use App\Models\ContractAttachment;
use App\Services\Utils\PdfService;
use Illuminate\Support\Facades\Storage;

class AttachmentPdfPreviewAction
{
    public function __construct(protected PdfService $pdfService) {}

    public function execute(Contract $contract, string $atId): mixed
    {
        /** @var ContractAttachment $attachment */
        $attachment = $contract->attachments()->findOrFail($atId);

        if (! $attachment->file_path || ! Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $sourcePath = Storage::disk('local')->path($attachment->file_path);
        $pdfDir = Storage::disk('local')->path("contracts/{$contract->id}/attachments/pdfs");
        $pdfPath = $pdfDir.'/'.pathinfo($attachment->file_path, PATHINFO_FILENAME).'.pdf';

        if (strtolower(pathinfo($attachment->file_path, PATHINFO_EXTENSION)) === 'pdf') {
            if (! file_exists($pdfDir)) {
                mkdir($pdfDir, 0755, true);
            }
            if (! file_exists($pdfPath)) {
                copy($sourcePath, $pdfPath);
            }
        } else {
            $this->pdfService->convertToPdf($sourcePath, $pdfDir, $pdfPath, 'at_'.$atId);
        }

        if (file_exists($pdfPath)) {
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($pdfPath).'"',
            ]);
        }

        return response()->json(['message' => 'Failed to generate PDF.'], 500);
    }
}
