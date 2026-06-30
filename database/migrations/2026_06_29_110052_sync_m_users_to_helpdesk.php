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
        Schema::table('m_users', function (Blueprint $table) {
            // Rename columns to match helpdesk
            $table->renameColumn('phone', 'phone_number');
            $table->renameColumn('manager_id', 'spv_id');

            // Drop columns not in helpdesk
            if (Schema::hasColumn('m_users', 'bio')) {
                $table->dropColumn('bio');
            }

            // Add missing columns
            $table->string('code')->nullable();
            $table->uuid('company_group_id')->nullable();
            $table->foreign('company_group_id')->references('id')->on('m_company_groups')->nullOnDelete();

            $table->uuid('division_id')->nullable();
            $table->foreign('division_id')->references('id')->on('m_departments')->nullOnDelete();

            $table->boolean('login_status')->default(false);
            $table->timestamp('last_login')->nullable();
            $table->timestamp('last_connected')->nullable();
            $table->text('address')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 10)->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->uuid('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->uuid('job_position_id')->nullable();
            $table->uuid('job_level_id')->nullable();
            $table->string('image_src')->nullable();
            $table->uuid('location_id')->nullable();
            $table->uuid('region_id')->nullable();
            $table->foreign('region_id')->references('id')->on('m_regions')->nullOnDelete();

            $table->boolean('is_employee')->default(true);
            $table->integer('id_employee_portal_master')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $hasConstraint = function (string $constraintName): bool {
            return DB::selectOne("
                SELECT 1 FROM pg_constraint 
                WHERE conrelid = 'm_users'::regclass 
                AND conname = ?
            ", [$constraintName]) !== null;
        };

        Schema::table('m_users', function (Blueprint $table) use ($hasConstraint) {
            $table->renameColumn('phone_number', 'phone');
            $table->renameColumn('spv_id', 'manager_id');
            $table->string('bio')->nullable();

            if ($hasConstraint('m_users_company_group_id_foreign')) {
                $table->dropForeign(['company_group_id']);
            }
            if ($hasConstraint('m_users_division_id_foreign')) {
                $table->dropForeign(['division_id']);
            }
            if ($hasConstraint('m_users_region_id_foreign')) {
                $table->dropForeign(['region_id']);
            }

            $table->dropColumn([
                'code', 'company_group_id', 'division_id', 'login_status',
                'last_login', 'last_connected', 'address', 'birth_date',
                'gender', 'created_by', 'updated_by', 'is_verified',
                'verified_by', 'verified_at', 'job_position_id', 'job_level_id',
                'image_src', 'location_id', 'region_id', 'is_employee',
                'id_employee_portal_master',
            ]);
        });
    }
};
