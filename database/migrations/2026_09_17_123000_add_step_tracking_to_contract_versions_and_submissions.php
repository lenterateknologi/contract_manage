<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('t_contract_versions')) {
            Schema::table('t_contract_versions', function (Blueprint $table) {
                if (! Schema::hasColumn('t_contract_versions', 'workflow_step_id')) {
                    $table->foreignUuid('workflow_step_id')->nullable()->after('contract_id')->constrained('m_workflow_steps')->nullOnDelete();
                }
                if (! Schema::hasColumn('t_contract_versions', 'step_number')) {
                    $table->integer('step_number')->nullable()->after('workflow_step_id')->index();
                }
                if (! Schema::hasColumn('t_contract_versions', 'workflow_iteration')) {
                    $table->integer('workflow_iteration')->default(1)->after('step_number')->index();
                }
            });
        }

        if (Schema::hasTable('t_form_submissions')) {
            Schema::table('t_form_submissions', function (Blueprint $table) {
                if (! Schema::hasColumn('t_form_submissions', 'workflow_step_id')) {
                    $table->foreignUuid('workflow_step_id')->nullable()->after('contract_id')->constrained('m_workflow_steps')->nullOnDelete();
                }
                if (! Schema::hasColumn('t_form_submissions', 'step_number')) {
                    $table->integer('step_number')->nullable()->after('workflow_step_id')->index();
                }
                if (! Schema::hasColumn('t_form_submissions', 'workflow_iteration')) {
                    $table->integer('workflow_iteration')->default(1)->after('step_number')->index();
                }
            });
        }

        if (Schema::hasTable('t_form_submission_h')) {
            Schema::table('t_form_submission_h', function (Blueprint $table) {
                if (! Schema::hasColumn('t_form_submission_h', 'workflow_step_id')) {
                    $table->foreignUuid('workflow_step_id')->nullable()->after('submission_id')->constrained('m_workflow_steps')->nullOnDelete();
                }
                if (! Schema::hasColumn('t_form_submission_h', 'step_number')) {
                    $table->integer('step_number')->nullable()->after('workflow_step_id')->index();
                }
                if (! Schema::hasColumn('t_form_submission_h', 'workflow_iteration')) {
                    $table->integer('workflow_iteration')->default(1)->after('step_number')->index();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('t_contract_versions')) {
            Schema::table('t_contract_versions', function (Blueprint $table) {
                if (Schema::hasColumn('t_contract_versions', 'workflow_step_id')) {
                    $table->dropForeign(['workflow_step_id']);
                    $table->dropColumn(['workflow_step_id', 'step_number', 'workflow_iteration']);
                }
            });
        }

        if (Schema::hasTable('t_form_submissions')) {
            Schema::table('t_form_submissions', function (Blueprint $table) {
                if (Schema::hasColumn('t_form_submissions', 'workflow_step_id')) {
                    $table->dropForeign(['workflow_step_id']);
                    $table->dropColumn(['workflow_step_id', 'step_number', 'workflow_iteration']);
                }
            });
        }

        if (Schema::hasTable('t_form_submission_h')) {
            Schema::table('t_form_submission_h', function (Blueprint $table) {
                if (Schema::hasColumn('t_form_submission_h', 'workflow_step_id')) {
                    $table->dropForeign(['workflow_step_id']);
                    $table->dropColumn(['workflow_step_id', 'step_number', 'workflow_iteration']);
                }
            });
        }
    }
};
