<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationLevel extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_organization_levels';

    protected $fillable = [
        'idorg_level',
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

    /**
     * @return HasMany<Department, OrganizationLevel>
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'idorg_level', 'idorg_level');
    }
}
