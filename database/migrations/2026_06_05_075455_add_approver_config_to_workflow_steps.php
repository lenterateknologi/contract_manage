<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->json('approver_config')->nullable()->after('approver_type');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('m_workflow_steps', 'approver_config')) {
            Schema::table('m_workflow_steps', function (Blueprint $table) {
                $table->dropColumn('approver_config');
            });
        }
    }
};
