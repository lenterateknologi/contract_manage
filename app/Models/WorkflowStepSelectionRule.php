<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WorkflowStepSelectionRule extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_step_selection_rules';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'workflow_step_id',
        'role_id',
        'department_id',
        'role_name',
    ];

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
