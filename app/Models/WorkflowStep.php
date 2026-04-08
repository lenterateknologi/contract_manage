<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowStep extends Model
{
    protected $fillable = [
        'workflow_id',
        'role',
        'step',
        'description',
    ];

    protected $casts = [
        'step' => 'integer',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function nextStep(): ?self
    {
        return self::where('workflow_id', $this->workflow_id)
            ->where('step', $this->step + 1)
            ->first();
    }
}
