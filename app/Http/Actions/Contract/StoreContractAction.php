<?php

namespace App\Http\Actions\Contract;

use App\Enums\ContractHistoryAction;
use App\Enums\ContractStatusEnum;
use App\Models\Master\Authority;
use App\Models\Master\ContractType;
use App\Models\Master\NumberingFormat;
use App\Models\Master\User;
use App\Models\Master\Vendor;
use App\Models\Master\Workflow;
use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractHistory;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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
            $user = Auth::user();
            $userId = $user?->id;
            $initiatorId = $validated['initiated_by_id'] ?? $userId;
            $initiator = User::with('department')->find($initiatorId);

            if (! $initiator) {
                throw ValidationException::withMessages([
                    'initiated_by_id' => 'User pemohon / initiator tidak ditemukan.',
                ]);
            }

            if ($user && (string) $initiatorId !== (string) $userId) {
                if (! Authority::checkCreatorCanRepresentInitiator($user, $initiator)) {
                    throw ValidationException::withMessages([
                        'initiated_by_id' => 'Anda tidak memiliki otoritas (On-Behalf) untuk membuat pengajuan atas nama user '.$initiator->name.'.',
                    ]);
                }
            }
            $contractType = ContractType::find($validated['contract_type_id']);
            if (! $contractType) {
                throw ValidationException::withMessages([
                    'contract_type_id' => 'Jenis dokumen / kontrak tidak ditemukan.',
                ]);
            }

            // Validasi: Alur kerja (workflow) harus ada, aktif, dan dapat dipilih
            $workflowId = $validated['workflow_id'] ?? null;
            $workflow = null;
            if ($workflowId) {
                $workflow = Workflow::where('is_active', true)->where('is_selectable', true)->find($workflowId);
            }

            if (! $workflow) {
                $taxRequiredVal = (bool) ($validated['tax_required'] ?? false);
                $workflow = Workflow::getDefaultByContractType($validated['contract_type_id'], $taxRequiredVal);
            }

            if (! $workflow) {
                throw ValidationException::withMessages([
                    'workflow_id' => 'Tidak ada alur kerja (workflow) aktif yang tersedia untuk jenis dokumen ini. Pengajuan tidak dapat dibuat.',
                ]);
            }

            if ($workflow->steps()->count() === 0) {
                throw ValidationException::withMessages([
                    'workflow_id' => "Alur kerja ({$workflow->name}) belum memiliki tahapan yang dikonfigurasi. Pengajuan tidak dapat dibuat.",
                ]);
            }

            $form_no = NumberingFormat::generateNextNumber('contract', [
                'kode_departemen' => $initiator?->department?->code ?? 'GEN',
                'kode_perjanjian' => $contractType?->code ?? 'KTR',
            ]);

            // Auto-determine tax_required from vendor PKP status if vendor is provided
            $taxRequired = $validated['tax_required'] ?? null;
            if ($taxRequired === null && ! empty($validated['vendor_id'])) {
                $vendor = Vendor::find($validated['vendor_id']);
                if ($vendor) {
                    $taxRequired = $vendor->is_pkp;
                }
            }
            if ($taxRequired === null) {
                $taxRequired = true;
            }

            // ponytail: fallback parent_id and ancestry_id from contractType if not provided
            $parentTypeId = $validated['contract_type_parent_id'] ?? $contractType?->parent_id;
            $ancestryId = $contractType?->ancestry_id ?? null;

            $contract = Contract::create([
                'form_no' => $form_no,
                'title' => $validated['title'],
                'contract_no' => $validated['contract_no'] ?? null,
                'description' => $validated['description'] ?? '—',
                'contract_type_id' => $validated['contract_type_id'],
                'contract_type_parent_id' => $parentTypeId,
                'contract_type_ancestry_id' => $ancestryId,
                'submission_type_id' => $validated['submission_type_id'] ?? null,
                'transaction_type' => $contractType?->name ? strtolower($contractType->name) : ($validated['transaction_type'] ?? null),
                'status' => ContractStatusEnum::Draft->value,
                'created_by' => $userId,
                'initiated_by_id' => $initiatorId,
                'vendor_id' => $validated['vendor_id'] ?? null,
                'parent_id' => $validated['parent_id'] ?? null,
                'tax_required' => (bool) $taxRequired,
                'metadata' => [
                    'tax_required' => (bool) $taxRequired,
                    'meta_tax_required' => $taxRequired ? 'Ya' : 'Tidak',
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

            ContractHistory::create([
                'contract_id' => $contract->id,
                'action' => ContractHistoryAction::ContractCreated->value,
                'description' => ContractHistoryAction::ContractCreated->label(),
                'actor_id' => $userId,
            ]);

            // AUTOMATION: Automatically assign workflow and set to Step 1 (Drafting)
            try {
                $contract = $this->workflowService->sendForApproval($contract, $workflow->id);
            } catch (\Exception $e) {
                throw ValidationException::withMessages([
                    'workflow_id' => [$e->getMessage()],
                ]);
            }

            $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'contractType', 'workflowStep']);

            return $contract;
        });
    }
}
