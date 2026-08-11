<?php

namespace App\Http\Queries\Contract;

use App\Models\Contract;
use App\Services\ContractFilterScopeService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ContractListQuery
{
    /**
     * Eager loads applied to every contract list query.
     */
    private const WITH = [
        'creator:id,name,role_id,department_id,division_id,company_id,email',
        'creator.department:id,name',
        'creator.company:id,name,company_group_id,region_id',
        'contractType:id,name,parent_id,f1_input_mechanism,f1_form_template_id,f2_input_mechanism,f2_form_template_id,contract_input_mechanism,contract_form_template_id',
        'contractTypeParent:id,name,f1_input_mechanism,f1_form_template_id,f2_input_mechanism,f2_form_template_id,contract_input_mechanism,contract_form_template_id',
        'submissionType:id,name',
        'statusDetail:code,label',
        'approvals.approver:id,name,role_id,department_id,division_id,company_id,email',
        'approvals.workflowStep:id,step,description,step_category,workflow_id,meta',
        'workflow:id,name,contract_type_id,meta',
        'workflowStep:id,step,description,step_category,workflow_id,meta',
        'vendor:id,vendor_code,vendor_name,vendor_detail',
        'initiator:id,name,role_id,department_id,division_id,company_id,email',
        'initiator.department:id,name',
        'initiator.company:id,name,company_group_id,region_id',
        'parent:id,form_no,contract_no,title',
        'assignedPic:id,name,role_id,department_id,division_id,company_id,email',
        'assignedPic.department:id,name',
        'assignedBy:id,name,role_id,department_id,division_id,company_id,email',
        'assignedBy.department:id,name',
        'meta:contract_id,kop_topik,kop_sub_topik,p1_entity,p1_signer,p1_signer_position,p1_address,p2_entity,p2_signer,p2_signer_position,p2_address,f2_scope,f2_price,f2_payment,f2_tenure,f2_location',
    ];

    /**
     * Selected columns for list queries.
     */
    private const SELECT = [
        'id', 'form_no', 'title', 'description', 'contract_date', 'end_date',
        'contract_type_id', 'transaction_type', 'status', 'current_version',
        'workflow_id', 'workflow_step_id', 'created_by', 'submitted_at',
        'created_at', 'updated_at', 'initiated_by_id', 'vendor_id', 'parent_id',
        'submission_type_id', 'contract_no', 'assigned_pic_id', 'assigned_by_id',
        'contract_type_parent_id',
    ];

    /**
     * Build the filtered contracts query.
     */
    public function build(Request $request, string $view = 'contracts'): Builder
    {
        $user = Auth::user();
        if ($user) {
            // Delegasikan semua scope organisasi ke service — satu tempat, satu aturan.
            (new ContractFilterScopeService)->applyToRequest($request, $user);
        }

        $query = Contract::query()
            ->select(self::SELECT)
            ->with(self::WITH)
            ->latest();

        $this->applyViewFilter($query, $view, $request);
        $this->applySearchFilter($query, $request);
        $this->applyStatusFilter($query, $request, $view);
        $this->applyTypeFilter($query, $request);
        $this->applyDepartmentFilter($query, $request);
        $this->applyDateRangeFilter($query, $request);
        $this->applySubmissionTypeFilter($query, $request);
        $this->applyOrgFilters($query, $request);

        return $query;
    }

    /**
     * Apply view-specific constraints (mine, pending, expiry, f1, f2, contracts, all).
     */
    private function applyViewFilter(Builder $query, string $view, Request $request): void
    {
        switch ($view) {
            case 'mine':
                $query->where('created_by', Auth::id());

                $mineTab = $request->input('mine_tab', 'all');
                if ($mineTab === 'archived') {
                    $query->whereRaw('UPPER(status) = ?', ['ARCHIVED']);
                } elseif ($mineTab === 'in_progress') {
                    $query->whereIn('status', ['in_review', 'pending', 'locked']);
                } else {
                    $query->whereRaw('UPPER(status) != ?', ['ARCHIVED']);

                    if (in_array($mineTab, ['kontrak', 'non_kontrak', 'nda'])) {
                        $parents = DB::table('m_contract_types')->whereNull('parent_id')->get();
                        $targetParent = null;

                        if ($mineTab === 'kontrak') {
                            $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'A-1' || (stripos($p->name, 'non') === false && stripos($p->name, 'kontrak') !== false));
                        } elseif ($mineTab === 'non_kontrak') {
                            $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'A-2' || stripos($p->name, 'non') !== false);
                        } elseif ($mineTab === 'nda') {
                            $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false);
                        }

                        if ($targetParent) {
                            $getDescendantIds = function ($parentId) use (&$getDescendantIds) {
                                $ids = [$parentId];
                                $children = DB::table('m_contract_types')->where('parent_id', $parentId)->pluck('id')->toArray();
                                foreach ($children as $childId) {
                                    $ids = array_merge($ids, $getDescendantIds($childId));
                                }

                                return array_unique($ids);
                            };

                            $allDescendantIds = $getDescendantIds($targetParent->id);

                            $query->where(function (Builder $q) use ($allDescendantIds, $targetParent) {
                                $q->whereIn('contract_type_id', $allDescendantIds)
                                  ->orWhere('contract_type_parent_id', $targetParent->id);
                            });
                        }
                    }
                }
                break;

            case 'pending':
                $pendingTab = $request->input('pending_tab', 'pending');

                if ($pendingTab === 'history') {
                    $query->whereRaw('UPPER(status) != ?', ['DRAFT'])
                        ->whereHas('approvals', function (Builder $q): void {
                            $q->where('user_id', Auth::id())
                                ->whereIn('status', ['approved', 'rejected', 'revision']);
                        });
                } else {
                    $query->whereRaw('UPPER(status) != ?', ['DRAFT'])
                        ->whereHas('approvals', function (Builder $q): void {
                            $q->where('user_id', Auth::id())
                                ->where('status', 'pending')
                                ->whereColumn('workflow_step_id', 't_contracts.workflow_step_id');
                        });
                }
                break;

            case 'expiry':
                $query->whereRaw('UPPER(status) != ?', ['DRAFT'])
                    ->whereNotNull('end_date');

                $expiryTab = $request->input('expiry_tab', 'all');
                if (in_array($expiryTab, ['kontrak', 'non_kontrak', 'nda'])) {
                    $parents = DB::table('m_contract_types')->whereNull('parent_id')->get();
                    $targetParent = null;

                    if ($expiryTab === 'kontrak') {
                        $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'A-1' || (stripos($p->name, 'non') === false && stripos($p->name, 'kontrak') !== false));
                    } elseif ($expiryTab === 'non_kontrak') {
                        $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'A-2' || stripos($p->name, 'non') !== false);
                    } elseif ($expiryTab === 'nda') {
                        $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false);
                    }

                    if ($targetParent) {
                        $getDescendantIds = function ($parentId) use (&$getDescendantIds) {
                            $ids = [$parentId];
                            $children = DB::table('m_contract_types')->where('parent_id', $parentId)->pluck('id')->toArray();
                            foreach ($children as $childId) {
                                $ids = array_merge($ids, $getDescendantIds($childId));
                            }

                            return array_unique($ids);
                        };

                        $allDescendantIds = $getDescendantIds($targetParent->id);

                        $query->where(function (Builder $q) use ($allDescendantIds, $targetParent) {
                            $q->whereIn('contract_type_id', $allDescendantIds)
                              ->orWhere('contract_type_parent_id', $targetParent->id);
                        });
                    }
                }
                break;

            case 'archived':
                $query->whereRaw('UPPER(status) = ?', ['ARCHIVED']);
                break;

            case 'in_progress':
                $query->whereIn('status', ['in_review', 'revision', 'pending', 'locked']);
                break;

            case 'f1':
                $query->whereRaw('UPPER(status) != ?', ['DRAFT'])
                    ->whereHas('versions', fn (Builder $q) => $q->where('document_type', 'f1'));
                break;

            case 'f2':
                $query->whereRaw('UPPER(status) != ?', ['DRAFT'])
                    ->whereHas('versions', fn (Builder $q) => $q->where('document_type', 'f2'));
                break;

            case 'all':
                $query->whereRaw('UPPER(status) != ?', ['DRAFT']);
                break;

            case 'contracts':
            default:
                $query->whereRaw('UPPER(status) != ?', ['DRAFT']);

                $parentTab = $request->input('parent_tab', 'all');
                if ($parentTab === 'archived') {
                    $query->whereRaw('UPPER(status) = ?', ['ARCHIVED']);
                } elseif ($parentTab === 'in_progress') {
                    $query->whereIn('status', ['in_review', 'pending', 'locked']);
                } else {
                    $query->whereRaw('UPPER(status) != ?', ['ARCHIVED']);

                    if (in_array($parentTab, ['kontrak', 'non_kontrak', 'nda'])) {
                        $parents = DB::table('m_contract_types')->whereNull('parent_id')->get();
                        $targetParent = null;

                        if ($parentTab === 'kontrak') {
                            $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'A-1' || (stripos($p->name, 'non') === false && stripos($p->name, 'kontrak') !== false));
                        } elseif ($parentTab === 'non_kontrak') {
                            $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'A-2' || stripos($p->name, 'non') !== false);
                        } elseif ($parentTab === 'nda') {
                            $targetParent = $parents->first(fn ($p) => strtoupper($p->code) === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false);
                        }

                        if ($targetParent) {
                            $getDescendantIds = function ($parentId) use (&$getDescendantIds) {
                                $ids = [$parentId];
                                $children = DB::table('m_contract_types')->where('parent_id', $parentId)->pluck('id')->toArray();
                                foreach ($children as $childId) {
                                    $ids = array_merge($ids, $getDescendantIds($childId));
                                }

                                return array_unique($ids);
                            };

                            $allDescendantIds = $getDescendantIds($targetParent->id);

                            $query->where(function (Builder $q) use ($allDescendantIds, $targetParent) {
                                $q->whereIn('contract_type_id', $allDescendantIds)
                                  ->orWhere('contract_type_parent_id', $targetParent->id);
                            });
                        }
                    }
                }
                break;
        }
    }

    /**
     * Apply full-text search filter across title, form_no, contract_no and creator name.
     */
    private function applySearchFilter(Builder $query, Request $request): void
    {
        if (! $request->filled('search')) {
            return;
        }

        $search = strtolower($request->search);
        $query->where(function (Builder $q) use ($search): void {
            $q->where(DB::raw('LOWER(title)'), 'like', "%{$search}%")
                ->orWhere(DB::raw('LOWER(form_no)'), 'like', "%{$search}%")
                ->orWhere(DB::raw('LOWER(contract_no)'), 'like', "%{$search}%")
                ->orWhereHas('creator', fn (Builder $uq) => $uq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%"));
        });
    }

    /**
     * Apply status filter (single value or array).
     */
    private function applyStatusFilter(Builder $query, Request $request, string $view): void
    {
        if (! $request->filled('status') || $request->status === 'all') {
            return;
        }

        if (is_array($request->status)) {
            $statuses = $request->status;
            if ($view !== 'mine') {
                $statuses = array_filter($statuses, fn ($s) => strtoupper($s) !== 'DRAFT');
            }
            if (empty($statuses)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn(\DB::raw('UPPER(status)'), array_map('strtoupper', array_values($statuses)));
            }
        } else {
            if ($view !== 'mine' && strtoupper($request->status) === 'DRAFT') {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereRaw('UPPER(status) = ?', [strtoupper($request->status)]);
            }
        }
    }

    private function applyTypeFilter(Builder $query, Request $request): void
    {
        if (! $request->filled('contract_type_id') || $request->contract_type_id === 'all') {
            return;
        }

        $typeIds = is_array($request->contract_type_id)
            ? $request->contract_type_id
            : [$request->contract_type_id];

        $allIds = [];
        foreach ($typeIds as $id) {
            if ($id) {
                $allIds[] = $id;
                $allIds = array_merge($allIds, $this->getDescendantTypeIds($id));
            }
        }
        $allIds = array_unique(array_filter($allIds));

        $query->whereIn('contract_type_id', $allIds);
    }

    /**
     * Recursively retrieve all descendant IDs for a contract type.
     *
     * @return array<string>
     */
    private function getDescendantTypeIds(?string $parentId): array
    {
        if (! $parentId) {
            return [];
        }
        $childIds = DB::table('m_contract_types')
            ->where('parent_id', $parentId)
            ->pluck('id')
            ->toArray();

        $descendants = [];
        foreach ($childIds as $id) {
            $descendants[] = $id;
            $descendants = array_merge($descendants, $this->getDescendantTypeIds($id));
        }

        return $descendants;
    }

    /**
     * Apply department filter resolving via initiator or creator fallback.
     */
    private function applyDepartmentFilter(Builder $query, Request $request): void
    {
        $user = Auth::user();
        $settings = $user ? $user->getContractFilterSettings() : [];
        $roleName = $user ? $user->role : null;
        $hasFullAccess = $user ? in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']) : false;

        $allowedDeps = ! empty($settings['allowed_departments'])
            ? collect($settings['allowed_departments'])->map(fn ($id) => $id === '[USER_LOGIN]' ? strval($user->department_id) : $id)->filter(fn ($id) => ! empty($id) && $id !== 'null' && $id !== '[USER_LOGIN]')->unique()->toArray()
            : [];

        $departmentId = $request->department_id;

        if (empty($departmentId) && ! $hasFullAccess && ! empty($allowedDeps)) {
            $departmentId = $allowedDeps;
        }

        if (empty($departmentId)) {
            return;
        }

        $isArray = is_array($departmentId);

        $query->where(function (Builder $q) use ($departmentId, $isArray): void {
            $q->whereHas('initiator', function (Builder $sq) use ($departmentId, $isArray): void {
                if ($isArray) {
                    $sq->whereIn('department_id', $departmentId);
                } else {
                    $sq->where('department_id', $departmentId);
                }
            })->orWhere(function (Builder $sq) use ($departmentId, $isArray): void {
                $sq->whereNull('initiated_by_id')
                    ->whereHas('creator', function (Builder $ssq) use ($departmentId, $isArray): void {
                        if ($isArray) {
                            $ssq->whereIn('department_id', $departmentId);
                        } else {
                            $ssq->where('department_id', $departmentId);
                        }
                    });
            });
        });
    }

    /**
     * Apply date range filter on created_at.
     */
    private function applyDateRangeFilter(Builder $query, Request $request): void
    {
        if ($request->filled('created_from')) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }

        if ($request->filled('created_to')) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }
    }

    /**
     * Apply submission type filter (single value or array).
     */
    private function applySubmissionTypeFilter(Builder $query, Request $request): void
    {
        if (! $request->filled('submission_type_id') || $request->submission_type_id === 'all') {
            return;
        }

        if (is_array($request->submission_type_id)) {
            $query->whereIn('submission_type_id', $request->submission_type_id);
        } else {
            $query->where('submission_type_id', $request->submission_type_id);
        }
    }

    private function applyOrgFilters(Builder $query, Request $request): void
    {
        // Request sudah di-scope oleh ContractFilterScopeService di build().
        // Method ini hanya menerjemahkan nilai yang ada di request ke kondisi WHERE.
        // ponytail: hapus prefix g_, r_, c_ untuk kompatibilitas tipe UUID di DB
        $cleanFn = fn ($id) => preg_replace('/^(g|r|c)_/', '', trim($id));

        // 1. Company Group
        $groupIds = $request->company_group_id;
        if (! empty($groupIds)) {
            $groupIds = is_array($groupIds) ? $groupIds : [$groupIds];
            $cleanGroupIds = collect($groupIds)
                ->map(fn ($id) => $cleanFn(head(explode('|', $id))))
                ->filter(fn ($id) => ! empty($id) && $id !== 'null')
                ->unique()
                ->toArray();

            if (! empty($cleanGroupIds)) {
                $query->where(function (Builder $q) use ($cleanGroupIds) {
                    $q->whereHas('initiator', fn ($sq) => $sq->whereIn('company_group_id', $cleanGroupIds))
                        ->orWhere(fn ($sq) => $sq->whereNull('initiated_by_id')->whereHas('creator', fn ($ssq) => $ssq->whereIn('company_group_id', $cleanGroupIds)));
                });
            }
        }

        // 2. Region
        $regionIds = $request->region_id;
        if (! empty($regionIds)) {
            $regionIds = is_array($regionIds) ? $regionIds : [$regionIds];
            $cleanRegionIds = collect($regionIds)
                ->map(fn ($id) => $cleanFn($id))
                ->filter(fn ($id) => ! empty($id) && $id !== 'null')
                ->unique()
                ->toArray();

            if (! empty($cleanRegionIds)) {
                $query->where(function (Builder $q) use ($cleanRegionIds, $cleanFn) {
                    $q->where(function (Builder $sub) use ($cleanRegionIds, $cleanFn) {
                        foreach ($cleanRegionIds as $rId) {
                            if (str_contains($rId, '|')) {
                                $parts = explode('|', $rId);
                                $gId = $cleanFn($parts[0]);
                                $realRegionId = $cleanFn($parts[1]);

                                $sub->orWhere(function (Builder $inner) use ($gId, $realRegionId) {
                                    $inner->whereHas('initiator', function ($sq) use ($gId, $realRegionId) {
                                        $sq->where('company_group_id', $gId);
                                        if ($realRegionId === 'null') {
                                            $sq->whereNull('region_id');
                                        } else {
                                            $sq->where('region_id', $realRegionId);
                                        }
                                    })->orWhere(function ($sq) use ($gId, $realRegionId) {
                                        $sq->whereNull('initiated_by_id')->whereHas('creator', function ($ssq) use ($gId, $realRegionId) {
                                            $ssq->where('company_group_id', $gId);
                                            if ($realRegionId === 'null') {
                                                $ssq->whereNull('region_id');
                                            } else {
                                                $ssq->where('region_id', $realRegionId);
                                            }
                                        });
                                    });
                                });
                            } else {
                                $sub->orWhere(function (Builder $inner) use ($rId) {
                                    $inner->whereHas('initiator', fn ($sq) => $sq->where('region_id', $rId))
                                        ->orWhere(fn ($sq) => $sq->whereNull('initiated_by_id')->whereHas('creator', fn ($ssq) => $ssq->where('region_id', $rId)));
                                });
                            }
                        }
                    });
                });
            }
        }

        // 3. Company
        $companyIds = $request->company_id;
        if (! empty($companyIds)) {
            $companyIds = is_array($companyIds) ? $companyIds : [$companyIds];
            $cleanCompanyIds = collect($companyIds)
                ->map(fn ($id) => $cleanFn($id))
                ->filter(fn ($id) => ! empty($id) && $id !== 'null')
                ->unique()
                ->toArray();

            if (! empty($cleanCompanyIds)) {
                $query->where(function (Builder $q) use ($cleanCompanyIds, $cleanFn) {
                    $q->where(function (Builder $sub) use ($cleanCompanyIds, $cleanFn) {
                        foreach ($cleanCompanyIds as $cId) {
                            if (str_contains($cId, '|')) {
                                $parts = explode('|', $cId);
                                $gId = $cleanFn($parts[0]);
                                $realCompanyId = $cleanFn(end($parts));

                                $sub->orWhere(function (Builder $inner) use ($gId, $realCompanyId) {
                                    $inner->whereHas('initiator', function ($sq) use ($gId, $realCompanyId) {
                                        $sq->where('company_group_id', $gId)->where('company_id', $realCompanyId);
                                    })->orWhere(function ($sq) use ($gId, $realCompanyId) {
                                        $sq->whereNull('initiated_by_id')->whereHas('creator', function ($ssq) use ($gId, $realCompanyId) {
                                            $ssq->where('company_group_id', $gId)->where('company_id', $realCompanyId);
                                        });
                                    });
                                });
                            } else {
                                $sub->orWhere(function (Builder $inner) use ($cId) {
                                    $inner->whereHas('initiator', fn ($sq) => $sq->where('company_id', $cId))
                                        ->orWhere(fn ($sq) => $sq->whereNull('initiated_by_id')->whereHas('creator', fn ($ssq) => $ssq->where('company_id', $cId)));
                                });
                            }
                        }
                    });
                });
            }
        }

        // 4. Division
        $divisionIds = $request->division_id;
        if (! empty($divisionIds)) {
            $divisionIds = is_array($divisionIds) ? $divisionIds : [$divisionIds];
            $cleanDivisionIds = collect($divisionIds)
                ->filter(fn ($id) => ! empty($id) && $id !== 'null')
                ->unique()
                ->toArray();

            if (! empty($cleanDivisionIds)) {
                $query->where(function (Builder $q) use ($cleanDivisionIds) {
                    $q->whereHas('initiator', fn ($sq) => $sq->whereIn('division_id', $cleanDivisionIds))
                        ->orWhere(fn ($sq) => $sq->whereNull('initiated_by_id')->whereHas('creator', fn ($ssq) => $ssq->whereIn('division_id', $cleanDivisionIds)));
                });
            }
        }
    }
}
