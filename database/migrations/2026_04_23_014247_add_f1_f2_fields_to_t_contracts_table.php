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
        Schema::table('t_contracts', function (Blueprint $table) {
            // F1 Kop Surat
            $table->string('kop_topik')->nullable();
            $table->string('kop_sub_topik')->nullable();
            $table->string('kop_lampiran')->nullable();

            // F1 Informasi Dasar
            $table->text('f1_tujuan')->nullable();
            $table->string('f1_sifat')->nullable();

            // F1 Pihak Pertama
            $table->string('p1_entity')->nullable();
            $table->string('p1_signer')->nullable();
            $table->text('p1_address')->nullable();

            // F1 Pihak Kedua
            $table->string('p2_entity')->nullable();
            $table->string('p2_signer')->nullable();
            $table->text('p2_address')->nullable();

            // F2 Isi Perjanjian
            $table->text('f2_scope')->nullable();
            $table->string('f2_price')->nullable();
            $table->string('f2_payment')->nullable();
            $table->string('f2_tenure')->nullable();
            $table->text('f2_location')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropColumn([
                'kop_topik',
                'kop_sub_topik',
                'kop_lampiran',
                'f1_tujuan',
                'f1_sifat',
                'p1_entity',
                'p1_signer',
                'p1_address',
                'p2_entity',
                'p2_signer',
                'p2_address',
                'f2_scope',
                'f2_price',
                'f2_payment',
                'f2_tenure',
                'f2_location',
            ]);
        });
    }
};
