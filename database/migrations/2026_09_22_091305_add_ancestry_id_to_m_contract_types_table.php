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
        if (! Schema::hasColumn('m_contract_types', 'ancestry_id')) {
            Schema::table('m_contract_types', function (Blueprint $table) {
                $table->uuid('ancestry_id')->nullable()->after('level');
                $table->index('ancestry_id');
                $table->foreign('ancestry_id')->references('id')->on('m_contract_types')->nullOnDelete();
            });
        }

        // Backfill existing records: resolve root ancestor (level 0 / parent_id is null)
        $allContractTypes = \App\Models\ContractType::all()->keyBy('id');
        foreach ($allContractTypes as $item) {
            if (! $item->parent_id) {
                $ancestryId = null;
            } else {
                $curr = $allContractTypes->get($item->parent_id);
                while ($curr && $curr->parent_id) {
                    $curr = $allContractTypes->get($curr->parent_id);
                }
                $ancestryId = $curr ? $curr->id : $item->parent_id;
            }

            if ($item->ancestry_id !== $ancestryId) {
                \Illuminate\Support\Facades\DB::table('m_contract_types')
                    ->where('id', $item->id)
                    ->update(['ancestry_id' => $ancestryId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('m_contract_types', 'ancestry_id')) {
            Schema::table('m_contract_types', function (Blueprint $table) {
                $table->dropForeign(['ancestry_id']);
                $table->dropIndex(['ancestry_id']);
                $table->dropColumn('ancestry_id');
            });
        }
    }
};
