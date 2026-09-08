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
                'initiatorAuthorities.user:id,name,role_id',
                'initiatorAuthorities.companyGroup:id,name',
                'initiatorAuthorities.region:id,name',
                'steps.actions',
                'steps.approverAuthorities.role:id,name',
                'steps.approverAuthorities.division:id,name',
                'steps.approverAuthorities.department:id,name',
                'steps.approverAuthorities.user:id,name,role_id',
            ])
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(DB::raw('LOWER(description)'), 'like', "%{$search}%");
                });
            })
            ->when($request->workflow_type, function ($q, $type) {
                $types = is_array($type) ? $type : [$type];
                $types = array_filter($types, fn ($t) => $t !== 'all' && $t !== '' && $t !== null);
                if (! empty($types)) {
                    $q->whereIn('workflow_type', $types);
                }
            })
            ->when($request->contract_type_id, function ($q, $typeId) {
                $ids = is_array($typeId) ? $typeId : [$typeId];
                $ids = array_filter($ids, fn ($id) => $id !== 'all' && $id !== '' && $id !== null);
                if (! empty($ids)) {
                    $q->where(function ($qq) use ($ids) {
                        $qq->whereIn('contract_type_id', $ids);
                        foreach ($ids as $id) {
                            $qq->orWhereJsonContains('meta->contract_type_ids', $id);
                        }
                    });
                }
            })
            ->when($request->filled('is_default'), function ($q) use ($request) {
                $vals = is_array($request->is_default) ? $request->is_default : [$request->is_default];
                $vals = array_filter($vals, fn ($v) => $v !== 'all' && $v !== '' && $v !== null);
                if (! empty($vals)) {
                    $bools = array_map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN), $vals);
                    $q->whereIn('is_default', $bools);
                }
            })
            ->when($request->has('is_selectable'), function ($q) use ($request) {
                if ($request->filled('is_selectable')) {
                    $vals = is_array($request->is_selectable) ? $request->is_selectable : [$request->is_selectable];
                    $vals = array_filter($vals, fn ($v) => $v !== 'all' && $v !== '' && $v !== null);
                    if (! empty($vals)) {
                        $bools = array_map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN), $vals);
                        $q->whereIn('is_selectable', $bools);
                    }
                }
            }, function ($q) {
                $q->where('is_selectable', true);
            })
            ->when($request->has('is_active'), function ($q) use ($request) {
                if ($request->filled('is_active')) {
                    $vals = is_array($request->is_active) ? $request->is_active : [$request->is_active];
                    $vals = array_filter($vals, fn ($v) => $v !== 'all' && $v !== '' && $v !== null);
                    if (! empty($vals)) {
                        $bools = array_map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN), $vals);
                        $q->whereIn('is_active', $bools);
                    }
                }
            }, function ($q) {
                $q->where('is_active', true);
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
            ->with(['steps.actions', 'contractType'])
            ->orderBy('name');
    }
}
