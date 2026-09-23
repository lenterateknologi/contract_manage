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
        if (! Schema::hasColumn('t_contracts', 'contract_type_ancestry_id')) {
            Schema::table('t_contracts', function (Blueprint $table) {
                $table->uuid('contract_type_ancestry_id')->nullable()->after('contract_type_parent_id');
                $table->index('contract_type_ancestry_id');
                $table->foreign('contract_type_ancestry_id')->references('id')->on('m_contract_types')->nullOnDelete();
            });
        }

        // Backfill existing contracts from m_contract_types ancestry_id
        $contractTypes = \App\Models\ContractType::all()->keyBy('id');
        $contracts = \App\Models\Contract::withoutEvents(fn () => \App\Models\Contract::all());

        foreach ($contracts as $contract) {
            $type = $contract->contract_type_id ? $contractTypes->get($contract->contract_type_id) : null;
            $ancestryId = null;

            if ($type) {
                if ($type->ancestry_id) {
                    $ancestryId = $type->ancestry_id;
                } elseif (! $type->parent_id) {
                    $ancestryId = $type->id;
                }
            }

            if (! $ancestryId && $contract->contract_type_parent_id) {
                $parentType = $contractTypes->get($contract->contract_type_parent_id);
                if ($parentType) {
                    $ancestryId = $parentType->ancestry_id ?: ($parentType->parent_id ? null : $parentType->id);
                }
            }

            if ($contract->contract_type_ancestry_id !== $ancestryId) {
                \Illuminate\Support\Facades\DB::table('t_contracts')
                    ->where('id', $contract->id)
                    ->update(['contract_type_ancestry_id' => $ancestryId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('t_contracts', 'contract_type_ancestry_id')) {
            Schema::table('t_contracts', function (Blueprint $table) {
                $table->dropForeign(['contract_type_ancestry_id']);
                $table->dropIndex(['contract_type_ancestry_id']);
                $table->dropColumn('contract_type_ancestry_id');
            });
        }
    }
};
