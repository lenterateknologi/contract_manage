<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowStepAuthority extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_step_authorities';

    public const AUTHORITY_TYPES = [
        'user',
        'division',
        'department',
        'role',
        'company_group',
        'region',
        'role-division',
        'role-division-company_group',
        'role-division_company_group-region',
        'group',
    ];

    protected $fillable = [
        'workflow_step_id',
        'role_id',
        'department_id',
        'division_id',
        'user_id',
        'company_group_id',
        'region_id',
        'role_use_initiator',
        'department_use_initiator',
        'division_use_initiator',
        'company_group_use_initiator',
        'region_use_initiator',
        'authority_type',
        'is_additional',
        'additional_type',
        'workflow_step_action_id',
        'target_step_id',
    ];

    protected function casts(): array
    {
        return [
            'role_use_initiator' => 'boolean',
            'department_use_initiator' => 'boolean',
            'division_use_initiator' => 'boolean',
            'company_group_use_initiator' => 'boolean',
            'region_use_initiator' => 'boolean',
            'is_additional' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'department_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function workflowStepAction(): BelongsTo
    {
        return $this->belongsTo(WorkflowStepAction::class, 'workflow_step_action_id');
    }

    public function targetStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'target_step_id');
    }
}
