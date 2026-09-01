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
        Schema::table('m_regions', function (Blueprint $table) {
            // ponytail: add fields from Portal master and is_used flag
            if (! Schema::hasColumn('m_regions', 'idregion')) {
                $table->bigInteger('idregion')->nullable()->index();
            }
            if (! Schema::hasColumn('m_regions', 'region_ad')) {
                $table->string('region_ad')->nullable();
            }
            if (! Schema::hasColumn('m_regions', 'created_by_name')) {
                $table->string('created_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_regions', 'modified_by_name')) {
                $table->string('modified_by_name')->nullable();
            }
            if (! Schema::hasColumn('m_regions', 'portal_created_date')) {
                $table->timestamp('portal_created_date')->nullable();
            }
            if (! Schema::hasColumn('m_regions', 'portal_modified_date')) {
                $table->timestamp('portal_modified_date')->nullable();
            }
            if (! Schema::hasColumn('m_regions', 'is_used')) {
                $table->boolean('is_used')->default(true)->index();
            }
            if (! Schema::hasColumn('m_regions', 'raw_portal_data')) {
                $table->jsonb('raw_portal_data')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_regions', function (Blueprint $table) {
            $table->dropColumn([
                'idregion',
                'region_ad',
                'created_by_name',
                'modified_by_name',
                'portal_created_date',
                'portal_modified_date',
                'is_used',
                'raw_portal_data',
            ]);
        });
    }
};
