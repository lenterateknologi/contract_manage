<?php

namespace App\Http\Actions\File;

use App\Models\Contract;
use App\Models\ContractAttachment;
use App\Services\Utils\PdfMetadataService;
use App\Services\Utils\PdfService;
use Illuminate\Support\Facades\Storage;

class AttachmentPdfPreviewAction
{
    public function __construct(protected PdfService $pdfService) {}

    public function execute(Contract $contract, string $atId): mixed
    {
        $filePath = null;

        /** @var ContractAttachment|null $attachment */
        $attachment = $contract->attachments()->find($atId);
        $disk = 'local';
        if ($attachment) {
            $filePath = $attachment->file_path;
        } else {
            /** @var \App\Models\Approval|null $approval */
            $approval = $contract->approvals()->find($atId) ?? \App\Models\Approval::withTrashed()->where('contract_id', $contract->id)->find($atId);
            if ($approval && $approval->attachment_path) {
                $filePath = $approval->attachment_path;
            } else {
                /** @var \App\Models\ContractMessage|null $message */
                $message = $contract->messages()->find($atId);
                if ($message && $message->attachment_path) {
                    $filePath = $message->attachment_path;
                    $disk = 'public';
                }
            }
        }

        if (! $filePath || ! Storage::disk($disk)->exists($filePath)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $sourcePath = Storage::disk($disk)->path($filePath);
        $pdfDir = Storage::disk('local')->path("contracts/{$contract->id}/attachments/pdfs");
        $pdfPath = $pdfDir.'/'.pathinfo($filePath, PATHINFO_FILENAME).'.pdf';

        if (strtolower(pathinfo($filePath, PATHINFO_EXTENSION)) === 'pdf') {
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
            $user = auth()->user();
            $docNumber = $contract->contract_no ?: ($contract->form_no ?: $contract->id);
            $rawContent = file_get_contents($pdfPath);
            $processedContent = PdfMetadataService::injectMetadata($rawContent, $user?->name, $user?->id, $docNumber);

            return response($processedContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="'.basename($pdfPath).'"');
        }

        return response()->json(['message' => 'Failed to generate PDF.'], 500);
    }
}
