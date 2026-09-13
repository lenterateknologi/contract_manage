<?php

namespace App\Http\Actions\File;

use App\Http\Formatters\ContractFormatter;
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

        $uploadedFiles = [];
        if ($request->hasFile('files')) {
            $files = $request->file('files');
            $uploadedFiles = is_array($files) ? $files : [$files];
        } elseif ($request->hasFile('attachments')) {
            $files = $request->file('attachments');
            $uploadedFiles = is_array($files) ? $files : [$files];
        } elseif ($request->hasFile('file')) {
            $uploadedFiles = [$request->file('file')];
        }

        if (empty($uploadedFiles)) {
            return response()->json(['message' => 'Tidak ada berkas yang diunggah.'], 422);
        }

        $category = $request->input('category', 'Additional');
        $customLabel = $request->input('label');

        foreach ($uploadedFiles as $file) {
            if (!$file || !$file->isValid()) {
                continue;
            }

            $name = $file->getClientOriginalName();
            $ext = $file->getClientOriginalExtension();
            $label = (count($uploadedFiles) === 1 && $customLabel)
                ? $customLabel
                : pathinfo($name, PATHINFO_FILENAME);

            $path = $file->storeAs("contracts/{$contract->id}/attachments", Str::uuid().".{$ext}", 'local');

            ContractAttachment::create([
                'contract_id' => $contract->id,
                'label' => $label,
                'category' => $category,
                'file_name' => $name,
                'file_path' => $path,
                'file_type' => $file->getMimeType(),
                'uploaded_by' => Auth::id(),
            ]);

            ContractHistory::create([
                'contract_id' => $contract->id,
                'action' => 'FILE_UPLOADED',
                'description' => "Upload lampiran: {$label} ({$name})",
                'actor_id' => Auth::id(),
            ]);
        }

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatter->formatContract($contract));
    }
}
