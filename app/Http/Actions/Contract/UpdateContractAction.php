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
        if ($contract->status === 'draft' && empty($contract->workflow_id)) {
            $contract = $this->workflowService->sendForApproval($contract, null, null, false);
        }

        if (array_key_exists('assigned_pic_id', $validated) && $validated['assigned_pic_id']) {
            $newPicId = $validated['assigned_pic_id'];
            $newPic = \App\Models\User::find($newPicId);
            if ($newPic) {
                $picApprovals = \App\Models\Approval::where('contract_id', $contract->id)
                    ->whereIn('status', ['pending', 'waiting'])
                    ->where(function ($q) {
                        $q->whereHas('workflowStep', function ($sq) {
                            $sq->where('approver_type', 'assigned_pic')
                                ->orWhereHas('approverAuthorities', fn ($aq) => $aq->where('authority_type', 'assigned_pic'));
                        })->orWhere('role', 'Staff Legal');
                    })
                    ->get();

                foreach ($picApprovals as $appr) {
                    $appr->update([
                        'user_id' => $newPic->id,
                        'approver_name' => $newPic->name,
                    ]);
                }
            }
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
