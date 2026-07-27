<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_vendors', function (Blueprint $table) {
            // --- Identitas ---
            $table->string('branch_name')->nullable()->after('name');
            $table->string('registration_number')->nullable();
            $table->string('agreement_number')->nullable();
            $table->timestamp('agreement_date')->nullable();
            $table->timestamp('approved_date')->nullable();
            $table->boolean('is_upload_agreement')->default(false);
            $table->string('master_agreement_attachment')->nullable();
            $table->string('vendor_status')->nullable();       // 'status' dari API
            $table->boolean('integrity_pact')->default(false);
            $table->boolean('master_agreement')->default(false);
            $table->boolean('is_single_vendor')->default(false);
            $table->timestamp('single_vendor_expired')->nullable();
            $table->string('single_vendor_file')->nullable();
            $table->string('compliance_level')->nullable();
            $table->string('compliance_file')->nullable();
            $table->string('coverage_area')->nullable();
            $table->integer('total_employees')->nullable();
            $table->string('company_profile_attachment')->nullable();
            $table->string('id_card_number')->nullable();
            $table->string('id_card_file')->nullable();
            $table->jsonb('business_fields')->nullable();       // array [{businessField: "..."}]
            $table->string('business_fields_foreign')->nullable();

            // --- Alamat ---
            $table->string('country')->nullable();
            $table->string('region')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('vendor_country')->nullable();      // kode negara numeric dari API
            $table->text('mailing_address')->nullable();
            $table->string('mailing_country')->nullable();
            $table->string('mailing_region')->nullable();
            $table->string('mailing_city')->nullable();
            $table->string('mailing_postal_code')->nullable();

            // --- Kontak ---
            $table->string('fax')->nullable();
            $table->string('pic_email')->nullable();           // picemail
            $table->string('pic_phone')->nullable();           // picphone
            $table->string('finance_email')->nullable();
            $table->string('tax_email')->nullable();

            // --- Pajak ---
            $table->string('tax_type_npwp')->nullable();       // typeNpwp
            $table->string('tax_type_pkp')->nullable();
            $table->string('tax_pkp')->nullable();
            $table->string('tax_type_bkp')->nullable();
            $table->string('tax_ppn')->nullable();
            $table->string('tax_bkp_desc')->nullable();
            $table->string('tax_jkp_desc')->nullable();
            $table->boolean('tax_is_organization')->default(false);
            $table->string('tax_is_siujk')->nullable();
            $table->string('tax_pp23_number')->nullable();
            $table->timestamp('tax_pp23_expired_date')->nullable();
            $table->string('tax_npwp_file')->nullable();
            $table->string('tax_skpkp_file')->nullable();
            $table->string('tax_jkp_file')->nullable();
            $table->string('tax_pp23_attachment')->nullable();

            // --- Data Array (JSON) ---
            $table->jsonb('bank_data')->nullable();            // bank array
            $table->jsonb('payment_method_data')->nullable();  // paymentMethod array
            $table->jsonb('legality_data')->nullable();        // legality
        });
    }

    public function down(): void
    {
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->dropColumn([
                'branch_name', 'registration_number', 'agreement_number',
                'agreement_date', 'approved_date', 'is_upload_agreement',
                'master_agreement_attachment', 'vendor_status',
                'integrity_pact', 'master_agreement', 'is_single_vendor',
                'single_vendor_expired', 'single_vendor_file',
                'compliance_level', 'compliance_file', 'coverage_area',
                'total_employees', 'company_profile_attachment',
                'id_card_number', 'id_card_file',
                'business_fields', 'business_fields_foreign',
                'country', 'region', 'city', 'postal_code', 'vendor_country',
                'mailing_address', 'mailing_country', 'mailing_region',
                'mailing_city', 'mailing_postal_code',
                'fax', 'pic_email', 'pic_phone', 'finance_email', 'tax_email',
                'tax_type_npwp', 'tax_type_pkp', 'tax_pkp', 'tax_type_bkp',
                'tax_ppn', 'tax_bkp_desc', 'tax_jkp_desc',
                'tax_is_organization', 'tax_is_siujk',
                'tax_pp23_number', 'tax_pp23_expired_date',
                'tax_npwp_file', 'tax_skpkp_file', 'tax_jkp_file', 'tax_pp23_attachment',
                'bank_data', 'payment_method_data', 'legality_data',
            ]);
        });
    }
};
