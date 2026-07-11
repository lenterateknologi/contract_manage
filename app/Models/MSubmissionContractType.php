<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MSubmissionContractType extends Model
{
    protected $table = 'm_submission_contract_types';

    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = [
        'contract_type_id',
        'submission_type_id',
    ];

    public function submissionType(): BelongsTo
    {
        return $this->belongsTo(SubmissionType::class, 'submission_type_id');
    }

    public function contractType(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'contract_type_id');
    }
}
