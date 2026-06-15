<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('t_contract_messages', 't_messages');
        Schema::rename('t_contract_attachments', 't_attachments');
        Schema::rename('t_contract_h', 't_contract_histories');
        Schema::rename('t_contract_form_submission_h', 't_contract_form_submission_histories');

        if (Schema::connection('log')->hasTable('t_http_log') && !Schema::connection('log')->hasTable('t_http_logs')) {
            Schema::connection('log')->rename('t_http_log', 't_http_logs');
        } elseif (Schema::connection('log')->hasTable('t_http_log') && Schema::connection('log')->hasTable('t_http_logs')) {
            Schema::connection('log')->dropIfExists('t_http_log');
        } elseif (! Schema::connection('log')->hasTable('t_http_logs')) {
            Schema::connection('log')->create('t_http_logs', function ($table) {
                $table->bigIncrements('id');
                $table->string('method', 7)->index()->default('GET');
                $table->text('full_url')->nullable();
                $table->string('domain', 200)->index()->default('');
                $table->text('path')->nullable();
                $table->text('path_index', 255)->nullable()->index();
                $table->text('title')->nullable();
                $table->string('ip', 100)->index()->default('');
                $table->json('header')->nullable();
                $table->json('file')->nullable();
                $table->json('body')->nullable();
                $table->string('user_id', 36)->index()->nullable();
                $table->timestamp('created_at')->index()->useCurrent();
            });
        }

        if (Schema::connection('log')->hasTable('t_http_log_h') && !Schema::connection('log')->hasTable('t_http_log_histories')) {
            Schema::connection('log')->rename('t_http_log_h', 't_http_log_histories');
        } elseif (Schema::connection('log')->hasTable('t_http_log_h') && Schema::connection('log')->hasTable('t_http_log_histories')) {
            Schema::connection('log')->dropIfExists('t_http_log_h');
        } elseif (! Schema::connection('log')->hasTable('t_http_log_histories')) {
            Schema::connection('log')->create('t_http_log_histories', function ($table) {
                $table->bigIncrements('id');
                $table->string('method', 7)->index()->default('GET');
                $table->text('full_url')->nullable();
                $table->string('domain', 200)->index()->default('');
                $table->text('path')->nullable();
                $table->text('path_index', 255)->nullable()->index();
                $table->text('title')->nullable();
                $table->string('ip', 100)->index()->default('');
                $table->json('header')->nullable();
                $table->json('file')->nullable();
                $table->json('body')->nullable();
                $table->string('user_id', 36)->index()->nullable();
                $table->timestamp('created_at')->index()->useCurrent();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('t_messages', 't_contract_messages');
        Schema::rename('t_attachments', 't_contract_attachments');
        Schema::rename('t_contract_histories', 't_contract_h');
        Schema::rename('t_contract_form_submission_histories', 't_contract_form_submission_h');

        if (Schema::connection('log')->hasTable('t_http_logs')) {
            Schema::connection('log')->rename('t_http_logs', 't_http_log');
        }
        if (Schema::connection('log')->hasTable('t_http_log_histories')) {
            Schema::connection('log')->rename('t_http_log_histories', 't_http_log_h');
        }
    }
};
