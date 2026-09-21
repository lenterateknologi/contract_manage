<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubmissionReview extends Model
{
    use HasFactory, HasUuids;

    protected $table = 't_submission_reviews';

    // Submission Types
    public const TYPE_CONTRACT = 'contract';
    public const TYPE_FORM_SUBMISSION = 'form_submission';

    // Context types
    public const CONTEXT_DOCUMENT_REVIEW = 'document_review';
    public const CONTEXT_FIELD_REQUIREMENT = 'field_requirement';
    public const CONTEXT_ATTACHMENT_REQUIREMENT = 'attachment_requirement';
    public const CONTEXT_CHECKLIST_REQUIREMENT = 'checklist_requirement';

    // Statuses
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_PENDING = 'pending';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'submission_id',
        'contract_id',
        'submission_type',
        'workflow_step_id',
        'workflow_step_action_id',
        'step_number',
        'workflow_iteration',
        'context_type',
        'item_key',
        'document_type',
        'status',
        'user_id',
        'user_name',
        'user_role',
        'reviewed_at',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'metadata' => 'array',
        'step_number' => 'integer',
        'workflow_iteration' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->submission_type)) {
                $model->submission_type = self::TYPE_CONTRACT;
            }
            if (empty($model->submission_id) && ! empty($model->contract_id)) {
                $model->submission_id = $model->contract_id;
            }
            if (empty($model->contract_id) && ! empty($model->submission_id) && $model->submission_type === self::TYPE_CONTRACT) {
                $model->contract_id = $model->submission_id;
            }
            if (empty($model->context_type)) {
                $model->context_type = self::CONTEXT_DOCUMENT_REVIEW;
            }
            if (empty($model->status)) {
                $model->status = self::STATUS_REVIEWED;
            }
            if (! empty($model->document_type) && empty($model->item_key)) {
                $model->item_key = $model->document_type;
            }
            if (! empty($model->item_key) && empty($model->document_type)) {
                $model->document_type = $model->item_key;
            }
        });
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'submission_id');
    }

    public function formSubmission(): BelongsTo
    {
        return $this->belongsTo(FormSubmission::class, 'submission_id');
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    public function workflowStepAction(): BelongsTo
    {
        return $this->belongsTo(WorkflowStepAction::class, 'workflow_step_action_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
