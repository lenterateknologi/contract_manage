<?php

namespace App\Actions\File;

use App\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChangeVersionAction
{
    public function __construct(protected ContractFormatter $formatter) {}

    public function execute(Contract $contract, Request $request): JsonResponse
    {
        $request->validate(['version_no' => 'required|integer']);

        $version = $contract->versions()->where('version_no', $request->version_no)->firstOrFail();

        $contract->update(['current_version' => $request->version_no]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'VERSION_CHANGED',
            'description' => "Versi aktif diubah ke v{$request->version_no}",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user']);

        return response()->json($this->formatter->formatContract($contract));
    }
}
