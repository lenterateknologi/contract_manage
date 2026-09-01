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
            // ponytail: drop fields not present in portal (description, id_portal_master, raw_portal_data)
            $columnsToDrop = [];
            if (Schema::hasColumn('m_regions', 'description')) {
                $columnsToDrop[] = 'description';
            }
            if (Schema::hasColumn('m_regions', 'id_portal_master')) {
                $columnsToDrop[] = 'id_portal_master';
            }
            if (Schema::hasColumn('m_regions', 'raw_portal_data')) {
                $columnsToDrop[] = 'raw_portal_data';
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_regions', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->string('id_portal_master')->nullable();
            $table->jsonb('raw_portal_data')->nullable();
        });
    }
};
