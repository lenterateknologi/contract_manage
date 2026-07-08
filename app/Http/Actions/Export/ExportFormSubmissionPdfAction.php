<?php

namespace App\Http\Actions\Export;

use App\Models\Contract;
use App\Models\FormSubmission;
use App\Models\FormTemplate;
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

        if (! $template) {
            return response()->json(['message' => "Form template $type not found."], 404);
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
            return response()->json(['message' => 'Data form belum diisi.'], 404);
        }

        $vno = $targetVersion ? $targetVersion->version_no : 0;
        $pdfDir = "contracts/{$contract->id}/pdfs";
        $pdfFileName = "{$type}_v{$vno}.pdf";
        $pdfPath = "{$pdfDir}/{$pdfFileName}";

        if (Storage::disk('local')->exists($pdfPath)) {
            $content = Storage::disk('local')->get($pdfPath);

            return response($content)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");
        }

        try {
            // ponytail: Browsershot visits the same React page as the preview → 100% identical output
            $routeParams = ['id' => $contract->id, 'type' => $type];
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

            $finalPdf = Browsershot::url($printUrl)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                ->noSandbox()
                ->addChromiumArguments([
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions',
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

            return response($finalPdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");

        } catch (\Exception $e) {
            Log::error('Browsershot Form Submission Export Failed: '.$e->getMessage());
            abort(500, 'Gagal menghasilkan PDF: '.$e->getMessage());
        }
    }
}
