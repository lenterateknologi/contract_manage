<?php

namespace App\Http\Actions\File;

use App\Models\Transaction\Approval;
use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractAttachment;
use App\Models\Transaction\ContractMessage;
use Illuminate\Support\Facades\Storage;

class AttachmentFileAction
{
    public function execute(Contract $contract, string $atId): mixed
    {
        $filePath = null;
        $fileName = 'attachment';

        /** @var ContractAttachment|null $attachment */
        $attachment = $contract->attachments()->find($atId);
        $disk = 'local';
        if ($attachment) {
            $filePath = $attachment->file_path;
            $fileName = $attachment->file_name;
        } else {
            /** @var Approval|null $approval */
            $approval = $contract->approvals()->find($atId) ?? Approval::withTrashed()->where('contract_id', $contract->id)->find($atId);
            if ($approval && $approval->attachment_path) {
                $filePath = $approval->attachment_path;
                $matchedAt = $contract->attachments()->where('file_path', $approval->attachment_path)->first();
                $fileName = $matchedAt?->file_name ?: basename($approval->attachment_path);
            } else {
                /** @var ContractMessage|null $message */
                $message = $contract->messages()->find($atId);
                if ($message && $message->attachment_path) {
                    $filePath = $message->attachment_path;
                    $fileName = $message->attachment_name ?: basename($message->attachment_path);
                    $disk = 'public';
                }
            }
        }

        if ($filePath && Storage::disk($disk)->exists($filePath)) {
            $path = Storage::disk($disk)->path($filePath);
            $mime = Storage::disk($disk)->mimeType($filePath) ?? 'application/octet-stream';
            $disposition = request()->boolean('download') ? 'attachment' : 'inline';

            return response()->file($path, [
                'Content-Type' => $mime,
                'Content-Disposition' => "{$disposition}; filename=\"".basename($fileName).'"',
            ]);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }
}
