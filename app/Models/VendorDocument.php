<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VendorDocument extends Model
{
    use HasUuids;

    protected $table = 'm_vendor_documents';

    protected $fillable = [
        'vendor_id',
        'document_name',
        'document_type',
        'file_url',
        'expires_at',
        'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'expires_at' => 'date',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }
}
