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
        Schema::table('m_locations', function (Blueprint $table) {
            $table->uuid('company_group_id')->nullable()->after('name')->index();
            $table->string('company_group_name')->nullable()->after('company_group_id');
            $table->integer('idcompany_group')->nullable()->after('company_group_name');

            $table->foreign('company_group_id')->references('id')->on('m_company_groups')->nullOnDelete();
        });

        // Backfill company_group_id from m_business_units where location is matched
        \Illuminate\Support\Facades\DB::statement("
            UPDATE m_locations
            SET company_group_id = sub.company_group_id,
                company_group_name = sub.company_group_name,
                idcompany_group = sub.idcompany_group
            FROM (
                SELECT DISTINCT ON (location_id) location_id, company_group_id, company_group_name, idcompany_group
                FROM m_business_units
                WHERE location_id IS NOT NULL AND company_group_id IS NOT NULL
                ORDER BY location_id, created_at DESC
            ) AS sub
            WHERE m_locations.id = sub.location_id
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_locations', function (Blueprint $table) {
            $table->dropForeign(['company_group_id']);
            $table->dropColumn(['company_group_id', 'company_group_name', 'idcompany_group']);
        });
    }
};
