<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WorkflowStep extends Model
{
    use HasUuids, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'workflow_id',
        'role',
        'approver_type',
        'step',
        'step_type',
        'condition_expression',
        'description',
        'created_by',
        'updated_by',
        'is_active',
        'department_id',
    ];

    protected $casts = [
        'step' => 'integer',
        'is_active' => 'boolean',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workflow_step_users')->withTimestamps();
    }
}
