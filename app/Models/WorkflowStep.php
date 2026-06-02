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
        'filter_department',
        'filter_company_group',
        'filter_region',
        'filter_company',
    ];

    protected $casts = [
        'step' => 'integer',
        'is_active' => 'boolean',
        'meta' => 'array',
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

    protected $with = ['approverRoles', 'approverDepartments', 'approverUsers'];

    protected $appends = ['role', 'department_ids', 'department_names', 'user_ids', 'name'];

    public function getNameAttribute()
    {
        return $this->description;
    }

    public function actions(): HasMany
    {
        return $this->hasMany(WorkflowStepAction::class, 'workflow_step_id');
    }

    public function approverRoles(): HasMany
    {
        return $this->hasMany(WorkflowStepRole::class, 'workflow_step_id');
    }

    public function approverDepartments(): HasMany
    {
        return $this->hasMany(WorkflowStepDepartment::class, 'workflow_step_id');
    }

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
        return $this->approverDepartments->pluck('department_id')->toArray();
    }

    public function getDepartmentNamesAttribute()
    {
        // Load the departments relation if not loaded
        return $this->approverDepartments->map(function ($sd) {
            return $sd->department?->name ?? 'All Departments';
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

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'm_workflow_step_users', 'workflow_step_id', 'user_id');
    }
}
