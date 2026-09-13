<?php

namespace App\Http\Requests\Contract;

use App\Rules\FileValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'file' => ['nullable', new FileValidationRule('contract_attachment', false)],
            'files' => 'nullable|array',
            'files.*' => [new FileValidationRule('contract_attachment', false)],
            'attachments' => 'nullable|array',
            'attachments.*' => [new FileValidationRule('contract_attachment', false)],
        ];
    }
}
