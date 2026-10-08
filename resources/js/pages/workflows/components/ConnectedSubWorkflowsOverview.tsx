import { ArrowRight, ExternalLink, GitFork } from 'lucide-react';
import React, { useMemo } from 'react';

interface ConnectedSubWorkflowsOverviewProps {
    workflow?: any;
    steps: any[];
    allWorkflows: any[];
}

export const ConnectedSubWorkflowsOverview: React.FC<ConnectedSubWorkflowsOverviewProps> = ({ workflow, steps = [], allWorkflows = [] }) => {
    const connectedData = useMemo(() => {
        const currentWfId = String(workflow?.id || '');
        const map = new Map<
            string,
            {
                targetWf: any;
                transitions: {
                    sourceStepNum: number;
                    sourceStepLabel: string;
                    actionAlias: string;
                    actionCode: string;
                    targetSeq: number;
                }[];
            }
        >();

        // 1. Scan outgoing cross_workflow transitions from current workflow steps
        steps.forEach((st: any) => {
            const stepNum = Number(st.step) || 1;
            const stepLabel = st.label || st.description || `Tahap ${stepNum}`;

            (st.actions || []).forEach((act: any) => {
                let tc = act.transition_config;
                if (typeof tc === 'string') {
                    try {
                        tc = JSON.parse(tc);
                    } catch {
                        tc = null;
                    }
                }

                const targetWfId = String(tc?.workflow_id || act.next_workflow_id || '');
                const targetSeq = Number(tc?.sequence || 1);

                if (targetWfId && targetWfId !== currentWfId) {
                    const targetWf = allWorkflows.find((w: any) => String(w.id) === targetWfId);
                    if (targetWf) {
                        if (!map.has(targetWfId)) {
                            map.set(targetWfId, {
                                targetWf,
                                transitions: [],
                            });
                        }
                        map.get(targetWfId)!.transitions.push({
                            sourceStepNum: stepNum,
                            sourceStepLabel: stepLabel,
                            actionAlias: act.alias || act.label || act.action_code || 'Lanjut',
                            actionCode: String(act.action_code || 'approve'),
                            targetSeq,
                        });
                    }
                }
            });
        });

        // 2. Scan incoming transitions from other workflows pointing to current workflow
        allWorkflows.forEach((otherWf: any) => {
            const otherWfId = String(otherWf.id);
            if (otherWfId !== currentWfId && !map.has(otherWfId)) {
                const incomingTransitions: {
                    sourceStepNum: number;
                    sourceStepLabel: string;
                    actionAlias: string;
                    actionCode: string;
                    targetSeq: number;
                }[] = [];

                (otherWf.steps || []).forEach((ost: any) => {
                    (ost.actions || []).forEach((oact: any) => {
                        let otc = oact.transition_config;
                        if (typeof otc === 'string') {
                            try {
                                otc = JSON.parse(otc);
                            } catch {
                                otc = null;
                            }
                        }
                        if (String(otc?.workflow_id || oact.next_workflow_id || '') === currentWfId) {
                            incomingTransitions.push({
                                sourceStepNum: Number(ost.step) || 1,
                                sourceStepLabel: ost.label || ost.description || `Tahap ${ost.step}`,
                                actionAlias: oact.alias || oact.label || oact.action_code || 'Lanjut',
                                actionCode: String(oact.action_code || 'approve'),
                                targetSeq: Number(otc?.sequence || 1),
                            });
                        }
                    });
                });

                if (incomingTransitions.length > 0) {
                    map.set(otherWfId, {
                        targetWf: otherWf,
                        transitions: incomingTransitions,
                    });
                }
            }
        });

        return Array.from(map.values());
    }, [workflow?.id, steps, allWorkflows]);

    if (connectedData.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <GitFork size={18} />
                </div>
                <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Belum Ada Alur Kerja Terhubung</h4>
                <p className="text-muted-foreground mx-auto mt-0.5 max-w-md text-[11px]">
                    Untuk menghubungkan alur kerja, konfigurasikan aksi pada tahapan dengan tipe transisi <b>"Langkah ke Workflow N & Step N"</b>.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                        <GitFork size={13} />
                    </div>
                    <div>
                        <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100">
                            Ekosistem Alur Kerja Terhubung (Cross-Workflow)
                        </h4>
                        <p className="text-muted-foreground text-[10px]">Sub-alur yang terintegrasi langsung dengan alur kerja ini</p>
                    </div>
                </div>
                <span className="rounded-md border border-indigo-200/80 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {connectedData.length} Sub-Alur Terintegrasi
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {connectedData.map(({ targetWf, transitions }, idx) => {
                    const targetSteps = (targetWf?.steps || []).slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));

                    return (
                        <div
                            key={targetWf.id || idx}
                            className="group flex flex-col justify-between rounded-xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white p-3.5 shadow-2xs transition-all hover:shadow-md dark:border-indigo-900/60 dark:from-indigo-950/30 dark:to-zinc-900"
                        >
                            <div className="space-y-2.5">
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2 border-b border-indigo-100 pb-2.5 dark:border-indigo-900/40">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-[10px] font-bold text-white">
                                                {idx + 1}
                                            </span>
                                            <h5 className="truncate text-xs font-bold text-slate-900 dark:text-zinc-100" title={targetWf.name}>
                                                {targetWf.name}
                                            </h5>
                                        </div>
                                        {targetWf.contract_type?.name && (
                                            <p className="mt-0.5 truncate text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                                                Tipe: {targetWf.contract_type.name}
                                            </p>
                                        )}
                                    </div>

                                    <span className="shrink-0 rounded border border-slate-200 bg-white px-2 py-0.5 text-[9.5px] font-semibold text-slate-700 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                        {targetSteps.length} Tahap
                                    </span>
                                </div>

                                {/* Step Preview Pills */}
                                <div className="space-y-1">
                                    <span className="text-[9.5px] font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                                        Ringkasan Tahapan:
                                    </span>
                                    <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                                        {targetSteps.map((st: any, sIdx: number) => (
                                            <span
                                                key={st.id || sIdx}
                                                className="inline-flex max-w-full items-center gap-1 truncate rounded border border-slate-200/80 bg-white/80 px-1.5 py-0.5 text-[9.5px] text-slate-700 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                                title={st.label || st.description || `Tahap ${st.step}`}
                                            >
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{st.step}.</span>
                                                <span className="max-w-[140px] truncate">{st.label || st.description || `Tahap ${st.step}`}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Transition Triggers */}
                                <div className="space-y-1 rounded-lg border border-indigo-100 bg-indigo-50/70 p-2 dark:border-indigo-900/50 dark:bg-indigo-950/40">
                                    <span className="flex items-center gap-1 text-[9.5px] font-bold text-indigo-900 dark:text-indigo-200">
                                        <ArrowRight size={10} className="text-indigo-600" />
                                        <span>Jalur Transisi Lintas Alur:</span>
                                    </span>
                                    {transitions.map((t, tIdx) => (
                                        <div
                                            key={tIdx}
                                            className="flex items-center justify-between gap-1 rounded border border-indigo-100 bg-white/90 px-1.5 py-0.5 text-[10px] text-slate-700 dark:border-indigo-900/30 dark:bg-zinc-900/90 dark:text-zinc-300"
                                        >
                                            <span className="truncate">
                                                Tahap {t.sourceStepNum} ({t.actionAlias})
                                            </span>
                                            <span className="inline-flex shrink-0 items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                                                <ArrowRight size={10} /> Tahap {t.targetSeq}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Open in Editor Link */}
                            <div className="mt-2 flex items-center justify-end border-t border-indigo-100/80 pt-3 dark:border-indigo-900/40">
                                <a
                                    href={`/admin/workflows/${targetWf.id}/edit`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex cursor-pointer items-center gap-1 text-[10.5px] font-bold text-indigo-600 group-hover:underline hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    <span>Buka Sub-Workflow</span>
                                    <ExternalLink size={11} />
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConnectedSubWorkflowsOverview;
