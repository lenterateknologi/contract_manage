<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create m_master_actions table
        Schema::create('m_master_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Create m_workflow_step_actions table
        Schema::create('m_workflow_step_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_step_id');
            $table->uuid('master_action_id');
            $table->uuid('next_step_id')->nullable();
            $table->uuid('next_workflow_id')->nullable();
            $table->uuid('next_workflow_step_id')->nullable();
            $table->json('required_fields')->nullable();
            $table->json('autofilled_fields')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('workflow_step_id')
                ->references('id')
                ->on('m_workflow_steps')
                ->onDelete('cascade');

            $table->foreign('master_action_id')
                ->references('id')
                ->on('m_master_actions')
                ->onDelete('cascade');

            $table->foreign('next_step_id')
                ->references('id')
                ->on('m_workflow_steps')
                ->onDelete('set null');

            $table->foreign('next_workflow_id')
                ->references('id')
                ->on('m_workflows')
                ->onDelete('set null');

            $table->foreign('next_workflow_step_id')
                ->references('id')
                ->on('m_workflow_steps')
                ->onDelete('set null');
        });

        // 3. Seed default master actions
        $defaultActions = [
            ['name' => 'Approve', 'code' => 'approve'],
            ['name' => 'Reject', 'code' => 'reject'],
            ['name' => 'Assign', 'code' => 'assign'],
            ['name' => 'Upload', 'code' => 'upload'],
            ['name' => 'Review', 'code' => 'review'],
        ];

        $masterActionMap = [];
        foreach ($defaultActions as $action) {
            $id = Str::uuid()->toString();
            DB::table('m_master_actions')->insert([
                'id' => $id,
                'name' => $action['name'],
                'code' => $action['code'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $masterActionMap[$action['code']] = $id;
        }

        // 4. Migrate old allowed_actions from m_workflow_steps
        if (Schema::hasColumn('m_workflow_steps', 'allowed_actions')) {
            $steps = DB::table('m_workflow_steps')->orderBy('workflow_id')->orderBy('step')->get();

            // Build index of steps to easily look up next step by sequence
            $workflowSteps = [];
            foreach ($steps as $step) {
                $workflowSteps[$step->workflow_id][] = $step;
            }

            foreach ($steps as $step) {
                if (empty($step->allowed_actions)) {
                    continue;
                }

                $allowed = json_decode($step->allowed_actions, true);
                if (! is_array($allowed)) {
                    continue;
                }

                // Look up next step in sequence
                $nextStepId = null;
                $currentWorkflowSteps = $workflowSteps[$step->workflow_id] ?? [];
                foreach ($currentWorkflowSteps as $s) {
                    if ($s->step == $step->step + 1) {
                        $nextStepId = $s->id;

                        break;
                    }
                }

                // Look up step 1 for reject targets
                $firstStepId = null;
                foreach ($currentWorkflowSteps as $s) {
                    if ($s->step == 1) {
                        $firstStepId = $s->id;

                        break;
                    }
                }

                foreach ($allowed as $actCode) {
                    $actCode = strtolower($actCode);

                    // Create master action if it doesn't exist
                    if (! isset($masterActionMap[$actCode])) {
                        $newId = Str::uuid()->toString();
                        DB::table('m_master_actions')->insert([
                            'id' => $newId,
                            'name' => ucfirst($actCode),
                            'code' => $actCode,
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $masterActionMap[$actCode] = $newId;
                    }

                    $masterActionId = $masterActionMap[$actCode];
                    $targetNextStepId = null;

                    if ($actCode === 'approve') {
                        $targetNextStepId = $nextStepId;
                    } elseif ($actCode === 'reject') {
                        $targetNextStepId = $firstStepId; // Default reject to first step
                    }

                    DB::table('m_workflow_step_actions')->insert([
                        'id' => Str::uuid()->toString(),
                        'workflow_step_id' => $step->id,
                        'master_action_id' => $masterActionId,
                        'next_step_id' => $targetNextStepId,
                        'required_fields' => json_encode([]),
                        'autofilled_fields' => json_encode($actCode === 'approve' && $step->step_category === 'closing' ? ['closed_at'] : []),
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
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
        Schema::dropIfExists('m_workflow_step_actions');
        Schema::dropIfExists('m_master_actions');
    }
};
