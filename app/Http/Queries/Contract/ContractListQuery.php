<?php

namespace App\Http\Queries\Contract;

use App\Models\Master\User;
use App\Models\Master\Vendor;
use App\Models\Transaction\Contract;
use App\Services\ContractFilterScopeService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContractListQuery
{
    /**
     * Eager loads applied to every contract list query.
     */
    private const WITH = [
        'creator:id,name,role_id,department_id,division_id,company_id,email,nik,jobtitle_name,phone_number,mobile_no',
        'creator.department:id,name,code,idorg_group,org_group_name',
        'contractType:id,name,parent_id,ancestry_id,f1_input_mechanism,f1_form_template_id,f2_input_mechanism,f2_form_template_id,contract_input_mechanism,contract_form_template_id',
        'submissionType:id,name',
        'statusDetail:code,label,color,bg_color,icon',
        'workflow:id,name,contract_type_id,meta',
        'workflowStep:id,step,description,step_category,workflow_id,meta,is_visible,is_active,approver_type',
        'workflowStep.actions',
        'vendor:id,vendor_code,vendor_name,vendor_detail',
        'initiator:id,name,role_id,department_id,division_id,company_id,email,nik,jobtitle_name,phone_number,mobile_no',
        'initiator.department:id,name,code,idorg_group,org_group_name',
        'parent:id,form_no,contract_no,title',
        'assignedPic:id,name,role_id,department_id,division_id,company_id,email,nik,jobtitle_name,phone_number,mobile_no',
        'assignedPic.department:id,name,code,idorg_group,org_group_name',
        'approvals:id,contract_id,user_id,workflow_step_id,status,sub_step,decided_at,comment,updated_at',
    ];

    /**
     * Selected columns for list queries.
     */
    private const SELECT = [
        'id', 'form_no', 'title', 'description', 'contract_date', 'end_date',
        'contract_type_id', 'transaction_type', 'status', 'current_version',
        'workflow_id', 'origin_workflow_id', 'origin_workflow_step_id', 'workflow_step_id', 'created_by', 'submitted_at',
        'created_at', 'updated_at', 'initiated_by_id', 'vendor_id', 'parent_id',
        'submission_type_id', 'contract_no', 'assigned_pic_id', 'assigned_by_id',
        'received_at', 'assigned_at', 'finished_at', 'closed_at', 'closed_by',
        'contract_type_parent_id', 'contract_type_ancestry_id', 'metadata', 'is_digital_signature',
        'updated_by', 'is_in_sub_workflow', 'branch_step_number', 'current_step_number',
        'current_sub_workflow_id', 'workflow_iteration',
    ];

    /**
     * Build the filtered contracts query.
     */
    public function build(Request $request, string $view = 'contracts', bool $withRelations = true): Builder
    {
        $user = Auth::user();
        if ($user && $view !== 'mine' && $view !== 'pending' && $view !== 'duty' && $view !== 'assigned') {
            // Delegasikan semua scope organisasi ke service — satu tempat, satu aturan.
            (new ContractFilterScopeService)->applyToRequest($request, $user);
        }

        $query = Contract::query()->select(self::SELECT);
        if ($withRelations) {
            $query->with(self::WITH);
        }

        $this->applyViewFilter($query, $view, $request);
        $this->applySearchFilter($query, $request);
        $this->applyStatusFilter($query, $request, $view);
        $this->applyTypeFilter($query, $request);

        if ($view !== 'mine' && $view !== 'pending' && $view !== 'duty' && $view !== 'assigned') {
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
     * Apply view-specific constraints (mine, pending, duty, expiry, contracts, all).
     */
    private function applyViewFilter(Builder $query, string $view, Request $request): void
    {
        match ($view) {
            'mine' => $this->applyMineView($query, $request),
            'duty', 'my_duty', 'assigned' => $this->applyDutyView($query, $request),
            'organization', 'org_group' => $this->applyOrganizationView($query, $request),
            'pending' => $this->applyPendingView($query, $request),
            'expiry' => $this->applyExpiryView($query, $request),
            'archived' => $query->where(fn (Builder $q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at')),
            'in_progress' => $query->whereNotIn(DB::raw('LOWER(status)'), ['draft', 'approved', 'finalisasi', 'rejected', 'cancelled', 'archived'])->whereNull('closed_at'),
            'all' => $query->whereRaw('UPPER(status) != ?', ['DRAFT']),
            default => $this->applyContractsView($query, $request),
        };
    }

    private function applyMineView(Builder $query, Request $request): void
    {
        $query->mine();

        $mineTab = $request->input('mine_tab', $request->input('parent_tab', 'all'));
        $this->applyParentTabState($query, $mineTab, $request);
    }

    private function applyDutyView(Builder $query, Request $request): void
    {
        $query->duty();

        $dutyTab = $request->input('duty_tab', $request->input('parent_tab', 'all'));
        $this->applyParentTabState($query, $dutyTab, $request);
    }

    private function applyOrganizationView(Builder $query, Request $request): void
    {
        $query->whereRaw('UPPER(status) != ?', ['DRAFT']);
        $parentTab = $request->input('parent_tab', $request->input('org_tab', 'all'));

        $user = Auth::user();
        if ($user) {
            $userDept = $user->department_id ? DB::table('m_departments')->where('id', $user->department_id)->first() : null;
            $userOrgGroupId = $userDept?->idorg_group;
            $userOrgGroupName = $userDept?->org_group_name ?? $user->org_group_name;

            if ($userOrgGroupId || $userOrgGroupName) {
                $orgGroupDeptIds = DB::table('m_departments')
                    ->whereNull('deleted_at')
                    ->where('is_used', true)
                    ->where(function ($q) use ($userOrgGroupId, $userOrgGroupName) {
                        if ($userOrgGroupId) {
                            $q->where('idorg_group', $userOrgGroupId);
                        }
                        if ($userOrgGroupName) {
                            $q->orWhere('org_group_name', $userOrgGroupName);
                        }
                    })
                    ->pluck('id')
                    ->toArray();

                if (empty($orgGroupDeptIds)) {
                    $query->whereRaw('1 = 0');
                } else {
                    $this->filterByUserOrgField($query, 'department_id', $orgGroupDeptIds);
                }
            }
        }

        $this->applyParentTabState($query, $parentTab, $request);
    }

    private function applyPendingView(Builder $query, Request $request): void
    {
        $query->whereRaw('UPPER(status) != ?', ['DRAFT']);
        $approvalStatus = $request->input('approval_status') ?? $request->input('pending_tab', 'pending');

        if ($approvalStatus === 'pending') {
            $query->pendingApprovalFor();
        } elseif (in_array($approvalStatus, ['history', 'approved', 'rejected', 'revision'])) {
            $statuses = in_array($approvalStatus, ['approved', 'rejected', 'revision'])
                ? [$approvalStatus]
                : ['approved', 'rejected', 'revision'];
            $query->actedBy(Auth::id(), $statuses);
        } else {
            $query->where(function (Builder $sub): void {
                $sub->pendingApprovalFor()
                    ->orWhere(fn (Builder $q) => $q->actedBy(Auth::id()));
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
        $user = Auth::user();
        if ($user && ! $user->canViewGlobalContracts()) {
            $this->applyOrganizationView($query, $request);

            return;
        }

        $query->whereRaw('UPPER(status) != ?', ['DRAFT']);
        $parentTab = $request->input('parent_tab', 'all');

        $this->applyParentTabState($query, $parentTab, $request);
    }

    private function applyParentTabState(Builder $query, ?string $parentTab, Request $request): void
    {
        switch ($parentTab) {
            case 'archived':
                $query->where(fn (Builder $q) => $q->whereRaw('UPPER(status) = ?', ['ARCHIVED'])->orWhereNotNull('closed_at'));
                break;
            case 'in_progress':
                $query->whereNotIn(DB::raw('LOWER(status)'), ['draft', 'approved', 'finalisasi', 'rejected', 'cancelled', 'archived'])->whereNull('closed_at');
                break;
            default:
                $hasStatusFilter = $request->filled('status') || $request->filled('statuses');
                $hasSearch = $request->filled('search');
                if (! $hasStatusFilter && ! $hasSearch) {
                    $query->whereRaw('UPPER(status) != ?', ['ARCHIVED'])->whereNull('closed_at');
                }
                $this->applyParentTabFilter($query, $parentTab);
                break;
        }
    }

    private function applyParentTabFilter(Builder $query, ?string $tab): void
    {
        $this->whereTypeIn($query, $this->resolveParentTabTypeIds($tab));
    }

    /**
     * Restrict to contracts whose type or parent type is in $typeIds. No-op when empty.
     *
     * @param  array<string>  $typeIds
     */
    private function whereTypeIn(Builder $query, array $typeIds): void
    {
        if (empty($typeIds)) {
            return;
        }

        $query->where(function (Builder $q) use ($typeIds) {
            $q->whereIn('contract_type_id', $typeIds)
                ->orWhereIn('contract_type_parent_id', $typeIds);
        });
    }

    /**
     * Resolve a parent tab (id / code / name) to the parent id + all descendant type ids.
     *
     * @return array<string>
     */
    private function resolveParentTabTypeIds(?string $tab): array
    {
        if (empty($tab) || $tab === 'all') {
            return [];
        }

        $tabClean = trim($tab);
        $tabNormalized = strtolower(str_replace(['_', '-'], '', $tabClean));
        $tabSlug = Str::slug($tabClean);

        $parents = DB::table('m_contract_types')->whereNull('parent_id')->get();
        $targetParent = $parents->first(function ($p) use ($tabClean, $tabNormalized, $tabSlug) {
            // 1. Direct ID match (UUID)
            if ($p->id === $tabClean) {
                return true;
            }

            // 2. Canonical aliases (contract/kontrak, non_contract/non_kontrak, nda)
            if (in_array($tabNormalized, ['contract', 'kontrak', 'a1'], true) && (strtoupper($p->code ?? '') === 'A-1' || (stripos($p->name, 'non') === false && (stripos($p->name, 'kontrak') !== false || stripos($p->name, 'contract') !== false)))) {
                return true;
            }
            if (in_array($tabNormalized, ['noncontract', 'nonkontrak', 'a2'], true) && (strtoupper($p->code ?? '') === 'A-2' || stripos($p->name, 'non') !== false)) {
                return true;
            }
            if (in_array($tabNormalized, ['nda', 'kerahasiaan', 'perjanjiankerahasiaan'], true) && (strtoupper($p->code ?? '') === 'NDA' || stripos($p->name, 'nda') !== false || stripos($p->name, 'kerahasiaan') !== false)) {
                return true;
            }

            // 3. Code match (e.g. 'PA', 'A-1', 'A-2', 'NDA', 'TEST-REV-DOC')
            $codeClean = trim($p->code ?? '');
            if (! empty($codeClean)) {
                $codeNormalized = strtolower(str_replace(['_', '-'], '', $codeClean));
                if ($codeNormalized === $tabNormalized || Str::slug($codeClean) === $tabSlug) {
                    return true;
                }
            }

            // 4. Name match / slug match (e.g. 'Surat Kuasa', 'Kontrak', 'Non Kontrak')
            $nameClean = trim($p->name ?? '');
            if (! empty($nameClean)) {
                $nameNormalized = strtolower(str_replace(['_', '-'], '', $nameClean));
                if ($nameNormalized === $tabNormalized || Str::slug($nameClean) === $tabSlug) {
                    return true;
                }
            }

            return false;
        });

        return $targetParent
            ? array_merge([$targetParent->id], $this->getDescendantTypeIds($targetParent->id))
            : [];
    }

    /**
     * Apply full-text search filter across title, form_no, contract_no, creator name, PIC name, and approver name.
     */
    private function applySearchFilter(Builder $query, Request $request): void
    {
        if (! $request->filled('search')) {
            return;
        }

        $escaped = addcslashes($request->search, '%_\\');
        $search = mb_strtolower($escaped);
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

        $statuses = is_array($statusInput) ? $statusInput : explode(',', (string) $statusInput);
        $statuses = array_values(array_filter(array_map('trim', $statuses)));
        if ($view !== 'mine') {
            $statuses = array_values(array_filter($statuses, fn ($s) => strtoupper($s) !== 'DRAFT'));
        }

        if (empty($statuses)) {
            return;
        }

        $query->whereIn(DB::raw('UPPER(status)'), array_map('strtoupper', $statuses));
    }

    private function applyTypeFilter(Builder $query, Request $request): void
    {
        $typeInput = $request->input('contract_type_id') ?? $request->input('contract_type_ids');
        $categoryInput = $request->input('category') ?? $request->input('categories');

        // Scoping per category (e.g. from DashboardType profile) — categories are OR-ed together
        if (! empty($categoryInput) && $categoryInput !== 'all') {
            $categories = is_array($categoryInput) ? $categoryInput : explode(',', (string) $categoryInput);
            $categoryTypeIds = collect($categories)
                ->flatMap(fn ($cat) => $this->resolveParentTabTypeIds(trim((string) $cat)))
                ->unique()
                ->values()
                ->all();
            $this->whereTypeIn($query, $categoryTypeIds);
        }

        if (empty($typeInput) || $typeInput === 'all') {
            return;
        }

        $typeIds = is_array($typeInput) ? $typeInput : explode(',', (string) $typeInput);
        $typeIds = array_values(array_filter(array_map('trim', $typeIds)));
        if (empty($typeIds)) {
            return;
        }

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

        $picIds = is_array($picInput) ? $picInput : explode(',', (string) $picInput);
        $picIds = array_values(array_filter(array_map('trim', $picIds)));

        if (! empty($picIds)) {
            $query->whereIn('assigned_pic_id', $picIds);
        }
    }

    /**
     * Apply department filter resolving via initiator or creator fallback.
     */
    private function applyDepartmentFilter(Builder $query, Request $request): void
    {
        $cleanFn = fn ($id) => preg_replace('/^(g|r|c|d)_/', '', trim(explode('|', (string) $id)[0]));
        $this->applyOrgFieldFilter($query, 'department_id', $request->input('department_id') ?? $request->input('department_ids'), $cleanFn);
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
        $subInput = $request->input('submission_type_id') ?? $request->input('submission_type_ids');
        if (empty($subInput) || $subInput === 'all') {
            return;
        }

        $subIds = is_array($subInput) ? $subInput : explode(',', (string) $subInput);
        $subIds = array_values(array_filter(array_map('trim', $subIds)));

        if (! empty($subIds)) {
            $query->whereIn('submission_type_id', $subIds);
        }
    }

    private function applyOrgFilters(Builder $query, Request $request): void
    {
        $cleanFn = fn ($id) => preg_replace('/^(g|r|c|d)_/', '', trim(explode('|', (string) $id)[0]));

        $this->applyOrgFieldFilter($query, 'company_group_id', $request->input('company_group_id') ?? $request->input('company_group_ids'), $cleanFn);
        $this->applyOrgFieldFilter($query, 'region_id', $request->input('region_id') ?? $request->input('region_ids'), $cleanFn);
        $this->applyOrgFieldFilter($query, 'company_id', $request->input('company_id') ?? $request->input('company_ids'), $cleanFn);
        $this->applyOrgFieldFilter($query, 'division_id', $request->input('division_id') ?? $request->input('division_ids'), $cleanFn);
    }

    private function applyOrgFieldFilter(Builder $query, string $column, mixed $rawIds, \Closure $cleanFn): void
    {
        if (empty($rawIds) || $rawIds === 'all') {
            return;
        }
        $ids = is_array($rawIds) ? $rawIds : explode(',', (string) $rawIds);
        $cleanIds = array_values(array_unique(array_filter(array_map($cleanFn, $ids), fn ($id) => ! empty($id) && $id !== 'null')));

        $this->filterByUserOrgField($query, $column, $cleanIds);
    }

    /**
     * Scope query to only contracts whose initiator or creator belongs to the given org field values.
     */
    private function filterByUserOrgField(Builder $query, string $column, array $values): void
    {
        if (empty($values)) {
            return;
        }

        $query->where(function (Builder $q) use ($column, $values): void {
            $q->whereHas('initiator', fn (Builder $sq) => $sq->whereIn($column, $values))
                ->orWhere(fn (Builder $sq) => $sq->whereNull('initiated_by_id')->whereHas('creator', fn (Builder $ssq) => $ssq->whereIn($column, $values)));
        });
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

        // Normalize sorting aliases
        $normalizedSortBy = match ($sortBy) {
            'contract_no_title' => 'title',
            'contract_no' => 'form_no',
            'period' => 'contract_date',
            'initiator' => 'creator',
            default => $sortBy,
        };

        $customSorts = $this->getCustomSortExpressions($sortDir);

        if (isset($customSorts[$normalizedSortBy])) {
            $customSorts[$normalizedSortBy]($query);
        } elseif (in_array($normalizedSortBy, self::SELECT, true)) {
            $query->orderBy($normalizedSortBy, $sortDir);
        } else {
            $query->latest('created_at');
        }

        $query->orderBy('t_contracts.id', 'desc');
    }

    /**
     * Define custom sorting callbacks for complex/relational columns.
     *
     * @return array<string, \Closure(Builder): void>
     */
    private function getCustomSortExpressions(string $sortDir): array
    {
        $userSubquery = fn (string $columnExpr) => User::select('name')
            ->whereColumn('m_users.id', DB::raw($columnExpr))
            ->limit(1);

        $vendorSubquery = Vendor::select('vendor_name')
            ->whereColumn('m_vendors.id', 't_contracts.vendor_id')
            ->limit(1);

        return [
            'title' => fn (Builder $q) => $q->orderByRaw("COALESCE(t_contracts.title, t_contracts.form_no, t_contracts.contract_no) {$sortDir}"),
            'form_no' => fn (Builder $q) => $q->orderByRaw("COALESCE(t_contracts.form_no, t_contracts.contract_no) {$sortDir}"),
            'vendor' => fn (Builder $q) => $q->orderBy($vendorSubquery, $sortDir),
            'contract_date' => fn (Builder $q) => $q->orderBy('contract_date', $sortDir),
            'end_date' => fn (Builder $q) => $q->orderBy('end_date', $sortDir),
            'creator' => fn (Builder $q) => $q->orderBy($userSubquery('COALESCE(t_contracts.initiated_by_id, t_contracts.created_by)'), $sortDir),
            'assigned_pic' => fn (Builder $q) => $q->orderBy($userSubquery('t_contracts.assigned_pic_id'), $sortDir),
            'status' => fn (Builder $q) => $q->orderBy('status', $sortDir),
            'decided_at' => fn (Builder $q) => $q->orderBy(
                DB::table('t_approvals')
                    ->select('decided_at')
                    ->whereColumn('t_approvals.contract_id', 't_contracts.id')
                    ->where('t_approvals.user_id', Auth::id())
                    ->whereIn('t_approvals.status', ['approved', 'rejected', 'revision'])
                    ->latest('decided_at')
                    ->limit(1),
                $sortDir
            ),
            'decision' => fn (Builder $q) => $q->orderBy(
                DB::table('t_approvals')
                    ->select('status')
                    ->whereColumn('t_approvals.contract_id', 't_contracts.id')
                    ->where('t_approvals.user_id', Auth::id())
                    ->whereIn('t_approvals.status', ['approved', 'rejected', 'revision'])
                    ->latest('decided_at')
                    ->limit(1),
                $sortDir
            ),
            'created_at' => fn (Builder $q) => $q->orderBy('created_at', $sortDir),
            'updated_at' => fn (Builder $q) => $q->orderBy('updated_at', $sortDir),
        ];
    }
}
