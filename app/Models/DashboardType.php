<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DashboardType extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'm_dashboard_types';

    protected $fillable = [
        'name',
        'description',
        'role_id',
        'department_id',
        'show_overview',
        'show_workload',
        'show_master_data',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'show_overview' => 'boolean',
        'show_workload' => 'boolean',
        'show_master_data' => 'boolean',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
