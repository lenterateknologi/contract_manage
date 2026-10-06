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
        if (Schema::hasTable('m_dashboard_types')) {
            Schema::table('m_dashboard_types', function (Blueprint $table) {
                if (! Schema::hasColumn('m_dashboard_types', 'template_can_read')) {
                    $table->boolean('template_can_read')->default(true)->after('show_master_data');
                }
                if (! Schema::hasColumn('m_dashboard_types', 'template_can_download')) {
                    $table->boolean('template_can_download')->default(true)->after('template_can_read');
                }
                if (! Schema::hasColumn('m_dashboard_types', 'template_can_upload')) {
                    $table->boolean('template_can_upload')->default(false)->after('template_can_download');
                }
                if (! Schema::hasColumn('m_dashboard_types', 'template_can_create_folder')) {
                    $table->boolean('template_can_create_folder')->default(false)->after('template_can_upload');
                }
                if (! Schema::hasColumn('m_dashboard_types', 'template_can_edit')) {
                    $table->boolean('template_can_edit')->default(false)->after('template_can_create_folder');
                }
                if (! Schema::hasColumn('m_dashboard_types', 'template_can_toggle_visibility')) {
                    $table->boolean('template_can_toggle_visibility')->default(false)->after('template_can_edit');
                }
                if (! Schema::hasColumn('m_dashboard_types', 'template_can_delete')) {
                    $table->boolean('template_can_delete')->default(false)->after('template_can_toggle_visibility');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('m_dashboard_types')) {
            Schema::table('m_dashboard_types', function (Blueprint $table) {
                $columns = [
                    'template_can_read',
                    'template_can_download',
                    'template_can_upload',
                    'template_can_create_folder',
                    'template_can_edit',
                    'template_can_toggle_visibility',
                    'template_can_delete',
                ];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('m_dashboard_types', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
