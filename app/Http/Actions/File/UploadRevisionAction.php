<?php

namespace App\Http\Actions\File;

use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class UploadRevisionAction
{
    public function __construct(protected ContractFormatter $formatter) {}

    public function execute(Contract $contract, Request $request): JsonResponse
    {
        $type = $request->input('document_type', 'contract');

        // Apply Policy Check
        if ($type === 'f1') {
            Gate::authorize('updateF1', $contract);
        } elseif ($type === 'f2') {
            Gate::authorize('updateF2', $contract);
        } else {
            Gate::authorize('updateAgreement', $contract);
        }

        // Find latest version for this type
        $lastVer = ContractVersion::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->max('version_no') ?? 0;

        $newVer = $lastVer + 1;
        $userId = Auth::id();
        $hash = Str::random(12).'...';

        $typeLabel = strtoupper($type);
        $ext = $request->file('file')->getClientOriginalExtension();
        $safeNo = Str::slug($contract->contract_no ?: 'contract');
        $fileName = "{$safeNo}_{$typeLabel}_v{$newVer}.{$ext}";
        $filePath = $request->file('file')->storeAs("contracts/{$contract->id}", "v{$newVer}_{$type}_{$fileName}", 'local');

        ContractVersion::create([
            'contract_id' => $contract->id,
            'document_type' => $type,
            'version_no' => $newVer,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'change_log' => $request->changelog,
            'uploaded_by' => $userId,
            'file_hash' => $hash,
        ]);

        if ($type === 'contract') {
            $contract->update(['current_version' => $newVer]);
        }

        if (! in_array($contract->status, ['draft', 'revision'])) {
            $contract->update(['status' => 'in_review']);

            $approvals = $contract->approvals()->orderBy('sequence')->get();
            foreach ($approvals as $i => $a) {
                $a->update([
                    'status' => $i === 0 ? 'pending' : 'waiting',
                    'comment' => null,
                    'decided_at' => null,
                ]);
            }
        }

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_UPLOADED',
            'description' => "Upload revisi {$typeLabel} v{$newVer}",
            'actor_id' => $userId,
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatter->formatContract($contract));
    }
}
