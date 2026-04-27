<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WorkflowInitiatorUser extends Model
{
    use HasUuids;
    protected $table = 'm_workflow_initiator_users';
    protected $fillable = ['workflow_id', 'user_id'];
}
