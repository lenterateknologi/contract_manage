<?php

namespace App\Actions\File;

use App\Models\Contract;
use App\Models\VendorDocument;
use Illuminate\Support\Facades\Storage;

class VendorDocumentFileAction
{
    public function execute(Contract $contract, string $docId): mixed
    {
        if (! $contract->vendor_id) {
            abort(404);
        }

        $document = VendorDocument::where('vendor_id', $contract->vendor_id)->findOrFail($docId);

        if (! Storage::disk('public')->exists($document->file_url)) {
            abort(404, 'File not found');
        }

        return response()->download(Storage::disk('public')->path($document->file_url), $document->document_name);
    }
}
