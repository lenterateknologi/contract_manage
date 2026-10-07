<?php

namespace App\Http\Actions\Contract;

use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\WorkflowStep;
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
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Token otentikasi diperlukan.',
                'data' => null,
                'errors' => ['auth' => 'Unauthenticated'],
            ], 401);
        }

        if (! Gate::allows('view', $contract)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki otoritas untuk melihat aksi pada pengajuan kontrak ini.',
                'data' => null,
                'errors' => ['forbidden' => 'Unauthorized access to contract actions'],
            ], 403);
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

        $activePendingApproval = $contract->approvals
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        $isSubStepReviewer = $activePendingApproval && ($activePendingApproval->sub_step !== null || $activePendingApproval->role === 'Persetujuan Tambahan');

        // ponytail: canApprove is true if user has pending approval, is admin, or contract is in an active review step
        $canApprove = (bool) $activePendingApproval || $user->isAdmin() || ($contract->status === 'in_review' && ! empty($contract->workflow_step_id));

        $effectiveStep = $contract->workflowStep;
        if (! $effectiveStep && $contract->workflow_step_id) {
            $effectiveStep = WorkflowStep::find($contract->workflow_step_id);
        }
        if (! $effectiveStep && $contract->workflow) {
            $effectiveStep = $contract->workflow->steps()->orderBy('step')->first();
        }

        // 1. Evaluate Custom Actions from Workflow Meta
        $customActionsPool = data_get($contract->workflow?->meta, 'custom_actions', [])
            ?: data_get($contract->workflowStep?->workflow?->meta, 'custom_actions', [])
            ?: (! $contract->is_in_sub_workflow ? data_get($contract->originWorkflow?->meta, 'custom_actions', []) : []);

        $hasAssignedPic = ! empty($contract->assigned_pic_id) || ! empty($contract->metadata['assigned_pic_id']);
        $hasSigners = $contract->approvals->contains(fn ($a) => in_array($a->role, ['Pihak 1', 'Pihak 2', 'Penandatangan']));

        $availableCustomActions = [];
        if (! $isSubStepReviewer && is_array($customActionsPool)) {
            foreach ($customActionsPool as $act) {
                if (isset($act['is_active']) && $act['is_active'] === false) {
                    continue;
                }

                // Prevent nested ad-hoc on ad-hoc review steps
                if (($act['action_code'] ?? '') === 'add_adhoc' && ($effectiveStep?->step_category === 'adhoc_review' || data_get($effectiveStep?->meta, 'is_adhoc_step'))) {
                    continue;
                }

                // Step scope check
                if (($act['scope'] ?? 'all_steps') === 'specific_steps' && ! empty($act['step_ids'])) {
                    $matchStep = in_array((string) $contract->workflow_step_id, array_map('strval', $act['step_ids']))
                        || in_array((string) ($effectiveStep?->step ?? ''), array_map('strval', $act['step_ids']));
                    if (! $matchStep) {
                        continue;
                    }
                }

                // Smart visibility condition
                $visCond = $act['visibility_condition'] ?? 'always';
                if ($visCond === 'no_pic' && $hasAssignedPic) continue;
                if ($visCond === 'require_pic' && ! $hasAssignedPic) continue;
                if ($visCond === 'no_signers' && $hasSigners) continue;
                if ($visCond === 'has_signers' && ! $hasSigners) continue;

                // Authority check for custom action
                $authorities = $act['authorities'] ?? [];
                if (! empty($authorities)) {
                    $userMatches = false;
                    foreach ($authorities as $authItem) {
                        $authType = $authItem['type'] ?? ($authItem['approver_type'] ?? 'role');
                        if ($authType === 'creator' && ($contract->created_by === $user->id || $contract->initiated_by_id === $user->id)) {
                            $userMatches = true;
                            break;
                        }
                        if ($authType === 'assigned_pic' && $contract->assigned_pic_id === $user->id) {
                            $userMatches = true;
                            break;
                        }
                        if ($authType === 'role' && (! empty($authItem['role']) || ! empty($authItem['role_name']))) {
                            $roleName = $authItem['role_name'] ?? $authItem['role'] ?? '';
                            if (strcasecmp((string) $user->role, (string) $roleName) === 0) {
                                $userMatches = true;
                                break;
                            }
                        }
                        if ($authType === 'user' && ! empty($authItem['user_id']) && $authItem['user_id'] === $user->id) {
                            $userMatches = true;
                            break;
                        }
                    }

                    if (! $userMatches && ! $user->isAdmin()) {
                        continue;
                    }
                }

                $availableCustomActions[] = [
                    'id' => $act['id'] ?? null,
                    'action_code' => $act['action_code'] ?? 'custom',
                    'alias' => $act['alias'] ?? ($act['name'] ?? 'Aksi Kustom'),
                    'target_status' => $act['target_status'] ?? null,
                    'unlocks_other_actions' => (bool) ($act['unlocks_other_actions'] ?? false),
                    'execution_type' => $act['execution_type'] ?? 'direct',
                    'description' => $act['description'] ?? null,
                    'is_custom_action' => true,
                ];
            }
        }

        // 2. Check if Step Actions are Locked
        $isStepActionLocked = collect($availableCustomActions)->contains(fn ($act) => ! empty($act['unlocks_other_actions']));
        $lockReason = $isStepActionLocked
            ? 'Aksi persetujuan utama terkunci sementara hingga aksi prasyarat (seperti Penugasan PIC) diselesaikan.'
            : null;

        // 3. Evaluate Step Actions
        $applicableStepActions = [];
        $rawActions = $effectiveStep?->actions ?? collect();

        $allStatuses = ContractStatus::all()->keyBy('code');

        foreach ($rawActions as $act) {
            $actCode = $act->action_code instanceof \App\Enums\WorkflowAction ? $act->action_code->value : ($act->action_code ?? '');
            $targetStatusModel = isset($allStatuses[$act->target_status]) ? $allStatuses[$act->target_status] : null;

            $applicableStepActions[] = [
                'id' => $act->id,
                'action_code' => $actCode,
                'alias' => $act->alias ?: ucwords(str_replace('_', ' ', (string) $actCode)),
                'target_status' => $act->target_status,
                'target_status_label' => $targetStatusModel?->label ?: $act->target_status,
                'target_status_color' => $targetStatusModel?->color,
                'target_status_bg_color' => $targetStatusModel?->bg_color,
                'is_locked' => $isStepActionLocked,
                'lock_reason' => $lockReason,
                'required_fields' => $act->required_fields ?? [],
                'description' => $act->description,
                'is_custom_action' => false,
            ];
        }

        // 4. Evaluate Step Requirements
        $reqResponse = $this->requirementsAction->execute($contract, $request);
        $reqData = $reqResponse->getData(true);
        $requirementsSummary = $reqData['data']['summary'] ?? null;
        $requirementsList = $reqData['data']['requirements'] ?? [];

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
                'is_step_action_locked' => $isStepActionLocked,
                'lock_reason' => $lockReason,
                'step_actions' => $applicableStepActions,
                'custom_actions' => $availableCustomActions,
                'requirements_summary' => $requirementsSummary,
                'requirements' => $requirementsList,
            ],
            'errors' => null,
        ]);
    }
}
