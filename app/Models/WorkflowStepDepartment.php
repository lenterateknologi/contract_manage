<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WorkflowStepDepartment extends Model
{
    use HasUuids;
    protected $table = 'm_workflow_step_departments';
    protected $fillable = ['workflow_step_id', 'department_id'];
}
