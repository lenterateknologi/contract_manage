<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobTitle extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_job_titles';

    protected $fillable = [
        'idjobtitle',
        'code',
        'name',
        'job_level_id',
        'idjoblevel',
        'job_level_name',
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
     * @return BelongsTo<JobLevel, JobTitle>
     */
    public function jobLevel(): BelongsTo
    {
        return $this->belongsTo(JobLevel::class, 'job_level_id');
    }
}
