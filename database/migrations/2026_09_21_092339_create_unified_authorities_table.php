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
        Schema::create('m_authorities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('context_type', 50)->index(); // 'workflow_initiator', 'workflow_step', 'step_action', 'on_behalf_create', etc.
            $table->uuid('context_id')->nullable()->index(); // workflow_id, workflow_step_id, action_id, or null

            $table->string('authority_type', 50)->default('group');
            $table->uuid('role_id')->nullable()->index();
            $table->uuid('department_id')->nullable()->index();
            $table->uuid('division_id')->nullable()->index();
            $table->uuid('organization_group_id')->nullable()->index();
            $table->uuid('location_id')->nullable()->index();
            $table->uuid('user_id')->nullable()->index();
            $table->uuid('company_group_id')->nullable()->index();
            $table->uuid('company_id')->nullable()->index();
            $table->uuid('region_id')->nullable()->index();

            // Flag contextual
            $table->boolean('role_use_initiator')->default(false);
            $table->boolean('department_use_initiator')->default(false);
            $table->boolean('division_use_initiator')->default(false);
            $table->boolean('organization_group_use_initiator')->default(false);
            $table->boolean('location_use_initiator')->default(false);
            $table->boolean('company_group_use_initiator')->default(false);
            $table->boolean('company_use_initiator')->default(false);
            $table->boolean('region_use_initiator')->default(false);

            // Additional properties (for step/action authorities)
            $table->boolean('is_additional')->default(false);
            $table->string('additional_type', 50)->nullable();
            $table->uuid('workflow_step_action_id')->nullable();
            $table->uuid('target_step_id')->nullable();

            $table->boolean('is_active')->default(true);
            $table->integer('sequence')->nullable()->default(1);
            $table->text('description')->nullable();
            $table->jsonb('meta')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        // 1. Migrate workflow initiator authorities
        if (Schema::hasTable('m_workflow_initiator_authorities')) {
            $initiators = DB::table('m_workflow_initiator_authorities')->get();
            foreach ($initiators as $item) {
                DB::table('m_authorities')->insert([
                    'id' => $item->id,
                    'context_type' => 'workflow_initiator',
                    'context_id' => $item->workflow_id,
                    'authority_type' => $item->authority_type ?? 'group',
                    'role_id' => $item->role_id ?? null,
                    'department_id' => $item->department_id ?? null,
                    'division_id' => $item->division_id ?? null,
                    'organization_group_id' => $item->organization_group_id ?? null,
                    'location_id' => $item->location_id ?? null,
                    'user_id' => $item->user_id ?? null,
                    'company_group_id' => $item->company_group_id ?? null,
                    'company_id' => $item->company_id ?? null,
                    'region_id' => $item->region_id ?? null,
                    'role_use_initiator' => (bool) ($item->role_use_initiator ?? false),
                    'department_use_initiator' => (bool) ($item->department_use_initiator ?? false),
                    'division_use_initiator' => (bool) ($item->division_use_initiator ?? false),
                    'organization_group_use_initiator' => (bool) ($item->organization_group_use_initiator ?? false),
                    'location_use_initiator' => (bool) ($item->location_use_initiator ?? false),
                    'company_group_use_initiator' => (bool) ($item->company_group_use_initiator ?? false),
                    'company_use_initiator' => (bool) ($item->company_use_initiator ?? false),
                    'region_use_initiator' => (bool) ($item->region_use_initiator ?? false),
                    'is_active' => true,
                    'sequence' => 1,
                    'created_at' => $item->created_at ?? now(),
                    'updated_at' => $item->updated_at ?? now(),
                ]);
            }
        }

        // 2. Migrate workflow step authorities
        if (Schema::hasTable('m_workflow_step_authorities')) {
            $steps = DB::table('m_workflow_step_authorities')->get();
            foreach ($steps as $item) {
                DB::table('m_authorities')->insert([
                    'id' => $item->id,
                    'context_type' => 'workflow_step',
                    'context_id' => $item->workflow_step_id,
                    'authority_type' => $item->authority_type ?? 'group',
                    'role_id' => $item->role_id ?? null,
                    'department_id' => $item->department_id ?? null,
                    'division_id' => $item->division_id ?? null,
                    'organization_group_id' => $item->organization_group_id ?? null,
                    'location_id' => $item->location_id ?? null,
                    'user_id' => $item->user_id ?? null,
                    'company_group_id' => $item->company_group_id ?? null,
                    'company_id' => $item->company_id ?? null,
                    'region_id' => $item->region_id ?? null,
                    'role_use_initiator' => (bool) ($item->role_use_initiator ?? false),
                    'department_use_initiator' => (bool) ($item->department_use_initiator ?? false),
                    'division_use_initiator' => (bool) ($item->division_use_initiator ?? false),
                    'organization_group_use_initiator' => (bool) ($item->organization_group_use_initiator ?? false),
                    'location_use_initiator' => (bool) ($item->location_use_initiator ?? false),
                    'company_group_use_initiator' => (bool) ($item->company_group_use_initiator ?? false),
                    'company_use_initiator' => (bool) ($item->company_use_initiator ?? false),
                    'region_use_initiator' => (bool) ($item->region_use_initiator ?? false),
                    'is_additional' => (bool) ($item->is_additional ?? false),
                    'additional_type' => $item->additional_type ?? null,
                    'workflow_step_action_id' => $item->workflow_step_action_id ?? null,
                    'target_step_id' => $item->target_step_id ?? null,
                    'is_active' => true,
                    'sequence' => 1,
                    'created_at' => $item->created_at ?? now(),
                    'updated_at' => $item->updated_at ?? now(),
                ]);
            }
        }

        // 3. Migrate on_behalf authorities if any
        if (Schema::hasTable('m_on_behalf_authorities')) {
            $onBehalfs = DB::table('m_on_behalf_authorities')->get();
            foreach ($onBehalfs as $item) {
                DB::table('m_authorities')->insert([
                    'id' => $item->id,
                    'context_type' => 'on_behalf_create',
                    'context_id' => null,
                    'authority_type' => $item->authority_type ?? 'group',
                    'role_id' => $item->role_id ?? null,
                    'department_id' => $item->department_id ?? null,
                    'division_id' => $item->division_id ?? null,
                    'organization_group_id' => $item->organization_group_id ?? null,
                    'location_id' => $item->location_id ?? null,
                    'user_id' => $item->user_id ?? null,
                    'company_group_id' => $item->company_group_id ?? null,
                    'company_id' => $item->company_id ?? null,
                    'region_id' => $item->region_id ?? null,
                    'role_use_initiator' => (bool) ($item->role_use_initiator ?? false),
                    'department_use_initiator' => (bool) ($item->department_use_initiator ?? false),
                    'division_use_initiator' => (bool) ($item->division_use_initiator ?? false),
                    'organization_group_use_initiator' => (bool) ($item->organization_group_use_initiator ?? false),
                    'location_use_initiator' => (bool) ($item->location_use_initiator ?? false),
                    'company_group_use_initiator' => (bool) ($item->company_group_use_initiator ?? false),
                    'company_use_initiator' => (bool) ($item->company_use_initiator ?? false),
                    'region_use_initiator' => (bool) ($item->region_use_initiator ?? false),
                    'is_active' => (bool) ($item->is_active ?? true),
                    'sequence' => $item->sequence ?? 1,
                    'created_at' => $item->created_at ?? now(),
                    'updated_at' => $item->updated_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_authorities');
    }
};
