<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractFormSubmissionVersion extends Model
{
    use HasUuids;

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
