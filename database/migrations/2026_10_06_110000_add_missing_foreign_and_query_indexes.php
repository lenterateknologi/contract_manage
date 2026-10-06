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
        // 1. Transaction Tables
        if (Schema::hasTable('t_attachments')) {
            Schema::table('t_attachments', function (Blueprint $table) {
                if (Schema::hasColumn('t_attachments', 'contract_id')) {
                    $table->index('contract_id', 'idx_attachments_contract_id');
                }
                if (Schema::hasColumn('t_attachments', 'uploaded_by')) {
                    $table->index('uploaded_by', 'idx_attachments_uploaded_by');
                }
            });
        }

        if (Schema::hasTable('t_messages')) {
            Schema::table('t_messages', function (Blueprint $table) {
                if (Schema::hasColumn('t_messages', 'contract_id')) {
                    $table->index('contract_id', 'idx_messages_contract_id');
                }
                if (Schema::hasColumn('t_messages', 'user_id')) {
                    $table->index('user_id', 'idx_messages_user_id');
                }
            });
        }

        if (Schema::hasTable('t_contract_versions')) {
            Schema::table('t_contract_versions', function (Blueprint $table) {
                if (Schema::hasColumn('t_contract_versions', 'uploaded_by')) {
                    $table->index('uploaded_by', 'idx_contract_versions_uploaded_by');
                }
            });
        }

        if (Schema::hasTable('t_contracts')) {
            Schema::table('t_contracts', function (Blueprint $table) {
                if (Schema::hasColumn('t_contracts', 'origin_workflow_step_id')) {
                    $table->index('origin_workflow_step_id', 'idx_contracts_origin_wf_step_id');
                }
            });
        }

        // 2. Master Data & Workflow Tables
        if (Schema::hasTable('m_companies')) {
            Schema::table('m_companies', function (Blueprint $table) {
                if (Schema::hasColumn('m_companies', 'company_group_id')) {
                    $table->index('company_group_id', 'idx_companies_company_group_id');
                }
                if (Schema::hasColumn('m_companies', 'region_id')) {
                    $table->index('region_id', 'idx_companies_region_id');
                }
            });
        }

        if (Schema::hasTable('m_departments')) {
            Schema::table('m_departments', function (Blueprint $table) {
                if (Schema::hasColumn('m_departments', 'company_id')) {
                    $table->index('company_id', 'idx_departments_company_id');
                }
            });
        }

        if (Schema::hasTable('m_form_fields')) {
            Schema::table('m_form_fields', function (Blueprint $table) {
                if (Schema::hasColumn('m_form_fields', 'form_template_id')) {
                    $table->index('form_template_id', 'idx_form_fields_form_template_id');
                }
            });
        }

        if (Schema::hasTable('m_form_templates')) {
            Schema::table('m_form_templates', function (Blueprint $table) {
                if (Schema::hasColumn('m_form_templates', 'contract_type_id')) {
                    $table->index('contract_type_id', 'idx_form_templates_contract_type_id');
                }
            });
        }

        if (Schema::hasTable('m_contract_templates')) {
            Schema::table('m_contract_templates', function (Blueprint $table) {
                if (Schema::hasColumn('m_contract_templates', 'template_folder_id')) {
                    $table->index('template_folder_id', 'idx_contract_templates_folder_id');
                }
            });
        }

        if (Schema::hasTable('m_workflow_step_actions')) {
            Schema::table('m_workflow_step_actions', function (Blueprint $table) {
                if (Schema::hasColumn('m_workflow_step_actions', 'workflow_step_id')) {
                    $table->index('workflow_step_id', 'idx_wf_step_actions_step_id');
                }
                if (Schema::hasColumn('m_workflow_step_actions', 'next_step_id')) {
                    $table->index('next_step_id', 'idx_wf_step_actions_next_step_id');
                }
                if (Schema::hasColumn('m_workflow_step_actions', 'next_workflow_id')) {
                    $table->index('next_workflow_id', 'idx_wf_step_actions_next_wf_id');
                }
            });
        }

        if (Schema::hasTable('m_workflows')) {
            Schema::table('m_workflows', function (Blueprint $table) {
                if (Schema::hasColumn('m_workflows', 'department_id')) {
                    $table->index('department_id', 'idx_workflows_department_id');
                }
            });
        }

        if (Schema::hasTable('m_workflow_steps')) {
            Schema::table('m_workflow_steps', function (Blueprint $table) {
                if (Schema::hasColumn('m_workflow_steps', 'role_id')) {
                    $table->index('role_id', 'idx_wf_steps_role_id');
                }
            });
        }

        if (Schema::hasTable('m_job_titles')) {
            Schema::table('m_job_titles', function (Blueprint $table) {
                if (Schema::hasColumn('m_job_titles', 'job_level_id')) {
                    $table->index('job_level_id', 'idx_job_titles_job_level_id');
                }
            });
        }

        if (Schema::hasTable('m_access_modules')) {
            Schema::table('m_access_modules', function (Blueprint $table) {
                if (Schema::hasColumn('m_access_modules', 'role_id')) {
                    $table->index('role_id', 'idx_access_modules_role_id');
                }
                if (Schema::hasColumn('m_access_modules', 'module_id')) {
                    $table->index('module_id', 'idx_access_modules_module_id');
                }
            });
        }

        if (Schema::hasTable('m_role_module_groups')) {
            Schema::table('m_role_module_groups', function (Blueprint $table) {
                if (Schema::hasColumn('m_role_module_groups', 'role_id')) {
                    $table->index('role_id', 'idx_role_mod_groups_role_id');
                }
                if (Schema::hasColumn('m_role_module_groups', 'module_group_id')) {
                    $table->index('module_group_id', 'idx_role_mod_groups_mod_grp_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('t_attachments')) {
            Schema::table('t_attachments', function (Blueprint $table) {
                $table->dropIndex('idx_attachments_contract_id');
                $table->dropIndex('idx_attachments_uploaded_by');
            });
        }

        if (Schema::hasTable('t_messages')) {
            Schema::table('t_messages', function (Blueprint $table) {
                $table->dropIndex('idx_messages_contract_id');
                $table->dropIndex('idx_messages_user_id');
            });
        }

        if (Schema::hasTable('t_contract_versions')) {
            Schema::table('t_contract_versions', function (Blueprint $table) {
                $table->dropIndex('idx_contract_versions_uploaded_by');
            });
        }

        if (Schema::hasTable('t_contracts')) {
            Schema::table('t_contracts', function (Blueprint $table) {
                $table->dropIndex('idx_contracts_origin_wf_step_id');
            });
        }

        if (Schema::hasTable('m_companies')) {
            Schema::table('m_companies', function (Blueprint $table) {
                $table->dropIndex('idx_companies_company_group_id');
                $table->dropIndex('idx_companies_region_id');
            });
        }

        if (Schema::hasTable('m_departments')) {
            Schema::table('m_departments', function (Blueprint $table) {
                $table->dropIndex('idx_departments_company_id');
            });
        }

        if (Schema::hasTable('m_form_fields')) {
            Schema::table('m_form_fields', function (Blueprint $table) {
                $table->dropIndex('idx_form_fields_form_template_id');
            });
        }

        if (Schema::hasTable('m_form_templates')) {
            Schema::table('m_form_templates', function (Blueprint $table) {
                $table->dropIndex('idx_form_templates_contract_type_id');
            });
        }

        if (Schema::hasTable('m_contract_templates')) {
            Schema::table('m_contract_templates', function (Blueprint $table) {
                $table->dropIndex('idx_contract_templates_folder_id');
            });
        }

        if (Schema::hasTable('m_workflow_step_actions')) {
            Schema::table('m_workflow_step_actions', function (Blueprint $table) {
                $table->dropIndex('idx_wf_step_actions_step_id');
                $table->dropIndex('idx_wf_step_actions_next_step_id');
                $table->dropIndex('idx_wf_step_actions_next_wf_id');
            });
        }

        if (Schema::hasTable('m_workflows')) {
            Schema::table('m_workflows', function (Blueprint $table) {
                $table->dropIndex('idx_workflows_department_id');
            });
        }

        if (Schema::hasTable('m_workflow_steps')) {
            Schema::table('m_workflow_steps', function (Blueprint $table) {
                $table->dropIndex('idx_wf_steps_role_id');
            });
        }

        if (Schema::hasTable('m_job_titles')) {
            Schema::table('m_job_titles', function (Blueprint $table) {
                $table->dropIndex('idx_job_titles_job_level_id');
            });
        }

        if (Schema::hasTable('m_access_modules')) {
            Schema::table('m_access_modules', function (Blueprint $table) {
                $table->dropIndex('idx_access_modules_role_id');
                $table->dropIndex('idx_access_modules_module_id');
            });
        }

        if (Schema::hasTable('m_role_module_groups')) {
            Schema::table('m_role_module_groups', function (Blueprint $table) {
                $table->dropIndex('idx_role_mod_groups_role_id');
                $table->dropIndex('idx_role_mod_groups_mod_grp_id');
            });
        }
    }
};
