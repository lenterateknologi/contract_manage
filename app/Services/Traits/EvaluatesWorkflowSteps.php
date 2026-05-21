<?php

namespace App\Services\Traits;

use App\Models\Contract;
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
        if ($step->is_optional) {
            return false;
        }

        if ($step->step_category === 'decision') {
            return false;
        }

        // Rule 3: Skip direct supervisor review if initiator is a supervisor or manager
        if ($step->approver_type === 'atasan') {
            $initiator = $contract->initiator;
            if ($initiator) {
                $roleName = strtolower($initiator->role ?: ($initiator->role()->first()->name ?? ''));
                $exemptRoles = ['manager', 'supervisor', 'vp', 'ceo', 'director', 'admin'];
                if (in_array($roleName, $exemptRoles)) {
                    return false;
                }
            }
        }

        // Rule 4: Skip Department Manager Review if Initiator is Manager/Head
        $roles = (array) $step->role;
        $lowerRoles = array_map('strtolower', $roles);
        if (in_array('manager', $lowerRoles)) {
            $initiator = $contract->initiator;
            if ($initiator) {
                $initiatorRole = strtolower($initiator->role ?: ($initiator->role()->first()->name ?? ''));
                $exemptRoles = ['manager', 'vp', 'ceo', 'director', 'admin'];
                if (in_array($initiatorRole, $exemptRoles)) {
                    $targetDeptIds = $step->department_ids;
                    if (empty($targetDeptIds) || in_array($initiator->department_id, $targetDeptIds)) {
                        return false;
                    }
                }
            }
        }

        // Rules 5 & 6: Skip Tax Review under certain conditions
        $queryService = property_exists($this, 'queryService') ? $this->queryService : app(\App\Services\ContractWorkflowQueryService::class);
        if ($queryService && $queryService->isTaxStep($step)) {
            // Rule 5: Skip Tax Review if Contract Price < 1,000,000 IDR
            $priceStr = $contract->f2_price ?? '';
            $price = $this->parsePrice($priceStr);
            if ($price < 1000000) {
                return false;
            }

            // Rule 6: Skip Tax Review for Specific Entities
            $companyCode = $contract->initiator?->company()->first()?->code;
            if (in_array(strtoupper($companyCode), ['LTI', 'LTX', 'LTS'])) {
                return false;
            }
        }

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
            $roleName = $contract->initiator->getAttribute('role') ?: ($contract->initiator->role()->first()->name ?? '');

            // Bypass logic: Skip Step 1 if submitted by Legal/Admin for others (Helper Mode)
            $creator = Auth::user();
            $isLegal = $creator && ($creator->department?->code === 'LGL' || $creator->role === 'Admin');
            $isHelper = $contract->initiated_by_id && $contract->initiated_by_id !== $contract->created_by;

            if ($isLegal && $isHelper) {
                return false; // Bypass departmental review
            }

            return strtolower($roleName) === 'staff';
        }

        // Condition: Skip if initiator is Legal (used for Manager step)
        if (str_contains($condition, 'initiator_not_legal')) {
            return $contract->initiator->department?->code !== 'LGL';
        }

        // Condition: Skip Management if Initiator is already Management/Direksi
        if (str_contains($condition, 'initiator_not_manager')) {
            $initiatorRoleName = $contract->initiator->getAttribute('role') ?: ($contract->initiator->role()->first()->name ?? '');
            $roleName = strtolower($initiatorRoleName);
            $exemptRoles = ['manager', 'director', 'direktur', 'direksi', 'admin'];

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
        if (empty($price)) {
            return 0.0;
        }
        $clean = preg_replace('/[^\d.,]/', '', $price);
        $hasDot = str_contains($clean, '.');
        $hasComma = str_contains($clean, ',');

        if ($hasDot && $hasComma) {
            if (strpos($clean, '.') < strpos($clean, ',')) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasComma) {
            if (preg_match('/,\d{2}$/', $clean)) {
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasDot) {
            if (substr_count($clean, '.') > 1) {
                $clean = str_replace('.', '', $clean);
            } else {
                if (preg_match('/\.\d{3}$/', $clean)) {
                    $clean = str_replace('.', '', $clean);
                }
            }
        }

        return (float) $clean;
    }

    /**
     * Handles automatic approval if the current user is also an approver for the next step(s).
     * Prevents redundant work for the same person in consecutive review steps.
     */
    private function handleAutoApproval(Contract $contract, ?User $user): void
    {
        if (! $user) {
            return;
        }

        $pendingApprovals = $contract->approvals()
            ->where('workflow_step_id', $contract->workflow_step_id)
            ->where('status', 'pending')
            ->where('user_id', $user->id)
            ->get();

        foreach ($pendingApprovals as $approval) {
            $step = $approval->workflowStep;
            $skipCategories = ['signing', 'upload', 'joint_upload'];
            if (! in_array(strtolower($step->step_category ?? ''), $skipCategories)) {
                $this->approveContract($contract, $approval, 'Sistem: Persetujuan Otomatis (Sama dengan penyetujui/inisiator sebelumnya)');
            }
        }
    }
}
