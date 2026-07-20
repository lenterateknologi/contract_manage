<?php

namespace App\Http\Actions\Export;

use App\Exports\AuditReportExport;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class ExportAuditExcelAction
{
    public function execute(Contract $contract, Request $request)
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

        $fileName = 'audit_trail_'.Str::slug($contract->form_no ?: 'contract').'_'.date('Ymd_His').'.xlsx';

        return Excel::download(new AuditReportExport($histories, $contract), $fileName);
    }
}
