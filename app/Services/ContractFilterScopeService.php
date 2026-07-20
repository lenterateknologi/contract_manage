<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * ContractFilterScopeService
 *
 * Bertanggung jawab atas satu hal saja:
 *   memutuskan ID organisasi mana saja yang boleh diakses user,
 *   lalu menulis hasilnya kembali ke Request agar dipakai Query.
 *
 * Prinsip utama:
 *   - Nilai milik user sendiri SELALU menjadi basis akses (tidak perlu konfigurasi).
 *   - `allowed_*` di ContractFilterTemplate berisi UUID organisasi yang diberi akses oleh admin.
 *   - Whitelist efektif  = user's_own_id  ∪  allowed_* dari template.
 *   - Full-access roles (Admin, Super Admin, Director, CEO, VP) tidak dibatasi
 *     kecuali admin secara eksplisit menetapkan allowed_* untuk mereka.
 */
class ContractFilterScopeService
{
    /**
     * Terapkan scope organisasi ke Request.
     * Dipanggil di awal ContractListQuery::build() dan ContractOptionsQuery.
     */
    public function applyToRequest(Request $request, User $user): void
    {
        $settings = $user->getContractFilterSettings();
        $isAdmin = in_array($user->role, ['Admin', 'Super Admin']) || $user->is_admin;
        $globalFullAccess = $isAdmin || in_array($user->role, ['Director', 'CEO', 'VP']);

        // Resolusi region_id user dari company jika tidak tersimpan langsung di user
        $userCompany = $user->company;
        $userRegionId = $user->region_id ?? $userCompany?->region_id;

        // Tentukan full access per dimensi berdasarkan status admin global atau toggle pengaturan user/role
        // ponytail: Gunakan permission spesifik per dimensi untuk mendukung 3 level scope (Full, Group-only, Division-only)
        $groupFull = $globalFullAccess || ($settings['can_change_company_group'] ?? false);
        $regionFull = $globalFullAccess || ($settings['can_change_region'] ?? false);
        $companyFull = $globalFullAccess || ($settings['can_change_company'] ?? false);
        $divisionFull = $globalFullAccess || ($settings['can_change_division'] ?? false);
        $departmentFull = $globalFullAccess || ($settings['can_change_department'] ?? false);

        // Bangun whitelist efektif per dimensi
        $groups = $this->buildAllowed($user->company_group_id, $settings['allowed_company_groups'] ?? [], $groupFull);
        $regions = $this->buildAllowed($userRegionId, $settings['allowed_regions'] ?? [], $regionFull);
        $companies = $this->buildAllowed($user->company_id, $settings['allowed_companies'] ?? [], $companyFull);
        $divisions = $this->buildAllowed($user->division_id, $settings['allowed_divisions'] ?? [], $divisionFull);
        $departments = $this->buildAllowed($user->department_id, $settings['allowed_departments'] ?? [], $departmentFull);

        $this->scopeField($request, 'company_group_id', $groups);
        $this->scopeField($request, 'region_id', $regions);
        $this->scopeField($request, 'company_id', $companies);
        $this->scopeArrayField($request, 'division_id', $divisions);
        $this->scopeArrayField($request, 'department_id', $departments);
    }

    /**
     * Kembalikan whitelist efektif untuk satu dimensi organisasi.
     *
     * @param  string|null  $userOwnId  ID milik user (bisa null/kosong)
     * @param  array  $extraIds  ID tambahan dari setting admin
     * @param  bool  $hasFullAccess  true untuk Admin / Super Admin / Director / CEO / VP
     * @return array|null null  = tidak dibatasi (full access tanpa extra whitelist)
     *                    array = daftar ID yang diizinkan
     */
    public function buildAllowed(?string $userOwnId, array $extraIds, bool $hasFullAccess): ?array
    {
        // Full access tanpa whitelist tambahan → tidak perlu filter sama sekali
        if ($hasFullAccess && empty($extraIds)) {
            return null;
        }

        $base = array_filter([$userOwnId], fn ($v) => ! empty($v) && $v !== 'null');
        $extra = array_filter($extraIds, fn ($v) => ! empty($v) && $v !== 'null');
        $combined = array_values(array_unique(array_merge($base, $extra)));

        // Jika tetap kosong (misalnya user belum punya company_group_id)
        // kembalikan null agar tidak memblok semua data
        return empty($combined) ? null : $combined;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Scope field tipe "single / array" pada Request (company_group_id, region_id, company_id).
     * Jika whitelist null → tidak disentuh (full access).
     */
    private function scopeField(Request $request, string $field, ?array $whitelist): void
    {
        if ($whitelist === null) {
            return;
        }

        if ($request->filled($field)) {
            // User sudah memilih filter sendiri → intersect dengan whitelist
            $req = array_filter((array) $request->$field, fn ($v) => ! empty($v) && $v !== 'null');
            $allowed = array_values(array_intersect($req, $whitelist));
            $request->merge([$field => empty($allowed) ? $whitelist : $allowed]);
        } else {
            // Tidak ada filter → default ke seluruh whitelist
            $request->merge([$field => $whitelist]);
        }
    }

    /**
     * Scope field tipe "array" (division_id, department_id).
     * Perbedaan: jika ada di request tapi kosong setelah intersect → kosongkan (bukan pakai whitelist penuh).
     */
    private function scopeArrayField(Request $request, string $field, ?array $whitelist): void
    {
        if ($whitelist === null) {
            return;
        }

        if ($request->has($field)) {
            $req = array_filter((array) $request->$field, fn ($v) => ! empty($v) && $v !== 'null');
            $allowed = array_values(array_intersect($req, $whitelist));
            $request->merge([$field => $allowed]);
        } else {
            // Tidak ada di request → default ke seluruh whitelist
            $request->merge([$field => $whitelist]);
        }
    }

    /**
     * Membangun Tree Holding -> Wilayah -> Perusahaan dengan ID ber-prefix yang konsisten.
     * Dapat digunakan di backend controller mana saja untuk menyamakan sumber data tree.
     */
    public static function buildOrganizationTree($groups, $regions, $companies): array
    {
        $regionsKeyed = $regions->keyBy('id');
        $tree = [];

        foreach ($groups as $group) {
            $gId = strval($group->id);
            $groupNode = [
                'id' => "g_{$gId}",
                'name' => $group->name,
                'code' => $group->code,
                'type' => 'group',
                'children' => [],
            ];

            $groupCompanies = $companies->where('company_group_id', $group->id);
            $companiesByRegion = $groupCompanies->groupBy('region_id');

            foreach ($companiesByRegion as $regionId => $regionCompanies) {
                $region = $regionId ? $regionsKeyed->get($regionId) : null;
                $rId = $regionId ? $regionId : 'null';

                $regionNode = [
                    'id' => "r_{$rId}_g_{$gId}",
                    'name' => $region ? $region->name : 'Tanpa Wilayah',
                    'code' => $region ? $region->code : '-',
                    'type' => 'region',
                    'children' => [],
                ];

                foreach ($regionCompanies as $company) {
                    $cId = strval($company->id);
                    $regionNode['children'][] = [
                        'id' => "c_{$cId}",
                        'name' => $company->name,
                        'code' => $company->code,
                        'type' => 'company',
                        'children' => [],
                    ];
                }
                $groupNode['children'][] = $regionNode;
            }
            $tree[] = $groupNode;
        }

        return $tree;
    }
}
