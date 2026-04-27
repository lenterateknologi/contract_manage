<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WorkflowStepRole extends Model
{
    use HasUuids;
    protected $table = 'm_workflow_step_roles';
    protected $fillable = ['workflow_step_id', 'role_name'];
}
