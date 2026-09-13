<?php

namespace App\Http\Controllers\Contract;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Services\Contract\ContractMemberService;
use Illuminate\Http\JsonResponse;

class ContractMemberController extends Controller
{
    public function __construct(
        protected ContractMemberService $memberService
    ) {}

    /**
     * Get all involved members for a contract.
     */
    public function index(string $contractId): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $members = $this->memberService->getContractMembers($contract);

        return response()->json([
            'status' => 'success',
            'data' => $members,
        ]);
    }
}
