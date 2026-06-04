<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNumberingFormatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'format_pattern' => 'required|string',
            'current_number' => 'required|integer',
            'padding' => 'required|integer|min:1|max:10',
            'is_active' => 'boolean',
        ];
    }
}
