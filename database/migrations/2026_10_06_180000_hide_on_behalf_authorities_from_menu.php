<?php

use App\Models\Master\Module;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Module::where('route', 'like', '%on-behalf%')
            ->orWhere('identifier', 'ADMIN_ON_BEHALF_AUTHORITIES')
            ->update([
                'showed_as_menu' => false,
                'is_active' => false,
            ]);

        Cache::flush();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Module::where('route', 'like', '%on-behalf%')
            ->orWhere('identifier', 'ADMIN_ON_BEHALF_AUTHORITIES')
            ->update([
                'showed_as_menu' => true,
                'is_active' => true,
            ]);

        Cache::flush();
    }
};
