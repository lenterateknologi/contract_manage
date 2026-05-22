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
            $table->dateTime('received_at')->nullable()->index();
            $table->dateTime('assigned_at')->nullable()->index();
            $table->dateTime('finished_at')->nullable()->index();
            $table->dateTime('closed_at')->nullable()->index();
            $table->uuid('closed_by')->nullable()->index();
            $table->uuid('origin_workflow_id')->nullable()->index()->comment('Workflow sebelumnya jika diubah dari workflow lain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropColumn(['received_at', 'assigned_at', 'finished_at', 'closed_at', 'closed_by', 'origin_workflow_id']);
        });
    }
};
