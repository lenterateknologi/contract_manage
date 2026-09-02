<?php

namespace App\Http\Queries\Contract;

use App\Http\Formatters\ContractFormatter;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Division;
use App\Models\FormTemplate;
use App\Models\Region;
use App\Models\Role;
use App\Models\SubmissionType;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Workflow;
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
        $hasFullAccess = $user ? in_array($user->role, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']) : false;
        $isManager = $user?->role === 'Manager';
        $userCompany = $user?->company;
        $settings = $user ? $user->getContractFilterSettings() : [];

        // Bangun whitelist per dimensi — satu aturan via service
        $allowedGroups = $user ? $this->scope->buildAllowed($user->company_group_id, $settings['allowed_company_groups'] ?? [], $hasFullAccess) : null;
        $allowedRegions = $user ? $this->scope->buildAllowed($user->region_id ?? $userCompany?->region_id, $settings['allowed_regions'] ?? [], $hasFullAccess) : null;
        $allowedCompanies = $user ? $this->scope->buildAllowed($user->company_id, $settings['allowed_companies'] ?? [], $hasFullAccess) : null;
        $allowedDivisions = $user ? $this->scope->buildAllowed($user->division_id, $settings['allowed_divisions'] ?? [], $hasFullAccess) : null;
        $allowedDepts = $user ? $this->scope->buildAllowed($user->department_id, $settings['allowed_departments'] ?? [], $hasFullAccess) : null;

        return [

            // ── Organisasi ──────────────────────────────────────────────────

            'companyGroups' => function () use ($allowedGroups) {
                $q = CompanyGroup::query()->where('is_used', true);
                if ($allowedGroups !== null) {
                    $q->whereIn('id', $allowedGroups);
                }

                return $q->orderBy('name')->get();
            },

            'regions' => function () use ($allowedRegions) {
                $q = Region::query()->where('is_used', true);
                if ($allowedRegions !== null) {
                    $q->whereIn('id', $allowedRegions);
                }

                return $q->orderBy('name')->get();
            },

            'companies' => function () use ($allowedCompanies, $isManager, $userCompany) {
                $q = Company::query()->where('is_used', true);
                if ($allowedCompanies !== null) {
                    $q->whereIn('id', $allowedCompanies);
                } elseif ($isManager && $userCompany) {
                    $q->where('company_group_id', $userCompany->company_group_id);
                }

                return $q->orderBy('name')->get();
            },

            'divisions' => function () use ($allowedDivisions) {
                $q = Division::query();
                if ($allowedDivisions !== null) {
                    $q->whereIn('id', $allowedDivisions);
                }

                return $q->orderBy('name')->get();
            },

            'departments' => function () use ($allowedDepts, $isManager, $user) {
                $q = Department::query()->where('is_used', true);
                if ($allowedDepts !== null) {
                    $q->whereIn('id', $allowedDepts);
                } elseif ($isManager) {
                    $q->where('company_id', $user->company_id);
                }

                return $q->orderBy('name')->get();
            },

            // ── Users & Vendors ──────────────────────────────────────────────

            'users' => fn () => User::with(['department', 'roleRelation'])
                ->when($isManager && ! request()->boolean('all'), fn ($q) => $q->where('division_id', $user->division_id))
                ->orderBy('name')
                ->get()
                ->map(fn ($u) => ContractFormatter::formatUser($u))
                ->toArray(),

            'vendors' => fn () => Vendor::where('is_active', true)
                ->orderBy('vendor_name')
                ->get()
                ->map(fn ($v) => [
                    'id' => $v->id,
                    'name' => $v->vendor_name,
                    'code' => $v->vendor_code,
                    'detail' => $v->vendor_detail,
                ])
                ->toArray(),

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

            'roles' => fn () => Cache::remember('contract_opts_roles', now()->addMinutes(10), fn () => Role::orderBy('name')->get()),
            'contractStatuses' => fn () => Cache::remember('contract_opts_statuses', now()->addMinutes(10), fn () => ContractStatus::all()),

            'types' => function () {
                return Cache::remember('contract_opts_types', now()->addMinutes(10), function () {
                    $workflows = Workflow::where('is_active', true)->where('is_selectable', true)->get();
                    $globalExists = $workflows->contains(
                        fn ($w) => empty($w->contract_type_id) && empty($w->meta['contract_type_ids'])
                    );

                    if ($globalExists) {
                        return ContractType::all();
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

                    $ids = $allowedTypeIds->unique()->filter()->values()->toArray();

                    return ContractType::whereIn('id', $ids)
                        ->orWhereIn('id', fn ($q) => $q->select('parent_id')
                            ->from('m_contract_types')
                            ->whereIn('id', $ids)
                            ->whereNotNull('parent_id')
                        )
                        ->get();
                });
            },

            'submissionTypes' => fn () => Cache::remember('contract_opts_submission_types', now()->addMinutes(10), fn () => SubmissionType::where('is_active', true)->get()),
        ];
    }
}
