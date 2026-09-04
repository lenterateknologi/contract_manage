<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Region extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_regions';

    protected $fillable = [
        'idregion',
        'code',
        'name',
        'alias',
        'region_ad',
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

    /**
     * @return HasMany<Company, Region>
     */
    public function companies(): HasMany
    {
        return $this->hasMany(Company::class, 'region_id');
    }

    public function businessUnits(): HasMany
    {
        return $this->hasMany(BusinessUnit::class, 'region_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'region_id');
    }
}
