<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            if (! Schema::hasColumn('m_users', 'idemployee')) {
                $table->bigInteger('idemployee')->nullable()->index();
            }
            if (! Schema::hasColumn('m_users', 'nik')) {
                $table->string('nik', 50)->nullable()->index();
            }
            if (! Schema::hasColumn('m_users', 'mobile_no')) {
                $table->string('mobile_no', 50)->nullable();
            }
            if (! Schema::hasColumn('m_users', 'idorganization')) {
                $table->bigInteger('idorganization')->nullable()->index();
            }
            if (! Schema::hasColumn('m_users', 'org_name')) {
                $table->string('org_name', 255)->nullable();
            }
            if (! Schema::hasColumn('m_users', 'idcompany')) {
                $table->bigInteger('idcompany')->nullable()->index();
            }
            if (! Schema::hasColumn('m_users', 'company_name')) {
                $table->string('company_name', 255)->nullable();
            }
            if (! Schema::hasColumn('m_users', 'idlocation')) {
                $table->bigInteger('idlocation')->nullable()->index();
            }
            if (! Schema::hasColumn('m_users', 'location_name')) {
                $table->string('location_name', 255)->nullable();
            }
            if (! Schema::hasColumn('m_users', 'idjobtitle')) {
                $table->bigInteger('idjobtitle')->nullable()->index();
            }
            if (! Schema::hasColumn('m_users', 'jobtitle_name')) {
                $table->string('jobtitle_name', 255)->nullable();
            }
            if (! Schema::hasColumn('m_users', 'idjoblevel')) {
                $table->bigInteger('idjoblevel')->nullable()->index();
            }
            if (! Schema::hasColumn('m_users', 'joblevel_name')) {
                $table->string('joblevel_name', 255)->nullable();
            }
            if (! Schema::hasColumn('m_users', 'idemployment_type')) {
                $table->bigInteger('idemployment_type')->nullable();
            }
            if (! Schema::hasColumn('m_users', 'idreporting_to')) {
                $table->bigInteger('idreporting_to')->nullable()->index();
            }
            if (! Schema::hasColumn('m_users', 'reporting_to')) {
                $table->string('reporting_to', 255)->nullable();
            }
            if (! Schema::hasColumn('m_users', 'start_date')) {
                $table->timestamp('start_date')->nullable();
            }
            if (! Schema::hasColumn('m_users', 'join_date')) {
                $table->timestamp('join_date')->nullable();
            }
            if (! Schema::hasColumn('m_users', 'modified_by_name')) {
                $table->string('modified_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_users', 'portal_modified_date')) {
                $table->timestamp('portal_modified_date')->nullable();
            }
            if (! Schema::hasColumn('m_users', 'is_used')) {
                $table->boolean('is_used')->default(false)->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            $table->dropColumn([
                'idemployee',
                'nik',
                'mobile_no',
                'idorganization',
                'org_name',
                'idcompany',
                'company_name',
                'idlocation',
                'location_name',
                'idjobtitle',
                'jobtitle_name',
                'idjoblevel',
                'joblevel_name',
                'idemployment_type',
                'idreporting_to',
                'reporting_to',
                'start_date',
                'join_date',
                'modified_by_name',
                'portal_modified_date',
                'is_used',
            ]);
        });
    }
};
