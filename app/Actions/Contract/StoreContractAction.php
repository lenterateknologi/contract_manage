<?php

namespace App\Actions\Contract;

use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractType;
use App\Models\NumberingFormat;
use App\Models\User;
use App\Services\ContractWorkflowService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StoreContractAction
{
    protected ContractWorkflowService $workflowService;

    public function __construct(ContractWorkflowService $workflowService)
    {
        $this->workflowService = $workflowService;
    }

    public function execute(array $validated): Contract
    {
        return DB::transaction(function () use ($validated) {
            $userId = Auth::id();
            $initiatorId = $validated['initiated_by_id'] ?? $userId;
            $initiator = User::with('department')->find($initiatorId);
            $contractType = ContractType::find($validated['contract_type_id']);

            $contract_no = NumberingFormat::generateNextNumber('contract', [
                'kode_departemen' => $initiator->department->code ?? 'GEN',
                'kode_perjanjian' => $contractType->code ?? 'KTR',
            ]);

            $contract = Contract::create([
                'contract_no' => $contract_no,
                'title' => $validated['title'],
                'crown_no' => $validated['crown_no'] ?? null,
                'description' => $validated['description'] ?? '—',
                'contract_type_id' => $validated['contract_type_id'],
                'contract_type_parent_id' => $validated['contract_type_parent_id'] ?? null,
                'submission_type_id' => $validated['submission_type_id'] ?? null,
                'transaction_type' => $validated['transaction_type'] ?? 'Perjanjian Baru',
                'status' => 'draft',
                'created_by' => $userId,
                'initiated_by_id' => $initiatorId,
                'vendor_id' => $validated['vendor_id'] ?? null,
                'parent_id' => $validated['parent_id'] ?? null,
                'metadata' => [
                    'tax_required' => $validated['tax_required'] ?? true,
                    'category' => $validated['category'] ?? 'contract',
                    'topic' => $validated['topic'] ?? 'perjanjian',
                    'project_name' => $validated['project_name'] ?? null,
                ],
            ]);

            $contract->meta()->create([
                'kop_sub_topik' => $validated['kop_sub_topik'] ?? null,
                'p1_entity' => $validated['p1_entity'] ?? null,
                'p1_signer' => $validated['p1_signer'] ?? null,
                'p1_signer_position' => $validated['p1_signer_position'] ?? null,
                'p1_address' => $validated['p1_address'] ?? null,
                'p2_entity' => $validated['p2_entity'] ?? null,
                'p2_signer' => $validated['p2_signer'] ?? null,
                'p2_signer_position' => $validated['p2_signer_position'] ?? null,
                'p2_address' => $validated['p2_address'] ?? null,
            ]);

            ContractHistory::create(['contract_id' => $contract->id, 'action' => 'CONTRACT_CREATED', 'description' => 'Kontrak dibuat', 'actor_id' => $userId]);

            // AUTOMATION: Automatically assign workflow and set to Step 1 (Drafting)
            $contract = $this->workflowService->sendForApproval($contract, $validated['workflow_id'] ?? null);

            $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'contractType', 'workflowStep']);

            return $contract;
        });
    }
}
