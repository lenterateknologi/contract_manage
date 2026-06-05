import { useToast } from '@/components/ui/feedback/Toast';
import { cn } from '@/lib/utils';
import { MASTER_ACTIONS, getActionTheme } from '../constants';

interface StepSimulatorButtonsProps {
    actions: any[];
    idx: number;
    totalSteps: number;
    allWorkflows: any[];
    allWorkflowSteps: any[];
    setActiveModal: (actionType: any) => void;
}

export function StepSimulatorButtons({ actions, idx, totalSteps, allWorkflows, allWorkflowSteps, setActiveModal }: StepSimulatorButtonsProps) {
    const { showToast } = useToast();

    if (!actions || actions.length === 0) {
        return null;
    }

    const buttons = [];

    for (const act of actions) {
        let code = '';
        let name = '';
        if (act.master_action_id) {
            const ma = MASTER_ACTIONS.find((m: any) => m.id === act.master_action_id || m.code === act.action_code);
            code = ma?.code || '';
            name = ma?.name || '';
        } else if (act.master_action_name) {
            code = act.master_action_name.toLowerCase();
            name = act.master_action_name;
        }

        if (!code) {
            continue;
        }

        const { color, icon, actionType } = getActionTheme(code);

        let tooltip = '';
        if (act.next_workflow_id) {
            const targetWfName = allWorkflows.find((w: any) => w.id === act.next_workflow_id)?.name || 'Workflow Lain';
            tooltip = `Lompat ke Workflow: ${targetWfName}`;
        } else if (act.next_step_id) {
            const targetStepIdx = allWorkflowSteps.findIndex((s) => s.id === act.next_step_id);
            tooltip = `Lompat ke Tahap ${targetStepIdx !== -1 ? targetStepIdx + 1 : 'Kustom'}`;
        } else {
            tooltip = idx + 2 > totalSteps ? 'Selesai / Final' : `Lanjut ke Tahap ${idx + 2}`;
        }

        buttons.push({
            label: act.alias || name,
            actionType,
            color,
            icon,
            tooltip: act.description || tooltip,
            act,
        });
    }

    if (buttons.length === 0) {
        return null;
    }

    return (
        <div className="ml-4 flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-800">
            <span className="text-[8px] font-semibold  text-slate-400 uppercase">Simulasi:</span>
            <div className="flex flex-wrap items-center gap-1.5">
                {buttons.map((btn, bIdx) => (
                    <button
                        key={bIdx}
                        type="button"
                        title={btn.tooltip}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (['approve', 'reject', 'assign_pic', 'sign', 'forward'].includes(btn.actionType)) {
                                setActiveModal(btn.actionType as any);
                            } else {
                                showToast(
                                    `Simulasi: Menjalankan aksi "${btn.label}" (${btn.tooltip}). Kolom Wajib: ${(btn.act.required_fields || []).join(', ') || '-'}`,
                                    'success',
                                );
                            }
                        }}
                        className={cn(
                            'flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold text-white uppercase shadow-sm transition-all hover:scale-105 active:scale-95',
                            btn.color,
                        )}
                    >
                        <btn.icon size={10} className="opacity-80" />
                        <span>{btn.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
