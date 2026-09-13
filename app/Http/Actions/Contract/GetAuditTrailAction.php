<?php

namespace App\Http\Actions\Contract;

use App\Models\Contract;
use App\Models\ContractStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetAuditTrailAction
{
    public function execute(Contract $contract, Request $request): JsonResponse
    {
        $contract->loadMissing(['workflow.steps.actions']);

        $query = $contract->histories()->with('actor')->orderBy('created_at', 'asc')->orderBy('id', 'asc');

        if ($request->action) {
            $query->where('action', $request->action);
        }
        if ($request->actor_id) {
            $query->where('actor_id', $request->actor_id);
        }
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->search) {
            $query->where('description', 'like', '%'.$request->search.'%');
        }

        $allStatuses = ContractStatus::all()->keyBy('code');
        $allStepActions = $contract->workflow?->steps?->flatMap->actions ?? collect();

        return response()->json($query->get()->map(function ($h) use ($allStatuses, $allStepActions) {
            $desc = $h->description ?? '';
            $action = $h->action ?? '';

            // 1. Try to extract action alias from description (e.g. "Setujui Pengajuan pada [Step 1]...")
            $customLabel = null;
            if (preg_match('/^([^\n]+?)(?:\s+pada\s+\[|\s+oleh\s+:?)/iu', $desc, $matches)) {
                $candidate = trim($matches[1]);
                if (mb_strlen($candidate) <= 35) {
                    $customLabel = $candidate;
                }
            }

            $matchedAction = $allStepActions->first(function ($act) use ($action, $customLabel) {
                if ($customLabel && strcasecmp($act->alias ?? '', $customLabel) === 0) return true;
                $actCode = $act->action_code instanceof \App\Enums\WorkflowAction ? $act->action_code->value : ($act->action_code ?? '');
                if (!empty($actCode) && strcasecmp((string)$actCode, $action) === 0) return true;
                return false;
            });

            // 3. Resolve status or target_status from master data
            $targetStatusCode = $matchedAction?->target_status;
            $statusModel = ($targetStatusCode && isset($allStatuses[$targetStatusCode])) 
                ? $allStatuses[$targetStatusCode] 
                : ($allStatuses->get(strtolower($action)) ?: null);

            // Fallback icon and color based on standard semantic themes if statusModel doesn't have them
            $historyEnum = \App\Enums\ContractHistoryAction::tryFrom($action);
            $historyLabel = $historyEnum ? $historyEnum->label() : null;

            $label = $customLabel 
                ?: ($matchedAction?->alias 
                    ?: ($statusModel?->label 
                        ?: ($historyLabel 
                            ?: ucwords(str_replace('_', ' ', strtolower($action))))));

            $color = $statusModel?->color;
            $bgColor = $statusModel?->bg_color;
            $icon = $statusModel?->icon;

            if (!$color) {
                $actLower = strtolower($action);
                if (str_contains($actLower, 'approved') || str_contains($actLower, 'completed')) {
                    $color = '#10b981';
                    $icon = $icon ?: 'Check';
                } elseif (str_contains($actLower, 'reject')) {
                    $color = '#ef4444';
                    $icon = $icon ?: 'X';
                } elseif (str_contains($actLower, 'branch') || str_contains($actLower, 'workflow')) {
                    $color = '#0284c7';
                    $icon = $icon ?: 'GitBranch';
                } elseif (str_contains($actLower, 'assign')) {
                    $color = '#8b5cf6';
                    $icon = $icon ?: 'UserCheck';
                } elseif (str_contains($actLower, 'form') || str_contains($actLower, 'submit')) {
                    $color = '#0d9488';
                    $icon = $icon ?: 'FileText';
                } else {
                    $color = '#64748b';
                    $icon = $icon ?: 'Clock';
                }
            }

            return [
                'id' => $h->id,
                'action' => $h->action,
                'description' => $h->description,
                'actor' => $h->actor ? [
                    'id' => $h->actor->id,
                    'name' => $h->actor->name,
                ] : null,
                'created_at' => $h->created_at->format('d/m/Y H:i'),
                'created_at_iso' => $h->created_at->toIso8601String(),
                'badge_label' => mb_strtoupper($label),
                'color' => $color,
                'bg_color' => $bgColor,
                'icon' => $icon ?: 'FileText',
            ];
        }));
    }
}

