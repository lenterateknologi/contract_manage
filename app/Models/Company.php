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
