<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'contract_no',
        'title',
        'description',
        'contract_date',
        'end_date',
        'contract_type',
        'contract_type_id',
        'transaction_type',
        'status',
        'created_by',
        'current_version',
        'workflow_id',
        'workflow_step_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function contractType()
    {
        return $this->belongsTo(ContractType::class, 'contract_type_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ContractAttachment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ContractVersion::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ContractHistory::class)->orderBy('created_at');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ContractMessage::class)->orderBy('created_at');
    }

    public function formSubmissions(): HasMany
    {
        return $this->hasMany(ContractFormSubmission::class);
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class);
    }

    public function currentVersionModel(): ?ContractVersion
    {
        return $this->versions()->where('version_no', $this->current_version)->first();
    }

    public function pendingApproval()
    {
        return $this->approvals()->where('status', 'pending')->first();
    }

    public function progressData(): array
    {
        if ($this->workflow_id) {
            $steps = $this->workflow->steps ?? collect();
            $total = $steps->count();

            // A step is done if all approvals for that step are 'approved'
            $doneCount = 0;
            foreach ($steps as $step) {
                $approvals = $this->approvals()->where('workflow_step_id', $step->id)->get();
                if ($approvals->isNotEmpty() && $approvals->every(fn ($a) => $a->status === 'approved')) {
                    $doneCount++;
                }
            }

            $pct = $total > 0 ? round(($doneCount / $total) * 100) : 0;

            return ['done' => $doneCount, 'total' => $total, 'pct' => $pct];
        }

        return ['done' => 0, 'total' => 0, 'pct' => 0];
    }
}
