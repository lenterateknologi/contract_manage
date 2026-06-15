<?php

namespace App\Http\Actions\File;

use App\Models\Contract;
use App\Models\ContractAttachment;
use Illuminate\Support\Facades\Storage;

class AttachmentFileAction
{
    public function execute(Contract $contract, string $atId): mixed
    {
        /** @var ContractAttachment $attachment */
        $attachment = $contract->attachments()->findOrFail($atId);

        if ($attachment->file_path && Storage::disk('local')->exists($attachment->file_path)) {
            return response()->download(
                Storage::disk('local')->path($attachment->file_path),
                $attachment->file_name,
            );
        }

        return response()->json(['message' => 'File not found.'], 404);
    }
}
