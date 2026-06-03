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
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->dropIndex(['contract_type']);
            $table->dropColumn('contract_type');
            $table->foreignUuid('contract_type_id')
                ->nullable()
                ->after('id')
                ->index()
                ->constrained('m_contract_types')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->dropForeign(['contract_type_id']);
            $table->dropColumn('contract_type_id');
            $table->string('contract_type')->nullable()->after('id')->index();
        });
    }
};
