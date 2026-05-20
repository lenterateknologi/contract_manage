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
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->string('initiator_type')->default('all')->after('description'); // all, role, user
            $table->json('initiator_roles')->nullable()->after('initiator_type');
            $table->json('initiator_users')->nullable()->after('initiator_roles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflows', function (Blueprint $table) {
            $table->dropColumn(['initiator_type', 'initiator_roles', 'initiator_users']);
        });
    }
};
