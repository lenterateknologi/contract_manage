<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubmissionType extends Model
{
    protected $table = 'm_submission_types';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'is_active',
        'created_by',
        'updated_by',
    ];

    public function contractTypes(): BelongsToMany
    {
        return $this->belongsToMany(ContractType::class, 'm_submission_contract_types', 'submission_type_id', 'contract_type_id');
    }

    public function submissionContractTypes(): HasMany
    {
        return $this->hasMany(MSubmissionContractType::class, 'submission_type_id');
    }
}
