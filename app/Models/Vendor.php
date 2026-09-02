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

    protected $appends = [
        'name',
        'pic_name',
        'pic_position',
        'address',
        'documents',
        'detail',
    ];

    protected $casts = [
        'vendor_detail' => 'array',
        'is_active' => 'boolean',
    ];

    public function getDetailAttribute(): array
    {
        return $this->vendor_detail ?? [];
    }

    public function getDocumentsAttribute(): array
    {
        $detail = $this->vendor_detail ?? [];

        return $detail['documents'] ?? $detail['berkas'] ?? $detail['files'] ?? [];
    }

    public function getNameAttribute(): ?string
    {
        return $this->vendor_name ?? ($this->vendor_detail['company_name'] ?? null);
    }

    public function getPicNameAttribute(): ?string
    {
        return $this->vendor_detail['pic'] ?? ($this->vendor_detail['pic_name'] ?? null);
    }

    public function getPicPositionAttribute(): ?string
    {
        return $this->vendor_detail['pic_position'] ?? ($this->vendor_detail['position'] ?? null);
    }

    public function getAddressAttribute(): ?string
    {
        return $this->vendor_detail['address'] ?? null;
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'vendor_id');
    }
}
