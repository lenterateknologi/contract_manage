<?php

namespace App\Actions\Export;

use App\Jobs\GeneratePdfJob;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ExportApprovalTimelinePdfQueueAction
{
    public function execute(Contract $contract, Request $request)
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
            $fileName = "Approval_Timeline_{$safeNo}_".time().'.pdf';

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
            Log::error('Failed to queue Approval Timeline PDF: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses laporan alur alur approval.',
            ], 500);
        }
    }
}
