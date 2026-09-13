<?php

namespace App\Http\Controllers\Contract\Reference;

use App\Http\Controllers\Controller;
use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Services\Contract\Reference\ContractReferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractReferenceController extends Controller
{
    public function __construct(
        protected ContractReferenceService $referenceService
    ) {}

    /**
     * Get parent contract reference.
     */
    public function show(string $contractId): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $reference = $this->referenceService->getReference($contract);

        return response()->json([
            'status' => 'success',
            'data' => $reference,
        ]);
    }

    /**
     * Search available contracts to reference.
     */
    public function search(string $contractId, Request $request): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $keyword = $request->query('query') ?? $request->query('search');
        $limit = $request->integer('limit', 10);

        $results = $this->referenceService->searchAvailableReferences($contract, $keyword, $limit);

        return response()->json([
            'status' => 'success',
            'data' => $results,
        ]);
    }

    /**
     * Link or unlink reference.
     */
    public function update(string $contractId, Request $request): JsonResponse
    {
        $request->validate([
            'parent_id' => 'nullable|uuid|exists:t_contracts,id',
        ]);

        $contract = Contract::findOrFail($contractId);
        $updated = $this->referenceService->updateReference($contract, $request->input('parent_id'));

        return response()->json([
            'status' => 'success',
            'data' => ContractFormatter::formatContract($updated, true),
        ]);
    }
}
