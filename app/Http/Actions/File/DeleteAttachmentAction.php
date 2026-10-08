<?php

namespace App\Http\Actions\File;

use App\Http\Formatters\ContractFormatter;
use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractAttachment;
use App\Models\Transaction\ContractHistory;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class DeleteAttachmentAction
{
    use ApiResponse;

    public function __construct(protected ContractFormatter $formatter) {}

    public function execute(Contract $contract, string $atId): JsonResponse
    {
        Gate::authorize('updateAttachment', $contract);

        /** @var ContractAttachment $attachment */
        $attachment = $contract->attachments()->findOrFail($atId);

        if (Storage::disk('local')->exists($attachment->file_path)) {
            Storage::disk('local')->delete($attachment->file_path);
        }

        $attachment->delete();

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_DELETED',
            'description' => "Hapus lampiran: {$attachment->label}",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return $this->successResponse($this->formatter->formatContract($contract), 'Lampiran berhasil dihapus');
    }
}
