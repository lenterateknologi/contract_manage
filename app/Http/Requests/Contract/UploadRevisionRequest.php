<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class UploadRevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $config = config('uploads.categories.contract_revision');
        $mimes = implode(',', $config['allowed_mimes']);
        $maxSize = $config['max_size'];

        return [
            'document_type' => 'nullable|string|in:contract,f1,f2',
            'changelog' => 'required|string',
            'file' => "required|file|extensions:{$mimes}|max:{$maxSize}",
        ];
    }
}
