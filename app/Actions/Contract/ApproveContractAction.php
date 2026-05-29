<?php

namespace App\Actions\Contract;

use App\Models\AccessModule;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\Role;
use App\Services\ContractWorkflowService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApproveContractAction
{
    protected ContractWorkflowService $workflowService;

    public function __construct(ContractWorkflowService $workflowService)
    {
        $this->workflowService = $workflowService;
    }

    public function approve(Contract $contract, Approval $approval, ?string $note, ?string $attachmentPath, ?string $assignedPicId, ?string $executionOrder, ?string $actionCode = 'approve'): Contract
    {
        return $this->workflowService->approveContract(
            $contract,
            $approval,
            $note,
            $attachmentPath,
            $assignedPicId,
            $executionOrder,
            $actionCode ?? 'approve',
        );
    }

    public function bulkApprove(array $ids, string $note): int
    {
        return DB::transaction(function () use ($ids, $note) {
            $count = 0;
            foreach ($ids as $id) {
                $approval = Approval::where('contract_id', $id)
                    ->where('user_id', Auth::id())
                    ->where('status', 'pending')
                    ->first();

                if ($approval) {
                    $contract = Contract::find($id);
                    if ($contract instanceof Contract) {
                        $this->workflowService->approveContract($contract, $approval, $note);
                        $count++;
                    }
                }
            }

            return $count;
        });
    }

    public function checkBulkPermission(string $permission): bool
    {
        $role = Role::where('name', Auth::user()->role)->first();
        if (! $role) {
            return false;
        }

        return AccessModule::where('role_id', $role->id)
            ->join('m_modules', 'm_access_modules.module_id', '=', 'm_modules.id')
            ->where('m_modules.identifier', 'CONTRACTS')
            ->where($permission, true)
            ->exists();
    }
}
