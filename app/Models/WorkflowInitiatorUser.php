<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WorkflowInitiatorUser extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_initiator_users';

    protected $fillable = ['workflow_id', 'user_id'];
}
