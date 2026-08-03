<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

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

    protected $appends = [
        'initiator_summary',
        'initiator_roles',
        'initiator_users',
        'initiator_departments',
        'initiator_divisions',
        'contract_type_name',
        'contract_type_ids',
    ];

    public function getInitiatorSummaryAttribute(): string
    {
        if (! $this->relationLoaded('initiatorAuthorities')) {
            return match ($this->initiator_type) {
                'department' => 'Per Departemen',
                'role' => 'Per Jabatan',
                'user' => 'Spesifik User',
                default => 'Seluruh Staff',
            };
        }

        $items = [];
        foreach ($this->initiatorAuthorities as $auth) {
            $parts = [];
            if ($auth->relationLoaded('role') && $auth->role) {
                $parts[] = "Role: {$auth->role->name}";
            }
            if ($auth->relationLoaded('user') && $auth->user) {
                $parts[] = "User: {$auth->user->name}";
            }
            if ($auth->relationLoaded('department') && $auth->department) {
                $parts[] = "Dept: {$auth->department->name}";
            }
            if ($auth->relationLoaded('division') && $auth->division) {
                $parts[] = "Div: {$auth->division->name}";
            }
            if ($auth->relationLoaded('companyGroup') && $auth->companyGroup) {
                $parts[] = "Group: {$auth->companyGroup->name}";
            }
            if ($auth->relationLoaded('region') && $auth->region) {
                $parts[] = "Wilayah: {$auth->region->name}";
            }
            if (empty($parts) && $auth->authority_type) {
                $parts[] = Str::headline($auth->authority_type);
            }
            if (! empty($parts)) {
                $items[] = implode(', ', $parts);
            }
        }

        $items = array_values(array_unique(array_filter($items)));

        if (! empty($items)) {
            return implode(' | ', $items);
        }

        return match ($this->initiator_type) {
            'department' => 'Per Departemen',
            'role' => 'Per Jabatan',
            'user' => 'Spesifik User',
            default => 'Seluruh Staff',
        };
    }

    public function initiatorAuthorities(): HasMany
    {
        return $this->hasMany(WorkflowInitiatorAuthority::class, 'workflow_id');
    }

    public function getInitiatorRolesAttribute()
    {
        if (! $this->relationLoaded('initiatorAuthorities')) {
            return [];
        }
        return $this->initiatorAuthorities->pluck('role.name')->filter()->unique()->values()->toArray();
    }

    public function getInitiatorDepartmentsAttribute()
    {
        if (! $this->relationLoaded('initiatorAuthorities')) {
            return [];
        }
        return $this->initiatorAuthorities->pluck('department_id')->filter()->unique()->values()->toArray();
    }

    public function getInitiatorUsersAttribute()
    {
        if (! $this->relationLoaded('initiatorAuthorities')) {
            return [];
        }
        return $this->initiatorAuthorities->pluck('user_id')->filter()->unique()->values()->toArray();
    }

    public function getInitiatorDivisionsAttribute()
    {
        if (! $this->relationLoaded('initiatorAuthorities')) {
            return [];
        }
        return $this->initiatorAuthorities->pluck('division_id')->filter()->unique()->values()->toArray();
    }

    public function getContractTypeNameAttribute()
    {
        if (!empty($this->attributes['contract_type_id'])) {
            return $this->contractType?->name;
        }

        $ids = $this->contract_type_ids;
        if (!empty($ids)) {
            return ContractType::whereIn('id', $ids)->pluck('name')->implode(', ');
        }

        return 'Global / Semua Tipe';
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
