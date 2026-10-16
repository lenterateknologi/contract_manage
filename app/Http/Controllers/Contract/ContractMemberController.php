<?php

namespace App\Http\Controllers\Contract;

use App\Http\Controllers\Controller;
use App\Models\Transaction\Contract;
use App\Services\Contract\ContractMemberService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContractMemberController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ContractMemberService $memberService
    ) {}

    /**
     * Get involved members for a contract (optionally filtered by type: 'team' vs 'all').
     */
    public function index(string $contractId, Request $request): JsonResponse
    {
        $contract = Contract::findOrFail($contractId);
        $type = $request->query('type');
        $user = Auth::user();

        $members = $this->memberService->getContractMembers($contract, $type, $user);

        return $this->successResponse($members, 'Contract members retrieved successfully');
    }
}
