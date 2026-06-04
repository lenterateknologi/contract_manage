<?php

namespace App\Queries\Master;

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
            ->with(['department', 'company'])
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(email)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(username)'), 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($q, $role) {
                $q->whereIn('role', (array) $role);
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
            ->select(['id', 'name', 'company_id', 'department_id', 'role'])
            ->orderBy('name');
    }
}
