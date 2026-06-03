<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('m_numbering_formats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('module')->unique(); // e.g. 'contract'
            $table->string('format_pattern'); // e.g. {{nomor}}/{{tanggal}}-{{bulan}}/{{kode_departemen}}/{{kode_perjanjian}}/{{CMS}}/{{tahun}}
            $table->integer('current_number')->default(0);
            $table->integer('padding')->default(3); // e.g. 001
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default format
        DB::table('m_numbering_formats')->insert([
            'id' => Str::uuid(),
            'module' => 'contract',
            'format_pattern' => '{{nomor}}/{{tanggal}}-{{bulan}}/{{kode_departemen}}/{{kode_perjanjian}}/{{CMS}}/{{tahun}}',
            'current_number' => 0,
            'padding' => 3,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_numbering_formats');
    }
};
