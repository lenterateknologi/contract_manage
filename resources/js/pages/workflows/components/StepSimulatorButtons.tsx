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
        let code = act.action_code || act.code || '';
        let name = act.alias || act.label || '';

        if (act.master_action_id) {
            const ma = MASTER_ACTIONS.find((m: any) => m.id === act.master_action_id || m.code === act.action_code);
            if (ma) {
                code = code || ma.code;
                name = name || ma.name;
            }
        } else if (act.master_action) {
            code = code || act.master_action.code || act.master_action.name?.toLowerCase();
            name = name || act.master_action.name;
        }

        if (!code && act.name) {
            code = act.name.toLowerCase();
        }
        if (!name) {
            name = act.name || act.label || `Aksi`;
        }

        if (name.toLowerCase().includes('setuju') || name.toLowerCase().includes('approve')) code = 'approve';
        else if (name.toLowerCase().includes('tolak') || name.toLowerCase().includes('reject')) code = 'reject';
        else if (name.toLowerCase().includes('tugas') || name.toLowerCase().includes('assign')) code = 'assign';

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
        <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 flex-wrap"
        >
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
                        'inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-semibold text-white uppercase shadow-none transition-all hover:scale-105 active:scale-95',
                        btn.color,
                    )}
                >
                    <btn.icon size={10} className="opacity-90" />
                    <span>{btn.label}</span>
                </button>
            ))}
        </div>
    );
}
