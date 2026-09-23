<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationGroup extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_organization_groups';

    protected $fillable = [
        'idorg_group',
        'code',
        'name',
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

    /**
     * @return HasMany<Department, OrganizationGroup>
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'idorg_group', 'idorg_group');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough<User, Department, OrganizationGroup>
     */
    public function users(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(
            User::class,
            Department::class,
            'idorg_group',
            'department_id',
            'idorg_group',
            'id'
        );
    }
}

