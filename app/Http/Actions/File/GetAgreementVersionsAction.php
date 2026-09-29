<?php

namespace App\Http\Actions\File;

use App\Models\Contract;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetAgreementVersionsAction
{
    use ApiResponse;

    public function execute(Contract $contract, ?Request $request = null): JsonResponse
    {
        $query = $contract->versions()
            ->whereIn('document_type', ['agreement', 'contract'])
            ->orderByDesc('version_no')
            ->with('uploader:id,name,role_id,email');

        if ($request && ($request->has('page') || $request->has('per_page'))) {
            $perPage = $request->integer('per_page', 10);
            $versions = $query->paginate($perPage);
        } else {
            $versions = $query->get();
        }

        return $this->successResponse($versions, 'Agreement versions retrieved successfully');
    }
}
