<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Workflow extends Model
{
    protected $table = 'm_workflows';

    use HasUuids, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'contract_type',
        'department_id',
        'name',
        'description',
        'is_default',
        'is_template',
        'is_tax_involved',
        'initiator_type',
        'sla_drafting_hours',
        'sla_total_hours',
        'sla_cutoff_hour',
        'scope',
        'workflow_category',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_tax_involved' => 'boolean',
    ];

    protected $with = ['initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData'];
    protected $appends = ['initiator_roles', 'initiator_users', 'initiator_departments'];

    public function initiatorRolesData(): HasMany
    {
        return $this->hasMany(WorkflowInitiatorRole::class, 'workflow_id');
    }

    public function initiatorDepartmentsData(): HasMany
    {
        return $this->hasMany(WorkflowInitiatorDepartment::class, 'workflow_id');
    }

    public function initiatorUsersData(): HasMany
    {
        return $this->hasMany(WorkflowInitiatorUser::class, 'workflow_id');
    }

    public function getInitiatorRolesAttribute()
    {
        return $this->initiatorRolesData->pluck('role_name')->toArray();
    }

    public function getInitiatorDepartmentsAttribute()
    {
        return $this->initiatorDepartmentsData->pluck('department_id')->toArray();
    }

    public function getInitiatorUsersAttribute()
    {
        return $this->initiatorUsersData->pluck('user_id')->toArray();
    }

    public function department(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public static function getDefaultByContractType(?string $contractType, bool $taxRequired = false): ?self
    {
        // First try to find a workflow that matches both type and tax requirement
        if ($contractType) {
            $workflow = self::where('contract_type', $contractType)
                ->where('is_tax_involved', $taxRequired)
                ->first();
            
            if ($workflow) return $workflow;

            // Fallback to any default for this contract type
            $default = self::where('contract_type', $contractType)
                ->where('is_default', true)
                ->first();
            
            if ($default) return $default;
        }

        // Global fallback
        return self::where('is_default', true)
            ->where('is_tax_involved', $taxRequired)
            ->first();
    }
}
