<?php

namespace App\Actions\Export;

use App\Models\Contract;
use App\Models\FormSubmission;
use App\Models\FormSubmissionHistory;
use App\Models\FormTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Spatie\Browsershot\Browsershot;

class ExportFormSubmissionPdfAction
{
    use HasExportHelpers;

    public function execute(Contract $contract, string $type, string $disposition = 'attachment'): mixed
    {
        set_time_limit(120);

        $template = FormTemplate::where('document_type', $type)->first();

        if (! $template) {
            return response()->json(['message' => "Form template $type not found."], 404);
        }

        $submission = FormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        /** @var FormSubmissionHistory|null $latestVersion */
        $latestVersion = $submission ? $submission->versions()->orderByDesc('version_no')->first() : null;
        $formData = $latestVersion ? ($latestVersion->form_data ?? []) : [];

        if ($type === 'f2') {
            $f1Submission = FormSubmission::where('contract_id', $contract->id)
                ->where('document_type', 'f1')
                ->first();

            /** @var FormSubmissionHistory|null $latestF1 */
            $latestF1 = $f1Submission ? $f1Submission->versions()->orderByDesc('version_no')->first() : null;
            $f1Data = $latestF1 ? ($latestF1->form_data ?? []) : [];

            $formData = $this->applyInheritance($f1Data, $contract, $formData);
        }

        if (! $formData && $type === 'f1') {
            return response()->json(['message' => 'Data form belum diisi.'], 404);
        }

        $vno = $latestVersion ? $latestVersion->version_no : 0;
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
            $printUrl = URL::temporarySignedRoute(
                'admin.form-templates.render-print',
                now()->addMinutes(10),
                ['template' => $template->id, 'data' => json_encode($formData)],
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $pdfContent = Browsershot::url($printUrl)
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
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitForSelector('#pdf-render-complete')
                ->setDelay(200);

            $finalPdf = $pdfContent->pdf();

            if (! Storage::disk('local')->exists($pdfDir)) {
                Storage::disk('local')->makeDirectory($pdfDir);
            }
            Storage::disk('local')->put($pdfPath, $finalPdf);

            return response($finalPdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");

        } catch (\Exception $e) {
            Log::error('Browsershot Export Failed: '.$e->getMessage());
            abort(500, 'Gagal menghasilkan PDF: '.$e->getMessage());
        }
    }
}
