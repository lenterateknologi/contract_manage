<?php

namespace Database\Seeders\System;

use App\Models\ContractType;
use App\Models\DashboardType;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DashboardTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Remove all old dashboard types data (force delete including soft deleted)
        DashboardType::withTrashed()->forceDelete();

        // 3. Resolve Roles
        $staffRole = Role::where('name', 'Staff')->first();
        $astManagerRole = Role::where('name', 'Ast Manager')->first();
        $managerRole = Role::where('name', 'Manager')->first();
        $adminRole = Role::where('name', 'Admin')->first();
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        $directorRole = Role::where('name', 'Director')->first();
        $vpRole = Role::where('name', 'VP')->first();

        // 4. Resolve Top Contract Types (Roots)
        $nonContractType = ContractType::where('name', 'Non Kontrak')->whereNull('parent_id')->first();
        $contractType = ContractType::where('name', 'Kontrak')->whereNull('parent_id')->first();
        $ndaType = ContractType::where('name', 'like', '%NDA%')->orWhere('name', 'like', '%Kerahasiaan%')->whereNull('parent_id')->first();

        // Collect IDs including children for precise filtering
        $getDescendants = function ($parent) {
            if (! $parent) return [];
            return ContractType::where('id', $parent->id)
                ->orWhere('parent_id', $parent->id)
                ->pluck('id')
                ->toArray();
        };

        $nonContractIds = $getDescendants($nonContractType);
        $contractAndNdaIds = array_merge($getDescendants($contractType), $getDescendants($ndaType));

        $legalDivision = \App\Models\Division::where('name', 'Legal')->orWhere('code', 'lga')->first();

        // -------------------------------------------------------------
        // Tipe 1: Dashboard Staff (Umum / Terisolasi Antar Divisi)
        // Fokus: Semua Kategori Dokumen, tapi DIBATASI HANYA DIVISI & DEPARTEMEN SENDIRI
        // -------------------------------------------------------------
        $staffAllDash = DashboardType::create([
            'name' => 'Dashboard Staff (Sesuai Divisi & Dept User)',
            'description' => 'Dashboard operasional untuk Staff dengan cakupan data terisolasi hanya pada Divisi dan Departemen milik user sendiri (tidak dapat melihat pengajuan antar divisi).',
            'role_ids' => array_filter([$staffRole?->id, $astManagerRole?->id]),
            'contract_type_ids' => [],
            'categories' => ['contract', 'non-contract', 'nda'],
            'scope_to_user_division' => true,
            'scope_to_user_department' => true,
            'scope_to_user_company' => true,
            'scope_to_user_company_group' => true,
            'scope_to_user_region' => true,
            'show_overview' => true,
            'show_overview_contract' => true,
            'show_overview_non_contract' => true,
            'show_overview_nda' => true,
            'show_workload' => false,
            'show_master_data' => false,
        ]);

        // -------------------------------------------------------------
        // Tipe 2: Dashboard Staff (Khusus Non-Kontrak)
        // Fokus: Khusus Dokumen Non Kontrak saja, terisolasi per divisi user
        // -------------------------------------------------------------
        $staffNonContractDash = DashboardType::create([
            'name' => 'Dashboard Staff (Fokus Non Kontrak)',
            'description' => 'Dashboard khusus staf pelaksana kegiatan operasional yang hanya menangani dokumen dan form Non-Kontrak.',
            'role_ids' => array_filter([$staffRole?->id]),
            'contract_type_ids' => $nonContractIds,
            'categories' => ['non-contract'],
            'scope_to_user_division' => true,
            'scope_to_user_department' => true,
            'scope_to_user_company' => true,
            'scope_to_user_company_group' => true,
            'scope_to_user_region' => true,
            'show_overview' => false,
            'show_overview_contract' => false,
            'show_overview_non_contract' => true,
            'show_overview_nda' => false,
            'show_workload' => false,
            'show_master_data' => false,
        ]);

        // -------------------------------------------------------------
        // Tipe 3: Dashboard Manager Divisi Pemohon (Sesuai Divisi User)
        // Fokus: Manager divisi umum yang menyetujui pengajuan internal divisinya
        // -------------------------------------------------------------
        $managerGeneralDash = DashboardType::create([
            'name' => 'Dashboard Manager (Sesuai Divisi User)',
            'description' => 'Dashboard untuk Manager Divisi Pemohon (Operasional, Agronomi, Procurement, dll.) dengan cakupan dibatasi pada divisi miliknya sendiri.',
            'role_ids' => array_filter([$managerRole?->id]),
            'contract_type_ids' => [],
            'categories' => ['contract', 'non-contract', 'nda'],
            'scope_to_user_division' => true,
            'scope_to_user_department' => false,
            'scope_to_user_company' => true,
            'scope_to_user_company_group' => true,
            'scope_to_user_region' => true,
            'show_overview' => true,
            'show_overview_contract' => true,
            'show_overview_non_contract' => true,
            'show_overview_nda' => true,
            'show_workload' => true,
            'show_master_data' => false,
        ]);

        // -------------------------------------------------------------
        // Tipe 4: Dashboard Manager Legal (Otoritas Lintas Divisi)
        // Fokus: Manager dengan Divisi Legal — memantau seluruh kontrak & NDA dari seluruh divisi
        // -------------------------------------------------------------
        $managerLegalDash = DashboardType::create([
            'name' => 'Dashboard Manager Legal (Otoritas Lintas Divisi)',
            'description' => 'Dashboard khusus Manager pada Divisi Legal dengan visibilitas kontrak & NDA dari seluruh divisi perusahaan untuk kebutuhan review hukum dan persetujuan legal.',
            'role_ids' => array_filter([$managerRole?->id]),
            'division_ids' => array_filter([$legalDivision?->id]),
            'contract_type_ids' => $contractAndNdaIds,
            'categories' => ['contract', 'nda'],
            'scope_to_user_division' => false,
            'scope_to_user_department' => false,
            'scope_to_user_company' => false,
            'scope_to_user_company_group' => false,
            'scope_to_user_region' => false,
            'show_overview' => true,
            'show_overview_contract' => true,
            'show_overview_non_contract' => false,
            'show_overview_nda' => true,
            'show_workload' => true,
            'show_master_data' => true,
        ]);

        // -------------------------------------------------------------
        // Tipe 5: Dashboard Administrator & Eksekutif (Full Access)
        // -------------------------------------------------------------
        $adminExecutiveDash = DashboardType::create([
            'name' => 'Dashboard Eksekutif & Manajemen (Full Access)',
            'description' => 'Dashboard komprehensif untuk Direksi, VP, dan Administrator dengan visibilitas penuh ke seluruh kategori kontrak, workload tim, dan master data.',
            'role_ids' => array_filter([$adminRole?->id, $superAdminRole?->id, $directorRole?->id, $vpRole?->id]),
            'contract_type_ids' => [],
            'categories' => ['contract', 'non-contract', 'nda'],
            'scope_to_user_division' => false,
            'scope_to_user_department' => false,
            'scope_to_user_company' => false,
            'scope_to_user_company_group' => false,
            'scope_to_user_region' => false,
            'show_overview' => true,
            'show_overview_contract' => true,
            'show_overview_non_contract' => true,
            'show_overview_nda' => true,
            'show_workload' => true,
            'show_master_data' => true,
        ]);
    }
}
