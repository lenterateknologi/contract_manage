<?php

namespace App\Queries\Workflow;

use App\Models\Workflow;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkflowListQuery
{
    /**
     * Build the filtered workflows query.
     */
    public function build(Request $request): Builder
    {
        return Workflow::withCount('steps')
            ->with([
                'contractType',
                'steps.approverRoles',
                'steps.approverDepartments',
                'steps.approverUsers',
                'initiatorRolesData',
                'initiatorDepartmentsData',
                'initiatorUsersData',
            ])
            ->when($request->search, function (Builder $q, string $search): void {
                $search = strtolower($search);
                $q->where(function (Builder $qq) use ($search): void {
                    $qq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(description)'), 'like', "%{$search}%");
                });
            })
            ->when($request->contract_type_id, function (Builder $q, mixed $type): void {
                $q->whereIn('contract_type_id', (array) $type);
            })
            ->when($request->company_group_id, function (Builder $q, string $id): void {
                $q->whereJsonContains('company_group_ids', $id);
            })
            ->when($request->region_id, function (Builder $q, string $id): void {
                $q->whereJsonContains('region_ids', $id);
            })
            ->when($request->company_id, function (Builder $q, string $id): void {
                $q->whereJsonContains('company_ids', $id);
            });
    }
}
