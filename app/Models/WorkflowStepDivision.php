<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowStepDivision extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_step_divisions';

    protected $fillable = ['workflow_step_id', 'division_id', 'department_id'];

    protected $appends = ['department_id'];

    /**
     * @return BelongsTo<WorkflowStep, WorkflowStepDivision>
     */
    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    /**
     * @return BelongsTo<Division, WorkflowStepDivision>
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    /**
     * Backward-compatibility helper for department relation.
     *
     * @return BelongsTo<Division, WorkflowStepDivision>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    /**
     * Backward-compatibility helper for department_id column.
     */
    public function getDepartmentIdAttribute()
    {
        return $this->division_id;
    }

    /**
     * Backward-compatibility setter for department_id column.
     */
    public function setDepartmentIdAttribute($value)
    {
        $this->attributes['division_id'] = $value;
        $this->attributes['department_id'] = $value;
    }
}
