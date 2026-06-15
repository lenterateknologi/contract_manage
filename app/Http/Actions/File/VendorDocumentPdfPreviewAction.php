<?php

namespace App\Http\Actions\File;

use App\Models\Contract;
use App\Models\VendorDocument;
use App\Services\Utils\PdfService;
use Illuminate\Support\Facades\Storage;

class VendorDocumentPdfPreviewAction
{
    public function __construct(protected PdfService $pdfService) {}

    public function execute(Contract $contract, string $docId): mixed
    {
        if (! $contract->vendor_id) {
            abort(404);
        }

        $document = VendorDocument::where('vendor_id', $contract->vendor_id)->findOrFail($docId);

        if (! Storage::disk('public')->exists($document->file_url)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $sourcePath = Storage::disk('public')->path($document->file_url);
        $pdfDir = Storage::disk('local')->path("vendors/{$contract->vendor_id}/documents/pdfs");
        $pdfPath = $pdfDir.'/'.pathinfo($document->file_url, PATHINFO_FILENAME).'.pdf';

        if (strtolower(pathinfo($document->file_url, PATHINFO_EXTENSION)) === 'pdf') {
            if (! file_exists($pdfDir)) {
                mkdir($pdfDir, 0755, true);
            }
            if (! file_exists($pdfPath)) {
                copy($sourcePath, $pdfPath);
            }
        } else {
            $this->pdfService->convertToPdf($sourcePath, $pdfDir, $pdfPath, 'vendor_'.$docId);
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
