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
            if (!Schema::hasColumn('m_workflows', 'workflow_type')) {
                $table->string('workflow_type')->default('standalone')->nullable()->after('workflow_category');
            }
            if (!Schema::hasColumn('m_workflows', 'parent_workflow_id')) {
                $table->uuid('parent_workflow_id')->nullable()->after('workflow_type')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflows', function (Blueprint $table) {
            if (Schema::hasColumn('m_workflows', 'parent_workflow_id')) {
                $table->dropColumn('parent_workflow_id');
            }
            if (Schema::hasColumn('m_workflows', 'workflow_type')) {
                $table->dropColumn('workflow_type');
            }
        });
    }
};
