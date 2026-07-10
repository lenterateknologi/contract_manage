<?php

namespace App\Http\Queries\Contract;

use App\Http\Formatters\ContractFormatter;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\FormTemplate;
use App\Models\Region;
use App\Models\Role;
use App\Models\SubmissionType;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Workflow;
use Illuminate\Support\Facades\Auth;

class ContractOptionsQuery
{
    /**
     * Get dynamic loaders for contract-related options based on user role.
     */
    public function getLoaders(): array
    {
        $user = Auth::user();
        $roleName = $user->role;
        $hasFullAccess = in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);
        $isManager = $roleName === 'Manager';
        $userCompany = $user->company;

        return [
            'departments' => fn () => Department::query()
                ->when($isManager, fn ($q) => $q->where('company_id', $user->company_id))
                ->when(! $hasFullAccess && ! $isManager, fn ($q) => $q->where('id', $user->division_id))
                ->orderBy('name')
                ->get(),

            'regions' => fn () => Region::query()
                ->when(! $hasFullAccess && $userCompany, fn ($q) => $q->where('id', $userCompany->region_id))
                ->orderBy('name')
                ->get(),

            'companyGroups' => fn () => CompanyGroup::query()
                ->when(! $hasFullAccess && $userCompany, fn ($q) => $q->where('id', $userCompany->company_group_id))
                ->orderBy('name')
                ->get(),

            'companies' => fn () => Company::query()
                ->when($isManager && $userCompany, fn ($q) => $q->where('company_group_id', $userCompany->company_group_id))
                ->when(! $hasFullAccess && ! $isManager && $userCompany, fn ($q) => $q->where('id', $user->company_id))
                ->orderBy('name')
                ->get(),

            'users' => fn () => User::with(['department', 'roleRelation'])
                ->when($isManager && ! request()->boolean('all'), fn ($q) => $q->where('division_id', $user->division_id))
                ->orderBy('name')
                ->get()
                ->map(fn ($u) => ContractFormatter::formatUser($u))
                ->toArray(),

            'vendors' => fn () => Vendor::with('documents')
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn ($v) => [
                    'id' => $v->id,
                    'name' => $v->name,
                    'pic_name' => $v->pic_name,
                    'pic_position' => $v->pic_position,
                    'address' => $v->address,
                    'documents' => $v->documents->map(fn ($d) => [
                        'id' => $d->id,
                        'name' => $d->document_name,
                        'type' => $d->document_type,
                    ])->toArray(),
                ])
                ->toArray(),

            'formTemplates' => fn () => FormTemplate::where('is_active', true)
                ->with('contractType')
                ->withCount('fields')
                ->get()
                ->map(function ($ft) {
                    return [
                        'id' => $ft->id,
                        'name' => $ft->name,
                        'description' => $ft->description,
                        'document_type' => $ft->document_type,
                        'contract_type_id' => $ft->contract_type_id,
                        'contract_type_name' => $ft->contractType?->name,
                        'fields_count' => $ft->fields_count,
                    ];
                })
                ->toArray(),

            'roles' => fn () => Role::orderBy('name')->get(),
            'contractStatuses' => fn () => ContractStatus::all(),
            'types' => function () {
                $workflows = Workflow::where('is_active', true)->where('is_selectable', true)->get();
                $globalWorkflowExists = $workflows->contains(fn ($w) => empty($w->contract_type_id) && empty($w->meta['contract_type_ids']));

                if ($globalWorkflowExists) {
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

                $uniqueIds = $allowedTypeIds->unique()->filter()->values()->toArray();

                return ContractType::whereIn('id', $uniqueIds)
                    ->orWhereIn('id', function ($q) use ($uniqueIds) {
                        $q->select('parent_id')
                            ->from('m_contract_types')
                            ->whereIn('id', $uniqueIds)
                            ->whereNotNull('parent_id');
                    })
                    ->get();
            },
            'submissionTypes' => fn () => SubmissionType::where('is_active', true)->get(),
        ];
    }
}
