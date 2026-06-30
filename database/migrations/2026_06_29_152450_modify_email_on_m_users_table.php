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
        Schema::table('m_users', function (Blueprint $table) {
            $table->dropUnique('m_users_email_unique');
            $table->string('email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set all '-' or empty emails to NULL
        DB::table('m_users')
            ->where('email', '-')
            ->orWhere('email', '')
            ->update(['email' => null]);

        // Resolve other duplicate real emails (e.g. panji.mulya) by appending username/code
        $duplicateEmails = DB::table('m_users')
            ->select('email')
            ->whereNotNull('email')
            ->where('email', '!=', '-')
            ->where('email', '!=', '')
            ->groupBy('email')
            ->having(DB::raw('count(*)'), '>', 1)
            ->pluck('email')
            ->toArray();

        foreach ($duplicateEmails as $email) {
            $users = DB::table('m_users')
                ->where('email', $email)
                ->get();

            foreach ($users as $index => $user) {
                if ($index === 0) {
                    continue;
                }

                $suffix = $user->username ?: ($user->code ?: $user->id);
                $newEmail = str_replace('@', "+{$suffix}@", $email);

                DB::table('m_users')
                    ->where('id', $user->id)
                    ->update(['email' => $newEmail]);
            }
        }

        Schema::table('m_users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->unique('email', 'm_users_email_unique');
        });
    }
};
