<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_companies';

    protected $fillable = [
        'idcompany',
        'code',
        'name',
        'alias',
        'npwp',
        'idcompany_group',
        'company_group_name',
        'company_group_id',
        'idcountry',
        'country_name',
        'idprovince',
        'province_name',
        'idcity',
        'city_name',
        'idsub_district',
        'sub_district_name',
        'idvillage',
        'village_name',
        'address',
        'zip_code',
        'phone',
        'fax',
        'email',
        'oracle_code',
        'idregion',
        'region_name',
        'region_id',
        'reg_no',
        'bank_account',
        'npp',
        'created_by_name',
        'modified_by_name',
        'portal_created_date',
        'portal_modified_date',
        'is_used',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_used' => 'boolean',
        'portal_created_date' => 'datetime',
        'portal_modified_date' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    public function companyGroup(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'company_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'company_id');
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class, 'company_id');
    }
}
