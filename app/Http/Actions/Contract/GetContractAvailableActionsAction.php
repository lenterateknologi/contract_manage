<?php

namespace App\Http\Actions\Contract;

use App\Enums\WorkflowAction;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\WorkflowStep;
use App\Services\Workflow\ContractWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class GetContractAvailableActionsAction
{
    public function __construct(
        protected GetContractRequirementsAction $requirementsAction,
    ) {}

    public function execute(Contract $contract, Request $request): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (! Gate::allows('view', $contract)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $contract->loadMissing([
            'workflow.steps.actions',
            'workflowStep.actions',
            'originWorkflowStep',
            'approvals.workflowStep',
            'assignedPic',
            'vendor',
            'initiator',
            'creator',
        ]);

        $effectiveStep = $contract->workflowStep
            ?: ($contract->workflow_step_id ? WorkflowStep::find($contract->workflow_step_id) : null)
            ?: $contract->workflow?->steps()->orderBy('step')->first();

        $activePendingApproval = $contract->approvals
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        $isSubStepReviewer = (bool) ($activePendingApproval && ($activePendingApproval->sub_step !== null || $activePendingApproval->role === 'Persetujuan Tambahan'));

        $isStepAuthorized = false;
        if ($effectiveStep) {
            $approvers = app(ContractWorkflowService::class)->resolveApproversForStep($contract, $effectiveStep);
            $isStepAuthorized = collect($approvers['approvers'] ?? [])->pluck('id')->contains($user->id);
        }

        $canApprove = (bool) $activePendingApproval || $isStepAuthorized || $user->isAdmin() || ($contract->status === 'in_review' && ! empty($contract->workflow_step_id));

        // 1. Custom Actions
        $customActionsPool = data_get($contract->workflow?->meta, 'custom_actions', [])
            ?: data_get($contract->workflowStep?->workflow?->meta, 'custom_actions', [])
            ?: (! $contract->is_in_sub_workflow ? data_get($contract->originWorkflow?->meta, 'custom_actions', []) : []);

        $hasAssignedPic = ! empty($contract->assigned_pic_id) || ! empty($contract->metadata['assigned_pic_id']);
        $hasSigners = $contract->approvals->contains(fn ($a) => in_array($a->role, ['Pihak 1', 'Pihak 2', 'Penandatangan']));

        $availableCustomActions = [];
        if (! $isSubStepReviewer && is_array($customActionsPool)) {
            foreach ($customActionsPool as $act) {
                if (isset($act['is_active']) && $act['is_active'] === false) continue;
                if (($act['action_code'] ?? '') === 'add_adhoc' && ($effectiveStep?->step_category === 'adhoc_review' || data_get($effectiveStep?->meta, 'is_adhoc_step'))) continue;

                if (($act['scope'] ?? 'all_steps') === 'specific_steps' && ! empty($act['step_ids'])) {
                    $match = in_array((string) $contract->workflow_step_id, array_map('strval', $act['step_ids']))
                        || in_array((string) ($effectiveStep?->step ?? ''), array_map('strval', $act['step_ids']));
                    if (! $match) continue;
                }

                $visCond = $act['visibility_condition'] ?? 'always';
                if ($visCond === 'no_pic' && $hasAssignedPic) continue;
                if ($visCond === 'require_pic' && ! $hasAssignedPic) continue;
                if ($visCond === 'no_signers' && $hasSigners) continue;
                if ($visCond === 'has_signers' && ! $hasSigners) continue;

                $authorities = $act['authorities'] ?? [];
                if (! empty($authorities) && ! $user->isAdmin()) {
                    $userMatches = false;
                    foreach ($authorities as $authItem) {
                        $authType = $authItem['type'] ?? ($authItem['approver_type'] ?? 'role');
                        if ($authType === 'creator' && ($contract->created_by === $user->id || $contract->initiated_by_id === $user->id)) { $userMatches = true; break; }
                        if ($authType === 'assigned_pic' && $contract->assigned_pic_id === $user->id) { $userMatches = true; break; }
                        if ($authType === 'role' && strcasecmp((string) $user->role, (string) ($authItem['role_name'] ?? $authItem['role'] ?? '')) === 0) { $userMatches = true; break; }
                        if ($authType === 'user' && ! empty($authItem['user_id']) && $authItem['user_id'] === $user->id) { $userMatches = true; break; }
                    }
                    if (! $userMatches) continue;
                }

                $availableCustomActions[] = [
                    'id' => $act['id'] ?? null,
                    'action_code' => $act['action_code'] ?? 'custom',
                    'alias' => $act['alias'] ?? ($act['name'] ?? 'Aksi Kustom'),
                    'target_status' => $act['target_status'] ?? null,
                    'unlocks_other_actions' => false,
                    'execution_type' => $act['execution_type'] ?? 'direct',
                    'description' => $act['description'] ?? null,
                    'is_custom_action' => true,
                ];
            }
        }

        // 2. Step Actions
        $applicableStepActions = [];
        $rawActions = $effectiveStep?->actions ?? collect();
        $allStatuses = ContractStatus::all()->keyBy('code');

        foreach ($rawActions as $act) {
            $actCode = $act->action_code instanceof WorkflowAction ? $act->action_code->value : ($act->action_code ?? 'approve');
            $statusModel = isset($allStatuses[$act->target_status]) ? $allStatuses[$act->target_status] : null;

            $applicableStepActions[] = [
                'id' => $act->id,
                'action_code' => $actCode,
                'alias' => $act->alias ?: ucwords(str_replace('_', ' ', (string) $actCode)),
                'target_status' => $act->target_status,
                'target_status_label' => $statusModel?->label ?: $act->target_status,
                'target_status_color' => $statusModel?->color,
                'target_status_bg_color' => $statusModel?->bg_color,
                'is_locked' => false,
                'lock_reason' => null,
                'required_fields' => $act->required_fields ?? [],
                'description' => $act->description,
                'is_custom_action' => false,
            ];
        }

        // Fallback default actions if step actions are not configured
        if (empty($applicableStepActions) && $canApprove) {
            $applicableStepActions = [
                [
                    'id' => 'default_approve',
                    'action_code' => 'approve',
                    'alias' => 'Setujui',
                    'target_status' => 'approved',
                    'target_status_label' => 'Disetujui',
                    'target_status_color' => '#10b981',
                    'target_status_bg_color' => '#ecfdf5',
                    'is_locked' => false,
                    'lock_reason' => null,
                    'required_fields' => [],
                    'description' => null,
                    'is_custom_action' => false,
                ],
                [
                    'id' => 'default_reject',
                    'action_code' => 'reject',
                    'alias' => 'Tolak',
                    'target_status' => 'rejected',
                    'target_status_label' => 'Ditolak',
                    'target_status_color' => '#ef4444',
                    'target_status_bg_color' => '#fef2f2',
                    'is_locked' => false,
                    'lock_reason' => null,
                    'required_fields' => [],
                    'description' => null,
                    'is_custom_action' => false,
                ],
            ];
        }

        // 3. Step Requirements
        $reqResponse = $this->requirementsAction->execute($contract, $request);
        $reqData = $reqResponse->getData(true);

        return response()->json([
            'success' => true,
            'message' => 'Contract available actions retrieved successfully',
            'data' => [
                'has_access' => true,
                'contract_id' => $contract->id,
                'contract_title' => $contract->title,
                'contract_status' => $contract->status,
                'can_approve' => $canApprove,
                'pending_approval_id' => $activePendingApproval?->id,
                'current_step' => $effectiveStep ? [
                    'id' => $effectiveStep->id,
                    'step' => $effectiveStep->step,
                    'name' => $effectiveStep->name,
                    'approver_type' => $effectiveStep->approver_type,
                    'is_sub_step_reviewer' => $isSubStepReviewer,
                ] : null,
                'is_step_action_locked' => false,
                'lock_reason' => null,
                'step_actions' => $applicableStepActions,
                'custom_actions' => $availableCustomActions,
                'requirements_summary' => $reqData['data']['summary'] ?? null,
                'requirements' => $reqData['data']['requirements'] ?? [],
            ],
            'errors' => null,
        ]);
    }
}
