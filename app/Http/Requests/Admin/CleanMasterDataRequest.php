<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CleanMasterDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entities' => 'required|array',
            'entities.*' => ['string', Rule::in(config('master.allowed_entities', []))],
        ];
    }
}
