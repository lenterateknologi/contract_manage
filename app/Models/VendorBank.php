<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorBank extends Model
{
    protected $table = 'm_vendor_banks';

    protected $fillable = [
        'vendor_id',
        'bank_name',
        'bank_code',
        'account_number',
        'account_name',
        'currency',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
