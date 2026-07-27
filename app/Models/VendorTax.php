<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorTax extends Model
{
    protected $table = 'm_vendor_taxes';

    protected $fillable = [
        'vendor_id',
        'type_npwp',
        'npwp',
        'npwp_file',
        'type_pkp',
        'pkp',
        'skpkp_file',
        'type_bkp',
        'ppn',
        'jkp_file',
        'bkp_desc',
        'jkp_desc',
        'is_organization',
        'is_siujk',
        'pp23_number',
        'pp23_expired_date',
        'pp23_attachment',
    ];

    protected $casts = [
        'is_organization'    => 'boolean',
        'pp23_expired_date'  => 'datetime',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
