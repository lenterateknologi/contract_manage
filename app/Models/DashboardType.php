<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DashboardType extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_dashboard_types';

    protected $fillable = [
        'name',
        'description',
        'priority',
        'user_ids',
        'role_id',
        'role_ids',
        'division_id',
        'division_ids',
        'department_id',
        'department_ids',
        'org_group_ids',
        'contract_type_ids',
        'categories',
        'scope_to_user_division',
        'scope_to_user_department',
        'scope_to_user_company',
        'scope_to_user_company_group',
        'scope_to_user_region',
        'company_group_ids',
        'region_ids',
        'location_ids',
        'company_ids',
        'branch_ids',
        'business_unit_ids',
        'job_level_ids',
        'job_title_ids',
        'show_overview',
        'show_overview_contract',
        'show_overview_non_contract',
        'show_overview_nda',
        'show_workload',
        'show_master_data',
        'created_by',
        'updated_by',
    ];

    protected static function booted(): void
    {
        static::saving(function ($model) {
            // Keep single columns in sync with the multi-select array values
            if (is_array($model->role_ids)) {
                $clean = array_values(array_filter($model->role_ids, fn ($v) => ! empty($v)));
                $model->role_id = count($clean) === 1 ? $clean[0] : null;
            } elseif ($model->role_ids === null) {
                $model->role_id = null;
            }

            if (is_array($model->division_ids)) {
                $clean = array_values(array_filter($model->division_ids, fn ($v) => ! empty($v)));
                $model->division_id = count($clean) === 1 ? $clean[0] : null;
            } elseif ($model->division_ids === null) {
                $model->division_id = null;
            }

            if (is_array($model->department_ids)) {
                $clean = array_values(array_filter($model->department_ids, fn ($v) => ! empty($v)));
                $model->department_id = count($clean) === 1 ? $clean[0] : null;
            } elseif ($model->department_ids === null) {
                $model->department_id = null;
            }
        });
    }

    protected $casts = [
        'priority' => 'integer',
        'user_ids' => 'array',
        'role_ids' => 'array',
        'division_ids' => 'array',
        'department_ids' => 'array',
        'org_group_ids' => 'array',
        'contract_type_ids' => 'array',
        'categories' => 'array',
        'scope_to_user_division' => 'boolean',
        'scope_to_user_department' => 'boolean',
        'scope_to_user_company' => 'boolean',
        'scope_to_user_company_group' => 'boolean',
        'scope_to_user_region' => 'boolean',
        'company_group_ids' => 'array',
        'region_ids' => 'array',
        'location_ids' => 'array',
        'company_ids' => 'array',
        'branch_ids' => 'array',
        'business_unit_ids' => 'array',
        'job_level_ids' => 'array',
        'job_title_ids' => 'array',
        'show_overview' => 'boolean',
        'show_overview_contract' => 'boolean',
        'show_overview_non_contract' => 'boolean',
        'show_overview_nda' => 'boolean',
        'show_workload' => 'boolean',
        'show_master_data' => 'boolean',
    ];

    protected $appends = [
        'role_names',
        'division_names',
        'department_names',
        'org_group_names',
        'location_names',
        'contract_type_names',
        'users_count',
    ];

    public static function normalizeIds(mixed $val): array
    {
        if (is_string($val)) {
            $decoded = json_decode($val, true);
            if (is_array($decoded)) {
                return array_values(array_filter($decoded, fn ($v) => ! empty($v)));
            }
            return ! empty($val) ? [$val] : [];
        }
        if (is_array($val)) {
            return array_values(array_filter($val, fn ($v) => ! empty($v)));
        }
        return [];
    }

    public function getRoleNamesAttribute(): string
    {
        $raw = $this->role_ids ?? $this->getAttributeFromArray('role_ids');
        $ids = $this->normalizeIds($raw);

        if ($raw === null && array_key_exists('role_id', $this->attributes) && ! empty($this->attributes['role_id'])) {
            $ids = [$this->attributes['role_id']];
        }

        if (empty($ids)) {
            return '-';
        }

        return Role::whereIn('id', $ids)->pluck('name')->join(', ') ?: '-';
    }

    public function getDivisionNamesAttribute(): string
    {
        if ($this->scope_to_user_division) {
            return 'Sesuai Divisi User';
        }

        $raw = $this->division_ids ?? $this->getAttributeFromArray('division_ids');
        $ids = $this->normalizeIds($raw);

        if ($raw === null && array_key_exists('division_id', $this->attributes) && ! empty($this->attributes['division_id'])) {
            $ids = [$this->attributes['division_id']];
        }

        if (empty($ids)) {
            return '-';
        }

        return Division::whereIn('id', $ids)->pluck('name')->join(', ') ?: '-';
    }

    public function getDepartmentNamesAttribute(): string
    {
        if ($this->scope_to_user_department) {
            return 'Sesuai Departemen User';
        }

        $raw = $this->department_ids ?? $this->getAttributeFromArray('department_ids');
        $ids = $this->normalizeIds($raw);

        if ($raw === null && array_key_exists('department_id', $this->attributes) && ! empty($this->attributes['department_id'])) {
            $ids = [$this->attributes['department_id']];
        }

        if (empty($ids)) {
            return '-';
        }

        return Department::whereIn('id', $ids)->pluck('name')->join(', ') ?: '-';
    }

    public function getOrgGroupNamesAttribute(): string
    {
        $raw = $this->org_group_ids ?? $this->getAttributeFromArray('org_group_ids');
        $ids = $this->normalizeIds($raw);

        if (empty($ids)) {
            return '-';
        }

        return OrganizationGroup::whereIn('id', $ids)->pluck('name')->join(', ') ?: '-';
    }

    public function getLocationNamesAttribute(): string
    {
        $raw = $this->location_ids ?? $this->getAttributeFromArray('location_ids');
        $ids = $this->normalizeIds($raw);

        if (empty($ids)) {
            return '-';
        }

        return Location::whereIn('id', $ids)->pluck('name')->join(', ') ?: '-';
    }

    public function getContractTypeNamesAttribute(): string
    {
        $raw = $this->contract_type_ids ?? $this->getAttributeFromArray('contract_type_ids');
        $ids = $this->normalizeIds($raw);

        if (empty($ids)) {
            return '-';
        }

        return ContractType::whereIn('id', $ids)->pluck('name')->join(', ') ?: '-';
    }

    public function getUsersCountAttribute(): int
    {
        // 1. Check if linked via m_authorities table
        $authorities = Authority::where('context_type', Authority::CONTEXT_DASHBOARD_TYPE)
            ->where('context_id', $this->id)
            ->where('is_active', true)
            ->get();

        if ($authorities->isNotEmpty()) {
            return User::where('is_used', true)->get()->filter(function ($u) use ($authorities) {
                foreach ($authorities as $rule) {
                    if (Authority::ruleMatchesUser($rule, $u)) {
                        return true;
                    }
                }
                return false;
            })->count();
        }

        // 2. Direct columns fallback
        $userIds = self::normalizeIds($this->user_ids ?? ($this->attributes['user_ids'] ?? null));
        if (! empty($userIds)) {
            return User::whereIn('id', $userIds)->count();
        }

        $roleIds = self::normalizeIds($this->role_ids ?? ($this->attributes['role_ids'] ?? null));
        if (array_key_exists('role_id', $this->attributes) && ! empty($this->attributes['role_id']) && ! in_array($this->attributes['role_id'], $roleIds)) {
            $roleIds[] = $this->attributes['role_id'];
        }

        $jobLevelIds = self::normalizeIds($this->job_level_ids ?? ($this->attributes['job_level_ids'] ?? null));
        $jobTitleIds = self::normalizeIds($this->job_title_ids ?? ($this->attributes['job_title_ids'] ?? null));

        $divIds = self::normalizeIds($this->division_ids ?? ($this->attributes['division_ids'] ?? null));
        if (array_key_exists('division_id', $this->attributes) && ! empty($this->attributes['division_id']) && ! in_array($this->attributes['division_id'], $divIds)) {
            $divIds[] = $this->attributes['division_id'];
        }

        $deptIds = self::normalizeIds($this->department_ids ?? ($this->attributes['department_ids'] ?? null));
        if (array_key_exists('department_id', $this->attributes) && ! empty($this->attributes['department_id']) && ! in_array($this->attributes['department_id'], $deptIds)) {
            $deptIds[] = $this->attributes['department_id'];
        }

        // If no criteria specified at all, then 0 users have access
        if (empty($roleIds) && empty($jobLevelIds) && empty($jobTitleIds) && empty($divIds) && empty($deptIds)) {
            return 0;
        }

        $query = User::query()->where('is_used', true);

        if (! empty($roleIds)) {
            $query->whereIn('role_id', $roleIds);
        }

        if (! empty($jobLevelIds)) {
            $query->whereIn('job_level_id', $jobLevelIds);
        }

        if (! empty($jobTitleIds)) {
            $query->whereIn('job_position_id', $jobTitleIds);
        }

        if (! empty($divIds) && ! $this->scope_to_user_division) {
            $query->whereIn('division_id', $divIds);
        }

        if (! empty($deptIds) && ! $this->scope_to_user_department) {
            $query->whereIn('department_id', $deptIds);
        }

        return $query->count();
    }

    public function authorities(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Authority::class, 'context_id')->where('context_type', Authority::CONTEXT_DASHBOARD_TYPE);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Resolves the most specific DashboardType configuration profile for a given user.
     * Evaluates priority (Leveling: 1 is highest priority) then specificity score.
     */
    public static function resolveForUser(?User $user): ?self
    {
        if (! $user) {
            return self::orderBy('priority', 'asc')->first();
        }

        // Order by priority (1 = highest priority, fallback higher numbers)
        $all = self::orderBy('priority', 'asc')->get();
        if ($all->isEmpty()) {
            return null;
        }

        $userId = $user->id;
        $userRoleId = $user->role_id;
        $userDivId = $user->division_id;
        $userDeptId = $user->department_id;
        $userJobLevelId = $user->job_level_id;
        $userJobTitleId = $user->job_position_id;

        $bestMatch = null;
        $highestScore = -1;
        $bestPriority = PHP_INT_MAX;

        foreach ($all as $item) {
            $score = 0;
            $matches = false;
            $hasCriteria = false;

            // Check m_authorities first
            $itemAuthorities = Authority::where('context_type', Authority::CONTEXT_DASHBOARD_TYPE)
                ->where('context_id', $item->id)
                ->where('is_active', true)
                ->get();

            if ($itemAuthorities->isNotEmpty()) {
                $hasCriteria = true;
                foreach ($itemAuthorities as $rule) {
                    if (Authority::ruleMatchesUser($rule, $user)) {
                        $matches = true;
                        $score += 30;
                        break;
                    }
                }
            } else {
                // Check direct fields
                $isTargeted = false;
                $criteriaMatched = true;

                $userIds = self::normalizeIds($item->user_ids);
                if (! empty($userIds)) {
                    $hasCriteria = true;
                    $isTargeted = true;
                    if ($userId && in_array((string) $userId, array_map('strval', $userIds))) {
                        $score += 20;
                    } else {
                        $criteriaMatched = false;
                    }
                }

                $roleIds = self::normalizeIds($item->role_ids);
                if (! empty($roleIds)) {
                    $hasCriteria = true;
                    $isTargeted = true;
                    if ($userRoleId && in_array($userRoleId, $roleIds)) {
                        $score += 10;
                    } else {
                        $criteriaMatched = false;
                    }
                }

                $levelIds = self::normalizeIds($item->job_level_ids);
                if (! empty($levelIds)) {
                    $hasCriteria = true;
                    $isTargeted = true;
                    if ($userJobLevelId && in_array($userJobLevelId, $levelIds)) {
                        $score += 8;
                    } else {
                        $criteriaMatched = false;
                    }
                }

                $titleIds = self::normalizeIds($item->job_title_ids);
                if (! empty($titleIds)) {
                    $hasCriteria = true;
                    $isTargeted = true;
                    if ($userJobTitleId && in_array($userJobTitleId, $titleIds)) {
                        $score += 6;
                    } else {
                        $criteriaMatched = false;
                    }
                }

                $divIds = self::normalizeIds($item->division_ids);
                if (! empty($divIds) && ! $item->scope_to_user_division) {
                    $hasCriteria = true;
                    $isTargeted = true;
                    if ($userDivId && in_array($userDivId, $divIds)) {
                        $score += 5;
                    } else {
                        $criteriaMatched = false;
                    }
                }

                $deptIds = self::normalizeIds($item->department_ids);
                if (! empty($deptIds) && ! $item->scope_to_user_department) {
                    $hasCriteria = true;
                    $isTargeted = true;
                    if ($userDeptId && in_array($userDeptId, $deptIds)) {
                        $score += 4;
                    } else {
                        $criteriaMatched = false;
                    }
                }

                if ($isTargeted && $criteriaMatched) {
                    $matches = true;
                }
            }

            if ($matches) {
                $itemPriority = (int) ($item->priority ?? 10);
                // Lower priority number means higher precedence (Priority 1 > Priority 2 > Priority 10)
                if ($itemPriority < $bestPriority || ($itemPriority === $bestPriority && $score > $highestScore)) {
                    $bestPriority = $itemPriority;
                    $highestScore = $score;
                    $bestMatch = $item;
                }
            }
        }

        // If user matches a specific/leveled profile, return it. Otherwise return global default if any
        return $bestMatch ?: $all->first();
    }

    /**
     * Returns unified filtering policy settings compatible with ContractFilterScopeService.
     */
    public function getFilterSettings(?User $user = null): array
    {
        $allowedDepartments = self::normalizeIds($this->department_ids);
        $orgGroupIds = self::normalizeIds($this->org_group_ids);

        if (! empty($orgGroupIds)) {
            $idOrgGroups = OrganizationGroup::whereIn('id', $orgGroupIds)->pluck('idorg_group')->filter()->toArray();
            if (! empty($idOrgGroups)) {
                $depts = Department::whereIn('idorg_group', $idOrgGroups)->pluck('id')->toArray();
                $allowedDepartments = array_values(array_unique(array_merge($allowedDepartments, $depts)));
            }
        }

        return [
            'can_change_company_group' => false,
            'allowed_company_groups' => self::normalizeIds($this->company_group_ids),
            'can_change_region' => false,
            'allowed_regions' => self::normalizeIds($this->region_ids),
            'can_change_location' => false,
            'allowed_locations' => self::normalizeIds($this->location_ids),
            'can_change_company' => false,
            'allowed_companies' => self::normalizeIds($this->company_ids),
            'can_change_division' => false,
            'allowed_divisions' => self::normalizeIds($this->division_ids),
            'can_change_department' => false,
            'allowed_departments' => $allowedDepartments,
            'org_group_ids' => $orgGroupIds,
            'location_ids' => self::normalizeIds($this->location_ids),
            'contract_type_ids' => self::normalizeIds($this->contract_type_ids),
            'categories' => self::normalizeIds($this->categories),
        ];
    }
}
