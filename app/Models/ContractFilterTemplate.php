<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Casts\Attribute;

class ContractFilterTemplate extends Model
{
    use SoftDeletes;

    protected $table = 'm_contract_filter_templates';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
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

    protected $appends = [
        'company_group_status',
        'region_status',
        'company_status',
        'division_status',
        'department_status',
    ];

    // Returns: null = "Sesuai Data User", [] = "Semua", [name,…] = list of names
    private function resolveStatus(bool $canChange, string $column): mixed
    {
        if (!$canChange) {
            return null; // "Sesuai Data User"
        }
        $raw = $this->getRawAllowed($column);
        if (empty($raw)) {
            return []; // "Semua"
        }
        return collect($raw)->pluck('name')->toArray();
    }

    private function getRawAllowed(string $column): array
    {
        $raw = $this->getAttributes()[$column] ?? '[]';
        if (is_string($raw)) {
            return json_decode($raw, true) ?: [];
        }
        return is_array($raw) ? $raw : [];
    }

    private function parseIds(mixed $value): array
    {
        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($decoded)) {
            return [];
        }
        return array_map(function ($item) {
            return is_array($item) ? ($item['id'] ?? '') : (string) $item;
        }, $decoded);
    }

    private function formatJson(mixed $value, string $modelClass): array
    {
        if (empty($value)) {
            return [];
        }
        if (is_string($value)) {
            $value = json_decode($value, true) ?: [$value];
        }
        if (!is_array($value)) {
            $value = [$value];
        }

        $ids = [];
        $existing = [];
        foreach ($value as $item) {
            if (is_array($item)) {
                if (isset($item['id'])) {
                    $ids[] = $item['id'];
                    $existing[$item['id']] = $item;
                }
            } else {
                $ids[] = (string) $item;
            }
        }

        if (empty($ids)) {
            return [];
        }

        $dbRecords = $modelClass::whereIn('id', $ids)->get(['id', 'name'])->keyBy('id');

        $result = [];
        foreach ($ids as $id) {
            if (isset($dbRecords[$id])) {
                $result[] = [
                    'id' => $id,
                    'name' => $dbRecords[$id]->name,
                ];
            } elseif (isset($existing[$id])) {
                $result[] = [
                    'id' => $id,
                    'name' => $existing[$id]['name'] ?? $id,
                ];
            } else {
                $result[] = [
                    'id' => $id,
                    'name' => $id,
                ];
            }
        }

        return $result;
    }

    protected function allowedCompanyGroups(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->parseIds($value),
            set: fn ($value) => json_encode($this->formatJson($value, \App\Models\CompanyGroup::class)),
        );
    }

    protected function allowedRegions(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->parseIds($value),
            set: fn ($value) => json_encode($this->formatJson($value, \App\Models\Region::class)),
        );
    }

    protected function allowedCompanies(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->parseIds($value),
            set: fn ($value) => json_encode($this->formatJson($value, \App\Models\Company::class)),
        );
    }

    protected function allowedDivisions(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->parseIds($value),
            set: fn ($value) => json_encode($this->formatJson($value, \App\Models\Division::class)),
        );
    }

    protected function allowedDepartments(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->parseIds($value),
            set: fn ($value) => json_encode($this->formatJson($value, \App\Models\Department::class)),
        );
    }

    public function getCompanyGroupStatusAttribute(): mixed
    {
        return $this->resolveStatus(
            (bool) $this->can_change_company_group,
            'allowed_company_groups'
        );
    }

    public function getRegionStatusAttribute(): mixed
    {
        return $this->resolveStatus(
            (bool) $this->can_change_region,
            'allowed_regions'
        );
    }

    public function getCompanyStatusAttribute(): mixed
    {
        return $this->resolveStatus(
            (bool) $this->can_change_company,
            'allowed_companies'
        );
    }

    public function getDivisionStatusAttribute(): mixed
    {
        return $this->resolveStatus(
            (bool) $this->can_change_division,
            'allowed_divisions'
        );
    }

    public function getDepartmentStatusAttribute(): mixed
    {
        return $this->resolveStatus(
            (bool) $this->can_change_department,
            'allowed_departments'
        );
    }

    protected function casts(): array
    {
        return [
            'can_change_company_group' => 'boolean',
            'can_change_region'        => 'boolean',
            'can_change_company'       => 'boolean',
            'can_change_division'      => 'boolean',
            'can_change_department'    => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
