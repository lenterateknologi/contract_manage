<?php

namespace App\Services\Workflow\Concerns;

use App\Http\Formatters\ContractFormatter;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\Department;
use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\Auth;

trait EvaluatesWorkflowSteps
{
    /**
     * Finds the next step in the sequence that satisfies its entry conditions.
     */
    public function findNextValidStep(Contract $contract, WorkflowStep $currentStep): ?WorkflowStep
    {
        $allSteps = WorkflowStep::where('workflow_id', $currentStep->workflow_id)
            ->where('step', '>', $currentStep->step)
            ->orderBy('step')
            ->get();

        foreach ($allSteps as $step) {
            if ($this->shouldExecuteStep($contract, $step)) {
                return $step;
            }
        }

        return null;
    }

    /**
     * Determine if a workflow step should be executed based on conditions
     */
    public function shouldExecuteStep(Contract $contract, WorkflowStep $step): bool
    {
        // Rule 2: Bypass optional or decision steps entirely
        if ($step->getAttributes()['is_optional'] ?? false) {
            return false;
        }

        if (($step->getAttributes()['step_category'] ?? '') === 'decision') {
            return false;
        }

        // Auto-skip direct supervisor review and department manager review are disabled as per user request.
        /*
        // Skip direct supervisor review if initiator is a supervisor or manager
        if ($step->approver_type === 'atasan') {
            $initiator = $contract->initiator;
            $roleName = strtolower($initiator->role ?: ($initiator->roleRelation()->first()->name ?? ''));
            $exemptRoles = [
                strtolower(config('master.roles.manager')),
                strtolower(config('master.roles.vp')),
                strtolower(config('master.roles.ceo')),
                strtolower(config('master.roles.director')),
                strtolower(config('master.roles.admin')),
            ];
            if (in_array($roleName, $exemptRoles)) {
                return false;
            }
        }

        // Skip Department Manager Review if Initiator is Manager/Head
        $roles = (array) $step->role;
        $lowerRoles = array_map('strtolower', $roles);
        if (in_array(strtolower(config('master.roles.manager')), $lowerRoles)) {
            $initiator = $contract->initiator;
            $initiatorRole = strtolower($initiator->role ?: ($initiator->roleRelation()->first()->name ?? ''));
            $exemptRoles = [
                strtolower(config('master.roles.manager')),
                strtolower(config('master.roles.vp')),
                strtolower(config('master.roles.ceo')),
                strtolower(config('master.roles.director')),
                strtolower(config('master.roles.admin')),
            ];
            if (in_array($initiatorRole, $exemptRoles)) {
                $targetDeptIds = $step->department_ids;
                if (empty($targetDeptIds) || in_array($initiator->division_id, $targetDeptIds)) {
                    return false;
                }
            }
        }
        */

        $condition = $step->condition_expression ?? '';
        $meta = $step->meta ?? [];

        // Check if there is a structured meta condition
        if (! empty($meta['condition_key'])) {
            $key = $meta['condition_key'];
            $operator = $meta['condition_operator'] ?? 'truthy';
            $expected = $meta['condition_value'] ?? '';

            $metadata = $contract->metadata ?? [];
            $actual = $metadata[$key] ?? null;

            if ($key === 'contract.has_tax' && $actual === null) {
                $actual = $metadata['tax_required'] ?? null;
            }

            $isActive = false;
            switch ($operator) {
                case '==':
                    $actualStr = is_bool($actual) ? ($actual ? 'true' : 'false') : (string) $actual;
                    $isActive = ($actualStr === (string) $expected ||
                                 (in_array($expected, ['true', '1', 'yes'], true) && in_array($actual, [true, 'true', 1, '1', 'on', 'yes'], true)) ||
                                 (in_array($expected, ['false', '0', 'no'], true) && in_array($actual, [false, 'false', 0, '0', 'off', 'no', null], true)));

                    break;
                case '!=':
                    $actualStr = is_bool($actual) ? ($actual ? 'true' : 'false') : (string) $actual;
                    $isActive = ($actualStr !== (string) $expected &&
                                 ! (in_array($expected, ['true', '1', 'yes'], true) && in_array($actual, [true, 'true', 1, '1', 'on', 'yes'], true)) &&
                                 ! (in_array($expected, ['false', '0', 'no'], true) && in_array($actual, [false, 'false', 0, '0', 'off', 'no', null], true)));

                    break;
                case '>':
                    $isActive = ((float) $actual > (float) $expected);

                    break;
                case '<':
                    $isActive = ((float) $actual < (float) $expected);

                    break;
                case 'contains':
                    $isActive = ($actual !== null && str_contains(strtolower((string) $actual), strtolower((string) $expected)));

                    break;
                case 'truthy':
                default:
                    $isActive = in_array($actual, [true, 'true', 1, '1', 'on', 'yes'], true);

                    break;
            }

            if (! $isActive) {
                return false;
            }
        }

        // Dynamic Meta Key logic: if condition is set and not a special 'initiator_' keyword
        if (! empty($condition) && ! str_starts_with($condition, 'initiator_')) {
            $metadata = $contract->metadata ?? [];

            // Detect if condition contains operators for dynamic parsing
            $key = $condition;
            $operator = 'truthy';
            $expected = '';

            foreach (['==', '!=', '>', '<', 'contains'] as $op) {
                if (str_contains($condition, " {$op} ")) {
                    $parts = explode(" {$op} ", $condition);
                    $key = trim($parts[0]);
                    $operator = $op;
                    $expected = trim($parts[1]);

                    break;
                } elseif (str_contains($condition, $op)) {
                    $parts = explode($op, $condition);
                    $key = trim($parts[0]);
                    $operator = $op;
                    $expected = trim($parts[1]);

                    break;
                }
            }

            $actual = $metadata[$key] ?? null;
            if ($key === 'contract.has_tax' && $actual === null) {
                $actual = $metadata['tax_required'] ?? null;
            }

            $isActive = false;
            if ($operator === 'truthy') {
                $isActive = in_array($actual, [true, 'true', 1, '1', 'on', 'yes'], true);
            } else {
                switch ($operator) {
                    case '==':
                        $actualStr = is_bool($actual) ? ($actual ? 'true' : 'false') : (string) $actual;
                        $isActive = ($actualStr === (string) $expected ||
                                     (in_array($expected, ['true', '1', 'yes'], true) && in_array($actual, [true, 'true', 1, '1', 'on', 'yes'], true)) ||
                                     (in_array($expected, ['false', '0', 'no'], true) && in_array($actual, [false, 'false', 0, '0', 'off', 'no', null], true)));

                        break;
                    case '!=':
                        $actualStr = is_bool($actual) ? ($actual ? 'true' : 'false') : (string) $actual;
                        $isActive = ($actualStr !== (string) $expected &&
                                     ! (in_array($expected, ['true', '1', 'yes'], true) && in_array($actual, [true, 'true', 1, '1', 'on', 'yes'], true)) &&
                                     ! (in_array($expected, ['false', '0', 'no'], true) && in_array($actual, [false, 'false', 0, '0', 'off', 'no', null], true)));

                        break;
                    case '>':
                        $isActive = ((float) $actual > (float) $expected);

                        break;
                    case '<':
                        $isActive = ((float) $actual < (float) $expected);

                        break;
                    case 'contains':
                        $isActive = ($actual !== null && str_contains(strtolower((string) $actual), strtolower((string) $expected)));

                        break;
                }
            }

            if (! $isActive) {
                return false;
            }
        }

        // Condition: Direct Supervisor Review (only if initiator is Staff)
        if (str_contains($condition, 'initiator_is_staff')) {
            $roleName = $contract->initiator->getAttribute('role') ?: ($contract->initiator->roleRelation()->first()->name ?? '');

            // Bypass logic: Skip Step 1 if submitted by Legal/Admin for others (Helper Mode)
            $creator = Auth::user();
            $creatorDeptCode = null;
            if ($creator) {
                if (! $creator->relationLoaded('department')) {
                    $creator->load('department');
                }
                $creatorDeptCode = $creator->department?->code;
            }
            $isLegal = $creator && ($creatorDeptCode === Division::CODE_LEGAL || $creator->role === config('master.roles.admin'));
            $isHelper = $contract->initiated_by_id && $contract->initiated_by_id !== $contract->created_by;

            if ($isLegal && $isHelper) {
                return false; // Bypass departmental review
            }

            return strtolower($roleName) === strtolower(config('master.roles.staff'));
        }

        // Condition: Skip if initiator is Legal (used for Manager step)
        if (str_contains($condition, 'initiator_not_legal')) {
            $initiator = $contract->initiator;
            if (! $initiator->relationLoaded('department')) {
                $initiator->load('department');
            }

            return $initiator->department?->code !== Division::CODE_LEGAL;
        }

        // Condition: Skip Management if Initiator is already Management/Direksi
        if (str_contains($condition, 'initiator_not_manager')) {
            $initiatorRoleName = $contract->initiator->getAttribute('role') ?: ($contract->initiator->roleRelation()->first()->name ?? '');
            $roleName = strtolower($initiatorRoleName);
            $exemptRoles = [
                strtolower(config('master.roles.manager')),
                strtolower(config('master.roles.director')),
                strtolower(config('master.roles.admin')),
            ];

            return ! in_array($roleName, $exemptRoles);
        }

        // If no recognized condition, execute by default
        return true;
    }

    /**
     * Parse a formatted price string into a float.
     */
    public function parsePrice(?string $price): float
    {
        return ContractFormatter::parsePrice($price);
    }

    /**
     * Handles automatic approval if the current user is also an approver for the next step(s).
     * Prevents redundant work for the same person in consecutive review steps.
     */
    private function handleAutoApproval(Contract $contract, ?User $user): void
    {
        // Feature disabled as requested

    }
}
