<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Role extends Model
{
    protected $table = 'm_roles';

    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'company_id',
        'name',
        'description',
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

    protected $with = ['contractFilter'];

    protected $appends = [
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

    public function contractFilter()
    {
        return $this->hasOne(ContractFilterSetting::class, 'reference_id')->where('type', 'role');
    }

    public function getContractFilterSettings(): array
    {
        $filter = $this->contractFilter;
        if ($filter) {
            return [
                'can_change_company_group' => (bool) $filter->can_change_company_group,
                'allowed_company_groups' => $filter->getItemValues('company_group'),
                'can_change_region' => (bool) $filter->can_change_region,
                'allowed_regions' => $filter->getItemValues('region'),
                'can_change_company' => (bool) $filter->can_change_company,
                'allowed_companies' => $filter->getItemValues('company'),
                'can_change_division' => (bool) $filter->can_change_division,
                'allowed_divisions' => $filter->getItemValues('division'),
                'can_change_department' => (bool) $filter->can_change_department,
                'allowed_departments' => $filter->getItemValues('department'),
            ];
        }

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
            'type' => 'role',
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

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
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
