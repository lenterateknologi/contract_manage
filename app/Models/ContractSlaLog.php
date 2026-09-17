<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractSlaLog extends Model
{
    use HasUuids;

    protected $table = 't_contract_sla_logs';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'contract_id',
        'workflow_step_id',
        'assigned_user_id',
        'phase',
        'started_at',
        'target_deadline',
        'actual_completed_at',
        'status',
        'duration_spent_minutes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'target_deadline' => 'datetime',
        'actual_completed_at' => 'datetime',
        'duration_spent_minutes' => 'integer',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
