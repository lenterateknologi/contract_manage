<?php

namespace App\Actions\Export;

use App\Models\Contract;
use App\Models\ContractHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportAuditExcelAction
{
    public function execute(Contract $contract, Request $request): StreamedResponse
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
            $query->where('description', 'like', '%'.$request->search.'%');
        }

        $histories = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit_trail_'.Str::slug($contract->contract_no ?: 'contract').'_'.date('Ymd').'.csv"',
        ];

        return new StreamedResponse(function () use ($histories, $contract) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for Excel

            fputcsv($handle, [
                'Waktu',
                'No. Kontrak',
                'Judul Kontrak',
                'Aksi',
                'Deskripsi',
                'Aktor',
            ]);

            /** @var ContractHistory $h */
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
}
