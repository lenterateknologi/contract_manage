<?php

namespace App\Http\Requests\Contract;

use App\Rules\FileValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadRevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_type' => 'nullable|string|in:contract,f1,f2',
            'changelog' => 'required|string',
            'file' => [new FileValidationRule('contract_revision')],
        ];
    }
}
