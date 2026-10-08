import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/dialogs/Popover';
import { useToast } from '@/components/ui/feedback/Toast';
import { cn } from '@/lib/utils';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { MASTER_ACTIONS, getActionTheme } from '../constants';

interface StepSimulatorButtonsProps {
    actions: any[];
    idx: number;
    totalSteps: number;
    allWorkflows: any[];
    allWorkflowSteps: any[];
    setActiveModal: (actionType: any, action?: any) => void;
}

export function StepSimulatorButtons({ actions, idx, totalSteps, allWorkflows, allWorkflowSteps, setActiveModal }: StepSimulatorButtonsProps) {
    const { showToast } = useToast();

    if (!actions || actions.length === 0) {
        return null;
    }

    const buttons: any[] = [];

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
        const tc = act.transition_config;

        if (tc && typeof tc === 'object') {
            if (tc.type === 'cross_workflow' || tc.type === 'origin_return') {
                const wfId = tc.workflow_id;
                if (wfId === 'origin_workflow' || !wfId) {
                    tooltip = 'Kembali ke Workflow Asal (Origin)';
                } else {
                    const targetWfName = allWorkflows.find((w: any) => String(w.id) === String(wfId))?.name || 'Sub-Workflow';
                    const targetSeq = tc.sequence ? ` (Tahap ${tc.sequence})` : '';
                    tooltip = `Lompat ke Workflow: ${targetWfName}${targetSeq}`;
                }
            } else if (tc.type === 'absolute') {
                const targetStep =
                    tc.step_id || act.next_step_id
                        ? allWorkflowSteps.find((s: any) => String(s.id) === String(tc.step_id || act.next_step_id))
                        : allWorkflowSteps.find((s: any) => Number(s.step) === Number(tc.sequence));
                const targetSeq = targetStep?.step ?? tc.sequence ?? 1;
                tooltip = `Lompat ke Tahap ${targetSeq}`;
            } else if (tc.type === 'initial_step') {
                tooltip = 'Kembali ke Tahap Awal (#1)';
            } else if (tc.type === 'relative') {
                const offset = Number(tc.offset ?? 1);
                if (offset === 1) {
                    tooltip = idx + 2 > totalSteps ? 'Selesai / Final' : `Lanjut ke Tahap ${idx + 2}`;
                } else if (offset === 0) {
                    tooltip = `Tetap di Tahap ${idx + 1}`;
                } else if (offset === -1) {
                    tooltip = idx > 0 ? `Kembali ke Tahap ${idx}` : 'Kembali ke Tahap 1';
                } else if (offset > 1) {
                    tooltip = `Lompat maju ke Tahap ${idx + 1 + offset}`;
                } else if (offset < -1) {
                    tooltip = `Lompat mundur ke Tahap ${Math.max(1, idx + 1 + offset)}`;
                }
            }
        }

        if (!tooltip) {
            if (act.next_workflow_id) {
                const targetWfName = allWorkflows.find((w: any) => w.id === act.next_workflow_id)?.name || 'Workflow Lain';
                tooltip = `Lompat ke Workflow: ${targetWfName}`;
            } else if (act.next_step_id) {
                const targetStepIdx = allWorkflowSteps.findIndex((s) => s.id === act.next_step_id);
                tooltip = `Lompat ke Tahap ${targetStepIdx !== -1 ? targetStepIdx + 1 : 'Kustom'}`;
            } else {
                tooltip = idx + 2 > totalSteps ? 'Selesai / Final' : `Lanjut ke Tahap ${idx + 2}`;
            }
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
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
            <Popover className="relative">
                {({ close }) => (
                    <>
                        <PopoverTrigger
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="relative flex h-7 cursor-pointer items-center justify-center gap-1 rounded-md px-1.5 text-emerald-600 transition-all select-none hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                            title={`Simulasi Alur Aksi (${buttons.length} aksi)`}
                        >
                            <Play size={11} className="fill-current" />
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-md bg-emerald-500 px-1 text-[9.5px] leading-none font-medium text-white shadow-2xs">
                                {buttons.length}
                            </span>
                        </PopoverTrigger>

                        <PopoverContent
                            align="end"
                            className="z-[9999] w-72 space-y-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-1.5 dark:border-zinc-800/80">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-primary" />
                                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">Simulasi Alur Aksi</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Tahap #{idx + 1}</span>
                            </div>

                            <p className="px-1 text-[11px] text-slate-500 dark:text-zinc-400">
                                Klik salah satu aksi di bawah untuk menguji simulasi alur / form modal aksi:
                            </p>

                            <div className="max-h-60 space-y-1 overflow-y-auto pt-1">
                                {buttons.map((btn, bIdx) => (
                                    <button
                                        key={bIdx}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            close();
                                            if (['approve', 'reject', 'assign_pic', 'add_adhoc'].includes(btn.actionType)) {
                                                setActiveModal(btn.actionType as any, btn.act);
                                            } else {
                                                showToast(
                                                    `Simulasi: Menjalankan aksi "${btn.label}" (${btn.tooltip}). Kolom Wajib: ${(btn.act.required_fields || []).join(', ') || '-'}`,
                                                    'success',
                                                );
                                            }
                                        }}
                                        className="group/item flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-slate-200/60 hover:bg-slate-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div
                                                className={cn(
                                                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-2xs',
                                                    btn.color,
                                                )}
                                            >
                                                <btn.icon size={11} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="group-hover/item:text-primary truncate text-xs font-bold text-slate-800 transition-colors dark:text-zinc-200">
                                                    {btn.label}
                                                </div>
                                                <div className="truncate text-[10px] text-slate-500 dark:text-zinc-400">{btn.tooltip}</div>
                                            </div>
                                        </div>
                                        <ArrowRight
                                            size={12}
                                            className="shrink-0 text-slate-400 opacity-0 transition-opacity group-hover/item:opacity-100"
                                        />
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
