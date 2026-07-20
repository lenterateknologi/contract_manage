<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable, SoftDeletes;

    protected $table = 'm_users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone_number',
        'username',
        'role_id',
        'department_id',
        'is_active',
        'company_id',
        'spv_id',
        'code',
        'company_group_id',
        'division_id',
        'login_status',
        'last_login',
        'last_connected',
        'address',
        'birth_date',
        'gender',
        'created_by',
        'updated_by',
        'is_verified',
        'verified_by',
        'verified_at',
        'job_position_id',
        'job_level_id',
        'image_src',
        'location_id',
        'region_id',
        'is_employee',
        'id_employee_portal_master',
        'filter_settings',
        'use_role_filter',
        'can_change_company_group',
        'allowed_company_groups',
        'can_change_region',
        'allowed_regions',
        'can_change_company',
        'allowed_companies',
        'can_change_division',
        'allowed_divisions',
        'can_change_department',
        'allowed_departments',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $with = ['roleRelation', 'contractFilter'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'initials',
        'role',
        'division_name',
        'department_name',
        'can_change_company_group',
        'allowed_company_groups',
        'can_change_region',
        'allowed_regions',
        'can_change_company',
        'allowed_companies',
        'can_change_division',
        'allowed_divisions',
        'can_change_department',
        'allowed_departments',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'use_role_filter' => 'boolean',
            'filter_settings' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Role, User>
     */
    public function roleRelation(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Get the user's role name.
     */
    public function getRoleAttribute(): ?string
    {
        if (! array_key_exists('role_id', $this->attributes)) {
            return null;
        }

        return $this->roleRelation?->name;
    }

    public function getDivisionNameAttribute(): ?string
    {
        if (! $this->relationLoaded('division')) {
            return null;
        }

        return $this->division?->name;
    }

    public function getDepartmentNameAttribute(): ?string
    {
        if (! $this->relationLoaded('department')) {
            return null;
        }

        return $this->department?->name;
    }

    /**
     * @return BelongsTo<Company, User>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * @return BelongsTo<CompanyGroup, User>
     */
    public function companyGroup(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    /**
     * @return BelongsTo<Division, User>
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    /**
     * @return BelongsTo<Region, User>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    /**
     * @return BelongsToMany<WorkflowStep, User>
     */
    public function workflowSteps(): BelongsToMany
    {
        return $this->belongsToMany(WorkflowStep::class, 't_workflow_step_users')->withTimestamps();
    }

    public function getIsAdminAttribute(): bool
    {
        return in_array($this->role, ['Admin', 'Super Admin']);
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['Admin', 'Super Admin']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'Super Admin';
    }

    public function getInitialsAttribute(): string
    {
        $name = $this->name ?? '';
        $words = explode(' ', trim($name));
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1).substr($words[1], 0, 1));
        }

        return strtoupper(substr($name, 0, 2));
    }

    public function contractFilter()
    {
        return $this->hasOne(ContractFilterSetting::class, 'reference_id')->where('type', 'user');
    }

    public function getContractFilterSettings(): array
    {
        // 1. Cek apakah memakai filter dari role
        if ($this->use_role_filter) {
            $roleFilter = $this->roleRelation ? $this->roleRelation->contractFilter : null;
            if ($roleFilter) {
                return [
                    'can_change_company_group' => (bool) $roleFilter->can_change_company_group,
                    'allowed_company_groups' => $roleFilter->getItemValues('company_group'),
                    'can_change_region' => (bool) $roleFilter->can_change_region,
                    'allowed_regions' => $roleFilter->getItemValues('region'),
                    'can_change_company' => (bool) $roleFilter->can_change_company,
                    'allowed_companies' => $roleFilter->getItemValues('company'),
                    'can_change_division' => (bool) $roleFilter->can_change_division,
                    'allowed_divisions' => $roleFilter->getItemValues('division'),
                    'can_change_department' => (bool) $roleFilter->can_change_department,
                    'allowed_departments' => $roleFilter->getItemValues('department'),
                ];
            }

            // Fallback hardcoded bila role belum punya contractFilter
            $roleName = $this->role;
            $isHighLevel = in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);

            return [
                'can_change_company_group' => $isHighLevel,
                'allowed_company_groups' => [],
                'can_change_region' => $isHighLevel,
                'allowed_regions' => [],
                'can_change_company' => $isHighLevel,
                'allowed_companies' => [],
                'can_change_division' => $isHighLevel || in_array($roleName, ['Manager']),
                'allowed_divisions' => [],
                'can_change_department' => $isHighLevel || in_array($roleName, ['Manager']),
                'allowed_departments' => [],
            ];
        }

        // 2. Ambil dari user filter setting di m_contract_filter
        $userFilter = $this->contractFilter;
        if ($userFilter) {
            return [
                'can_change_company_group' => (bool) $userFilter->can_change_company_group,
                'allowed_company_groups' => $userFilter->getItemValues('company_group'),
                'can_change_region' => (bool) $userFilter->can_change_region,
                'allowed_regions' => $userFilter->getItemValues('region'),
                'can_change_company' => (bool) $userFilter->can_change_company,
                'allowed_companies' => $userFilter->getItemValues('company'),
                'can_change_division' => (bool) $userFilter->can_change_division,
                'allowed_divisions' => $userFilter->getItemValues('division'),
                'can_change_department' => (bool) $userFilter->can_change_department,
                'allowed_departments' => $userFilter->getItemValues('department'),
            ];
        }

        // Default fallback
        return [
            'can_change_company_group' => false,
            'allowed_company_groups' => [],
            'can_change_region' => false,
            'allowed_regions' => [],
            'can_change_company' => false,
            'allowed_companies' => [],
            'can_change_division' => false,
            'allowed_divisions' => [],
            'can_change_department' => false,
            'allowed_departments' => [],
        ];
    }

    protected function getOrCreateContractFilter(): ContractFilterSetting
    {
        return ContractFilterSetting::firstOrCreate([
            'type' => 'user',
            'reference_id' => $this->id,
        ]);
    }

    protected function updateContractFilterFlag(string $key, bool $value): void
    {
        if (empty($this->id)) {
            return;
        }
        $this->getOrCreateContractFilter()->update([$key => $value]);
    }

    protected function updateContractFilterItems(string $type, array $values): void
    {
        if (empty($this->id)) {
            return;
        }
        $this->getOrCreateContractFilter()->syncItems($type, $values);
    }

    public function getCanChangeCompanyGroupAttribute()
    {
        return $this->getContractFilterSettings()['can_change_company_group'] ?? false;
    }

    public function setCanChangeCompanyGroupAttribute($value)
    {
        $this->updateContractFilterFlag('can_change_company_group', (bool) $value);
    }

    public function getAllowedCompanyGroupsAttribute()
    {
        return $this->getContractFilterSettings()['allowed_company_groups'] ?? [];
    }

    public function setAllowedCompanyGroupsAttribute($value)
    {
        $this->updateContractFilterItems('company_group', is_array($value) ? $value : []);
    }

    public function getCanChangeRegionAttribute()
    {
        return $this->getContractFilterSettings()['can_change_region'] ?? false;
    }

    public function setCanChangeRegionAttribute($value)
    {
        $this->updateContractFilterFlag('can_change_region', (bool) $value);
    }

    public function getAllowedRegionsAttribute()
    {
        return $this->getContractFilterSettings()['allowed_regions'] ?? [];
    }

    public function setAllowedRegionsAttribute($value)
    {
        $this->updateContractFilterItems('region', is_array($value) ? $value : []);
    }

    public function getCanChangeCompanyAttribute()
    {
        return $this->getContractFilterSettings()['can_change_company'] ?? false;
    }

    public function setCanChangeCompanyAttribute($value)
    {
        $this->updateContractFilterFlag('can_change_company', (bool) $value);
    }

    public function getAllowedCompaniesAttribute()
    {
        return $this->getContractFilterSettings()['allowed_companies'] ?? [];
    }

    public function setAllowedCompaniesAttribute($value)
    {
        $this->updateContractFilterItems('company', is_array($value) ? $value : []);
    }

    public function getCanChangeDivisionAttribute()
    {
        return $this->getContractFilterSettings()['can_change_division'] ?? false;
    }

    public function setCanChangeDivisionAttribute($value)
    {
        $this->updateContractFilterFlag('can_change_division', (bool) $value);
    }

    public function getAllowedDivisionsAttribute()
    {
        return $this->getContractFilterSettings()['allowed_divisions'] ?? [];
    }

    public function setAllowedDivisionsAttribute($value)
    {
        $this->updateContractFilterItems('division', is_array($value) ? $value : []);
    }

    public function getCanChangeDepartmentAttribute()
    {
        return $this->getContractFilterSettings()['can_change_department'] ?? false;
    }

    public function setCanChangeDepartmentAttribute($value)
    {
        $this->updateContractFilterFlag('can_change_department', (bool) $value);
    }

    public function getAllowedDepartmentsAttribute()
    {
        return $this->getContractFilterSettings()['allowed_departments'] ?? [];
    }

    public function setAllowedDepartmentsAttribute($value)
    {
        $this->updateContractFilterItems('department', is_array($value) ? $value : []);
    }
}
