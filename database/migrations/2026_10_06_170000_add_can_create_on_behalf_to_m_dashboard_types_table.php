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
        Schema::table('m_dashboard_types', function (Blueprint $table) {
            if (! Schema::hasColumn('m_dashboard_types', 'can_create_on_behalf')) {
                $table->boolean('can_create_on_behalf')->default(false)->after('template_can_delete');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_dashboard_types', function (Blueprint $table) {
            if (Schema::hasColumn('m_dashboard_types', 'can_create_on_behalf')) {
                $table->dropColumn('can_create_on_behalf');
            }
        });
    }
};
