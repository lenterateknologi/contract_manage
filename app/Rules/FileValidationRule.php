<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Translation\PotentiallyTranslatedString;

class FileValidationRule implements ValidationRule
{
    protected string $category;

    protected bool $required;

    /**
     * Create a new rule instance.
     *
     * @param  string  $category  Kategori upload dari config/uploads.php (misal: 'import_json', 'vendor_document')
     * @param  bool  $required  Menentukan apakah berkas wajib diunggah (default: true)
     */
    public function __construct(string $category, bool $required = true)
    {
        $this->category = $category;
        $this->required = $required;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, \Closure $fail): void
    {
        $config = config("uploads.categories.{$this->category}");

        if (! $config) {
            $fail("Kategori upload '{$this->category}' tidak dikonfigurasi.");

            return;
        }

        $mimes = implode(',', $config['allowed_mimes']);
        $maxSize = $config['max_size'] ?? config('uploads.global_max_size', 20480);

        $rules = [
            $attribute => [
                $this->required ? 'required' : 'nullable',
                'file',
                "extensions:{$mimes}",
                "max:{$maxSize}",
            ],
        ];

        $validator = Validator::make([$attribute => $value], $rules);

        if ($validator->fails()) {
            foreach ($validator->errors()->get($attribute) as $message) {
                $fail($message);
            }
        }
    }
}
