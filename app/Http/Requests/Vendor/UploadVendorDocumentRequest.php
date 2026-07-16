<?php

namespace App\Http\Requests\Vendor;

use App\Rules\FileValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadVendorDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_file' => [new FileValidationRule('vendor_document')],
            'document_type' => 'required|string',
            'expires_at' => 'nullable|date',
        ];
    }
}
