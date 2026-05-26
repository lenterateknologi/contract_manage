<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->tinyInteger('filter_department')->default(0)->index()->comment('if yes then get department initiator');
            $table->tinyInteger('filter_company_group')->default(0)->index()->comment('if yes then get company_group_from initiator');
            $table->tinyInteger('filter_region')->default(0)->index()->comment('if yes then get region initiator');
            $table->tinyInteger('filter_company')->default(0)->index()->comment('if yes then get company initiator');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_workflow_steps', function (Blueprint $table) {
            $table->dropColumn(['filter_department', 'filter_company_group', 'filter_region', 'filter_company']);
        });
    }
};
