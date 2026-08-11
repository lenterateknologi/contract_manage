<?php

namespace App\Http\Queries\Master;

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
                'contractType:id,name',
                'initiatorAuthorities.role:id,name',
                'initiatorAuthorities.department:id,name',
                'initiatorAuthorities.division:id,name',
                'initiatorAuthorities.user:id,name',
                'initiatorAuthorities.companyGroup:id,name',
                'initiatorAuthorities.region:id,name',
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
            });
    }

    /**
     * Get a workflow by ID with all relations for editing.
     */
    public function findForEdit(string $id): Workflow
    {
        return Workflow::with([
            'contractType',
            'steps.approverAuthorities.role',
            'steps.approverAuthorities.department',
            'steps.approverAuthorities.division',
            'steps.approverAuthorities.companyGroup',
            'steps.approverAuthorities.company',
            'steps.approverAuthorities.region',
            'steps.actions.additionalAuthorities',
            'initiatorAuthorities.role',
            'initiatorAuthorities.department',
            'initiatorAuthorities.division',
            'initiatorAuthorities.companyGroup',
            'initiatorAuthorities.company',
            'initiatorAuthorities.region',
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
