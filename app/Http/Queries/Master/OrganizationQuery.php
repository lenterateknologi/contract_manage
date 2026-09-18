<?php

namespace App\Http\Queries\Master;

use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\ContractType;
use App\Models\Department;
use App\Models\Region;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganizationQuery
{
    /**
     * Build the query for company groups with filters.
     */
    public function companyGroups(Request $request): Builder
    {
        return CompanyGroup::query()
            ->with(['companies.region'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->region_id, function ($q, $regionId) {
                $cleanRegionIds = collect((array) $regionId)
                    ->map(fn ($id) => str_contains($id, '|') ? last(explode('|', $id)) : $id)
                    ->filter(fn ($id) => $id !== 'null')
                    ->toArray();
                $q->whereHas('companies', function ($sq) use ($cleanRegionIds) {
                    $sq->whereIn('region_id', $cleanRegionIds);
                });
            });
    }

    /**
     * Build the query for regions.
     */
    public function regions(): Builder
    {
        return Region::query()
            ->with(['companies.group']);
    }

    /**
     * Build the query for companies with filters.
     */
    public function companies(Request $request): Builder
    {
        return Company::query()
            ->with(['region', 'group'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->region_id, function ($q, $regionId) {
                $cleanRegionIds = collect((array) $regionId)
                    ->map(fn ($id) => str_contains($id, '|') ? last(explode('|', $id)) : $id)
                    ->filter(fn ($id) => $id !== 'null')
                    ->toArray();
                $q->whereIn('region_id', $cleanRegionIds);
            })
            ->when($request->company_group_id, function ($q, $companyGroupId) {
                $cleanCompanyGroupIds = collect((array) $companyGroupId)
                    ->map(fn ($id) => str_contains($id, '|') ? head(explode('|', $id)) : $id)
                    ->toArray();
                $q->whereIn('company_group_id', $cleanCompanyGroupIds);
            });
    }

    /**
     * Build the query for departments with filters.
     */
    public function departments(?Request $request = null): Builder
    {
        $query = Department::query()->orderBy('name');

        if ($request) {
            $query->when(
                $request->search,
                function ($q, $s) {
                    $s = strtolower($s);

                    return $q->where(DB::raw('LOWER(name)'), 'like', "%{$s}%")
                        ->orWhere(DB::raw('LOWER(code)'), 'like', "%{$s}%");
                },
            )
                ->when($request->is_active, function ($q, $active) {
                    $bools = collect((array) $active)->map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN))->toArray();
                    $q->whereIn('is_active', $bools);
                });
        }

        return $query;
    }

    /**
     * Build the query for contract types with filters.
     */
    public function contractTypes(Request $request): Builder
    {
        return ContractType::query()
            ->with(['parent', 'children'])
            ->whereNull('parent_id')
            ->when(
                $request->search,
                function ($q, $s) {
                    $s = strtolower($s);

                    return $q->where(DB::raw('LOWER(name)'), 'like', "%{$s}%")
                        ->orWhere(DB::raw('LOWER(description)'), 'like', "%{$s}%");
                },
            );
    }

    /**
     * Build the query for contract statuses with filters.
     */
    public function contractStatuses(Request $request): Builder
    {
        return ContractStatus::query()
            ->when(
                $request->search,
                function ($q, $s) {
                    $s = strtolower($s);

                    return $q->where(DB::raw('LOWER(label)'), 'like', "%{$s}%")
                        ->orWhere(DB::raw('LOWER(code)'), 'like', "%{$s}%");
                },
            );
    }

    /**
     * Get department traffic statistics.
     */
     public function getDepartmentTraffic(): array
     {
         $incomingCounts = DB::table('t_contracts as c')
             ->leftJoin('m_users as init', 'c.initiated_by_id', '=', 'init.id')
             ->leftJoin('m_users as creator', 'c.created_by', '=', 'creator.id')
             ->whereIn('c.status', ['in_review', 'revision'])
             ->whereNull('c.deleted_at')
             ->select(DB::raw('COALESCE(init.department_id, creator.department_id) as dept_id'), DB::raw('count(*) as count'))
             ->groupBy('dept_id')
             ->pluck('count', 'dept_id');

         $outgoingCounts = DB::table('t_contracts as c')
             ->leftJoin('m_users as init', 'c.initiated_by_id', '=', 'init.id')
             ->leftJoin('m_users as creator', 'c.created_by', '=', 'creator.id')
             ->whereIn('c.status', ['approved', 'locked', 'archived'])
             ->whereNull('c.deleted_at')
             ->select(DB::raw('COALESCE(init.department_id, creator.department_id) as dept_id'), DB::raw('count(*) as count'))
             ->groupBy('dept_id')
             ->pluck('count', 'dept_id');

         return Department::orderBy('name')
             ->withCount(['users as member_count'])
             ->get()
             ->map(function ($dept) use ($incomingCounts, $outgoingCounts) {
                 return [
                     'department_id' => $dept->id,
                     'department_name' => $dept->name,
                     'incoming_count' => (int) $incomingCounts->get($dept->id, 0),
                     'outgoing_count' => (int) $outgoingCounts->get($dept->id, 0),
                     'member_count' => (int) $dept->member_count,
                 ];
             })
             ->values()
             ->all();
     }
}
