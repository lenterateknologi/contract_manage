<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        // Baru: Corporate Identity & Legal
        'company_type',
        'is_individual',
        'website',
        'pic_name',
        'pic_position',
        'npwp',
        'nib',
        'siup',
        'director_name',
        // Baru: Financial
        'bank_name',
        'bank_account_no',
        'bank_account_name',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_individual' => 'boolean',
    ];

    public function contracts(): HasMany
    {
        // One vendor can have many contracts (to be implemented later in Contract model)
        return $this->hasMany(Contract::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(VendorDocument::class, 'vendor_id');
    }
}
