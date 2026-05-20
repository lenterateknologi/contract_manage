<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WorkflowInitiatorRole extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_initiator_roles';

    protected $fillable = ['workflow_id', 'role_name'];
}
