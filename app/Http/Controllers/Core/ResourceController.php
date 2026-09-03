<?php

namespace App\Http\Controllers\Core;

use App\Core\Crud\Fields\Section;
use App\Core\Crud\Resources\BusinessUnitResource;
use App\Core\Crud\Resources\CompanyGroupResource;
use App\Core\Crud\Resources\CompanyResource;
use App\Core\Crud\Resources\ContractFilterTemplateResource;
use App\Core\Crud\Resources\ContractStatusResource;
use App\Core\Crud\Resources\ContractTypeResource;
use App\Core\Crud\Resources\DashboardTypeResource;
use App\Core\Crud\Resources\DepartmentResource;
use App\Core\Crud\Resources\DivisionResource;
use App\Core\Crud\Resources\JobLevelResource;
use App\Core\Crud\Resources\JobTitleResource;
use App\Core\Crud\Resources\LocationResource;
use App\Core\Crud\Resources\RegionResource;
use App\Core\Crud\Resources\RoleResource;
use App\Core\Crud\Resources\UserResource;
use App\Core\Crud\Resources\VendorResource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\ImportFileRequest;
use App\Models\CompanyGroup;
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
        'contract-filter-templates' => ContractFilterTemplateResource::class,
        'dashboard-types' => DashboardTypeResource::class,
        'locations' => LocationResource::class,
        'business-units' => BusinessUnitResource::class,
        'job-levels' => JobLevelResource::class,
        'job-titles' => JobTitleResource::class,
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

        // Implement search with support for multiple comma-separated values (e.g. "1990020003,1990020004,1990020005")
        if ($request->has('search') && trim((string) $request->input('search')) !== '') {
            $search = $request->input('search');
            $searchTerms = array_values(array_filter(array_map('trim', explode(',', $search)), fn ($t) => $t !== ''));

            $searchableColumns = collect($resourceClass::table())
                ->filter(fn ($column) => $column->isSearchable())
                ->map(fn ($column) => $column->getName());

            if ($searchableColumns->isNotEmpty() && ! empty($searchTerms)) {
                if ($resourceSlug === 'contract-types') {
                    // Tree-aware search: find matching IDs then expand to include ancestors + descendants
                    $matchingIds = $modelClass::where(function ($q) use ($searchableColumns, $searchTerms) {
                        foreach ($searchTerms as $term) {
                            $lowerTerm = strtolower($term);
                            $q->orWhere(function ($subQ) use ($searchableColumns, $lowerTerm) {
                                foreach ($searchableColumns as $column) {
                                    $subQ->orWhere(DB::raw("LOWER(COALESCE(CAST({$column} AS text), ''))"), 'like', "%{$lowerTerm}%");
                                }
                            });
                        }
                    })->pluck('id')->toArray();

                    if (! empty($matchingIds)) {
                        // Collect all ancestor IDs (walk up parent_id chain)
                        $ancestorIds = [];
                        $toCheck = $matchingIds;
                        while (! empty($toCheck)) {
                            $parents = $modelClass::whereIn('id', $toCheck)->whereNotNull('parent_id')->pluck('parent_id')->toArray();
                            $newParents = array_diff($parents, $ancestorIds, $matchingIds);
                            $ancestorIds = array_merge($ancestorIds, $newParents);
                            $toCheck = $newParents;
                        }

                        // Collect all descendant IDs (walk down children)
                        $descendantIds = [];
                        $toCheck = $matchingIds;
                        while (! empty($toCheck)) {
                            $children = $modelClass::whereIn('parent_id', $toCheck)->pluck('id')->toArray();
                            $newChildren = array_diff($children, $descendantIds, $matchingIds);
                            $descendantIds = array_merge($descendantIds, $newChildren);
                            $toCheck = $newChildren;
                        }

                        $allIds = array_unique(array_merge($matchingIds, $ancestorIds, $descendantIds));
                        $query->whereIn('id', $allIds);
                    } else {
                        $query->whereRaw('1 = 0'); // no results
                    }
                } else {
                    $searchColumns = $searchableColumns;
                    if ($resourceSlug === 'users') {
                        $searchColumns = collect(['nik', 'name', 'email', 'username', 'jobtitle_name', 'joblevel_name', 'company_name', 'location_name', 'org_name']);
                    } elseif ($resourceSlug === 'companies') {
                        $searchColumns = collect(['code', 'name', 'alias', 'npwp', 'company_group_name', 'region_name', 'city_name', 'oracle_code']);
                    } elseif ($resourceSlug === 'locations') {
                        $searchColumns = collect(['code', 'name', 'location_group_name', 'city_name', 'province_name', 'oracle_code']);
                    } elseif ($resourceSlug === 'business-units') {
                        $searchColumns = collect(['code', 'name', 'company_name', 'location_name', 'company_group_name', 'region_name', 'komoditi_name', 'kebun']);
                    }
                    $query->where(function ($q) use ($searchColumns, $searchTerms) {
                        foreach ($searchTerms as $term) {
                            $lowerTerm = strtolower($term);
                            $q->orWhere(function ($subQ) use ($searchColumns, $lowerTerm) {
                                foreach ($searchColumns as $column) {
                                    $subQ->orWhere(DB::raw("LOWER(COALESCE(CAST({$column} AS text), ''))"), 'like', "%{$lowerTerm}%");
                                }
                            });
                        }
                    });
                }
            }
        }

        // Filter config
        $filterConfig = collect($resourceClass::filters())->map(fn ($f) => $f->toArray())->toArray();
        $tableColumns = Schema::getColumnListing((new $modelClass)->getTable());
        $hasIsUsedColumn = in_array('is_used', $tableColumns);
        $hasIsActiveColumn = in_array('is_active', $tableColumns);

        // Check if is_used or is_active filter was explicitly requested in URL query
        $isUsedRequested = $request->has('is_used');
        $isActiveRequested = $request->has('is_active');

        // Implement filtration
        foreach ($resourceClass::filters() as $filter) {
            $key = $filter->getName();
            $fromKey = "{$key}_from";
            $toKey = "{$key}_to";

            if ($request->filled($fromKey) || $request->filled($toKey)) {
                $from = $request->input($fromKey);
                $to = $request->input($toKey);
                if ($from && $to) {
                    $query->whereBetween(DB::raw("DATE({$key})"), [$from, $to]);
                } elseif ($from) {
                    $query->whereDate($key, '>=', $from);
                } elseif ($to) {
                    $query->whereDate($key, '<=', $to);
                }
            } elseif ($request->has($key) && $request->input($key) !== '' && $request->input($key) !== null) {
                $val = $request->input($key);
                if (is_array($val)) {
                    $vals = array_values(array_filter($val, fn ($v) => $v !== '' && $v !== null));
                    if (! empty($vals)) {
                        if ($key === 'is_used' || $key === 'is_active') {
                            $boolVals = array_map(function ($v) {
                                return $v === '1' || $v === 1 || $v === true || $v === 'true';
                            }, $vals);
                            $query->whereIn($key, $boolVals);
                        } elseif ($key === 'company_group_id' && in_array($resourceSlug, ['companies', 'business-units', 'locations'])) {
                            $hasEmpty = in_array('__empty__', $vals, true) || in_array('empty', $vals, true) || in_array('-', $vals, true);
                            $concreteVals = array_values(array_filter($vals, fn ($v) => ! in_array($v, ['__empty__', 'empty', 'null', '-'], true)));
                            $groupNames = ! empty($concreteVals) ? CompanyGroup::whereIn('id', $concreteVals)->pluck('name')->toArray() : [];
                            $query->where(function ($q) use ($concreteVals, $groupNames, $hasEmpty) {
                                if (! empty($concreteVals)) {
                                    $q->whereIn('company_group_id', $concreteVals);
                                    if (! empty($groupNames)) {
                                        $q->orWhereIn('company_group_name', $groupNames);
                                    }
                                }
                                if ($hasEmpty) {
                                    $q->orWhereNull('company_group_id')
                                        ->orWhere(DB::raw('CAST(company_group_id AS text)'), '')
                                        ->orWhereNull('company_group_name')
                                        ->orWhere(DB::raw('CAST(company_group_name AS text)'), '');
                                }
                            });
                        } else {
                            $hasEmpty = in_array('__empty__', $vals, true) || in_array('empty', $vals, true) || in_array('null', $vals, true) || in_array('-', $vals, true);
                            $concreteVals = array_values(array_filter($vals, fn ($v) => ! in_array($v, ['__empty__', 'empty', 'null', '-'], true)));

                            if ($hasEmpty && ! empty($concreteVals)) {
                                $query->where(function ($q) use ($key, $concreteVals) {
                                    $q->whereIn($key, $concreteVals)
                                        ->orWhereNull($key)
                                        ->orWhere(DB::raw("CAST({$key} AS text)"), '');
                                });
                            } elseif ($hasEmpty) {
                                $query->where(function ($q) use ($key) {
                                    $q->whereNull($key)
                                        ->orWhere(DB::raw("CAST({$key} AS text)"), '');
                                });
                            } else {
                                $query->whereIn($key, $concreteVals);
                            }
                        }
                    }
                } else {
                    if ($key === 'is_used' || $key === 'is_active') {
                        $boolVal = ($val === '1' || $val === 1 || $val === true || $val === 'true');
                        $query->where($key, $boolVal);
                    } elseif ($key === 'company_group_id' && in_array($resourceSlug, ['companies', 'business-units', 'locations'])) {
                        if (in_array($val, ['__empty__', 'empty', 'null', '-'], true)) {
                            $query->where(function ($q) {
                                $q->whereNull('company_group_id')
                                    ->orWhere(DB::raw('CAST(company_group_id AS text)'), '')
                                    ->orWhereNull('company_group_name')
                                    ->orWhere(DB::raw('CAST(company_group_name AS text)'), '');
                            });
                        } else {
                            $groupName = CompanyGroup::find($val)?->name;
                            $query->where(function ($q) use ($val, $groupName) {
                                $q->where('company_group_id', $val);
                                if ($groupName) {
                                    $q->orWhere('company_group_name', $groupName);
                                }
                            });
                        }
                    } else {
                        if (in_array($val, ['__empty__', 'empty', 'null', '-'], true)) {
                            $query->where(function ($q) use ($key) {
                                $q->whereNull($key)
                                    ->orWhere(DB::raw("CAST({$key} AS text)"), '');
                            });
                        } else {
                            $query->where($key, $val);
                        }
                    }
                }
            }
        }

        // Apply default is_used = true and is_active = true if not explicitly provided and column exists on table
        if (! $isUsedRequested && $hasIsUsedColumn) {
            $query->where('is_used', true);
        }
        if (! $isActiveRequested && $hasIsActiveColumn) {
            $query->where('is_active', true);
        }

        // Implement sorting
        $sortBy = $request->input('sort_by');
        $sortDir = $request->input('sort_dir', 'asc');
        if ($sortBy) {
            $sortColumnMap = [
                'user_identity' => 'name',
                'position_access' => 'jobtitle_name',
                'placement_org' => 'company_name',
                'company_identity' => 'name',
                'org_structure' => 'company_group_name',
                'legal_integration' => 'npwp',
                'location_identity' => 'name',
                'location_group' => 'location_group_name',
                'region_group' => 'location_group_name',
                'bu_identity' => 'name',
                'company_placement' => 'company_name',
            ];
            $actualSortBy = $sortColumnMap[$sortBy] ?? $sortBy;

            if (str_contains($actualSortBy, '.')) {
                [$relation, $relColumn] = explode('.', $actualSortBy, 2);
                $modelInstance = new $modelClass;
                $method = method_exists($modelInstance, $relation) ? $relation : Str::camel($relation);
                if (method_exists($modelInstance, $method)) {
                    $relationInstance = $modelInstance->{$method}();
                    if ($relationInstance instanceof BelongsTo) {
                        $relatedTable = $relationInstance->getRelated()->getTable();
                        $foreignKey = $relationInstance->getForeignKeyName();
                        $ownerKey = $relationInstance->getOwnerKeyName();

                        $query->leftJoin($relatedTable, "{$modelInstance->getTable()}.{$foreignKey}", '=', "{$relatedTable}.{$ownerKey}")
                            ->orderBy("{$relatedTable}.{$relColumn}", $sortDir)
                            ->select("{$modelInstance->getTable()}.*");
                    } else {
                        $query->orderBy($actualSortBy, $sortDir);
                    }
                } else {
                    $query->orderBy($actualSortBy, $sortDir);
                }
            } else {
                $query->orderBy($actualSortBy, $sortDir);
            }
        } else {
            $query->latest('id');
        }

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

        return Inertia::render('Core/ResourceForm', [
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'formSchema' => $resourceClass::form(),
            'formColumns' => $resourceClass::$formColumns ?? 1,
            'record' => null,
            'returnUrl' => $returnUrl,
        ]);
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

        $validated = $request->validate($rules);

        if (array_key_exists('password', $validated) && ($validated['password'] === null || $validated['password'] === '')) {
            unset($validated['password']);
        }

        $columns = Schema::getColumnListing((new $modelClass)->getTable());
        $saveData = array_intersect_key($validated, array_flip($columns));

        $modelClass::create($saveData);

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

        return Inertia::render('Core/ResourceForm', [
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'formSchema' => $resourceClass::form(),
            'formColumns' => $resourceClass::$formColumns ?? 1,
            'record' => $record,
            'returnUrl' => $returnUrl,
        ]);
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
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

        $validated = $request->validate($rules);

        if (array_key_exists('password', $validated) && ($validated['password'] === null || $validated['password'] === '')) {
            unset($validated['password']);
        }

        $columns = Schema::getColumnListing($record->getTable());
        $saveData = array_intersect_key($validated, array_flip($columns));

        $record->update($saveData);

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

    public function export(string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);

        if (! $resourceClass::$exportClass) {
            abort(404, "Export not supported for resource [{$resourceSlug}].");
        }

        $exportClass = $resourceClass::$exportClass;
        $fileName = str_replace(' ', '_', strtolower($resourceClass::getTitle())).'_'.date('Ymd').'.xlsx';

        return Excel::download(new $exportClass, $fileName);
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
        if ($resourceSlug === 'regions') {
            $result = $this->portalSyncService->syncRegions();

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'company-groups') {
            $result = $this->portalSyncService->syncCompanyGroups();

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'locations') {
            $result = $this->portalSyncService->syncLocations();

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'companies') {
            $result = $this->portalSyncService->syncCompanies();

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'business-units') {
            $result = $this->portalSyncService->syncBusinessUnits();

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'departments') {
            $result = $this->portalSyncService->syncDepartments();

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'users') {
            $result = $this->portalSyncService->syncEmployees();

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'job-levels') {
            $result = $this->portalSyncService->syncJobLevels();

            if ($result['success']) {
                return back()->with('success', $result['message']);
            }

            return back()->withErrors(['error' => $result['message']]);
        }

        if ($resourceSlug === 'job-titles') {
            $result = $this->portalSyncService->syncJobTitles();

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
}
