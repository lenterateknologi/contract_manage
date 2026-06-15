<?php

namespace App\Http\Actions\Contract;

use App\Models\Contract;
use App\Models\ContractHistory;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Support\Facades\Auth;

class UpdateContractAction
{
    protected ContractWorkflowService $workflowService;

    public function __construct(ContractWorkflowService $workflowService)
    {
        $this->workflowService = $workflowService;
    }

    public function execute(Contract $contract, array $validated): Contract
    {
        $contract->update($validated);

        // If the contract is in draft state, the workflow or steps might need to change
        // due to changes in metadata (e.g. tax_required) or contract type.
        if ($contract->status === 'draft') {
            $contract = $this->workflowService->sendForApproval($contract, null, null, false);
        }

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'CONTRACT_UPDATED',
            'description' => 'Informasi kontrak diperbarui',
            'actor_id' => Auth::id(),
        ]);

        return $contract;
    }
}
