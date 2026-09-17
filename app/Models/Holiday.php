<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Holiday extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'm_holidays';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'holiday_date',
        'name',
        'description',
        'is_cuti_bersama',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'holiday_date' => 'date:Y-m-d',
        'is_cuti_bersama' => 'boolean',
        'is_active' => 'boolean',
    ];
}
