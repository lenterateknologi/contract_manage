<?php

namespace App\Http\Requests\Common;

use App\Rules\FileValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [new FileValidationRule('import_excel')],
        ];
    }
}
