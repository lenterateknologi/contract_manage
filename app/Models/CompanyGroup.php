<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CompanyGroup extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_company_groups';

    protected $fillable = [
        'idcompany_group',
        'code',
        'name',
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

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class, 'company_group_id');
    }

    public function businessUnits(): HasMany
    {
        return $this->hasMany(BusinessUnit::class, 'company_group_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'company_group_id');
    }
}
