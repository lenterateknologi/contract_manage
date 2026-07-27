<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // ponytail: satu kolom JSON untuk simpan seluruh response COMA — tidak perlu 30+ kolom
    public function up(): void
    {
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->jsonb('coma_data')->nullable()->after('external_code');
        });
    }

    public function down(): void
    {
        Schema::table('m_vendors', function (Blueprint $table) {
            $table->dropColumn('coma_data');
        });
    }
};
