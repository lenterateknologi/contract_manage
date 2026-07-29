<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'm_vendors';

    // ponytail: simplified vendor model
    protected $fillable = [
        'vendor_code',
        'vendor_name',
        'vendor_detail',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'vendor_detail' => 'array',
        'is_active' => 'boolean',
    ];

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'vendor_id');
    }
}
