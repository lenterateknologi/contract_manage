<?php

namespace App\Services\Workflow;

use App\Models\Contract;
use App\Models\User;
use App\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class StepAuthorityResolver
{
    public function __construct(
        protected WorkflowQueryService $queryService,
    ) {}

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
            ? $step->approverAuthorities->filter(fn ($a) => empty($a->authority_type) || $a->authority_type === 'role')->pluck('role.name')->filter()->toArray()
            : $step->approverAuthorities()->where(fn ($q) => $q->whereNull('authority_type')->orWhere('authority_type', 'role'))->with('role')->get()->pluck('role.name')->filter()->toArray();

        $approvers = collect();

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
                    }
                }

                // 2, 3 & Combinations. Resolve each authority entry as an independent rule (AND matching within entry, merged via OR)
                foreach ($authorities as $a) {
                    if (in_array($a->authority_type, ['initiator', 'assigned_pic', 'creator', 'atasan', 'user', 'adhoc_approvers', 'adhoc']) || ! empty($a->user_id)) {
                        continue;
                    }
                    if ($a->authority_type === 'custom') {
                        continue;
                    }

                    $query = User::query()->where('is_used', true);
                    $hasFilters = false;
                    $isGroup = $a->authority_type === 'group';
                    $invalidInitiatorFilter = false;

                    if ($a->role_use_initiator) {
                        $roleId = data_get($contract->initiator, 'role_id');
                        if (! $roleId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $roleId = $a->role_id;
                    }

                    if ($roleId && ($isGroup || empty($a->authority_type) || $a->authority_type === 'role')) {
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

                    if ($departmentId && ($isGroup || empty($a->authority_type) || $a->authority_type === 'department')) {
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

                    if ($divisionId && ($isGroup || empty($a->authority_type) || $a->authority_type === 'division')) {
                        $query->where(function ($q) use ($divisionId) {
                            $q->where('division_id', $divisionId)
                                ->orWhere('department_id', $divisionId);
                        });
                        $hasFilters = true;
                    }

                    if ($a->location_use_initiator) {
                        $locationId = data_get($contract->initiator, 'location_id') ?: data_get($contract->initiator, 'idlocation');
                        if (! $locationId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $locationId = $a->location_id;
                    }

                    if (($a->location_use_initiator || $locationId) && ($isGroup || empty($a->authority_type) || $a->authority_type === 'location')) {
                        $query->where(function ($q) use ($locationId) {
                            $q->where('location_id', $locationId)
                                ->orWhere('idlocation', $locationId);
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

                    if (($a->company_group_use_initiator || $companyGroupId) && ($isGroup || empty($a->authority_type) || $a->authority_type === 'company_group')) {
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

                    if (($a->company_use_initiator || $companyId) && ($isGroup || empty($a->authority_type) || $a->authority_type === 'company')) {
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

                    if (($a->region_use_initiator || $regionId) && ($isGroup || empty($a->authority_type) || $a->authority_type === 'region')) {
                        $query->where(function ($q) use ($regionId) {
                            $q->where('region_id', $regionId)
                                ->orWhereHas('company', fn ($cq) => $cq->where('region_id', $regionId));
                        });
                        $hasFilters = true;
                    }

                    if ($a->organization_group_use_initiator) {
                        $orgGroupId = data_get($contract->initiator, 'department.organization_group_id')
                            ?: data_get($contract->initiator, 'department.idorg_group')
                            ?: data_get($contract->initiator, 'organization_group_id');
                        if (! $orgGroupId) {
                            $invalidInitiatorFilter = true;
                        }
                    } else {
                        $orgGroupId = $a->organization_group_id;
                    }

                    if (($a->organization_group_use_initiator || $orgGroupId) && ($isGroup || empty($a->authority_type) || $a->authority_type === 'organization_group')) {
                        $isUuid = is_string($orgGroupId) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $orgGroupId);
                        $isNumeric = is_numeric($orgGroupId);

                        $query->whereHas('department', function ($dq) use ($orgGroupId, $isUuid, $isNumeric) {
                            $dq->where(function ($subDq) use ($orgGroupId, $isUuid, $isNumeric) {
                                if ($isNumeric) {
                                    $subDq->where('idorg_group', $orgGroupId);
                                }
                                if (! $isUuid) {
                                    $subDq->orWhere('org_group_name', $orgGroupId);
                                }
                                $subDq->orWhereHas('organizationGroup', function ($ogq) use ($orgGroupId, $isUuid, $isNumeric) {
                                    if ($isUuid) {
                                        $ogq->where('id', $orgGroupId);
                                    } elseif ($isNumeric) {
                                        $ogq->where('idorg_group', $orgGroupId);
                                    } else {
                                        $ogq->where('code', $orgGroupId)
                                            ->orWhere('name', $orgGroupId);
                                    }
                                });
                            });
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
                $stepUsers = $authorities->filter(fn ($a) => ($a->authority_type === 'user' || empty($a->authority_type)) && ! empty($a->user_id))->pluck('user_id')->toArray();
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
                    in_array('assigned_pic', $customs) ? ['PIC Legal'] : []
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
                                $roles[] = 'PIC Legal';
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
                            $roles[] = 'PIC Legal';
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

                    $filterDept = (bool) data_get($step->getAttributes(), 'filter_department', false);
                    $filterCompanyGroup = (bool) data_get($step->getAttributes(), 'filter_company_group', false);
                    $filterRegion = (bool) data_get($step->getAttributes(), 'filter_region', false);
                    $filterCompany = (bool) data_get($step->getAttributes(), 'filter_company', false);

                    $hasExplicitLegacyFilter = ! empty($legacyRoles) || ! empty($targetDeptIds) || $filterDept || $filterCompanyGroup || $filterRegion || $filterCompany;

                    if ($hasExplicitLegacyFilter) {
                        $query = User::query()->where('is_used', true);
                        $hasFilters = false;

                        if (! empty($legacyRoles)) {
                            $validRoleUuids = array_values(array_filter($legacyRoles, fn ($r) => is_string($r) && \Illuminate\Support\Str::isUuid($r)));
                            $query->where(function ($q) use ($legacyRoles, $validRoleUuids) {
                                $q->whereHas('roleRelation', fn ($rq) => $rq->whereIn('name', $legacyRoles));
                                if (! empty($validRoleUuids)) {
                                    $q->orWhereIn('role_id', $validRoleUuids);
                                }
                            });
                            $hasFilters = true;
                        }

                        $initiatorCompany = $contract->initiator?->company;
                        if ($filterDept) {
                            $initDeptId = $contract->initiator?->division_id ?? '00000000-0000-0000-0000-000000000000';
                            $query->where('division_id', $initDeptId);
                            $hasFilters = true;
                        } elseif (! empty($targetDeptIds)) {
                            $validDeptUuids = array_values(array_filter($targetDeptIds, fn ($d) => is_string($d) && \Illuminate\Support\Str::isUuid($d)));
                            if (! empty($validDeptUuids)) {
                                $query->where(function ($q) use ($validDeptUuids) {
                                    $q->whereIn('division_id', $validDeptUuids)
                                        ->orWhereIn('department_id', $validDeptUuids);
                                });
                                $hasFilters = true;
                            }
                        }

                        if ($filterCompanyGroup || $filterRegion) {
                            $query->whereHas('company', function ($q) use ($filterCompanyGroup, $filterRegion, $initiatorCompany) {
                                if ($filterCompanyGroup) {
                                    $groupId = $initiatorCompany?->company_group_id ?? '00000000-0000-0000-0000-000000000000';
                                    $q->where('company_group_id', $groupId);
                                }
                                if ($filterRegion) {
                                    $regionId = $initiatorCompany?->region_id ?? '00000000-0000-0000-0000-000000000000';
                                    $q->where('region_id', $regionId);
                                }
                            });
                            $hasFilters = true;
                        }

                        if ($filterCompany) {
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
     * Apply step filters on User query based on initiator attributes.
     */
    public function applyStepFilters(Builder $query, WorkflowStep $step, Contract $contract): Builder
    {
        $filterDept = (bool) data_get($step->getAttributes(), 'filter_department', false);
        $filterCompanyGroup = (bool) data_get($step->getAttributes(), 'filter_company_group', false);
        $filterRegion = (bool) data_get($step->getAttributes(), 'filter_region', false);
        $filterCompany = (bool) data_get($step->getAttributes(), 'filter_company', false);

        if ($filterDept) {
            $initDeptId = $contract->initiator->division_id ?? '00000000-0000-0000-0000-000000000000';
            $query->where('division_id', $initDeptId);
        }

        $initiatorCompany = $contract->initiator?->company;
        if ($filterCompanyGroup || $filterRegion) {
            $query->whereHas('company', function ($q) use ($filterCompanyGroup, $filterRegion, $initiatorCompany) {
                if ($filterCompanyGroup) {
                    $groupId = $initiatorCompany?->company_group_id ?? '00000000-0000-0000-0000-000000000000';
                    $q->where('company_group_id', $groupId);
                }
                if ($filterRegion) {
                    $regionId = $initiatorCompany?->region_id ?? '00000000-0000-0000-0000-000000000000';
                    $q->where('region_id', $regionId);
                }
            });
        }

        if ($filterCompany) {
            $query->where('company_id', $contract->initiator->company_id ?? '00000000-0000-0000-0000-000000000000');
        }

        return $query;
    }
}
