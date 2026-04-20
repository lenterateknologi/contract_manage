<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    protected $table = 'm_vendors';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'category',
        'email',
        'phone',
        'address',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function contracts()
    {
        // One vendor can have many contracts (to be implemented later in Contract model)
        return $this->hasMany(Contract::class);
    }
}
