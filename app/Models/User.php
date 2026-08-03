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
        'contract_filter_template_id',
        'is_employee',
        'id_employee_portal_master',
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

        // Coba ambil dari template — aman saat user di-load sebagai partial relation
        $templateId = null;
        if (array_key_exists('contract_filter_template_id', $this->attributes)) {
            $templateId = $this->attributes['contract_filter_template_id'];
        } elseif ($this->relationLoaded('contractFilterTemplate')) {
            $templateId = $this->contractFilterTemplate?->id;
        }

        if ($templateId) {
            $template = ContractFilterTemplate::find($templateId);
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
