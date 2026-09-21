<?php

namespace App\Http\Controllers\Core;

use App\Core\Crud\Fields\Section;
use App\Core\Crud\Resources\BusinessUnitResource;
use App\Core\Crud\Resources\CompanyGroupResource;
use App\Core\Crud\Resources\CompanyResource;
use App\Core\Crud\Resources\ContractFilterTemplateResource;
use App\Core\Crud\Resources\ContractSlaConfigResource;
use App\Core\Crud\Resources\ContractStatusResource;
use App\Core\Crud\Resources\ContractTypeResource;
use App\Core\Crud\Resources\DashboardTypeResource;
use App\Core\Crud\Resources\DepartmentResource;
use App\Core\Crud\Resources\DivisionResource;
use App\Core\Crud\Resources\HolidayResource;
use App\Core\Crud\Resources\JobLevelGroupResource;
use App\Core\Crud\Resources\JobLevelResource;
use App\Core\Crud\Resources\JobTitleResource;
use App\Core\Crud\Resources\LocationResource;
use App\Core\Crud\Resources\OrganizationGroupResource;
use App\Core\Crud\Resources\OrganizationLevelResource;
use App\Core\Crud\Resources\RegionResource;
use App\Core\Crud\Resources\RoleResource;
use App\Core\Crud\Resources\UserResource;
use App\Core\Crud\Resources\VendorResource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\ImportFileRequest;
use App\Models\Authority;
use App\Models\CompanyGroup;
use App\Services\Crud\ResourceQueryBuilderService;
use App\Services\MasterData\MasterAuthoritySyncService;
use App\Services\PortalSyncService;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ResourceController extends Controller
{
    public function __construct(
        protected PortalSyncService $portalSyncService,
        protected ResourceQueryBuilderService $queryBuilderService,
        protected MasterAuthoritySyncService $authoritySyncService,
    ) {}

    /**
     * Map of slugs to their respective Resource classes.
     * In a real app, this can be auto-discovered.
     */
    protected array $resources = [
        'roles' => RoleResource::class,
        'contract-statuses' => ContractStatusResource::class,
        'departments' => DepartmentResource::class,
        'company-groups' => CompanyGroupResource::class,
        'regions' => RegionResource::class,
        'users' => UserResource::class,
        'contract-types' => ContractTypeResource::class,
        'companies' => CompanyResource::class,
        'vendors' => VendorResource::class,
        'divisions' => DivisionResource::class,
        'contract-sla-configs' => ContractSlaConfigResource::class,
        'contract-filter-templates' => ContractFilterTemplateResource::class,
        'dashboard-types' => DashboardTypeResource::class,
        'locations' => LocationResource::class,
        'business-units' => BusinessUnitResource::class,
        'job-levels' => JobLevelResource::class,
        'job-level-groups' => JobLevelGroupResource::class,
        'job-titles' => JobTitleResource::class,
        'organization-levels' => OrganizationLevelResource::class,
        'organization-groups' => OrganizationGroupResource::class,
        'holidays' => HolidayResource::class,
    ];

    /**
     * Resolve the resource class from the slug.
     */
    protected function getResourceClass(string $slug)
    {
        if (! isset($this->resources[$slug])) {
            abort(404, "Resource [{$slug}] not found.");
        }

        return $this->resources[$slug];
    }

    public function index(Request $request, string $resourceSlug)
    {
        ini_set('memory_limit', '512M');
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        // Start query
        $query = $modelClass::with($resourceClass::$with ?? []);
        if (! empty($resourceClass::$withCount)) {
            $query->withCount($resourceClass::$withCount);
        }

        if ($resourceSlug === 'vendors') {
            // vendor data fully from COMA, no m_vendor_documents needed
        }

        if ($resourceSlug === 'contract-types' && ! $request->filled('search')) {
            $query->whereNull('parent_id')->with(['f1FormTemplate', 'f2FormTemplate', 'contractFormTemplate', 'children' => function ($q) {
                $q->with(['f1FormTemplate', 'f2FormTemplate', 'contractFormTemplate', 'children' => function ($q2) {
                    $q2->with(['f1FormTemplate', 'f2FormTemplate', 'contractFormTemplate', 'children' => function ($q3) {
                        $q3->with(['f1FormTemplate', 'f2FormTemplate', 'contractFormTemplate', 'children']);
                    }]);
                }]);
            }]);
        }

        // Apply search, filters, and sorting via ResourceQueryBuilderService
        $query = $this->queryBuilderService->applySearch($query, $request, $resourceClass, $resourceSlug);
        $query = $this->queryBuilderService->applyFilters($query, $request, $resourceClass, $resourceSlug);
        $query = $this->queryBuilderService->applySorting($query, $request, $resourceClass);

        $filterConfig = collect($resourceClass::filters())->map(fn ($f) => $f->toArray())->toArray();
        $tableColumns = Schema::getColumnListing((new $modelClass)->getTable());
        $hasIsUsedColumn = in_array('is_used', $tableColumns);
        $hasIsActiveColumn = in_array('is_active', $tableColumns);
        $isUsedRequested = $request->has('is_used');
        $isActiveRequested = $request->has('is_active');

        // Execute pagination
        $perPage = $request->input('per_page', 15);
        $data = $query->paginate($perPage)->withQueryString();

        $filterKeys = collect($resourceClass::filters())->flatMap(fn ($f) => [$f->getName(), "{$f->getName()}_from", "{$f->getName()}_to"])->toArray();
        $activeFilters = $request->only(array_merge(['search', 'sort_by', 'sort_dir', 'per_page'], $filterKeys));
        if (! $isUsedRequested && $hasIsUsedColumn) {
            $activeFilters['is_used'] = ['1'];
        }
        if (! $isActiveRequested && $hasIsActiveColumn) {
            $activeFilters['is_active'] = ['1'];
        }

        return Inertia::render('Core/ResourceIndex', [
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'tableSchema' => $resourceClass::table(),
            'formSchema' => $resourceClass::form(),
            'data' => $data,
            'filters' => $filterConfig,
            'activeFilters' => $activeFilters,
            'hasExport' => ! empty($resourceClass::$exportClass),
            'hasImport' => ! empty($resourceClass::$importClass),
            'hasPortalSync' => in_array($resourceSlug, ['regions', 'company-groups', 'locations', 'companies', 'business-units', 'departments', 'users', 'job-levels', 'job-titles']),
        ]);
    }

    public function create(Request $request, string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $returnUrl = $request->query('return_url');

        $extraProps = [];
        if ($resourceSlug === 'dashboard-types') {
            $extraProps = [
                'roles' => \App\Models\Role::select('id', 'name')->orderBy('name')->get(),
                'departments' => \App\Models\Department::select('id', 'name', 'code', 'idorg_group', 'org_group_name')->where('is_used', true)->orderBy('name')->get(),
                'divisions' => \App\Models\Division::select('id', 'name', 'code', 'department_id')->orderBy('name')->get(),
                'locations' => \App\Models\Location::select('id', 'name', 'code')->where('is_used', true)->orderBy('name')->get(),
                'users' => \App\Models\User::select('id', 'name', 'email', 'nik', 'username', 'role_id', 'department_id', 'division_id', 'company_id', 'company_name', 'org_name', 'location_id', 'idlocation', 'location_name', 'company_group_id', 'region_id', 'is_used')
                    ->with(['department:id,name,idorg_group,org_group_name', 'company:id,name,company_group_name,region_name', 'location:id,name,code'])
                    ->where('is_used', true)
                    ->orderBy('name')
                    ->get(),
                'companyGroups' => \App\Models\CompanyGroup::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
                'organizationGroups' => \App\Models\OrganizationGroup::select('id', 'name', 'code', 'idorg_group')->where('is_used', true)->orderBy('name')->get(),
                'regions' => \App\Models\Region::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
                'companies' => \App\Models\Company::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
            ];
        }

        return Inertia::render('Core/ResourceForm', array_merge([
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'formSchema' => $resourceClass::form(),
            'formColumns' => $resourceClass::$formColumns ?? 1,
            'record' => null,
            'returnUrl' => $returnUrl,
        ], $extraProps));
    }

    public function store(Request $request, string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        // Build validation rules from form schema
        $rules = [];
        foreach ($this->flattenFields($resourceClass::form()) as $field) {
            $rules[$field->getName()] = $field->getRules();
        }

        $validated = $request->validate($this->resolveValidationRules($rules, null));

        if (array_key_exists('password', $validated) && ($validated['password'] === null || $validated['password'] === '')) {
            unset($validated['password']);
        }

        $columns = Schema::getColumnListing((new $modelClass)->getTable());
        $saveData = array_intersect_key($validated, array_flip($columns));

        $created = $modelClass::create($saveData);

        if ($resourceSlug === 'dashboard-types' && $request->has('authorities')) {
            $this->authoritySyncService->sync(
                Authority::CONTEXT_DASHBOARD_TYPE,
                $created->id,
                (array) $request->input('authorities', [])
            );
        }

        $returnUrl = $request->input('return_url') ?: $request->query('return_url');
        if ($returnUrl && (str_starts_with($returnUrl, '/admin/core/') || str_starts_with($returnUrl, url('/admin/core/')))) {
            return redirect($returnUrl)->with('success', $resourceClass::getTitle().' created successfully.');
        }

        return redirect()->route('core.index', $resourceSlug)->with('success', $resourceClass::getTitle().' created successfully.');
    }

    public function edit(Request $request, string $resourceSlug, $id)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;
        $withRelations = $resourceClass::$with ?? [];
        $record = ! empty($withRelations) ? $modelClass::with($withRelations)->findOrFail($id) : $modelClass::findOrFail($id);
        $returnUrl = $request->query('return_url');

        $extraProps = [];

        if ($resourceSlug === 'dashboard-types' && $record instanceof \App\Models\DashboardType) {
            $authorities = $this->authoritySyncService->getForContext(Authority::CONTEXT_DASHBOARD_TYPE, $record->id);
            $record->setAttribute('authorities', $authorities);

            $extraProps = [
                'roles' => \App\Models\Role::select('id', 'name')->orderBy('name')->get(),
                'departments' => \App\Models\Department::select('id', 'name', 'code', 'idorg_group', 'org_group_name')->where('is_used', true)->orderBy('name')->get(),
                'divisions' => \App\Models\Division::select('id', 'name', 'code', 'department_id')->orderBy('name')->get(),
                'locations' => \App\Models\Location::select('id', 'name', 'code')->where('is_used', true)->orderBy('name')->get(),
                'users' => \App\Models\User::select('id', 'name', 'email', 'nik', 'username', 'role_id', 'department_id', 'division_id', 'company_id', 'company_name', 'org_name', 'location_id', 'idlocation', 'location_name', 'company_group_id', 'region_id', 'is_used')
                    ->with(['department:id,name,idorg_group,org_group_name', 'company:id,name,company_group_name,region_name', 'location:id,name,code'])
                    ->where('is_used', true)
                    ->orderBy('name')
                    ->get(),
                'companyGroups' => \App\Models\CompanyGroup::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
                'organizationGroups' => \App\Models\OrganizationGroup::select('id', 'name', 'code', 'idorg_group')->where('is_used', true)->orderBy('name')->get(),
                'regions' => \App\Models\Region::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
                'companies' => \App\Models\Company::select('id', 'name')->where('is_used', true)->orderBy('name')->get(),
            ];
        }

        if ($resourceSlug === 'users' && $record instanceof \App\Models\User) {
            $resolvedType = \App\Models\DashboardType::resolveForUser($record);
            $filterSettings = $record->getContractFilterSettings();
            $record->setAttribute('resolved_policy', [
                'dashboard_type_name' => $resolvedType?->name ?? 'Default (Fallback)',
                'dashboard_type_description' => $resolvedType?->description ?? 'Tidak ada profil spesifik, menggunakan kebijakan default.',
                'categories' => $resolvedType?->categories ?? ['contract', 'non-contract', 'nda'],
                'contract_type_ids' => $resolvedType?->contract_type_ids ?? [],
                'scope_to_user_division' => (bool) ($resolvedType?->scope_to_user_division ?? false),
                'scope_to_user_department' => (bool) ($resolvedType?->scope_to_user_department ?? false),
                'scope_to_user_company' => (bool) ($resolvedType?->scope_to_user_company ?? false),
                'scope_to_user_company_group' => (bool) ($resolvedType?->scope_to_user_company_group ?? false),
                'scope_to_user_region' => (bool) ($resolvedType?->scope_to_user_region ?? false),
                'show_overview' => (bool) ($resolvedType?->show_overview ?? true),
                'show_overview_contract' => (bool) ($resolvedType?->show_overview_contract ?? true),
                'show_overview_non_contract' => (bool) ($resolvedType?->show_overview_non_contract ?? true),
                'show_overview_nda' => (bool) ($resolvedType?->show_overview_nda ?? true),
                'show_workload' => (bool) ($resolvedType?->show_workload ?? false),
                'show_master_data' => (bool) ($resolvedType?->show_master_data ?? false),
                'filter_settings' => $filterSettings,
            ]);
        }

        return Inertia::render('Core/ResourceForm', array_merge([
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'formSchema' => $resourceClass::form(),
            'formColumns' => $resourceClass::$formColumns ?? 1,
            'record' => $record,
            'returnUrl' => $returnUrl,
        ], $extraProps));
    }

    public function vendorDocument(Request $request, $id)
    {
        $resourceClass = $this->getResourceClass('vendors');
        $modelClass = $resourceClass::$model;
        $record = $modelClass::findOrFail($id);

        return Inertia::render('Core/VendorDocument', [
            'vendor' => $record,
        ]);
    }

    // ponytail: proxy download COMA file with base64 decode & token caching
    public function downloadVendorFile(Request $request)
    {
        $fileName = $request->query('fileName');
        if (! $fileName) {
            abort(400, 'File name is required');
        }

        $baseUrl = rtrim(config('services.coma.base_url'), '/');
        
        $token = Cache::remember('coma_api_token', 300, function () use ($baseUrl) {
            $resp = Http::timeout(15)->post("{$baseUrl}/api/Authentication/authenticate", [
                'username' => config('services.coma.username'),
                'password' => config('services.coma.password'),
            ]);
            return ($resp->successful() && $resp->json('status') === 'success') ? $resp->json('data') : null;
        });

        if (! $token) {
            abort(502, 'Gagal terhubung ke layanan vendor COMA.');
        }

        $fileResp = Http::timeout(45)
            ->withToken($token)
            ->get("{$baseUrl}/api/FileUpload/DownloadFile", ['fileName' => $fileName]);

        if (! $fileResp->successful()) {
            abort(404, 'Dokumen tidak ditemukan di COMA.');
        }

        $body = $fileResp->json();
        $rawBase64 = is_array($body) ? ($body['data'] ?? null) : null;
        $binaryData = $rawBase64 ? base64_decode($rawBase64) : $fileResp->body();

        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'jfif' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'csv' => 'text/csv',
            'txt' => 'text/plain',
            'zip' => 'application/zip',
            'rar' => 'application/x-rar-compressed',
        ];
        $contentType = $mimeTypes[$ext] ?? 'application/octet-stream';

        return response($binaryData, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'inline; filename="'.basename($fileName).'"',
        ]);
    }

    public function update(Request $request, string $resourceSlug, $id)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        $record = $modelClass::findOrFail($id);

        $rules = [];
        foreach ($this->flattenFields($resourceClass::form()) as $field) {
            $rules[$field->getName()] = $field->getRules();
        }

        $validated = $request->validate($this->resolveValidationRules($rules, $id));

        if (array_key_exists('password', $validated) && ($validated['password'] === null || $validated['password'] === '')) {
            unset($validated['password']);
        }

        $columns = Schema::getColumnListing((new $modelClass)->getTable());
        $saveData = array_intersect_key($validated, array_flip($columns));

        $record->update($saveData);

        if ($resourceSlug === 'dashboard-types' && $request->has('authorities')) {
            $this->authoritySyncService->sync(
                Authority::CONTEXT_DASHBOARD_TYPE,
                $record->id,
                (array) $request->input('authorities', [])
            );
        }

        $returnUrl = $request->input('return_url') ?: $request->query('return_url');
        if ($returnUrl && (str_starts_with($returnUrl, '/admin/core/') || str_starts_with($returnUrl, url('/admin/core/')))) {
            return redirect($returnUrl)->with('success', $resourceClass::getTitle().' updated successfully.');
        }

        return redirect()->route('core.index', $resourceSlug)->with('success', $resourceClass::getTitle().' updated successfully.');
    }

    public function destroy(Request $request, string $resourceSlug, $id)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        $modelClass::findOrFail($id)->delete();

        $returnUrl = $request->input('return_url') ?: $request->query('return_url');
        if ($returnUrl && (str_starts_with($returnUrl, '/admin/core/') || str_starts_with($returnUrl, url('/admin/core/')))) {
            return redirect($returnUrl)->with('success', $resourceClass::getTitle().' deleted successfully.');
        }

        return redirect()->back()->with('success', $resourceClass::getTitle().' deleted successfully.');
    }

    public function bulkDestroy(string $resourceSlug, Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required',
        ]);

        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        $modelClass::whereIn('id', $request->input('ids'))->delete();

        $returnUrl = $request->input('return_url') ?: $request->query('return_url');
        if ($returnUrl && (str_starts_with($returnUrl, '/admin/core/') || str_starts_with($returnUrl, url('/admin/core/')))) {
            return redirect($returnUrl)->with('success', 'Beberapa data '.$resourceClass::getTitle().' berhasil dihapus.');
        }

        return redirect()->back()->with('success', 'Beberapa data '.$resourceClass::getTitle().' berhasil dihapus.');
    }

    public function bulkUpdate(string $resourceSlug, Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required',
            'values' => 'required|array',
        ]);

        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        // Filter null and empty strings, but keep false and 0
        $fieldsToUpdate = array_filter($request->input('values'), function ($value) {
            return $value !== null && $value !== '';
        });

        if (! empty($fieldsToUpdate)) {
            $columns = Schema::getColumnListing((new $modelClass)->getTable());
            $safeFields = array_intersect_key($fieldsToUpdate, array_flip($columns));
            if (! empty($safeFields)) {
                $modelClass::whereIn('id', $request->input('ids'))->update($safeFields);
            }
        }

        $returnUrl = $request->input('return_url') ?: $request->query('return_url');
        if ($returnUrl && (str_starts_with($returnUrl, '/admin/core/') || str_starts_with($returnUrl, url('/admin/core/')))) {
            return redirect($returnUrl)->with('success', 'Beberapa data '.$resourceClass::getTitle().' berhasil diperbarui.');
        }

        return redirect()->back()->with('success', 'Beberapa data '.$resourceClass::getTitle().' berhasil diperbarui.');
    }

    public function export(Request $request, string $resourceSlug)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $resourceClass = $this->getResourceClass($resourceSlug);

        if (! $resourceClass::$exportClass) {
            abort(404, "Export not supported for resource [{$resourceSlug}].");
        }

        $exportClass = $resourceClass::$exportClass;
        $fileName = str_replace(' ', '_', strtolower($resourceClass::getTitle())).'_'.date('Ymd').'.xlsx';

        try {
            $exportInstance = new $exportClass($request);
        } catch (\ArgumentCountError) {
            $exportInstance = new $exportClass;
        }

        return Excel::download($exportInstance, $fileName);
    }

    public function import(ImportFileRequest $request, string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);

        if (! $resourceClass::$importClass) {
            abort(404, "Import not supported for resource [{$resourceSlug}].");
        }

        $importClass = $resourceClass::$importClass;

        try {
            Excel::import(new $importClass, $request->file('file'));

            return back()->with('success', 'Data '.$resourceClass::getTitle().' berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }

    /**
     * Synchronize resource master data from external Portal API.
     */
    public function syncPortal(Request $request, string $resourceSlug)
    {
        $isUsedMode = $request->input('is_used_mode', 'keep');

        if ($resourceSlug === 'regions') {
            $result = $this->portalSyncService->syncRegions($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'company-groups') {
            $result = $this->portalSyncService->syncCompanyGroups($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'locations') {
            $result = $this->portalSyncService->syncLocations($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'companies') {
            $result = $this->portalSyncService->syncCompanies($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'business-units') {
            $result = $this->portalSyncService->syncBusinessUnits($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'departments') {
            $result = $this->portalSyncService->syncDepartments($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'users') {
            $result = $this->portalSyncService->syncEmployees($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'job-levels') {
            $result = $this->portalSyncService->syncJobLevels($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'job-level-groups') {
            $result = $this->portalSyncService->syncJobLevelGroups($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'job-titles') {
            $result = $this->portalSyncService->syncJobTitles($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'organization-levels') {
            $result = $this->portalSyncService->syncOrganizationLevels($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'organization-groups') {
            $result = $this->portalSyncService->syncOrganizationGroups($isUsedMode);

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        return back()->withErrors(['error' => "Sinkronisasi portal belum didukung untuk resource [{$resourceSlug}]."]);
    }

    private function flattenFields(array $schema): array
    {
        $fields = [];
        foreach ($schema as $item) {
            if ($item instanceof Section) {
                $fields = array_merge($fields, $item->getFields());
            } else {
                $fields[] = $item;
            }
        }

        return $fields;
    }

    private function resolveValidationRules(array $rules, $recordId = null): array
    {
        $resolved = [];
        foreach ($rules as $field => $fieldRules) {
            if (is_string($fieldRules)) {
                $fieldRules = explode('|', $fieldRules);
            }
            if (is_array($fieldRules)) {
                $fieldRules = array_map(function ($rule) use ($recordId) {
                    if (is_string($rule)) {
                        if ($recordId !== null) {
                            return str_replace('{id}', (string) $recordId, $rule);
                        } else {
                            return str_replace([',{id}', '{id}'], ['', 'NULL'], $rule);
                        }
                    }
                    if ($rule instanceof \Closure) {
                        return $rule($recordId);
                    }

                    return $rule;
                }, $fieldRules);
            }
            $resolved[$field] = $fieldRules;
        }

        return $resolved;
    }
}
