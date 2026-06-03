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
        Schema::table('contracts', function (Blueprint $table) {
            if (! Schema::hasColumn('contracts', 'metadata')) {
                $table->json('metadata')->nullable()->after('status');
            }
        });

        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->string('step_type')->default('approval')->after('approver_type');
            $table->string('condition_expression')->nullable()->after('step_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });

        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->dropColumn(['step_type', 'condition_expression']);
        });
    }
};
