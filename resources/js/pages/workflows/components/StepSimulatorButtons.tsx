import { useToast } from '@/components/ui/feedback/Toast';
import { cn } from '@/lib/utils';
import { MASTER_ACTIONS, getActionTheme } from '../constants';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/dialogs/Popover';
import { Play, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';

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
            className="inline-flex items-center"
        >
            <Popover className="relative">
                {({ close }) => (
                    <>
                        <PopoverTrigger
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="relative flex h-7 items-center justify-center gap-1 px-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer select-none"
                            title={`Simulasi Alur Aksi (${buttons.length} aksi)`}
                        >
                            <Play size={11} className="fill-current" />
                            <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-md bg-emerald-500 text-[9.5px] font-medium text-white shadow-2xs leading-none">
                                {buttons.length}
                            </span>
                        </PopoverTrigger>

                        <PopoverContent
                            align="end"
                            className="w-72 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl space-y-2 z-[9999]"
                        >
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-zinc-800/80 px-1">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-primary" />
                                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                                        Simulasi Alur Aksi
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    Tahap #{idx + 1}
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 px-1">
                                Klik salah satu aksi di bawah untuk menguji simulasi alur / form modal aksi:
                            </p>

                            <div className="space-y-1 pt-1 max-h-60 overflow-y-auto">
                                {buttons.map((btn, bIdx) => (
                                    <button
                                        key={bIdx}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            close();
                                            if (['approve', 'reject', 'assign_pic', 'sign', 'forward'].includes(btn.actionType)) {
                                                setActiveModal(btn.actionType as any);
                                            } else {
                                                showToast(
                                                    `Simulasi: Menjalankan aksi "${btn.label}" (${btn.tooltip}). Kolom Wajib: ${(btn.act.required_fields || []).join(', ') || '-'}`,
                                                    'success',
                                                );
                                            }
                                        }}
                                        className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left group/item border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-800 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn(
                                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-2xs",
                                                btn.color
                                            )}>
                                                <btn.icon size={11} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate group-hover/item:text-primary transition-colors">
                                                    {btn.label}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                                                    {btn.tooltip}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight size={12} className="text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </>
                )}
            </Popover>
        </div>
    );
}
