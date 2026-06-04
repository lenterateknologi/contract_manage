<?php

namespace App\Actions\File;

use App\Models\Contract;
use Illuminate\Http\JsonResponse;

class GetAgreementVersionsAction
{
    public function execute(Contract $contract): JsonResponse
    {
        $versions = $contract->versions()
            ->where('document_type', 'agreement')
            ->orderByDesc('version_no')
            ->with('uploader')
            ->get();

        return response()->json($versions);
    }
}
