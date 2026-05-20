<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'users',
            'contracts',
            'contract_versions',
            'contract_attachments',
            'contract_histories',
            'contract_messages',
            'workflows',
            'workflow_steps',
            'approvals',
            'departments',
            'vendors',
            'roles',
            'contract_types',
            'contract_statuses',
            'module_groups',
            'modules',
            'form_templates',
            'form_fields',
            'contract_templates',
            'template_folders',
            'contract_form_submissions',
            'contract_form_submission_versions',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    if (! Schema::hasColumn($table->getTable(), 'deleted_at')) {
                        $table->softDeletes();
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'users',
            'contracts',
            'contract_versions',
            'contract_attachments',
            'contract_histories',
            'contract_messages',
            'workflows',
            'workflow_steps',
            'approvals',
            'departments',
            'vendors',
            'roles',
            'contract_types',
            'contract_statuses',
            'module_groups',
            'modules',
            'form_templates',
            'form_fields',
            'contract_templates',
            'template_folders',
            'contract_form_submissions',
            'contract_form_submission_versions',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropSoftDeletes();
                });
            }
        }
    }
};
