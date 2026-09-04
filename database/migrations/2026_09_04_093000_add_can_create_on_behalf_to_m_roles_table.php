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
        if (! Schema::hasColumn('m_roles', 'can_create_on_behalf')) {
            Schema::table('m_roles', function (Blueprint $table) {
                $table->boolean('can_create_on_behalf')->default(false);
            });
        }

        // Enable for Admin, Super Admin, Manager Legal, Ast Manager Legal, Staff Legal
        DB::table('m_roles')
            ->whereIn('name', [
                'Admin',
                'Super Admin',
                'Manager Legal',
                'Ast Manager Legal',
                'Staff Legal',
            ])
            ->orWhere('name', 'ilike', '%legal%')
            ->orWhere('name', 'ilike', '%admin%')
            ->update(['can_create_on_behalf' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('m_roles', 'can_create_on_behalf')) {
            Schema::table('m_roles', function (Blueprint $table) {
                $table->dropColumn('can_create_on_behalf');
            });
        }
    }
};
