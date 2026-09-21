<?php

use App\Models\JobLevel;
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
        Schema::table('m_job_levels', function (Blueprint $table) {
            $table->unsignedSmallInteger('hierarchy_tier')->nullable()->after('group_name');
            $table->string('tier_name', 100)->nullable()->after('hierarchy_tier');
        });

        // Backfill initial hierarchy tiers for existing job levels
        $tierNames = [
            1 => 'Level 1 · Direksi & Executive (VP / Head / Director)',
            2 => 'Level 2 · Senior Management (GM & Senior Manager)',
            3 => 'Level 3 · Management (Manager)',
            4 => 'Level 4 · Middle Management (Assistant Manager & Askep)',
            5 => 'Level 5 · Supervisor & Senior Officer',
            6 => 'Level 6 · Staff & Officer',
            7 => 'Level 7 · Pelaksana & Non-Staff',
        ];

        $jobLevels = JobLevel::all();
        foreach ($jobLevels as $level) {
            $rank = (int) $level->idjoblevel;
            $nameStr = strtoupper(($level->name ?? '') . ' ' . ($level->code ?? ''));

            $tier = 6;
            if (
                in_array($rank, [76, 74, 73, 66, 65, 52, 51, 50, 49, 48, 47, 46, 45, 44]) ||
                preg_match('/\b(VP|DIRECTOR|HEAD|CHIEF|CEO|MD|DMD|MANAGEMENT|PRESIDENT|DIREKSI)\b/', $nameStr)
            ) {
                $tier = 1;
            } elseif (
                in_array($rank, [72, 71, 43, 42, 41, 40]) ||
                preg_match('/\b(GM|GENERAL MANAGER|SENIOR MANAGER|SR\. MANAGER|GROUP MANAGER)\b/', $nameStr)
            ) {
                $tier = 2;
            } elseif (
                in_array($rank, [70, 69, 68, 39, 38, 37, 36, 35]) ||
                (str_contains($nameStr, 'MANAGER') &&
                    !str_contains($nameStr, 'ASSISTANT') &&
                    !str_contains($nameStr, 'ASST') &&
                    !str_contains($nameStr, 'SENIOR') &&
                    !str_contains($nameStr, 'GENERAL') &&
                    !str_contains($nameStr, 'GROUP'))
            ) {
                $tier = 3;
            } elseif (
                in_array($rank, [64, 63, 62, 61, 60, 59, 34, 33, 32, 31, 30]) ||
                preg_match('/\b(ASSISTANT MANAGER|ASST\. MANAGER|ASST MANAGER|ASKEP|SUPERINTENDENT)\b/', $nameStr)
            ) {
                $tier = 4;
            } elseif (
                in_array($rank, [58, 57, 56, 55, 54, 53, 29, 28]) ||
                preg_match('/\b(SUPERVISOR|SENIOR OFFICER|SENIOR ASSISTAN|SR\. OFFICER|SPV)\b/', $nameStr)
            ) {
                $tier = 5;
            } elseif (
                ($rank >= 1 && $rank <= 23) ||
                ($level->group_name === 'NON STAFF') ||
                preg_match('/\b(NON STAFF|NON-STAFF|OPERATOR|FOREMAN|KHT|HARIAN|MAHASISWA|MAGANG|INTERN|MHS)\b/', $nameStr)
            ) {
                $tier = 7;
            } else {
                $tier = 6;
            }

            $level->hierarchy_tier = $tier;
            $level->tier_name = $tierNames[$tier] ?? "Level {$tier}";
            $level->save();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_job_levels', function (Blueprint $table) {
            $table->dropColumn(['hierarchy_tier', 'tier_name']);
        });
    }
};
