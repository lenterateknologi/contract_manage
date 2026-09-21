<?php

namespace App\Services\MasterData;

use App\Models\Authority;
use Illuminate\Support\Facades\DB;

class MasterAuthoritySyncService
{
    /**
     * Sync authority rules for any given context.
     *
     * @param string $contextType e.g., Authority::CONTEXT_DASHBOARD_TYPE, Authority::CONTEXT_ON_BEHALF_CREATE, etc.
     * @param string|null $contextId Context ID (e.g. DashboardType ID, Workflow ID, WorkflowStep ID), or null for global contexts
     * @param array $items Array of authority rule data
     * @return void
     */
    public function sync(string $contextType, ?string $contextId, array $items): void
    {
        DB::transaction(function () use ($contextType, $contextId, $items) {
            $query = Authority::where('context_type', $contextType);
            if ($contextId !== null) {
                $query->where('context_id', $contextId);
            }
            $query->forceDelete();

            foreach ($items as $idx => $auth) {
                if (! is_array($auth)) {
                    continue;
                }

                Authority::create([
                    'context_type' => $contextType,
                    'context_id' => $contextId,
                    'authority_type' => $auth['authority_type'] ?? 'group',
                    'role_id' => ! empty($auth['role_id']) ? $auth['role_id'] : null,
                    'job_level_id' => ! empty($auth['job_level_id']) ? $auth['job_level_id'] : null,
                    'job_position_id' => ! empty($auth['job_position_id']) ? $auth['job_position_id'] : null,
                    'department_id' => ! empty($auth['department_id']) ? $auth['department_id'] : null,
                    'division_id' => ! empty($auth['division_id']) ? $auth['division_id'] : null,
                    'organization_group_id' => ! empty($auth['organization_group_id']) ? $auth['organization_group_id'] : null,
                    'location_id' => ! empty($auth['location_id']) ? $auth['location_id'] : null,
                    'user_id' => ! empty($auth['user_id']) ? $auth['user_id'] : null,
                    'company_group_id' => ! empty($auth['company_group_id']) ? $auth['company_group_id'] : null,
                    'company_id' => ! empty($auth['company_id']) ? $auth['company_id'] : null,
                    'region_id' => ! empty($auth['region_id']) ? $auth['region_id'] : null,
                    'role_use_initiator' => (bool) ($auth['role_use_initiator'] ?? false),
                    'department_use_initiator' => (bool) ($auth['department_use_initiator'] ?? false),
                    'division_use_initiator' => (bool) ($auth['division_use_initiator'] ?? false),
                    'organization_group_use_initiator' => (bool) ($auth['organization_group_use_initiator'] ?? false),
                    'location_use_initiator' => (bool) ($auth['location_use_initiator'] ?? false),
                    'company_group_use_initiator' => (bool) ($auth['company_group_use_initiator'] ?? false),
                    'company_use_initiator' => (bool) ($auth['company_use_initiator'] ?? false),
                    'region_use_initiator' => (bool) ($auth['region_use_initiator'] ?? false),
                    'is_additional' => (bool) ($auth['is_additional'] ?? false),
                    'additional_type' => ! empty($auth['additional_type']) ? $auth['additional_type'] : null,
                    'workflow_step_action_id' => ! empty($auth['workflow_step_action_id']) ? $auth['workflow_step_action_id'] : null,
                    'target_step_id' => ! empty($auth['target_step_id']) ? $auth['target_step_id'] : null,
                    'is_active' => isset($auth['is_active']) ? (bool) $auth['is_active'] : true,
                    'sequence' => $idx + 1,
                    'description' => $auth['description'] ?? null,
                    'meta' => $auth['meta'] ?? null,
                ]);
            }
        });
    }

    /**
     * Fetch formatted authorities with essential relations for a given context.
     */
    public function getForContext(string $contextType, ?string $contextId = null)
    {
        $query = Authority::with([
            'role:id,name',
            'department:id,name,code,idorg_group,org_group_name',
            'division:id,name,code',
            'location:id,name,code',
            'user:id,name,email,nik,username,role_id,department_id,division_id',
            'companyGroup:id,name',
            'company:id,name',
            'region:id,name',
            'organizationGroup:id,name,code,idorg_group',
            'jobLevel:id,name',
            'jobTitle:id,name',
        ])
            ->where('context_type', $contextType)
            ->where('is_active', true)
            ->orderBy('sequence');

        if ($contextId !== null) {
            $query->where('context_id', $contextId);
        }

        return $query->get();
    }

    /**
     * Get lightweight master options for AuthorityTableManager.
     * Uses direct query and lightweight array structure to eliminate Eloquent appends overhead and achieve fast page loads.
     */
    public function getMasterOptions(): array
    {
        $users = DB::table('m_users')
            ->leftJoin('m_roles', 'm_users.role_id', '=', 'm_roles.id')
            ->leftJoin('m_departments', 'm_users.department_id', '=', 'm_departments.id')
            ->leftJoin('m_companies', 'm_users.company_id', '=', 'm_companies.id')
            ->leftJoin('m_locations', 'm_users.location_id', '=', 'm_locations.id')
            ->where('m_users.is_used', true)
            ->whereNull('m_users.deleted_at')
            ->select([
                'm_users.id',
                'm_users.name',
                'm_users.email',
                'm_users.nik',
                'm_users.username',
                'm_roles.name as role',
                'm_users.role_id',
                'm_users.department_id',
                'm_users.division_id',
                'm_users.company_id',
                'm_users.company_name',
                'm_users.org_name',
                'm_users.location_id',
                'm_users.company_group_id',
                'm_users.region_id',
                'm_departments.idorg_group',
                'm_departments.org_group_name',
                'm_companies.company_group_name',
                'm_companies.region_name',
                'm_locations.code as location_code',
                'm_locations.name as location_name_loc',
            ])
            ->orderBy('m_users.name')
            ->get()
            ->map(fn ($u) => [
                'id' => (string) $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'nik' => $u->nik,
                'role' => $u->role,
                'role_id' => $u->role_id,
                'department_id' => $u->department_id,
                'division_id' => $u->division_id,
                'company_id' => $u->company_id,
                'company_name' => $u->company_name,
                'org_name' => $u->org_name,
                'location_id' => $u->location_id,
                'company_group_id' => $u->company_group_id,
                'region_id' => $u->region_id,
                'is_used' => true,
                'department' => $u->department_id ? [
                    'id' => (string) $u->department_id,
                    'name' => $u->org_name,
                    'idorg_group' => $u->idorg_group,
                    'org_group_name' => $u->org_group_name,
                ] : null,
                'company' => $u->company_id ? [
                    'id' => (string) $u->company_id,
                    'name' => $u->company_name,
                    'company_group_name' => $u->company_group_name,
                    'region_name' => $u->region_name,
                ] : null,
                'location' => $u->location_id ? [
                    'id' => (string) $u->location_id,
                    'name' => $u->location_name_loc,
                    'code' => $u->location_code,
                ] : null,
            ])
            ->values()
            ->all();

        return [
            'roles' => DB::table('m_roles')->select('id', 'name')->whereNull('deleted_at')->orderBy('name')->get(),
            'departments' => DB::table('m_departments')->select('id', 'name', 'code', 'idorg_group', 'org_group_name')->where('is_used', true)->whereNull('deleted_at')->orderBy('name')->get(),
            'divisions' => DB::table('m_division')->select('id', 'name', 'code', 'department_id')->whereNull('deleted_at')->orderBy('name')->get(),
            'locations' => DB::table('m_locations')->select('id', 'name', 'code')->where('is_used', true)->whereNull('deleted_at')->orderBy('name')->get(),
            'companyGroups' => DB::table('m_company_groups')->select('id', 'name')->where('is_used', true)->whereNull('deleted_at')->orderBy('name')->get(),
            'organizationGroups' => DB::table('m_organization_groups')->select('id', 'name', 'code', 'idorg_group')->where('is_used', true)->whereNull('deleted_at')->orderBy('name')->get(),
            'regions' => DB::table('m_regions')->select('id', 'name')->where('is_used', true)->whereNull('deleted_at')->orderBy('name')->get(),
            'companies' => DB::table('m_companies')->select('id', 'name')->where('is_used', true)->whereNull('deleted_at')->orderBy('name')->get(),
            'users' => $users,
        ];
    }
}
