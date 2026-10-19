<?php

namespace App\Services\Workflow\Concerns;

use App\Http\Formatters\ContractFormatter;
use App\Models\Master\WorkflowStep;
use App\Models\Transaction\Contract;

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

        // Check if there are structured meta conditions (indexed list)
        if (! empty($meta['conditions']) && is_array($meta['conditions'])) {
            $validConditions = array_values(array_filter($meta['conditions'], fn ($c) => ! empty($c['key'])));

            if (! empty($validConditions)) {
                $accumulated = null;

                foreach ($validConditions as $i => $cond) {
                    $cKey = $cond['key'] ?? '';
                    $cOp = $cond['operator'] ?? 'truthy';
                    $cVal = $cond['value'] ?? '';

                    $passed = $this->evaluateConditionExpression($contract, $cKey, $cOp, $cVal);

                    if ($accumulated === null) {
                        $accumulated = $passed;
                    } else {
                        $logic = strtoupper(trim((string) ($cond['logic'] ?? ($cond['connector'] ?? ''))));
                        if (empty($logic)) {
                            $logic = ($meta['condition_match'] ?? 'all') === 'any' ? 'OR' : 'AND';
                        }

                        if ($logic === 'OR' || $logic === '||') {
                            $accumulated = $accumulated || $passed;
                        } else {
                            $accumulated = $accumulated && $passed;
                        }
                    }
                }

                return (bool) $accumulated;
            }
        }

        // Check if there is a single structured meta condition
        if (! empty($meta['condition_key'])) {
            $key = $meta['condition_key'];
            $operator = $meta['condition_operator'] ?? 'truthy';
            $expected = $meta['condition_value'] ?? '';

            if (! $this->evaluateConditionExpression($contract, $key, $operator, $expected)) {
                return false;
            }
        }

        // Dynamic Meta Key logic: if condition is set and not a special 'initiator_' keyword
        if (! empty($condition) && ! str_starts_with($condition, 'initiator_')) {
            // If condition_key in meta already handled, skip redundant check if identical
            if (! empty($meta['condition_key']) && trim($condition) === trim($meta['condition_key'])) {
                return true;
            }

            if (! $this->evaluateConditionExpression($contract, $condition)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Evaluate condition expression supporting logical OR (||) and AND (&&)
     */
    public function evaluateConditionExpression(Contract $contract, string $expression, string $defaultOperator = 'truthy', mixed $defaultExpected = ''): bool
    {
        // Check for logical OR (||)
        if (str_contains($expression, '||')) {
            $subExpressions = explode('||', $expression);
            foreach ($subExpressions as $subExpr) {
                if ($this->evaluateConditionExpression($contract, trim($subExpr), $defaultOperator, $defaultExpected)) {
                    return true;
                }
            }

            return false;
        }

        // Check for logical AND (&&)
        if (str_contains($expression, '&&')) {
            $subExpressions = explode('&&', $expression);
            foreach ($subExpressions as $subExpr) {
                if (! $this->evaluateConditionExpression($contract, trim($subExpr), $defaultOperator, $defaultExpected)) {
                    return false;
                }
            }

            return true;
        }

        // Single expression evaluation
        $key = trim($expression);
        $operator = $defaultOperator;
        $expected = $defaultExpected;

        foreach (['==', '!=', '>', '<', 'contains'] as $op) {
            if (str_contains($expression, " {$op} ")) {
                $parts = explode(" {$op} ", $expression);
                $key = trim($parts[0]);
                $operator = $op;
                $expected = trim($parts[1]);

                break;
            } elseif (str_contains($expression, $op)) {
                $parts = explode($op, $expression);
                $key = trim($parts[0]);
                $operator = $op;
                $expected = trim($parts[1]);

                break;
            }
        }

        $actual = $this->resolveDynamicValue($contract, $key);

        if ($operator === 'truthy') {
            $falsyValues = [false, 'false', 0, '0', '', null, 'tidak', 'no', 'off', 'non pkp', 'non-pkp', '-'];
            if (is_string($actual)) {
                return ! in_array(strtolower(trim($actual)), $falsyValues, true);
            }

            return ! in_array($actual, $falsyValues, true);
        }

        switch ($operator) {
            case '==':
                $actualStr = is_bool($actual) ? ($actual ? 'true' : 'false') : (string) $actual;

                return $actualStr === (string) $expected ||
                       (in_array($expected, ['true', '1', 'yes', 'pkp'], true) && in_array(strtolower($actualStr), ['true', '1', 'on', 'yes', 'pkp'], true)) ||
                       (in_array($expected, ['false', '0', 'no', 'non pkp'], true) && in_array(strtolower($actualStr), ['false', '0', 'off', 'no', 'non pkp', 'non-pkp', ''], true));
            case '!=':
                $actualStr = is_bool($actual) ? ($actual ? 'true' : 'false') : (string) $actual;

                return $actualStr !== (string) $expected &&
                       ! (in_array($expected, ['true', '1', 'yes', 'pkp'], true) && in_array(strtolower($actualStr), ['true', '1', 'on', 'yes', 'pkp'], true)) &&
                       ! (in_array($expected, ['false', '0', 'no', 'non pkp'], true) && in_array(strtolower($actualStr), ['false', '0', 'off', 'no', 'non pkp', 'non-pkp', ''], true));
            case '>':
                return (float) $actual > (float) $expected;
            case '<':
                return (float) $actual < (float) $expected;
            case 'contains':
                return $actual !== null && str_contains(strtolower((string) $actual), strtolower((string) $expected));
            default:
                return ! empty($actual);
        }
    }

    /**
     * General dynamic value resolver for workflow condition keys.
     * Evaluates metadata, direct model attributes, relationships via dot-notation,
     * and dynamic contract context.
     */
    public function resolveDynamicValue(Contract $contract, string $key): mixed
    {
        // 1. Dynamic context: contract tax determination (Kena Pajak vs Tidak Kena Pajak)
        if ($key === 'contract.has_tax' || $key === 'has_tax') {
            $isP1 = (bool) $contract->tax_required;
            if ($isP1) {
                $firstPartyId = $contract->first_party_id ?? data_get($contract->metadata, 'first_party_id');
                if ($firstPartyId && $firstPartyId !== 'internal') {
                    $p1Vendor = \App\Models\Master\Vendor::find($firstPartyId);
                    if ($p1Vendor) {
                        return (bool) ($p1Vendor->is_pkp || ($p1Vendor->detail['tax']['typePkp'] ?? '') === 'PKP');
                    }
                }

                return false;
            }

            // Pihak II selected (default)
            $vendor = $contract->vendor;
            if (! $vendor) {
                $vendorId = $contract->vendor_id ?? (data_get($contract->metadata, 'second_party_id') ?? data_get($contract->metadata, 'p2_vendor_id'));
                if ($vendorId && $vendorId !== 'internal') {
                    $vendor = \App\Models\Master\Vendor::find($vendorId);
                }
            }

            return (bool) ($vendor?->is_pkp || ($vendor?->detail['tax']['typePkp'] ?? '') === 'PKP');
        }

        // 2. Direct model property or relationship via dot-notation (e.g. vendor.is_pkp, creator.name, price)
        $val = data_get($contract, $key);
        if ($val !== null) {
            return $val;
        }

        // 3. Dynamic metadata key (e.g. meta_*, custom template fields, form submissions)
        return data_get($contract->metadata, $key);
    }

    /**
     * Parse a formatted price string into a float.
     */
    public function parsePrice(?string $price): float
    {
        return ContractFormatter::parsePrice($price);
    }
}
