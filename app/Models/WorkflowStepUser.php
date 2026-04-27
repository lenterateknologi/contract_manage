<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WorkflowStepUser extends Model
{
    use HasUuids;
    protected $table = 'm_workflow_step_users';
    protected $fillable = ['workflow_step_id', 'user_id'];
}
