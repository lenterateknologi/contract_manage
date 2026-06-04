<?php

namespace App\Queries\Master;

use App\Models\Vendor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorQuery
{
    /**
     * Build the query for vendors with filters.
     */
    public function list(Request $request): Builder
    {
        return Vendor::query()
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(code)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(category)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(email)'), 'like', "%{$search}%");
                });
            })
            ->when($request->category, function ($q, $category) {
                $q->whereIn('category', (array) $category);
            })
            ->when($request->is_active, function ($q, $active) {
                $bools = collect((array) $active)->map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN))->toArray();
                $q->whereIn('is_active', $bools);
            });
    }

    /**
     * Get a vendor by ID with its documents.
     */
    public function findWithDocuments(string $id): Vendor
    {
        return Vendor::with('documents')->findOrFail($id);
    }
}
