<?php

namespace App\Http\Queries\Master;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserQuery
{
    /**
     * Build the query for user listing with filters.
     */
    public function list(Request $request): Builder
    {
        return User::query()
            ->with(['division', 'department', 'company', 'roleRelation'])
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(email)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(username)'), 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($q, $role) {
                $q->whereHas('roleRelation', fn ($qr) => $qr->whereIn('name', (array) $role));
            })
            ->when($request->division_id, function ($q, $divId) {
                $q->whereIn('division_id', (array) $divId);
            })
            ->when($request->department_id, function ($q, $deptId) {
                $q->whereIn('department_id', (array) $deptId);
            })
            ->when($request->company_id, function ($q, $companyId) {
                $q->whereIn('company_id', (array) $companyId);
            });
    }

    /**
     * Get a simple list of users for dropdowns/options.
     */
    public function options(): Builder
    {
        return User::query()
            ->select(['id', 'name', 'company_id', 'division_id', 'role_id'])
            ->orderBy('name');
    }
}
