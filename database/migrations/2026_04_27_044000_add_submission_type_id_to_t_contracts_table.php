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
            $table->foreignUuid('submission_type_id')->after('contract_type_id')->nullable()->constrained('m_submission_types')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropForeign(['submission_type_id']);
            $table->dropColumn('submission_type_id');
        });
    }
};
