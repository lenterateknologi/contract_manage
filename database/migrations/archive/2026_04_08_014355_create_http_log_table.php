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
       DB::connection('log')->statement('DROP TABLE IF EXISTS t_http_log CASCADE');
       Schema::connection('log')->create('t_http_log', function (Blueprint $table) {  
            $table->bigInteger('id');
            $table->string('method',7)->index()->default('GET');
            $table->text('full_url')->nullable();
            $table->string('domain',200)->index()->default('');
            $table->text('path')->nullable();
            $table->text('path_index',255)->nullable()->index();
            $table->text('title')->nullable();
            $table->string('ip',100)->index()->default();
            $table->json('header')->nullable();
            $table->json('file')->nullable();
            $table->json('body')->nullable();
            $table->string('user_id',36)->index()->nullable();
            $table->timestamp('created_at')->index()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::connection('log')->statement('DROP TABLE IF EXISTS t_http_log CASCADE');
    }
};
