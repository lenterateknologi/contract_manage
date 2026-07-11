<?php

namespace App\Http\Queries\Workflow;

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
                'steps.approverAuthorities',
                'initiatorAuthorities',
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
            });
    }
}
