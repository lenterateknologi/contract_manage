<?php

namespace App\Models;

use App\Enums\WorkflowAction;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $workflow_step_id
 * @property string $master_action_id
 * @property WorkflowAction|null $action_code
 * @property string|null $next_step_id
 * @property string|null $next_workflow_id
 * @property string|null $next_workflow_step_id
 * @property array|null $required_fields
 * @property array|null $autofilled_fields
 * @property array|null $transition_config
 * @property array|null $signing_parties
 * @property array|null $assignee_config
 * @property string|null $alias
 * @property string|null $description
 * @property bool $is_active
 * @property-read WorkflowMasterAction|null $masterAction
 */
class WorkflowStepAction extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'm_workflow_step_actions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'workflow_step_id',
        'action_code',
        'next_step_id',
        'next_workflow_id',
        'next_workflow_step_id',
        'required_fields',
        'autofilled_fields',
        'transition_config',
        'signing_parties',
        'assignee_config',
        'alias',
        'description',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'action_code' => WorkflowAction::class,
        'required_fields' => 'array',
        'autofilled_fields' => 'array',
        'transition_config' => 'array',
        'signing_parties' => 'array',
        'assignee_config' => 'array',
        'is_active' => 'boolean',
    ];

    public function step(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    public function nextStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'next_step_id');
    }

    public function nextWorkflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class, 'next_workflow_id');
    }

    public function nextWorkflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'next_workflow_step_id');
    }

    public function masterAction(): BelongsTo
    {
        return $this->belongsTo(WorkflowMasterAction::class, 'master_action_id');
    }
}
