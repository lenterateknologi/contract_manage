<?php

namespace App\Http\Actions\Export;

use App\Models\Contract;
use App\Models\FormSubmission;
use App\Models\FormTemplate;
use App\Services\Utils\PdfMetadataService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Spatie\Browsershot\Browsershot;

class ExportFormSubmissionPdfAction
{
    use HasExportHelpers;

    public function execute(Contract $contract, string $type, string $disposition = 'attachment', ?int $versionNo = null): mixed
    {
        set_time_limit(180);

        $template = FormTemplate::where('document_type', $type)->with('fields')->first();

        $docNumber = $contract->contract_no ?: ($contract->form_no ?: (string) $contract->id);
        $typeLabel = match (strtolower($type)) {
            'f1' => 'Formulir F1 Permohonan',
            'f2' => 'Formulir F2 Summary',
            default => strtoupper($type),
        };

        if (! $template) {
            if (request()->expectsJson() && ! request()->acceptsHtml()) {
                return response()->json(['message' => "Form template $type not found."], 404);
            }

            return response()->view('errors.pdf-preview-error', [
                'statusCode' => 404,
                'statusLabel' => 'Template Tidak Ditemukan',
                'title' => 'Template Dokumen Belum Dibuat',
                'message' => "Template formulir untuk tipe {$typeLabel} belum dikonfigurasi di sistem.",
                'details' => [
                    'Nomor Dokumen' => $docNumber,
                    'Tipe Dokumen' => $typeLabel,
                ],
            ], 404);
        }

        $submission = FormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $latestVersion = $submission ? $submission->versions()->orderByDesc('version_no')->first() : null;

        $targetVersion = $latestVersion;
        if ($submission && $versionNo !== null) {
            $targetVersion = $submission->versions()->where('version_no', $versionNo)->first();
        }

        if (! $targetVersion && $type === 'f1') {
            if (request()->expectsJson() && ! request()->acceptsHtml()) {
                return response()->json(['message' => 'Data form belum diisi.'], 404);
            }

            return response()->view('errors.pdf-preview-error', [
                'statusCode' => 404,
                'statusLabel' => 'Data Belum Tersedia',
                'title' => 'Data Formulir Belum Diisi',
                'message' => "Data formulir {$typeLabel} belum disimpan atau belum memiliki riwayat pengisian.",
                'details' => [
                    'Nomor Dokumen' => $docNumber,
                    'Tipe Dokumen' => $typeLabel,
                ],
            ], 404);
        }

        $vno = $targetVersion ? $targetVersion->version_no : 0;
        $pdfDir = "contracts/{$contract->id}/pdfs";
        $pdfFileName = "{$type}_v{$vno}.pdf";
        $pdfPath = "{$pdfDir}/{$pdfFileName}";

        $user = auth()->user();
        $docNumber = $contract->contract_no ?: ($contract->form_no ?: $contract->id);

        if (Storage::disk('local')->exists($pdfPath)) {
            $content = Storage::disk('local')->get($pdfPath);
            $processedContent = PdfMetadataService::injectMetadata($content, $user?->name, $user?->id, $docNumber);

            return response($processedContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");
        }

        try {
            // ponytail: Browsershot visits the same React page as the preview → 100% identical output
            $routeParams = [
                'id' => $contract->id,
                'type' => $type,
                'user_id' => $user?->id,
                'user_name' => $user?->name,
                'user_email' => $user?->email,
            ];
            if ($versionNo !== null) {
                $routeParams['version'] = $versionNo;
            }

            $printUrl = URL::temporarySignedRoute(
                'contracts.form-submissions.print',
                now()->addMinutes(10),
                $routeParams,
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $chromePath = file_exists('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')
                ? '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

            $finalPdf = Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath($chromePath)
                ->noSandbox()
                ->addChromiumArguments([
                    'disable-gpu',
                    'disable-dev-shm-usage',
                    'disable-setuid-sandbox',
                    'no-first-run',
                    'disable-extensions',
                ])
                ->timeout(180)
                ->paperSize(210, 297, 'mm')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(1000)
                ->pdf();

            if (! Storage::disk('local')->exists($pdfDir)) {
                Storage::disk('local')->makeDirectory($pdfDir);
            }
            Storage::disk('local')->put($pdfPath, $finalPdf);

            $processedPdf = PdfMetadataService::injectMetadata($finalPdf, $user?->name, $user?->id, $docNumber);

            return response($processedPdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");

        } catch (\Exception $e) {
            Log::error('Browsershot Form Submission Export Failed: '.$e->getMessage());
            abort(500, 'Gagal menghasilkan PDF: '.$e->getMessage());
        }
    }
}
