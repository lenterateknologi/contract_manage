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
        Schema::table('t_approvals', function (Blueprint $table) {
            if (! Schema::hasColumn('t_approvals', 'approver_name')) {
                $table->string('approver_name')->nullable();
                $table->string('role')->nullable();
                $table->string('job_title')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_approvals', function (Blueprint $table) {
            $table->dropColumn(['approver_name', 'role', 'job_title']);
        });
    }
};
