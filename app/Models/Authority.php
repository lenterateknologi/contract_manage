<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Authority extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'm_authorities';

    public const CONTEXT_WORKFLOW_INITIATOR = 'workflow_initiator';
    public const CONTEXT_WORKFLOW_STEP = 'workflow_step';
    public const CONTEXT_STEP_ACTION_BUTTON = 'step_action_button';
    public const CONTEXT_STEP_ACTION_ASSIGNEE = 'step_action_assignee';
    public const CONTEXT_ON_BEHALF_CREATE = 'on_behalf_create';
    public const CONTEXT_DASHBOARD_TYPE = 'dashboard_type';
    public const CONTEXT_SLA_OVERDUE = 'sla_overdue_notif';

    public const AUTHORITY_TYPES = [
        'user',
        'division',
        'department',
        'location',
        'role',
        'company_group',
        'company',
        'region',
        'organization_group',
        'role-division',
        'role-division-company_group',
        'role-division_company_group-region',
        'group',
        'custom',
    ];

    protected static function booted(): void
    {
        static::creating(function ($authority) {
            if (empty($authority->context_type)) {
                if (! empty($authority->workflow_step_action_id)) {
                    $authority->context_type = self::CONTEXT_STEP_ACTION_BUTTON;
                    $authority->context_id = $authority->workflow_step_action_id;
                } elseif (! empty($authority->workflow_step_id)) {
                    $authority->context_type = self::CONTEXT_WORKFLOW_STEP;
                    $authority->context_id = $authority->workflow_step_id;
                } elseif (! empty($authority->workflow_id)) {
                    $authority->context_type = self::CONTEXT_WORKFLOW_INITIATOR;
                    $authority->context_id = $authority->workflow_id;
                } elseif (! empty($authority->context_id)) {
                    // Check if context_id is a WorkflowStep or Workflow
                    if (WorkflowStep::where('id', $authority->context_id)->exists()) {
                        $authority->context_type = self::CONTEXT_WORKFLOW_STEP;
                    } elseif (Workflow::where('id', $authority->context_id)->exists()) {
                        $authority->context_type = self::CONTEXT_WORKFLOW_INITIATOR;
                    } elseif (WorkflowStepAction::where('id', $authority->context_id)->exists()) {
                        $authority->context_type = self::CONTEXT_STEP_ACTION_BUTTON;
                    } else {
                        $authority->context_type = self::CONTEXT_WORKFLOW_INITIATOR;
                    }
                }
            }
        });
    }

    public function setWorkflowIdAttribute($value)
    {
        $this->attributes['context_id'] = $value;
        $this->attributes['context_type'] = self::CONTEXT_WORKFLOW_INITIATOR;
    }

    public function getWorkflowIdAttribute()
    {
        return $this->context_type === self::CONTEXT_WORKFLOW_INITIATOR ? $this->context_id : null;
    }

    public function setWorkflowStepIdAttribute($value)
    {
        $this->attributes['context_id'] = $value;
        $this->attributes['context_type'] = self::CONTEXT_WORKFLOW_STEP;
    }

    public function getWorkflowStepIdAttribute()
    {
        return $this->context_type === self::CONTEXT_WORKFLOW_STEP ? $this->context_id : null;
    }

    protected $fillable = [
        'context_type',
        'context_id',
        'workflow_id',
        'workflow_step_id',
        'authority_type',
        'role_id',
        'job_level_id',
        'job_position_id',
        'department_id',
        'division_id',
        'organization_group_id',
        'location_id',
        'user_id',
        'company_group_id',
        'company_id',
        'region_id',
        'role_use_initiator',
        'department_use_initiator',
        'division_use_initiator',
        'organization_group_use_initiator',
        'location_use_initiator',
        'company_group_use_initiator',
        'company_use_initiator',
        'region_use_initiator',
        'is_additional',
        'additional_type',
        'workflow_step_action_id',
        'target_step_id',
        'is_active',
        'sequence',
        'description',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_additional' => 'boolean',
            'role_use_initiator' => 'boolean',
            'department_use_initiator' => 'boolean',
            'division_use_initiator' => 'boolean',
            'organization_group_use_initiator' => 'boolean',
            'location_use_initiator' => 'boolean',
            'company_group_use_initiator' => 'boolean',
            'company_use_initiator' => 'boolean',
            'region_use_initiator' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function jobLevel(): BelongsTo
    {
        return $this->belongsTo(JobLevel::class, 'job_level_id');
    }

    public function jobTitle(): BelongsTo
    {
        return $this->belongsTo(JobTitle::class, 'job_position_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    public function organizationGroup(): BelongsTo
    {
        return $this->belongsTo(OrganizationGroup::class, 'organization_group_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function companyGroup(): BelongsTo
    {
        return $this->belongsTo(CompanyGroup::class, 'company_group_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class, 'context_id');
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'context_id');
    }

    public function dashboardType(): BelongsTo
    {
        return $this->belongsTo(DashboardType::class, 'context_id');
    }

    public function contractSlaConfig(): BelongsTo
    {
        return $this->belongsTo(ContractSlaConfig::class, 'context_id');
    }

    // Scopes
    public function scopeWorkflowInitiator($query, ?string $workflowId = null)
    {
        $q = $query->where('context_type', self::CONTEXT_WORKFLOW_INITIATOR);
        if ($workflowId) {
            $q->where('context_id', $workflowId);
        }
        return $q;
    }

    public function scopeWorkflowStep($query, ?string $stepId = null)
    {
        $q = $query->where('context_type', self::CONTEXT_WORKFLOW_STEP);
        if ($stepId) {
            $q->where('context_id', $stepId);
        }
        return $q;
    }

    public function scopeOnBehalfCreate($query)
    {
        return $query->where('context_type', self::CONTEXT_ON_BEHALF_CREATE);
    }

    public function scopeDashboardType($query, ?string $dashboardTypeId = null)
    {
        $q = $query->where('context_type', self::CONTEXT_DASHBOARD_TYPE);
        if ($dashboardTypeId) {
            $q->where('context_id', $dashboardTypeId);
        }
        return $q;
    }

    public function scopeSlaOverdue($query, ?string $slaConfigId = null)
    {
        $q = $query->where('context_type', self::CONTEXT_SLA_OVERDUE);
        if ($slaConfigId) {
            $q->where('context_id', $slaConfigId);
        }
        return $q;
    }

    public function scopeContext($query, string $type, ?string $id = null)
    {
        $q = $query->where('context_type', $type);
        if ($id !== null) {
            $q->where('context_id', $id);
        }
        return $q;
    }

    /**
     * Check whether a specific user satisfies any active on-behalf authority rule.
     */
    public static function checkUserAllowedOnBehalf(User $user): bool
    {
        if ($user->isAdmin() || $user->isSuperAdmin()) {
            return true;
        }

        $rules = static::where('context_type', self::CONTEXT_ON_BEHALF_CREATE)
            ->where('is_active', true)
            ->get();

        if ($rules->isEmpty()) {
            return false;
        }

        foreach ($rules as $rule) {
            if (static::ruleMatchesUser($rule, $user)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Universal matching logic for any authority rule against a user.
     */
    public static function ruleMatchesUser(self $rule, User $user): bool
    {
        // 1. Direct User Match
        if ($rule->user_id && (string) $rule->user_id === (string) $user->id) {
            return true;
        }

        if ($rule->user_id && (string) $rule->user_id !== (string) $user->id) {
            return false;
        }

        $matches = true;
        $criteriaCount = 0;

        // Role check
        if ($rule->role_id) {
            $criteriaCount++;
            if ((string) $rule->role_id !== (string) $user->role_id) {
                $matches = false;
            }
        }

        // Job Level check
        if ($rule->job_level_id) {
            $criteriaCount++;
            if ((string) $rule->job_level_id !== (string) $user->job_level_id) {
                $matches = false;
            }
        }

        // Job Title / Position check
        if ($rule->job_position_id) {
            $criteriaCount++;
            if ((string) $rule->job_position_id !== (string) $user->job_position_id) {
                $matches = false;
            }
        }

        // Department check
        if ($rule->department_id) {
            $criteriaCount++;
            if ((string) $rule->department_id !== (string) $user->department_id) {
                $matches = false;
            }
        }

        // Division check
        if ($rule->division_id) {
            $criteriaCount++;
            $userDivId = $user->division_id;
            if (! $userDivId && $user->relationLoaded('department') && $user->getRelation('department')) {
                $userDivId = $user->getRelation('department')->division_id;
            }
            if ((string) $rule->division_id !== (string) $userDivId) {
                $matches = false;
            }
        }

        // Location check
        if ($rule->location_id) {
            $criteriaCount++;
            if ((string) $rule->location_id !== (string) $user->location_id) {
                $matches = false;
            }
        }

        // Company Group check
        if ($rule->company_group_id) {
            $criteriaCount++;
            if ((string) $rule->company_group_id !== (string) $user->company_group_id) {
                $matches = false;
            }
        }

        // Company check
        if ($rule->company_id) {
            $criteriaCount++;
            if ((string) $rule->company_id !== (string) $user->company_id) {
                $matches = false;
            }
        }

        // Region check
        if ($rule->region_id) {
            $criteriaCount++;
            if ((string) $rule->region_id !== (string) $user->region_id) {
                $matches = false;
            }
        }

        // Organization Group check
        if ($rule->organization_group_id) {
            $criteriaCount++;
            $userOrgGroupId = $user->idorg_group ?? null;
            if (! $userOrgGroupId && $user->relationLoaded('department') && $user->getRelation('department')) {
                $userOrgGroupId = $user->getRelation('department')->idorg_group;
            }
            if ((string) $rule->organization_group_id !== (string) $userOrgGroupId) {
                $matches = false;
            }
        }

        return $criteriaCount > 0 && $matches;
    }
}
