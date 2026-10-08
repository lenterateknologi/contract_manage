<?php

namespace App\Http\Queries\Contract;

use App\Models\Master\Company;
use App\Models\Master\CompanyGroup;
use App\Models\Master\ContractStatus;
use App\Models\Master\ContractType;
use App\Models\Master\Department;
use App\Models\Master\Division;
use App\Models\Master\FormTemplate;
use App\Models\Master\Location;
use App\Models\Master\OrganizationGroup;
use App\Models\Master\Region;
use App\Models\Master\Role;
use App\Models\Master\SubmissionType;
use App\Models\Master\User;
use App\Models\Master\Vendor;
use App\Models\Master\Workflow;
use App\Services\ContractFilterScopeService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class ContractOptionsQuery
{
    public function __construct(
        private readonly ContractFilterScopeService $scope = new ContractFilterScopeService
    ) {}

    /**
     * Get dynamic loaders for contract-related options based on user role.
     */
    public function getLoaders(): array
    {
        $user = Auth::user();
        $userCompany = $user?->company;
        $settings = $user ? $user->getContractFilterSettings() : [];

        $canChangeGroup = (bool) ($settings['can_change_company_group'] ?? false);
        $canChangeRegion = (bool) ($settings['can_change_region'] ?? false);
        $canChangeCompany = (bool) ($settings['can_change_company'] ?? false);
        $canChangeDivision = (bool) ($settings['can_change_division'] ?? false);
        $canChangeDept = (bool) ($settings['can_change_department'] ?? false);

        // Bangun whitelist per dimensi secara dinamis dari tabel konfigurasi
        $allowedGroups = $user ? $this->scope->buildAllowed($user->company_group_id, $settings['allowed_company_groups'] ?? [], $canChangeGroup) : null;
        $allowedRegions = $user ? $this->scope->buildAllowed($user->region_id ?? $userCompany?->region_id, $settings['allowed_regions'] ?? [], $canChangeRegion) : null;
        $allowedCompanies = $user ? $this->scope->buildAllowed($user->company_id, $settings['allowed_companies'] ?? [], $canChangeCompany) : null;
        $allowedDivisions = $user ? $this->scope->buildAllowed($user->division_id, $settings['allowed_divisions'] ?? [], $canChangeDivision) : null;
        $allowedDepts = $user ? $this->scope->buildAllowed($user->department_id, $settings['allowed_departments'] ?? [], $canChangeDept) : null;

        return [

            // ── Organisasi ──────────────────────────────────────────────────

            'companyGroups' => function () use ($allowedGroups) {
                $cacheKey = 'contract_opts_groups_'.($allowedGroups ? md5(json_encode($allowedGroups)) : 'all');

                return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($allowedGroups) {
                    $q = CompanyGroup::query()->select(['id', 'name', 'code'])->where('is_used', true);
                    if ($allowedGroups !== null) {
                        $q->whereIn('id', $allowedGroups);
                    }

                    return $q->orderBy('name')->get();
                });
            },

            'regions' => function () use ($allowedRegions) {
                $cacheKey = 'contract_opts_regions_'.($allowedRegions ? md5(json_encode($allowedRegions)) : 'all');

                return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($allowedRegions) {
                    $q = Region::query()->select(['id', 'name', 'code'])->where('is_used', true);
                    if ($allowedRegions !== null) {
                        $q->whereIn('id', $allowedRegions);
                    }

                    return $q->orderBy('name')->get();
                });
            },

            'locations' => function () {
                return Cache::remember('contract_opts_locations', now()->addMinutes(10), function () {
                    return Location::query()->select(['id', 'name', 'code', 'company_group_id'])->where('is_used', true)->orderBy('name')->get();
                });
            },

            'companies' => function () use ($allowedCompanies) {
                $cacheKey = 'contract_opts_companies_'.($allowedCompanies ? md5(json_encode($allowedCompanies)) : 'all');

                return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($allowedCompanies) {
                    $q = Company::query()->select(['id', 'name', 'code', 'company_group_id', 'region_id'])->where('is_used', true);
                    if ($allowedCompanies !== null) {
                        $q->whereIn('id', $allowedCompanies);
                    }

                    return $q->orderBy('name')->get();
                });
            },

            'divisions' => function () use ($allowedDivisions) {
                $cacheKey = 'contract_opts_divisions_'.($allowedDivisions ? md5(json_encode($allowedDivisions)) : 'all');

                return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($allowedDivisions) {
                    $q = Division::query()->select(['id', 'name', 'code']);
                    if ($allowedDivisions !== null) {
                        $q->whereIn('id', $allowedDivisions);
                    }

                    return $q->orderBy('name')->get();
                });
            },

            'departments' => function () use ($allowedDepts) {
                $cacheKey = 'contract_opts_depts_'.($allowedDepts ? md5(json_encode($allowedDepts)) : 'all');

                return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($allowedDepts) {
                    $q = Department::query()->select(['id', 'name', 'code', 'company_id', 'idorg_group', 'org_group_name'])->where('is_used', true);
                    if ($allowedDepts !== null) {
                        $q->whereIn('id', $allowedDepts);
                    }

                    return $q->orderBy('name')->get();
                });
            },

            // ── Users & Vendors ──────────────────────────────────────────────

            'users' => function () use ($allowedDivisions) {
                $cacheKey = 'contract_opts_users_'.($allowedDivisions && ! request()->boolean('all') ? md5(json_encode($allowedDivisions)) : 'all');

                return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($allowedDivisions) {
                    $orgGroupMap = OrganizationGroup::pluck('id', 'idorg_group')->toArray();

                    return User::query()
                        ->select(['id', 'name', 'email', 'role_id', 'department_id', 'division_id', 'location_id', 'company_id', 'company_group_id', 'region_id', 'idlocation', 'location_name', 'org_name', 'company_name', 'is_used', 'is_active'])
                        ->with(['department:id,name,idorg_group,org_group_name', 'roleRelation:id,name'])
                        ->where('is_used', true)
                        ->when($allowedDivisions !== null && ! request()->boolean('all'), fn ($q) => $q->whereIn('division_id', $allowedDivisions))
                        ->orderBy('name')
                        ->get()
                        ->map(function ($u) use ($orgGroupMap) {
                            $idOrgGroup = $u->department?->idorg_group;
                            $orgGroupId = $idOrgGroup && isset($orgGroupMap[$idOrgGroup]) ? $orgGroupMap[$idOrgGroup] : null;

                            return [
                                'id' => $u->id,
                                'name' => $u->name,
                                'email' => $u->email,
                                'role' => $u->role,
                                'role_id' => $u->role_id,
                                'department_id' => $u->department_id,
                                'division_id' => $u->division_id,
                                'location_id' => $u->location_id,
                                'company_id' => $u->company_id,
                                'company_group_id' => $u->company_group_id,
                                'region_id' => $u->region_id,
                                'location_name' => $u->location_name,
                                'company_name' => $u->company_name,
                                'department_name' => $u->department?->name,
                                'org_group_name' => $u->org_group_name ?? $u->department?->org_group_name,
                                'idorg_group' => $idOrgGroup,
                                'organization_group_id' => $orgGroupId,
                                'department' => $u->department ? [
                                    'id' => $u->department->id,
                                    'name' => $u->department->name,
                                    'idorg_group' => $u->department->idorg_group,
                                    'organization_group_id' => $orgGroupId,
                                    'org_group_name' => $u->department->org_group_name,
                                ] : null,
                            ];
                        })
                        ->toArray();
                });
            },

            'vendors' => function () {
                return Cache::remember('contract_opts_vendors', now()->addMinutes(5), function () {
                    return Vendor::where('is_active', true)
                        ->orderBy('vendor_name')
                        ->get(['id', 'vendor_name', 'vendor_code', 'vendor_detail'])
                        ->map(fn ($v) => [
                            'id' => $v->id,
                            'name' => $v->vendor_name,
                            'code' => $v->vendor_code,
                            'detail' => $v->vendor_detail,
                        ])
                        ->toArray();
                });
            },

            // ── Templates & Meta ─────────────────────────────────────────────

            'formTemplates' => fn () => Cache::remember('contract_opts_form_templates', now()->addMinutes(10), fn () => FormTemplate::where('is_active', true)
                ->with('contractType')
                ->withCount('fields')
                ->get()
                ->map(fn ($ft) => [
                    'id' => $ft->id,
                    'name' => $ft->name,
                    'description' => $ft->description,
                    'document_type' => $ft->document_type,
                    'contract_type_id' => $ft->contract_type_id,
                    'contract_type_name' => $ft->contractType?->name,
                    'fields_count' => $ft->fields_count,
                ])
                ->toArray()),

            'roles' => fn () => Cache::remember('contract_opts_roles', now()->addMinutes(10), fn () => Role::select(['id', 'name'])->orderBy('name')->get()),
            'contractStatuses' => fn () => Cache::remember('contract_opts_statuses', now()->addMinutes(10), fn () => ContractStatus::all()),

            'types' => function () {
                return Cache::remember('contract_opts_types', now()->addMinutes(10), function () {
                    $workflows = Workflow::where('is_active', true)->where('is_selectable', true)->get(['id', 'contract_type_id', 'meta']);
                    $globalExists = $workflows->contains(
                        fn ($w) => empty($w->contract_type_id) && empty($w->meta['contract_type_ids'])
                    );

                    $allTypes = ContractType::select(['id', 'name', 'code', 'parent_id', 'ancestry_id', 'f1_input_mechanism', 'f1_form_template_id', 'f2_input_mechanism', 'f2_form_template_id', 'contract_input_mechanism', 'contract_form_template_id'])->get();

                    if ($globalExists) {
                        return $allTypes;
                    }

                    $allowedTypeIds = collect();
                    foreach ($workflows as $w) {
                        if ($w->contract_type_id) {
                            $allowedTypeIds->push($w->contract_type_id);
                        }
                        if (! empty($w->meta['contract_type_ids']) && is_array($w->meta['contract_type_ids'])) {
                            foreach ($w->meta['contract_type_ids'] as $id) {
                                $allowedTypeIds->push($id);
                            }
                        }
                    }

                    $ids = array_flip($allowedTypeIds->unique()->filter()->values()->toArray());
                    if (empty($ids)) {
                        return collect();
                    }

                    $typesById = $allTypes->keyBy('id');
                    $includedIds = [];

                    foreach (array_keys($ids) as $id) {
                        $current = $typesById->get($id);
                        if (! $current) {
                            continue;
                        }
                        $includedIds[$id] = true;

                        // Traverse up to include all ancestors so the tree can render
                        $parent = $current;
                        $visited = [$parent->id => true];
                        while ($parent && $parent->parent_id && isset($typesById[$parent->parent_id])) {
                            if (isset($visited[$parent->parent_id])) {
                                break;
                            }
                            $visited[$parent->parent_id] = true;
                            $includedIds[$parent->parent_id] = true;
                            $parent = $typesById->get($parent->parent_id);
                        }
                    }

                    return $allTypes->filter(fn ($t) => isset($includedIds[$t->id]))->values();
                });
            },

            'submissionTypes' => fn () => Cache::remember('contract_opts_submission_types', now()->addMinutes(10), fn () => SubmissionType::where('is_active', true)->select(['id', 'name', 'code'])->get()),
        ];
    }
}
