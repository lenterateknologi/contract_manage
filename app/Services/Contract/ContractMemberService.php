<?php

namespace App\Services\Contract;

use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\User;

class ContractMemberService
{
    /**
     * Get all involved members/personnel for a specific contract with their respective workflow roles.
     */
    public function getContractMembers(Contract $contract): array
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
                    'user' => ContractFormatter::formatUser($user),
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

        return array_values($membersMap);
    }
}
