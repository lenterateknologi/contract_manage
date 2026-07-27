<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorPaymentMethod extends Model
{
    protected $table = 'm_vendor_payment_methods';

    protected $fillable = [
        'vendor_id',
        'method_name',
        'method_code',
        'description',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
