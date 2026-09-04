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
        Schema::table('m_roles', function (Blueprint $table) {
            if (! Schema::hasColumn('m_roles', 'contract_filter_template_id')) {
                $table->uuid('contract_filter_template_id')->nullable()->after('company_id');
            }

            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->foreign('contract_filter_template_id')
                        ->references('id')
                        ->on('m_contract_filter_templates')
                        ->nullOnDelete();
                } catch (Throwable $e) {
                    // Ignore if constraint already exists
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_roles', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->dropForeign(['contract_filter_template_id']);
                } catch (Throwable $e) {
                }
            }
            if (Schema::hasColumn('m_roles', 'contract_filter_template_id')) {
                $table->dropColumn('contract_filter_template_id');
            }
        });
    }
};
