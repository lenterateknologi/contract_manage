<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    protected $table = 'm_departments';

    const CODE_LEGAL = 'LGL';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'idorganization',
        'company_id',
        'code',
        'name',
        'idorg_group',
        'org_group_name',
        'idorg_level',
        'org_level_name',
        'description',
        'is_used',
        'is_active',
        'created_by',
        'updated_by',
        'created_by_name',
        'modified_by_name',
        'portal_created_date',
        'portal_modified_date',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'is_active' => 'boolean',
        'portal_created_date' => 'datetime',
        'portal_modified_date' => 'datetime',
    ];

    /**
     * @return BelongsTo<Company, Department>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * @return HasMany<User, Department>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
