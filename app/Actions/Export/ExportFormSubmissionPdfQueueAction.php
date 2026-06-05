<?php

namespace App\Actions\Export;

use App\Jobs\GeneratePdfJob;
use App\Models\Contract;
use App\Models\FormSubmission;
use App\Models\FormSubmissionHistory;
use App\Models\FormTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ExportFormSubmissionPdfQueueAction
{
    use HasExportHelpers;

    public function execute(Contract $contract, string $type, Request $request)
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

            Log::info("Prepping PDF Cache: {$cacheKey}");
            Cache::put($cacheKey, [
                'template' => $template->toArray() + ['fields' => $template->fields->toArray()],
                'formData' => $formData,
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
}
