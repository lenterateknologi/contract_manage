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
        Schema::table('t_contract_h', function (Blueprint $table) {
            $table->index('contract_id', 'idx_contract_h_contract_id');
            $table->index('actor_id', 'idx_contract_h_actor_id');
            $table->index('created_at', 'idx_contract_h_created_at');
            $table->index('action', 'idx_contract_h_action');
            $table->index(['contract_id', 'created_at'], 'idx_contract_h_contract_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contract_h', function (Blueprint $table) {
            $table->dropIndex('idx_contract_h_contract_id');
            $table->dropIndex('idx_contract_h_actor_id');
            $table->dropIndex('idx_contract_h_created_at');
            $table->dropIndex('idx_contract_h_action');
            $table->dropIndex('idx_contract_h_contract_created_at');
        });
    }
};
