<?php

namespace App\Http\Requests\Admin;

use App\Rules\FileValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportMasterDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [new FileValidationRule('import_json')],
        ];
    }
}
