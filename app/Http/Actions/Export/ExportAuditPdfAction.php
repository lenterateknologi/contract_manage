<?php

namespace App\Http\Actions\Export;

use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Browsershot\Browsershot;

class ExportAuditPdfAction
{
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

            $chromePath = file_exists('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')
                ? '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

            $pdfContent = Browsershot::html($html)
                ->setNodeBinary('/opt/homebrew/bin/node')
                ->setNpmBinary('/opt/homebrew/bin/npm')
                ->setChromePath($chromePath)
                ->noSandbox()
                ->addChromiumArguments([
                    'disable-gpu',
                    'disable-dev-shm-usage',
                    'disable-setuid-sandbox',
                    'no-first-run',
                    'disable-extensions',
                ])
                ->timeout(180)
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->setDelay(500);

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
