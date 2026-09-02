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

    protected $fillable = [
        'idemployee',
        'nik',
        'name',
        'email',
        'password',
        'phone_number',
        'mobile_no',
        'username',
        'role_id',
        'idorganization',
        'org_name',
        'department_id',
        'division_id',
        'idcompany',
        'company_name',
        'company_id',
        'company_group_id',
        'idlocation',
        'location_name',
        'location_id',
        'region_id',
        'idjobtitle',
        'jobtitle_name',
        'job_position_id',
        'idjoblevel',
        'joblevel_name',
        'job_level_id',
        'idemployment_type',
        'idreporting_to',
        'reporting_to',
        'spv_id',
        'start_date',
        'join_date',
        'gender',
        'birth_date',
        'address',
        'code',
        'image_src',
        'modified_by_name',
        'portal_modified_date',
        'is_used',
        'is_active',
        'is_employee',
        'id_employee_portal_master',
        'contract_filter_template_id',
        'login_status',
        'last_login',
        'last_connected',
        'is_verified',
        'verified_by',
        'verified_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_used' => 'boolean',
        'is_employee' => 'boolean',
        'start_date' => 'datetime',
        'join_date' => 'datetime',
        'portal_modified_date' => 'datetime',
        'last_login' => 'datetime',
        'last_connected' => 'datetime',
        'verified_at' => 'datetime',
    ];

    protected $with = ['roleRelation'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'initials',
        'role',
        'division_name',
        'department_name',
        'company_group_name',
        'company_group_code',
        'region_name',
    ];

    protected static function booted(): void
    {
        static::creating(function ($user) {
            if (empty($user->contract_filter_template_id)) {
                $templateId = ContractFilterTemplate::where('name', 'like', '%staff biasa%')->value('id');
                if ($templateId) {
                    $user->contract_filter_template_id = $templateId;
                }
            }
        });

        // ponytail: sync company, group, and region from master business unit & company when company_name is updated/created
        static::saving(function ($user) {
            if ($user->isDirty('company_name') && ! empty($user->company_name)) {
                $company = Company::where('name', $user->company_name)->first();
                $bu = BusinessUnit::where('company_name', $user->company_name)
                    ->orWhere(function ($q) use ($company) {
                        if ($company && $company->idcompany) {
                            $q->where('idcompany', $company->idcompany);
                        }
                    })
                    ->first();

                if ($company || $bu) {
                    $user->company_id = $company?->id ?? $bu?->company_id;
                    $user->idcompany = $company?->idcompany ?? $bu?->idcompany;
                    $user->company_group_id = $company?->company_group_id ?? $bu?->company_group_id;
                    $user->region_id = $company?->region_id ?? $bu?->region_id;
                }
            }
        });
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    public function roleRelation(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

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

    private static array $companyGroupMemoryCache = [];
    private static array $companyMemoryCache = [];
    private static array $regionMemoryCache = [];
    private static array $templateMemoryCache = [];

    public function getCompanyGroupNameAttribute(): ?string
    {
        if ($this->relationLoaded('companyGroup') && $this->companyGroup) {
            return $this->companyGroup->name;
        }

        if ($this->relationLoaded('company') && $this->company && array_key_exists('company_group_name', $this->company->getAttributes())) {
            return $this->company->getAttributes()['company_group_name'];
        }

        $companyGroupId = $this->getAttributeFromArray('company_group_id');
        if (! empty($companyGroupId)) {
            if (! array_key_exists($companyGroupId, self::$companyGroupMemoryCache)) {
                self::$companyGroupMemoryCache[$companyGroupId] = \App\Models\CompanyGroup::find($companyGroupId)?->name;
            }
            return self::$companyGroupMemoryCache[$companyGroupId];
        }

        $companyName = $this->getAttributeFromArray('company_name');
        if (! empty($companyName)) {
            if (! array_key_exists($companyName, self::$companyMemoryCache)) {
                self::$companyMemoryCache[$companyName] = \App\Models\Company::where('name', $companyName)->value('company_group_name');
            }
            return self::$companyMemoryCache[$companyName];
        }

        return null;
    }

    public function getCompanyGroupCodeAttribute(): ?string
    {
        if ($this->relationLoaded('companyGroup') && $this->companyGroup) {
            return $this->companyGroup->code;
        }

        $companyGroupId = $this->getAttributeFromArray('company_group_id');
        if (! empty($companyGroupId)) {
            $cacheKey = "code_{$companyGroupId}";
            if (! array_key_exists($cacheKey, self::$companyGroupMemoryCache)) {
                self::$companyGroupMemoryCache[$cacheKey] = \App\Models\CompanyGroup::find($companyGroupId)?->code;
            }
            return self::$companyGroupMemoryCache[$cacheKey];
        }

        if ($this->relationLoaded('company') && $this->company) {
            return $this->company->company_group_code ?? $this->company->group?->code;
        }

        return null;
    }

    public function getRegionNameAttribute(): ?string
    {
        if ($this->relationLoaded('region') && $this->region) {
            return $this->region->name;
        }

        if ($this->relationLoaded('company') && $this->company && array_key_exists('region_name', $this->company->getAttributes())) {
            return $this->company->getAttributes()['region_name'];
        }

        $regionId = $this->getAttributeFromArray('region_id');
        if (! empty($regionId)) {
            if (! array_key_exists($regionId, self::$regionMemoryCache)) {
                self::$regionMemoryCache[$regionId] = \App\Models\Region::find($regionId)?->name;
            }
            return self::$regionMemoryCache[$regionId];
        }

        $companyName = $this->getAttributeFromArray('company_name');
        if (! empty($companyName)) {
            $cacheKey = "reg_{$companyName}";
            if (! array_key_exists($cacheKey, self::$companyMemoryCache)) {
                self::$companyMemoryCache[$cacheKey] = \App\Models\Company::where('name', $companyName)->value('region_name');
            }
            return self::$companyMemoryCache[$cacheKey];
        }

        return null;
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function companyGroup(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function jobPosition(): BelongsTo
    {
        return $this->belongsTo(JobTitle::class, 'job_position_id');
    }

    public function jobTitle(): BelongsTo
    {
        return $this->belongsTo(JobTitle::class, 'job_position_id');
    }

    public function jobLevel(): BelongsTo
    {
        return $this->belongsTo(JobLevel::class, 'job_level_id');
    }

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
        $name  = $this->name ?? '';
        $words = explode(' ', trim($name));
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
        }
        return strtoupper(substr($name, 0, 2));
    }

    public function contractFilterTemplate()
    {
        return $this->belongsTo(ContractFilterTemplate::class, 'contract_filter_template_id');
    }

    private ?array $contractFilterSettingsCache = null;

    public function getContractFilterSettings(): array
    {
        if ($this->contractFilterSettingsCache !== null) {
            return $this->contractFilterSettingsCache;
        }

        $templateId = $this->getAttributeFromArray('contract_filter_template_id');

        if ($templateId) {
            if (! isset(self::$templateMemoryCache[$templateId])) {
                self::$templateMemoryCache[$templateId] = ContractFilterTemplate::find($templateId);
            }
            $template = self::$templateMemoryCache[$templateId];
            if ($template) {
                $this->contractFilterSettingsCache = [
                    'can_change_company_group' => (bool) $template->can_change_company_group,
                    'allowed_company_groups'   => (array) ($template->allowed_company_groups ?? []),
                    'can_change_region'        => (bool) $template->can_change_region,
                    'allowed_regions'          => (array) ($template->allowed_regions ?? []),
                    'can_change_company'       => (bool) $template->can_change_company,
                    'allowed_companies'        => (array) ($template->allowed_companies ?? []),
                    'can_change_division'      => (bool) $template->can_change_division,
                    'allowed_divisions'        => (array) ($template->allowed_divisions ?? []),
                    'can_change_department'    => (bool) $template->can_change_department,
                    'allowed_departments'      => (array) ($template->allowed_departments ?? []),
                ];
                return $this->contractFilterSettingsCache;
            }
        }

        // Fallback default berdasarkan nama role
        $roleName    = $this->role;
        $isHighLevel = in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);

        $this->contractFilterSettingsCache = [
            'can_change_company_group' => $isHighLevel,
            'allowed_company_groups'   => [],
            'can_change_region'        => $isHighLevel,
            'allowed_regions'          => [],
            'can_change_company'       => $isHighLevel,
            'allowed_companies'        => [],
            'can_change_division'      => $isHighLevel || in_array($roleName, ['Manager']),
            'allowed_divisions'        => [],
            'can_change_department'    => $isHighLevel || in_array($roleName, ['Manager']),
            'allowed_departments'      => [],
        ];

        return $this->contractFilterSettingsCache;
    }

    // Getters delegasi ke getContractFilterSettings()
    public function getCanChangeCompanyGroupAttribute() { return $this->getContractFilterSettings()['can_change_company_group'] ?? false; }
    public function setCanChangeCompanyGroupAttribute($v) { /* no-op — dikelola via template */ }

    public function getAllowedCompanyGroupsAttribute() { return $this->getContractFilterSettings()['allowed_company_groups'] ?? []; }
    public function setAllowedCompanyGroupsAttribute($v) { /* no-op */ }

    public function getCanChangeRegionAttribute() { return $this->getContractFilterSettings()['can_change_region'] ?? false; }
    public function setCanChangeRegionAttribute($v) { /* no-op */ }

    public function getAllowedRegionsAttribute() { return $this->getContractFilterSettings()['allowed_regions'] ?? []; }
    public function setAllowedRegionsAttribute($v) { /* no-op */ }

    public function getCanChangeCompanyAttribute() { return $this->getContractFilterSettings()['can_change_company'] ?? false; }
    public function setCanChangeCompanyAttribute($v) { /* no-op */ }

    public function getAllowedCompaniesAttribute() { return $this->getContractFilterSettings()['allowed_companies'] ?? []; }
    public function setAllowedCompaniesAttribute($v) { /* no-op */ }

    public function getCanChangeDivisionAttribute() { return $this->getContractFilterSettings()['can_change_division'] ?? false; }
    public function setCanChangeDivisionAttribute($v) { /* no-op */ }

    public function getAllowedDivisionsAttribute() { return $this->getContractFilterSettings()['allowed_divisions'] ?? []; }
    public function setAllowedDivisionsAttribute($v) { /* no-op */ }

    public function getCanChangeDepartmentAttribute() { return $this->getContractFilterSettings()['can_change_department'] ?? false; }
    public function setCanChangeDepartmentAttribute($v) { /* no-op */ }

    public function getAllowedDepartmentsAttribute() { return $this->getContractFilterSettings()['allowed_departments'] ?? []; }
    public function setAllowedDepartmentsAttribute($v) { /* no-op */ }
}
