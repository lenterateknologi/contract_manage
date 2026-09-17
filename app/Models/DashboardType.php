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
        'role_id',
        'role_ids',
        'division_id',
        'division_ids',
        'department_id',
        'department_ids',
        'contract_type_ids',
        'categories',
        'scope_to_user_division',
        'scope_to_user_department',
        'scope_to_user_company',
        'scope_to_user_company_group',
        'scope_to_user_region',
        'company_group_ids',
        'region_ids',
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
        'role_ids' => 'array',
        'division_ids' => 'array',
        'department_ids' => 'array',
        'contract_type_ids' => 'array',
        'categories' => 'array',
        'scope_to_user_division' => 'boolean',
        'scope_to_user_department' => 'boolean',
        'scope_to_user_company' => 'boolean',
        'scope_to_user_company_group' => 'boolean',
        'scope_to_user_region' => 'boolean',
        'company_group_ids' => 'array',
        'region_ids' => 'array',
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
            return '- (Semua Role)';
        }

        return Role::whereIn('id', $ids)->pluck('name')->join(', ') ?: '- (Semua Role)';
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
            return '- (Semua Divisi)';
        }

        return Division::whereIn('id', $ids)->pluck('name')->join(', ') ?: '- (Semua Divisi)';
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
            return '- (Semua Departemen)';
        }

        return Department::whereIn('id', $ids)->pluck('name')->join(', ') ?: '- (Semua Departemen)';
    }

    public function getContractTypeNamesAttribute(): string
    {
        $raw = $this->contract_type_ids ?? $this->getAttributeFromArray('contract_type_ids');
        $ids = $this->normalizeIds($raw);

        if (empty($ids)) {
            return '- (Semua Tipe Kontrak)';
        }

        return ContractType::whereIn('id', $ids)->pluck('name')->join(', ') ?: '- (Semua Tipe Kontrak)';
    }

    public function getUsersCountAttribute(): int
    {
        $roleIds = self::normalizeIds($this->role_ids ?? ($this->attributes['role_ids'] ?? null));
        if (array_key_exists('role_id', $this->attributes) && ! empty($this->attributes['role_id']) && ! in_array($this->attributes['role_id'], $roleIds)) {
            $roleIds[] = $this->attributes['role_id'];
        }

        $divIds = self::normalizeIds($this->division_ids ?? ($this->attributes['division_ids'] ?? null));
        if (array_key_exists('division_id', $this->attributes) && ! empty($this->attributes['division_id']) && ! in_array($this->attributes['division_id'], $divIds)) {
            $divIds[] = $this->attributes['division_id'];
        }

        $deptIds = self::normalizeIds($this->department_ids ?? ($this->attributes['department_ids'] ?? null));
        if (array_key_exists('department_id', $this->attributes) && ! empty($this->attributes['department_id']) && ! in_array($this->attributes['department_id'], $deptIds)) {
            $deptIds[] = $this->attributes['department_id'];
        }

        $query = User::query();

        if (! empty($roleIds)) {
            $query->whereIn('role_id', $roleIds);
        }

        if (! empty($divIds) && ! $this->scope_to_user_division) {
            $query->whereIn('division_id', $divIds);
        }

        if (! empty($deptIds) && ! $this->scope_to_user_department) {
            $query->whereIn('department_id', $deptIds);
        }

        return $query->count();
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
     * Evaluates specificity in order: Specific Role + Div/Dept -> Specific Role -> Role Fallback -> Global.
     */
    public static function resolveForUser(?User $user): ?self
    {
        if (! $user) {
            return self::first();
        }

        $all = self::all();
        if ($all->isEmpty()) {
            return null;
        }

        $userRoleId = $user->role_id;
        $userDivId = $user->division_id;
        $userDeptId = $user->department_id;
        $userJobLevelId = $user->job_level_id;
        $userJobTitleId = $user->job_position_id;

        $bestMatch = null;
        $highestScore = -1;

        foreach ($all as $item) {
            $score = 0;
            $matches = true;

            $roleIds = self::normalizeIds($item->role_ids);
            if (! empty($roleIds)) {
                if ($userRoleId && in_array($userRoleId, $roleIds)) {
                    $score += 10;
                } else {
                    $matches = false;
                }
            }

            $levelIds = self::normalizeIds($item->job_level_ids);
            if (! empty($levelIds)) {
                if ($userJobLevelId && in_array($userJobLevelId, $levelIds)) {
                    $score += 8;
                } else {
                    $matches = false;
                }
            }

            $titleIds = self::normalizeIds($item->job_title_ids);
            if (! empty($titleIds)) {
                if ($userJobTitleId && in_array($userJobTitleId, $titleIds)) {
                    $score += 6;
                } else {
                    $matches = false;
                }
            }

            $divIds = self::normalizeIds($item->division_ids);
            if (! empty($divIds) && ! $item->scope_to_user_division) {
                if ($userDivId && in_array($userDivId, $divIds)) {
                    $score += 5;
                } else {
                    $matches = false;
                }
            }

            $deptIds = self::normalizeIds($item->department_ids);
            if (! empty($deptIds) && ! $item->scope_to_user_department) {
                if ($userDeptId && in_array($userDeptId, $deptIds)) {
                    $score += 4;
                } else {
                    $matches = false;
                }
            }

            if ($matches && $score > $highestScore) {
                $highestScore = $score;
                $bestMatch = $item;
            }
        }

        return $bestMatch ?: $all->first();
    }

    /**
     * Returns unified filtering policy settings compatible with ContractFilterScopeService.
     */
    public function getFilterSettings(?User $user = null): array
    {
        return [
            'can_change_company_group' => ! $this->scope_to_user_company_group && empty($this->company_group_ids),
            'allowed_company_groups' => self::normalizeIds($this->company_group_ids),
            'can_change_region' => ! $this->scope_to_user_region && empty($this->region_ids),
            'allowed_regions' => self::normalizeIds($this->region_ids),
            'can_change_company' => ! $this->scope_to_user_company && empty($this->company_ids),
            'allowed_companies' => self::normalizeIds($this->company_ids),
            'can_change_division' => ! $this->scope_to_user_division && empty($this->division_ids),
            'allowed_divisions' => self::normalizeIds($this->division_ids),
            'can_change_department' => ! $this->scope_to_user_department && empty($this->department_ids),
            'allowed_departments' => self::normalizeIds($this->department_ids),
            'contract_type_ids' => self::normalizeIds($this->contract_type_ids),
            'categories' => self::normalizeIds($this->categories),
        ];
    }
}
