<?php

namespace App\Http\Controllers\Contract;

use App\Formatters\ContractFormatter;
use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\FormSubmission;
use App\Models\FormSubmissionHistory;
use App\Models\FormTemplate;
use App\Models\Vendor;
use App\Queries\Contract\ContractDetailQuery;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ContractFormController extends Controller
{
    public function __construct(
        protected ContractDetailQuery $contractDetailQuery
    ) {}

    public function saveFormSubmission(Request $request, string $id): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        $request->validate([
            'form_template_id' => 'required|uuid|exists:m_form_templates,id',
            'document_type' => 'required|in:f1,f2',
            'form_data' => 'required|array',
        ]);

        $docType = $request->document_type;

        // Apply Policy Check
        if ($docType === 'f1') {
            Gate::authorize('updateF1', $contract);
        } else {
            Gate::authorize('updateF2', $contract);
        }

        $formData = $request->form_data;

        $isNewVersion = $request->input('is_new_version', true);

        // Find or create submission
        $submission = FormSubmission::firstOrNew([
            'contract_id' => $contract->id,
            'document_type' => $docType,
        ]);

        $isNew = ! $submission->exists;

        if ($isNew) {
            $submission->form_template_id = $request->form_template_id;
            $submission->submitted_by = Auth::id();
            $submission->current_version = 1;
            $submission->save();
        }

        // Determine version number
        $versionNo = $submission->current_version;
        if ($isNewVersion && ! $isNew) {
            $versionNo = $submission->current_version + 1;
        }

        // Build change summary
        $changeSummary = $request->input('change_summary');
        if (! $changeSummary && ! $isNew) {
            $prevVersion = $submission->versions()->where('version_no', $submission->current_version)->first();
            if ($prevVersion) {
                $oldData = $prevVersion->form_data ?? [];
                $changes = [];
                foreach ($formData as $key => $val) {
                    $oldVal = $oldData[$key] ?? null;
                    if ($val !== $oldVal) {
                        $changes[] = $key;
                    }
                }

                if (! empty($changes)) {
                    // Fetch readable labels for the changed keys
                    $fieldLabels = DB::table('m_form_fields')
                        ->where('form_template_id', $submission->form_template_id)
                        ->whereIn('name', $changes)
                        ->pluck('label', 'name')
                        ->toArray();

                    $readableChanges = array_map(function ($key) use ($fieldLabels) {
                        return $fieldLabels[$key] ?? $key;
                    }, $changes);

                    $changeSummary = 'Perubahan pada: '.implode(', ', array_slice($readableChanges, 0, 10));
                    if (count($readableChanges) > 10) {
                        $changeSummary .= ' (dan '.(count($readableChanges) - 10).' lainnya)';
                    }
                }
            }
        }

        // Create or Update version
        if (! $isNewVersion && ! $isNew) {
            $existingVersion = FormSubmissionHistory::where('submission_id', $submission->id)
                ->where('version_no', $versionNo)
                ->first();

            if ($existingVersion) {
                $existingVersion->update([
                    'form_data' => $formData,
                    'change_summary' => $changeSummary ?: $existingVersion->change_summary,
                ]);
            } else {
                FormSubmissionHistory::create([
                    'submission_id' => $submission->id,
                    'version_no' => $versionNo,
                    'form_data' => $formData,
                    'change_summary' => $changeSummary,
                    'created_by' => Auth::id(),
                ]);
            }
        } else {
            FormSubmissionHistory::create([
                'submission_id' => $submission->id,
                'version_no' => $versionNo,
                'form_data' => $formData,
                'change_summary' => $changeSummary,
                'created_by' => Auth::id(),
            ]);
        }

        // Update main submission model
        $submission->current_version = $versionNo;
        $submission->save();

        // Sync critical fields from F1 to Contract main table
        if ($docType === 'f1') {
            $updates = [];

            // --- Tipe Perjanjian (transaction_type) ---
            foreach (['meta_tipe_perjanjian', 'f1_sifat_row', 'transaction_mode', 'transaction_type'] as $key) {
                if (! empty($formData[$key])) {
                    $updates['transaction_type'] = $formData[$key];

                    break;
                }
            }

            // --- Judul Kontrak (title) ---
            foreach (['meta_judul_kontrak', 'bv_f1_title', 'judul', 'contract_title'] as $key) {
                if (! empty($formData[$key])) {
                    $updates['title'] = $formData[$key];

                    break;
                }
            }

            // --- Tanggal Kontrak (contract_date) ---
            foreach (['meta_tgl_dibuat', 'bv_f1_date'] as $key) {
                if (! empty($formData[$key])) {
                    $updates['contract_date'] = $formData[$key];

                    break;
                }
            }

            // --- Sub Topik (kop_sub_topik) ---
            if (! empty($formData['meta_sub_topik'])) {
                $updates['kop_sub_topik'] = $formData['meta_sub_topik'];
            }

            // --- Pihak Pertama identity ---
            if (! empty($formData['meta_p1_entity'])) {
                $updates['p1_entity'] = $formData['meta_p1_entity'];
            }
            if (! empty($formData['meta_p1_signer'])) {
                $updates['p1_signer'] = $formData['meta_p1_signer'];
            }
            if (! empty($formData['meta_p1_signer_position'])) {
                $updates['p1_signer_position'] = $formData['meta_p1_signer_position'];
            }
            if (! empty($formData['meta_p1_alamat'])) {
                $updates['p1_address'] = $formData['meta_p1_alamat'];
            }

            // --- Pihak Kedua identity ---
            if (! empty($formData['meta_p2_entity'])) {
                $updates['p2_entity'] = $formData['meta_p2_entity'];
            }
            if (! empty($formData['meta_p2_signer'])) {
                $updates['p2_signer'] = $formData['meta_p2_signer'];
            }
            if (! empty($formData['meta_p2_signer_position'])) {
                $updates['p2_signer_position'] = $formData['meta_p2_signer_position'];
            }
            if (! empty($formData['meta_p2_alamat'])) {
                $updates['p2_address'] = $formData['meta_p2_alamat'];
            }

            $baseUpdates = collect($updates)->only(['transaction_type', 'title', 'contract_date'])->toArray();
            $metaUpdates = collect($updates)->except(['transaction_type', 'title', 'contract_date'])->toArray();

            if (! empty($baseUpdates)) {
                $contract->update($baseUpdates);
            }
            if (! empty($metaUpdates)) {
                $contract->meta()->updateOrCreate(
                    ['contract_id' => $contract->id],
                    $metaUpdates
                );
            }
        }

        // Log to contract history
        $action = $isNew ? "form_{$docType}_submitted" : "form_{$docType}_updated";
        $desc = $isNew
            ? 'Form '.strtoupper($docType).' telah diisi (v1)'
            : 'Form '.strtoupper($docType)." diperbarui ke v{$versionNo}".($changeSummary ? ". {$changeSummary}" : '');

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => $action,
            'description' => $desc,
            'actor_id' => Auth::id(),
        ]);

        return response()->json(ContractFormatter::formatContract($contract->fresh()));
    }

    public function getFormSubmission(string $id, string $type): JsonResponse
    {
        $contract = $this->contractDetailQuery->find($id);

        $submission = FormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $versions = [];
        $prefillData = null;

        if ($submission) {
            /** @var Collection<int, FormSubmissionHistory> $versionsCollection */
            $versionsCollection = $submission->versions()->with('createdBy')->get();
            $versions = $versionsCollection->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'form_data' => $v->form_data,
                'change_summary' => $v->change_summary,
                'created_by' => ContractFormatter::formatUser($v->createdBy),
                'created_at' => $v->created_at->format('Y-m-d H:i'),
            ]);
        }

        // For F2: ALWAYS generate prefill_data
        if ($type === 'f2') {
            $f1Submission = FormSubmission::where('contract_id', $contract->id)
                ->where('document_type', 'f1')
                ->first();

            $f1Data = [];
            if ($f1Submission) {
                $latestF1 = $f1Submission->versions()->orderByDesc('version_no')->first();
                $f1Data = $latestF1 ? ($latestF1->form_data ?? []) : [];
            }
            $prefillData = $this->applyInheritance($f1Data, $contract);
        }

        return response()->json([
            'submission' => $submission ? [
                'id' => $submission->id,
                'document_type' => $submission->document_type,
                'form_template_id' => $submission->form_template_id,
                'current_version' => $submission->current_version,
                'submitted_by' => $submission->submitted_by,
            ] : null,
            'versions' => $versions,
            'prefill_data' => $prefillData,
        ]);
    }

    private function applyInheritance(array $f1Data, Contract $contract, array $existingData = []): array
    {
        $contract->loadMissing(['initiator', 'creator', 'vendor', 'contractType']);

        $formData = array_merge($f1Data, $existingData);

        $inheritanceMap = [
            'meta_perjanjian_tentang' => 'meta_judul_kontrak',
            'meta_f2_scope' => 'meta_ringkasan_klausul',
            'meta_f2_price' => 'meta_nilai_transaksi',
            'meta_f2_payment' => 'meta_mekanisme_pembayaran',
            'meta_f2_tenure' => 'meta_masa_berlaku',
            'meta_f2_location' => 'meta_lokasi',
            'perjanjian_tentang' => 'meta_judul_kontrak',
            'f2_scope' => 'meta_ringkasan_klausul',
        ];

        foreach ($inheritanceMap as $f2Field => $f1Field) {
            if (empty($formData[$f2Field]) && ! empty($f1Data[$f1Field])) {
                $formData[$f2Field] = $f1Data[$f1Field];
            }
        }

        $f1PassthroughFields = [
            'meta_p1_entity', 'meta_p1_signer', 'meta_p1_signer_position', 'meta_p1_alamat',
            'meta_p2_entity', 'meta_p2_signer', 'meta_p2_signer_position', 'meta_p2_alamat',
            'meta_judul_kontrak', 'meta_tgl_dibuat', 'meta_tipe_perjanjian', 'meta_nomor',
            'meta_topik', 'meta_sub_topik', 'meta_ringkasan_klausul',
            'v_p1_entity', 'v_p2_entity',
        ];
        foreach ($f1PassthroughFields as $key) {
            if (empty($formData[$key]) && ! empty($f1Data[$key])) {
                $formData[$key] = $f1Data[$key];
            }
        }

        if (empty($formData['meta_p1_entity'])) {
            $formData['meta_p1_entity'] = 'PT. Lentera Teknologi';
        }
        if (empty($formData['meta_p1_signer'])) {
            $formData['meta_p1_signer'] = $contract->initiator->name ?? $contract->creator->name ?? '';
        }
        if (empty($formData['meta_p1_signer_position'])) {
            $formData['meta_p1_signer_position'] = $contract->initiator->role ?? $contract->creator->role ?? 'Direktur';
        }
        if (empty($formData['meta_p1_alamat'])) {
            $formData['meta_p1_alamat'] = 'The Manhattan Square Mid Tower Lt. 12, Jl. TB Simatupang No.1, Jakarta Selatan';
        }

        if ($contract->vendor_id && $contract->vendor) {
            /** @var Vendor $v */
            $v = $contract->vendor;
            if (empty($formData['meta_p2_entity'])) {
                $formData['meta_p2_entity'] = $v->name;
            }
            if (empty($formData['meta_p2_signer'])) {
                $formData['meta_p2_signer'] = $v->pic_name;
            }
            if (empty($formData['meta_p2_signer_position'])) {
                $formData['meta_p2_signer_position'] = $v->pic_position;
            }
            if (empty($formData['meta_p2_alamat'])) {
                $formData['meta_p2_alamat'] = $v->address;
            }
        }

        if (empty($formData['meta_nomor'])) {
            $formData['meta_nomor'] = $contract->contract_no;
        }
        if (empty($formData['meta_topik'])) {
            $formData['meta_topik'] = $contract->contractType->name ?? $contract->contract_type ?? '';
        }
        if (empty($formData['meta_tipe_perjanjian'])) {
            $formData['meta_tipe_perjanjian'] = $contract->transaction_type ?? 'Perjanjian Baru';
        }
        if (empty($formData['meta_tgl_dibuat'])) {
            $formData['meta_tgl_dibuat'] = $contract->contract_date ? $contract->contract_date->toDateString() : now()->toDateString();
        }

        return $formData;
    }

    public function compareFormVersions(string $id, string $type)
    {
        $contract = $this->contractDetailQuery->find($id);

        $matchingTemplate = FormTemplate::where('document_type', $type)
            ->where(function ($q) use ($contract) {
                $q->where('contract_type_id', $contract->contract_type_id)
                    ->orWhereNull('contract_type_id');
            })
            ->orderByRaw('contract_type_id IS NULL ASC')
            ->first();

        $submission = FormSubmission::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->first();

        $versions = [];
        if ($submission) {
            /** @var Collection<int, FormSubmissionHistory> $versionsCollection */
            $versionsCollection = $submission->versions()->orderByDesc('version_no')->get();
            $versions = $versionsCollection->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'form_data' => $v->form_data,
                'created_at' => $v->created_at->format('Y-m-d H:i'),
                'created_by' => $v->createdBy ? $v->createdBy->name : '-',
            ]);
        }

        return Inertia::render('contracts/compare-forms', [
            'contract' => ContractFormatter::formatContract($contract),
            'docType' => $type,
            'template' => $matchingTemplate ? [
                'id' => $matchingTemplate->id,
                'name' => $matchingTemplate->name,
                'description' => $matchingTemplate->description,
                'has_letterhead' => $matchingTemplate->has_letterhead,
                'letterhead_json' => $matchingTemplate->letterhead_json,
                'fields' => $matchingTemplate->fields,
            ] : null,
            'versions' => $versions,
            'breadcrumbs' => [
                ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
                ['title' => 'Compare Forms', 'href' => '#', 'icon' => 'Columns'],
            ],
        ]);
    }
}
