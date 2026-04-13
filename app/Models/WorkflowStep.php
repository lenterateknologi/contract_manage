<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowStep extends Model
{
    protected $fillable = [
        'workflow_id',
        'role',
        'approver_type',
        'step',
        'description',
        'created_by',
        'updated_by',
        'is_active',
    ];

    protected $casts = [
        'step' => 'integer',
        'is_active' => 'boolean',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workflow_step_users')->withTimestamps();
    }

    public function nextStep(): ?self
    {
        return self::where('workflow_id', $this->workflow_id)
            ->where('step', $this->step + 1)
            ->first();
    }
}
