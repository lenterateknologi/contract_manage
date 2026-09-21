<?php

namespace App\Services\Workflow;

use App\Models\Approval;
use App\Models\Authority;
use App\Models\Contract;
use App\Models\ContractSlaConfig;
use App\Models\User;
use Illuminate\Support\Collection;

class SlaNotificationRecipientResolver
{
    /**
     * Resolve all recipient users who should receive SLA overdue or warning notification for a given contract.
     *
     * @param Contract $contract
     * @param Approval|null $approval
     * @param string $alertType 'overdue' or 'warning'
     * @return Collection<int, User>
     */
    public function resolveRecipients(Contract $contract, ?Approval $approval = null, string $alertType = 'overdue'): Collection
    {
        $contract->loadMissing([
            'initiator.department',
            'initiator.division',
            'initiator.company.companyGroup',
            'initiator.company.region',
            'creator.department',
            'creator.division',
            'creator.company',
            'contractType',
        ]);

        $recipients = collect();

        // 1. Fetch active authority rules for SLA Overdue notification
        $slaConfigId = $contract->sla_config_id;
        $rules = Authority::where('context_type', Authority::CONTEXT_SLA_OVERDUE)
            ->where('is_active', true)
            ->where(function ($q) use ($slaConfigId, $contract) {
                // Rule matching specific SLA config, specific workflow, or global (context_id is null)
                $q->whereNull('context_id');
                if ($slaConfigId) {
                    $q->orWhere('context_id', $slaConfigId);
                }
                if ($contract->workflow_id) {
                    $q->orWhere('context_id', $contract->workflow_id);
                }
            })
            ->orderBy('sequence')
            ->get();

        // 2. If no custom authority rules are defined, provide standard defaults:
        // Current pending approver(s), contract initiator, and initiator supervisor
        if ($rules->isEmpty()) {
            if ($approval && $approval->approver) {
                $recipients->push($approval->approver);
            } else {
                $pendingApprovers = Approval::where('contract_id', $contract->id)
                    ->where('status', 'pending')
                    ->with('approver')
                    ->get()
                    ->pluck('approver')
                    ->filter();
                $recipients = $recipients->merge($pendingApprovers);
            }

            if ($contract->initiator) {
                $recipients->push($contract->initiator);
                if ($contract->initiator->supervisor) {
                    $recipients->push($contract->initiator->supervisor);
                }
            }

            return $recipients->filter(fn ($u) => ! empty($u->email))->unique('id')->values();
        }

        // 3. Process authority rules
        foreach ($rules as $rule) {
            // A. Specific User
            if ($rule->user_id) {
                $user = User::find($rule->user_id);
                if ($user && $user->is_used) {
                    $recipients->push($user);
                }
                continue;
            }

            // B. Custom dynamic actors
            if ($rule->authority_type === 'custom' || $rule->role_use_initiator) {
                if ($contract->initiator) {
                    $recipients->push($contract->initiator);
                    if ($contract->initiator->supervisor) {
                        $recipients->push($contract->initiator->supervisor);
                    }
                }
            }

            // C. Current Step Approver dynamic role
            if ($rule->authority_type === 'current_assignee' || $rule->description === 'current_assignee') {
                $currentApprovers = Approval::where('contract_id', $contract->id)
                    ->where('status', 'pending')
                    ->with('approver')
                    ->get()
                    ->pluck('approver')
                    ->filter();
                $recipients = $recipients->merge($currentApprovers);
            }

            // D. Query-based group matching
            $query = User::where('is_used', true);
            $hasFilter = false;

            if ($rule->role_id) {
                $query->where('role_id', $rule->role_id);
                $hasFilter = true;
            }

            if ($rule->job_level_id) {
                $query->where('job_level_id', $rule->job_level_id);
                $hasFilter = true;
            }

            if ($rule->job_position_id) {
                $query->where('job_position_id', $rule->job_position_id);
                $hasFilter = true;
            }

            // Initiator-bound filters
            $deptId = $rule->department_use_initiator ? $contract->initiator?->department_id : $rule->department_id;
            if ($deptId) {
                $query->where('department_id', $deptId);
                $hasFilter = true;
            }

            $divId = $rule->division_use_initiator ? ($contract->initiator?->division_id ?: data_get($contract->initiator, 'department.division_id')) : $rule->division_id;
            if ($divId) {
                $query->where('division_id', $divId);
                $hasFilter = true;
            }

            $compGroupId = $rule->company_group_use_initiator ? ($contract->initiator?->company_group_id ?: data_get($contract->initiator, 'company.company_group_id')) : $rule->company_group_id;
            if ($compGroupId) {
                $query->where('company_group_id', $compGroupId);
                $hasFilter = true;
            }

            $compId = $rule->company_use_initiator ? $contract->initiator?->company_id : $rule->company_id;
            if ($compId) {
                $query->where('company_id', $compId);
                $hasFilter = true;
            }

            $regId = $rule->region_use_initiator ? ($contract->initiator?->region_id ?: data_get($contract->initiator, 'company.region_id')) : $rule->region_id;
            if ($regId) {
                $query->where('region_id', $regId);
                $hasFilter = true;
            }

            $orgGroupId = $rule->organization_group_use_initiator ? (data_get($contract->initiator, 'department.idorg_group') ?: data_get($contract->initiator, 'organization_group_id')) : $rule->organization_group_id;
            if ($orgGroupId) {
                $query->whereHas('department', function ($dq) use ($orgGroupId) {
                    $dq->where('idorg_group', $orgGroupId)
                        ->orWhere('org_group_name', $orgGroupId)
                        ->orWhere('organization_group_id', $orgGroupId);
                });
                $hasFilter = true;
            }

            if ($hasFilter) {
                $matchedUsers = $query->get();
                $recipients = $recipients->merge($matchedUsers);
            }
        }

        // Always also include the current pending approver if they exist
        if ($approval && $approval->approver) {
            $recipients->push($approval->approver);
        }

        return $recipients->filter(fn ($u) => ! empty($u->email))->unique('id')->values();
    }
}
