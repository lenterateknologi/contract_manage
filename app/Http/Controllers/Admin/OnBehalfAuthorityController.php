<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Authority;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Department;
use App\Models\Division;
use App\Models\Location;
use App\Models\OrganizationGroup;
use App\Models\Region;
use App\Models\Role;
use App\Models\User;
use App\Services\MasterData\MasterAuthoritySyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class OnBehalfAuthorityController extends Controller
{
    public function __construct(
        protected MasterAuthoritySyncService $authoritySyncService
    ) {}

    public function index(): Response
    {
        $authorities = $this->authoritySyncService->getForContext(Authority::CONTEXT_ON_BEHALF_CREATE);
        $masterOptions = $this->authoritySyncService->getMasterOptions();

        return Inertia::render('admin/on-behalf-authorities/Index', array_merge([
            'initialAuthorities' => $authorities,
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Pengaturan Sistem', 'href' => '#', 'icon' => 'Settings2'],
                ['title' => 'Otoritas Buat Pengajuan (On-Behalf)', 'href' => route('admin.on-behalf-authorities.index'), 'description' => 'Konfigurasi personil dan kriteria yang berhak membuatkan pengajuan atas nama orang lain.', 'icon' => 'UserCheck'],
            ],
        ], $masterOptions));
    }

    public function save(Request $request)
    {
        $validated = $request->validate([
            'authorities' => ['present', 'array'],
            'authorities.*.authority_type' => ['nullable', 'string'],
            'authorities.*.role_id' => ['nullable', 'uuid', 'exists:m_roles,id'],
            'authorities.*.job_level_id' => ['nullable', 'uuid', 'exists:m_job_levels,id'],
            'authorities.*.job_position_id' => ['nullable', 'uuid', 'exists:m_job_positions,id'],
            'authorities.*.department_id' => ['nullable', 'uuid', 'exists:m_departments,id'],
            'authorities.*.division_id' => ['nullable', 'uuid', 'exists:m_division,id'],
            'authorities.*.organization_group_id' => ['nullable', 'uuid', 'exists:m_organization_groups,id'],
            'authorities.*.location_id' => ['nullable', 'uuid', 'exists:m_locations,id'],
            'authorities.*.user_id' => ['nullable', 'uuid', 'exists:m_users,id'],
            'authorities.*.company_group_id' => ['nullable', 'uuid', 'exists:m_company_groups,id'],
            'authorities.*.company_id' => ['nullable', 'uuid', 'exists:m_companies,id'],
            'authorities.*.region_id' => ['nullable', 'uuid', 'exists:m_regions,id'],
            'authorities.*.role_use_initiator' => ['nullable', 'boolean'],
            'authorities.*.department_use_initiator' => ['nullable', 'boolean'],
            'authorities.*.division_use_initiator' => ['nullable', 'boolean'],
            'authorities.*.organization_group_use_initiator' => ['nullable', 'boolean'],
            'authorities.*.location_use_initiator' => ['nullable', 'boolean'],
            'authorities.*.company_group_use_initiator' => ['nullable', 'boolean'],
            'authorities.*.company_use_initiator' => ['nullable', 'boolean'],
            'authorities.*.region_use_initiator' => ['nullable', 'boolean'],
        ]);

        $this->authoritySyncService->sync(
            Authority::CONTEXT_ON_BEHALF_CREATE,
            null,
            $validated['authorities'] ?? []
        );

        Cache::flush();

        return back()->with('success', 'Konfigurasi Otoritas Buat Pengajuan (On-Behalf) berhasil disimpan.');
    }
}
