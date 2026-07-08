<?php

namespace App\Models;

use App\Mail\ContractActionRequiredMail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class Approval extends Model
{
    protected $table = 't_approvals';

    use HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'contract_id',
        'workflow_step_id',
        'user_id',
        'approver_name',
        'role',
        'job_title',
        'status',
        'comment',
        'attachment_path',
        'decided_at',
        'created_by',
        'updated_by',
        'sequence',
        'sub_step',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function getTargetApproversAttribute(): ?string
    {
        return $this->approver_name;
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approve(?string $comment = null, ?string $attachmentPath = null): void
    {
        $this->update([
            'status' => 'approved',
            'comment' => $comment,
            'attachment_path' => $attachmentPath ?? $this->attachment_path,
            'decided_at' => now(),
            'updated_by' => Auth::id(),
        ]);
    }

    public function reject(?string $comment = null, ?string $attachmentPath = null): void
    {
        $this->update([
            'status' => 'rejected',
            'comment' => $comment,
            'attachment_path' => $attachmentPath ?? $this->attachment_path,
            'decided_at' => now(),
            'updated_by' => Auth::id(),
        ]);
    }

    protected static function booted()
    {
        static::saved(function ($approval) {
            // ponytail: send email notification when status becomes pending
            $isNewPending = $approval->wasRecentlyCreated && $approval->status === 'pending';
            $isStatusChangedToPending = $approval->wasChanged('status') && $approval->status === 'pending';

            if ($isNewPending || $isStatusChangedToPending) {
                if (config('notifications.email.enabled', true)) {
                    $approval->loadMissing(['approver', 'contract', 'workflowStep']);
                    if ($approval->approver && $approval->approver->email) {
                        Mail::to($approval->approver->email)
                            ->queue(new ContractActionRequiredMail($approval));
                    }
                }
            }
        });
    }
}
