<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractType extends Model
{
    protected $table = 'm_contract_types';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'id',
        'name',
        'code',
        'parent_id',
        'workflow_id',
        'features',
        'description',
        'f1_input_mechanism',
        'f1_form_template_id',
        'f1_contract_template_id',
        'f2_input_mechanism',
        'f2_form_template_id',
        'f2_contract_template_id',
        'contract_input_mechanism',
        'contract_form_template_id',
        'is_active',
        'level',
    ];

    protected $casts = [
        'features' => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function (ContractType $contractType) {
            $level = 0;
            if ($contractType->parent_id) {
                // Find parent's level if possible to avoid multiple queries
                $parent = self::find($contractType->parent_id);
                if ($parent) {
                    $level = $parent->level + 1;
                }
            }
            $contractType->level = $level;
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ContractType::class, 'parent_id');
    }

    public function allChildren(): HasMany
    {
        return $this->hasMany(ContractType::class, 'parent_id')->with(['f1FormTemplate', 'f2FormTemplate', 'contractFormTemplate', 'allChildren']);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function f1FormTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'f1_form_template_id');
    }

    public function f2FormTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'f2_form_template_id');
    }

    public function contractFormTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'contract_form_template_id');
    }

    public function formTemplates(): HasMany
    {
        return $this->hasMany(FormTemplate::class);
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
