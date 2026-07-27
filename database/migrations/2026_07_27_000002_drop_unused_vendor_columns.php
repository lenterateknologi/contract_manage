<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // ponytail: drop kolom yang tidak ada di COMA API response
    public function up(): void
    {
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->dropColumn([
                'tax_id',
                'category',
                'website',
                'pic_position',
                'nib',
                'siup',
                'director_name',
                'bank_name',
                'bank_account_no',
                'bank_account_name',
                'is_individual',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->string('tax_id')->nullable();
            $table->string('category')->nullable();
            $table->string('website')->nullable();
            $table->string('pic_position')->nullable();
            $table->string('nib')->nullable();
            $table->string('siup')->nullable();
            $table->string('director_name')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_no')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->boolean('is_individual')->default(false);
        });
    }
};
