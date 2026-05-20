<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->string('company_type')->nullable(); // e.g., PT, CV, Perorangan
            $table->boolean('is_individual')->default(false); // To distinct corporate vs individual
            $table->string('website')->nullable();

            $table->string('pic_name')->nullable();
            $table->string('pic_position')->nullable();

            $table->string('npwp')->nullable();
            $table->string('nib')->nullable();
            $table->string('siup')->nullable();
            $table->string('director_name')->nullable();

            $table->string('bank_name')->nullable();
            $table->string('bank_account_no')->nullable();
            $table->string('bank_account_name')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->dropColumn([
                'company_type',
                'is_individual',
                'website',
                'pic_name',
                'pic_position',
                'npwp',
                'nib',
                'siup',
                'director_name',
                'bank_name',
                'bank_account_no',
                'bank_account_name',
            ]);
        });
    }
};
