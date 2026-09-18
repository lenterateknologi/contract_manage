<?php

namespace App\Http\Formatters;

use App\Enums\WorkflowAction;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use Illuminate\Support\Facades\Cache;

class WorkflowStepFormatter
{
    /**
     * Format a WorkflowStep for API output.
     */
    public static function formatStep(?WorkflowStep $step, ?Contract $c = null): ?array
    {
        if (! $step) {
            return null;
        }

        $targetApprovers = null;
        if ($c) {
            $targetApprovers = $c->approvals
                ->where('sequence', $step->step)
                ->whereIn('status', ['pending', 'waiting'])
                ->first()?->target_approvers;
        }

        return [
            'id' => $step->id,
            'name' => $step->name,
            'step' => $step->step,
            'role' => is_array($step->role) ? implode(', ', $step->role) : $step->role,
            'approver_type' => $step->approver_type,
            'description' => $step->description,
            'step_type' => 'APPROVAL',
            'step_category' => $step->step_category,
            'meta' => $step->meta ?? [],
            'approver_authorities' => $step->relationLoaded('approverAuthorities') ? $step->approverAuthorities->map(fn ($auth) => [
                'id' => $auth->id,
                'authority_type' => $auth->authority_type,
                'user_id' => $auth->user_id,
                'role_id' => $auth->role_id,
                'department_id' => $auth->department_id,
                'division_id' => $auth->division_id,
            ])->toArray() : [],
            'target_approvers' => $targetApprovers,
            'actions' => self::formatStepActions($step, $c),
        ];
    }

    /**
     * Format actions of a workflow step with dynamic target status info.
     */
    public static function formatStepActions(WorkflowStep $step, ?Contract $c = null): array
    {
        $statusMap = Cache::remember('master_status_code_map', now()->addMinutes(10), function () {
            return ContractStatus::select('id', 'code', 'label', 'color', 'bg_color', 'icon')
                ->get()
                ->keyBy('code');
        });

        $actions = $step->relationLoaded('actions')
            ? $step->actions
            : $step->actions()->get();

        return $actions->sortBy(fn ($action) => (int) data_get($action->transition_config, 'order', 999))
            ->values()
            ->map(function ($action) use ($statusMap, $c, $step) {
                /* @var WorkflowStepAction $action */
                $code = $action->action_code instanceof WorkflowAction ? $action->action_code->value : $action->action_code;
                $effectiveStatus = $action->target_status ?: data_get($step->meta, 'target_status');
                $targetStatusObj = $effectiveStatus ? ($statusMap[$effectiveStatus] ?? null) : null;

                return [
                    'id' => $action->id,
                    'action_code' => $code,
                    'master_action_code' => $code,
                    'alias' => $action->alias,
                    'target_status' => $action->target_status,
                    'target_status_info' => $targetStatusObj ? [
                        'code' => $targetStatusObj->code,
                        'label' => $targetStatusObj->label,
                        'color' => $targetStatusObj->color,
                        'bg_color' => $targetStatusObj->bg_color,
                        'icon' => $targetStatusObj->icon,
                    ] : null,
                    'next_workflow_id' => $action->next_workflow_id,
                    'next_workflow_step_id' => $action->next_workflow_step_id,
                    'next_step_id' => $action->next_step_id,
                    'assignee_config' => $action->assignee_config,
                    'transition_config' => $action->transition_config,
                    'required_fields' => $action->required_fields,
                    'autofilled_fields' => $action->autofilled_fields,
                    'signing_parties' => $action->signing_parties,
                    'is_visible' => (bool) ($action->is_visible ?? true),
                ];
            })->toArray();
    }
}
