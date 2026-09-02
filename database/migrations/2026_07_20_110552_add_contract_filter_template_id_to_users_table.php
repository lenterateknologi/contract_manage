<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Column contract_filter_template_id already exists in m_users,
        // only add foreign key constraint if not already present.
        Schema::table('m_users', function (Blueprint $table) {
            if (! Schema::hasColumn('m_users', 'contract_filter_template_id')) {
                $table->uuid('contract_filter_template_id')->nullable()->after('id');
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

    public function down(): void
    {
        Schema::table('m_users', function (Blueprint $table) {
            $table->dropForeignIfExists('contract_filter_template_id');
            if (Schema::hasColumn('m_users', 'contract_filter_template_id')) {
                $table->dropColumn('contract_filter_template_id');
            }
        });
    }
};
