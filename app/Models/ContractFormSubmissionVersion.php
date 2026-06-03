<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\ContractFormSubmissionVersion
 *
 * @property string $id
 * @property string $submission_id
 * @property int $version_no
 * @property array $form_data
 * @property string|null $change_summary
 * @property string|null $created_by
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property-read ContractFormSubmission $submission
 * @property-read User|null $createdBy
 */
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

    /**
     * @return BelongsTo<ContractFormSubmission, ContractFormSubmissionVersion>
     */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(ContractFormSubmission::class, 'submission_id');
    }

    /**
     * @return BelongsTo<User, ContractFormSubmissionVersion>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
