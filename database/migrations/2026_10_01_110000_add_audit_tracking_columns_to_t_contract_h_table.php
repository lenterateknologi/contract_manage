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
            $table->string('ip_address', 45)->nullable()->after('actor_id');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->string('step_name', 150)->nullable()->after('user_agent');
            $table->integer('step_number')->nullable()->after('step_name');
            $table->json('metadata')->nullable()->after('step_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contract_h', function (Blueprint $table) {
            $table->dropColumn(['ip_address', 'user_agent', 'step_name', 'step_number', 'metadata']);
        });
    }
};
