<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractSlaStepItem extends Model
{
    use HasUuids;

    protected $table = 'm_contract_sla_step_items';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'sla_config_id',
        'workflow_step_id',
        'phase',
        'duration_hours',
        'is_business_days',
    ];

    protected $casts = [
        'duration_hours' => 'integer',
        'is_business_days' => 'boolean',
    ];

    public function slaConfig(): BelongsTo
    {
        return $this->belongsTo(ContractSlaConfig::class, 'sla_config_id');
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }
}
