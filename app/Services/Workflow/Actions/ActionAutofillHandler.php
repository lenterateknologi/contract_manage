<?php

namespace App\Services\Workflow\Actions;

use App\Models\Contract;
use App\Models\ContractType;
use App\Models\NumberingFormat;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ActionAutofillHandler
{
    /**
     * Apply automated field modifications (timestamps, metadata, reset, clear) on the contract.
     */
    public function apply(Contract $contract, array $fields): void
    {
        if (empty($fields)) {
            return;
        }

        $updates = [];
        $metadata = $contract->metadata ?? [];
        $metaUpdated = false;

        foreach ($fields as $field) {
            if (! is_string($field)) {
                continue;
            }

            switch ($field) {
                // ── OPSI ISI / SET VALUES ──
                case 'received_at':
                    $updates['received_at'] = now();
                    $metadata['received_at'] = now()->toIso8601String();
                    $metaUpdated = true;
                    break;

                case 'assigned_at':
                    $updates['assigned_at'] = now();
                    $metadata['assigned_at'] = now()->toIso8601String();
                    $metaUpdated = true;
                    break;

                case 'finished_at':
                    $updates['finished_at'] = now();
                    $metadata['finished_at'] = now()->toIso8601String();
                    $metaUpdated = true;
                    break;

                case 'closed_at':
                    $updates['closed_at'] = now();
                    $updates['closed_by'] = Auth::id();
                    $metadata['closed_at'] = now()->toIso8601String();
                    $metaUpdated = true;
                    break;

                case 'signed_at':
                    $metadata['signed_at'] = now()->toIso8601String();
                    $metaUpdated = true;
                    break;

                case 'approved_at':
                    $metadata['approved_at'] = now()->toIso8601String();
                    $metaUpdated = true;
                    break;

                case 'started_at':
                    $metadata['started_at'] = now()->toIso8601String();
                    $metaUpdated = true;
                    break;

                // ── OPSI ORIGIN WORKFLOW & STEP ──
                case 'set_origin_workflow_step':
                    if ($contract->workflow_step_id) {
                        $updates['origin_workflow_step_id'] = $contract->workflow_step_id;
                        $metadata['origin_workflow_step_id'] = $contract->workflow_step_id;
                        $stepNumber = $contract->workflowStep?->step ?? $contract->current_step_number;
                        if ($stepNumber !== null) {
                            $updates['branch_step_number'] = $stepNumber;
                            $metadata['branch_from_step_num'] = $stepNumber;
                        }
                        $metaUpdated = true;
                    }
                    break;

                case 'set_origin_workflow':
                    if ($contract->workflow_id) {
                        $updates['origin_workflow_id'] = $contract->workflow_id;
                        $metadata['origin_workflow_id'] = $contract->workflow_id;
                        $metaUpdated = true;
                    }
                    break;

                case 'clear_origin_workflow_step':
                    $updates['origin_workflow_step_id'] = null;
                    $updates['branch_step_number'] = null;
                    unset($metadata['origin_workflow_step_id'], $metadata['branch_from_step_num'], $metadata['branch_from_step_id']);
                    $metaUpdated = true;
                    break;

                case 'clear_origin_workflow':
                    $updates['origin_workflow_id'] = null;
                    unset($metadata['origin_workflow_id']);
                    $metaUpdated = true;
                    break;

                // ── OPSI RESET / REGENERASI ──
                case 'reset_form_no':
                    $initiator = $contract->initiator ?: ($contract->initiated_by_id ? User::with('department')->find($contract->initiated_by_id) : null);
                    $contractType = $contract->contractType ?: ($contract->contract_type_id ? ContractType::find($contract->contract_type_id) : null);
                    $newFormNo = NumberingFormat::generateNextNumber('contract', [
                        'kode_departemen' => $initiator?->department?->code ?? 'GEN',
                        'kode_perjanjian' => $contractType?->code ?? 'KTR',
                    ]);
                    $updates['form_no'] = $newFormNo;
                    $metadata['form_no'] = $newFormNo;
                    $metadata['meta_nomor'] = $newFormNo;
                    $metaUpdated = true;
                    break;

                // ── OPSI HAPUS / CLEAR VALUES ──
                case 'clear_received_at':
                    $updates['received_at'] = null;
                    unset($metadata['received_at']);
                    $metaUpdated = true;
                    break;

                case 'clear_assigned_at':
                    $updates['assigned_at'] = null;
                    unset($metadata['assigned_at']);
                    $metaUpdated = true;
                    break;

                case 'clear_finished_at':
                    $updates['finished_at'] = null;
                    unset($metadata['finished_at']);
                    $metaUpdated = true;
                    break;

                case 'clear_closed_at':
                    $updates['closed_at'] = null;
                    $updates['closed_by'] = null;
                    unset($metadata['closed_at']);
                    $metaUpdated = true;
                    break;

                case 'clear_signed_at':
                    unset($metadata['signed_at']);
                    $metaUpdated = true;
                    break;

                case 'clear_approved_at':
                    unset($metadata['approved_at']);
                    $metaUpdated = true;
                    break;

                case 'clear_started_at':
                    unset($metadata['started_at']);
                    $metaUpdated = true;
                    break;

                case 'clear_pic':
                    $updates['assigned_pic_id'] = null;
                    $updates['assigned_by_id'] = null;
                    unset($metadata['pic'], $metadata['assigned_pic']);
                    $metaUpdated = true;
                    break;

                case 'clear_contract_no':
                    $updates['contract_no'] = null;
                    unset($metadata['contract_no'], $metadata['meta_no_kontrak']);
                    $metaUpdated = true;
                    break;

                case 'clear_price':
                    unset($metadata['meta_harga'], $metadata['price'], $metadata['f2_price']);
                    $metaUpdated = true;
                    break;

                case 'clear_period':
                    $updates['contract_date'] = null;
                    $updates['end_date'] = null;
                    unset($metadata['meta_masa_berlaku']);
                    $metaUpdated = true;
                    break;

                case 'clear_tax':
                    $updates['tax_required'] = null;
                    unset($metadata['tax_required'], $metadata['meta_tax_required']);
                    $metaUpdated = true;
                    break;

                case 'clear_vendor':
                    $updates['vendor_id'] = null;
                    unset($metadata['vendor_id']);
                    $metaUpdated = true;
                    break;

                case 'clear_f1':
                    $contract->formSubmissions()->where('document_type', 'f1')->delete();
                    break;

                case 'clear_f2':
                    $contract->formSubmissions()->where('document_type', 'f2')->delete();
                    break;

                case 'clear_agreement':
                    $contract->files()->where('file_type', 'agreement')->delete();
                    break;

                case 'clear_description':
                    $updates['description'] = null;
                    unset($metadata['meta_deskripsi']);
                    $metaUpdated = true;
                    break;

                default:
                    if (str_starts_with($field, 'clear_') || str_starts_with($field, 'remove_')) {
                        $rawKey = preg_replace('/^(clear_|remove_)/', '', $field);
                        unset($metadata[$rawKey]);
                        $metaUpdated = true;
                    } else {
                        $metadata[$field] = now()->toIso8601String();
                        $metaUpdated = true;
                    }
                    break;
            }
        }

        if ($metaUpdated) {
            $updates['metadata'] = $metadata;
        }

        if (! empty($updates)) {
            $contract->update($updates);
        }
    }
}
