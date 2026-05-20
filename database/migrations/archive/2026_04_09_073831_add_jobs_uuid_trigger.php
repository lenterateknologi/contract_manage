<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class() extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

        DB::statement(
            <<<'SQL'
                    CREATE OR REPLACE FUNCTION set_jobs_uuid()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        IF NEW.id IS NULL THEN
                            NEW.id := gen_random_uuid();
                        END IF;
                        RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql;
                SQL
        );

        DB::statement(
            <<<'SQL'
                    CREATE TRIGGER trigger_set_jobs_uuid
                    BEFORE INSERT ON jobs
                    FOR EACH ROW
                    EXECUTE FUNCTION set_jobs_uuid();
                SQL
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP TRIGGER IF EXISTS trigger_set_jobs_uuid ON jobs');
        DB::statement('DROP FUNCTION IF EXISTS set_jobs_uuid()');
    }
};
