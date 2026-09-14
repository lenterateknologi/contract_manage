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

        $docNumber = $contract->contract_no ?: ($contract->form_no ?: (string) $contract->id);

        if (! $filePath || ! Storage::disk($disk)->exists($filePath)) {
            if (request()->expectsJson() && ! request()->acceptsHtml()) {
                return response()->json(['message' => 'File not found.'], 404);
            }

            return response()->view('errors.pdf-preview-error', [
                'statusCode' => 404,
                'statusLabel' => 'Lampiran Tidak Ditemukan',
                'title' => 'Berkas Lampiran Tidak Ditemukan',
                'message' => 'Berkas fisik lampiran tidak ditemukan pada penyimpanan server atau telah dipindahkan.',
                'details' => [
                    'Nomor Dokumen' => $docNumber,
                    'ID Lampiran' => $atId,
                    'Judul Kontrak' => $contract->title ?: '-',
                ],
            ], 404);
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
            $rawContent = file_get_contents($pdfPath);
            $processedContent = PdfMetadataService::injectMetadata($rawContent, $user?->name, $user?->id, $docNumber);

            return response($processedContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="'.basename($pdfPath).'"');
        }

        if (request()->expectsJson() && ! request()->acceptsHtml()) {
            return response()->json(['message' => 'Failed to generate PDF.'], 500);
        }

        return response()->view('errors.pdf-preview-error', [
            'statusCode' => 500,
            'statusLabel' => 'Gagal Memproses Lampiran',
            'title' => 'Gagal Menghasilkan Pratinjau Lampiran',
            'message' => 'Sistem tidak dapat mengonversi berkas lampiran ke format PDF untuk pratinjau.',
            'details' => [
                'Nomor Dokumen' => $docNumber,
                'ID Lampiran' => $atId,
                'Nama Berkas' => basename($filePath),
            ],
        ], 500);
    }
}
