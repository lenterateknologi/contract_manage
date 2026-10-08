<?php

namespace App\Http\Actions\Export;

use App\Models\Transaction\Contract;
use App\Services\Utils\PdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExportApprovalTimelinePdfAction
{
    public function execute(Contract $contract, Request $request)
    {
        set_time_limit(180);

        try {
            $approvalsQuery = $contract->approvals()->with(['approver.department', 'approver.division'])->orderBy('sequence');

            if ($request->filled('status')) {
                $approvalsQuery->where('status', $request->status);
            }
            if ($request->filled('role')) {
                $approvalsQuery->where('role', 'like', '%'.$request->role.'%');
            }
            if ($request->filled('department')) {
                $approvalsQuery->where(function ($q) use ($request) {
                    $q->whereHas('approver.department', function ($qq) use ($request) {
                        $qq->where('name', 'like', '%'.$request->department.'%');
                    })->orWhereHas('approver.division', function ($qq) use ($request) {
                        $qq->where('name', 'like', '%'.$request->department.'%');
                    });
                });
            }

            $approvals = $approvalsQuery->get();

            $user = auth()->user();
            $html = view('pdf.contract-approval', [
                'contract' => $contract,
                'approvals' => $approvals,
                'generated_at' => now()->format('d/m/Y H:i'),
                'generated_by' => $request->generated_by ?? ($user ? $user->name : 'System'),
                'generated_by_id' => $request->generated_by_id ?? ($user ? $user->id : '-'),
            ])->render();

            $pdfContent = PdfService::browsershotHtml($html, 180);

            $pdfDir = 'contracts/'.$contract->id.'/pdfs';
            $safeNo = Str::slug($contract->contract_no ?: 'contract');
            $pdfFileName = "Approval_Timeline_{$safeNo}_".time().'.pdf';
            $pdfPath = $pdfDir.'/'.$pdfFileName;

            $finalPdf = $pdfContent->pdf();

            if (! Storage::disk('local')->exists($pdfDir)) {
                Storage::disk('local')->makeDirectory($pdfDir);
            }
            Storage::disk('local')->put($pdfPath, $finalPdf);

            return response($finalPdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', "attachment; filename=\"{$pdfFileName}\"");

        } catch (\Exception $e) {
            Log::error('Approval Timeline Browsershot Export Failed: '.$e->getMessage());
            abort(500, 'Gagal menghasilkan PDF: '.$e->getMessage());
        }
    }
}
