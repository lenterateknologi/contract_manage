<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property string $name
 * @property string $code
 * @property bool $is_active
 */
class WorkflowMasterAction extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'm_master_actions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'code',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
