<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $name
 * @property string $code
 * @property string|null $alias
 * @property string|null $address
 * @property string|null $company_group_id
 * @property string|null $region_id
 * @property bool $is_active
 * @property string|null $created_by
 * @property string|null $updated_by
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 * @property-read CompanyGroup|null $group
 * @property-read Region|null $region
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Department> $departments
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $users
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Role> $roles
 */
class Company extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_companies';

    protected $fillable = [
        'name',
        'code',
        'alias',
        'address',
        'company_group_id',
        'region_id',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * @return BelongsTo<CompanyGroup, Company>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    /**
     * @return BelongsTo<Region, Company>
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    /**
     * @return HasMany<Department, Company>
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'company_id');
    }

    /**
     * @return HasMany<User, Company>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'company_id');
    }

    /**
     * @return HasMany<Role, Company>
     */
    public function roles(): HasMany
    {
        return $this->hasMany(Role::class, 'company_id');
    }
}
