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
        Schema::table('t_approvals', function (Blueprint $table) {
            if (! Schema::hasColumn('t_approvals', 'action_id')) {
                $table->uuid('action_id')->nullable()->after('workflow_step_id');
            }
            if (! Schema::hasColumn('t_approvals', 'action_code')) {
                $table->string('action_code')->nullable()->after('action_id');
            }
            if (! Schema::hasColumn('t_approvals', 'action_alias')) {
                $table->string('action_alias')->nullable()->after('action_code');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_approvals', function (Blueprint $table) {
            if (Schema::hasColumn('t_approvals', 'action_alias')) {
                $table->dropColumn('action_alias');
            }
            if (Schema::hasColumn('t_approvals', 'action_code')) {
                $table->dropColumn('action_code');
            }
            if (Schema::hasColumn('t_approvals', 'action_id')) {
                $table->dropColumn('action_id');
            }
        });
    }
};
