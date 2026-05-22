<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WorkflowInitiatorDepartment extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_initiator_departments';

    protected $fillable = ['workflow_id', 'department_id'];

    public function department(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
