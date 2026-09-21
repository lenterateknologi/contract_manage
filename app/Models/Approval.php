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
        'workflow_id',
        'workflow_step_id',
        'action_id',
        'action_code',
        'action_alias',
        'user_id',
        'approver_name',
        'role',
        'job_title',
        'approver_type',
        'status',
        'comment',
        'attachment_path',
        'decided_at',
        'created_by',
        'updated_by',
        'sequence',
        'step_number',
        'sub_step',
        'sort_order',
        'is_active',
        'is_current_step',
        'batch_no',
        'parent_approval_id',
        'is_adhoc',
        'due_at',
        'sla_hours',
        'is_overdue',
        'overdue_notified_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
        'due_at' => 'datetime',
        'overdue_notified_at' => 'datetime',
        'is_active' => 'boolean',
        'is_current_step' => 'boolean',
        'is_adhoc' => 'boolean',
        'is_overdue' => 'boolean',
        'sla_hours' => 'integer',
        'batch_no' => 'integer',
        'step_number' => 'integer',
        'sequence' => 'integer',
        'sub_step' => 'integer',
        'sort_order' => 'integer',
    ];

    public function getTargetApproversAttribute(): ?string
    {
        return $this->approver_name;
    }

    public function getDepartmentNameAttribute(): ?string
    {
        return $this->approver?->department?->name ?? $this->approver?->division?->name;
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class);
    }

    public function action(): BelongsTo
    {
        return $this->belongsTo(WorkflowStepAction::class, 'action_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approve(?string $comment = null, ?string $attachmentPath = null, ?string $actionId = null, ?string $actionCode = null, ?string $actionAlias = null): void
    {
        $data = [
            'status' => 'approved',
            'comment' => $comment,
            'attachment_path' => $attachmentPath ?? $this->attachment_path,
            'decided_at' => now(),
            'updated_by' => Auth::id(),
        ];

        if ($actionId !== null) {
            $data['action_id'] = \Illuminate\Support\Str::isUuid($actionId) ? $actionId : null;
        }
        if ($actionCode !== null) {
            $data['action_code'] = $actionCode;
        }
        if ($actionAlias !== null) {
            $data['action_alias'] = $actionAlias;
        }

        $this->update($data);
    }

    public function reject(?string $comment = null, ?string $attachmentPath = null, ?string $actionId = null, ?string $actionCode = null, ?string $actionAlias = null): void
    {
        $data = [
            'status' => 'rejected',
            'comment' => $comment,
            'attachment_path' => $attachmentPath ?? $this->attachment_path,
            'decided_at' => now(),
            'updated_by' => Auth::id(),
        ];

        if ($actionId !== null) {
            $data['action_id'] = \Illuminate\Support\Str::isUuid($actionId) ? $actionId : null;
        }
        if ($actionCode !== null) {
            $data['action_code'] = $actionCode;
        }
        if ($actionAlias !== null) {
            $data['action_alias'] = $actionAlias;
        }

        $this->update($data);
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
