<?php

namespace App\Http\Actions\Export;

use App\Models\Contract;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Spatie\Browsershot\Browsershot;

class ExportAuditPdfAction
{
    public function execute(Contract $contract, Request $request)
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
                ->setDelay(500);

            $pdfDir = 'contracts/'.$contract->id.'/pdfs';
            $pdfFileName = 'Audit_Trail_'.Str::slug($contract->contract_no).'_'.md5($printUrl).'.pdf';
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

            $contract->load(['creator', 'contractType']);

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

            $pdf = Pdf::loadView('pdf.contract-audit', [
                'contract' => $contract,
                'histories' => $histories,
                'generated_at' => now()->format('d M Y H:i'),
                'generated_by' => Auth::user()->name,
            ]);

            return $pdf->download("Audit_Trail_{$contract->contract_no}.pdf");
        }
    }
}
