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
            $table->jsonb('role_ids')->nullable()->after('role_id');
            $table->jsonb('division_ids')->nullable()->after('division_id');
            $table->jsonb('department_ids')->nullable()->after('department_id');
        });

        // Migrate existing single columns data to array
        $records = \Illuminate\Support\Facades\DB::table('m_dashboard_types')->get();
        foreach ($records as $r) {
            \Illuminate\Support\Facades\DB::table('m_dashboard_types')->where('id', $r->id)->update([
                'role_ids' => $r->role_id ? json_encode([$r->role_id]) : '[]',
                'division_ids' => $r->division_id ? json_encode([$r->division_id]) : '[]',
                'department_ids' => $r->department_id ? json_encode([$r->department_id]) : '[]',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_dashboard_types', function (Blueprint $table) {
            $table->dropColumn(['role_ids', 'division_ids', 'department_ids']);
        });
    }
};
