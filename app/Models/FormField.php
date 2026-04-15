<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormField extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'form_template_id',
        'parent_id',
        'label',
        'name',
        'type',
        'container_type',
        'placeholder',
        'is_required',
        'use_rich_text',
        'width',
        'options',
        'order',
        'validation_rules',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
            'is_required' => 'boolean',
            'use_rich_text' => 'boolean',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(FormField::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(FormField::class, 'parent_id')->orderBy('order');
    }
}
