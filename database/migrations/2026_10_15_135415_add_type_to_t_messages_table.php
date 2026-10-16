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
        Schema::table('t_messages', function (Blueprint $table) {
            $table->string('type', 50)->default('contract')->after('contract_id');
            $table->index(['contract_id', 'type', 'created_at'], 'idx_messages_contract_type_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_contract_type_created');
            $table->dropColumn('type');
        });
    }
};
