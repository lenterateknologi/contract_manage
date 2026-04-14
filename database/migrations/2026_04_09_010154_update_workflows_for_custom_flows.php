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
        Schema::table('workflows', function (Blueprint $table) {
            $table->boolean('is_template')->default(true)->after('description');
        });

        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->foreignUuid('user_id')->nullable()->after('workflow_id')->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            if (Schema::hasColumn('workflows', 'is_template')) {
                $table->dropColumn('is_template');
            }
        });

        Schema::table('workflow_steps', function (Blueprint $table) {
            // Only drop the foreign key if it actually exists in Postgres
            if (config('database.default') === 'pgsql') {
                $exists = \Illuminate\Support\Facades\DB::selectOne("
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE table_name='workflow_steps' 
                    AND constraint_name='workflow_steps_user_id_foreign'
                ");
                if ($exists) {
                    $table->dropForeign(['user_id']);
                }
            } else {
                try {
                    $table->dropForeign(['user_id']);
                } catch (\Exception $e) {
                    // Ignore if driver doesn't support or constraint missing
                }
            }

            if (Schema::hasColumn('workflow_steps', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });
    }
};
