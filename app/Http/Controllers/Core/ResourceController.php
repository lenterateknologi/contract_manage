<?php

namespace App\Http\Controllers\Core;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ResourceController extends Controller
{
    /**
     * Map of slugs to their respective Resource classes.
     * In a real app, this can be auto-discovered.
     */
    protected array $resources = [
        // 'departments' => \App\Resources\DepartmentResource::class,
    ];

    /**
     * Resolve the resource class from the slug.
     */
    protected function getResourceClass(string $slug)
    {
        if (!isset($this->resources[$slug])) {
            abort(404, "Resource [{$slug}] not found.");
        }

        return $this->resources[$slug];
    }

    public function index(Request $request, string $resourceSlug)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        // Start query
        $query = $modelClass::query();

        // Implement simple search if exists
        if ($request->has('search')) {
            $search = $request->input('search');
            $searchableColumns = collect($resourceClass::table())
                ->filter(fn($column) => $column->isSearchable())
                ->map(fn($column) => $column->getName());

            if ($searchableColumns->isNotEmpty()) {
                $query->where(function ($q) use ($searchableColumns, $search) {
                    foreach ($searchableColumns as $column) {
                        $q->orWhere($column, 'like', "%{$search}%");
                    }
                });
            }
        }

        $data = $query->paginate(10)->withQueryString();

        return Inertia::render('Core/ResourceIndex', [
            'resourceSlug' => $resourceSlug,
            'title' => $resourceClass::getTitle(),
            'tableSchema' => $resourceClass::table(),
            'formSchema' => $resourceClass::form(),
            'data' => $data,
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

        $modelClass::create($validated);

        return redirect()->back()->with('success', $resourceClass::getTitle() . ' created successfully.');
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

        $record->update($validated);

        return redirect()->back()->with('success', $resourceClass::getTitle() . ' updated successfully.');
    }

    public function destroy(string $resourceSlug, $id)
    {
        $resourceClass = $this->getResourceClass($resourceSlug);
        $modelClass = $resourceClass::$model;

        $modelClass::findOrFail($id)->delete();

        return redirect()->back()->with('success', $resourceClass::getTitle() . ' deleted successfully.');
    }
}
