import { useMemo, useState } from 'react';
import { MASTER_ACTIONS } from '../constants';

export function useWorkflowStepState({ step, idx, updateLocalStep }: { step: any; idx: number; updateLocalStep: (idx: number, data: any) => void }) {
    const [activeModal, setActiveModal] = useState<'approve' | 'reject' | 'assign_pic' | 'sign' | 'forward' | null>(null);

    const parsedCondition = useMemo(() => {
        const key = step.meta?.condition_key ?? '';
        const op = step.meta?.condition_operator ?? '';
        const val = step.meta?.condition_value ?? '';

        if (key || op || val) {
            return { key, operator: op || 'truthy', value: val };
        }

        const expr = step.condition_expression || '';
        if (!expr || expr === 'METADATA_KEY') {
            return { key: '', operator: 'truthy', value: '' };
        }

        const operators = ['==', '!=', '>', '<', 'contains'];
        for (const o of operators) {
            if (expr.includes(` ${o} `)) {
                const parts = expr.split(` ${o} `);
                return { key: parts[0].trim(), operator: o, value: parts[1].trim() };
            } else if (expr.includes(o)) {
                const parts = expr.split(o);
                return { key: parts[0].trim(), operator: o, value: parts[1].trim() };
            }
        }
        return { key: expr.trim(), operator: 'truthy', value: '' };
    }, [step.condition_expression, step.meta]);

    const handleConditionChange = (updates: { key?: string; operator?: string; value?: string }) => {
        const nextKey = updates.key !== undefined ? updates.key : parsedCondition.key;
        const nextOp = updates.operator !== undefined ? updates.operator : parsedCondition.operator;
        const nextVal = updates.value !== undefined ? updates.value : parsedCondition.value;

        let expr = '';
        if (nextOp === 'truthy') {
            expr = nextKey;
        } else {
            expr = `${nextKey} ${nextOp} ${nextVal}`;
        }

        updateLocalStep(idx, {
            condition_expression: expr,
            meta: {
                ...(step.meta || {}),
                condition_key: nextKey,
                condition_operator: nextOp,
                condition_value: nextVal,
            },
        });
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

    const addAction = () => {
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
        const actionToClone = actions[actionIdx];
        if (!actionToClone) return;
        const cloned = JSON.parse(JSON.stringify(actionToClone));
        cloned.id = `new-action-${Date.now()}`;
        const next = [...actions];
        next.splice(actionIdx + 1, 0, cloned);
        updateLocalStep(idx, {
            actions: next,
            allowed_actions: next.map((a: any) => a.master_action?.code || a.master_action_name?.toLowerCase()).filter(Boolean),
        });
    };

    return {
        activeModal,
        setActiveModal,
        parsedCondition,
        handleConditionChange,
        actions,
        addAction,
        updateAction,
        removeAction,
        cloneAction,
    };
}
