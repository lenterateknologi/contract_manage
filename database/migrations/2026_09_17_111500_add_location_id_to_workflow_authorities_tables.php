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
        if (! Schema::hasColumn('m_workflow_step_authorities', 'location_id')) {
            Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
                $table->uuid('location_id')->nullable()->after('division_id');
                $table->boolean('location_use_initiator')->default(false)->after('division_use_initiator');

                $table->foreign('location_id')
                    ->references('id')
                    ->on('m_locations')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('m_workflow_initiator_authorities', 'location_id')) {
            Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
                $table->uuid('location_id')->nullable()->after('division_id');
                $table->boolean('location_use_initiator')->default(false)->after('division_id');

                $table->foreign('location_id')
                    ->references('id')
                    ->on('m_locations')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('m_workflow_step_authorities', 'location_id')) {
            Schema::table('m_workflow_step_authorities', function (Blueprint $table) {
                $table->dropForeign(['location_id']);
                $table->dropColumn(['location_id', 'location_use_initiator']);
            });
        }

        if (Schema::hasColumn('m_workflow_initiator_authorities', 'location_id')) {
            Schema::table('m_workflow_initiator_authorities', function (Blueprint $table) {
                $table->dropForeign(['location_id']);
                $table->dropColumn(['location_id', 'location_use_initiator']);
            });
        }
    }
};
