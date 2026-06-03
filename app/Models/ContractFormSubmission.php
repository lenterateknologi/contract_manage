<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $contract_id
 * @property string $form_template_id
 * @property string $document_type
 * @property int $current_version
 * @property string|null $submitted_by
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 * @property-read Contract $contract
 * @property-read FormTemplate $formTemplate
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ContractFormSubmissionVersion> $versions
 * @property-read ContractFormSubmissionVersion|null $currentVersionData
 * @property-read ContractFormSubmissionVersion|null $latestVersion
 * @property-read User|null $submittedBy
 */
class ContractFormSubmission extends Model
{
    protected $table = 't_contract_form_submissions';

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
        return $this->hasMany(ContractFormSubmissionVersion::class, 'submission_id')->orderByDesc('version_no');
    }

    public function currentVersionData(): HasOne
    {
        return $this->hasOne(ContractFormSubmissionVersion::class, 'submission_id')
            ->whereColumn('version_no', 't_form_submissions.current_version');
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(ContractFormSubmissionVersion::class, 'submission_id')->latestOfMany('version_no');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
