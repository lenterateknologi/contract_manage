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
        // 1. Create t_contract_meta table
        Schema::create('t_contract_meta', function (Blueprint $table) {
            $table->uuid('contract_id')->primary();
            $table->string('kop_topik')->nullable();
            $table->string('kop_sub_topik')->nullable();
            $table->string('kop_lampiran')->nullable();
            $table->text('f1_tujuan')->nullable();
            $table->string('f1_sifat')->nullable();
            $table->string('p1_entity')->nullable();
            $table->string('p1_signer')->nullable();
            $table->string('p1_signer_position')->nullable();
            $table->text('p1_address')->nullable();
            $table->string('p2_entity')->nullable();
            $table->string('p2_signer')->nullable();
            $table->string('p2_signer_position')->nullable();
            $table->text('p2_address')->nullable();
            $table->text('f2_scope')->nullable();
            $table->string('f2_price')->nullable();
            $table->string('f2_payment')->nullable();
            $table->string('f2_tenure')->nullable();
            $table->text('f2_location')->nullable();
            $table->timestamps();

            $table->foreign('contract_id')
                ->references('id')
                ->on('t_contracts')
                ->cascadeOnDelete();
        });

        // 2. Transfer existing metadata to t_contract_meta in chunks
        DB::table('t_contracts')->orderBy('id')->chunk(100, function ($contracts) {
            $metaData = [];
            foreach ($contracts as $contract) {
                $metaData[] = [
                    'contract_id' => $contract->id,
                    'kop_topik' => $contract->kop_topik,
                    'kop_sub_topik' => $contract->kop_sub_topik,
                    'kop_lampiran' => $contract->kop_lampiran,
                    'f1_tujuan' => $contract->f1_tujuan,
                    'f1_sifat' => $contract->f1_sifat,
                    'p1_entity' => $contract->p1_entity,
                    'p1_signer' => $contract->p1_signer,
                    'p1_signer_position' => $contract->p1_signer_position,
                    'p1_address' => $contract->p1_address,
                    'p2_entity' => $contract->p2_entity,
                    'p2_signer' => $contract->p2_signer,
                    'p2_signer_position' => $contract->p2_signer_position,
                    'p2_address' => $contract->p2_address,
                    'f2_scope' => $contract->f2_scope,
                    'f2_price' => $contract->f2_price,
                    'f2_payment' => $contract->f2_payment,
                    'f2_tenure' => $contract->f2_tenure,
                    'f2_location' => $contract->f2_location,
                    'created_at' => $contract->created_at ?? now(),
                    'updated_at' => $contract->updated_at ?? now(),
                ];
            }
            if (! empty($metaData)) {
                DB::table('t_contract_meta')->insert($metaData);
            }
        });

        // 3. Drop columns from t_contracts
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropColumn([
                'kop_topik',
                'kop_sub_topik',
                'kop_lampiran',
                'f1_tujuan',
                'f1_sifat',
                'p1_entity',
                'p1_signer',
                'p1_signer_position',
                'p1_address',
                'p2_entity',
                'p2_signer',
                'p2_signer_position',
                'p2_address',
                'f2_scope',
                'f2_price',
                'f2_payment',
                'f2_tenure',
                'f2_location',
            ]);
        });

        // 4. Add missing indexes on t_contracts foreign keys
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->index('contract_type_id');
            $table->index('submission_type_id');
            $table->index('workflow_id');
            $table->index('workflow_step_id');
            $table->index('created_by');
            $table->index('initiated_by_id');
            $table->index('assigned_pic_id');
            $table->index('assigned_by_id');
            $table->index('vendor_id');
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Re-add columns to t_contracts
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->string('kop_topik')->nullable();
            $table->string('kop_sub_topik')->nullable();
            $table->string('kop_lampiran')->nullable();
            $table->text('f1_tujuan')->nullable();
            $table->string('f1_sifat')->nullable();
            $table->string('p1_entity')->nullable();
            $table->string('p1_signer')->nullable();
            $table->string('p1_signer_position')->nullable();
            $table->text('p1_address')->nullable();
            $table->string('p2_entity')->nullable();
            $table->string('p2_signer')->nullable();
            $table->string('p2_signer_position')->nullable();
            $table->text('p2_address')->nullable();
            $table->text('f2_scope')->nullable();
            $table->string('f2_price')->nullable();
            $table->string('f2_payment')->nullable();
            $table->string('f2_tenure')->nullable();
            $table->text('f2_location')->nullable();
        });

        // 2. Transfer data back from t_contract_meta to t_contracts in chunks
        DB::table('t_contract_meta')->orderBy('contract_id')->chunk(100, function ($metas) {
            foreach ($metas as $meta) {
                DB::table('t_contracts')
                    ->where('id', $meta->contract_id)
                    ->update([
                        'kop_topik' => $meta->kop_topik,
                        'kop_sub_topik' => $meta->kop_sub_topik,
                        'kop_lampiran' => $meta->kop_lampiran,
                        'f1_tujuan' => $meta->f1_tujuan,
                        'f1_sifat' => $meta->f1_sifat,
                        'p1_entity' => $meta->p1_entity,
                        'p1_signer' => $meta->p1_signer,
                        'p1_signer_position' => $meta->p1_signer_position,
                        'p1_address' => $meta->p1_address,
                        'p2_entity' => $meta->p2_entity,
                        'p2_signer' => $meta->p2_signer,
                        'p2_signer_position' => $meta->p2_signer_position,
                        'p2_address' => $meta->p2_address,
                        'f2_scope' => $meta->f2_scope,
                        'f2_price' => $meta->f2_price,
                        'f2_payment' => $meta->f2_payment,
                        'f2_tenure' => $meta->f2_tenure,
                        'f2_location' => $meta->f2_location,
                    ]);
            }
        });

        // 3. Drop t_contract_meta table
        Schema::dropIfExists('t_contract_meta');

        // 4. Drop additional foreign key indexes from t_contracts
        Schema::table('t_contracts', function (Blueprint $table) {
            $table->dropIndex(['contract_type_id']);
            $table->dropIndex(['submission_type_id']);
            $table->dropIndex(['workflow_id']);
            $table->dropIndex(['workflow_step_id']);
            $table->dropIndex(['created_by']);
            $table->dropIndex(['initiated_by_id']);
            $table->dropIndex(['assigned_pic_id']);
            $table->dropIndex(['assigned_by_id']);
            $table->dropIndex(['vendor_id']);
            $table->dropIndex(['parent_id']);
        });
    }
};
