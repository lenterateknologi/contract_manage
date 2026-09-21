<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobLevel extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_job_levels';

    protected $fillable = [
        'idjoblevel',
        'code',
        'name',
        'id_job_level_group',
        'job_level_group_id',
        'group_name',
        'hierarchy_tier',
        'tier_name',
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
        'hierarchy_tier' => 'integer',
        'is_active' => 'boolean',
        'is_used' => 'boolean',
        'portal_created_date' => 'datetime',
        'portal_modified_date' => 'datetime',
    ];

    public static array $tierLabels = [
        1 => 'Level 1 · Direksi & Executive (VP / Head / Director)',
        2 => 'Level 2 · Senior Management (GM & Senior Manager)',
        3 => 'Level 3 · Management (Manager)',
        4 => 'Level 4 · Middle Management (Assistant Manager & Askep)',
        5 => 'Level 5 · Supervisor & Senior Officer',
        6 => 'Level 6 · Staff & Officer',
        7 => 'Level 7 · Pelaksana & Non-Staff',
    ];

    protected static function booted(): void
    {
        static::saving(function (JobLevel $level) {
            if ($level->hierarchy_tier && isset(self::$tierLabels[$level->hierarchy_tier])) {
                $level->tier_name = self::$tierLabels[$level->hierarchy_tier];
            }
        });
    }

    /**
     * @return BelongsTo<JobLevelGroup, JobLevel>
     */
    public function jobLevelGroup(): BelongsTo
    {
        return $this->belongsTo(JobLevelGroup::class, 'job_level_group_id');
    }

    /**
     * @return HasMany<JobTitle, JobLevel>
     */
    public function jobTitles(): HasMany
    {
        return $this->hasMany(JobTitle::class, 'job_level_id');
    }

    /**
     * @return HasMany<User, JobLevel>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'job_level_id');
    }
}
