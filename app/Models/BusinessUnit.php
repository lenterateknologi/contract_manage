<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessUnit extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_business_units';

    protected $fillable = [
        'idbusiness_unit',
        'code',
        'name',
        'idcompany',
        'company_name',
        'company_oracle_code',
        'company_id',
        'idlocation',
        'location_name',
        'location_oracle_code',
        'location_id',
        'idcompany_group',
        'company_group_code',
        'company_group_name',
        'company_group_id',
        'idregion',
        'region_code',
        'region_name',
        'region_id',
        'idkomoditi',
        'komoditi_name',
        'kebun',
        'last_req_date',
        'rice_exclude',
        'is_downstream',
        'ktu',
        'kpp',
        'dppjamsostek',
        'latitude',
        'longitude',
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
        'last_req_date' => 'datetime',
        'portal_created_date' => 'datetime',
        'portal_modified_date' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'location_id', 'location_id');
    }
}
