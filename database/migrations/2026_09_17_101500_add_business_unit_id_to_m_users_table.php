<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            if (! Schema::hasColumn('m_users', 'business_unit_id')) {
                $table->uuid('business_unit_id')->nullable()->after('division_id')->index();
            }
        });

        // Backfill business_unit_id in m_users matching on company and location in PostgreSQL
        DB::statement("
            UPDATE m_users
            SET business_unit_id = m_business_units.id
            FROM m_business_units
            WHERE (
                (m_users.idcompany IS NOT NULL AND m_users.idlocation IS NOT NULL AND m_users.idcompany = m_business_units.idcompany AND m_users.idlocation = m_business_units.idlocation)
                OR (m_users.company_id IS NOT NULL AND m_users.location_id IS NOT NULL AND m_users.company_id = m_business_units.company_id AND m_users.location_id = m_business_units.location_id)
            )
            AND m_users.business_unit_id IS NULL
        ");
    }

    public function down(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            if (Schema::hasColumn('m_users', 'business_unit_id')) {
                $table->dropColumn('business_unit_id');
            }
        });
    }
};
