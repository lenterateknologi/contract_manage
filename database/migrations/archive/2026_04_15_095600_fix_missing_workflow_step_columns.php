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
        Schema::table('workflow_steps', function (Blueprint $table) {
            if (! Schema::hasColumn('workflow_steps', 'approver_type')) {
                $table->string('approver_type', 20)->default('role')->after('role'); // 'role' or 'user'
            }
            if (! Schema::hasColumn('workflow_steps', 'user_ids')) {
                $table->json('user_ids')->nullable()->after('approver_type'); // Store specific user UUIDs
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->dropColumn(['approver_type', 'user_ids']);
        });
    }
};
