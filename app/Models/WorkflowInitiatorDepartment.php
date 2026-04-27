<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WorkflowInitiatorDepartment extends Model
{
    use HasUuids;
    protected $table = 'm_workflow_initiator_departments';
    protected $fillable = ['workflow_id', 'department_id'];
}
