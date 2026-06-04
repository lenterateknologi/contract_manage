<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class UploadAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $config = config('uploads.categories.contract_attachment');
        $mimes = implode(',', $config['allowed_mimes']);
        $maxSize = $config['max_size'];

        return [
            'label' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'file' => "required|file|mimes:{$mimes}|max:{$maxSize}",
        ];
    }
}
