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
        Schema::table('m_departments', function (Blueprint $table) {
            // ponytail: add fields from Portal Organization master
            if (! Schema::hasColumn('m_departments', 'idorganization')) {
                $table->bigInteger('idorganization')->nullable()->index();
            }
            if (! Schema::hasColumn('m_departments', 'idorg_group')) {
                $table->bigInteger('idorg_group')->nullable()->index();
            }
            if (! Schema::hasColumn('m_departments', 'org_group_name')) {
                $table->string('org_group_name', 255)->nullable();
            }
            if (! Schema::hasColumn('m_departments', 'idorg_level')) {
                $table->bigInteger('idorg_level')->nullable()->index();
            }
            if (! Schema::hasColumn('m_departments', 'org_level_name')) {
                $table->string('org_level_name', 100)->nullable();
            }
            if (! Schema::hasColumn('m_departments', 'created_by_name')) {
                $table->string('created_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_departments', 'modified_by_name')) {
                $table->string('modified_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_departments', 'portal_created_date')) {
                $table->timestamp('portal_created_date')->nullable();
            }
            if (! Schema::hasColumn('m_departments', 'portal_modified_date')) {
                $table->timestamp('portal_modified_date')->nullable();
            }
            if (! Schema::hasColumn('m_departments', 'is_used')) {
                $table->boolean('is_used')->default(false)->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_departments', function (Blueprint $table) {
            $table->dropColumn([
                'idorganization',
                'idorg_group',
                'org_group_name',
                'idorg_level',
                'org_level_name',
                'created_by_name',
                'modified_by_name',
                'portal_created_date',
                'portal_modified_date',
                'is_used',
            ]);
        });
    }
};
