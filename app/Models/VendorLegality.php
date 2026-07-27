<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorLegality extends Model
{
    protected $table = 'm_vendor_legalities';

    protected $fillable = [
        'vendor_id',
        'legality_type',
        'number',
        'issued_date',
        'expired_date',
        'file',
        'is_verified',
    ];

    protected $casts = [
        'is_verified'  => 'boolean',
        'issued_date'  => 'date',
        'expired_date' => 'date',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
