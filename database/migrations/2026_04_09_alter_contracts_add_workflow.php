<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->foreignId('workflow_id')->index()->nullable()->constrained('workflows')->onDelete('set null');
            $table->foreignId('workflow_step_id')->index()->nullable()->constrained('workflow_steps')->onDelete('set null');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('submitted_at')->nullable()->index();
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
