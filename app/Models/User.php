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
        'dashboard_type_id',
        'idorganization',
        'org_name',
        'department_id',
        'division_id',
        'business_unit_id',
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

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'initials',
        'role',
        'role_name',
        'can_create_on_behalf',
        'division_name',
        'department_name',
        'org_group_name',
        'company_group_name',
        'company_group_code',
        'region_name',
        'location_name',
        'supervisor_name',
        'supervisor_job_title',
        'supervisor_job_level',
    ];

    protected static function booted(): void
    {
        // ponytail: sync company, location, group, and region from master business unit & location
        static::saving(function ($user) {
            if ($user->isDirty('company_id') && ! empty($user->company_id)) {
                $comp = Company::find($user->company_id);
                if ($comp) {
                    $user->idcompany = $comp->idcompany;
                    $user->company_name = $comp->name;
                    $user->company_group_id = $comp->company_group_id ?? $user->company_group_id;
                    $user->region_id = $comp->region_id ?? $user->region_id;
                }
            } elseif ($user->isDirty('location_id') && ! empty($user->location_id)) {
                $loc = Location::find($user->location_id);
                if ($loc) {
                    $user->idlocation = $loc->idlocation;
                    $user->location_name = $loc->name;

                    $bu = BusinessUnit::where('location_id', $loc->id)
                        ->orWhere('idlocation', $loc->idlocation)
                        ->whereNotNull('company_name')
                        ->first();

                    if ($bu) {
                        $user->business_unit_id = $bu->id;
                        $user->company_id = $bu->company_id;
                        $user->idcompany = $bu->idcompany;
                        $user->company_name = $bu->company_name;
                        $user->company_group_id = $bu->company_group_id;
                        $user->region_id = $bu->region_id;
                    } elseif ($loc->company_group_id) {
                        $user->company_group_id = $loc->company_group_id;
                    }
                }
            } elseif ($user->isDirty('business_unit_id') && ! empty($user->business_unit_id)) {
                $bu = BusinessUnit::find($user->business_unit_id);
                if ($bu) {
                    $user->company_id = $bu->company_id;
                    $user->idcompany = $bu->idcompany;
                    $user->company_name = $bu->company_name;
                    $user->location_id = $bu->location_id;
                    $user->idlocation = $bu->idlocation;
                    $user->location_name = $bu->location_name;
                    $user->company_group_id = $bu->company_group_id;
                    $user->region_id = $bu->region_id;
                }
            } elseif ($user->isDirty('company_name') && ! empty($user->company_name)) {
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

            // ponytail: auto-sync job level and names when job_position_id is updated/created
            if ($user->isDirty('job_position_id') && ! empty($user->job_position_id)) {
                $jobTitle = JobTitle::with('jobLevel')->find($user->job_position_id);
                if ($jobTitle) {
                    $user->idjobtitle = $jobTitle->idjobtitle;
                    $user->jobtitle_name = $jobTitle->name;
                    $user->job_level_id = $jobTitle->job_level_id;
                    $user->idjoblevel = $jobTitle->idjoblevel;
                    $user->joblevel_name = $jobTitle->jobLevel?->name ?? $jobTitle->getRawOriginal('job_level_name');
                }
            }

            // ponytail: auto-sync org_name and idorganization when department_id is updated/created
            if ($user->isDirty('department_id')) {
                if (! empty($user->department_id)) {
                    $dept = Department::find($user->department_id);
                    if ($dept) {
                        $user->idorganization = $dept->idorganization ?? $user->idorganization;
                        $user->org_name = $dept->name;
                    }
                } else {
                    $user->org_name = null;
                }
            }
        });

        static::saved(function () {
            \Illuminate\Support\Facades\Cache::forget('admin_members_tree_users_v2');
        });

        static::deleted(function () {
            \Illuminate\Support\Facades\Cache::forget('admin_members_tree_users_v2');
        });
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function roleRelation(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function dashboardType(): BelongsTo
    {
        return $this->belongsTo(DashboardType::class, 'dashboard_type_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    private static array $roleMemoryCache = [];
    private static array $divisionMemoryCache = [];
    private static array $departmentMemoryCache = [];

    public function getRoleAttribute(): ?string
    {
        if ($this->relationLoaded('roleRelation')) {
            return $this->getRelation('roleRelation')?->name;
        }

        $roleId = $this->attributes['role_id'] ?? null;
        if (! empty($roleId)) {
            if (! array_key_exists($roleId, self::$roleMemoryCache)) {
                self::$roleMemoryCache[$roleId] = Role::find($roleId)?->name;
            }

            return self::$roleMemoryCache[$roleId];
        }

        return null;
    }

    public function getRoleNameAttribute(): ?string
    {
        return $this->getRoleAttribute();
    }

    public function getDivisionNameAttribute(): ?string
    {
        if ($this->relationLoaded('division')) {
            $division = $this->getRelation('division');
            if ($division && array_key_exists('name', $division->getAttributes())) {
                return $division->getAttributes()['name'];
            }
        }

        $divisionId = $this->attributes['division_id'] ?? null;
        if (! empty($divisionId)) {
            if (! array_key_exists($divisionId, self::$divisionMemoryCache)) {
                self::$divisionMemoryCache[$divisionId] = Division::find($divisionId)?->name;
            }

            return self::$divisionMemoryCache[$divisionId];
        }

        return null;
    }

    public function getDepartmentNameAttribute(): ?string
    {
        if ($this->relationLoaded('department')) {
            $department = $this->getRelation('department');
            if ($department && array_key_exists('name', $department->getAttributes())) {
                return $department->getAttributes()['name'];
            }
        }

        $departmentId = $this->attributes['department_id'] ?? null;
        if (! empty($departmentId)) {
            if (! array_key_exists($departmentId, self::$departmentMemoryCache)) {
                self::$departmentMemoryCache[$departmentId] = Department::find($departmentId)?->name;
            }

            return self::$departmentMemoryCache[$departmentId];
        }

        return $this->attributes['org_name'] ?? null;
    }

    private static array $departmentOrgGroupMemoryCache = [];

    public function getOrgGroupNameAttribute(): ?string
    {
        if ($this->relationLoaded('department')) {
            $department = $this->getRelation('department');
            if ($department && array_key_exists('org_group_name', $department->getAttributes())) {
                return $department->getAttributes()['org_group_name'];
            }
        }

        $departmentId = $this->attributes['department_id'] ?? null;
        if (! empty($departmentId)) {
            if (! array_key_exists($departmentId, self::$departmentOrgGroupMemoryCache)) {
                self::$departmentOrgGroupMemoryCache[$departmentId] = Department::find($departmentId)?->org_group_name;
            }

            return self::$departmentOrgGroupMemoryCache[$departmentId];
        }

        return null;
    }

    private static array $companyGroupMemoryCache = [];

    private static array $companyMemoryCache = [];

    private static array $regionMemoryCache = [];

    private static array $templateMemoryCache = [];

    public function getCompanyGroupIdAttribute(): ?string
    {
        if (array_key_exists('company_group_id', $this->attributes)) {
            return $this->attributes['company_group_id'];
        }

        if ($this->relationLoaded('company') && $this->getRelation('company')) {
            return $this->getRelation('company')->company_group_id;
        }

        if ($this->relationLoaded('businessUnit') && $this->getRelation('businessUnit')) {
            return $this->getRelation('businessUnit')->company_group_id;
        }

        $companyId = $this->attributes['company_id'] ?? null;
        if (! empty($companyId)) {
            return Company::where('id', $companyId)->value('company_group_id');
        }

        return null;
    }

    public function setCompanyGroupIdAttribute($value): void
    {
        // No-op as company_group_id is derived from company/location/businessUnit
    }

    public function getCompanyGroupNameAttribute(): ?string
    {
        if ($this->relationLoaded('companyGroup') && $this->getRelation('companyGroup')) {
            return $this->getRelation('companyGroup')->name;
        }

        if ($this->relationLoaded('company')) {
            $company = $this->getRelation('company');
            if ($company && array_key_exists('company_group_name', $company->getAttributes())) {
                return $company->getAttributes()['company_group_name'];
            }
        }

        $companyGroupId = $this->attributes['company_group_id'] ?? null;
        if (! empty($companyGroupId)) {
            if (! array_key_exists($companyGroupId, self::$companyGroupMemoryCache)) {
                self::$companyGroupMemoryCache[$companyGroupId] = CompanyGroup::find($companyGroupId)?->name;
            }

            return self::$companyGroupMemoryCache[$companyGroupId];
        }

        $companyName = $this->attributes['company_name'] ?? null;
        if (! empty($companyName)) {
            if (! array_key_exists($companyName, self::$companyMemoryCache)) {
                self::$companyMemoryCache[$companyName] = Company::where('name', $companyName)->value('company_group_name');
            }

            return self::$companyMemoryCache[$companyName];
        }

        return null;
    }

    public function getCompanyGroupCodeAttribute(): ?string
    {
        if ($this->relationLoaded('companyGroup') && $this->getRelation('companyGroup')) {
            return $this->getRelation('companyGroup')->code;
        }

        $companyGroupId = $this->attributes['company_group_id'] ?? null;
        if (! empty($companyGroupId)) {
            $cacheKey = "code_{$companyGroupId}";
            if (! array_key_exists($cacheKey, self::$companyGroupMemoryCache)) {
                self::$companyGroupMemoryCache[$cacheKey] = CompanyGroup::find($companyGroupId)?->code;
            }

            return self::$companyGroupMemoryCache[$cacheKey];
        }

        if ($this->relationLoaded('company')) {
            $company = $this->getRelation('company');
            if ($company) {
                if (array_key_exists('company_group_code', $company->getAttributes()) && ! empty($company->getAttributes()['company_group_code'])) {
                    return $company->getAttributes()['company_group_code'];
                }
                if ($company->relationLoaded('group') && $company->getRelation('group')) {
                    return $company->getRelation('group')->code;
                }
                if ($company->relationLoaded('companyGroup') && $company->getRelation('companyGroup')) {
                    return $company->getRelation('companyGroup')->code;
                }
                $groupId = $company->getAttributes()['company_group_id'] ?? null;
                if (! empty($groupId)) {
                    $cacheKey = "code_{$groupId}";
                    if (! array_key_exists($cacheKey, self::$companyGroupMemoryCache)) {
                        self::$companyGroupMemoryCache[$cacheKey] = CompanyGroup::find($groupId)?->code;
                    }

                    return self::$companyGroupMemoryCache[$cacheKey];
                }
            }
        }

        return null;
    }

    public function getRegionIdAttribute(): ?string
    {
        if (array_key_exists('region_id', $this->attributes)) {
            return $this->attributes['region_id'];
        }

        if ($this->relationLoaded('company') && $this->getRelation('company')) {
            return $this->getRelation('company')->region_id;
        }

        $companyId = $this->attributes['company_id'] ?? null;
        if (! empty($companyId)) {
            return Company::where('id', $companyId)->value('region_id');
        }

        return null;
    }

    public function setRegionIdAttribute($value): void
    {
        // No-op as region is derived via company relationship
    }

    public function getRegionNameAttribute(): ?string
    {
        if ($this->relationLoaded('region') && $this->getRelation('region')) {
            return $this->getRelation('region')->name;
        }

        if ($this->relationLoaded('company')) {
            $company = $this->getRelation('company');
            if ($company && array_key_exists('region_name', $company->getAttributes())) {
                return $company->getAttributes()['region_name'];
            }
        }

        $regionId = $this->region_id;
        if (! empty($regionId)) {
            if (! array_key_exists($regionId, self::$regionMemoryCache)) {
                self::$regionMemoryCache[$regionId] = Region::find($regionId)?->name;
            }

            return self::$regionMemoryCache[$regionId];
        }

        $companyName = $this->attributes['company_name'] ?? null;
        if (! empty($companyName)) {
            $cacheKey = "reg_{$companyName}";
            if (! array_key_exists($cacheKey, self::$companyMemoryCache)) {
                self::$companyMemoryCache[$cacheKey] = Company::where('name', $companyName)->value('region_name');
            }

            return self::$companyMemoryCache[$cacheKey];
        }

        return null;
    }

    private static array $locationMemoryCache = [];

    public function getLocationNameAttribute(): ?string
    {
        if ($this->relationLoaded('location') && $this->getRelation('location')) {
            return $this->getRelation('location')->name;
        }

        $locationId = $this->attributes['location_id'] ?? null;
        if (! empty($locationId)) {
            if (! array_key_exists($locationId, self::$locationMemoryCache)) {
                self::$locationMemoryCache[$locationId] = Location::find($locationId)?->name;
            }

            return self::$locationMemoryCache[$locationId];
        }

        return $this->attributes['location_name'] ?? null;
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

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'spv_id');
    }

    public function reportingTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'idreporting_to', 'idemployee');
    }

    public function getSupervisorNameAttribute(): ?string
    {
        $raw = $this->attributes['reporting_to'] ?? null;
        if (! empty($raw)) {
            return $raw;
        }

        if ($this->relationLoaded('reportingTo') && $this->getRelation('reportingTo')) {
            return $this->getRelation('reportingTo')->name;
        }

        if ($this->relationLoaded('supervisor') && $this->getRelation('supervisor')) {
            return $this->getRelation('supervisor')->name;
        }

        return null;
    }

    public function getSupervisorJobTitleAttribute(): ?string
    {
        if ($this->relationLoaded('reportingTo') && $this->getRelation('reportingTo')) {
            return $this->getRelation('reportingTo')->jobtitle_name;
        }

        if ($this->relationLoaded('supervisor') && $this->getRelation('supervisor')) {
            return $this->getRelation('supervisor')->jobtitle_name;
        }

        return null;
    }

    public function getSupervisorJobLevelAttribute(): ?string
    {
        if ($this->relationLoaded('reportingTo') && $this->getRelation('reportingTo')) {
            return $this->getRelation('reportingTo')->joblevel_name;
        }

        if ($this->relationLoaded('supervisor') && $this->getRelation('supervisor')) {
            return $this->getRelation('supervisor')->joblevel_name;
        }

        return null;
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

    public function getCanCreateOnBehalfAttribute(): bool
    {
        if ($this->isAdmin() || $this->isSuperAdmin()) {
            return true;
        }

        return Authority::checkUserAllowedOnBehalf($this);
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

    private ?array $contractFilterSettingsCache = null;

    public function getContractFilterSettings(): array
    {
        if ($this->contractFilterSettingsCache !== null) {
            return $this->contractFilterSettingsCache;
        }

        $dashboardType = null;
        if (! empty($this->dashboard_type_id)) {
            $dashboardType = DashboardType::find($this->dashboard_type_id);
        }

        if (! $dashboardType) {
            $dashboardType = DashboardType::resolveForUser($this);
        }

        if ($dashboardType) {
            $this->contractFilterSettingsCache = $dashboardType->getFilterSettings($this);

            return $this->contractFilterSettingsCache;
        }

        // Fallback default jika belum ada konfigurasi DashboardType sama sekali
        $roleName = $this->role;
        $isHighLevel = in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);

        $this->contractFilterSettingsCache = [
            'can_change_company_group' => $isHighLevel,
            'allowed_company_groups' => [],
            'can_change_region' => $isHighLevel,
            'allowed_regions' => [],
            'can_change_company' => $isHighLevel,
            'allowed_companies' => [],
            'can_change_division' => $isHighLevel,
            'allowed_divisions' => [],
            'can_change_department' => $isHighLevel,
            'allowed_departments' => [],
            'contract_type_ids' => [],
            'categories' => [],
        ];

        return $this->contractFilterSettingsCache;
    }

    // Getters delegasi ke getContractFilterSettings()
    public function getCanChangeCompanyGroupAttribute()
    {
        return $this->getContractFilterSettings()['can_change_company_group'] ?? false;
    }

    public function setCanChangeCompanyGroupAttribute($v)
    { /* no-op — dikelola via template */
    }

    public function getAllowedCompanyGroupsAttribute()
    {
        return $this->getContractFilterSettings()['allowed_company_groups'] ?? [];
    }

    public function setAllowedCompanyGroupsAttribute($v)
    { /* no-op */
    }

    public function getCanChangeRegionAttribute()
    {
        return $this->getContractFilterSettings()['can_change_region'] ?? false;
    }

    public function setCanChangeRegionAttribute($v)
    { /* no-op */
    }

    public function getAllowedRegionsAttribute()
    {
        return $this->getContractFilterSettings()['allowed_regions'] ?? [];
    }

    public function setAllowedRegionsAttribute($v)
    { /* no-op */
    }

    public function getCanChangeCompanyAttribute()
    {
        return $this->getContractFilterSettings()['can_change_company'] ?? false;
    }

    public function setCanChangeCompanyAttribute($v)
    { /* no-op */
    }

    public function getAllowedCompaniesAttribute()
    {
        return $this->getContractFilterSettings()['allowed_companies'] ?? [];
    }

    public function setAllowedCompaniesAttribute($v)
    { /* no-op */
    }

    public function getCanChangeDivisionAttribute()
    {
        return $this->getContractFilterSettings()['can_change_division'] ?? false;
    }

    public function setCanChangeDivisionAttribute($v)
    { /* no-op */
    }

    public function getAllowedDivisionsAttribute()
    {
        return $this->getContractFilterSettings()['allowed_divisions'] ?? [];
    }

    public function setAllowedDivisionsAttribute($v)
    { /* no-op */
    }

    public function getCanChangeDepartmentAttribute()
    {
        return $this->getContractFilterSettings()['can_change_department'] ?? false;
    }

    public function setCanChangeDepartmentAttribute($v)
    { /* no-op */
    }

    public function getAllowedDepartmentsAttribute()
    {
        return $this->getContractFilterSettings()['allowed_departments'] ?? [];
    }

    public function setAllowedDepartmentsAttribute($v)
    { /* no-op */
    }
}
