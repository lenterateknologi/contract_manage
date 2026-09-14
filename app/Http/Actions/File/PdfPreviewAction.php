<?php

namespace App\Http\Actions\File;

use App\Http\Actions\Export\ExportFormSubmissionPdfAction;
use App\Models\Contract;
use App\Models\ContractVersion;
use App\Services\Utils\PdfMetadataService;
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

        $docNumber = $contract->contract_no ?: ($contract->form_no ?: (string) $contract->id);
        $typeLabel = match (strtolower($type)) {
            'f1' => 'Formulir F1 Permohonan',
            'f2' => 'Formulir F2 Summary',
            'agreement', 'contract' => 'Dokumen Perjanjian / Kontrak',
            default => strtoupper($type),
        };

        if (! $version || ! $version->file_path || ! Storage::disk('local')->exists($version->file_path)) {
            if ($request->expectsJson() && ! $request->acceptsHtml()) {
                return response()->json(['message' => 'Source file not found.'], 404);
            }

            return response()->view('errors.pdf-preview-error', [
                'statusCode' => 404,
                'statusLabel' => 'Berkas Tidak Ditemukan',
                'title' => 'Dokumen Belum Tersedia',
                'message' => "Berkas fisik untuk versi {$versionNo} ({$typeLabel}) belum diunggah atau tidak ditemukan di penyimpanan server.",
                'details' => [
                    'Nomor Dokumen' => $docNumber,
                    'Tipe Dokumen' => $typeLabel,
                    'Versi Dokumen' => 'Versi '.$versionNo,
                ],
            ], 404);
        }

        $sourcePath = Storage::disk('local')->path($version->file_path);
        $pdfDir = Storage::disk('local')->path("contracts/{$contract->id}/pdfs");
        $pdfPath = $pdfDir.'/'.pathinfo($version->file_path, PATHINFO_FILENAME).'.pdf';

        if ($this->pdfService->convertToPdf($sourcePath, $pdfDir, $pdfPath, (string) $contract->id)) {
            $user = auth()->user();
            $rawContent = file_get_contents($pdfPath);
            $processedContent = PdfMetadataService::injectMetadata($rawContent, $user?->name, $user?->id, $docNumber);

            return response($processedContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="'.basename($pdfPath).'"');
        }

        if ($request->expectsJson() && ! $request->acceptsHtml()) {
            return response()->json(['message' => 'Failed to generate PDF.'], 500);
        }

        return response()->view('errors.pdf-preview-error', [
            'statusCode' => 500,
            'statusLabel' => 'Gagal Memproses PDF',
            'title' => 'Gagal Menghasilkan Pratinjau Dokumen',
            'message' => 'Sistem tidak dapat mengonversi berkas dokumen ke format pratinjau PDF. Silakan coba muat ulang atau periksa format berkas yang diunggah.',
            'details' => [
                'Nomor Dokumen' => $docNumber,
                'Tipe Dokumen' => $typeLabel,
                'Versi Dokumen' => 'Versi '.$versionNo,
                'Nama Berkas' => $version->file_name ?: basename($version->file_path),
            ],
        ], 500);
    }
}

