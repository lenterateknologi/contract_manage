<?php

namespace App\Services\Workflow;

use App\Enums\WorkflowAction;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractStatus;
use App\Models\ContractVersion;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Models\WorkflowStepAction;
use App\Services\Workflow\Concerns\EvaluatesWorkflowSteps;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ContractWorkflowService
{
    use EvaluatesWorkflowSteps;

    public function __construct(
        protected SLAService $slaService,
        protected WorkflowQueryService $queryService
    ) {}

    public function getQueryService(): WorkflowQueryService
    {
        return $this->queryService;
    }

    /**
     * Send a contract for approval by initiating its workflow.
     */
    public function sendForApproval(Contract $contract, ?string $workflowId = null, ?array $options = [], bool $submit = false): Contract
    {
        $metadata = $options ?: [];
        $topic = $metadata['topic'] ?? ($contract->metadata['topic'] ?? 'perjanjian');
        $now = now();

        $workflow = null;
        if ($workflowId) {
            $workflow = Workflow::find($workflowId);
        }

        if (! $workflow) {
            $taxRequired = (bool) ($metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false));
            $typeStr = $contract->contract_type_id ?: ($contract->contractType->code ?? 'General');

            // 1. Try specific match
            $workflow = Workflow::getDefaultByContractType($typeStr, $taxRequired);

            // 2. Fallback: Try any default workflow regardless of tax if specific fails
            if (! $workflow) {
                $workflow = Workflow::where('is_active', true)
                    ->where('is_default', true)
                    ->first();
            }

            // 3. Last Resort: Just take any active workflow
            if (! $workflow) {
                $workflow = Workflow::where('is_active', true)->first();
            }
        }

        if (! $workflow) {
            throw new \Exception('Alur kerja tidak ditemukan dan tidak ada alur default untuk tipe kontrak ini.');
        }

        $workflow->loadMissing('steps');

        $draftingHours = $workflow->sla_drafting_hours ?: 72;
        $totalHours = $workflow->sla_total_hours ?: 240;
        $cutoffHour = $workflow->sla_cutoff_hour ?: 16;

        $draftingDeadline = $this->slaService->calculateBusinessDeadline($now, $draftingHours, $cutoffHour);
        $totalDeadline = null;
        if (strtolower($topic) !== 'review') {
            $totalDeadline = $this->slaService->calculateBusinessDeadline($now, $totalHours, $cutoffHour);
        }

        $metadata = array_merge($contract->metadata ?? [], $metadata, [
            'tax_required' => $metadata['tax_required'] ?? ($contract->metadata['tax_required'] ?? false),
            'topic' => $topic,
            'drafting_deadline' => $draftingDeadline->toIso8601String(),
            'total_deadline' => $totalDeadline ? $totalDeadline->toIso8601String() : null,
            'current_phase' => 'drafting',
        ]);

        $contract->update(['metadata' => $metadata]);
        $contract->load(['initiator.department', 'initiator.company', 'creator.department', 'creator.company']);

        $contract->approvals()->delete();

        $firstStep = $workflow->steps()->orderBy('step')->first();

        while ($firstStep instanceof WorkflowStep) {
            if (! $this->shouldExecuteStep($contract, $firstStep)) {
                $firstStep = $this->findNextValidStep($contract, $firstStep);

                continue;
            }

            break;
        }

        if (! $firstStep instanceof WorkflowStep) {
            throw new \Exception('Tidak ada tahapan alur kerja yang valid untuk permintaan ini.');
        }

        $minStepVal = $workflow->steps->min('step') ?? 1;
        $statusStr = ($firstStep->meta && isset($firstStep->meta['target_status']) && ! empty($firstStep->meta['target_status']))
            ? $firstStep->meta['target_status']
            : ($firstStep->step === $minStepVal ? 'draft' : 'in_review');
        $nextStatus = ContractStatus::where('code', $statusStr)->first();

        $updateData = [
            'workflow_id' => $workflow->id,
            'workflow_step_id' => $firstStep->id,
            'status' => $nextStatus?->code ?: $statusStr,
            'submitted_at' => $firstStep->step === $minStepVal ? $contract->submitted_at : now(),
        ];

        if (empty($contract->origin_workflow_id)) {
            $updateData['origin_workflow_id'] = $workflow->id;
        }

        $contract->update($updateData);

        $this->createApprovalForStep($contract, $firstStep);

        if ($submit) {
            $this->handleAutoApproval($contract, Auth::user());
            $this->handleAutoAdvanceStep($contract, $firstStep);
        }

        $this->queryService->logHistory($contract, 'CONTRACT_SENT', 'Kontrak dikirim untuk persetujuan', Auth::id());

        return $contract->fresh();
    }

    /**
     * Create approval records for a workflow step.
     */
    public function createApprovalForStep(Contract $contract, WorkflowStep $step): void
    {
        $res = $this->resolveApproversForStep($contract, $step);
        $approvers = $res['approvers'];
        $roles = $res['roles'];

        $hasAdhoc = Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $step->id)
            ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
            ->whereIn('status', ['pending', 'waiting'])
            ->exists();

        $initialStatus = $hasAdhoc ? 'waiting' : 'pending';

        // Stale pending/waiting approver cleanup: remove regular approvals for users who are no longer approvers for this step
        $approverUserIds = $approvers->pluck('id')->filter()->toArray();
        if (! empty($approverUserIds)) {
            Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $step->id)
                ->whereNotIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                ->whereIn('status', ['pending', 'waiting'])
                ->whereNotIn('user_id', $approverUserIds)
                ->delete();
        }

        foreach ($approvers as $approver) {
            // Guard: skip if a non-adhoc pending/waiting approval for this user+step already exists
            $existing = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $step->id)
                ->where('user_id', $approver->id)
                ->whereNotIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                ->whereIn('status', ['pending', 'waiting'])
                ->first();

            if ($existing) {
                // If it's still waiting but no adhoc blockers exist, promote to pending
                if ($existing->status === 'waiting' && ! $hasAdhoc) {
                    $existing->update(['status' => 'pending']);
                }

                continue;
            }

            Approval::create([
                'contract_id' => $contract->id,
                'workflow_step_id' => $step->id,
                'user_id' => $approver->id,
                'approver_name' => $approver->name,
                'role' => count($roles) > 0 ? $roles[0] : 'Approver',
                'job_title' => $approver->job_title ?? null,
                'status' => $initialStatus,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'sequence' => $step->step,
                'is_active' => true,
            ]);
        }

        if ($hasAdhoc) {
            $metadata = $contract->metadata ?? [];
            $isSequential = $metadata['adhoc_steps'][$step->id]['is_sequential'] ?? false;

            if ($isSequential) {
                $firstWaitingAdhoc = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $step->id)
                    ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
                    ->where('status', 'waiting')
                    ->orderBy('sort_order')
                    ->orderBy('sub_step')
                    ->first();

                if ($firstWaitingAdhoc) {
                    $firstWaitingAdhoc->update(['status' => 'pending']);
                    $label = $firstWaitingAdhoc->role === 'Penandatangan' ? 'Penandatanganan' : 'Persetujuan tambahan';
                    $this->queryService->logHistory($contract, 'APPROVAL_PENDING', "{$label} berurutan aktif untuk: {$firstWaitingAdhoc->approver_name}", Auth::id());
                }
            } else {
                $waitingAdhocs = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $step->id)
                    ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
                    ->where('status', 'waiting')
                    ->get();

                foreach ($waitingAdhocs as $adhoc) {
                    $adhoc->update(['status' => 'pending']);
                }

                if ($waitingAdhocs->isNotEmpty()) {
                    $names = $waitingAdhocs->pluck('approver_name')->implode(', ');
                    $this->queryService->logHistory($contract, 'APPROVAL_PENDING', "Persetujuan tambahan serentak aktif untuk: {$names}", Auth::id());
                }
            }
        }
    }

    /**
     * Resolve the list of actual users authorized to approve a step.
     */
    public function resolveApproversForStep(Contract $contract, WorkflowStep $step): array
    {
        $contract->loadMissing([
            'initiator.department',
            'initiator.division',
            'initiator.company.companyGroup',
            'initiator.company.region',
            'creator.department',
            'creator.division',
            'creator.company',
        ]);

        $executedQueries = [];
        $roles = $step->relationLoaded('approverAuthorities')
            ? $step->approverAuthorities->filter(fn ($a) => $a->authority_type === 'role')->pluck('role.name')->filter()->toArray()
            : $step->approverAuthorities()->where('authority_type', 'role')->with('role')->get()->pluck('role.name')->filter()->toArray();

        $lowerRoles = array_map('strtolower', $roles);
        $approvers = collect();

        if ($step->step_category === 'joint_upload') {
            $metadata = $contract->metadata ?? [];
            $order = $metadata['step_12_order'] ?? null;
            $finished = $metadata['step_12_finished'] ?? [];

            if ($order) {
                $remaining = array_diff($order, $finished);
                if (! empty($remaining)) {
                    $nextActorKey = array_values($remaining)[0];
                    if ($nextActorKey === 'initiator') {
                        $approvers = collect([$contract->initiator]);
                        $roles = ['Initiator'];
                    } else {
                        $picId = $metadata['assigned_pic_id'] ?? null;
                        $pic = $picId ? User::find($picId) : null;
                        $approvers = $pic ? collect([$pic]) : collect();
                        $roles = ['Staff Legal'];
                    }
                }
            }
        }


        if ($approvers->isEmpty()) {
            $hasExplicitAuthorities = $step->relationLoaded('approverAuthorities')
                ? $step->approverAuthorities->isNotEmpty()
                : $step->approverAuthorities()->exists();

            if ($hasExplicitAuthorities) {
                $authorities = $step->relationLoaded('approverAuthorities')
                    ? $step->approverAuthorities
                    : $step->approverAuthorities()->get();

                // 1. Resolve Custom Actors
                $customs = $authorities->filter(fn ($a) => ! empty($a->authority_type) && in_array($a->authority_type, ['initiator', 'assigned_pic', 'creator', 'atasan', 'adhoc_approvers', 'adhoc']))->pluck('authority_type')->toArray();
                if (! empty($customs)) {
                    if (in_array('initiator', $customs) && $contract->initiator) {
                        $approvers->push($contract->initiator);
                    }
                    if (in_array('creator', $customs) && $contract->creator) {
                        $approvers->push($contract->creator);
                    }
                    if (in_array('assigned_pic', $customs)) {
                        $picId = $contract->assigned_pic_id ?? ($contract->metadata['assigned_pic_id'] ?? null);
                        if ($picId) {
                            $pic = User::find($picId);
                            if ($pic) {
                                $approvers->push($pic);
                            }
                        }
                    }
                    if (in_array('atasan', $customs)) {
                        $atasanList = $this->queryService->resolveHierarchyApprover($contract, $step);
                        if ($atasanList) {
                            $approvers = $approvers->merge($atasanList);
                        }
                    }
                    if (in_array('adhoc_approvers', $customs) || in_array('adhoc', $customs)) {
                        // Ad-hoc approvals are already directly created with role 'Persetujuan Tambahan' and sub_step.
                        // We do NOT return them here to prevent duplicate generic 'Approver' records.
                    }
                }

                // 2, 3 & Combinations. Resolve each authority entry as an independent rule (AND matching within entry, merged via OR)
                foreach ($authorities as $a) {
                    if (in_array($a->authority_type, ['initiator', 'assigned_pic', 'creator', 'atasan', 'user', 'adhoc_approvers', 'adhoc'])) {
                        continue;
                    }
                    if ($a->authority_type === 'custom') {
                        continue;
                    }

                    $query = User::query()->where('is_used', true);
                    $hasFilters = false;

                    // ponytail: strictly apply filters based on authority_type, or apply all available if 'group'
                    $isGroup = $a->authority_type === 'group';

                    // ponytail: support *_use_initiator flags for dynamic targeting
                    $invalidInitiatorFilter = false;

                    if ($a->role_use_initiator) {
                        $roleId = data_get($contract->initiator, 'role_id');
                        if (! $roleId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $roleId = $a->role_id;
                    }

                    if ($roleId && ($isGroup || $a->authority_type === 'role')) {
                        $query->where('role_id', $roleId);
                        $hasFilters = true;
                    }

                    if ($a->department_use_initiator) {
                        $departmentId = data_get($contract->initiator, 'department_id') ?: data_get($contract->initiator, 'division_id');
                        if (! $departmentId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $departmentId = $a->department_id;
                    }

                    if ($departmentId && ($isGroup || $a->authority_type === 'department')) {
                        $query->where(function ($q) use ($departmentId) {
                            $q->where('department_id', $departmentId)
                                ->orWhere('division_id', $departmentId);
                        });
                        $hasFilters = true;
                    }

                    if ($a->division_use_initiator) {
                        $divisionId = data_get($contract->initiator, 'division_id') ?: data_get($contract->initiator, 'department_id');
                        if (! $divisionId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $divisionId = $a->division_id;
                    }

                    if ($divisionId && ($isGroup || $a->authority_type === 'division')) {
                        $query->where(function ($q) use ($divisionId) {
                            $q->where('division_id', $divisionId)
                                ->orWhere('department_id', $divisionId);
                        });
                        $hasFilters = true;
                    }

                    if ($a->company_group_use_initiator) {
                        $companyGroupId = data_get($contract->initiator, 'company_group_id') ?: data_get($contract->initiator, 'company.company_group_id');
                        if (! $companyGroupId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $companyGroupId = $a->company_group_id;
                    }

                    if (($a->company_group_use_initiator || $companyGroupId) && ($isGroup || $a->authority_type === 'company_group')) {
                        $query->where(function ($q) use ($companyGroupId) {
                            $q->where('company_group_id', $companyGroupId)
                                ->orWhereHas('company', fn ($cq) => $cq->where('company_group_id', $companyGroupId));
                        });
                        $hasFilters = true;
                    }

                    if ($a->company_use_initiator) {
                        $companyId = data_get($contract->initiator, 'company_id');
                        if (! $companyId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $companyId = $a->company_id;
                    }

                    if (($a->company_use_initiator || $companyId) && ($isGroup || $a->authority_type === 'company')) {
                        $query->where('company_id', $companyId);
                        $hasFilters = true;
                    }

                    if ($a->region_use_initiator) {
                        $regionId = data_get($contract->initiator, 'region_id') ?: data_get($contract->initiator, 'company.region_id');
                        if (! $regionId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $regionId = $a->region_id;
                    }

                    if (($a->region_use_initiator || $regionId) && ($isGroup || $a->authority_type === 'region')) {
                        $query->where(function ($q) use ($regionId) {
                            $q->where('region_id', $regionId)
                                ->orWhereHas('company', fn ($cq) => $cq->where('region_id', $regionId));
                        });
                        $hasFilters = true;
                    }

                    if ($hasFilters && ! $invalidInitiatorFilter) {
                        $query = $this->applyStepFilters($query, $step, $contract);
                        $rawSql = $query->toSql();
                        foreach ($query->getBindings() as $binding) {
                            $val = is_numeric($binding) ? $binding : "'".addslashes((string) $binding)."'";
                            $rawSql = preg_replace('/\?/', $val, $rawSql, 1);
                        }
                        $executedQueries[] = $rawSql;
                        $approvers = $approvers->merge($query->get());
                    }
                }

                // 4. Resolve Users
                $stepUsers = $authorities->filter(fn ($a) => $a->authority_type === 'user' && ! empty($a->user_id))->pluck('user_id')->toArray();
                if (! empty($stepUsers)) {
                    $uQuery = User::whereIn('id', $stepUsers)->where('is_used', true);
                    $rawSql = $uQuery->toSql();
                    foreach ($uQuery->getBindings() as $binding) {
                        $val = is_numeric($binding) ? $binding : "'".addslashes((string) $binding)."'";
                        $rawSql = preg_replace('/\?/', $val, $rawSql, 1);
                    }
                    $executedQueries[] = $rawSql;
                    $approvers = $approvers->merge($uQuery->get());
                }

                $approvers = $approvers->unique('id');

                // Extract roles label tags
                $stepRoles = $authorities->filter(fn ($a) => $a->role_id && $a->role?->name)->pluck('role.name')->filter()->toArray();

                $roles = array_merge(
                    $stepRoles,
                    in_array('initiator', $customs) ? ['Initiator'] : [],
                    in_array('creator', $customs) ? ['Creator'] : [],
                    in_array('atasan', $customs) ? ['Atasan Langsung'] : [],
                    in_array('assigned_pic', $customs) ? ['Staff Legal'] : []
                );
            } else {
                $cfg = $step->approver_config ?? [];
                $customActors = ! empty($cfg['custom']) ? (array) $cfg['custom'] : [];

                if (! empty($customActors)) {
                    if (in_array('initiator', $customActors) && $contract->initiator) {
                        $approvers->push($contract->initiator);
                        $roles[] = 'Initiator';
                    }
                    if (in_array('creator', $customActors) && $contract->creator) {
                        $approvers->push($contract->creator);
                        $roles[] = 'Creator';
                    }
                    if (in_array('assigned_pic', $customActors)) {
                        $metadata = $contract->metadata ?? [];
                        $picId = $contract->assigned_pic_id ?? ($metadata['assigned_pic_id'] ?? null);
                        if ($picId) {
                            $pic = User::find($picId);
                            if ($pic) {
                                $approvers->push($pic);
                                $roles[] = 'Staff Legal';
                            }
                        }
                    }
                    if (in_array('atasan', $customActors)) {
                        $atasanList = $this->queryService->resolveHierarchyApprover($contract, $step);
                        if ($atasanList) {
                            $approvers = $approvers->merge($atasanList);
                            $roles[] = 'Atasan Langsung';
                        }
                    }
                }

                if ($step->approver_type === 'atasan') {
                    $approvers = $approvers->merge($this->queryService->resolveHierarchyApprover($contract, $step));
                } elseif ($step->approver_type === 'user') {
                    $approvers = $approvers->merge($step->users()->get());
                } elseif ($step->approver_type === 'initiator') {
                    if ($contract->initiator) {
                        $approvers->push($contract->initiator);
                        $roles[] = 'Initiator';
                    }
                } elseif ($step->approver_type === 'assigned_pic') {
                    $metadata = $contract->metadata ?? [];
                    $picId = $contract->assigned_pic_id ?? ($metadata['assigned_pic_id'] ?? null);
                    if ($picId) {
                        $pic = User::find($picId);
                        if ($pic) {
                            $approvers->push($pic);
                            $roles[] = 'Staff Legal';
                        }
                    }
                } elseif ($step->approver_type === 'adhoc') {
                    $approvers = collect();
                } else {
                    $legacyRoles = $step->role ? (is_array($step->role) ? array_filter($step->role) : [$step->role]) : [];
                    if (empty($legacyRoles) && ! empty($cfg['roles'])) {
                        $legacyRoles = array_filter((array) $cfg['roles']);
                    }

                    $targetDeptIds = $step->department_ids ?? [];
                    if (empty($targetDeptIds) && ! empty($cfg['departments'])) {
                        $targetDeptIds = array_filter((array) $cfg['departments']);
                    }

                    $hasExplicitLegacyFilter = ! empty($legacyRoles) || ! empty($targetDeptIds) || $step->filter_department || $step->filter_company_group || $step->filter_region || $step->filter_company;

                    if ($hasExplicitLegacyFilter) {
                        $query = User::query()->where('is_used', true);
                        $hasFilters = false;

                        if (! empty($legacyRoles)) {
                            $query->where(function ($q) use ($legacyRoles) {
                                $q->whereHas('roleRelation', fn ($rq) => $rq->whereIn('name', $legacyRoles))
                                    ->orWhereIn('role_id', $legacyRoles);
                            });
                            $hasFilters = true;
                        }

                        $initiatorCompany = $contract->initiator?->company;
                        if ($step->filter_department) {
                            $initDeptId = $contract->initiator?->division_id ?? '00000000-0000-0000-0000-000000000000';
                            $query->where('division_id', $initDeptId);
                            $hasFilters = true;
                        } elseif (! empty($targetDeptIds)) {
                            $query->where(function ($q) use ($targetDeptIds) {
                                $q->whereIn('division_id', $targetDeptIds)
                                    ->orWhereIn('department_id', $targetDeptIds);
                            });
                            $hasFilters = true;
                        }

                        if ($step->filter_company_group || $step->filter_region) {
                            $query->whereHas('company', function ($q) use ($step, $initiatorCompany) {
                                if ($step->filter_company_group) {
                                    $groupId = $initiatorCompany?->company_group_id ?? '00000000-0000-0000-0000-000000000000';
                                    $q->where('company_group_id', $groupId);
                                }
                                if ($step->filter_region) {
                                    $regionId = $initiatorCompany?->region_id ?? '00000000-0000-0000-0000-000000000000';
                                    $q->where('region_id', $regionId);
                                }
                            });
                            $hasFilters = true;
                        }

                        if ($step->filter_company) {
                            $query->where('company_id', $contract->initiator?->company_id ?? '00000000-0000-0000-0000-000000000000');
                            $hasFilters = true;
                        }

                        if ($hasFilters) {
                            $rawSql = $query->toSql();
                            foreach ($query->getBindings() as $binding) {
                                $val = is_numeric($binding) ? $binding : "'".addslashes((string) $binding)."'";
                                $rawSql = preg_replace('/\?/', $val, $rawSql, 1);
                            }
                            $executedQueries[] = $rawSql;
                            $approvers = $query->get();
                        }
                    }
                }
                $approvers = $approvers->unique('id');
            }
        }

        return [
            'approvers' => $approvers,
            'roles' => $roles,
            'sql_queries' => $executedQueries,
        ];
    }

    /**
     * Approve a contract and move to next step if conditions are met.
     */
    public function approveContract(Contract $contract, Approval $approval, ?string $comment = null, ?string $attachmentPath = null, ?string $assignedPicId = null, ?string $executionOrder = null, string|WorkflowAction $actionCode = WorkflowAction::APPROVE, ?string $targetStepId = null, $signerUserIdsParam = null, ?string $actionId = null): Contract
    {
        if (! $contract->relationLoaded('initiator')) {
            $contract->load(['initiator.department', 'initiator.company', 'creator.department', 'creator.company']);
        }

        if ($actionCode instanceof WorkflowAction) {
            $actionCode = $actionCode->value;
        }

        if (! in_array($approval->status, ['pending', 'waiting'])) {
            return $contract;
        }

        $isRoleBased = $approval->workflowStep->approver_type === 'role';
        if ($isRoleBased && $approval->role !== 'Persetujuan Tambahan') {
            // Only consider approvals created on or after this approval's creation time as concurrent/already approved
            $alreadyApproved = $contract->approvals()
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->where('role', '!=', 'Persetujuan Tambahan')
                ->where('status', 'approved')
                ->where('id', '!=', $approval->id)
                ->where('created_at', '>=', $approval->created_at)
                ->exists();

            if ($alreadyApproved) {
                $approval->delete();

                return $contract;
            }
        }

        $isSigningSetup = ($approval->workflowStep->step_category === 'signing' || in_array(strtolower($actionCode), ['signature', 'sign'])) &&
            $approval->sub_step === null &&
            (! empty($signerUserIdsParam) || request()->has('signer_user_ids'));

        if ($isSigningSetup) {
            return $this->handleSigningSetup($contract, $approval, $actionCode, $comment, $signerUserIdsParam, $targetStepId);
        }

        // Validate required fields configured on step actions or step meta (only for main step approvers)
        $currentStep = $approval->workflowStep;
        if ($currentStep && $approval->sub_step === null && $approval->role !== 'Persetujuan Tambahan') {
            $actions = $currentStep->actions;
            $actionReqFields = [];
            foreach ($actions as $act) {
                if (! empty($act->required_fields) && is_array($act->required_fields)) {
                    $actionReqFields = array_merge($actionReqFields, $act->required_fields);
                }
            }
            $stepMeta = $currentStep->meta ?? [];

            // 1. PIC Validation
            $requirePic = ! empty($stepMeta['require_pic']) || in_array('pic', $actionReqFields) || in_array('assigned_pic', $actionReqFields);
            if ($requirePic) {
                $hasPic = ! empty($contract->assigned_pic_id) || ! empty($assignedPicId) || ! empty($contract->metadata['assigned_pic_id']);
                if (! $hasPic) {
                    throw new \Exception('Tidak dapat melanjutkan persetujuan. Data PIC (Penanggung Jawab) wajib diisi / ditugaskan terlebih dahulu.');
                }
            }

            // 2. F1 Validation
            $requireF1 = ! empty($stepMeta['require_f1']) || in_array('f1', $actionReqFields);
            if ($requireF1) {
                $hasF1 = ! empty($contract->metadata['f1_file'])
                    || ! empty($contract->metadata['f1_form_data'])
                    || ! empty($contract->f1_items)
                    || $contract->versions()->where('document_type', 'f1')->exists()
                    || $contract->formSubmissions()->where('document_type', 'f1')->exists();
                if (! $hasF1) {
                    throw new \Exception('Tidak dapat melanjutkan persetujuan. Sub-dokumen F1 (Permohonan) wajib diisi/diunggah terlebih dahulu.');
                }
            }

            // 3. F2 Validation
            $requireF2 = ! empty($stepMeta['require_f2']) || in_array('f2', $actionReqFields);
            if ($requireF2) {
                $hasF2 = ! empty($contract->metadata['f2_file'])
                    || ! empty($contract->metadata['f2_form_data'])
                    || ! empty($contract->contract_no)
                    || ! empty($contract->price)
                    || $contract->versions()->where('document_type', 'f2')->exists()
                    || $contract->formSubmissions()->where('document_type', 'f2')->exists();
                if (! $hasF2) {
                    throw new \Exception('Tidak dapat melanjutkan persetujuan. Sub-dokumen F2 (Ringkasan) wajib diisi/diunggah terlebih dahulu.');
                }
            }

            // 4. Agreement Validation
            $requireAgreement = ! empty($stepMeta['require_agreement']) || in_array('agreement', $actionReqFields);
            if ($requireAgreement) {
                $hasAgreement = ! empty($contract->metadata['agreement_file'])
                    || ! empty($contract->metadata['agreement_content'])
                    || $contract->versions()->whereIn('document_type', ['agreement', 'contract'])->exists()
                    || $contract->formSubmissions()->where('document_type', 'agreement')->exists();
                if (! $hasAgreement) {
                    throw new \Exception('Tidak dapat melanjutkan persetujuan. Sub-dokumen Perjanjian / Draft wajib diisi/diunggah terlebih dahulu.');
                }
            }
        }

        $requestActionId = $actionId ?: request()->input('action_id') ?: request()->input('step_action_id');
        $stepAction = null;
        if ($requestActionId && $approval->workflowStep) {
            $stepAction = $approval->workflowStep->actions()->where('id', $requestActionId)->first();
        }

        if (! $stepAction && $approval->workflowStep) {
            $matchingActions = $approval->workflowStep->actions()
                ->where(function ($q) use ($actionCode) {
                    $q->where('action_code', $actionCode);
                    if (in_array(strtolower($actionCode), ['signature', 'sign'])) {
                        $q->orWhereIn('action_code', ['signature', 'sign']);
                    }
                    if (in_array(strtolower($actionCode), ['assign', 'assign_pic'])) {
                        $q->orWhereIn('action_code', ['assign', 'assign_pic', 'approve']);
                    }
                })->get();

            $stepAction = $matchingActions->first();
        }

        if (! $stepAction && $actionCode === 'approve' && $approval->role === 'Persetujuan Tambahan' && $approval->workflowStep) {
            $stepAction = $approval->workflowStep->actions()->where('action_code', 'forward')->first();
        }
        if (! $stepAction && $approval->workflowStep) {
            $stepAction = $approval->workflowStep->actions()->whereIn('action_code', ['approve', 'assign', 'assign_pic'])->first();
        }

        $actionIdToSave = $stepAction?->id ?? $actionId;
        $actionCodeToSave = $stepAction?->action_code instanceof \App\Enums\WorkflowAction ? $stepAction->action_code->value : ($stepAction?->action_code ?? $actionCode);
        $actionAliasToSave = $stepAction?->alias;

        $approval->approve($comment, $attachmentPath, $actionIdToSave, $actionCodeToSave, $actionAliasToSave);

        if (in_array($actionCodeToSave, ['branch', 'forward'])) {
            $actionLabel = $actionAliasToSave ?: ($actionCodeToSave === 'branch' ? 'Pindah Workflow' : 'Teruskan');
            $this->queryService->logHistory($contract, 'WORKFLOW_BRANCHED', "{$actionLabel} oleh {$approval->approver_name} ({$approval->role})", Auth::id());
        } elseif (in_array($actionCodeToSave, ['assign', 'assign_pic'])) {
            $actionLabel = $actionAliasToSave ?: 'Persetujuan & Penugasan PIC';
            $this->queryService->logHistory($contract, 'APPROVAL_APPROVED', "{$actionLabel} oleh {$approval->approver_name} ({$approval->role})", Auth::id());
        } else {
            $actionLabel = $actionAliasToSave ?: 'Disetujui';
            $this->queryService->logHistory($contract, 'APPROVAL_APPROVED', "{$actionLabel} oleh {$approval->approver_name} ({$approval->role})", Auth::id());
        }

        $this->activateNextApprovers($contract, $approval);

        if ($assignedPicId) {
            $metadata = $contract->metadata ?? [];
            $metadata['assigned_pic_id'] = $assignedPicId;
            $metadata['assigned_by_id'] = Auth::id();

            $contract->update([
                'assigned_pic_id' => $assignedPicId,
                'assigned_by_id' => Auth::id(),
                'metadata' => $metadata,
            ]);

            $pic = User::find($assignedPicId);
            $this->queryService->logHistory($contract, 'WORKFLOW_ASSIGNED', 'PIC ditugaskan ke: '.($pic ? $pic->name : $assignedPicId), Auth::id());
        }

        $currentStepApprovals = $contract->approvals()
            ->where('workflow_step_id', $approval->workflow_step_id)
            ->where('is_active', true)
            ->get();

        $regularApprovals = $currentStepApprovals->filter(fn (Approval $a) => ! in_array($a->role, ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2']));
        $adhocApprovals = $currentStepApprovals->filter(fn (Approval $a) => $a->role === 'Persetujuan Tambahan');
        $signerApprovals = $currentStepApprovals->filter(fn (Approval $a) => in_array($a->role, ['Penandatangan', 'Pihak 1', 'Pihak 2']));

        // Evaluate Ad-Hoc Approvals rule
        if ($adhocApprovals->isEmpty()) {
            $adhocApproved = true;
        } else {
            $adhocStepMeta = ($contract->metadata['adhoc_steps'] ?? [])[$approval->workflow_step_id] ?? [];
            $adhocRule = $adhocStepMeta['approval_rule'] ?? 'all';
            $adhocMinApprovals = (int) ($adhocStepMeta['min_approvals'] ?? $adhocApprovals->count());

            if ($adhocRule === 'any') {
                $adhocApproved = $adhocApprovals->contains(fn (Approval $a) => $a->status === 'approved');
            } elseif ($adhocRule === 'quorum') {
                $approvedCount = $adhocApprovals->filter(fn (Approval $a) => $a->status === 'approved')->count();
                $adhocApproved = $approvedCount >= max(1, $adhocMinApprovals);
            } else {
                $adhocApproved = $adhocApprovals->every(fn (Approval $a) => $a->status === 'approved');
            }
        }

        $signersApproved = $signerApprovals->isEmpty() || $signerApprovals->every(fn (Approval $a) => $a->status === 'approved');

        if ($regularApprovals->isEmpty()) {
            $regularApproved = true;
        } else {
            $regularApproved = $isRoleBased
                ? $regularApprovals->contains(fn (Approval $a) => $a->status === 'approved')
                : $regularApprovals->every(fn (Approval $a) => $a->status === 'approved');
        }

        $allApproved = $adhocApproved && $signersApproved && $regularApproved;

        if ($approval->workflowStep->step_category === 'joint_upload') {
            $jointApproved = $this->handleJointUpload($contract, $approval, $executionOrder);
            if (! $jointApproved) {
                return $contract->fresh();
            }
            $allApproved = true;
        }

        $isSignerRole = in_array($approval->role, ['Penandatangan', 'Pihak 1', 'Pihak 2']);
        $isSigningCategory = $approval->workflowStep->step_category === 'signing';
        $isSigningAction = in_array(strtolower($actionCode), ['sign', 'signature']);

        if ($isSigningCategory || $isSignerRole || $isSigningAction) {
            $this->handleSigningCompletion($contract, $approval, $attachmentPath);
        }

        if ($allApproved) {
            $this->handleWorkflowTransition($contract, $approval, $actionCode, $actionId);
        }

        return $contract->fresh();
    }

    /**
     * Handle setup for signing process (adding signers as sequential sub-steps)
     */
    private function handleSigningSetup(Contract $contract, Approval $approval, string $actionCode, ?string $comment = null, $signerUserIdsParam = null, ?string $targetStepId = null): Contract
    {
        $signerUserIds = $signerUserIdsParam ?: request()->input('signer_user_ids', []);
        if (! is_array($signerUserIds)) {
            $signerUserIds = $signerUserIds ? [$signerUserIds] : [];
        }

        if (count($signerUserIds) > 0) {
            $signingAction = $approval->workflowStep->actions->filter(function ($act) use ($actionCode) {
                $code = $act->action_code instanceof WorkflowAction ? $act->action_code->value : ($act->action_code ?? $act->masterAction?->code);

                return strtolower((string) $code) === strtolower($actionCode) || in_array(strtolower((string) $code), ['signature', 'sign']);
            })->first();

            $transitionStep = $signingAction ? $this->evaluateTransition($contract, $approval->workflowStep, $signingAction) : null;
            $targetStepId = $targetStepId ?: ($transitionStep ? $transitionStep->id : null) ?: (request()->input('target_step_id') ?: ($signingAction?->assignee_config['signature_target_step'] ?? $approval->workflow_step_id));
            $targetStep = $targetStepId == $approval->workflow_step_id ? $approval->workflowStep : WorkflowStep::find($targetStepId);
            $targetSequence = $targetStep->step ?? $approval->workflowStep->step;
            $currentSequence = $approval->workflowStep->step;

            $initialStatus = ($targetSequence <= $currentSequence) ? 'pending' : 'waiting';
            $allSigners = [];

            foreach ($signerUserIds as $index => $id) {
                $user = User::find($id);
                if ($user) {
                    $maxSort = Approval::where('contract_id', $contract->id)->where('workflow_step_id', $targetStepId)->max('sort_order') ?: 0;
                    $maxSubStep = Approval::where('contract_id', $contract->id)->where('workflow_step_id', $targetStepId)->whereNotNull('sub_step')->max('sub_step') ?: 0;

                    $role = (request()->has('p1_user_id') || request()->has('p2_user_id')) ? (($index === 0) ? 'Pihak 1' : 'Pihak 2') : 'Penandatangan';

                    Approval::create([
                        'contract_id' => $contract->id,
                        'workflow_step_id' => $targetStepId,
                        'user_id' => $user->id,
                        'approver_name' => $user->name,
                        'role' => $role,
                        'status' => empty($allSigners) ? $initialStatus : 'waiting',
                        'sequence' => $targetSequence,
                        'sub_step' => $maxSubStep + 1,
                        'sort_order' => $maxSort + 1,
                        'is_active' => true,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                    ]);
                    $allSigners[] = $user->name;
                }
            }

            $this->queryService->logHistory($contract, 'SIGNING_SETUP', 'Delegasi Penandatanganan: '.implode(', ', $allSigners), Auth::id());

            if ($targetStepId === $contract->workflow_step_id) {
                $contract->approvals()
                    ->where('workflow_step_id', $targetStepId)
                    ->whereNotIn('role', ['initiator', 'Penandatangan', 'Persetujuan Tambahan', 'Pihak 1', 'Pihak 2'])
                    ->where('status', 'pending')
                    ->update(['status' => 'waiting']);

                $approval->update(['status' => 'waiting', 'comment' => $comment]);
            } else {
                $approval->update(['status' => 'approved', 'comment' => $comment]);

                $statusStr = $targetStep->meta['target_status'] ?? 'locked';
                $nextStatus = ContractStatus::where('code', $statusStr)->first();

                $contract->update([
                    'workflow_step_id' => $targetStepId,
                    'status' => $nextStatus?->code ?: $statusStr,
                ]);

                // Activate the first signer approval of the new step
                $firstSigner = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $targetStepId)
                    ->whereIn('role', ['Penandatangan', 'Pihak 1', 'Pihak 2'])
                    ->orderBy('sub_step')
                    ->first();
                if ($firstSigner) {
                    $firstSigner->update(['status' => 'pending']);
                }
            }

            return $contract->fresh();
        }

        return $contract;
    }

    /**
     * Activate the next set of approvers in a sequential or ad-hoc process.
     */
    private function activateNextApprovers(Contract $contract, Approval $approval): void
    {
        if (in_array($approval->role, ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])) {
            $nextApprovalQuery = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->where('is_active', true)
                ->where('status', 'waiting');

            if ($approval->role === 'Persetujuan Tambahan') {
                $nextApprovalQuery->where('role', 'Persetujuan Tambahan');
            } else {
                $nextApprovalQuery->whereIn('role', ['Penandatangan', 'Pihak 1', 'Pihak 2']);
            }

            $nextApproval = $nextApprovalQuery->orderBy('sort_order')
                ->orderBy('sub_step')
                ->first();

            if ($nextApproval) {
                $nextApproval->update(['status' => 'pending']);
                $this->queryService->logHistory($contract, 'APPROVAL_PENDING', "Proses {$approval->role} dialihkan ke orang berikutnya: {$nextApproval->approver_name}", Auth::id());

                return;
            }
        }

        if (in_array($approval->role, ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])) {
            $hasRemainingSequential = Approval::where('contract_id', $contract->id)
                ->where('workflow_step_id', $approval->workflow_step_id)
                ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                ->whereIn('status', ['pending', 'waiting'])
                ->exists();

            if (! $hasRemainingSequential) {
                $regularApprovalsToActivate = Approval::where('contract_id', $contract->id)
                    ->where('workflow_step_id', $approval->workflow_step_id)
                    ->whereNotIn('role', ['Persetujuan Tambahan', 'Penandatangan', 'Pihak 1', 'Pihak 2'])
                    ->where('status', 'waiting')
                    ->get();

                foreach ($regularApprovalsToActivate as $ra) {
                    $ra->update(['status' => 'pending']);
                }

                if ($regularApprovalsToActivate->isNotEmpty()) {
                    $this->queryService->logHistory($contract, 'APPROVAL_PENDING', 'Seluruh persetujuan tambahan / penandatanganan selesai. Persetujuan tahap utama kini aktif.', Auth::id());
                }
            }
        }
    }

    /**
     * Handle logic when a signing approval is completed.
     */
    private function handleSigningCompletion(Contract $contract, Approval $approval, ?string $attachmentPath = null): void
    {
        $metadata = $contract->metadata ?? [];
        $metadata["signer_{$approval->id}_downloaded_at"] = now()->toIso8601String();
        $contract->update(['metadata' => $metadata]);

        if ($attachmentPath) {
            $lastVersion = ContractVersion::where('contract_id', $contract->id)->where('document_type', 'agreement')->max('version_no') ?? 0;
            $versionNo = $lastVersion + 1;
            $ext = pathinfo($attachmentPath, PATHINFO_EXTENSION) ?: 'docx';
            $newPath = 'contracts/'.$contract->id.'/agreements/'."agreement_v{$versionNo}.{$ext}";

            Storage::disk('local')->makeDirectory('contracts/'.$contract->id.'/agreements');
            Storage::disk('local')->copy($attachmentPath, $newPath);

            ContractVersion::create([
                'contract_id' => $contract->id,
                'document_type' => 'agreement',
                'version_no' => $versionNo,
                'file_name' => "agreement_v{$versionNo}.{$ext}",
                'file_path' => $newPath,
                'change_log' => in_array($approval->role, ['Pihak 1', 'Pihak 2']) ? "Dokumen ditandatangani {$approval->role}" : "Dokumen ditandatangani oleh {$approval->approver_name}",
                'uploaded_by' => Auth::id(),
            ]);

            $contract->update(['current_version' => $versionNo]);
        }

        $this->queryService->logHistory($contract, 'SIGNING_STEP_COMPLETE', "Penandatanganan selesai oleh {$approval->approver_name}", Auth::id());
    }

    /**
     * Handle joint upload logic for steps that require both initiator and legal to finish.
     */
    private function handleJointUpload(Contract $contract, Approval $approval, ?string $executionOrder = null): bool
    {
        $metadata = $contract->metadata ?? [];

        if (! isset($metadata['step_12_order'])) {
            $order = $executionOrder ?? 'legal_first';
            $metadata['step_12_order'] = ($order === 'initiator_first') ? ['initiator', 'legal'] : ['legal', 'initiator'];
            $metadata['step_12_finished'] = [];
            if ($order === 'legal_first') {
                $metadata['step_12_finished'][] = 'legal';
            }
            $contract->update(['metadata' => $metadata]);
            $this->queryService->logHistory($contract, 'WORKFLOW_ORDER_SET', 'Urutan penyelesaian diatur: '.($order === 'initiator_first' ? 'Inisiator dulu' : 'Legal dulu'), Auth::id());

            if (! empty(array_diff($metadata['step_12_order'], $metadata['step_12_finished']))) {
                $this->createApprovalForStep($contract, $approval->workflowStep);

                return false;
            }
        } else {
            $actorKey = ($approval->user_id === $contract->initiated_by_id) ? 'initiator' : 'legal';
            $finished = $metadata['step_12_finished'] ?? [];
            $finished[] = $actorKey;
            $metadata['step_12_finished'] = array_unique($finished);
            $contract->update(['metadata' => $metadata]);

            if (! empty(array_diff($metadata['step_12_order'], $metadata['step_12_finished']))) {
                $this->createApprovalForStep($contract, $approval->workflowStep);

                return false;
            }
        }

        return true;
    }

    /**
     * Handle workflow transition to the next step.
     */
    private function handleWorkflowTransition(Contract $contract, Approval $approval, string $actionCode, ?string $actionId = null): void
    {
        $isRoleBased = $approval->workflowStep->approver_type === 'role';
        if ($isRoleBased) {
            $contract->approvals()->where('workflow_step_id', $approval->workflow_step_id)->where('role', '!=', 'Persetujuan Tambahan')->whereIn('status', ['pending', 'waiting'])->delete();
        }

        if (str_contains(strtolower($approval->role), 'legal') || str_contains(strtolower($approval->workflowStep->description ?? ''), 'legal')) {
            $metadata = $contract->metadata ?? [];
            $metadata['current_phase'] = 'agreement';
            $metadata['drafting_finished_at'] = now()->toIso8601String();
            $contract->update(['metadata' => $metadata]);
        }

        $requestActionId = $actionId ?: request()->input('action_id') ?: request()->input('step_action_id');
        $stepAction = null;
        if ($requestActionId) {
            $stepAction = $approval->workflowStep->actions()->where('id', $requestActionId)->first();
        }

        if (! $stepAction) {
            $matchingActions = $approval->workflowStep->actions()
                ->where(function ($q) use ($actionCode) {
                    $q->where('action_code', $actionCode);
                    if (in_array(strtolower($actionCode), ['signature', 'sign'])) {
                        $q->orWhereIn('action_code', ['signature', 'sign']);
                    }
                    if (in_array(strtolower($actionCode), ['assign', 'assign_pic'])) {
                        $q->orWhereIn('action_code', ['assign', 'assign_pic', 'approve']);
                    }
                })->get();

            $stepAction = $matchingActions->first();
        }

        if (! $stepAction && $actionCode === 'approve' && $approval->role === 'Persetujuan Tambahan') {
            $stepAction = $approval->workflowStep->actions()->where('action_code', 'forward')->first();
        }
        if (! $stepAction) {
            $stepAction = $approval->workflowStep->actions()->whereIn('action_code', ['approve', 'assign', 'assign_pic'])->first();
        }
        if ($stepAction && ! empty($stepAction->autofilled_fields)) {
            $metadata = $contract->metadata ?? [];
            foreach ($stepAction->autofilled_fields as $field) {
                $metadata[$field] = now()->toIso8601String();
            }
            $contract->update(['metadata' => $metadata]);
        }

        $hasExplicitTransition = $stepAction && ($stepAction->transition_config || $stepAction->next_workflow_id || $stepAction->next_step_id);
        $nextStep = $stepAction ? $this->evaluateTransition($contract, $approval->workflowStep, $stepAction) : null;
        while ($nextStep && ! $this->shouldExecuteStep($contract, $nextStep)) {
            $nextStep = $this->findNextValidStep($contract, $nextStep);
        }

        if (! $nextStep && ! $hasExplicitTransition) {
            $nextStep = $this->findNextValidStep($contract, $approval->workflowStep);
        }

        if ($nextStep) {
            $minStepVal = $contract->workflow ? $contract->workflow->loadMissing('steps')->steps->min('step') : 1;
            $statusStr = $stepAction?->target_status
                ?: ($nextStep->id === $approval->workflow_step_id ? $contract->status : ($nextStep->meta['target_status'] ?? ($nextStep->step_category === 'signing' ? 'locked' : ($nextStep->step === $minStepVal ? 'draft' : 'in_review'))));
            $nextStatus = ContractStatus::where('code', $statusStr)->first();

            $isSameStep = $nextStep->id === $approval->workflow_step_id;

            $contract->update([
                'workflow_step_id' => $nextStep->id,
                'status' => $nextStatus?->code ?: $statusStr,
            ]);

            if (! $isSameStep) {
                $this->createApprovalForStep($contract, $nextStep);
                $this->handleAutoApproval($contract, Auth::user());
                $this->queryService->logHistory($contract, 'WORKFLOW_ADVANCED', "Alur kerja berlanjut ke tahap {$nextStep->step}: {$nextStep->description}", Auth::id());
                $this->handleAutoAdvanceStep($contract, $nextStep);
            }
        } else {
            $archivedStatus = ContractStatus::where('code', 'archived')->first();
            $targetStat = $stepAction?->target_status;
            if (($approval->workflowStep->step_category === 'closing' || $targetStat === 'archived') && $archivedStatus) {
                $contract->update(['status' => $archivedStatus->code, 'workflow_step_id' => null]);
                $this->queryService->logHistory($contract, 'CONTRACT_COMPLETED', 'Alur kerja selesai (Arsip).', Auth::id());
            } else {
                $approvedStatus = ContractStatus::where('code', 'approved')->first();
                $contract->update(['status' => $targetStat ?: 'approved', 'workflow_step_id' => null]);
                $this->queryService->logHistory($contract, 'CONTRACT_APPROVED', 'Seluruh persetujuan selesai. Kontrak disetujui.', Auth::id());
            }
        }
    }

    /**
     * Reject a contract and move it back to drafting/revision.
     */
    public function rejectContract(Contract $contract, Approval $approval, string $reason, ?string $attachmentPath = null): Contract
    {
        $requestActionId = request()->input('action_id') ?: request()->input('step_action_id');
        $stepAction = null;
        if ($requestActionId && $approval->workflowStep) {
            $stepAction = $approval->workflowStep->actions()->where('id', $requestActionId)->first();
        }

        if (! $stepAction && $approval->workflowStep) {
            $stepAction = $approval->workflowStep->actions()->where('action_code', 'reject')->first();
        }

        $actionIdToSave = $stepAction?->id;
        $actionCodeToSave = $stepAction?->action_code instanceof \App\Enums\WorkflowAction ? $stepAction->action_code->value : ($stepAction?->action_code ?? 'reject');
        $actionAliasToSave = $stepAction?->alias;

        $approval->reject($reason, $attachmentPath, $actionIdToSave, $actionCodeToSave, $actionAliasToSave);

        $targetStep = $stepAction ? ($this->evaluateTransition($contract, $approval->workflowStep, $stepAction) ?: WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', 1)->first()) : WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', 1)->first();

        $statusStr = $targetStep->meta['target_status'] ?? 'revision';
        $revisionStatus = ContractStatus::where('code', $statusStr)->first();

        $actionLabel = $actionAliasToSave ?: 'Ditolak';
        // ponytail: log rejection to contract history audit before resetting approvals
        $description = "{$actionLabel} oleh {$approval->approver_name} ({$approval->role}): {$reason}. ".($targetStep ? "Dikembalikan ke tahap {$targetStep->step}: {$targetStep->description}." : 'Dikembalikan ke Inisiator untuk revisi.');
        $this->queryService->logHistory($contract, 'APPROVAL_REJECTED', $description, Auth::id());

        // Clear adhoc metadata if returning to step 1
        $metadata = $contract->metadata ?? [];
        if ($targetStep && $targetStep->step === 1 && isset($metadata['adhoc_steps'])) {
            unset($metadata['adhoc_steps']);
        }

        $contract->update([
            'status' => $revisionStatus?->code ?: $statusStr,
            'workflow_step_id' => $targetStep ? $targetStep->id : null,
            'metadata' => $metadata,
        ]);

        // ponytail: reset sub-workflow approvals so sub-workflow approval flow starts fresh while preserving origin workflow history
        if ($contract->origin_workflow_id && $contract->workflow_id !== $contract->origin_workflow_id && $targetStep && $targetStep->workflow_id === $contract->workflow_id) {
            $contract->approvals()->whereHas('workflowStep', fn ($q) => $q->where('workflow_id', $contract->workflow_id))->delete();
            $contract->approvals()->where('status', 'pending')->where('id', '!=', $approval->id)->update(['status' => 'waiting']);
        } else {
            $contract->approvals()->delete();
        }

        if ($targetStep) {
            $this->createApprovalForStep($contract, $targetStep);
            $this->handleAutoApproval($contract, Auth::user());
            $this->handleAutoAdvanceStep($contract, $targetStep);
        }

        return $contract->fresh();
    }

    /**
     * Automatically advance workflow if the current step is configured as an automated/system step without manual approvers.
     */
    public function handleAutoAdvanceStep(Contract $contract, WorkflowStep $step): void
    {
        $resolved = $this->resolveApproversForStep($contract, $step);
        $approvers = $resolved['approvers'];

        $hasAdhoc = Approval::where('contract_id', $contract->id)
            ->where('workflow_step_id', $step->id)
            ->whereIn('role', ['Persetujuan Tambahan', 'Penandatangan'])
            ->whereIn('status', ['pending', 'waiting'])
            ->exists();

        $isAutoStep = in_array($step->step_category, ['auto', 'system', 'automation']) ||
            in_array($step->approver_type, ['auto', 'system', 'automation']) ||
            $step->actions()->whereIn('action_code', ['auto', 'automation'])->exists() ||
            ($step->actions()->exists() && $approvers->isEmpty() && ! $hasAdhoc);

        if ($isAutoStep) {
            $action = $step->actions()->whereIn('action_code', ['auto', 'automation'])->first() ?: $step->actions()->first();
            if ($action) {
                // Execute autofill if configured
                if (! empty($action->autofilled_fields)) {
                    $metadata = $contract->metadata ?? [];
                    foreach ($action->autofilled_fields as $field) {
                        $metadata[$field] = now()->toIso8601String();
                    }
                    $contract->update(['metadata' => $metadata]);
                }

                $nextStep = $this->evaluateTransition($contract, $step, $action);
                if ($nextStep && $nextStep->id !== $step->id) {
                    $targetWorkflow = $nextStep->relationLoaded('workflow') ? $nextStep->workflow : $nextStep->workflow()->first();
                    $minStepVal = $targetWorkflow ? $targetWorkflow->steps()->min('step') : 1;
                    $statusStr = $action->target_status
                        ?: ($nextStep->meta['target_status'] ?? ($nextStep->step_category === 'signing' ? 'locked' : ($nextStep->step === $minStepVal ? 'draft' : 'in_review')));
                    $nextStatus = ContractStatus::where('code', $statusStr)->first();

                    // ponytail: Mark auto step approvals as approved so they do not stay pending
                    $contract->approvals()
                        ->where('workflow_step_id', $step->id)
                        ->whereIn('status', ['pending', 'waiting'])
                        ->update([
                            'status' => 'approved',
                            'decided_at' => now(),
                            'comment' => $action->alias ?: 'Dijalankan otomatis oleh sistem',
                        ]);

                    $contract->update([
                        'workflow_id' => $nextStep->workflow_id,
                        'workflow_step_id' => $nextStep->id,
                        'status' => $nextStatus?->code ?: $statusStr,
                    ]);

                    $this->queryService->logHistory($contract, 'WORKFLOW_AUTO_ADVANCED', "Tahap otomatis dijalankan: {$step->label} -> Lanjut ke tahap {$nextStep->step}: {$nextStep->description}", Auth::id());

                    $this->createApprovalForStep($contract, $nextStep);
                    $this->handleAutoApproval($contract, Auth::user());
                    $this->handleAutoAdvanceStep($contract, $nextStep);
                }
            }
        }
    }

    public function getAvailableWorkflows(?User $user, ?string $contractType = null)
    {
        return $this->queryService->getAvailableWorkflows($user, $contractType);
    }

    public function resolveHierarchyApprover(Contract $contract, WorkflowStep|int $stepOrLevel = 1)
    {
        return $this->queryService->resolveHierarchyApprover($contract, $stepOrLevel);
    }

    /**
     * Evaluate the next step based on action transition configuration.
     */
    public function evaluateTransition(Contract $contract, WorkflowStep $currentStep, WorkflowStepAction $stepAction): ?WorkflowStep
    {
        $transition = $stepAction->transition_config;

        if (is_array($transition) && isset($transition['type'])) {
            switch ($transition['type']) {
                case 'relative':
                    $offset = (int) ($transition['offset'] ?? 1);
                    if ($offset === 1) {
                        return $this->findNextValidStep($contract, $currentStep);
                    } elseif ($offset === 0) {
                        return $currentStep;
                    } elseif ($offset > 1) {
                        $targetSequence = $currentStep->step + $offset;
                        $allSteps = WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', '>=', $targetSequence)->orderBy('step')->get();
                        foreach ($allSteps as $step) {
                            if ($this->shouldExecuteStep($contract, $step)) {
                                return $step;
                            }
                        }

                        return null;
                    } elseif ($offset < 0) {
                        $targetSequence = max(1, $currentStep->step + $offset);

                        return WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', '<=', $targetSequence)->orderBy('step', 'desc')->first();
                    }

                    break;

                case 'finish':
                case 'archive':
                    return null;

                case 'absolute':
                    $targetSequence = max(1, (int) ($transition['sequence'] ?? 1));
                    $targetStep = WorkflowStep::where('workflow_id', $contract->workflow_id)->where('step', $targetSequence)->first();
                    if ($targetStep) {
                        $contract->update([
                            'workflow_id' => $contract->workflow_id,
                            'workflow_step_id' => $targetStep->id,
                        ]);

                        return $targetStep;
                    }
                    break;

                case 'cross_workflow':
                    $workflowId = $transition['workflow_id'] ?? null;
                    if ($workflowId === 'origin_workflow' || $workflowId === 'origin' || empty($workflowId)) {
                        $workflowId = $contract->origin_workflow_id ?: $contract->workflow_id;
                    }

                    if ($workflowId) {
                        $targetSequence = max(1, (int) ($transition['sequence'] ?? 1));

                        // Dynamic return: if returning to origin from sub-workflow, calculate next step from branch point
                        $metadata = $contract->metadata ?? [];
                        if (($transition['return_mode'] ?? '') === 'branch_origin' || ($transition['return_mode'] ?? '') === 'origin_step') {
                            if (isset($metadata['branch_from_step_num'])) {
                                $targetSequence = (int) $metadata['branch_from_step_num'];
                            }
                        } elseif (($transition['return_mode'] ?? '') === 'branch_next' || ($workflowId === $contract->origin_workflow_id && isset($metadata['branch_from_step_num']))) {
                            if (isset($metadata['branch_from_step_num'])) {
                                $targetSequence = (int) $metadata['branch_from_step_num'] + 1;
                            }
                        }

                        $targetStep = WorkflowStep::where('workflow_id', $workflowId)->where('step', $targetSequence)->first();
                        if (! $targetStep) {
                            $targetStep = WorkflowStep::where('workflow_id', $workflowId)->where('step', '>=', $targetSequence)->orderBy('step')->first()
                                ?: WorkflowStep::where('workflow_id', $workflowId)->orderBy('step', 'desc')->first();
                        }

                        if ($targetStep) {
                            // If jumping into a sub-workflow from main workflow, record the branch origin step number
                            $originWfId = $contract->origin_workflow_id ?: $contract->workflow_id;
                            if ($workflowId !== $originWfId) {
                                $metadata['branch_from_step_num'] = $currentStep->step;
                                $metadata['branch_from_step_id'] = $currentStep->id;
                            } elseif (isset($metadata['branch_from_step_num'])) {
                                unset($metadata['branch_from_step_num'], $metadata['branch_from_step_id']);
                            }

                            $contract->update([
                                'workflow_id' => $workflowId,
                                'workflow_step_id' => $targetStep->id,
                                'metadata' => $metadata,
                            ]);

                            return $targetStep;
                        }
                    }
                    break;

                case 'initial_step':
                    $workflowId = $contract->origin_workflow_id ?: $contract->workflow_id;
                    if ($workflowId) {
                        $targetStep = WorkflowStep::where('workflow_id', $workflowId)->orderBy('step')->first();
                        if ($targetStep) {
                            $contract->update([
                                'workflow_id' => $workflowId,
                                'workflow_step_id' => $targetStep->id,
                            ]);

                            return $targetStep;
                        }
                    }
                    break;
            }
        }

        if ($stepAction->next_workflow_id) {
            $contract->update(['workflow_id' => $stepAction->next_workflow_id]);

            return $stepAction->next_workflow_step_id ? WorkflowStep::find($stepAction->next_workflow_step_id) : WorkflowStep::where('workflow_id', $stepAction->next_workflow_id)->orderBy('step')->first();
        }

        return $stepAction->next_step_id ? WorkflowStep::find($stepAction->next_step_id) : null;
    }

    private function applyStepFilters(Builder $query, WorkflowStep $step, Contract $contract): Builder
    {
        if ($step->filter_department) {
            $initDeptId = $contract->initiator->division_id ?? '00000000-0000-0000-0000-000000000000';
            $query->where('division_id', $initDeptId);
        }

        $initiatorCompany = $contract->initiator?->company;
        if ($step->filter_company_group || $step->filter_region) {
            $query->whereHas('company', function ($q) use ($step, $initiatorCompany) {
                if ($step->filter_company_group) {
                    $groupId = $initiatorCompany?->company_group_id ?? '00000000-0000-0000-0000-000000000000';
                    $q->where('company_group_id', $groupId);
                }
                if ($step->filter_region) {
                    $regionId = $initiatorCompany?->region_id ?? '00000000-0000-0000-0000-000000000000';
                    $q->where('region_id', $regionId);
                }
            });
        }

        if ($step->filter_company) {
            $query->where('company_id', $contract->initiator->company_id ?? '00000000-0000-0000-0000-000000000000');
        }

        return $query;
    }
}
