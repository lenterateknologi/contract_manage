<?php

namespace App\Http\Queries\Contract;

use App\Models\Contract;
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
        'contractType:id,name',
        'contractTypeParent:id,name',
        'submissionType:id,name',
        'statusDetail:code,label',
        'approvals.approver:id,name,role_id,department_id,division_id,company_id,email',
        'approvals.approver.department:id,name',
        'approvals.workflowStep:id,step,description,step_category,workflow_id',
        'approvals.workflowStep.workflow:id,name,contract_type_id,meta',
        'workflow:id,name,contract_type_id,meta',
        'workflow.steps:id,workflow_id,step,description,approver_type,step_category,meta,filter_department,filter_company_group,filter_region,filter_company',
        'workflow.steps.users:id,name,email',
        'workflowStep',
        'workflowStep.actions',
        'versions.uploader:id,name,role_id,department_id,division_id,company_id,email',
        'histories.actor:id,name,role_id,department_id,division_id,company_id,email',
        'messages.user:id,name,role_id,department_id,division_id,company_id,email',
        'attachments.uploader:id,name,role_id,department_id,division_id,company_id,email',
        'formSubmissions:id,contract_id,document_type,form_template_id,current_version,submitted_by,updated_at',
        'vendor:id,name,pic_name,pic_position,address',
        'vendor.documents:id,vendor_id,document_name,document_type',
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
        $query = Contract::query()
            ->select(self::SELECT)
            ->with(self::WITH)
            ->latest();

        $this->applyViewFilter($query, $view);
        $this->applySearchFilter($query, $request);
        $this->applyStatusFilter($query, $request, $view);
        $this->applyTypeFilter($query, $request);
        $this->applyDepartmentFilter($query, $request);
        $this->applyDateRangeFilter($query, $request);
        $this->applySubmissionTypeFilter($query, $request);

        return $query;
    }

    /**
     * Apply view-specific constraints (mine, pending, expiry, f1, f2, contracts, all).
     */
    private function applyViewFilter(Builder $query, string $view): void
    {
        switch ($view) {
            case 'mine':
                $query->where('t_contracts.created_by', Auth::id());
                break;

            case 'pending':
                $query->whereRaw('UPPER(status) != ?', ['DRAFT'])
                    ->whereHas('approvals', function (Builder $q): void {
                        $q->where('user_id', Auth::id())
                            ->where('status', 'pending')
                            ->whereColumn('workflow_step_id', 't_contracts.workflow_step_id');
                    });
                break;

            case 'expiry':
                $query->whereRaw('UPPER(status) != ?', ['DRAFT'])
                    ->whereNotNull('end_date');
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

    /**
     * Apply contract type filter (single value or array).
     */
    private function applyTypeFilter(Builder $query, Request $request): void
    {
        if (! $request->filled('contract_type_id') || $request->contract_type_id === 'all') {
            return;
        }

        if (is_array($request->contract_type_id)) {
            $query->whereIn('contract_type_id', $request->contract_type_id);
        } else {
            $query->where('contract_type_id', $request->contract_type_id);
        }
    }

    /**
     * Apply department filter resolving via initiator or creator fallback.
     */
    private function applyDepartmentFilter(Builder $query, Request $request): void
    {
        if (! $request->filled('department_id')) {
            return;
        }

        $departmentId = $request->department_id;
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
}
