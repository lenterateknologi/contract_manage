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
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->boolean('is_digital_signature')->default(false)->after('status');
        });

        Schema::table('t_approvals', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('comment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropColumn('is_digital_signature');
        });

        Schema::table('t_approvals', function (Blueprint $table) {
            $table->dropColumn('attachment_path');
        });
    }
};
