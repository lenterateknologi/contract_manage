<?php

namespace App\Http\Actions\Export;

use App\Jobs\GeneratePdfJob;
use App\Models\Master\FormTemplate;
use App\Models\Transaction\Contract;
use App\Models\Transaction\FormSubmission;
use App\Models\Transaction\FormSubmissionHistory;
use App\Services\Utils\PdfMetadataService;
use App\Services\Utils\PdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Spatie\Browsershot\Browsershot;

class ExportFormSubmissionPdfAction
{
    use HasExportHelpers;

    public function queue(Contract $contract, string $type, Request $request)
    {
        Log::info("PDF Queue Request: id={$contract->id}, type={$type}");

        $submission = FormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $templateId = $request->input('form_template_id');
        if ($templateId) {
            $template = FormTemplate::find($templateId);
        } else {
            $template = $submission ? $submission->formTemplate : FormTemplate::where('document_type', $type)->first();
        }

        if (! $template) {
            Log::error("Template not found in PDF Queue. Type: {$type}, Provided ID: ".($templateId ?? 'none'));

            return response()->json(['message' => 'Template not found.'], 404);
        }

        $formDataRaw = $request->input('data');
        if ($formDataRaw) {
            $formData = is_string($formDataRaw) ? json_decode($formDataRaw, true) : $formDataRaw;
        } else {
            /** @var FormSubmissionHistory|null $latestVersion */
            $latestVersion = $submission ? $submission->versions()->orderByDesc('version_no')->first() : null;
            $formData = $latestVersion ? ($latestVersion->form_data ?? []) : [];
        }

        if ($type === 'f2') {
            $f1Submission = FormSubmission::where('contract_id', $contract->id)
                ->where('document_type', 'f1')
                ->first();

            $latestF1 = $f1Submission ? $f1Submission->versions()->orderByDesc('version_no')->first() : null;
            $f1Data = $latestF1 ? ($latestF1->form_data ?? []) : [];

            $formData = $this->applyInheritance($f1Data, $contract, $formData);
        }

        try {
            $jobId = (string) Str::uuid();
            $cacheKey = 'pdf_adhoc_'.$jobId;
            $user = Auth::user();

            Log::info("Prepping PDF Cache: {$cacheKey}");
            Cache::put($cacheKey, [
                'template' => $template->toArray() + ['fields' => $template->fields->toArray()],
                'formData' => $formData,
                'printedBy' => [
                    'name' => $user?->name ?? 'System',
                    'id' => $user?->id ?? '-',
                    'email' => $user?->email ?? '',
                    'timestamp' => now()->format('d/m/Y H:i:s'),
                ],
            ], 1800);

            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-adhoc',
                now()->addMinutes(30),
                ['key' => $cacheKey],
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $safeNo = $contract->contract_no ? Str::slug($contract->contract_no) : 'contract';
            $fileName = $safeNo.'_'.strtoupper($type).'_'.time().'.pdf';

            Log::info("Dispatching PDF Job: {$jobId} for file: {$fileName}");
            GeneratePdfJob::dispatch($jobId, $printUrl, $fileName);

            Cache::put('pdf_status_'.$jobId, ['status' => 'pending', 'progress' => 10], 1800);

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
            ]);
        } catch (\Exception $e) {
            Log::critical("PDF Queue Failure for ID {$contract->id}: ".$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'type' => $type,
            ]);

            return response()->json([
                'message' => 'Gagal antrikan PDF: '.$e->getMessage(),
            ], 500);
        }
    }

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

            $finalPdf = PdfService::browsershotUrl($printUrl, 180)
                ->waitForSelector('#pdf-render-complete')
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
