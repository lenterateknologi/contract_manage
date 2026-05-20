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
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            if (! Schema::hasColumn('m_workflow_steps', 'step_category')) {
                $table->string('step_category')->nullable()->after('step_type');
            }
            if (! Schema::hasColumn('m_workflow_steps', 'is_optional')) {
                $table->boolean('is_optional')->default(false)->after('step_category');
            }
            if (! Schema::hasColumn('m_workflow_steps', 'optional_label')) {
                $table->string('optional_label')->nullable()->after('is_optional');
            }
        });

        Schema::create('m_workflow_step_selection_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_step_id')->constrained('m_workflow_steps')->cascadeOnDelete();
            $table->foreignUuid('role_id')->nullable()->constrained('m_roles')->nullOnDelete();
            $table->foreignUuid('department_id')->nullable()->constrained('m_departments')->nullOnDelete();
            $table->string('role_name')->nullable(); // For simpler lookup if needed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_workflow_step_selection_rules');

        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->dropColumn(['step_category', 'is_optional', 'optional_label']);
        });
    }
};
