import { useMemo, useState } from 'react';
import { MASTER_ACTIONS } from '../utils/constants';

export function useWorkflowStepState({ step, idx, updateLocalStep }: { step: any; idx: number; updateLocalStep: (idx: number, data: any) => void }) {
    const [activeModal, setActiveModalState] = useState<'approve' | 'reject' | 'assign_pic' | 'add_adhoc' | null>(null);
    const [activeActionForModal, setActiveActionForModal] = useState<any>(null);

    const setActiveModal = (type: 'approve' | 'reject' | 'assign_pic' | 'add_adhoc' | null, action?: any) => {
        setActiveModalState(type);
        setActiveActionForModal(action || null);
    };

    const conditionMatch: 'any' | 'all' = useMemo(() => {
        if (step.meta?.condition_match === 'any' || step.meta?.condition_match === 'all') {
            return step.meta.condition_match;
        }
        if (typeof step.condition_expression === 'string' && step.condition_expression.includes('||')) {
            return 'any';
        }
        return 'all';
    }, [step.meta?.condition_match, step.condition_expression]);

    const conditions = useMemo<Array<{ key: string; operator: string; value: string; logic?: 'AND' | 'OR' }>>(() => {
        // 1. Direct array in meta
        if (Array.isArray(step.meta?.conditions) && step.meta.conditions.length > 0) {
            return step.meta.conditions.map((c: any) => ({
                key: c.key || '',
                operator: c.operator || 'truthy',
                value: c.value ?? '',
                logic: c.logic === 'OR' || c.connector === 'OR' ? 'OR' : 'AND',
            }));
        }

        // 2. Parse from condition_expression if compound (|| or &&)
        const expr = (step.condition_expression || '').trim();
        if (expr && expr !== 'METADATA_KEY') {
            const hasOr = expr.includes('||');
            const hasAnd = expr.includes('&&');
            if (hasOr || hasAnd) {
                // Tokenize by || and &&
                const tokens = expr.split(/(\s*\|\|\s*|\s*&&\s*)/);
                const parsed: Array<{ key: string; operator: string; value: string; logic?: 'AND' | 'OR' }> = [];
                let currentLogic: 'AND' | 'OR' = 'AND';

                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i].trim();
                    if (token === '||') {
                        currentLogic = 'OR';
                    } else if (token === '&&') {
                        currentLogic = 'AND';
                    } else if (token) {
                        const operators = ['==', '!=', '>', '<', 'contains'];
                        let matched = false;
                        for (const o of operators) {
                            if (token.includes(` ${o} `)) {
                                const [k, ...vParts] = token.split(` ${o} `);
                                parsed.push({ key: k.trim(), operator: o, value: vParts.join(` ${o} `).trim(), logic: currentLogic });
                                matched = true;
                                break;
                            } else if (token.includes(o)) {
                                const [k, ...vParts] = token.split(o);
                                parsed.push({ key: k.trim(), operator: o, value: vParts.join(o).trim(), logic: currentLogic });
                                matched = true;
                                break;
                            }
                        }
                        if (!matched) {
                            parsed.push({ key: token, operator: 'truthy', value: '', logic: currentLogic });
                        }
                    }
                }

                if (parsed.length > 0) {
                    return parsed;
                }
            }
        }

        // 3. Fallback to single condition (legacy meta or simple condition_expression)
        const key = step.meta?.condition_key ?? '';
        const op = step.meta?.condition_operator ?? '';
        const val = step.meta?.condition_value ?? '';

        if (key || op || val) {
            return [{ key, operator: op || 'truthy', value: val, logic: 'AND' }];
        }

        if (expr && expr !== 'METADATA_KEY') {
            const operators = ['==', '!=', '>', '<', 'contains'];
            for (const o of operators) {
                if (expr.includes(` ${o} `)) {
                    const [k, ...vParts] = expr.split(` ${o} `);
                    return [{ key: k.trim(), operator: o, value: vParts.join(` ${o} `).trim(), logic: 'AND' }];
                } else if (expr.includes(o)) {
                    const [k, ...vParts] = expr.split(o);
                    return [{ key: k.trim(), operator: o, value: vParts.join(o).trim(), logic: 'AND' }];
                }
            }
            return [{ key: expr.trim(), operator: 'truthy', value: '', logic: 'AND' }];
        }

        return [{ key: '', operator: 'truthy', value: '', logic: 'AND' }];
    }, [step.condition_expression, step.meta]);

    const serializeConditionsToExpr = (
        rules: Array<{ key: string; operator: string; value: string; logic?: 'AND' | 'OR' }>,
        match: 'any' | 'all',
    ) => {
        const valid = rules.filter((r) => r.key && r.key.trim() !== '');
        if (valid.length === 0) return '';
        let expr = '';
        valid.forEach((r, idx) => {
            const k = r.key.trim();
            const op = r.operator || 'truthy';
            const v = (r.value ?? '').toString().trim();
            const clause = op === 'truthy' ? k : `${k} ${op} ${v}`.trim();
            if (idx === 0) {
                expr = clause;
            } else {
                const connector = r.logic === 'OR' ? ' || ' : (r.logic === 'AND' ? ' && ' : (match === 'any' ? ' || ' : ' && '));
                expr += `${connector}${clause}`;
            }
        });
        return expr;
    };

    const updateConditions = (
        newConditions: Array<{ key: string; operator: string; value: string; logic?: 'AND' | 'OR' }>,
        newMatch: 'any' | 'all' = conditionMatch,
    ) => {
        const expr = serializeConditionsToExpr(newConditions, newMatch);
        const first = newConditions[0] || { key: '', operator: 'truthy', value: '', logic: 'AND' };

        updateLocalStep(idx, {
            condition_expression: expr || (newConditions.length > 0 && newConditions[0].key ? newConditions[0].key : 'METADATA_KEY'),
            meta: {
                ...(step.meta || {}),
                conditions: newConditions,
                condition_match: newMatch,
                condition_key: first.key || null,
                condition_operator: first.operator || null,
                condition_value: first.value || null,
            },
        });
    };

    const addCondition = () => {
        const next = [...conditions, { key: '', operator: 'truthy', value: '', logic: 'AND' as const }];
        updateConditions(next, conditionMatch);
    };

    const removeCondition = (index: number) => {
        if (conditions.length <= 1) {
            updateConditions([{ key: '', operator: 'truthy', value: '', logic: 'AND' }], conditionMatch);
            return;
        }
        const next = conditions.filter((_, i) => i !== index);
        updateConditions(next, conditionMatch);
    };

    const updateConditionAt = (index: number, updates: Partial<{ key: string; operator: string; value: string; logic: 'AND' | 'OR' }>) => {
        const next = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c));
        updateConditions(next, conditionMatch);
    };

    const setConditionMatch = (match: 'any' | 'all') => {
        updateConditions(conditions, match);
    };

    const parsedCondition = conditions[0] || { key: '', operator: 'truthy', value: '' };

    const handleConditionChange = (updates: { key?: string; operator?: string; value?: string }) => {
        updateConditionAt(0, updates);
    };

    const actions = useMemo(() => {
        if (step.actions && step.actions.length > 0) {
            return step.actions;
        }
        if (!step.allowed_actions || step.allowed_actions.length === 0) {
            return [];
        }
        return step.allowed_actions.map((actCode: string, index: number) => {
            const code = actCode.toLowerCase();
            const matchedMaster = MASTER_ACTIONS.find((ma: any) => ma.code === code);
            return {
                id: `legacy-${code}-${index}`,
                master_action_id: matchedMaster?.id || '',
                master_action: matchedMaster || { id: '', name: actCode.toUpperCase(), code },
                next_step_id: null,
                next_workflow_id: null,
                next_workflow_step_id: null,
                required_fields: [],
                autofilled_fields: [],
                alias: '',
                description: '',
            };
        });
    }, [step.actions, step.allowed_actions]);

    const hasAutoAction = useMemo(() => {
        return actions.some((a: any) => {
            const code = (a.action_code || a.master_action?.code || a.master_action_name || '').toLowerCase();
            return code === 'auto' || code === 'automation';
        });
    }, [actions]);

    const addAction = () => {
        if (hasAutoAction) return;
        const next = [
            ...actions,
            {
                id: `new-action-${Date.now()}`,
                master_action_id: '',
                master_action_name: '',
                is_active: true,
                next_step_id: null,
                next_workflow_id: null,
                next_workflow_step_id: null,
                required_fields: [],
                autofilled_fields: [],
                alias: '',
                description: '',
            },
        ];
        updateLocalStep(idx, {
            actions: next,
            allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean),
        });
    };

    const updateAction = (actionIdx: number, data: any) => {
        const next = [...actions];
        next[actionIdx] = { ...next[actionIdx], ...data };
        updateLocalStep(idx, {
            actions: next,
            allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean),
        });
    };

    const removeAction = (actionIdx: number) => {
        const next = actions.filter((_: any, i: number) => i !== actionIdx);
        updateLocalStep(idx, {
            actions: next,
            allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean),
        });
    };

    const cloneAction = (actionIdx: number) => {
        if (hasAutoAction) return;
        const actionToClone = actions[actionIdx];
        if (!actionToClone) return;
        const code = (actionToClone.action_code || actionToClone.master_action?.code || actionToClone.master_action_name || '').toLowerCase();
        if (code === 'auto' || code === 'automation') return;
        const cloned = JSON.parse(JSON.stringify(actionToClone));
        cloned.id = `new-action-${Date.now()}`;
        const next = [...actions];
        next.splice(actionIdx + 1, 0, cloned);
        updateLocalStep(idx, {
            actions: next,
            allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean),
        });
    };

    const moveAction = (actionIdx: number, direction: 'up' | 'down') => {
        const targetIdx = direction === 'up' ? actionIdx - 1 : actionIdx + 1;
        if (targetIdx < 0 || targetIdx >= actions.length) return;
        const next = [...actions];
        const [movedItem] = next.splice(actionIdx, 1);
        next.splice(targetIdx, 0, movedItem);
        updateLocalStep(idx, {
            actions: next,
            allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean),
        });
    };

    return {
        activeModal,
        setActiveModal,
        activeActionForModal,
        conditions,
        conditionMatch,
        updateConditions,
        addCondition,
        removeCondition,
        updateConditionAt,
        setConditionMatch,
        parsedCondition,
        handleConditionChange,
        actions,
        addAction,
        updateAction,
        removeAction,
        cloneAction,
        moveAction,
    };
}
