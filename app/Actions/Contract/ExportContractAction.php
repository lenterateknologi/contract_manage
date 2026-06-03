<?php

namespace App\Actions\Contract;

use App\Jobs\GeneratePdfJob;
use App\Models\Contract;
use App\Models\ContractFormSubmission;
use App\Models\FormTemplate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportContractAction
{
    public function exportAuditExcel(Contract $contract, Request $request): StreamedResponse
    {
        $query = $contract->histories()->with('actor')->orderBy('created_at', 'desc');

        if ($request->action) {
            $query->where('action', $request->action);
        }
        if ($request->actor_id) {
            $query->where('actor_id', $request->actor_id);
        }
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->search) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        $histories = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit_trail_' . Str::slug($contract->contract_no ?: 'contract') . '_' . date('Ymd') . '.csv"',
        ];

        return new StreamedResponse(function () use ($histories, $contract) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF)); // BOM for Excel

            fputcsv($handle, [
                'Waktu',
                'No. Kontrak',
                'Judul Kontrak',
                'Aksi',
                'Deskripsi',
                'Aktor',
            ]);

            /** @var \App\Models\ContractHistory $h */
            foreach ($histories as $h) {
                fputcsv($handle, [
                    $h->created_at?->format('Y-m-d H:i:s') ?? '',
                    $contract->contract_no,
                    $contract->title,
                    strtoupper($h->action),
                    $h->description,
                    $h->actor->name ?? 'System',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    public function exportApprovalTimelinePdfQueue(Contract $contract, Request $request)
    {
        Log::info("Approval Timeline PDF Queue Request: id={$contract->id}");

        try {
            $jobId = (string) Str::uuid();
            $userName = Auth::user() ? Auth::user()->name : 'System';

            $params = array_merge($request->only(['status', 'role', 'department']), [
                'id' => $contract->id,
                'generated_by' => $userName,
            ]);

            if (app()->environment('local')) {
                $rootUrl = config('app.url');
                if (str_contains($rootUrl, 'localhost')) {
                    URL::forceRootUrl(str_replace('localhost', '127.0.0.1', $rootUrl));
                }
            }

            $printUrl = URL::temporarySignedRoute(
                'contracts.approval.document.print',
                now()->addMinutes(30),
                $params,
            );

            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $fileName = "Approval_Timeline_{$safeNo}_" . time() . '.pdf';

            GeneratePdfJob::dispatch(
                $jobId,
                $printUrl,
                $fileName,
            );

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
                'message' => 'Laporan alur approval sedang diproses.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue Approval Timeline PDF: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses laporan alur approval.',
            ], 500);
        }
    }

    public function exportAuditPdfQueue(Contract $contract, Request $request)
    {
        Log::info("Audit PDF Queue Request: id={$contract->id}");

        try {
            $jobId = (string) Str::uuid();

            $printUrl = URL::temporarySignedRoute(
                'contracts.audit.document.print',
                now()->addMinutes(30),
                [
                    'id' => $contract->id,
                    'search' => $request->search,
                    'actor_id' => $request->actor_id,
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                ],
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $fileName = 'Audit_Trail_' . $safeNo . '_' . time() . '.pdf';

            Log::info("Dispatching Audit PDF Job: {$jobId}");

            GeneratePdfJob::dispatch($jobId, $printUrl, $fileName);

            Cache::put('pdf_status_' . $jobId, ['status' => 'pending', 'progress' => 10], 1800);

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
            ]);

        } catch (\Exception $e) {
            Log::critical('Audit PDF Queue Failure: ' . $e->getMessage());

            return response()->json(['message' => 'Gagal antrikan PDF: ' . $e->getMessage()], 500);
        }
    }

    public function exportAuditPdf(Contract $contract, Request $request)
    {
        set_time_limit(180);

        try {
            $printUrl = URL::temporarySignedRoute(
                'contracts.audit.document.print',
                now()->addMinutes(15),
                ['id' => $contract->id, 'search' => $request->search, 'actor_id' => $request->actor_id, 'date_from' => $request->date_from, 'date_to' => $request->date_to],
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $pdfContent = \Spatie\Browsershot\Browsershot::url($printUrl)
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
                ->setDelay(500);

            $pdfDir = 'contracts/' . $contract->id . '/pdfs';
            $pdfFileName = 'Audit_Trail_' . Str::slug($contract->contract_no) . '_' . md5($printUrl) . '.pdf';
            $pdfPath = $pdfDir . '/' . $pdfFileName;
            $disposition = 'attachment';

            if (Storage::disk('local')->exists($pdfPath)) {
                $finalPdf = Storage::disk('local')->get($pdfPath);
            } else {
                $finalPdf = $pdfContent->pdf();

                if (! Storage::disk('local')->exists($pdfDir)) {
                    Storage::disk('local')->makeDirectory($pdfDir);
                }
                Storage::disk('local')->put($pdfPath, $finalPdf);
            }

            return response($finalPdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "$disposition; filename=\"{$pdfFileName}\"");

        } catch (\Exception $e) {
            Log::error('Audit Trail Browsershot Export Failed: ' . $e->getMessage());

            $contract->load(['creator', 'contractType']);

            $query = $contract->histories()->with('actor');
            if ($request->filled('search')) {
                $query->where('description', 'like', '%' . $request->search . '%');
            }
            if ($request->filled('actor_id')) {
                $query->where('actor_id', $request->actor_id);
            }
            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            $histories = $query->orderBy('created_at', 'asc')->get();

            $pdf = Pdf::loadView('pdf.contract-audit', [
                'contract' => $contract,
                'histories' => $histories,
                'generated_at' => now()->format('d M Y H:i'),
                'generated_by' => Auth::user()->name,
            ]);

            return $pdf->download("Audit_Trail_{$contract->contract_no}.pdf");
        }
    }

    public function exportFormSubmissionPdfQueue(Contract $contract, string $type, Request $request)
    {
        Log::info("PDF Queue Request: id={$contract->id}, type={$type}");

        $submission = ContractFormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $templateId = $request->input('form_template_id');
        if ($templateId) {
            $template = FormTemplate::find($templateId);
        } else {
            $template = $submission ? $submission->formTemplate : FormTemplate::where('document_type', $type)->first();
        }

        if (! $template) {
            Log::error("Template not found in PDF Queue. Type: {$type}, Provided ID: " . ($templateId ?? 'none'));

            return response()->json(['message' => 'Template not found.'], 404);
        }

        $formDataRaw = $request->input('data');
        if ($formDataRaw) {
            $formData = is_string($formDataRaw) ? json_decode($formDataRaw, true) : $formDataRaw;
        } else {
            /** @var \App\Models\ContractFormSubmissionVersion|null $latestVersion */
            $latestVersion = $submission ? $submission->versions()->orderByDesc('version_no')->first() : null;
            $formData = $latestVersion ? ($latestVersion->form_data ?? []) : [];
        }

        if ($type === 'f2') {
            $f1Submission = ContractFormSubmission::where('contract_id', $contract->id)
                ->where('document_type', 'f1')
                ->first();

            $latestF1 = $f1Submission ? $f1Submission->versions()->orderByDesc('version_no')->first() : null;
            $f1Data = $latestF1 ? ($latestF1->form_data ?? []) : [];

            $formData = $this->applyInheritance($f1Data, $contract, $formData);
        }

        try {
            $jobId = (string) Str::uuid();
            $cacheKey = 'pdf_adhoc_' . $jobId;

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
            $fileName = $safeNo . '_' . strtoupper($type) . '_' . time() . '.pdf';

            Log::info("Dispatching PDF Job: {$jobId} for file: {$fileName}");
            GeneratePdfJob::dispatch($jobId, $printUrl, $fileName);

            Cache::put('pdf_status_' . $jobId, ['status' => 'pending', 'progress' => 10], 1800);

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
            ]);
        } catch (\Exception $e) {
            Log::critical("PDF Queue Failure for ID {$contract->id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'type' => $type,
            ]);

            return response()->json([
                'message' => 'Gagal antrikan PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function exportFormSubmissionPdf(Contract $contract, string $type, string $disposition = 'attachment'): mixed
    {
        set_time_limit(120);

        $template = FormTemplate::where('document_type', $type)->first();

        if (! $template) {
            return response()->json(['message' => "Form template $type not found."], 404);
        }

        $submission = ContractFormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        /** @var \App\Models\ContractFormSubmissionVersion|null $latestVersion */
        $latestVersion = $submission ? $submission->versions()->orderByDesc('version_no')->first() : null;
        $formData = $latestVersion ? ($latestVersion->form_data ?? []) : [];

        if ($type === 'f2') {
            $f1Submission = ContractFormSubmission::where('contract_id', $contract->id)
                ->where('document_type', 'f1')
                ->first();

            /** @var \App\Models\ContractFormSubmissionVersion|null $latestF1 */
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
                ['template' => $template->id, 'data' => array_key_exists('id', $formData) ? json_encode($formData) : json_encode($formData)],
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $pdfContent = \Spatie\Browsershot\Browsershot::url($printUrl)
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
            Log::error('Browsershot Export Failed: ' . $e->getMessage());

            $fields = $template->fields->sortBy('order');
            $pdf = Pdf::loadView('pdf.form-template', [
                'template' => $template,
                'formData' => $formData,
                'fields' => $fields,
                'contract' => $contract,
            ]);

            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $fileName = $safeNo . '_' . strtoupper($type) . '.pdf';
            if ($disposition === 'inline') {
                return $pdf->stream($fileName);
            }

            return $pdf->download($fileName);
        }
    }

    public function applyInheritance(array $f1Data, Contract $contract, array $existingData = []): array
    {
        $formData = array_merge($f1Data, $existingData);

        $inheritanceMap = [
            'meta_perjanjian_tentang' => 'meta_judul_kontrak',
            'meta_f2_scope' => 'meta_ringkasan_klausul',
            'meta_f2_price' => 'meta_nilai_transaksi',
            'meta_f2_payment' => 'meta_mekanisme_pembayaran',
            'meta_f2_tenure' => 'meta_masa_berlaku',
            'meta_f2_location' => 'meta_lokasi',
            'perjanjian_tentang' => 'meta_judul_kontrak',
            'f2_scope' => 'meta_ringkasan_klausul',
        ];

        foreach ($inheritanceMap as $f2Field => $f1Field) {
            if (empty($formData[$f2Field]) && ! empty($f1Data[$f1Field])) {
                $formData[$f2Field] = $f1Data[$f1Field];
            }
        }

        $f1PassthroughFields = [
            'meta_p1_entity', 'meta_p1_signer', 'meta_p1_signer_position', 'meta_p1_alamat',
            'meta_p2_entity', 'meta_p2_signer', 'meta_p2_signer_position', 'meta_p2_alamat',
            'meta_judul_kontrak', 'meta_tgl_dibuat', 'meta_tipe_perjanjian', 'meta_nomor',
            'meta_topik', 'meta_sub_topik', 'meta_ringkasan_klausul',
            'v_p1_entity', 'v_p2_entity',
        ];
        foreach ($f1PassthroughFields as $key) {
            if (empty($formData[$key]) && ! empty($f1Data[$key])) {
                $formData[$key] = $f1Data[$key];
            }
        }

        if (empty($formData['meta_p1_entity'])) {
            $formData['meta_p1_entity'] = 'PT. Lentera Teknologi';
        }
        if (empty($formData['meta_p1_signer'])) {
            $formData['meta_p1_signer'] = $contract->initiator->name ?: ($contract->creator->name ?? '');
        }
        if (empty($formData['meta_p1_signer_position'])) {
            $formData['meta_p1_signer_position'] = $contract->initiator->role ?? $contract->creator->role ?? 'Direktur';
        }
        if (empty($formData['meta_p1_alamat'])) {
            $formData['meta_p1_alamat'] = 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan';
        }

        if ($contract->vendor_id && $contract->vendor) {
            $v = $contract->vendor;
            if (empty($formData['meta_p2_entity'])) {
                $formData['meta_p2_entity'] = $v->name;
            }
            if (empty($formData['meta_p2_signer'])) {
                $formData['meta_p2_signer'] = $pic = $v->pic_name;
            }
            if (empty($formData['meta_p2_signer_position'])) {
                $formData['meta_p2_signer_position'] = $v->pic_position;
            }
            if (empty($formData['meta_p2_alamat'])) {
                $formData['meta_p2_alamat'] = $v->address;
            }
        }

        if (empty($formData['meta_nomor'])) {
            $formData['meta_nomor'] = $contract->contract_no;
        }
        if (empty($formData['meta_topik'])) {
            $formData['meta_topik'] = $contract->contractType->name ?? $contract->contract_type ?? '';
        }
        if (empty($formData['meta_tipe_perjanjian'])) {
            $formData['meta_tipe_perjanjian'] = $contract->transaction_type ?? 'Perjanjian Baru';
        }
        if (empty($formData['meta_tgl_dibuat'])) {
            $formData['meta_tgl_dibuat'] = $contract->contract_date ? $contract->contract_date->toDateString() : now()->toDateString();
        }

        return $formData;
    }
}
