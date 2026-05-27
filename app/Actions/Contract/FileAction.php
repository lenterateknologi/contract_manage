<?php

namespace App\Actions\Contract;

use App\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\ContractAttachment;
use App\Models\ContractHistory;
use App\Models\ContractVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class FileAction
{
    protected ContractFormatter $formatter;

    protected ExportContractAction $exportAction;

    public function __construct(ContractFormatter $formatter, ExportContractAction $exportAction)
    {
        $this->formatter = $formatter;
        $this->exportAction = $exportAction;
    }

    public function uploadRevision(Contract $contract, Request $request): JsonResponse
    {
        try {
            $request->validate([
                'document_type' => 'nullable|string|in:contract,f1,f2',
                'changelog' => 'required|string',
                'file' => 'required|file|extensions:docx,doc,pdf|max:102400',
            ]);
        } catch (ValidationException $e) {
            Log::error('Validation Failed on Revision', [
                'contract_id' => $contract->id,
                'errors' => $e->errors(),
            ]);

            throw $e;
        }

        $type = $request->input('document_type', 'contract');

        // Find latest version for this type
        $lastVer = ContractVersion::where('contract_id', $contract->id)
            ->where('document_type', $type)
            ->max('version_no') ?? 0;

        $newVer = $lastVer + 1;
        $userId = Auth::id();
        $hash = Str::random(12) . '...';

        $typeLabel = strtoupper($type);
        $ext = $request->file('file')->getClientOriginalExtension();
        $safeNo = Str::slug($contract->contract_no ?: 'contract');
        $fileName = "{$safeNo}_{$typeLabel}_v{$newVer}.{$ext}";
        $filePath = $request->file('file')->storeAs("contracts/{$contract->id}", "v{$newVer}_{$type}_{$fileName}", 'local');

        ContractVersion::create([
            'contract_id' => $contract->id,
            'document_type' => $type,
            'version_no' => $newVer,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'change_log' => $request->changelog,
            'uploaded_by' => $userId,
            'file_hash' => $hash,
        ]);

        // If it's a 'contract' type revision, update the main contract pointer
        if ($type === 'contract') {
            $contract->update(['current_version' => $newVer]);
        }

        // Reset status and approvals regardless of doc type (any revision restarts process)
        $contract->update(['status' => 'in_review']);

        $approvals = $contract->approvals()->orderBy('sequence')->get();
        foreach ($approvals as $i => $a) {
            $a->update(['status' => $i === 0 ? 'pending' : 'waiting', 'note' => null, 'approved_at' => null]);
        }

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_UPLOADED',
            'description' => "Upload revisi {$typeLabel} v{$newVer}",
            'actor_id' => $userId,
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatter->formatContract($contract));
    }

    public function download(Contract $contract): mixed
    {
        $version = $contract->currentVersionModel();

        if ($version && $version->file_path && Storage::disk('local')->exists($version->file_path)) {
            return response()->download(Storage::disk('local')->path($version->file_path), $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    public function fileContent(Contract $contract, int $versionNo, Request $request): mixed
    {
        $type = $request->query('type', 'contract');
        $version = $contract->versions()
            ->where('document_type', $type)
            ->where('version_no', $versionNo)
            ->firstOrFail();

        if ($version->file_path && Storage::disk('local')->exists($version->file_path)) {
            return response()->download(Storage::disk('local')->path($version->file_path), $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    public function attachmentFile(Contract $contract, string $atId): mixed
    {
        $attachment = $contract->attachments()->findOrFail($atId);

        if ($attachment->file_path && Storage::disk('local')->exists($attachment->file_path)) {
            $path = Storage::disk('local')->path($attachment->file_path);
            $mime = match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'doc' => 'application/msword',
                'pdf' => 'application/pdf',
                default => 'application/octet-stream'
            };

            return response()->file($path, [
                'Content-Type' => $mime,
            ]);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }

    public function changeVersion(Contract $contract, Request $request): JsonResponse
    {
        $request->validate(['version_no' => 'required|integer']);

        $version = $contract->versions()->where('version_no', $request->version_no)->firstOrFail();

        $contract->update(['current_version' => $request->version_no]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'VERSION_CHANGED',
            'description' => "Versi aktif diubah ke v{$request->version_no}",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user']);

        return response()->json($this->formatter->formatContract($contract));
    }

    public function pdfPreview(Contract $contract, int $versionNo, Request $request): mixed
    {
        $type = $request->query('type', 'contract');

        // UNIFIED EXPORT: If type is F1 or F2, use the high-fidelity form-based generation logic
        if ($type === 'f1' || $type === 'f2') {
            return $this->exportAction->exportFormSubmissionPdf($contract, $type, 'inline');
        }

        $version = $contract->versions()
            ->where('document_type', $type)
            ->where('version_no', $versionNo)
            ->firstOrFail();

        if (! $version->file_path || ! Storage::disk('local')->exists($version->file_path)) {
            return response()->json(['message' => 'Source file not found.'], 404);
        }

        $sourcePath = Storage::disk('local')->path($version->file_path);
        $pdfDir = Storage::disk('local')->path("contracts/{$contract->id}/pdfs");
        $pdfPath = $pdfDir . '/' . pathinfo($version->file_path, PATHINFO_FILENAME) . '.pdf';

        if (! file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }

        if (! file_exists($pdfPath)) {
            $soffice = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
            $userDir = 'file://' . sys_get_temp_dir() . '/soffice_user_' . md5($contract->id);

            $safeSoffice = escapeshellarg($soffice);
            $safeUserDir = escapeshellarg($userDir);
            $safePdfDir = escapeshellarg($pdfDir);
            $safeSourcePath = escapeshellarg($sourcePath);

            $command = "export HOME=/tmp && {$safeSoffice} -env:UserInstallation={$safeUserDir} --headless --convert-to pdf --outdir {$safePdfDir} {$safeSourcePath} 2>&1";
            $output = shell_exec($command);

            if (! file_exists($pdfPath)) {
                Log::error('PDF Generation Failed', [
                    'contract_id' => $contract->id,
                    'output' => $output,
                ]);

                return response()->json([
                    'message' => 'Failed to generate PDF.',
                ], 500);
            }
        }

        if (file_exists($pdfPath)) {
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . basename($pdfPath) . '"',
            ]);
        }

        return response()->json(['message' => 'Failed to generate PDF.'], 500);
    }

    public function attachmentPdfPreview(Contract $contract, string $atId): mixed
    {
        $attachment = $contract->attachments()->findOrFail($atId);

        if (! $attachment->file_path || ! Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $sourcePath = Storage::disk('local')->path($attachment->file_path);
        $pdfDir = Storage::disk('local')->path("contracts/{$contract->id}/attachments/pdfs");
        $pdfPath = $pdfDir . '/' . pathinfo($attachment->file_path, PATHINFO_FILENAME) . '.pdf';

        if (! file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }

        if (! file_exists($pdfPath)) {
            if (strtolower(pathinfo($attachment->file_path, PATHINFO_EXTENSION)) === 'pdf') {
                copy($sourcePath, $pdfPath);
            } else {
                $soffice = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
                $userDir = 'file://' . sys_get_temp_dir() . '/soffice_user_at_' . md5($atId);

                $safeSoffice = escapeshellarg($soffice);
                $safeUserDir = escapeshellarg($userDir);
                $safePdfDir = escapeshellarg($pdfDir);
                $safeSourcePath = escapeshellarg($sourcePath);

                $command = "export HOME=/tmp && {$safeSoffice} -env:UserInstallation={$safeUserDir} --headless --convert-to pdf --outdir {$safePdfDir} {$safeSourcePath} 2>&1";
                shell_exec($command);
            }
        }

        if (file_exists($pdfPath)) {
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . basename($pdfPath) . '"',
            ]);
        }

        return response()->json(['message' => 'Failed to generate PDF.'], 500);
    }

    public function vendorDocumentFile(Contract $contract, string $docId): mixed
    {
        if (! $contract->vendor_id) {
            abort(404);
        }

        $document = \App\Models\VendorDocument::where('vendor_id', $contract->vendor_id)->findOrFail($docId);

        if (! Storage::disk('public')->exists($document->file_url)) {
            abort(404, 'File not found');
        }

        return response()->download(Storage::disk('public')->path($document->file_url), $document->document_name);
    }

    public function vendorDocumentPdfPreview(Contract $contract, string $docId): mixed
    {
        if (! $contract->vendor_id) {
            abort(404);
        }

        $document = \App\Models\VendorDocument::where('vendor_id', $contract->vendor_id)->findOrFail($docId);

        if (! Storage::disk('public')->exists($document->file_url)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $sourcePath = Storage::disk('public')->path($document->file_url);
        $pdfDir = Storage::disk('local')->path("vendors/{$contract->vendor_id}/documents/pdfs");
        $pdfPath = $pdfDir . '/' . pathinfo($document->file_url, PATHINFO_FILENAME) . '.pdf';

        if (! file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }

        if (! file_exists($pdfPath)) {
            if (strtolower(pathinfo($document->file_url, PATHINFO_EXTENSION)) === 'pdf') {
                copy($sourcePath, $pdfPath);
            } else {
                $soffice = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
                $userDir = 'file://' . sys_get_temp_dir() . '/soffice_user_vendor_' . md5($docId);

                $safeSoffice = escapeshellarg($soffice);
                $safeUserDir = escapeshellarg($userDir);
                $safePdfDir = escapeshellarg($pdfDir);
                $safeSourcePath = escapeshellarg($sourcePath);

                $command = "export HOME=/tmp && {$safeSoffice} -env:UserInstallation={$safeUserDir} --headless --convert-to pdf --outdir {$safePdfDir} {$safeSourcePath} 2>&1";
                shell_exec($command);
            }
        }

        if (file_exists($pdfPath)) {
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . basename($pdfPath) . '"',
            ]);
        }

        return response()->json(['message' => 'Failed to generate PDF.'], 500);
    }

    public function uploadAttachment(Contract $contract, Request $request): JsonResponse
    {
        $request->validate([
            'label' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'file' => 'required|file|max:102400',
        ]);

        $file = $request->file('file');
        $name = $file->getClientOriginalName();
        $ext = $file->getClientOriginalExtension();
        $path = $file->storeAs("contracts/{$contract->id}/attachments", Str::uuid() . ".{$ext}", 'local');

        ContractAttachment::create([
            'contract_id' => $contract->id,
            'label' => $request->label,
            'category' => $request->category,
            'file_name' => $name,
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'uploaded_by' => Auth::id(),
        ]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_UPLOADED',
            'description' => "Upload lampiran: {$request->label} ({$name})",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatter->formatContract($contract));
    }

    public function deleteAttachment(Contract $contract, string $atId): JsonResponse
    {
        $attachment = $contract->attachments()->findOrFail($atId);

        if (Storage::disk('local')->exists($attachment->file_path)) {
            Storage::disk('local')->delete($attachment->file_path);
        }

        $attachment->delete();

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'FILE_DELETED',
            'description' => "Hapus lampiran: {$attachment->label}",
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatter->formatContract($contract));
    }

    public function uploadAgreement(Contract $contract, Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:docx|max:10240',
            'change_log' => 'nullable|string',
        ]);

        $file = $request->file('file');

        $lastVersion = $contract->versions()
            ->where('document_type', 'agreement')
            ->max('version_no') ?? 0;

        $versionNo = $lastVersion + 1;
        $path = $file->storeAs('contracts/' . $contract->id . '/agreements', "agreement_v{$versionNo}.docx", 'local');

        ContractVersion::create([
            'contract_id' => $contract->id,
            'document_type' => 'agreement',
            'version_no' => $versionNo,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'change_log' => $request->change_log,
            'uploaded_by' => Auth::id(),
        ]);

        ContractHistory::create([
            'contract_id' => $contract->id,
            'action' => 'AGREEMENT_UPLOADED',
            'description' => "Agreement v{$versionNo} diupload: " . $file->getClientOriginalName(),
            'actor_id' => Auth::id(),
        ]);

        $contract->load(['creator', 'versions.uploader', 'approvals.approver', 'histories.actor', 'messages.user', 'attachments.uploader']);

        return response()->json($this->formatter->formatContract($contract));
    }

    public function getAgreementVersions(Contract $contract): JsonResponse
    {
        $versions = $contract->versions()
            ->where('document_type', 'agreement')
            ->orderByDesc('version_no')
            ->with('uploader')
            ->get();

        return response()->json($versions);
    }

    public function compareAgreementVersions(Contract $contract, Request $request): \Inertia\Response
    {
        $versions = $contract->versions()
            ->where('document_type', 'agreement')
            ->orderByDesc('version_no')
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'version_no' => $v->version_no,
                'file_name' => $v->file_name,
                'created_at' => $v->created_at->format('Y-m-d H:i'),
                'uploader' => [
                    'name' => $v->uploader ? $v->uploader->name : $v->created_by,
                ],
            ]);

        return Inertia::render('admin/contracts/compare-agreements', [
            'contract' => $this->formatter->formatContract($contract),
            'versions' => $versions,
            'initialV1' => (int) $request->v1,
            'initialV2' => (int) $request->v2,
        ]);
    }

    private function extractTextFromDocx($filePath): string
    {
        if (! file_exists($filePath)) {
            return '';
        }

        $zip = new \ZipArchive();
        if ($zip->open($filePath) === true) {
            if (($index = $zip->locateName('word/document.xml')) !== false) {
                $content = $zip->getFromIndex($index);
                $zip->close();

                $content = str_replace(['</w:p>', '</w:r>', '<w:tab/>'], ["\n", ' ', "\t"], $content);
                $content = strip_tags($content);

                return trim($content);
            }
            $zip->close();
        }

        return '';
    }
}
