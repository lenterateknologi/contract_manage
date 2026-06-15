<?php

namespace App\Http\Actions\Contract;

use App\Models\Approval;
use App\Models\Contract;
use App\Services\Workflow\ContractWorkflowService;

class RejectContractAction
{
    protected ContractWorkflowService $workflowService;

    public function __construct(ContractWorkflowService $workflowService)
    {
        $this->workflowService = $workflowService;
    }

    public function execute(Contract $contract, Approval $approval, string $reason, ?string $attachmentPath): Contract
    {
        return $this->workflowService->rejectContract($contract, $approval, $reason, $attachmentPath);
    }
}
