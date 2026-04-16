<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Workflow extends Model
{
    use HasUuids, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'contract_type',
        'department_id',
        'name',
        'description',
        'is_default',
        'is_template',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function department(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public static function getDefaultByContractType(string $contractType): ?self
    {
        return self::where('contract_type', $contractType)
            ->where('is_default', true)
            ->first();
    }
}
