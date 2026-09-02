<?php

namespace App\Http\Controllers\Core;

use App\Core\Crud\Fields\Section;
use App\Core\Crud\Resources\CompanyGroupResource;
use App\Core\Crud\Resources\CompanyResource;
use App\Core\Crud\Resources\ContractFilterTemplateResource;
use App\Core\Crud\Resources\ContractStatusResource;
use App\Core\Crud\Resources\ContractTypeResource;
use App\Core\Crud\Resources\DepartmentResource;
use App\Core\Crud\Resources\DivisionResource;
use App\Core\Crud\Resources\RegionResource;
use App\Core\Crud\Resources\RoleResource;
use App\Core\Crud\Resources\UserResource;
use App\Core\Crud\Resources\VendorResource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Common\ImportFileRequest;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;
use App\Services\ContractFilterScopeService;
use App\Services\PortalSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        'dashboard-types' => \App\Core\Crud\Resources\DashboardTypeResource::class,
        'locations' => \App\Core\Crud\Resources\LocationResource::class,
        'business-units' => \App\Core\Crud\Resources\BusinessUnitResource::class,
        'job-levels' => \App\Core\Crud\Resources\JobLevelResource::class,
        'job-titles' => \App\Core\Crud\Resources\JobTitleResource::class,
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

                    if (!empty($matchingIds)) {
                        // Collect all ancestor IDs (walk up parent_id chain)
                        $ancestorIds = [];
                        $toCheck = $matchingIds;
                        while (!empty($toCheck)) {
                            $parents = $modelClass::whereIn('id', $toCheck)->whereNotNull('parent_id')->pluck('parent_id')->toArray();
                            $newParents = array_diff($parents, $ancestorIds, $matchingIds);
                            $ancestorIds = array_merge($ancestorIds, $newParents);
                            $toCheck = $newParents;
                        }

                        // Collect all descendant IDs (walk down children)
                        $descendantIds = [];
                        $toCheck = $matchingIds;
                        while (!empty($toCheck)) {
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
                        if ($key === 'company_group_id' && in_array($resourceSlug, ['companies', 'business-units', 'locations'])) {
                            $groupNames = CompanyGroup::whereIn('id', $vals)->pluck('name')->toArray();
                            $query->where(function ($q) use ($vals, $groupNames) {
                                $q->whereIn('company_group_id', $vals);
                                if (! empty($groupNames)) {
                                    $q->orWhereIn('company_group_name', $groupNames);
                                }
                            });
                        } else {
                            $query->whereIn($key, $vals);
                        }
                    }
                } else {
                    if ($key === 'company_group_id' && in_array($resourceSlug, ['companies', 'business-units', 'locations'])) {
                        $groupName = CompanyGroup::find($val)?->name;
                        $query->where(function ($q) use ($val, $groupName) {
                            $q->where('company_group_id', $val);
                            if ($groupName) {
                                $q->orWhere('company_group_name', $groupName);
                            }
                        });
                    } else {
                        $query->where($key, $val);
                    }
                }
            }
        }

        // Implement sorting
        $sortBy = $request->input('sort_by');
        $sortDir = $request->input('sort_dir', 'asc');
        if ($sortBy) {
            $sortColumnMap = [
                'user_identity'      => 'name',
                'position_access'    => 'jobtitle_name',
                'placement_org'      => 'company_name',
                'company_identity'   => 'name',
                'org_structure'      => 'company_group_name',
                'legal_integration'  => 'npwp',
                'location_identity'  => 'name',
                'location_group'     => 'location_group_name',
                'region_group'       => 'location_group_name',
                'bu_identity'        => 'name',
                'company_placement'  => 'company_name',
            ];
            $actualSortBy = $sortColumnMap[$sortBy] ?? $sortBy;

            if (str_contains($actualSortBy, '.')) {
                [$relation, $relColumn] = explode('.', $actualSortBy, 2);
                $modelInstance = new $modelClass;
                $method = method_exists($modelInstance, $relation) ? $relation : \Illuminate\Support\Str::camel($relation);
                if (method_exists($modelInstance, $method)) {
                    $relationInstance = $modelInstance->{$method}();
                    if ($relationInstance instanceof \Illuminate\Database\Eloquent\Relations\BelongsTo) {
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

        return Inertia::render('Core/ResourceIndex', [
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'tableSchema' => $resourceClass::table(),
            'formSchema' => $resourceClass::form(),
            'data' => $data,
            'filters' => $filterConfig,
            'activeFilters' => $request->only(array_merge(['search', 'sort_by', 'sort_dir', 'per_page'], $filterKeys)),
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

        $modelClass::create($validated);

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

        $record->update($validated);

        $returnUrl = $request->input('return_url') ?: $request->query('return_url');
        if ($returnUrl && (str_starts_with($returnUrl, '/admin/core/') || str_starts_with($returnUrl, url('/admin/core/')))) {
            return redirect($returnUrl)->with('success', $resourceClass::getTitle().' updated successfully.');
        }

        return redirect()->route('core.index', $resourceSlug)->with('success', $resourceClass::getTitle().' updated successfully.');
    }

    public function destroy(string $resourceSlug, $id)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        $modelClass::findOrFail($id)->delete();

        return redirect()->route('core.index', $resourceSlug)->with('success', $resourceClass::getTitle().' deleted successfully.');
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

        return redirect()->route('core.index', $resourceSlug)->with('success', 'Beberapa data '.$resourceClass::getTitle().' berhasil dihapus.');
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
            $modelClass::whereIn('id', $request->input('ids'))->update($fieldsToUpdate);
        }

        return redirect()->route('core.index', $resourceSlug)->with('success', 'Beberapa data '.$resourceClass::getTitle().' berhasil diperbarui.');
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
