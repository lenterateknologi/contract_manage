<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::dropIfExists('m_vendor_taxes');
            Schema::dropIfExists('m_vendor_legalities');
            Schema::dropIfExists('m_vendor_payment_methods');
            Schema::dropIfExists('m_vendor_banks');
            Schema::dropIfExists('m_vendor_business_fields');
            Schema::dropIfExists('m_vendor_documents');

            Schema::dropIfExists('m_vendors');

            Schema::create('m_vendors', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('vendor_code')->unique();
                $table->string('vendor_name');
                $table->json('vendor_detail')->nullable();
                $table->boolean('is_active')->default(true);
                $table->uuid('created_by')->nullable();
                $table->uuid('updated_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });

            return;
        }

        // 1. Drop materialized view & legacy vendor tables
        DB::statement('DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_contracts');

        Schema::dropIfExists('m_vendor_taxes');
        Schema::dropIfExists('m_vendor_legalities');
        Schema::dropIfExists('m_vendor_payment_methods');
        Schema::dropIfExists('m_vendor_banks');
        Schema::dropIfExists('m_vendor_business_fields');
        Schema::dropIfExists('m_vendor_documents');

        // 2. Re-create / Restructure tabel m_vendors dengan CASCADE
        DB::statement('DROP TABLE IF EXISTS m_vendors CASCADE');

        Schema::create('m_vendors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('vendor_code')->unique();
            $table->string('vendor_name');
            $table->jsonb('vendor_detail')->nullable(); // ponytail: single json column for detail payload
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Re-create materialized view mv_dashboard_contracts using vendor_name column
        DB::statement('
            CREATE MATERIALIZED VIEW mv_dashboard_contracts AS
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
                v.vendor_name as vendor_name,
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
        ');

        DB::statement('CREATE UNIQUE INDEX mv_dashboard_contracts_id ON mv_dashboard_contracts (id)');
        DB::statement('CREATE INDEX mv_dashboard_contracts_status ON mv_dashboard_contracts (status)');
        DB::statement('CREATE INDEX mv_dashboard_contracts_created_at ON mv_dashboard_contracts (created_at)');
    }

    public function down(): void
    {
        Schema::dropIfExists('m_vendors');
    }
};
