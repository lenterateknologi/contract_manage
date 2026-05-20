<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            if (! Schema::hasColumn('contracts', 'workflow_id')) {
                $table->foreignId('workflow_id')->index()->nullable()->constrained('workflows')->onDelete('set null');
            }
            if (! Schema::hasColumn('contracts', 'workflow_step_id')) {
                $table->foreignId('workflow_step_id')->index()->nullable()->constrained('workflow_steps')->onDelete('set null');
            }
            if (! Schema::hasColumn('contracts', 'is_active')) {
                $table->boolean('is_active')->default(true)->index();
            }
            if (! Schema::hasColumn('contracts', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->index();
            }
            // $table->timestamp('submitted_by')->nullable()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::table('contracts', function (Blueprint $table) {
            DB::statement('ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_workflow_id_foreign CASCADE');
            DB::statement('ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_workflow_step_id_foreign CASCADE');
        });
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['workflow_id', 'workflow_step_id', 'is_active']);
        });
        Schema::enableForeignKeyConstraints();
    }
};
