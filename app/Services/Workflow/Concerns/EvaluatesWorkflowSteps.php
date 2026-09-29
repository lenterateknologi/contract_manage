<?php

namespace App\Services\Workflow\Concerns;

use App\Http\Formatters\ContractFormatter;
use App\Models\Contract;
use App\Models\WorkflowStep;

trait EvaluatesWorkflowSteps
{
    /**
     * Finds the next step in the sequence that satisfies its entry conditions.
     */
    public function findNextValidStep(Contract $contract, WorkflowStep $currentStep): ?WorkflowStep
    {
        $allSteps = WorkflowStep::where('workflow_id', $currentStep->workflow_id)
            ->where('step', '>', $currentStep->step)
            ->where('is_active', true)
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
        if ($step->is_active === false || (isset($step->getAttributes()['is_active']) && ! $step->getAttributes()['is_active'])) {
            return false;
        }

        if ($step->getAttributes()['is_optional'] ?? false) {
            return false;
        }

        if (($step->getAttributes()['step_category'] ?? '') === 'decision') {
            return false;
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

        return true;
    }

    /**
     * Parse a formatted price string into a float.
     */
    public function parsePrice(?string $price): float
    {
        return ContractFormatter::parsePrice($price);
    }
}
