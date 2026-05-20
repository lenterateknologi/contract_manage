<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

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
    ];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

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
}
