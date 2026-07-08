<?php

namespace App\Http\Actions\File;

use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractVersion;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompareVersionsAction
{
    public function __construct(protected ContractFormatter $formatter) {}

    public function execute(Contract $contract, string $type, Request $request): Response
    {
        if (in_array($type, ['f1', 'f2'])) {
            $submission = \App\Models\FormSubmission::where('contract_id', $contract->id)
                ->where('document_type', $type)
                ->first();
                
            $versionsCollection = $submission ? $submission->versions()->with('createdBy')->get() : collect();
            
            $versions = $versionsCollection->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'file_name' => $v->change_summary ?? 'Form Submission',
                'created_at' => $v->created_at?->format('Y-m-d H:i') ?? '',
                'uploader' => [
                    'name' => $v->createdBy ? $v->createdBy->name : 'System',
                ],
            ]);
        } else {
            /** @var Collection<int, ContractVersion> $versionsCollection */
            $versionsCollection = $contract->versions()
                ->with('uploader')
                ->where('document_type', $type)
                ->orderByDesc('version_no')
                ->get();

            $versions = $versionsCollection->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'file_name' => $v->file_name,
                'created_at' => $v->created_at?->format('Y-m-d H:i') ?? '',
                'uploader' => [
                    'name' => $v->uploader ? $v->uploader->name : 'System',
                ],
            ]);
        }

        return Inertia::render('contracts/compare-agreements', [
            'contract' => $this->formatter->formatContract($contract),
            'versions' => $versions,
            'initialV1' => (int) $request->v1,
            'initialV2' => (int) $request->v2,
            'documentType' => $type,
        ]);
    }
}
