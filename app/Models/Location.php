<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_locations';

    protected $fillable = [
        'idlocation',
        'code',
        'name',
        'company_group_id',
        'company_group_name',
        'idcompany_group',
        'idlocation_group',
        'location_group_name',
        'phone',
        'fax',
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
        'oracle_code',
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

    public function group()
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    public function companyGroup()
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    public function businessUnits()
    {
        return $this->hasMany(BusinessUnit::class, 'location_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'location_id');
    }
}
