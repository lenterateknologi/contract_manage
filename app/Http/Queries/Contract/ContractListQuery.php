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
        'creator:id,name,role_id,department_id,division_id,company_id,email,spv_id,idreporting_to,reporting_to,nik,jobtitle_name,phone_number,mobile_no',
        'creator.department:id,name',
        'creator.company:id,name,company_group_id,region_id',
        'contractType:id,name,parent_id,f1_input_mechanism,f1_form_template_id,f2_input_mechanism,f2_form_template_id,contract_input_mechanism,contract_form_template_id',
        'contractTypeParent:id,name,f1_input_mechanism,f1_form_template_id,f2_input_mechanism,f2_form_template_id,contract_input_mechanism,contract_form_template_id',
        'submissionType:id,name',
        'statusDetail:code,label,color,bg_color,icon',
        'approvals.approver:id,name,role_id,department_id,division_id,company_id,email,spv_id,idreporting_to,reporting_to,nik,jobtitle_name,phone_number,mobile_no',
        'approvals.approver.department:id,name',
        'approvals.workflowStep:id,step,description,step_category,workflow_id,meta,is_visible,is_active,approver_type,filter_department,filter_company_group,filter_region,filter_company',
        'approvals.workflowStep.workflow:id,name,contract_type_id,meta',
        'workflow:id,name,contract_type_id,meta',
        'workflowStep:id,step,description,step_category,workflow_id,meta,is_visible,is_active,approver_type,filter_department,filter_company_group,filter_region,filter_company',
        'workflowStep.workflow:id,name,contract_type_id,meta',
        'vendor:id,vendor_code,vendor_name,vendor_detail',
        'initiator:id,name,role_id,department_id,division_id,company_id,email,spv_id,idreporting_to,reporting_to,nik,jobtitle_name,phone_number,mobile_no',
        'initiator.department:id,name',
        'initiator.company:id,name,company_group_id,region_id',
        'parent:id,form_no,contract_no,title',
        'assignedPic:id,name,role_id,department_id,division_id,company_id,email,spv_id,idreporting_to,reporting_to,nik,jobtitle_name,phone_number,mobile_no',
        'assignedPic.department:id,name',
        'assignedBy:id,name,role_id,department_id,division_id,company_id,email,spv_id,idreporting_to,reporting_to,nik,jobtitle_name,phone_number,mobile_no',
        'assignedBy.department:id,name',
        'meta:contract_id,kop_topik,kop_sub_topik,p1_entity,p1_signer,p1_signer_position,p1_address,p2_entity,p2_signer,p2_signer_position,p2_address,f2_scope,f2_price,f2_payment,f2_tenure,f2_location',
    ];

    /**
     * Selected columns for list queries.
     */
    private const SELECT = [
        'id', 'form_no', 'title', 'description', 'contract_date', 'end_date',
        'contract_type_id', 'transaction_type', 'status', 'current_version',
        'workflow_id', 'origin_workflow_id', 'workflow_step_id', 'created_by', 'submitted_at',
        'created_at', 'updated_at', 'initiated_by_id', 'vendor_id', 'parent_id',
        'submission_type_id', 'contract_no', 'assigned_pic_id', 'assigned_by_id',
        'received_at', 'assigned_at', 'finished_at', 'closed_at', 'closed_by',
        'contract_type_parent_id', 'metadata', 'is_digital_signature',
        'updated_by', 'is_in_sub_workflow', 'branch_step_number', 'current_step_number',
        'current_sub_workflow_id', 'workflow_iteration',
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
            ->with(self::WITH);

        $this->applyViewFilter($query, $view, $request);
        $this->applySearchFilter($query, $request);
        $this->applyStatusFilter($query, $request, $view);
        $this->applyTypeFilter($query, $request);

        // Untuk view 'pending' dan 'mine', query sudah spesifik user_id yang bersangkutan,
        // sehingga tidak boleh dibatasi oleh scope organisasi/departemen default.
        if ($view !== 'pending' && $view !== 'mine') {
            $this->applyDepartmentFilter($query, $request);
            $this->applyOrgFilters($query, $request);
        }

        $this->applyDateRangeFilter($query, $request);
        $this->applyPicFilter($query, $request);
        $this->applySubmissionTypeFilter($query, $request);
        $this->applySorting($query, $request, $view);

        return $query;
    }

    /**
     * Apply view-specific constraints (mine, pending, expiry, f1, f2, contracts, all).
     */
    private function applyViewFilter(Builder $query, string $view, Request $request): void
    {
        match ($view) {
            'mine' => $this->applyMineView($query, $request),
            'pending' => $this->applyPendingView($query, $request),
            'expiry' => $this->applyExpiryView($query, $request),
            'archived' => $query->where(fn (Builder $q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at')),
            'in_progress' => $query->whereIn('status', ['in_review', 'revision', 'pending', 'locked'])->whereNull('closed_at'),
            'f1' => $query->whereRaw('UPPER(status) != ?', ['DRAFT'])->whereHas('versions', fn (Builder $q) => $q->where('document_type', 'f1')),
            'f2' => $query->whereRaw('UPPER(status) != ?', ['DRAFT'])->whereHas('versions', fn (Builder $q) => $q->where('document_type', 'f2')),
            'all' => $query->whereRaw('UPPER(status) != ?', ['DRAFT']),
            default => $this->applyContractsView($query, $request),
        };
    }

    private function applyMineView(Builder $query, Request $request): void
    {
        $userId = Auth::id();
        $query->where(function (Builder $q) use ($userId): void {
            $q->where('created_by', $userId)
                ->orWhere('initiated_by_id', $userId);
        });
        $mineTab = $request->input('mine_tab', 'all');

        if ($mineTab === 'archived') {
            $query->where(fn (Builder $q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'));
        } elseif ($mineTab === 'in_progress') {
            $query->whereIn('status', ['in_review', 'pending', 'locked'])->whereNull('closed_at');
        } else {
            $query->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
            $this->applyParentTabFilter($query, $mineTab);
        }
    }

    private function applyPendingView(Builder $query, Request $request): void
    {
        $pendingTab = $request->input('pending_tab', 'pending');
        $query->whereRaw('UPPER(status) != ?', ['DRAFT']);

        if ($pendingTab === 'history') {
            $query->whereHas('approvals', function (Builder $q): void {
                $q->where('user_id', Auth::id())
                    ->whereIn('status', ['approved', 'rejected', 'revision']);
            });
        } else {
            $query->whereHas('approvals', function (Builder $q): void {
                $q->where('user_id', Auth::id())
                    ->where('status', 'pending')
                    ->whereColumn('workflow_step_id', 't_contracts.workflow_step_id');
            });
        }
    }

    private function applyExpiryView(Builder $query, Request $request): void
    {
        $query->whereRaw('UPPER(status) != ?', ['DRAFT'])
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<=', now()->addDays(30)->toDateString());

        $this->applyParentTabFilter($query, $request->input('expiry_tab', 'all'));
    }

    private function applyContractsView(Builder $query, Request $request): void
    {
        $query->whereRaw('UPPER(status) != ?', ['DRAFT']);
        $parentTab = $request->input('parent_tab', 'all');

        if ($parentTab === 'archived') {
            $query->where(fn (Builder $q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'));
        } elseif ($parentTab === 'in_progress') {
            $query->whereIn('status', ['in_review', 'pending', 'locked'])->whereNull('closed_at');
        } else {
            $hasStatusFilter = $request->filled('status') || $request->filled('statuses');
            $hasSearch = $request->filled('search');
            if (! $hasStatusFilter && ! $hasSearch) {
                $query->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
            }
            $this->applyParentTabFilter($query, $parentTab);
        }
    }

    private function applyParentTabFilter(Builder $query, ?string $tab): void
    {
        if (! in_array($tab, ['kontrak', 'non_kontrak', 'nda'], true)) {
            return;
        }

        $parents = DB::table('m_contract_types')->whereNull('parent_id')->get();
        $targetParent = match ($tab) {
            'kontrak' => $parents->first(fn ($p) => strtoupper($p->code) === 'A-1' || (stripos($p->name, 'non') === false && stripos($p->name, 'kontrak') !== false)),
            'non_kontrak' => $parents->first(fn ($p) => strtoupper($p->code) === 'A-2' || stripos($p->name, 'non') !== false),
            'nda' => $parents->first(fn ($p) => strtoupper($p->code) === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false),
            default => null,
        };

        if ($targetParent) {
            $allDescendantIds = array_merge([$targetParent->id], $this->getDescendantTypeIds($targetParent->id));
            $query->where(function (Builder $q) use ($allDescendantIds) {
                $q->whereIn('contract_type_id', $allDescendantIds)
                    ->orWhereIn('contract_type_parent_id', $allDescendantIds);
            });
        }
    }

    /**
     * Apply full-text search filter across title, form_no, contract_no, creator name, PIC name, and approver name.
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
                ->orWhereHas('creator', fn (Builder $uq) => $uq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%"))
                ->orWhereHas('assignedPic', fn (Builder $uq) => $uq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%"))
                ->orWhereHas('approvals.approver', fn (Builder $uq) => $uq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%"));
        });
    }

    /**
     * Apply status filter (single value or array).
     */
    private function applyStatusFilter(Builder $query, Request $request, string $view): void
    {
        $statusInput = $request->input('status') ?? $request->input('statuses');
        if (! $statusInput || $statusInput === 'all') {
            return;
        }

        if (is_array($statusInput)) {
            $statuses = array_values(array_filter($statusInput));
            if ($view !== 'mine') {
                $statuses = array_filter($statuses, fn ($s) => strtoupper($s) !== 'DRAFT');
            }
            if (empty($statuses)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn(\DB::raw('UPPER(status)'), array_map('strtoupper', array_values($statuses)));
            }
        } else {
            if ($view !== 'mine' && strtoupper($statusInput) === 'DRAFT') {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereRaw('UPPER(status) = ?', [strtoupper($statusInput)]);
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
     * Apply assigned PIC filter (single value or array).
     */
    private function applyPicFilter(Builder $query, Request $request): void
    {
        $picInput = $request->input('pic_ids') ?? $request->input('assigned_pic_id') ?? $request->input('pic_id');
        if (empty($picInput) || $picInput === 'all') {
            return;
        }

        $picIds = is_array($picInput) ? $picInput : [$picInput];
        $picIds = array_values(array_filter($picIds));

        if (! empty($picIds)) {
            $query->whereIn('assigned_pic_id', $picIds);
        }
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
        $cleanFn = fn ($id) => preg_replace('/^(g|r|c)_/', '', trim($id));

        $this->applyCompanyGroupFilter($query, $request->company_group_id, $cleanFn);
        $this->applyRegionFilter($query, $request->region_id, $cleanFn);
        $this->applyCompanyFilter($query, $request->company_id, $cleanFn);
        $this->applyDivisionFilter($query, $request->division_id);
    }

    private function applyCompanyGroupFilter(Builder $query, mixed $groupIds, \Closure $cleanFn): void
    {
        if (empty($groupIds)) {
            return;
        }
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

    private function applyRegionFilter(Builder $query, mixed $regionIds, \Closure $cleanFn): void
    {
        if (empty($regionIds)) {
            return;
        }
        $regionIds = is_array($regionIds) ? $regionIds : [$regionIds];
        $cleanRegionIds = collect($regionIds)
            ->map(fn ($id) => $cleanFn($id))
            ->filter(fn ($id) => ! empty($id) && $id !== 'null')
            ->unique()
            ->toArray();

        if (empty($cleanRegionIds)) {
            return;
        }

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

    private function applyCompanyFilter(Builder $query, mixed $companyIds, \Closure $cleanFn): void
    {
        if (empty($companyIds)) {
            return;
        }
        $companyIds = is_array($companyIds) ? $companyIds : [$companyIds];
        $cleanCompanyIds = collect($companyIds)
            ->map(fn ($id) => $cleanFn($id))
            ->filter(fn ($id) => ! empty($id) && $id !== 'null')
            ->unique()
            ->toArray();

        if (empty($cleanCompanyIds)) {
            return;
        }

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

    private function applyDivisionFilter(Builder $query, mixed $divisionIds): void
    {
        if (empty($divisionIds)) {
            return;
        }
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

    /**
     * Apply ordering / sorting to query based on request parameters.
     */
    private function applySorting(Builder $query, Request $request, string $view = 'contracts'): void
    {
        $sortBy = $request->input('sort_by') ?? $request->input('sortBy');
        $sortDir = strtolower($request->input('sort_dir') ?? $request->input('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (empty($sortBy)) {
            if ($view === 'expiry') {
                $query->orderBy('end_date', 'asc');
            } else {
                $query->latest('created_at');
            }

            return;
        }

        $customSorts = $this->getCustomSortExpressions($sortDir);

        if (isset($customSorts[$sortBy])) {
            $customSorts[$sortBy]($query);
        } elseif (in_array($sortBy, self::SELECT, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->latest('created_at');
        }
    }

    /**
     * Define custom sorting callbacks for complex/relational columns.
     *
     * @return array<string, \Closure(Builder): void>
     */
    private function getCustomSortExpressions(string $sortDir): array
    {
        $userSubquery = fn (string $columnExpr) => \App\Models\User::select('name')
            ->whereColumn('m_users.id', DB::raw($columnExpr))
            ->limit(1);

        $vendorSubquery = \App\Models\Vendor::select('vendor_name')
            ->whereColumn('m_vendors.id', 't_contracts.vendor_id')
            ->limit(1);

        return [
            'contract_no_title' => fn (Builder $q) => $q->orderByRaw("COALESCE(t_contracts.title, t_contracts.form_no, t_contracts.contract_no) {$sortDir}"),
            'title' => fn (Builder $q) => $q->orderByRaw("COALESCE(t_contracts.title, t_contracts.form_no, t_contracts.contract_no) {$sortDir}"),
            'contract_no' => fn (Builder $q) => $q->orderByRaw("COALESCE(t_contracts.form_no, t_contracts.contract_no) {$sortDir}"),
            'form_no' => fn (Builder $q) => $q->orderByRaw("COALESCE(t_contracts.form_no, t_contracts.contract_no) {$sortDir}"),
            'vendor' => fn (Builder $q) => $q->orderBy($vendorSubquery, $sortDir),
            'period' => fn (Builder $q) => $q->orderBy('contract_date', $sortDir),
            'contract_date' => fn (Builder $q) => $q->orderBy('contract_date', $sortDir),
            'end_date' => fn (Builder $q) => $q->orderBy('end_date', $sortDir),
            'initiator' => fn (Builder $q) => $q->orderBy($userSubquery('COALESCE(t_contracts.initiated_by_id, t_contracts.created_by)'), $sortDir),
            'creator' => fn (Builder $q) => $q->orderBy($userSubquery('COALESCE(t_contracts.initiated_by_id, t_contracts.created_by)'), $sortDir),
            'assigned_pic' => fn (Builder $q) => $q->orderBy($userSubquery('t_contracts.assigned_pic_id'), $sortDir),
            'status' => fn (Builder $q) => $q->orderBy('status', $sortDir),
            'created_at' => fn (Builder $q) => $q->orderBy('created_at', $sortDir),
            'updated_at' => fn (Builder $q) => $q->orderBy('updated_at', $sortDir),
        ];
    }
}
