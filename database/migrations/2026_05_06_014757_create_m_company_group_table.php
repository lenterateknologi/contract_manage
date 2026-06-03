<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('DROP TABLE IF EXISTS m_company_group CASCADE');
        } else {
            Schema::dropIfExists('m_company_group');
        }
        Schema::create('m_company_group', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique()->index();
            $table->integer('id_portal_master')->index();
            $table->string('name', 255);
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('created_at')->nullable()->index()->useCurrent();
            $table->string('created_by', 36)->nullable()->index()->comment('can be filled with UUID or username');
            $table->timestamp('updated_at')->nullable()->index();
            $table->string('updated_by', 36)->nullable()->index()->comment('can be filled with UUID or username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_group');
    }
};
