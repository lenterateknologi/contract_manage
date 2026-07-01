<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkflowStep extends Model
{
    protected $table = 'm_workflow_steps';

    use HasUuids, SoftDeletes;

    protected static function booted()
    {
        static::addGlobalScope('order', function ($builder) {
            $builder->orderBy('step', 'asc');
        });
    }

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'workflow_id',
        'approver_type',
        'step',
        'step_category',
        'is_optional',
        'optional_label',
        'condition_expression',
        'description',
        'phase',
        'uploader_type',
        'hierarchy_level',
        'role_id',
        'company_group_ids',
        'region_ids',
        'company_ids',
        'label',
        'allowed_actions',
        'is_mandatory',
        'created_by',
        'updated_by',
        'is_active',
        'meta',
        'approver_config',
        'filter_department',
        'filter_company_group',
        'filter_region',
        'filter_company',
    ];

    protected function casts(): array
    {
        return [
            'step' => 'integer',
            'is_active' => 'boolean',
            'meta' => 'array',
            'approver_config' => 'array',
            'is_optional' => 'boolean',
            'hierarchy_level' => 'integer',
            'approver_type' => 'string',
            'step_category' => 'string',
            'company_group_ids' => 'array',
            'region_ids' => 'array',
            'company_ids' => 'array',
            'allowed_actions' => 'array',
            'is_mandatory' => 'boolean',
            'filter_department' => 'boolean',
            'filter_company_group' => 'boolean',
            'filter_region' => 'boolean',
            'filter_company' => 'boolean',
        ];
    }

    protected $with = ['approverRoles', 'approverDepartments.department', 'approverDivisions.division', 'approverUsers', 'users'];

    protected $appends = ['role', 'department_ids', 'department_names', 'division_ids', 'division_names', 'user_ids', 'name'];

    public function getNameAttribute()
    {
        return $this->description;
    }

    /**
     * @return HasMany<WorkflowStepAction, WorkflowStep>
     */
    public function actions(): HasMany
    {
        return $this->hasMany(WorkflowStepAction::class, 'workflow_step_id');
    }

    /**
     * @return HasMany<WorkflowStepRole, WorkflowStep>
     */
    public function approverRoles(): HasMany
    {
        return $this->hasMany(WorkflowStepRole::class, 'workflow_step_id');
    }

    /**
     * @return HasMany<WorkflowStepDepartment, WorkflowStep>
     */
    public function approverDepartments(): HasMany
    {
        return $this->hasMany(WorkflowStepDepartment::class, 'workflow_step_id');
    }

    /**
     * @return HasMany<WorkflowStepDivision, WorkflowStep>
     */
    public function approverDivisions(): HasMany
    {
        return $this->hasMany(WorkflowStepDivision::class, 'workflow_step_id');
    }

    /**
     * @return HasMany<WorkflowStepUser, WorkflowStep>
     */
    public function approverUsers(): HasMany
    {
        return $this->hasMany(WorkflowStepUser::class, 'workflow_step_id');
    }

    public function getRoleAttribute()
    {
        return $this->approverRoles->pluck('role_name')->toArray();
    }

    public function getDepartmentIdsAttribute()
    {
        return $this->approverDivisions->pluck('division_id')->toArray();
    }

    public function getDepartmentNamesAttribute()
    {
        return $this->approverDivisions->map(function ($sd) {
            return $sd->division?->name ?? 'All Divisions';
        })->unique()->toArray();
    }

    public function getDivisionIdsAttribute()
    {
        return $this->approverDivisions->pluck('division_id')->toArray();
    }

    public function getDivisionNamesAttribute()
    {
        return $this->approverDivisions->map(function ($sd) {
            return $sd->division?->name ?? 'All Divisions';
        })->unique()->toArray();
    }

    public function getUserIdsAttribute()
    {
        return $this->approverUsers->pluck('user_id')->toArray();
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function getApproverConfigAttribute($value)
    {
        $config = $value ? (is_string($value) ? json_decode($value, true) : $value) : [];

        $roleNames = $this->relationLoaded('approverRoles') ? $this->approverRoles->pluck('role_name')->toArray() : $this->approverRoles()->pluck('role_name')->toArray();
        $userIds = $this->relationLoaded('approverUsers') ? $this->approverUsers->pluck('user_id')->toArray() : $this->approverUsers()->pluck('user_id')->toArray();
        $departmentIds = $this->relationLoaded('approverDepartments') ? $this->approverDepartments->pluck('department_id')->toArray() : $this->approverDepartments()->pluck('department_id')->toArray();

        return array_merge([
            'custom' => in_array($this->approver_type, ['initiator', 'assigned_pic', 'creator', 'atasan']) ? [$this->approver_type] : [],
            'roles' => $this->approver_type === 'role' ? $roleNames : [],
            'departments' => $this->approver_type === 'role' ? $departmentIds : [],
            'users' => $this->approver_type === 'user' ? $userIds : [],
            'is_default' => $this->approver_type === 'initiator',
            'is_initiator_role' => $this->approver_type === 'role' && empty($roleNames),
            'is_initiator_department' => $this->approver_type === 'role' && empty($departmentIds),
        ], $config);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'm_workflow_step_users', 'workflow_step_id', 'user_id');
    }
}
