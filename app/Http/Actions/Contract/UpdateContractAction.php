<?php

namespace App\Http\Actions\Contract;

use App\Models\Master\ContractType;
use App\Models\Master\SubmissionType;
use App\Models\Master\User;
use App\Models\Master\Vendor;
use App\Models\Transaction\Approval;
use App\Models\Transaction\Contract;
use App\Models\Transaction\ContractHistory;
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
        // Enforce granular field edit permissions configured in active workflow step
        $user = Auth::user();
        $isAdmin = $user && ($user->isAdmin() || $user->isSuperAdmin());
        $currentStep = $contract->workflowStep;

        if ($currentStep && ! $isAdmin && $contract->status !== 'draft') {
            $stepMeta = $currentStep->meta ?? [];

            if (data_get($stepMeta, 'allow_category_edit') === false) {
                unset($validated['contract_type_id'], $validated['contract_type_parent_id']);
            }
            if (data_get($stepMeta, 'allow_title_edit') === false) {
                unset($validated['title']);
            }
            if (data_get($stepMeta, 'allow_vendor_edit') === false) {
                unset($validated['vendor_id']);
            }
            if (data_get($stepMeta, 'allow_first_party_edit') === false) {
                unset($validated['p1_entity'], $validated['p1_signer'], $validated['p1_signer_position'], $validated['p1_address']);
            }
            if (data_get($stepMeta, 'allow_f2_contract_no_edit') === false) {
                unset($validated['contract_no']);
            }
            if (data_get($stepMeta, 'allow_period_edit') === false) {
                unset($validated['contract_date'], $validated['end_date']);
            }
            if (data_get($stepMeta, 'allow_tax_toggle_edit') === false) {
                unset($validated['tax_required']);
            }
        }

        // Capture old values before updating
        $oldContract = $contract->replicate();
        $oldContract->id = $contract->id;
        // Sync tax_required and metadata
        if (array_key_exists('tax_required', $validated)) {
            $metadata = $contract->metadata ?? [];
            $isTax = filter_var($validated['tax_required'], FILTER_VALIDATE_BOOLEAN);
            $metadata['tax_required'] = $isTax;
            $metadata['meta_tax_required'] = $isTax ? 'Ya' : 'Tidak';
            $contract->metadata = $metadata;
            $contract->save();
        } elseif (isset($validated['metadata']) && is_array($validated['metadata'])) {
            $metadata = array_merge($contract->metadata ?? [], $validated['metadata']);
            if (isset($metadata['tax_required']) || isset($metadata['meta_tax_required'])) {
                $taxVal = $metadata['tax_required'] ?? $metadata['meta_tax_required'];
                $isTax = ($taxVal === true || $taxVal === '1' || $taxVal === 1 || $taxVal === 'Ya' || $taxVal === 'ya' || $taxVal === 'true');
                $metadata['tax_required'] = $isTax;
                $metadata['meta_tax_required'] = $isTax ? 'Ya' : 'Tidak';
            }
            $contract->metadata = $metadata;
            $contract->save();
        }

        $contract->update($validated);

        // If the contract is in draft state, the workflow or steps might need to change
        // due to changes in metadata (e.g. tax_required) or contract type.
        if ($contract->status === 'draft' && empty($contract->workflow_id)) {
            $contract = $this->workflowService->sendForApproval($contract, null, null, false);
        }

        if (array_key_exists('assigned_pic_id', $validated) && $validated['assigned_pic_id']) {
            $newPicId = $validated['assigned_pic_id'];
            if ($contract->assigned_pic_id !== $newPicId || ! $contract->assigned_at) {
                $now = now();
                $metadata = $contract->metadata ?? [];
                $metadata['assigned_pic_id'] = $newPicId;
                $metadata['assigned_at'] = $now->toIso8601String();
                $metadata['pic_assigned_at'] = $now->toIso8601String();
                $contract->update([
                    'assigned_at' => $now,
                    'metadata' => $metadata,
                ]);
            }
            $newPic = User::find($newPicId);
            if ($newPic) {
                $picApprovals = Approval::where('contract_id', $contract->id)
                    ->whereIn('status', ['pending', 'waiting'])
                    ->where(function ($q) {
                        $q->whereHas('workflowStep', function ($sq) {
                            $sq->where('approver_type', 'assigned_pic')
                                ->orWhereHas('approverAuthorities', fn ($aq) => $aq->where('authority_type', 'assigned_pic'));
                        })->orWhereIn('role', ['PIC Legal', 'Staff Legal']);
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

        $changes = $this->calculateChanges($oldAttributes, $contract->getAttributes());

        if (! empty($changes)) {
            $desc = 'Informasi kontrak diperbarui: '.implode(', ', $changes);
        } else {
            $desc = 'Informasi kontrak diperbarui';
        }

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'CONTRACT_UPDATED',
            'description' => $desc,
            'actor_id' => Auth::id(),
        ]);

        return $contract;
    }

    private function calculateChanges(array $old, array $new): array
    {
        $changes = [];

        $fieldLabels = [
            'title' => 'Judul Kontrak',
            'contract_no' => 'Nomor Kontrak',
            'form_no' => 'Nomor Form',
            'contract_date' => 'Tanggal Kontrak',
            'end_date' => 'Tanggal Berakhir',
            'vendor_id' => 'Vendor',
            'contract_type_id' => 'Kategori / Tipe Kontrak',
            'submission_type_id' => 'Jenis Pengajuan',
            'transaction_type' => 'Tipe Perjanjian',
            'kop_sub_topik' => 'Sub Topik',
            'tax_required' => 'Pajak (Tax)',
            'assigned_pic_id' => 'PIC Kontrak',
            'description' => 'Deskripsi',
        ];

        foreach ($fieldLabels as $field => $label) {
            $oldVal = $old[$field] ?? null;
            $newVal = $new[$field] ?? null;

            // Format / normalize comparisons
            if ($field === 'tax_required') {
                $oldBool = filter_var($oldVal, FILTER_VALIDATE_BOOLEAN);
                $newBool = filter_var($newVal, FILTER_VALIDATE_BOOLEAN);
                if ($oldVal !== null && $newVal !== null && $oldBool !== $newBool) {
                    $oldText = $oldBool ? 'Ya' : 'Tidak';
                    $newText = $newBool ? 'Ya' : 'Tidak';
                    $changes[] = "{$label} diubah dari \"{$oldText}\" menjadi \"{$newText}\"";
                }

                continue;
            }

            if (in_array($field, ['contract_date', 'end_date'])) {
                $oldDate = $oldVal ? substr((string) $oldVal, 0, 10) : '';
                $newDate = $newVal ? substr((string) $newVal, 0, 10) : '';
                if ($oldDate !== $newDate) {
                    $oldText = $oldDate ?: '-';
                    $newText = $newDate ?: '-';
                    $changes[] = "{$label} diubah dari \"{$oldText}\" menjadi \"{$newText}\"";
                }

                continue;
            }

            if ($field === 'vendor_id') {
                if ((string) $oldVal !== (string) $newVal) {
                    $oldVendor = $oldVal ? Vendor::find($oldVal)?->name : '-';
                    $newVendor = $newVal ? Vendor::find($newVal)?->name : '-';
                    $changes[] = "{$label} diubah dari \"{$oldVendor}\" menjadi \"{$newVendor}\"";
                }

                continue;
            }

            if ($field === 'contract_type_id') {
                if ((string) $oldVal !== (string) $newVal) {
                    $oldType = $oldVal ? ContractType::find($oldVal)?->name : '-';
                    $newType = $newVal ? ContractType::find($newVal)?->name : '-';
                    $changes[] = "{$label} diubah dari \"{$oldType}\" menjadi \"{$newType}\"";
                }

                continue;
            }

            if ($field === 'submission_type_id') {
                if ((string) $oldVal !== (string) $newVal) {
                    $oldSub = $oldVal ? SubmissionType::find($oldVal)?->name : '-';
                    $newSub = $newVal ? SubmissionType::find($newVal)?->name : '-';
                    $changes[] = "{$label} diubah dari \"{$oldSub}\" menjadi \"{$newSub}\"";
                }

                continue;
            }

            if ($field === 'assigned_pic_id') {
                if ((string) $oldVal !== (string) $newVal) {
                    $oldUser = $oldVal ? User::find($oldVal)?->name : '-';
                    $newUser = $newVal ? User::find($newVal)?->name : '-';
                    $changes[] = "{$label} diubah dari \"{$oldUser}\" menjadi \"{$newUser}\"";
                }

                continue;
            }

            // Normal string comparison
            $oldStr = trim((string) ($oldVal ?? ''));
            $newStr = trim((string) ($newVal ?? ''));

            if ($oldStr !== $newStr) {
                $oldDisplay = $oldStr !== '' ? (strlen($oldStr) > 40 ? substr($oldStr, 0, 37).'...' : $oldStr) : '-';
                $newDisplay = $newStr !== '' ? (strlen($newStr) > 40 ? substr($newStr, 0, 37).'...' : $newStr) : '-';
                $changes[] = "{$label} diubah dari \"{$oldDisplay}\" menjadi \"{$newDisplay}\"";
            }
        }

        return $changes;
    }
}
