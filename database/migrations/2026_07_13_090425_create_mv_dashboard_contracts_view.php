<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $isSqlite = DB::getDriverName() === 'sqlite';
        $viewType = $isSqlite ? 'VIEW' : 'MATERIALIZED VIEW';

        DB::statement("
            CREATE {$viewType} mv_dashboard_contracts AS
            SELECT 
                c.id,
                c.form_no,
                c.contract_no,
                c.title,
                c.status,
                c.created_by,
                c.initiated_by_id,
                c.assigned_pic_id,
                c.contract_type_id,
                c.submission_type_id,
                c.vendor_id,
                c.parent_id,
                c.contract_date,
                c.end_date,
                c.created_at,
                c.updated_at,
                c.deleted_at,
                m.f2_price,
                init_u.company_id as initiator_company_id,
                init_u.department_id as initiator_department_id,
                creator_u.company_id as creator_company_id,
                creator_u.department_id as creator_department_id,
                init_c.region_id as initiator_region_id,
                creator_c.region_id as creator_region_id,
                init_c.company_group_id as initiator_company_group_id,
                creator_c.company_group_id as creator_company_group_id,
                creator_u.name as creator_name,
                init_u.name as initiator_name,
                ct.name as contract_type_name,
                v.name as vendor_name,
                init_d.name as initiator_department_name,
                creator_d.name as creator_department_name
            FROM t_contracts c
            LEFT JOIN t_contract_meta m ON c.id = m.contract_id
            LEFT JOIN m_users init_u ON c.initiated_by_id = init_u.id
            LEFT JOIN m_users creator_u ON c.created_by = creator_u.id
            LEFT JOIN m_companies init_c ON init_u.company_id = init_c.id
            LEFT JOIN m_companies creator_c ON creator_u.company_id = creator_c.id
            LEFT JOIN m_departments init_d ON init_u.department_id = init_d.id
            LEFT JOIN m_departments creator_d ON creator_u.department_id = creator_d.id
            LEFT JOIN m_contract_types ct ON c.contract_type_id = ct.id
            LEFT JOIN m_vendors v ON c.vendor_id = v.id
            WHERE c.deleted_at IS NULL
        ");

        if (! $isSqlite) {
            // ponytail: Create indexes to optimize queries on the materialized view
            DB::statement('CREATE UNIQUE INDEX mv_dashboard_contracts_id ON mv_dashboard_contracts (id)');
            DB::statement('CREATE INDEX mv_dashboard_contracts_status ON mv_dashboard_contracts (status)');
            DB::statement('CREATE INDEX mv_dashboard_contracts_created_at ON mv_dashboard_contracts (created_at)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $isSqlite = DB::getDriverName() === 'sqlite';
        $viewType = $isSqlite ? 'VIEW' : 'MATERIALIZED VIEW';
        DB::statement("DROP {$viewType} IF EXISTS mv_dashboard_contracts");
    }
};
