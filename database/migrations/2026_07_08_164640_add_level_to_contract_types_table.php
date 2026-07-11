<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->unsignedTinyInteger('level')->default(0)->after('parent_id')->comment('0=Parent, 1=Child, 2=Subchild');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_contract_types', function (Blueprint $table) {
            $table->dropColumn('level');
        });
    }
};
