<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\SoftDeletes;

class Workflow extends Model
{
    protected $table = 'm_workflows';

    use HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'contract_type_id',
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
        'company_group_ids',
        'region_ids',
        'company_ids',
        'approver_roles',
        'approver_departments',
        'approver_users',
        'legal_roles',
        'legal_departments',
        'legal_users',
        'created_by',
        'updated_by',
        'meta',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_tax_involved' => 'boolean',
        'company_group_ids' => 'array',
        'region_ids' => 'array',
        'company_ids' => 'array',
        'approver_roles' => 'array',
        'approver_departments' => 'array',
        'approver_users' => 'array',
        'legal_roles' => 'array',
        'legal_departments' => 'array',
        'legal_users' => 'array',
        'meta' => 'array',
    ];

    protected $with = ['initiatorRolesData', 'initiatorDepartmentsData', 'initiatorUsersData'];

    protected $appends = ['initiator_roles', 'initiator_users', 'initiator_departments', 'contract_type_name'];

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

    public function getContractTypeNameAttribute()
    {
        return $this->contractType?->name;
    }

    public function contractType(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'contract_type_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class)->orderBy('step');
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public static function getDefaultByContractType(?string $contractType, bool $taxRequired = false): ?self
    {
        if ($contractType) {
            // Check if it's a UUID
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $contractType);

            $query = self::query();
            if ($isUuid) {
                $query->where('contract_type_id', $contractType);
            } else {
                // If it's a legacy string (code or name), try to resolve it from m_contract_types
                $typeId = ContractType::where('code', $contractType)
                    ->orWhere('name', $contractType)
                    ->value('id');
                if ($typeId) {
                    $query->where('contract_type_id', $typeId);
                } else {
                    $query->whereNull('contract_type_id'); // Match GLOBAL
                }
            }

            $workflow = (clone $query)->where('is_tax_involved', $taxRequired)->first();
            if ($workflow) {
                return $workflow;
            }

            // Fallback to any default for this contract type
            $default = (clone $query)->where('is_default', true)->first();
            if ($default) {
                return $default;
            }
        }

        // Global fallback
        return self::where('is_default', true)
            ->where('is_tax_involved', $taxRequired)
            ->first();
    }
}
