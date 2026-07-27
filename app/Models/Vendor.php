<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    protected $table = 'm_vendors';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        // --- Internal ---
        'code',
        'external_code',
        'is_active',
        'created_by',
        'updated_by',

        // --- Identitas ---
        'name',
        'branch_name',
        'company_type',
        'registration_number',
        'agreement_number',
        'agreement_date',
        'approved_date',
        'is_upload_agreement',
        'master_agreement_attachment',
        'vendor_status',
        'integrity_pact',
        'master_agreement',
        'is_single_vendor',
        'single_vendor_expired',
        'single_vendor_file',
        'compliance_level',
        'compliance_file',
        'coverage_area',
        'total_employees',
        'company_profile_attachment',
        'id_card_number',
        'id_card_file',
        'business_fields_foreign',

        // --- Alamat ---
        'address',
        'country',
        'region',
        'city',
        'postal_code',
        'vendor_country',
        'mailing_address',
        'mailing_country',
        'mailing_region',
        'mailing_city',
        'mailing_postal_code',

        // --- Kontak ---
        'email',
        'phone',
        'fax',
        'pic_name',
        'pic_email',
        'pic_phone',
        'finance_email',
        'tax_email',
    ];

    protected $casts = [
        'is_active'            => 'boolean',
        'integrity_pact'       => 'boolean',
        'master_agreement'     => 'boolean',
        'is_upload_agreement'  => 'boolean',
        'is_single_vendor'     => 'boolean',
        'agreement_date'       => 'datetime',
        'approved_date'        => 'datetime',
        'single_vendor_expired' => 'datetime',
    ];

    // --- Relasi ---

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function businessFields(): HasMany
    {
        return $this->hasMany(VendorBusinessField::class, 'vendor_id');
    }

    public function banks(): HasMany
    {
        return $this->hasMany(VendorBank::class, 'vendor_id');
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(VendorPaymentMethod::class, 'vendor_id');
    }

    public function legalities(): HasMany
    {
        return $this->hasMany(VendorLegality::class, 'vendor_id');
    }

    public function tax(): HasOne
    {
        return $this->hasOne(VendorTax::class, 'vendor_id');
    }
}
