<?php

namespace App\Actions\File;

use App\Models\Contract;
use Illuminate\Support\Facades\Storage;

class DownloadFileAction
{
    public function execute(Contract $contract): mixed
    {
        $version = $contract->currentVersionModel();

        if ($version && $version->file_path && Storage::disk('local')->exists($version->file_path)) {
            return response()->download(Storage::disk('local')->path($version->file_path), $version->file_name);
        }

        return response()->json(['message' => 'File not found.'], 404);
    }
}
