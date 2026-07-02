<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WorkflowOrgScope extends Model
{
    use HasUuids;

    protected $table = 'm_workflow_org_scopes';

    protected $fillable = [
        'workflow_id',
        'company_group_id',
        'region_id',
        'company_id',
        'is_initiator',
    ];

    protected function casts(): array
    {
        return [
            'is_initiator' => 'boolean',
        ];
    }
}
