<?php

namespace App\Http\Actions\File;

use App\Models\Contract;
use App\Models\ContractVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileContentAction
{
    public function execute(Contract $contract, int $versionNo, Request $request): mixed
    {
        $type = $request->query('type', 'contract');
        $effectiveType = $type === 'contract' ? 'agreement' : $type;

        /** @var ContractVersion $version */
        $version = $contract->versions()
            ->where(function ($q) use ($type, $effectiveType) {
                $q->where('document_type', $type)
                  ->orWhere('document_type', $effectiveType);
            })
            ->where('version_no', $versionNo)
            ->firstOrFail();

        if ($version->file_path && Storage::disk('local')->exists($version->file_path)) {
            $fullPath = Storage::disk('local')->path($version->file_path);
            $downloadName = $version->file_name ?: basename($version->file_path);
            $ext = strtolower(pathinfo($downloadName, PATHINFO_EXTENSION));

            $mimeTypes = [
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'doc'  => 'application/msword',
                'pdf'  => 'application/pdf',
                'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xls'  => 'application/vnd.ms-excel',
            ];

            $contentType = $mimeTypes[$ext] ?? (mime_content_type($fullPath) ?: 'application/octet-stream');

            if (ob_get_level()) {
                ob_end_clean();
            }

            return response()->download($fullPath, $downloadName, [
                'Content-Type' => $contentType,
                'Content-Length' => filesize($fullPath),
                'Content-Disposition' => 'attachment; filename="'.addslashes($downloadName).'"',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Pragma' => 'public',
            ]);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }
}
