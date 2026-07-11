<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowInitiatorAuthority extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_initiator_authorities';

    public const AUTHORITY_TYPES = [
        'user',
        'division',
        'department',
        'role',
        'company_group',
        'region',
        'role-division',
        'role-division-company_group',
        'role-division_company_group-region',
        'group',
    ];

    protected $fillable = [
        'workflow_id',
        'role_id',
        'department_id',
        'division_id',
        'user_id',
        'company_group_id',
        'region_id',
        'authority_type',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'department_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
