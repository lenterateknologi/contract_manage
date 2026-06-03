<?php

namespace App\Http\Controllers\Contract;

use App\Actions\Contract\FileAction;
use App\Actions\Contract\StoreContractAction;
use App\Actions\Contract\UpdateContractAction;
use App\Exports\ContractExport;
use App\Formatters\ContractFormatter;
use App\Http\Controllers\Controller;
use App\Imports\ContractImport;
use App\Models\AccessModule;
use App\Models\Approval;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\FormTemplate;
use App\Models\Region;
use App\Models\Role;
use App\Models\SubmissionType;
use App\Models\User;
use App\Models\Vendor;
use App\Services\ContractWorkflowService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use OpenApi\Attributes as OA;

class ContractController extends Controller
{
    private ContractWorkflowService $workflowService;

    private StoreContractAction $storeAction;

    private UpdateContractAction $updateAction;

    private FileAction $fileAction;

    public function __construct(
        ContractWorkflowService $workflowService,
        StoreContractAction $storeAction,
        UpdateContractAction $updateAction,
        FileAction $fileAction,
    ) {
        $this->workflowService = $workflowService;
        $this->storeAction = $storeAction;
        $this->updateAction = $updateAction;
        $this->fileAction = $fileAction;
    }

    #[OA\Get(
        path: '/api/contracts',
        summary: 'Get list of contracts',
        tags: ['Contracts'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'view', in: 'query', description: 'Filter by view (dashboard, contracts, mine, pending, etc.)', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'search', in: 'query', description: 'Search query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', description: 'Items per page', schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of contracts'),
        ],
    )]
    public function index(Request $request): JsonResponse
    {
        $view = $request->query('view', 'contracts');
        $contracts = $this->getFilteredContractsQuery($request, $view)
            ->paginate($request->integer('per_page', 10))
            ->through(fn ($c) => ContractFormatter::formatContract($c));

        return response()->json($contracts);
    }

    /**
     * Generalized method for Inertia contract views
     */
    public function contractsView(Request $request, string $view = 'contracts'): Response
    {
        $user = Auth::user();
        $roleName = $user->role;
        $hasFullAccess = in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);
        $isManager = $roleName === 'Manager';
        $userCompany = $user->company;

        // Dynamic lists based on roles
        $departmentsLoader = fn () => Department::query()
            ->when($isManager, fn ($q) => $q->where('company_id', $user->company_id))
            ->when(! $hasFullAccess && ! $isManager, fn ($q) => $q->where('id', $user->department_id))
            ->orderBy('name')
            ->get();

        $regionsLoader = fn () => Region::query()
            ->when(! $hasFullAccess && $userCompany, fn ($q) => $q->where('id', $userCompany->region_id))
            ->orderBy('name')
            ->get();

        $companyGroupsLoader = fn () => CompanyGroup::query()
            ->when(! $hasFullAccess && $userCompany, fn ($q) => $q->where('id', $userCompany->company_group_id))
            ->orderBy('name')
            ->get();

        $companiesLoader = fn () => Company::query()
            ->when($isManager && $userCompany, fn ($q) => $q->where('company_group_id', $userCompany->company_group_id))
            ->when(! $hasFullAccess && ! $isManager && $userCompany, fn ($q) => $q->where('id', $user->company_id))
            ->orderBy('name')
            ->get();

        $contracts = $this->getFilteredContractsQuery($request, $view)
            ->paginate($request->integer('per_page', 10))
            ->withQueryString()
            ->through(fn ($c) => ContractFormatter::formatContract($c));

        $data = [
            'currentView' => $view,
            'contracts' => $contracts,
            'types' => ContractType::all(),
            'submissionTypes' => SubmissionType::where('is_active', true)->get(),
            'users' => Inertia::defer(fn () => User::with('department')
                ->when($isManager, function ($q) use ($user) {
                    return $q->where('department_id', $user->department_id);
                })
                ->orderBy('name')->get()->map(fn ($u) => ContractFormatter::formatUser($u))->toArray()),
            'vendors' => Inertia::defer(fn () => Vendor::with('documents')->where('is_active', true)->orderBy('name')->get()->map(fn ($v) => [
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
            ])->toArray()),
            'formTemplates' => Inertia::defer(fn () => FormTemplate::where('is_active', true)->with('contractType')->withCount('fields')->get()->map(function ($item) {
                $ft = $item;

                /* @var FormTemplate $ft */
                return [
                    'id' => $ft->id,
                    'name' => $ft->name,
                    'description' => $ft->description,
                    'document_type' => $ft->document_type,
                    'contract_type_id' => $ft->contract_type_id,
                    'contract_type_name' => $ft->contractType?->name,
                    'fields_count' => $ft->fields_count,
                ];
            })->toArray()),
            'departments' => Inertia::defer($departmentsLoader),
            'roles' => Inertia::defer(fn () => Role::orderBy('name')->get()),
            'regions' => Inertia::defer($regionsLoader),
            'companyGroups' => Inertia::defer($companyGroupsLoader),
            'companies' => Inertia::defer($companiesLoader),
            'contractStatuses' => Inertia::defer(fn () => ContractStatus::all()),
            'filters' => array_merge($request->only([
                'search', 'status', 'contract_type_id', 'role_id', 'department_id',
                'created_from', 'created_to', 'region_ids', 'vendor_ids', 'statuses',
                'contract_type_ids', 'pic_ids', 'department_ids', 'submission_type_id',
                'period', 'company_group_ids', 'company_ids',
            ]), [
                'per_page' => $request->integer('per_page', 10),
            ]),
        ];

        $viewTitle = 'Manajemen Kontrak';
        $viewDesc = 'Daftar seluruh kontrak dalam sistem.';
        $viewIcon = 'FileText';

        switch ($view) {
            case 'dashboard':
                $viewTitle = 'Dashboard';
                $viewDesc = 'Statistik dan ringkasan aktivitas kontrak.';
                $viewIcon = 'LayoutGrid';

                break;
            case 'mine':
                $viewTitle = 'Kontrak Saya';
                $viewDesc = 'Daftar kontrak yang Anda buat.';
                $viewIcon = 'FileEdit';

                break;
            case 'pending':
                $viewTitle = 'Pending Approval';
                $viewDesc = 'Kontrak yang menunggu persetujuan Anda.';
                $viewIcon = 'Clock';

                break;
            case 'expiry':
                $viewTitle = 'Masa Berlaku';
                $viewDesc = 'Kontrak yang akan atau telah berakhir.';
                $viewIcon = 'History';

                break;
            case 'f1':
                $viewTitle = 'Formulir F1';
                $viewDesc = 'Daftar kontrak dengan dokumen F1.';
                $viewIcon = 'FilePlus';

                break;
            case 'f2':
                $viewTitle = 'Formulir F2';
                $viewDesc = 'Daftar kontrak dengan dokumen F2.';
                $viewIcon = 'FilePlus';

                break;
        }

        if ($view === 'dashboard') {
            $data['metrics'] = Inertia::defer(fn () => $this->getDashboardMetrics($request));
        }

        $data['breadcrumbs'] = [
            ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
            ['title' => $viewTitle, 'href' => '#', 'description' => $viewDesc, 'icon' => $viewIcon],
        ];

        return Inertia::render('contracts/index', $data);
    }

    public function showView(Request $request, string $id): Response
    {
        $contract = Contract::query()->select([
            'id', 'contract_no', 'title', 'description', 'contract_date', 'end_date',
            'contract_type_id', 'transaction_type', 'status', 'current_version',
            'workflow_id', 'workflow_step_id', 'created_by', 'submitted_at',
            'created_at', 'initiated_by_id', 'vendor_id', 'parent_id',
            'submission_type_id', 'crown_no', 'assigned_pic_id', 'assigned_by_id',
            'contract_type_parent_id', 'metadata',
        ])->with([
            'creator:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'contractType:id,name',
            'approvals.approver:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'approvals.workflowStep:id,step,description,step_category,workflow_id',
            'approvals.workflowStep.workflow:id,name',
            'workflow.steps:id,workflow_id,step,description,approver_type,step_category,meta,filter_department,filter_company_group,filter_region,filter_company',
            'workflowStep:id,step,description,step_category,meta',
            'workflowStep.actions',
            'versions.uploader:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'histories.actor:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'messages.user:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'attachments.uploader:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'formSubmissions:id,contract_id,document_type,form_template_id,current_version,submitted_by,updated_at',
            'vendor.documents:id,vendor_id,document_name,document_type',
            'meta:contract_id,kop_topik,kop_sub_topik,p1_entity,p1_signer,p1_signer_position,p1_address,p2_entity,p2_signer,p2_signer_position,p2_address,f2_scope,f2_price,f2_payment,f2_tenure,f2_location',
        ])->findOrFail($id);

        Gate::authorize('view', $contract);

        $contracts = $this->getFilteredContractsQuery($request, 'contracts')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString()
            ->through(fn ($c) => ContractFormatter::formatContract($c));

        $data = [
            'currentView' => 'contracts',
            'contracts' => $contracts,
            'initialSelected' => ContractFormatter::formatContract($contract),
            'types' => ContractType::all(),
            'submissionTypes' => SubmissionType::where('is_active', true)->get(),
            'users' => Inertia::defer(fn () => User::with('department')
                ->when(Auth::user()->role === 'Manager', function ($q) {
                    return $q->where('department_id', Auth::user()->department_id);
                })
                ->orderBy('name')->get()->map(fn ($u) => ContractFormatter::formatUser($u))->toArray()),
            'vendors' => Inertia::defer(fn () => Vendor::where('is_active', true)->orderBy('name')->get()->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'pic_name' => $v->pic_name,
                'pic_position' => $v->pic_position,
                'address' => $v->address,
            ])->toArray()),
            'formTemplates' => Inertia::defer(fn () => FormTemplate::where('is_active', true)->with('contractType')->withCount('fields')->get()->map(function ($item) {
                $ft = $item;

                /* @var FormTemplate $ft */
                return [
                    'id' => $ft->id,
                    'name' => $ft->name,
                    'description' => $ft->description,
                    'document_type' => $ft->document_type,
                    'contract_type_id' => $ft->contract_type_id,
                    'contract_type_name' => $ft->contractType?->name,
                    'fields_count' => $ft->fields_count,
                ];
            })->toArray()),
            'filters' => array_merge($request->only(['search', 'status', 'contract_type_id']), [
                'per_page' => $request->integer('per_page', 10),
            ]),
            'breadcrumbs' => [
                ['title' => 'Manajemen Kontrak', 'href' => route('contracts'), 'icon' => 'FileText'],
                ['title' => 'Detail Kontrak', 'href' => '#', 'description' => 'Melihat detail kontrak.', 'icon' => 'Eye'],
            ],
        ];

        return Inertia::render('contracts/show', $data);
    }

    private function getFilteredContractsQuery(Request $request, string $view = 'contracts')
    {
        $query = Contract::query()->select([
            'id', 'contract_no', 'title', 'contract_date', 'end_date',
            'contract_type_id', 'transaction_type', 'status', 'current_version',
            'workflow_id', 'workflow_step_id', 'created_by', 'submitted_at',
            'created_at', 'initiated_by_id', 'vendor_id', 'parent_id',
            'submission_type_id', 'crown_no', 'assigned_pic_id', 'assigned_by_id',
            'contract_type_parent_id',
        ])->with([
            'creator:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'creator.department:id,name',
            'contractType:id,name',
            'contractTypeParent:id,name',
            'submissionType:id,name',
            'statusDetail:code,label',
            'approvals.approver:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'approvals.approver.department:id,name',
            'approvals.workflowStep:id,step,description,step_category,workflow_id',
            'approvals.workflowStep.workflow:id,name',
            'workflow.steps:id,workflow_id,step,description,approver_type,step_category,meta,filter_department,filter_company_group,filter_region,filter_company',
            'workflowStep:id,step,description,step_category,meta',
            'versions.uploader:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'histories.actor:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'messages.user:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'attachments.uploader:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'formSubmissions:id,contract_id,document_type,form_template_id,current_version,submitted_by,updated_at',
            'vendor:id,name,pic_name,pic_position,address',
            'vendor.documents:id,vendor_id,document_name,document_type',
            'initiator:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'initiator.department:id,name',
            'parent:id,contract_no,title',
            'assignedPic:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'assignedPic.department:id,name',
            'assignedBy:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'assignedBy.department:id,name',
            'meta:contract_id,kop_topik,kop_sub_topik,p1_entity,p1_signer,p1_signer_position,p1_address,p2_entity,p2_signer,p2_signer_position,p2_address,f2_scope,f2_price,f2_payment,f2_tenure,f2_location',
        ])->latest();

        // Apply View Filter
        switch ($view) {
            case 'mine':
                $query->where('t_contracts.created_by', Auth::id());

                break;
            case 'pending':
                $query->whereHas('approvals', function ($q) {
                    $q->where('user_id', Auth::id())
                        ->where('status', 'pending')
                        ->whereColumn('workflow_step_id', 't_contracts.workflow_step_id');
                });

                break;
            case 'expiry':
                $query->whereNotNull('end_date');

                break;
            case 'f1':
                $query->whereHas('versions', fn ($q) => $q->where('document_type', 'f1'));

                break;
            case 'f2':
                $query->whereHas('versions', fn ($q) => $q->where('document_type', 'f2'));

                break;
            case 'contracts':
            default:
                $query->where('status', '!=', 'draft');

                break;
            case 'all':
                // No status filter
                break;
        }

        // Apply Search Filter
        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw('LOWER(title)'), 'like', "%{$search}%")
                    ->orWhere(DB::raw('LOWER(contract_no)'), 'like', "%{$search}%")
                    ->orWhere(DB::raw('LOWER(crown_no)'), 'like', "%{$search}%")
                    ->orWhereHas('creator', fn ($uq) => $uq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%"));
            });
        }

        // Apply Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            if (is_array($request->status)) {
                $query->whereIn('status', $request->status);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Apply Type Filter
        if ($request->filled('contract_type_id') && $request->contract_type_id !== 'all') {
            if (is_array($request->contract_type_id)) {
                $query->whereIn('contract_type_id', $request->contract_type_id);
            } else {
                $query->where('contract_type_id', $request->contract_type_id);
            }
        }

        // Apply Department Filter
        if ($request->filled('department_id')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('initiator', function ($sq) use ($request) {
                    if (is_array($request->department_id)) {
                        $sq->whereIn('department_id', $request->department_id);
                    } else {
                        $sq->where('department_id', $request->department_id);
                    }
                })
                    ->orWhere(function ($sq) use ($request) {
                        $sq->whereNull('initiated_by_id')
                            ->whereHas('creator', function ($ssq) use ($request) {
                                if (is_array($request->department_id)) {
                                    $ssq->whereIn('department_id', $request->department_id);
                                } else {
                                    $ssq->where('department_id', $request->department_id);
                                }
                            });
                    });
            });
        }

        // Apply Date Range Filter
        if ($request->filled('created_from')) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }
        if ($request->filled('created_to')) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }

        // Apply Submission Type Filter
        if ($request->filled('submission_type_id') && $request->submission_type_id !== 'all') {
            if (is_array($request->submission_type_id)) {
                $query->whereIn('submission_type_id', $request->submission_type_id);
            } else {
                $query->where('submission_type_id', $request->submission_type_id);
            }
        }

        return $query;
    }

    private function getDashboardMetrics(Request $request)
    {
        $user = Auth::user();
        $roleName = $user->role;
        $hasFullAccess = in_array($roleName, ['Admin', 'Super Admin', 'Director', 'CEO', 'VP']);
        $isAdmin = $hasFullAccess;
        $isManager = $roleName === 'Manager';
        $hasDepartmentAccess = ! $hasFullAccess && ! $isManager;

        // Normalize array filters
        $normalizeArray = function ($val) {
            if (empty($val)) {
                return [];
            }
            if (is_array($val)) {
                return $val;
            }

            return array_filter(explode(',', $val));
        };

        $regionIds = $normalizeArray($request->input('region_ids', []));
        $companyGroupIds = $normalizeArray($request->input('company_group_ids', []));
        $companyIds = $normalizeArray($request->input('company_ids', []));
        $vendorIds = $normalizeArray($request->input('vendor_ids', []));
        $statuses = $normalizeArray($request->input('statuses', []));
        $contractTypeIds = $normalizeArray($request->input('contract_type_ids', []));
        $picIds = $normalizeArray($request->input('pic_ids', []));
        $departmentIds = $normalizeArray($request->input('department_ids', []));
        $createdFrom = $request->input('created_from');
        $createdTo = $request->input('created_to');
        $period = $request->input('period', 'all');

        // Apply Period filter
        if ($period !== 'all' && empty($createdFrom) && empty($createdTo)) {
            switch ($period) {
                case 'last_30_days':
                    $createdFrom = now()->subDays(30)->toDateString();

                    break;
                case 'last_6_months':
                    $createdFrom = now()->subMonths(6)->toDateString();

                    break;
                case 'last_year':
                    $createdFrom = now()->subYear()->toDateString();

                    break;
                case 'current_year':
                    $createdFrom = now()->startOfYear()->toDateString();

                    break;
            }
            $createdTo = now()->toDateString();
        }

        $baseQuery = Contract::query();

        // Apply role restrictions
        if ($isManager && $user->company_id) {
            $baseQuery->where(function ($q) use ($user) {
                $q->whereHas('initiator', function ($sq) use ($user) {
                    $sq->where('company_id', $user->company_id);
                })
                    ->orWhere(function ($sq) use ($user) {
                        $sq->whereNull('initiated_by_id')
                            ->whereHas('creator', function ($ssq) use ($user) {
                                $ssq->where('company_id', $user->company_id);
                            });
                    });
            });
        } elseif ($hasDepartmentAccess && $user->department_id) {
            $baseQuery->where(function ($q) use ($user) {
                $q->whereHas('initiator', function ($sq) use ($user) {
                    $sq->where('department_id', $user->department_id);
                })
                    ->orWhere(function ($sq) use ($user) {
                        $sq->whereNull('initiated_by_id')
                            ->whereHas('creator', function ($ssq) use ($user) {
                                $ssq->where('department_id', $user->department_id);
                            });
                    });
            });
        }

        // Apply Global Filters
        if (! empty($createdFrom)) {
            $baseQuery->whereDate('created_at', '>=', $createdFrom);
        }
        if (! empty($createdTo)) {
            $baseQuery->whereDate('created_at', '<=', $createdTo);
        }

        if (! empty($statuses)) {
            $baseQuery->whereIn('status', $statuses);
        } else {
            // Exclude drafts by default from dashboard
            $baseQuery->where('status', '!=', 'draft');
        }

        if (! empty($contractTypeIds)) {
            $baseQuery->whereIn('contract_type_id', $contractTypeIds);
        }

        if (! empty($vendorIds)) {
            $baseQuery->whereIn('vendor_id', $vendorIds);
        }

        if (! empty($picIds)) {
            $baseQuery->whereIn('assigned_pic_id', $picIds);
        }

        // Apply search filter parameters based on role scope
        if ($hasFullAccess) {
            if (! empty($departmentIds)) {
                $baseQuery->where(function ($q) use ($departmentIds) {
                    $q->whereHas('initiator', function ($sq) use ($departmentIds) {
                        $sq->whereIn('department_id', $departmentIds);
                    })
                        ->orWhere(function ($sq) use ($departmentIds) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator', function ($ssq) use ($departmentIds) {
                                    $ssq->whereIn('department_id', $departmentIds);
                                });
                        });
                });
            }

            if (! empty($regionIds)) {
                $baseQuery->where(function ($q) use ($regionIds) {
                    $q->whereHas('initiator.company', function ($sq) use ($regionIds) {
                        $sq->whereIn('region_id', $regionIds);
                    })
                        ->orWhere(function ($sq) use ($regionIds) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator.company', function ($ssq) use ($regionIds) {
                                    $ssq->whereIn('region_id', $regionIds);
                                });
                        });
                });
            }

            if (! empty($companyGroupIds)) {
                $baseQuery->where(function ($q) use ($companyGroupIds) {
                    $q->whereHas('initiator.company', function ($sq) use ($companyGroupIds) {
                        $sq->whereIn('company_group_id', $companyGroupIds);
                    })
                        ->orWhere(function ($sq) use ($companyGroupIds) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator.company', function ($ssq) use ($companyGroupIds) {
                                    $ssq->whereIn('company_group_id', $companyGroupIds);
                                });
                        });
                });
            }

            if (! empty($companyIds)) {
                $baseQuery->where(function ($q) use ($companyIds) {
                    $q->whereHas('initiator', function ($sq) use ($companyIds) {
                        $sq->whereIn('company_id', $companyIds);
                    })
                        ->orWhere(function ($sq) use ($companyIds) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator', function ($ssq) use ($companyIds) {
                                    $ssq->whereIn('company_id', $companyIds);
                                });
                        });
                });
            }
        } elseif ($isManager) {
            if (! empty($departmentIds)) {
                $baseQuery->where(function ($q) use ($departmentIds) {
                    $q->whereHas('initiator', function ($sq) use ($departmentIds) {
                        $sq->whereIn('department_id', $departmentIds);
                    })
                        ->orWhere(function ($sq) use ($departmentIds) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator', function ($ssq) use ($departmentIds) {
                                    $ssq->whereIn('department_id', $departmentIds);
                                });
                        });
                });
            }
        }

        // 1. KPI Cards values
        $totalContracts = (clone $baseQuery)->count();
        $inProcessContracts = (clone $baseQuery)->whereIn('status', ['in_review', 'revision', 'pending', 'locked'])->count();
        $activeContracts = (clone $baseQuery)->where('status', 'approved')->where(fn ($q) => $q->whereNull('end_date')->orWhereDate('end_date', '>=', now()->toDateString()))->count();
        $expiringSoonContracts = (clone $baseQuery)->where('status', 'approved')->whereNotNull('end_date')->whereDate('end_date', '>=', now()->toDateString())->whereDate('end_date', '<=', now()->addDays(30)->toDateString())->count();

        // Legacy compatibility / Other tabs variables
        $expiredContracts = (clone $baseQuery)->where('status', 'approved')->whereNotNull('end_date')->whereDate('end_date', '<', now()->toDateString())->count();
        $pendingContracts = $inProcessContracts;
        $renewedContractsCount = (clone $baseQuery)->whereNotNull('parent_id')->count();
        $renewalRate = ($expiredContracts + $renewedContractsCount) > 0
            ? round(($renewedContractsCount / ($expiredContracts + $renewedContractsCount)) * 100, 1)
            : 0;
        $totalValue = 0;
        $prices = (clone $baseQuery)
            ->join('t_contract_meta', 't_contracts.id', '=', 't_contract_meta.contract_id')
            ->pluck('t_contract_meta.f2_price');
        foreach ($prices as $price) {
            $totalValue += $this->parsePrice($price);
        }

        $approvedContracts = (clone $baseQuery)->where('status', 'approved')->orderByDesc('updated_at')->limit(50)->get();
        $avgDays = 0;
        if ($approvedContracts->count() > 0) {
            $contractIds = $approvedContracts->pluck('id');
            $firstApprovals = Approval::whereIn('contract_id', $contractIds)
                ->select('contract_id', DB::raw('MIN(created_at) as first_sent_at'))
                ->groupBy('contract_id')->pluck('first_sent_at', 'contract_id')->all();
            $totalDays = $approvedContracts->sum(function ($c) use ($firstApprovals) {
                $firstSentAt = $firstApprovals[$c->id] ?? null;

                return $firstSentAt ? Carbon::parse($firstSentAt)->diffInHours($c->updated_at) / 24 : 0;
            });
            $avgDays = round($totalDays / $approvedContracts->count(), 1);
        }

        // Submission type distribution for donut
        $submissionTypeCounts = (clone $baseQuery)
            ->whereNotNull('submission_type_id')
            ->select('submission_type_id', DB::raw('count(*) as count'))
            ->groupBy('submission_type_id')
            ->pluck('count', 'submission_type_id');

        $submissionTypeDistribution = SubmissionType::all()
            ->map(fn ($type) => [
                'label' => $type->name,
                'count' => (int) $submissionTypeCounts->get($type->id, 0),
            ])
            ->values();

        // Contract type distribution for bar chart
        $contractTypeCounts = (clone $baseQuery)
            ->whereNotNull('contract_type_id')
            ->select('contract_type_id', DB::raw('count(*) as count'))
            ->groupBy('contract_type_id')
            ->pluck('count', 'contract_type_id');

        $contractTypeDistribution = ContractType::whereNotNull('parent_id')
            ->whereColumn('parent_id', '!=', 'id')
            ->get()
            ->map(fn ($type) => [
                'label' => $type->name,
                'count' => (int) $contractTypeCounts->get($type->id, 0),
            ])
            ->sortByDesc('count')
            ->values();

        // 2. Overview Tab Datasets
        // KPI Data to pass
        $summary = [
            'total' => $totalContracts,
            'in_process' => $inProcessContracts,
            'active' => $activeContracts,
            'expiring_soon' => $expiringSoonContracts,
        ];

        // Status distribution for donut (keep for legacy compatibility)
        $statusDistribution = (clone $baseQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($item) => [
                'status' => $item->status,
                'count' => (int) $item->getAttribute('count'),
            ])
            ->values();

        // Expiry timeline counts (keep for internal use or other tabs if needed, but primary focus is summary)
        $expiryTimeline = [
            'under30' => (clone $baseQuery)->where('status', 'approved')->whereNotNull('end_date')->whereDate('end_date', '>=', now()->toDateString())->whereDate('end_date', '<', now()->addDays(30)->toDateString())->count(),
            'under60' => (clone $baseQuery)->where('status', 'approved')->whereNotNull('end_date')->whereDate('end_date', '>=', now()->addDays(30)->toDateString())->whereDate('end_date', '<', now()->addDays(60)->toDateString())->count(),
            'under90' => (clone $baseQuery)->where('status', 'approved')->whereNotNull('end_date')->whereDate('end_date', '>=', now()->addDays(60)->toDateString())->whereDate('end_date', '<', now()->addDays(90)->toDateString())->count(),
            'above90' => (clone $baseQuery)->where('status', 'approved')->where(fn ($q) => $q->whereNull('end_date')->orWhereDate('end_date', '>=', now()->addDays(90)->toDateString()))->count(),
        ];

        // Approval Status
        $approvalStatusCounts = [
            'approved' => (clone $baseQuery)->where('status', 'approved')->count(),
            'pending' => $inProcessContracts,
            'revision' => (clone $baseQuery)->where('status', 'revision')->count(),
            'rejected' => (clone $baseQuery)->where('status', 'rejected')->count(),
        ];

        // Recent Contracts (5 latest)
        $recentContracts = (clone $baseQuery)
            ->with(['creator', 'contractType'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'contract_no' => $item->contract_no,
                'title' => $item->title,
                'status' => $item->status,
                'creator' => $item->creator?->name,
                'type' => $item->contractType?->name,
                'price' => $item->f2_price,
                'created_at' => $item->created_at,
            ])
            ->values();

        // Upcoming Renewals (5 latest)
        $upcomingRenewals = (clone $baseQuery)
            ->where('status', 'approved')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->orderBy('end_date', 'asc')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'contract_no' => $item->contract_no,
                'title' => $item->title,
                'end_date' => $item->end_date,
                'vendor_name' => $item->vendor?->name,
                'creator' => $item->creator?->name,
            ])
            ->values();

        // Pending Approvals List (5 latest)
        $pendingApprovalsList = Approval::where('user_id', Auth::id())
            ->where('status', 'pending')
            ->with(['contract.creator', 'contract.contractType'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn ($app) => [
                'id' => $app->id,
                'contract_id' => $app->contract_id,
                'contract_no' => $app->contract->contract_no,
                'title' => $app->contract->title,
                'creator' => $app->contract->creator?->name,
                'type' => $app->contract->contractType?->name,
                'requested_at' => $app->created_at,
            ])
            ->values();

        // Status distribution for donut
        $statusDistribution = (clone $baseQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($item) => [
                'status' => $item->status,
                'count' => (int) $item->getAttribute('count'),
            ])
            ->values();

        // 3. Trend Tab Datasets
        // Monthly Growth
        $monthlyTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $contractsInMonth = (clone $baseQuery)->whereBetween('created_at', [$monthStart, $monthEnd])->get();
            $monthlyTrend->push([
                'month' => $monthStart->translatedFormat('M'),
                'count' => $contractsInMonth->count(),
                'value' => $contractsInMonth->sum(fn ($c) => $this->parsePrice($c->f2_price)),
            ]);
        }

        // Renewal vs Expired Trend
        $renewalVsExpiredTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $expiredCount = (clone $baseQuery)->where('status', 'approved')->whereBetween('end_date', [$monthStart, $monthEnd])->count();
            $renewedCount = (clone $baseQuery)->whereNotNull('parent_id')->whereBetween('created_at', [$monthStart, $monthEnd])->count();
            $renewalVsExpiredTrend->push([
                'month' => $monthStart->translatedFormat('M'),
                'expired' => $expiredCount,
                'renewed' => $renewedCount,
            ]);
        }

        // Monthly Approval Trend
        $monthlyApprovalTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $contracts = (clone $baseQuery)->whereBetween('created_at', [$monthStart, $monthEnd])->get();
            $monthlyApprovalTrend->push([
                'month' => $monthStart->translatedFormat('M'),
                'approved' => $contracts->where('status', 'approved')->count(),
                'pending' => $contracts->whereIn('status', ['in_review', 'locked'])->count(),
                'revision' => $contracts->where('status', 'revision')->count(),
                'rejected' => $contracts->where('status', 'rejected')->count(),
            ]);
        }

        // Top Vendor Activity
        $topVendors = (clone $baseQuery)
            ->whereNotNull('vendor_id')
            ->with('vendor')
            ->get()
            ->groupBy('vendor_id')
            ->map(function ($group) {
                $vendor = $group->first()->vendor;

                return [
                    'name' => $vendor->name ?? 'Unknown Vendor',
                    'count' => $group->count(),
                    'value' => $group->sum(fn ($c) => $this->parsePrice($c->f2_price)),
                ];
            })
            ->sortByDesc('value')
            ->take(5)
            ->values();

        // Category Trend
        $allCategories = ContractType::all();
        $categoryTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $row = ['month' => $monthStart->translatedFormat('M')];
            foreach ($allCategories as $cat) {
                $count = (clone $baseQuery)->where('contract_type_id', $cat->id)->whereBetween('created_at', [$monthStart, $monthEnd])->count();
                $row[$cat->name] = $count;
            }
            $categoryTrend->push($row);
        }

        // 4. Analisis Tab Datasets
        // Expiry Risk Heatmap
        $expiryRiskHeatmap = (clone $baseQuery)
            ->where('status', 'approved')
            ->with(['initiator.department', 'creator.department'])
            ->get()
            ->groupBy(function ($c) {
                return $c->initiator->department->name ?? $c->creator->department->name ?? 'Tanpa Divisi';
            })
            ->map(function ($group, $deptName) {
                $highRisk = 0;
                $medRisk = 0;
                $lowRisk = 0;
                foreach ($group as $c) {
                    if (empty($c->end_date)) {
                        $lowRisk++;

                        continue;
                    }
                    $days = Carbon::parse($c->end_date)->diffInDays(now(), false);
                    if ($days > 0 || abs($days) < 30) {
                        $highRisk++;
                    } elseif (abs($days) <= 90) {
                        $medRisk++;
                    } else {
                        $lowRisk++;
                    }
                }

                return [
                    'department' => $deptName,
                    'high' => $highRisk,
                    'medium' => $medRisk,
                    'low' => $lowRisk,
                ];
            })
            ->values();

        // Renewal Failure Count per Category
        $allContracts = Contract::select('id', 'parent_id')->get();
        $renewedIds = $allContracts->whereNotNull('parent_id')->pluck('parent_id')->all();
        $renewalFailureByCategory = (clone $baseQuery)
            ->where('status', 'approved')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', now()->toDateString())
            ->with('contractType')
            ->get()
            ->groupBy(fn ($c) => $c->contractType->name ?? 'Lainnya')
            ->map(function ($group, $catName) use ($renewedIds) {
                $renewed = 0;
                $failed = 0;
                foreach ($group as $c) {
                    if (in_array($c->id, $renewedIds)) {
                        $renewed++;
                    } else {
                        $failed++;
                    }
                }

                return ['category' => $catName, 'renewed' => $renewed, 'failed' => $failed];
            })
            ->values();

        // Vendor Performance
        $vendorPerformance = (clone $baseQuery)
            ->whereNotNull('vendor_id')
            ->with('vendor')
            ->get()
            ->groupBy('vendor_id')
            ->map(function ($group) use ($renewedIds) {
                $vendor = $group->first()->vendor;
                $total = $group->count();
                $renewed = $group->filter(fn ($c) => in_array($c->id, $renewedIds) || $c->parent_id !== null)->count();

                $approvedGroup = $group->where('status', 'approved');
                $avgDays = 0;
                if ($approvedGroup->count() > 0) {
                    $contractIds = $approvedGroup->pluck('id');
                    $firstApprovals = Approval::whereIn('contract_id', $contractIds)
                        ->select('contract_id', DB::raw('MIN(created_at) as first_sent_at'))
                        ->groupBy('contract_id')
                        ->pluck('first_sent_at', 'contract_id')
                        ->all();
                    $totalDays = $approvedGroup->sum(function ($c) use ($firstApprovals) {
                        $firstSentAt = $firstApprovals[$c->id] ?? null;

                        return $firstSentAt ? Carbon::parse($firstSentAt)->diffInHours($c->updated_at) / 24 : 0;
                    });
                    $avgDays = round($totalDays / $approvedGroup->count(), 1);
                }

                return [
                    'name' => $vendor->name ?? 'Unknown',
                    'total' => $total,
                    'renewal_rate' => $total > 0 ? round(($renewed / $total) * 100, 1) : 0,
                    'avg_cycle_time' => $avgDays,
                ];
            })
            ->sortByDesc('total')
            ->take(5)
            ->values();

        // Value Distribution
        $valueDistribution = [
            ['range' => '< Rp 50M', 'count' => 0],
            ['range' => 'Rp 50M - 500M', 'count' => 0],
            ['range' => '> Rp 500M', 'count' => 0],
        ];
        $prices = (clone $baseQuery)
            ->join('t_contract_meta', 't_contracts.id', '=', 't_contract_meta.contract_id')
            ->pluck('t_contract_meta.f2_price')
            ->map(fn ($price) => $this->parsePrice($price));
        foreach ($prices as $price) {
            if ($price < 50000000) {
                $valueDistribution[0]['count']++;
            } elseif ($price <= 500000000) {
                $valueDistribution[1]['count']++;
            } else {
                $valueDistribution[2]['count']++;
            }
        }

        // Budget Allocation (Value by Category)
        $budgetAllocation = (clone $baseQuery)
            ->with('contractType')
            ->get()
            ->groupBy(fn ($c) => $c->contractType->name ?? 'Lainnya')
            ->map(fn ($group, $catName) => [
                'name' => $catName,
                'value' => $group->sum(fn ($c) => $this->parsePrice($c->f2_price)),
            ])
            ->values();

        // Approval Duration per Department
        $approvalDurationByDept = (clone $baseQuery)
            ->where('status', 'approved')
            ->with(['initiator.department', 'creator.department'])
            ->get()
            ->groupBy(function ($c) {
                return $c->initiator->department->name ?? $c->creator->department->name ?? 'Tanpa Divisi';
            })
            ->map(function ($group, $deptName) {
                $contractIds = $group->pluck('id');
                $firstApprovals = Approval::whereIn('contract_id', $contractIds)
                    ->select('contract_id', DB::raw('MIN(created_at) as first_sent_at'))
                    ->groupBy('contract_id')
                    ->pluck('first_sent_at', 'contract_id')
                    ->all();
                $totalDays = $group->sum(function ($c) use ($firstApprovals) {
                    $firstSentAt = $firstApprovals[$c->id] ?? null;

                    return $firstSentAt ? Carbon::parse($firstSentAt)->diffInHours($c->updated_at) / 24 : 0;
                });

                return [
                    'department' => $deptName,
                    'avg_days' => $group->count() > 0 ? round($totalDays / $group->count(), 1) : 0,
                ];
            })
            ->values();

        // 5. Workload Tab Datasets
        // User Workloads
        $startOfMonth = ! empty($createdFrom) ? Carbon::parse($createdFrom)->startOfDay() : Carbon::now()->startOfMonth();
        $endOfMonth = ! empty($createdTo) ? Carbon::parse($createdTo)->endOfDay() : Carbon::now()->endOfMonth();

        $userQuery = User::with('department');

        // Apply role restrictions on the users shown
        if ($isManager && $user->company_id) {
            $userQuery->where('company_id', $user->company_id);
        } elseif ($hasDepartmentAccess && $user->department_id) {
            $userQuery->where('department_id', $user->department_id);
        }

        // Apply explicit filters from request if present (only if the user has access to filter them)
        if ($hasFullAccess) {
            if (! empty($regionIds)) {
                $userQuery->whereHas('company', function ($q) use ($regionIds) {
                    $q->whereIn('region_id', $regionIds);
                });
            }
            if (! empty($companyGroupIds)) {
                $userQuery->whereHas('company', function ($q) use ($companyGroupIds) {
                    $q->whereIn('company_group_id', $companyGroupIds);
                });
            }
            if (! empty($companyIds)) {
                $userQuery->whereIn('company_id', $companyIds);
            }
            if (! empty($departmentIds)) {
                $userQuery->whereIn('department_id', $departmentIds);
            }
        } elseif ($isManager) {
            if (! empty($departmentIds)) {
                $userQuery->whereIn('department_id', $departmentIds);
            }
        }

        $userWorkloads = $userQuery->get()
            ->map(function ($u) use ($startOfMonth, $endOfMonth) {
                // Semua kontrak aktif saat ini (tidak harus bulan ini)
                $activeCount = Contract::where('assigned_pic_id', $u->id)->whereIn('status', ['in_review', 'revision'])->count();
                $pendingCount = Approval::where('user_id', $u->id)->where('status', 'pending')->count();
                $initiatedCount = Contract::where(function ($query) use ($u) {
                    $query->where('initiated_by_id', $u->id)->orWhere(function ($q) use ($u) {
                        $q->whereNull('initiated_by_id')->where('created_by', $u->id);
                    });
                })->count();

                // Statistik Bulan Ini
                $pendingThisMonth = Approval::where('user_id', $u->id)
                    ->where('status', 'pending')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->count();

                $activeThisMonth = Contract::where('assigned_pic_id', $u->id)
                    ->whereIn('status', ['in_review', 'revision'])
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->count();

                $completedThisMonth = Approval::where('user_id', $u->id)
                    ->where('status', 'approved')
                    ->whereBetween('updated_at', [$startOfMonth, $endOfMonth])
                    ->count() + Contract::where('assigned_pic_id', $u->id)
                    ->whereIn('status', ['approved', 'active', 'archived'])
                    ->whereBetween('updated_at', [$startOfMonth, $endOfMonth])
                    ->count();

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'initials' => $u->initials,
                    'role' => $u->role,
                    'position' => $u->position,
                    'bg_color' => $u->bg_color,
                    'text_color' => $u->text_color,
                    'department_name' => $u->department?->name,
                    'department_id' => $u->department_id,
                    'active_contracts_count' => $activeCount,
                    'pending_tasks_count' => $pendingCount,
                    'initiated_contracts_count' => $initiatedCount,
                    'load_status' => $activeCount >= 10 ? 'Sibuk' : 'Ready', // Changed limit to 10 just for badge logic, user asked to remove limit 5
                    'stats_this_month' => [
                        'pending' => $pendingThisMonth,
                        'active' => $activeThisMonth,
                        'completed' => $completedThisMonth,
                    ],
                ];
            })
            ->sortByDesc('active_contracts_count')
            ->values();

        // Department Workload Heatmap / Breakdown aligned with KPI cards
        $users = User::with('department')->get();
        $departmentWorkload = $users->groupBy(function ($u) {
            return $u->department->name ?? 'Tanpa Divisi';
        })
            ->map(function ($group, $deptName) {
                $userIds = $group->pluck('id');

                $activeReviews = Contract::whereIn('assigned_pic_id', $userIds)
                    ->whereIn('status', ['in_review', 'revision'])
                    ->count();

                $pendingApprovals = Approval::whereIn('user_id', $userIds)
                    ->where('status', 'pending')
                    ->count();

                return [
                    'department' => $deptName,
                    'active_reviews' => $activeReviews,
                    'pending_approvals' => $pendingApprovals,
                    'total' => $activeReviews + $pendingApprovals,
                ];
            })
            ->filter(fn ($item) => $item['total'] > 0)
            ->sortByDesc('total')
            ->values();

        // Renewal completion rate
        $totalExpired = (clone $baseQuery)->where('status', 'approved')->whereNotNull('end_date')->whereDate('end_date', '<', now()->toDateString())->count();
        $totalRenewed = (clone $baseQuery)->whereNotNull('parent_id')->count();
        $renewalCompletionRate = $totalExpired > 0 ? round(($totalRenewed / $totalExpired) * 100, 1) : 100;

        // Recent Activity Feed
        $recentActivity = DB::table('t_contract_h')
            ->leftJoin('m_users', 't_contract_h.actor_id', '=', 'm_users.id')
            ->leftJoin('t_contracts', 't_contract_h.contract_id', '=', 't_contracts.id')
            ->when(! $isAdmin, fn ($q) => $q->where('t_contracts.created_by', $user->id))
            ->select(
                't_contract_h.id',
                't_contract_h.action',
                't_contract_h.description',
                't_contract_h.created_at',
                'm_users.name as actor_name',
                't_contracts.id as contract_id',
                't_contracts.title as contract_title',
                't_contracts.contract_no',
            )
            ->orderByDesc('t_contract_h.created_at')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'action' => $item->action,
                'description' => $item->description,
                'actor' => $item->actor_name ?? 'Sistem',
                'contract_id' => $item->contract_id,
                'contract_title' => $item->contract_title,
                'contract_no' => $item->contract_no,
                'created_at' => $item->created_at,
            ])
            ->values();

        // Category Traffic
        $categoryTraffic = ContractType::orderBy('name')
            ->get()
            ->map(function ($type) use ($baseQuery) {
                $incoming = (clone $baseQuery)->where('contract_type_id', $type->id)->whereIn('status', ['in_review', 'revision'])->count();
                $outgoing = (clone $baseQuery)->where('contract_type_id', $type->id)->whereIn('status', ['approved', 'locked', 'archived'])->count();

                return [
                    'category_name' => $type->name,
                    'incoming_count' => $incoming,
                    'outgoing_count' => $outgoing,
                ];
            })
            ->values()
            ->all();

        // Department Traffic
        $departmentTraffic = Department::orderBy('name')
            ->get()
            ->map(function ($dept) use ($baseQuery) {
                $incoming = (clone $baseQuery)->where(function ($q) use ($dept) {
                    $q->whereHas('initiator', fn ($sq) => $sq->where('department_id', $dept->id))
                        ->orWhere(function ($sq) use ($dept) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator', fn ($ssq) => $ssq->where('department_id', $dept->id));
                        });
                })
                    ->whereIn('status', ['in_review', 'revision'])
                    ->count();

                $outgoing = (clone $baseQuery)->where(function ($q) use ($dept) {
                    $q->whereHas('initiator', fn ($sq) => $sq->where('department_id', $dept->id))
                        ->orWhere(function ($sq) use ($dept) {
                            $sq->whereNull('initiated_by_id')
                                ->whereHas('creator', fn ($ssq) => $ssq->where('department_id', $dept->id));
                        });
                })
                    ->whereIn('status', ['approved', 'locked', 'archived'])
                    ->count();

                return [
                    'department_id' => $dept->id,
                    'department_name' => $dept->name,
                    'incoming_count' => $incoming,
                    'outgoing_count' => $outgoing,
                    'member_count' => User::where('department_id', $dept->id)->count(),
                ];
            })
            ->values()
            ->all();

        return [
            'metrics' => [
                'totalContracts' => $totalContracts,
                'activeContracts' => $activeContracts,
                'expiringContracts' => $expiringSoonContracts,
                'expiredContracts' => $expiredContracts,
                'pendingContracts' => $pendingContracts,
                'pendingApprovals' => $pendingContracts, // fallback compatibility
                'renewalRate' => $renewalRate,
                'totalValue' => $totalValue,
                'avgCycleTime' => $avgDays,
            ],
            'summary' => $summary,
            'activePeriod' => $period,
            'submissionTypeDistribution' => $submissionTypeDistribution,
            'contractTypeDistribution' => $contractTypeDistribution,
            // Tab 1: Ringkasan
            'statusDistribution' => $statusDistribution,
            'expiryTimeline' => $expiryTimeline,
            'approvalStatusCounts' => $approvalStatusCounts,
            'recentContracts' => $recentContracts,
            'upcomingRenewals' => $upcomingRenewals,
            'pendingApprovalsList' => $pendingApprovalsList,
            'recentActivity' => $recentActivity,

            // Tab 2: Trend
            'monthlyTrend' => $monthlyTrend,
            'renewalVsExpiredTrend' => $renewalVsExpiredTrend,
            'monthlyApprovalTrend' => $monthlyApprovalTrend,
            'topVendors' => $topVendors,
            'categoryTrend' => $categoryTrend,

            // Tab 3: Analisis
            'expiryRiskHeatmap' => $expiryRiskHeatmap,
            'renewalFailureByCategory' => $renewalFailureByCategory,
            'vendorPerformance' => $vendorPerformance,
            'valueDistribution' => $valueDistribution,
            'budgetAllocation' => $budgetAllocation,
            'approvalDurationByDept' => $approvalDurationByDept,

            // Tab 4: Workload
            'userWorkloads' => $userWorkloads,
            'departmentWorkload' => $departmentWorkload,
            'categoryTraffic' => $categoryTraffic,
            'renewalCompletionRate' => $renewalCompletionRate,
            'departmentTraffic' => $departmentTraffic,
        ];
    }

    private function parsePrice(?string $price): float
    {
        if (empty($price)) {
            return 0.0;
        }
        $clean = preg_replace('/[^\d.,]/', '', $price);
        $hasDot = str_contains($clean, '.');
        $hasComma = str_contains($clean, ',');

        if ($hasDot && $hasComma) {
            if (strpos($clean, '.') < strpos($clean, ',')) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasComma) {
            if (preg_match('/,\d{2}$/', $clean)) {
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasDot) {
            if (substr_count($clean, '.') > 1) {
                $clean = str_replace('.', '', $clean);
            } else {
                if (preg_match('/\.\d{3}$/', $clean)) {
                    $clean = str_replace('.', '', $clean);
                }
            }
        }

        return (float) $clean;
    }

    public function getTypes(): JsonResponse
    {
        return response()->json(ContractType::all());
    }

    public function getSubmissionTypes(): JsonResponse
    {
        return response()->json(SubmissionType::where('is_active', true)->get());
    }

    #[OA\Get(
        path: '/api/contracts/{id}',
        summary: 'Get contract details',
        tags: ['Contracts'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', description: 'Contract ID', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Contract details'),
            new OA\Response(response: 404, description: 'Contract not found'),
        ],
    )]
    public function show(string $id): JsonResponse
    {
        $contract = Contract::query()->select([
            'id', 'contract_no', 'title', 'description', 'contract_date', 'end_date',
            'contract_type_id', 'transaction_type', 'status', 'current_version',
            'workflow_id', 'workflow_step_id', 'created_by', 'submitted_at',
            'created_at', 'initiated_by_id', 'vendor_id', 'parent_id',
            'submission_type_id', 'crown_no', 'assigned_pic_id', 'assigned_by_id',
            'contract_type_parent_id', 'metadata',
        ])->with([
            'creator:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'initiator.department:id,name',
            'versions.uploader:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'approvals.approver:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'approvals.workflowStep:id,step,description,step_category,workflow_id',
            'approvals.workflowStep.workflow:id,name',
            'workflow.steps:id,workflow_id,step,description,approver_type,step_category,meta,filter_department,filter_company_group,filter_region,filter_company',
            'workflowStep:id,step,description,step_category,meta',
            'workflowStep.actions',
            'histories.actor:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'messages.user:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'attachments.uploader:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'contractType:id,name',
            'submissionType:id,name',
            'formSubmissions:id,contract_id,document_type,form_template_id,current_version,submitted_by,updated_at',
            'vendor.documents:id,vendor_id,document_name,document_type',
            'assignedPic:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'assignedBy:id,name,initials,role,role_id,department_id,email,bg_color,text_color',
            'meta:contract_id,kop_topik,kop_sub_topik,p1_entity,p1_signer,p1_signer_position,p1_address,p2_entity,p2_signer,p2_signer_position,p2_address,f2_scope,f2_price,f2_payment,f2_tenure,f2_location',
        ])->findOrFail($id);

        // Authorization: Only Admin or Creator can view drafts
        if ($contract->status === 'draft' && $contract->created_by !== Auth::id() && Auth::user()->role !== 'Admin') {
            abort(403, 'Halaman tidak tersedia');
        }

        return response()->json(ContractFormatter::formatContract($contract));
    }

    public function getWorkflows(Request $request): JsonResponse
    {
        $user = $request->user();
        $targetUserId = $request->query('user_id');

        if ($targetUserId && ($user->role === 'Admin' || ($user->department && str_contains(strtolower($user->department->name), 'legal')) || str_contains(strtolower($user->role), 'legal'))) {
            $targetUser = User::find($targetUserId);
            if ($targetUser) {
                $user = $targetUser;
            }
        }

        $contractType = $request->query('contract_type');
        $workflows = $this->workflowService->getAvailableWorkflows($user, $contractType);

        return response()->json($workflows);
    }

    public function getUsers(Request $request): JsonResponse
    {
        $all = $request->boolean('all', false);
        $user = $request->user();

        $users = User::with('department')
            ->when($user && ! $all && $user->role === 'Manager', function ($q) use ($user) {
                return $q->where('department_id', $user->department_id);
            })
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => ContractFormatter::formatUser($u));

        return response()->json($users);
    }

    public function getRoles(): JsonResponse
    {
        return response()->json(Role::orderBy('name')->get());
    }

    #[OA\Post(
        path: '/api/contracts',
        summary: 'Create a new contract',
        tags: ['Contracts'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'title', type: 'string'),
                    new OA\Property(property: 'contract_type_id', type: 'string'),
                    new OA\Property(property: 'submission_type_id', type: 'string'),
                    new OA\Property(property: 'vendor_id', type: 'string'),
                ],
            ),
        ),
        responses: [
            new OA\Response(response: 201, description: 'Contract created'),
            new OA\Response(response: 422, description: 'Validation error'),
        ],
    )]
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'crown_no' => 'nullable|string|max:255',
            'contract_type_id' => 'required|exists:m_contract_types,id',
            'contract_type_parent_id' => 'nullable|exists:m_contract_types,id',
            'submission_type_id' => 'nullable|exists:m_submission_types,id',
            'transaction_type' => 'nullable|string|in:Perjanjian Baru,Addendum,Amandement,Perubahan Perjanjian',
            'tax_required' => 'nullable|boolean',
            'initiated_by_id' => 'nullable|uuid|exists:m_users,id',
            'vendor_id' => 'nullable|uuid|exists:m_vendors,id',
            'kop_sub_topik' => 'nullable|string',
            'p1_entity' => 'nullable|string',
            'p1_signer' => 'nullable|string',
            'p1_signer_position' => 'nullable|string',
            'p1_address' => 'nullable|string',
            'p2_entity' => 'nullable|string',
            'p2_signer' => 'nullable|string',
            'p2_signer_position' => 'nullable|string',
            'p2_address' => 'nullable|string',
            'category' => 'nullable|string',
            'project_name' => 'nullable|string',
            'topic' => 'nullable|string',
            'workflow_id' => 'nullable|uuid|exists:m_workflows,id',
        ]);

        $contract = $this->storeAction->execute($validated);

        return response()->json(ContractFormatter::formatContract($contract), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        // Granular permission check
        $payload = $request->all();
        $isUpdatingReference = array_key_exists('parent_id', $payload);
        $isUpdatingInfo = collect($payload)->except(['parent_id'])->isNotEmpty();

        if ($isUpdatingInfo) {
            Gate::authorize('update', $contract);
        }

        if ($isUpdatingReference) {
            Gate::authorize('updateReference', $contract);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'contract_type_id' => 'nullable|uuid|exists:m_contract_types,id',
            'contract_type_parent_id' => 'nullable|uuid|exists:m_contract_types,id',
            'submission_type_id' => 'nullable|uuid|exists:m_submission_types,id',
            'contract_no' => 'nullable|string',
            'contract_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'crown_no' => 'nullable|string|max:255',
            'transaction_type' => 'nullable|string|in:Perjanjian Baru,Addendum,Amandement,Perubahan Perjanjian,General',
            'initiated_by_id' => 'nullable|uuid|exists:m_users,id',
            'vendor_id' => 'nullable|uuid|exists:m_vendors,id',
            'kop_sub_topik' => 'nullable|string',
            'parent_id' => 'nullable|exists:t_contracts,id',
            'p1_entity' => 'nullable|string',
            'p1_signer' => 'nullable|string',
            'p1_signer_position' => 'nullable|string',
            'p1_address' => 'nullable|string',
            'p2_entity' => 'nullable|string',
            'p2_signer' => 'nullable|string',
            'p2_signer_position' => 'nullable|string',
            'p2_address' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $contract = $this->updateAction->execute($contract, $validated);

        return response()->json(ContractFormatter::formatContract($contract->fresh([
            'contractType',
            'submissionType',
            'vendor',
            'creator',
            'initiator',
            'parent',
            'workflow.steps',
            'workflowStep.actions',
            'versions.uploader',
            'approvals.approver',
            'approvals.workflowStep',
            'histories.actor',
            'messages.user',
            'formSubmissions',
        ])));
    }

    public function destroy(string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status !== 'draft') {
            return response()->json(['message' => 'Hanya kontrak berstatus draft yang dapat dihapus.'], 422);
        }

        return DB::transaction(function () use ($contract) {
            // Delete from storage
            Storage::disk('local')->deleteDirectory("contracts/{$contract->id}");

            // Other relations are deleted by database cascade
            $contract->delete();

            return response()->json(['message' => 'Kontrak berhasil dihapus.']);
        });
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        if (! $this->checkBulkPermission('can_bulk_delete')) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk aksi massal ini.'], 403);
        }

        $ids = $request->input('ids');
        if (empty($ids)) {
            return response()->json(['message' => 'Tidak ada kontrak yang dipilih.'], 422);
        }

        return DB::transaction(function () use ($ids) {
            $contracts = Contract::whereIn('id', $ids)->get();
            $count = 0;

            foreach ($contracts as $contract) {
                if ($contract->status === 'draft') {
                    Storage::disk('local')->deleteDirectory("contracts/{$contract->id}");
                    $contract->delete();
                    $count++;
                }
            }

            return response()->json(['message' => "$count kontrak berhasil dihapus."]);
        });
    }

    public function export(Request $request)
    {
        $query = $this->getFilteredContractsQuery($request, $request->input('view', 'all'));

        return Excel::download(
            new ContractExport($query),
            'data_kontrak_'.date('Ymd_His').'.xlsx',
        );
    }

    public function compareAgreementVersions(string $id, Request $request): Response
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->compareVersions($contract, 'agreement', $request);
    }

    public function compareFormVersions(string $id, string $type, Request $request): Response
    {
        $contract = Contract::findOrFail($id);

        return $this->fileAction->compareVersions($contract, $type, $request);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        try {
            Excel::import(new ContractImport, $request->file('file'));

            return back()->with('success', 'Data kontrak berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }

    protected function checkBulkPermission($permission)
    {
        $role = Role::where('name', Auth::user()->role)->first();
        if (! $role) {
            return false;
        }

        return AccessModule::where('role_id', $role->id)
            ->join('m_modules', 'm_access_modules.module_id', '=', 'm_modules.id')
            ->where('m_modules.identifier', 'CONTRACTS')
            ->where($permission, true)
            ->exists();
    }
}
