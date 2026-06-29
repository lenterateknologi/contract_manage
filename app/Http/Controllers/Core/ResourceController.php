<?php

namespace App\Http\Controllers\Core;

use App\Core\Crud\Resources\CompanyGroupResource;
use App\Core\Crud\Resources\CompanyResource;
use App\Core\Crud\Resources\ContractStatusResource;
use App\Core\Crud\Resources\ContractTypeResource;
use App\Core\Crud\Resources\DepartmentResource;
use App\Core\Crud\Resources\RegionResource;
use App\Core\Crud\Resources\RoleResource;
use App\Core\Crud\Resources\UserResource;
use App\Core\Crud\Resources\VendorResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResourceController extends Controller
{
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

        // Implement simple search if exists
        if ($request->has('search')) {
            $search = $request->input('search');
            $searchableColumns = collect($resourceClass::table())
                ->filter(fn ($column) => $column->isSearchable())
                ->map(fn ($column) => $column->getName());

            if ($searchableColumns->isNotEmpty()) {
                $query->where(function ($q) use ($searchableColumns, $search) {
                    foreach ($searchableColumns as $column) {
                        $q->orWhere($column, 'like', "%{$search}%");
                    }
                });
            }
        }

        // Filter config
        $filterConfig = collect($resourceClass::filters())->map(fn ($f) => $f->toArray())->toArray();

        // Implement filtration
        foreach ($resourceClass::filters() as $filter) {
            $key = $filter->getName();
            if ($request->has($key) && $request->input($key) !== '' && $request->input($key) !== null) {
                $val = $request->input($key);
                if (is_array($val)) {
                    $query->whereIn($key, array_filter($val, fn ($v) => $v !== '' && $v !== null));
                } else {
                    $query->where($key, $val);
                }
            }
        }

        // Implement sorting
        $sortBy = $request->input('sort_by');
        $sortDir = $request->input('sort_dir', 'asc');
        if ($sortBy) {
            $query->orderBy($sortBy, $sortDir);
        }

        $data = $query->paginate(10)->withQueryString();

        return Inertia::render('Core/ResourceIndex', [
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'tableSchema' => $resourceClass::table(),
            'formSchema' => $resourceClass::form(),
            'data' => $data,
            'filters' => $filterConfig,
            'activeFilters' => $request->only(array_merge(['search', 'sort_by', 'sort_dir'], collect($resourceClass::filters())->map(fn ($f) => $f->getName())->toArray())),
            'hasExport' => ! empty($resourceClass::$exportClass),
            'hasImport' => ! empty($resourceClass::$importClass),
        ]);
    }

    public function create(Request $request, string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);

        return Inertia::render('Core/ResourceForm', [
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'formSchema' => $resourceClass::form(),
            'formColumns' => $resourceClass::$formColumns ?? 1,
            'record' => null,
        ]);
    }

    public function store(Request $request, string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        // Build validation rules from form schema
        $rules = [];
        foreach ($resourceClass::form() as $field) {
            $rules[$field->getName()] = $field->getRules();
        }

        $validated = $request->validate($rules);

        if (array_key_exists('password', $validated) && ($validated['password'] === null || $validated['password'] === '')) {
            unset($validated['password']);
        }

        $modelClass::create($validated);

        return redirect()->route('core.index', $resourceSlug)->with('success', $resourceClass::getTitle().' created successfully.');
    }

    public function edit(Request $request, string $resourceSlug, $id)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;
        $record = $modelClass::findOrFail($id);

        return Inertia::render('Core/ResourceForm', [
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'formSchema' => $resourceClass::form(),
            'formColumns' => $resourceClass::$formColumns ?? 1,
            'record' => $record,
        ]);
    }

    public function update(Request $request, string $resourceSlug, $id)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        $record = $modelClass::findOrFail($id);

        $rules = [];
        foreach ($resourceClass::form() as $field) {
            $rules[$field->getName()] = $field->getRules();
        }

        $validated = $request->validate($rules);

        if (array_key_exists('password', $validated) && ($validated['password'] === null || $validated['password'] === '')) {
            unset($validated['password']);
        }

        $record->update($validated);

        return redirect()->route('core.index', $resourceSlug)->with('success', $resourceClass::getTitle().' updated successfully.');
    }

    public function destroy(string $resourceSlug, $id)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        $modelClass::findOrFail($id)->delete();

        return redirect()->route('core.index', $resourceSlug)->with('success', $resourceClass::getTitle().' deleted successfully.');
    }

    public function bulkDestroy(string $resourceSlug, \Illuminate\Http\Request $request)
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

    public function export(string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);

        if (! $resourceClass::$exportClass) {
            abort(404, "Export not supported for resource [{$resourceSlug}].");
        }

        $exportClass = $resourceClass::$exportClass;
        $fileName = str_replace(' ', '_', strtolower($resourceClass::getTitle())).'_'.date('Ymd').'.xlsx';

        return \Maatwebsite\Excel\Facades\Excel::download(new $exportClass, $fileName);
    }

    public function import(\App\Http\Requests\Common\ImportFileRequest $request, string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);

        if (! $resourceClass::$importClass) {
            abort(404, "Import not supported for resource [{$resourceSlug}].");
        }

        $importClass = $resourceClass::$importClass;

        try {
            \Maatwebsite\Excel\Facades\Excel::import(new $importClass, $request->file('file'));

            return back()->with('success', 'Data '.$resourceClass::getTitle().' berhasil diimpor.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengimpor data: '.$e->getMessage()]);
        }
    }
}
