<?php

namespace App\Http\Actions\File;

use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class UploadAgreementAction
{
    public function __construct(protected ContractFormatter $formatter) {}

    public function execute(Contract $contract, Request $request): JsonResponse
    {
        Gate::authorize('updateAgreement', $contract);

        $file = $request->file('file');

        $lastVersion = $contract->versions()
            ->where('document_type', 'agreement')
            ->max('version_no') ?? 0;

        $versionNo = $lastVersion + 1;
        $extension = $file->getClientOriginalExtension() ?: 'docx';
        $path = $file->storeAs('contracts/'.$contract->id.'/agreements', "agreement_v{$versionNo}.{$extension}", 'local');

        // Repair corrupt / truncated zip / docx files if needed
        $fullPath = Storage::disk('local')->path($path);
        if (file_exists($fullPath) && in_array(strtolower($extension), ['docx', 'xlsx', 'pptx'])) {
            $content = file_get_contents($fullPath);
            $modified = false;
            $pkPos = strpos($content, "PK\x03\x04");
            if ($pkPos !== false && $pkPos > 0) {
                $content = substr($content, $pkPos);
                $modified = true;
            }
            $eocdPos = strrpos($content, "PK\x05\x06");
            if ($eocdPos !== false) {
                $eocdLen = strlen($content) - $eocdPos;
                if ($eocdLen === 21) {
                    $content .= "\x00";
                    $modified = true;
                }
            }
            if ($modified) {
                file_put_contents($fullPath, $content);
            }
        }

        ContractVersion::create([
            'contract_id' => $contract->id,
            'document_type' => 'agreement',
            'version_no' => $versionNo,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'change_log' => $request->change_log,
            'uploaded_by' => Auth::id(),
        ]);

        $contract->update(['current_version' => $versionNo]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'AGREEMENT_UPLOADED',
            'description' => "Agreement v{$versionNo} diupload: ".$file->getClientOriginalName(),
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatter->formatContract($contract));
    }
}
