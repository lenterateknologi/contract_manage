<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. m_vendor_business_fields
        Schema::create('m_vendor_business_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('vendor_id')->constrained('m_vendors')->cascadeOnDelete();
            $table->text('business_field');
            $table->timestamps();
        });

        // 2. m_vendor_banks
        Schema::create('m_vendor_banks', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('vendor_id')->constrained('m_vendors')->cascadeOnDelete();
            $table->string('bank_name')->nullable();
            $table->string('bank_code')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            $table->string('currency', 10)->nullable()->default('IDR');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        // 3. m_vendor_payment_methods
        Schema::create('m_vendor_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('vendor_id')->constrained('m_vendors')->cascadeOnDelete();
            $table->string('method_name')->nullable();
            $table->string('method_code')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 4. m_vendor_legalities
        Schema::create('m_vendor_legalities', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('vendor_id')->constrained('m_vendors')->cascadeOnDelete();
            $table->string('legality_type')->nullable();   // e.g. SIUP, NIB, AKTA
            $table->string('number')->nullable();
            $table->date('issued_date')->nullable();
            $table->date('expired_date')->nullable();
            $table->string('file')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });

        // 5. m_vendor_taxes — pindah dari kolom inline di m_vendors ke tabel tersendiri
        Schema::create('m_vendor_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('vendor_id')->constrained('m_vendors')->cascadeOnDelete();

            $table->string('type_npwp')->nullable();    // typeNpwp: NON_NPWP / NPWP
            $table->string('npwp')->nullable();
            $table->string('npwp_file')->nullable();

            $table->string('type_pkp')->nullable();
            $table->string('pkp')->nullable();
            $table->string('skpkp_file')->nullable();

            $table->string('type_bkp')->nullable();
            $table->string('ppn')->nullable();          // e.g. "12.0"
            $table->string('jkp_file')->nullable();
            $table->text('bkp_desc')->nullable();
            $table->text('jkp_desc')->nullable();

            $table->boolean('is_organization')->default(false);
            $table->string('is_siujk')->nullable();

            $table->string('pp23_number')->nullable();
            $table->timestamp('pp23_expired_date')->nullable();
            $table->string('pp23_attachment')->nullable();

            $table->timestamps();
        });

        // 6. Drop kolom JSON & kolom pajak inline dari m_vendors
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->dropColumn([
                // JSON blob tidak lagi dibutuhkan
                'coma_data',
                'business_fields',
                'bank_data',
                'payment_method_data',
                'legality_data',
                // Pajak — dipindah ke m_vendor_taxes
                'npwp',
                'tax_type_npwp',
                'tax_type_pkp',
                'tax_pkp',
                'tax_type_bkp',
                'tax_ppn',
                'tax_bkp_desc',
                'tax_jkp_desc',
                'tax_is_organization',
                'tax_is_siujk',
                'tax_pp23_number',
                'tax_pp23_expired_date',
                'tax_npwp_file',
                'tax_skpkp_file',
                'tax_jkp_file',
                'tax_pp23_attachment',
            ]);
        });
    }

    public function down(): void
    {
        // Restore kolom di m_vendors
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->jsonb('coma_data')->nullable();
            $table->jsonb('business_fields')->nullable();
            $table->jsonb('bank_data')->nullable();
            $table->jsonb('payment_method_data')->nullable();
            $table->jsonb('legality_data')->nullable();
            $table->string('npwp')->nullable();
            $table->string('tax_type_npwp')->nullable();
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
        });

        Schema::dropIfExists('m_vendor_taxes');
        Schema::dropIfExists('m_vendor_legalities');
        Schema::dropIfExists('m_vendor_payment_methods');
        Schema::dropIfExists('m_vendor_banks');
        Schema::dropIfExists('m_vendor_business_fields');
    }
};
