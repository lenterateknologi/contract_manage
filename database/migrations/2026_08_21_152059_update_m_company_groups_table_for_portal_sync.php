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
        Schema::table('m_company_groups', function (Blueprint $table) {
            // ponytail: add fields from Portal master for company group
            if (! Schema::hasColumn('m_company_groups', 'idcompany_group')) {
                $table->bigInteger('idcompany_group')->nullable()->index();
            }
            if (! Schema::hasColumn('m_company_groups', 'created_by_name')) {
                $table->string('created_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_company_groups', 'modified_by_name')) {
                $table->string('modified_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_company_groups', 'portal_created_date')) {
                $table->timestamp('portal_created_date')->nullable();
            }
            if (! Schema::hasColumn('m_company_groups', 'portal_modified_date')) {
                $table->timestamp('portal_modified_date')->nullable();
            }
            if (! Schema::hasColumn('m_company_groups', 'is_used')) {
                $table->boolean('is_used')->default(false)->index();
            }

            // Drop columns not in portal
            if (Schema::hasColumn('m_company_groups', 'description')) {
                $table->dropColumn('description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_company_groups', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->dropColumn([
                'idcompany_group',
                'created_by_name',
                'modified_by_name',
                'portal_created_date',
                'portal_modified_date',
                'is_used',
            ]);
        });
    }
};
