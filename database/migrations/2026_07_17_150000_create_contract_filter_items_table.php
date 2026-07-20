<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Buat tabel items baru (satu baris per item)
        Schema::create('m_contract_filter_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('filter_id');
            $table->string('type');  // company_group | region | company | division | department
            $table->string('value'); // UUID atau token [USER_LOGIN]
            $table->timestamps();

            $table->foreign('filter_id')
                ->references('id')
                ->on('m_contract_filter')
                ->onDelete('cascade');

            $table->index(['filter_id', 'type']);
        });

        // 2. Migrasi data JSON lama ke baris baru
        $filters = DB::table('m_contract_filter')->whereNull('deleted_at')->get();

        foreach ($filters as $filter) {
            $map = [
                'company_group' => $filter->allowed_company_groups,
                'region' => $filter->allowed_regions,
                'company' => $filter->allowed_companies,
                'division' => $filter->allowed_divisions,
                'department' => $filter->allowed_departments,
            ];

            foreach ($map as $type => $jsonRaw) {
                $items = json_decode($jsonRaw ?? '[]', true) ?: [];
                foreach ($items as $value) {
                    if (empty($value)) {
                        continue;
                    }
                    DB::table('m_contract_filter_items')->insert([
                        'id' => Str::uuid()->toString(),
                        'filter_id' => $filter->id,
                        'type' => $type,
                        'value' => $value,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // 3. Hapus kolom JSON lama dari m_contract_filter
        Schema::table('m_contract_filter', function (Blueprint $table) {
            $table->dropColumn([
                'allowed_company_groups',
                'allowed_regions',
                'allowed_companies',
                'allowed_divisions',
                'allowed_departments',
            ]);
        });
    }

    public function down(): void
    {
        // Restore kolom JSON
        Schema::table('m_contract_filter', function (Blueprint $table) {
            $table->json('allowed_company_groups')->nullable();
            $table->json('allowed_regions')->nullable();
            $table->json('allowed_companies')->nullable();
            $table->json('allowed_divisions')->nullable();
            $table->json('allowed_departments')->nullable();
        });

        // Migrasi balik: gabungkan items ke JSON
        $filters = DB::table('m_contract_filter')->get();
        foreach ($filters as $filter) {
            $grouped = DB::table('m_contract_filter_items')
                ->where('filter_id', $filter->id)
                ->get()
                ->groupBy('type');

            DB::table('m_contract_filter')->where('id', $filter->id)->update([
                'allowed_company_groups' => json_encode($grouped->get('company_group', collect())->pluck('value')->all()),
                'allowed_regions' => json_encode($grouped->get('region', collect())->pluck('value')->all()),
                'allowed_companies' => json_encode($grouped->get('company', collect())->pluck('value')->all()),
                'allowed_divisions' => json_encode($grouped->get('division', collect())->pluck('value')->all()),
                'allowed_departments' => json_encode($grouped->get('department', collect())->pluck('value')->all()),
            ]);
        }

        Schema::dropIfExists('m_contract_filter_items');
    }
};
