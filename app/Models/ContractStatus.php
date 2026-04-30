<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ContractStatus extends Model
{
    protected $table = 'm_contract_statuses';

    use HasUuids, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'label',
        'color',
        'bg_color',
        'icon',
        'description',
        'is_active',
        'display_mode',
        'allow_info_edit',
        'allow_reference',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'allow_info_edit' => 'boolean',
        'allow_reference' => 'boolean',
    ];
}
