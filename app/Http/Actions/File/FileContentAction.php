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
        /** @var ContractVersion $version */
        $version = $contract->versions()
            ->where('document_type', $type)
            ->where('version_no', $versionNo)
            ->firstOrFail();

        if ($version->file_path && Storage::disk('local')->exists($version->file_path)) {
            return response()->download(Storage::disk('local')->path($version->file_path), $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }
}
