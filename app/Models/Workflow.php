<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string|null $contract_type_id
 * @property string|null $department_id
 * @property string $name
 * @property string|null $description
 * @property bool $is_default
 * @property bool $is_template
 * @property bool $is_tax_involved
 * @property bool $is_selectable
 * @property string|null $initiator_type
 * @property int|null $sla_drafting_hours
 * @property int|null $sla_total_hours
 * @property int|null $sla_cutoff_hour
 * @property string|null $scope
 * @property string|null $workflow_category
 * @property array|null $company_group_ids
 * @property array|null $region_ids
 * @property array|null $company_ids
 * @property array|null $approver_roles
 * @property array|null $approver_departments
 * @property array|null $approver_users
 * @property array|null $legal_roles
 * @property array|null $legal_departments
 * @property array|null $legal_users
 * @property string|null $created_by
 * @property string|null $updated_by
 * @property array|null $meta
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read array $initiator_roles
 * @property-read array $initiator_users
 * @property-read array $initiator_departments
 * @property-read string|null $contract_type_name
 * @property-read ContractType|null $contractType
 * @property-read Department|null $department
 * @property-read Collection<int, WorkflowStep> $steps
 * @property-read Collection<int, Contract> $contracts
 * @property-read Collection<int, WorkflowInitiatorAuthority> $initiatorAuthorities
 * @property-read Collection<int, WorkflowOrgScope> $orgScopes
 */
class Workflow extends Model
{
    protected $table = 'm_workflows';

    use HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'contract_type_id',
        'department_id',
        'name',
        'description',
        'is_default',
        'is_template',
        'is_tax_involved',
        'is_selectable',
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
        'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_template' => 'boolean',
        'is_tax_involved' => 'boolean',
        'is_selectable' => 'boolean',
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

    protected $with = ['contractType', 'orgScopes', 'initiatorAuthorities.role'];

    protected $appends = [
        'initiator_roles',
        'initiator_users',
        'initiator_departments',
        'initiator_divisions',
        'contract_type_name',
        'contract_type_ids',
        'company_group_ids',
        'region_ids',
        'company_ids',
    ];

    public function orgScopes(): HasMany
    {
        return $this->hasMany(WorkflowOrgScope::class, 'workflow_id');
    }

    public function initiatorAuthorities(): HasMany
    {
        return $this->hasMany(WorkflowInitiatorAuthority::class, 'workflow_id');
    }

    public function getCompanyGroupIdsAttribute()
    {
        return $this->orgScopes->pluck('company_group_id')->filter()->unique()->values()->toArray();
    }

    public function getRegionIdsAttribute()
    {
        return $this->orgScopes->pluck('region_id')->filter()->unique()->values()->toArray();
    }

    public function getCompanyIdsAttribute()
    {
        return $this->orgScopes->pluck('company_id')->filter()->unique()->values()->toArray();
    }

    public function getInitiatorRolesAttribute()
    {
        return $this->initiatorAuthorities->pluck('role.name')->filter()->unique()->values()->toArray();
    }

    public function getInitiatorDepartmentsAttribute()
    {
        return $this->initiatorAuthorities->pluck('department_id')->filter()->unique()->values()->toArray();
    }

    public function getInitiatorUsersAttribute()
    {
        return $this->initiatorAuthorities->pluck('user_id')->filter()->unique()->values()->toArray();
    }

    public function getInitiatorDivisionsAttribute()
    {
        return $this->initiatorAuthorities->pluck('division_id')->filter()->unique()->values()->toArray();
    }

    public function getContractTypeNameAttribute()
    {
        if (! array_key_exists('contract_type_id', $this->attributes)) {
            return null;
        }

        return $this->contractType?->name;
    }

    public function getContractTypeIdsAttribute()
    {
        return $this->meta['contract_type_ids'] ?? [];
    }

    public function contractType(): BelongsTo
    {
        return $this->belongsTo(ContractType::class, 'contract_type_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Division::class);
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
                $query->where(function ($q) use ($contractType) {
                    $q->where('contract_type_id', $contractType)
                        ->orWhereJsonContains('meta->contract_type_ids', $contractType);
                });
            } else {
                // If it's a legacy string (code or name), try to resolve it from m_contract_types
                $typeId = ContractType::where('code', $contractType)
                    ->orWhere('name', $contractType)
                    ->value('id');
                if ($typeId) {
                    $query->where(function ($q) use ($typeId) {
                        $q->where('contract_type_id', $typeId)
                            ->orWhereJsonContains('meta->contract_type_ids', $typeId);
                    });
                } else {
                    $query->whereNull('contract_type_id')
                        ->where(function ($q) {
                            $q->whereNull('meta->contract_type_ids')
                                ->orWhereJsonLength('meta->contract_type_ids', 0);
                        }); // Match GLOBAL
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
