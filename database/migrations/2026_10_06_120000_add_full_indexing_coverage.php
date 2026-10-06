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
        if (Schema::hasTable('m_access_modules') && Schema::hasColumn('m_access_modules', 'module_group_id')) {
            Schema::table('m_access_modules', fn (Blueprint $table) => $table->index('module_group_id', 'idx_access_modules_mod_grp_id'));
        }

        if (Schema::hasTable('m_contract_sla_configs')) {
            Schema::table('m_contract_sla_configs', function (Blueprint $table) {
                if (Schema::hasColumn('m_contract_sla_configs', 'workflow_id')) {
                    $table->index('workflow_id', 'idx_sla_configs_wf_id');
                }
                if (Schema::hasColumn('m_contract_sla_configs', 'created_by')) {
                    $table->index('created_by', 'idx_sla_configs_created_by');
                }
                if (Schema::hasColumn('m_contract_sla_configs', 'updated_by')) {
                    $table->index('updated_by', 'idx_sla_configs_updated_by');
                }
            });
        }

        if (Schema::hasTable('m_contract_sla_step_items') && Schema::hasColumn('m_contract_sla_step_items', 'workflow_step_id')) {
            Schema::table('m_contract_sla_step_items', fn (Blueprint $table) => $table->index('workflow_step_id', 'idx_sla_step_items_wf_step_id'));
        }

        if (Schema::hasTable('m_contract_types')) {
            Schema::table('m_contract_types', function (Blueprint $table) {
                if (Schema::hasColumn('m_contract_types', 'contract_form_template_id')) {
                    $table->index('contract_form_template_id', 'idx_contract_types_form_tmpl_id');
                }
                if (Schema::hasColumn('m_contract_types', 'f1_form_template_id')) {
                    $table->index('f1_form_template_id', 'idx_contract_types_f1_tmpl_id');
                }
                if (Schema::hasColumn('m_contract_types', 'f2_form_template_id')) {
                    $table->index('f2_form_template_id', 'idx_contract_types_f2_tmpl_id');
                }
                if (Schema::hasColumn('m_contract_types', 'f1_contract_template_id')) {
                    $table->index('f1_contract_template_id', 'idx_contract_types_f1_doc_tmpl_id');
                }
                if (Schema::hasColumn('m_contract_types', 'f2_contract_template_id')) {
                    $table->index('f2_contract_template_id', 'idx_contract_types_f2_doc_tmpl_id');
                }
            });
        }

        if (Schema::hasTable('m_form_fields') && Schema::hasColumn('m_form_fields', 'parent_id')) {
            Schema::table('m_form_fields', fn (Blueprint $table) => $table->index('parent_id', 'idx_form_fields_parent_id'));
        }

        if (Schema::hasTable('m_job_levels') && Schema::hasColumn('m_job_levels', 'job_level_group_id')) {
            Schema::table('m_job_levels', fn (Blueprint $table) => $table->index('job_level_group_id', 'idx_job_levels_group_id'));
        }

        if (Schema::hasTable('m_modules') && Schema::hasColumn('m_modules', 'module_group_id')) {
            Schema::table('m_modules', fn (Blueprint $table) => $table->index('module_group_id', 'idx_modules_group_id'));
        }

        if (Schema::hasTable('m_roles') && Schema::hasColumn('m_roles', 'company_id')) {
            Schema::table('m_roles', fn (Blueprint $table) => $table->index('company_id', 'idx_roles_company_id'));
        }

        if (Schema::hasTable('m_template_folders') && Schema::hasColumn('m_template_folders', 'parent_id')) {
            Schema::table('m_template_folders', fn (Blueprint $table) => $table->index('parent_id', 'idx_template_folders_parent_id'));
        }

        if (Schema::hasTable('m_workflow_step_actions') && Schema::hasColumn('m_workflow_step_actions', 'next_workflow_step_id')) {
            Schema::table('m_workflow_step_actions', fn (Blueprint $table) => $table->index('next_workflow_step_id', 'idx_wf_step_actions_next_wstep_id'));
        }

        if (Schema::hasTable('m_workflow_step_presets') && Schema::hasColumn('m_workflow_step_presets', 'created_by_user_id')) {
            Schema::table('m_workflow_step_presets', fn (Blueprint $table) => $table->index('created_by_user_id', 'idx_wf_presets_user_id'));
        }

        if (Schema::hasTable('t_approvals')) {
            Schema::table('t_approvals', function (Blueprint $table) {
                if (Schema::hasColumn('t_approvals', 'created_by')) {
                    $table->index('created_by', 'idx_approvals_created_by');
                }
                if (Schema::hasColumn('t_approvals', 'updated_by')) {
                    $table->index('updated_by', 'idx_approvals_updated_by');
                }
            });
        }

        if (Schema::hasTable('t_contract_sla_logs')) {
            Schema::table('t_contract_sla_logs', function (Blueprint $table) {
                if (Schema::hasColumn('t_contract_sla_logs', 'assigned_user_id')) {
                    $table->index('assigned_user_id', 'idx_sla_logs_user_id');
                }
                if (Schema::hasColumn('t_contract_sla_logs', 'workflow_step_id')) {
                    $table->index('workflow_step_id', 'idx_sla_logs_wf_step_id');
                }
            });
        }

        if (Schema::hasTable('t_forgot_password') && Schema::hasColumn('t_forgot_password', 'user_id')) {
            Schema::table('t_forgot_password', fn (Blueprint $table) => $table->index('user_id', 'idx_forgot_password_user_id'));
        }

        if (Schema::hasTable('t_form_submission_h') && Schema::hasColumn('t_form_submission_h', 'created_by')) {
            Schema::table('t_form_submission_h', fn (Blueprint $table) => $table->index('created_by', 'idx_form_sub_h_created_by'));
        }

        if (Schema::hasTable('t_form_submissions')) {
            Schema::table('t_form_submissions', function (Blueprint $table) {
                if (Schema::hasColumn('t_form_submissions', 'form_template_id')) {
                    $table->index('form_template_id', 'idx_form_submissions_template_id');
                }
                if (Schema::hasColumn('t_form_submissions', 'submitted_by')) {
                    $table->index('submitted_by', 'idx_form_submissions_submitted_by');
                }
            });
        }

        if (Schema::hasTable('t_submission_reviews') && Schema::hasColumn('t_submission_reviews', 'user_id')) {
            Schema::table('t_submission_reviews', fn (Blueprint $table) => $table->index('user_id', 'idx_submission_reviews_user_id'));
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('m_access_modules')) {
            Schema::table('m_access_modules', fn (Blueprint $table) => $table->dropIndex('idx_access_modules_mod_grp_id'));
        }
        if (Schema::hasTable('m_contract_sla_configs')) {
            Schema::table('m_contract_sla_configs', function (Blueprint $table) {
                $table->dropIndex('idx_sla_configs_wf_id');
                $table->dropIndex('idx_sla_configs_created_by');
                $table->dropIndex('idx_sla_configs_updated_by');
            });
        }
        if (Schema::hasTable('m_contract_sla_step_items')) {
            Schema::table('m_contract_sla_step_items', fn (Blueprint $table) => $table->dropIndex('idx_sla_step_items_wf_step_id'));
        }
        if (Schema::hasTable('m_contract_types')) {
            Schema::table('m_contract_types', function (Blueprint $table) {
                $table->dropIndex('idx_contract_types_form_tmpl_id');
                $table->dropIndex('idx_contract_types_f1_tmpl_id');
                $table->dropIndex('idx_contract_types_f2_tmpl_id');
                $table->dropIndex('idx_contract_types_f1_doc_tmpl_id');
                $table->dropIndex('idx_contract_types_f2_doc_tmpl_id');
            });
        }
        if (Schema::hasTable('m_form_fields')) {
            Schema::table('m_form_fields', fn (Blueprint $table) => $table->dropIndex('idx_form_fields_parent_id'));
        }
        if (Schema::hasTable('m_job_levels')) {
            Schema::table('m_job_levels', fn (Blueprint $table) => $table->dropIndex('idx_job_levels_group_id'));
        }
        if (Schema::hasTable('m_modules')) {
            Schema::table('m_modules', fn (Blueprint $table) => $table->dropIndex('idx_modules_group_id'));
        }
        if (Schema::hasTable('m_roles')) {
            Schema::table('m_roles', fn (Blueprint $table) => $table->dropIndex('idx_roles_company_id'));
        }
        if (Schema::hasTable('m_template_folders')) {
            Schema::table('m_template_folders', fn (Blueprint $table) => $table->dropIndex('idx_template_folders_parent_id'));
        }
        if (Schema::hasTable('m_workflow_step_actions')) {
            Schema::table('m_workflow_step_actions', fn (Blueprint $table) => $table->dropIndex('idx_wf_step_actions_next_wstep_id'));
        }
        if (Schema::hasTable('m_workflow_step_presets')) {
            Schema::table('m_workflow_step_presets', fn (Blueprint $table) => $table->dropIndex('idx_wf_presets_user_id'));
        }
        if (Schema::hasTable('t_approvals')) {
            Schema::table('t_approvals', function (Blueprint $table) {
                $table->dropIndex('idx_approvals_created_by');
                $table->dropIndex('idx_approvals_updated_by');
            });
        }
        if (Schema::hasTable('t_contract_sla_logs')) {
            Schema::table('t_contract_sla_logs', function (Blueprint $table) {
                $table->dropIndex('idx_sla_logs_user_id');
                $table->dropIndex('idx_sla_logs_wf_step_id');
            });
        }
        if (Schema::hasTable('t_forgot_password')) {
            Schema::table('t_forgot_password', fn (Blueprint $table) => $table->dropIndex('idx_forgot_password_user_id'));
        }
        if (Schema::hasTable('t_form_submission_h')) {
            Schema::table('t_form_submission_h', fn (Blueprint $table) => $table->dropIndex('idx_form_sub_h_created_by'));
        }
        if (Schema::hasTable('t_form_submissions')) {
            Schema::table('t_form_submissions', function (Blueprint $table) {
                $table->dropIndex('idx_form_submissions_template_id');
                $table->dropIndex('idx_form_submissions_submitted_by');
            });
        }
        if (Schema::hasTable('t_submission_reviews')) {
            Schema::table('t_submission_reviews', fn (Blueprint $table) => $table->dropIndex('idx_submission_reviews_user_id'));
        }
    }
};
