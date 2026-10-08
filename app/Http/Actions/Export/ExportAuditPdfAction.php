<?php

namespace App\Http\Actions\Export;

use App\Jobs\GeneratePdfJob;
use App\Models\Transaction\Contract;
use App\Services\Utils\PdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ExportAuditPdfAction
{
    public function queue(Contract $contract, Request $request)
    {
        Log::info("Audit PDF Queue Request: id={$contract->id}");

        try {
            $jobId = (string) Str::uuid();
            $user = Auth::user();

            $printUrl = URL::temporarySignedRoute(
                'contracts.audit.document.print',
                now()->addMinutes(30),
                [
                    'id' => $contract->id,
                    'search' => $request->search,
                    'actor_id' => $request->actor_id,
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                    'user_id' => $user?->id,
                    'user_name' => $user?->name,
                ],
            );

            if (app()->environment('local')) {
                $printUrl = str_replace('localhost', '127.0.0.1', $printUrl);
            }

            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $fileName = 'Audit_Trail_'.$safeNo.'_'.time().'.pdf';

            Log::info("Dispatching Audit PDF Job: {$jobId}");

            GeneratePdfJob::dispatch($jobId, $printUrl, $fileName);

            Cache::put('pdf_status_'.$jobId, ['status' => 'pending', 'progress' => 10], 1800);

            return response()->json([
                'success' => true,
                'job_id' => $jobId,
            ]);
        } catch (\Exception $e) {
            Log::critical('Audit PDF Queue Failure: '.$e->getMessage());

            return response()->json(['message' => 'Gagal antrikan PDF: '.$e->getMessage()], 500);
        }
    }

    public function execute(Contract $contract, Request $request)
    {
        set_time_limit(180);

        try {
            $query = $contract->histories()->with('actor');

            if ($request->filled('search')) {
                $query->where('description', 'like', '%'.$request->search.'%');
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

            $user = auth()->user();
            $html = view('pdf.contract-audit', [
                'contract' => $contract,
                'histories' => $histories,
                'generated_at' => now()->format('d/m/Y H:i'),
                'generated_by' => $request->generated_by ?? ($user ? $user->name : 'System'),
                'generated_by_id' => $request->generated_by_id ?? ($user ? $user->id : '-'),
            ])->render();

            $pdfContent = PdfService::browsershotHtml($html, 180);

            $pdfDir = 'contracts/'.$contract->id.'/pdfs';
            $pdfFileName = 'Audit_Trail_'.Str::slug($contract->contract_no ?: 'contract').'_'.time().'.pdf';
            $pdfPath = $pdfDir.'/'.$pdfFileName;
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
            Log::error('Audit Trail Browsershot Export Failed: '.$e->getMessage());
            abort(500, 'Gagal menghasilkan PDF: '.$e->getMessage());
        }
    }
}
