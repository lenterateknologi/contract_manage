<?php

namespace App\Http\Actions\File;

use App\Models\Contract;
use App\Models\ContractVersion;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetRevisionVersionsAction
{
    public function execute(Contract $contract, Request $request): JsonResponse
    {
        $type = $request->query('type', 'f1');

        /** @var Collection<int, ContractVersion> $versionsCollection */
        $versionsCollection = $contract->versions()
            ->where('document_type', $type)
            ->orderByDesc('version_no')
            ->with('uploader')
            ->get();

        $versions = $versionsCollection->map(fn ($v) => [
            'id' => $v->id,
            'version_no' => $v->version_no,
            'file_name' => $v->file_name,
            'file_path' => $v->file_path,
            'change_log' => $v->change_log,
            'uploaded_by' => $v->uploaded_by,
            'uploader' => $v->uploader ? ['name' => $v->uploader->name] : null,
            'created_at' => $v->created_at?->format('Y-m-d H:i:s') ?? '',
            'is_final' => $v->is_final,
        ]);

        return response()->json($versions);
    }
}
