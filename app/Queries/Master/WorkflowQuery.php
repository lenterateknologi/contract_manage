<?php

namespace App\Queries\Master;

use App\Models\Workflow;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkflowQuery
{
    /**
     * Build the query for workflows with filters.
     */
    public function list(Request $request): Builder
    {
        return Workflow::query()
            ->withCount('steps')
            ->with([
                'contractType',
                'steps.approverRoles',
                'steps.approverDepartments',
                'steps.approverUsers',
                'initiatorRolesData',
                'initiatorDepartmentsData',
                'initiatorUsersData',
            ])
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(description)'), 'like', "%{$search}%");
                });
            })
            ->when($request->contract_type_id, function ($q, $type) {
                $q->whereIn('contract_type_id', (array) $type);
            })
            ->when($request->company_group_id, function ($q, $id) {
                $q->whereJsonContains('company_group_ids', $id);
            })
            ->when($request->region_id, function ($q, $id) {
                $q->whereJsonContains('region_ids', $id);
            })
            ->when($request->company_id, function ($q, $id) {
                $q->whereJsonContains('company_ids', $id);
            });
    }

    /**
     * Get a workflow by ID with all relations for editing.
     */
    public function findForEdit(string $id): Workflow
    {
        return Workflow::with([
            'steps.approverRoles',
            'steps.approverDepartments',
            'steps.approverUsers',
            'steps.actions',
            'initiatorRolesData',
            'initiatorDepartmentsData',
            'initiatorUsersData',
        ])->findOrFail($id);
    }

    /**
     * Get all workflows for dropdowns.
     */
    public function options(): Builder
    {
        return Workflow::query()
            ->with(['steps', 'contractType'])
            ->orderBy('name');
    }
}
