<?php

namespace App\Actions\File;

use App\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractAttachment;
use App\Models\ContractHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class UploadAttachmentAction
{
    public function __construct(protected ContractFormatter $formatter) {}

    public function execute(Contract $contract, Request $request): JsonResponse
    {
        Gate::authorize('updateAttachment', $contract);

        $file = $request->file('file');
        $name = $file->getClientOriginalName();
        $ext = $file->getClientOriginalExtension();
        $path = $file->storeAs("contracts/{$contract->id}/attachments", Str::uuid().".{$ext}", 'local');

        ContractAttachment::create([
            'contract_id' => $contract->id,
            'label' => $request->label,
            'category' => $request->category,
            'file_name' => $name,
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'uploaded_by' => Auth::id(),
        ]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_UPLOADED',
            'description' => "Upload lampiran: {$request->label} ({$name})",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatter->formatContract($contract));
    }
}
