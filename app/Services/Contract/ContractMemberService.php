<?php

namespace App\Services\Contract;

use App\Http\Formatters\UserFormatter;
use App\Models\Master\User;
use App\Models\Transaction\Contract;

class ContractMemberService
{
    /**
     * Get all involved members/personnel for a specific contract with their respective workflow roles.
     * When $type === 'team', return members belonging to the same Organization Group as $currentUser.
     */
    public function getContractMembers(Contract $contract, ?string $type = null, ?User $currentUser = null): array
    {
        $contract->loadMissing([
            'initiator.department', 'initiator.company',
            'creator.department', 'creator.company',
            'assignedPic.department', 'assignedPic.company',
            'assignedBy.department', 'assignedBy.company',
            'approvals.approver.department', 'approvals.approver.company',
            'workflowStep',
        ]);

        $membersMap = [];

        $addMember = function (?User $user, string $role) use (&$membersMap) {
            if (! $user) {
                return;
            }

            $userId = (string) $user->id;
            if (! isset($membersMap[$userId])) {
                $membersMap[$userId] = [
                    'user' => UserFormatter::format($user),
                    'roles' => [],
                ];
            }

            if (! in_array($role, $membersMap[$userId]['roles'], true)) {
                $membersMap[$userId]['roles'][] = $role;
            }
        };

        // 1. Creator
        $addMember($contract->creator, 'Pembuat Dokumen');

        // 2. Initiator
        $addMember($contract->initiator, 'Inisiator Pengaju');

        // 3. Approvers (from timeline)
        if ($contract->relationLoaded('approvals') && $contract->approvals) {
            foreach ($contract->approvals as $approval) {
                if ($approval->approver) {
                    $isCurrentStep = (int) ($contract->workflowStep?->step ?? 0) === (int) $approval->sequence;
                    $hasActed = $approval->status !== 'pending';

                    if ($hasActed || $isCurrentStep) {
                        $addMember($approval->approver, "Penyetuju (Tahap {$approval->sequence})");
                    }
                }
            }
        }

        // 4. Assigned PIC
        if ($contract->assignedPic) {
            $addMember($contract->assignedPic, 'PIC (Petugas Ditugaskan)');
        }

        // 5. Assigned By (Manager)
        if ($contract->assignedBy) {
            $addMember($contract->assignedBy, 'Manager (Pemberi Tugas)');
        }

        // If type is 'team', return members matching user login's Organization Group
        if ($type === 'team' && $currentUser) {
            $currentUser->loadMissing(['department.organizationGroup']);
            $userOrgGroupId = $currentUser->department?->organizationGroup?->id;
            $userOrgName = $currentUser->org_name ?: $currentUser->department?->name;

            // Query users in the same organization group or department
            $teamUsers = User::query()
                ->where('is_active', true)
                ->where(function ($q) use ($userOrgGroupId, $userOrgName, $currentUser) {
                    if ($userOrgGroupId) {
                        $q->whereHas('department.organizationGroup', function ($sq) use ($userOrgGroupId) {
                            $sq->where('id', $userOrgGroupId);
                        });
                    }
                    if ($userOrgName) {
                        $q->orWhere('org_name', $userOrgName);
                    }
                    if ($currentUser->department_id) {
                        $q->orWhere('department_id', $currentUser->department_id);
                    }
                })
                ->with(['department', 'company'])
                ->get();

            $teamMap = [];
            foreach ($teamUsers as $u) {
                $uid = (string) $u->id;
                // If this user already has specific contract roles (e.g. Inisiator, PIC, Approver), keep them
                $roles = isset($membersMap[$uid]) ? $membersMap[$uid]['roles'] : ['Tim Internal'];
                $teamMap[$uid] = [
                    'user' => UserFormatter::format($u),
                    'roles' => $roles,
                ];
            }

            return array_values($teamMap);
        }

        return array_values($membersMap);
    }
}
