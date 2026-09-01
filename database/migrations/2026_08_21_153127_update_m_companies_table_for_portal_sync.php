<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('m_companies', function (Blueprint $table) {
            if (! Schema::hasColumn('m_companies', 'idcompany')) {
                $table->bigInteger('idcompany')->nullable()->index();
            }
            if (! Schema::hasColumn('m_companies', 'npwp')) {
                $table->string('npwp', 50)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'idcompany_group')) {
                $table->bigInteger('idcompany_group')->nullable()->index();
            }
            if (! Schema::hasColumn('m_companies', 'company_group_name')) {
                $table->string('company_group_name', 255)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'idcountry')) {
                $table->bigInteger('idcountry')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'country_name')) {
                $table->string('country_name', 100)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'idprovince')) {
                $table->bigInteger('idprovince')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'province_name')) {
                $table->string('province_name', 100)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'idcity')) {
                $table->bigInteger('idcity')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'city_name')) {
                $table->string('city_name', 100)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'idsub_district')) {
                $table->bigInteger('idsub_district')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'sub_district_name')) {
                $table->string('sub_district_name', 100)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'idvillage')) {
                $table->bigInteger('idvillage')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'village_name')) {
                $table->string('village_name', 100)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'zip_code')) {
                $table->string('zip_code', 20)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'phone')) {
                $table->string('phone', 50)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'fax')) {
                $table->string('fax', 50)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'email')) {
                $table->string('email', 150)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'oracle_code')) {
                $table->string('oracle_code', 50)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'idregion')) {
                $table->bigInteger('idregion')->nullable()->index();
            }
            if (! Schema::hasColumn('m_companies', 'region_name')) {
                $table->string('region_name', 150)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'reg_no')) {
                $table->string('reg_no', 100)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'bank_account')) {
                $table->string('bank_account', 100)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'npp')) {
                $table->string('npp', 100)->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'created_by_name')) {
                $table->string('created_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'modified_by_name')) {
                $table->string('modified_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'portal_created_date')) {
                $table->timestamp('portal_created_date')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'portal_modified_date')) {
                $table->timestamp('portal_modified_date')->nullable();
            }
            if (! Schema::hasColumn('m_companies', 'is_used')) {
                $table->boolean('is_used')->default(false)->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_companies', function (Blueprint $table) {
            $table->dropColumn([
                'idcompany',
                'npwp',
                'idcompany_group',
                'company_group_name',
                'idcountry',
                'country_name',
                'idprovince',
                'province_name',
                'idcity',
                'city_name',
                'idsub_district',
                'sub_district_name',
                'idvillage',
                'village_name',
                'zip_code',
                'phone',
                'fax',
                'email',
                'oracle_code',
                'idregion',
                'region_name',
                'reg_no',
                'bank_account',
                'npp',
                'created_by_name',
                'modified_by_name',
                'portal_created_date',
                'portal_modified_date',
                'is_used',
            ]);
        });
    }
};
