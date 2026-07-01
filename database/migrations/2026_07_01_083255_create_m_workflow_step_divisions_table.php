<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('m_workflow_step_divisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_step_id');
            $table->uuid('division_id');
            $table->timestamps();

            // Foreign keys
            $table->foreign('workflow_step_id')
                ->references('id')
                ->on('m_workflow_steps')
                ->onDelete('cascade');

            $table->foreign('division_id')
                ->references('id')
                ->on('m_division')
                ->onDelete('cascade');
        });

        // Copy existing data from m_workflow_step_departments
        if (Schema::hasTable('m_workflow_step_departments')) {
            $existing = DB::table('m_workflow_step_departments')->get();
            foreach ($existing as $row) {
                // Ensure division exists before inserting to satisfy foreign key
                $divisionExists = DB::table('m_division')->where('id', $row->department_id)->exists();
                if ($divisionExists) {
                    DB::table('m_workflow_step_divisions')->insert([
                        'id' => $row->id,
                        'workflow_step_id' => $row->workflow_step_id,
                        'division_id' => $row->department_id, // previous department_id values were actually division UUIDs
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_workflow_step_divisions');
    }
};
