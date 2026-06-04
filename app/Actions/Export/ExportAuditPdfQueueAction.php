<?php

namespace App\Actions\Export;

use App\Jobs\GeneratePdfJob;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ExportAuditPdfQueueAction
{
    public function execute(Contract $contract, Request $request)
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
}
