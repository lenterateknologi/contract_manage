<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class FormSubmission extends Model
{
    protected $table = 't_form_submissions';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'contract_id',
        'form_template_id',
        'document_type',
        'current_version',
        'submitted_by',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(FormSubmissionHistory::class, 'submission_id')->orderByDesc('version_no');
    }

    public function currentVersionData(): HasOne
    {
        return $this->hasOne(FormSubmissionHistory::class, 'submission_id')
            ->whereColumn('version_no', 't_form_submissions.current_version');
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(FormSubmissionHistory::class, 'submission_id')->latestOfMany('version_no');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
