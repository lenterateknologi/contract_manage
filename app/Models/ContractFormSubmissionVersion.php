<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractFormSubmissionVersion extends Model
{
    protected $table = 't_contract_form_submission_h';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'submission_id',
        'version_no',
        'form_data',
        'change_summary',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'form_data' => 'array',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ContractFormSubmission::class, 'submission_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
