<?php

namespace App\Http\Requests\Contract;

use App\Rules\FileValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadAgreementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [new FileValidationRule('contract_agreement')],
            'change_log' => 'nullable|string',
        ];
    }
}
