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
        'show_overview',
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
        'show_overview' => 'boolean',
        'show_workload' => 'boolean',
        'show_master_data' => 'boolean',
    ];

    protected $appends = [
        'role_names',
        'division_names',
        'department_names',
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

        // Only fallback to single role_id if role_ids column is completely null and single role_id is present
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
        $raw = $this->division_ids ?? $this->getAttributeFromArray('division_ids');
        $ids = $this->normalizeIds($raw);

        // Only fallback to single division_id if division_ids column is completely null and single division_id is present
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
        $raw = $this->department_ids ?? $this->getAttributeFromArray('department_ids');
        $ids = $this->normalizeIds($raw);

        // Only fallback to single department_id if department_ids column is completely null and single department_id is present
        if ($raw === null && array_key_exists('department_id', $this->attributes) && ! empty($this->attributes['department_id'])) {
            $ids = [$this->attributes['department_id']];
        }

        if (empty($ids)) {
            return '- (Semua Departemen)';
        }

        return Department::whereIn('id', $ids)->pluck('name')->join(', ') ?: '- (Semua Departemen)';
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
}
