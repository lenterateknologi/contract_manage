<?php

namespace App\Http\Queries\Master;

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
                    $qq->where(DB::raw('LOWER(vendor_name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(vendor_code)'), 'like', "%{$search}%");
                });
            })
            ->when($request->is_active, function ($q, $active) {
                $bools = collect((array) $active)->map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN))->toArray();
                $q->whereIn('is_active', $bools);
            });
    }

    public function findWithDocuments(string $id): Vendor
    {
        return Vendor::findOrFail($id);
    }
}
