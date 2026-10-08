import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ExternalLink, FileSignature, GitBranch, Layers, UserCheck } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import SortableStepItem from './SortableStepItem';

export interface PhaseDefinition {
    id: string;
    key: string;
    title: string;
    subtitle: string;
    badge: string;
    themeIndex: number;
    icon: any;
    border: string;
    bg: string;
    headerBg: string;
    badgeBg: string;
    iconBg: string;
}

export const PHASE_DEFINITIONS: PhaseDefinition[] = [
    {
        id: 'master',
        key: 'master',
        title: 'Fase Master : Alur Kerja Utama (Orchestrator)',
        subtitle: 'Orkestrasi alur lintas sub-workflow, gerbang kendali ekosistem & penyatuan seluruh alur kerja',
        badge: 'Fase Master',
        themeIndex: 0,
        icon: Layers,
        border: 'border-blue-400/80 dark:border-blue-900/80',
        bg: 'bg-blue-50/25 dark:bg-blue-950/15',
        headerBg: 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-900/70',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200',
        iconBg: 'bg-blue-600',
    },
    {
        id: 'sub_wf_1',
        key: 'sub_wf_1',
        title: 'Fase 1 : Inisiasi & Persetujuan (Sub-WF 1)',
        subtitle: 'Penyusunan draf awal, persetujuan atasan/manager inisiator, dan penelaahan tim pajak',
        badge: 'Fase 1 : Inisiasi',
        themeIndex: 1,
        icon: GitBranch,
        border: 'border-cyan-400/80 dark:border-cyan-900/80',
        bg: 'bg-cyan-50/25 dark:bg-cyan-950/15',
        headerBg: 'bg-cyan-50/90 dark:bg-cyan-950/50 border-cyan-200/80 dark:border-cyan-900/70',
        badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200',
        iconBg: 'bg-cyan-600',
    },
    {
        id: 'sub_wf_2',
        key: 'sub_wf_2',
        title: 'Fase 2 : Telaah & Penugasan Legal (Sub-WF 2)',
        subtitle: 'Penunjukan PIC legal, penelaahan substansi berkas, dan review pimpinan divisi legal',
        badge: 'Fase 2 : Legal',
        themeIndex: 2,
        icon: UserCheck,
        border: 'border-emerald-400/80 dark:border-emerald-900/80',
        bg: 'bg-emerald-50/25 dark:bg-emerald-950/15',
        headerBg: 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900/70',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200',
        iconBg: 'bg-emerald-600',
    },
    {
        id: 'sub_wf_3',
        key: 'sub_wf_3',
        title: 'Fase 3 : Finalisasi & Penerbitan Dokumen F2 (Sub-WF 3)',
        subtitle: 'Penerbitan form F2, tanda tangan digital, konfirmasi inisiator, dan pengarsipan berkas',
        badge: 'Fase 3 : Finalisasi',
        themeIndex: 3,
        icon: FileSignature,
        border: 'border-purple-400/80 dark:border-purple-900/80',
        bg: 'bg-purple-50/25 dark:bg-purple-950/15',
        headerBg: 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-900/70',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-200',
        iconBg: 'bg-purple-600',
    },
];

interface GroupedStepSectionsProps {
    workflow?: any;
    steps: any[];
    roles?: any[];
    departments?: any[];
    divisions?: any[];
    locations?: any[];
    users?: any[];
    companyGroups?: any[];
    companies?: any[];
    regions?: any[];
    allWorkflows?: any[];
    contractStatuses?: any[];
    expandedStepIds: Record<string, boolean>;
    setExpandedStepIds: (val: any) => void;
    selectedStepIds: Set<string>;
    toggleSelectStep: (id: string) => void;
    updateLocalStep: (idx: number, data: any) => void;
    removeLocalStep: (idx: number) => void;
    duplicateLocalStep: (idx: number) => void;
    moveLocalStep: (idx: number, direction: 'up' | 'down') => void;
    onSavePreset?: (st: any) => void;
    onMoveKeyboard?: (idx: number, direction: 'up' | 'down') => void;
    simulationContext?: any;
    onOpenSimulationModal?: () => void;
    onAddStepToPhase?: (phaseKey: string) => void;
}

export const GroupedStepSections: React.FC<GroupedStepSectionsProps> = ({
    workflow,
    steps = [],
    roles = [],
    departments = [],
    divisions = [],
    locations = [],
    users = [],
    companyGroups = [],
    companies = [],
    regions = [],
    allWorkflows = [],
    contractStatuses = [],
    expandedStepIds,
    setExpandedStepIds,
    selectedStepIds,
    toggleSelectStep,
    updateLocalStep,
    removeLocalStep,
    duplicateLocalStep,
    moveLocalStep,
    onSavePreset,
    onMoveKeyboard,
    simulationContext,
    onOpenSimulationModal,
}) => {
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups((prev) => ({
            ...prev,
            [groupId]: !prev[groupId],
        }));
    };

    // Categorize steps into 4 groups (Master, Sub WF 1, Sub WF 2, Sub WF 3)
    const groupedData = useMemo(() => {
        const total = steps.length;
        if (total === 0) return [];

        const isMasterWorkflow =
            String(workflow?.name || '')
                .toUpperCase()
                .includes('MASTER') ||
            String(workflow?.name || '')
                .toUpperCase()
                .includes('ORCHESTRATOR');

        const stepPhaseMap = new Map<number, string>();
        steps.forEach((st: any, idx: number) => {
            let phase = st.phase || st.step_category;

            if (isMasterWorkflow) {
                phase = 'master';
            } else if (!phase || phase === 'f1_request') {
                const desc = (st.description || st.label || st.name || '').toLowerCase();
                const actCodes = (st.actions || []).map((a: any) => String(a.action_code || a.code || '').toLowerCase());

                let crossTargetWfName = '';
                (st.actions || []).forEach((a: any) => {
                    let tc = a.transition_config;
                    if (typeof tc === 'string') {
                        try {
                            tc = JSON.parse(tc);
                        } catch {
                            tc = null;
                        }
                    }
                    const targetWfId = tc?.workflow_id || a.next_workflow_id;
                    if (targetWfId) {
                        const targetWf = (allWorkflows || []).find((w: any) => String(w.id) === String(targetWfId));
                        if (targetWf) crossTargetWfName += ' ' + targetWf.name.toLowerCase();
                    }
                });

                const isFinal =
                    idx === total - 1 ||
                    st.meta?.target_status === 'archived' ||
                    desc.includes('arsip') ||
                    desc.includes('selesai') ||
                    desc.includes('closing');
                const isF2 =
                    desc.includes('f2') ||
                    desc.includes('tanda tangan') ||
                    desc.includes('signature') ||
                    actCodes.some((c: string) => c.includes('sign')) ||
                    crossTargetWfName.includes('finalisasi') ||
                    crossTargetWfName.includes('f2');
                const isLegal =
                    desc.includes('legal') ||
                    desc.includes('pic') ||
                    desc.includes('penugasan') ||
                    desc.includes('vp') ||
                    desc.includes('telaah') ||
                    desc.includes('lawyer') ||
                    crossTargetWfName.includes('legal') ||
                    crossTargetWfName.includes('telaah');
                const isInitiation =
                    desc.includes('draft') ||
                    desc.includes('inisiasi') ||
                    desc.includes('pajak') ||
                    desc.includes('tax') ||
                    desc.includes('manager initiator') ||
                    desc.includes('pemohon') ||
                    crossTargetWfName.includes('inisiasi');

                if (isFinal || isF2 || (idx >= 7 && total >= 8)) {
                    phase = 'sub_wf_3';
                } else if (isLegal) {
                    phase = 'sub_wf_2';
                } else if (isInitiation || idx < 3) {
                    phase = 'sub_wf_1';
                } else {
                    phase = 'sub_wf_1';
                }
            } else if (phase === 'f1_legal') {
                phase = 'sub_wf_2';
            } else if (phase === 'f2_review') {
                phase = 'sub_wf_3';
            }
            stepPhaseMap.set(idx, phase);
        });

        // Find connected sub-workflows info for rendering steps directly if some groups have no local steps
        const subWfMap: Record<string, any> = {
            master: (allWorkflows || []).find((w: any) =>
                String(w.name || '')
                    .toUpperCase()
                    .includes('MASTER'),
            ),
            sub_wf_1: (allWorkflows || []).find(
                (w: any) =>
                    String(w.name || '')
                        .toUpperCase()
                        .includes('SUB-WF 1') ||
                    String(w.name || '')
                        .toUpperCase()
                        .includes('INISIASI'),
            ),
            sub_wf_2: (allWorkflows || []).find(
                (w: any) =>
                    String(w.name || '')
                        .toUpperCase()
                        .includes('SUB-WF 2') ||
                    String(w.name || '')
                        .toUpperCase()
                        .includes('LEGAL'),
            ),
            sub_wf_3: (allWorkflows || []).find(
                (w: any) =>
                    String(w.name || '')
                        .toUpperCase()
                        .includes('SUB-WF 3') ||
                    String(w.name || '')
                        .toUpperCase()
                        .includes('FINALISASI'),
            ),
        };

        const groups: {
            def: PhaseDefinition;
            items: { step: any; originalIndex: number; isExternal?: boolean; externalWfName?: string; externalWfId?: string }[];
            connectedWf?: any;
        }[] = [];

        PHASE_DEFINITIONS.forEach((def) => {
            const items: { step: any; originalIndex: number; isExternal?: boolean; externalWfName?: string; externalWfId?: string }[] = [];
            steps.forEach((st: any, idx: number) => {
                if (stepPhaseMap.get(idx) === def.key || stepPhaseMap.get(idx) === def.id) {
                    items.push({ step: st, originalIndex: idx });
                }
            });

            const connectedWf = subWfMap[def.id];

            // If local items are 0 but connected workflow has steps, include connected workflow steps directly!
            if (items.length === 0 && connectedWf && connectedWf.steps && connectedWf.steps.length > 0) {
                const sortedConnected = connectedWf.steps.slice().sort((a: any, b: any) => (Number(a.step) || 0) - (Number(b.step) || 0));
                sortedConnected.forEach((cStep: any, cIdx: number) => {
                    items.push({
                        step: cStep,
                        originalIndex: cIdx,
                        isExternal: true,
                        externalWfName: connectedWf.name,
                        externalWfId: connectedWf.id,
                    });
                });
            }

            groups.push({
                def,
                items,
                connectedWf: connectedWf && String(connectedWf.id) !== String(workflow?.id) ? connectedWf : undefined,
            });
        });

        return groups;
    }, [steps, workflow?.id, workflow?.name, allWorkflows]);

    return (
        <div className="space-y-4">
            {groupedData.map(({ def, items }) => {
                const isGroupCollapsed = !!collapsedGroups[def.id];
                const IconComponent = def.icon || Layers;

                return (
                    <div key={def.id} className={cn('overflow-hidden rounded-2xl border-2 shadow-2xs transition-all', def.border, def.bg)}>
                        {/* Group Header */}
                        <div
                            className={cn(
                                'flex cursor-pointer items-center justify-between border-b px-4 py-3 transition-colors select-none',
                                def.headerBg,
                            )}
                            onClick={() => toggleGroupCollapse(def.id)}
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div
                                    className={cn(
                                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs',
                                        def.iconBg,
                                    )}
                                >
                                    <IconComponent size={15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="truncate text-xs font-bold text-slate-800 dark:text-zinc-100">{def.title}</h4>
                                        <span
                                            className={cn('shrink-0 rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase', def.badgeBg)}
                                        >
                                            {def.badge}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground truncate text-[10px]">{def.subtitle}</p>
                                </div>
                            </div>

                            <div className="ml-3 flex shrink-0 items-center gap-2">
                                <span className="rounded-md border border-slate-200 bg-white/90 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-600 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300">
                                    {items.length} Tahapan
                                </span>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGroupCollapse(def.id);
                                    }}
                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                >
                                    {isGroupCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Group Step Items */}
                        {!isGroupCollapsed && (
                            <div className="space-y-3.5 bg-white/50 p-3.5 dark:bg-zinc-900/40">
                                {items.length > 0 ? (
                                    <div className="relative grid gap-3.5">
                                        <div className="absolute top-8 bottom-8 left-[19.5px] z-0 w-px bg-slate-200 dark:bg-zinc-700" />
                                        {items.map(({ step, originalIndex, isExternal, externalWfName, externalWfId }) => (
                                            <div key={step.id} className="relative">
                                                {isExternal && (
                                                    <div className="mb-1.5 flex items-center justify-between pl-8 text-[10.5px] font-semibold text-slate-500 dark:text-zinc-400">
                                                        <span className="text-primary flex items-center gap-1.5">
                                                            <ExternalLink size={11} />
                                                            <span>
                                                                Dari Sub-Workflow: <strong>{externalWfName}</strong>
                                                            </span>
                                                        </span>
                                                        {externalWfId && (
                                                            <a
                                                                href={`/admin/workflows/${externalWfId}/edit`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-primary flex items-center gap-0.5 text-[10px] hover:underline"
                                                            >
                                                                <span>Kelola Sub-Workflow ↗</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                <SortableStepItem
                                                    key={step.id}
                                                    roles={roles}
                                                    departments={departments}
                                                    divisions={divisions}
                                                    locations={locations}
                                                    users={users}
                                                    companyGroups={companyGroups}
                                                    companies={companies}
                                                    regions={regions}
                                                    step={step}
                                                    idx={originalIndex}
                                                    isExpanded={expandedStepIds[step.id] !== false}
                                                    setIsExpanded={(val) =>
                                                        setExpandedStepIds((prev: any) => ({
                                                            ...prev,
                                                            [step.id]: val,
                                                        }))
                                                    }
                                                    totalSteps={items.length}
                                                    contractStatuses={contractStatuses}
                                                    allWorkflows={allWorkflows}
                                                    allWorkflowSteps={steps}
                                                    onSavePreset={onSavePreset}
                                                    duplicateLocalStep={isExternal ? undefined : duplicateLocalStep}
                                                    updateLocalStep={isExternal ? () => {} : updateLocalStep}
                                                    removeLocalStep={isExternal ? undefined : removeLocalStep}
                                                    moveLocalStep={isExternal ? undefined : moveLocalStep}
                                                    isSelected={selectedStepIds.has(step.id)}
                                                    onToggleSelect={isExternal ? () => {} : toggleSelectStep}
                                                    onMoveKeyboard={isExternal ? undefined : onMoveKeyboard}
                                                    simulationContext={simulationContext}
                                                    onOpenSimulationModal={onOpenSimulationModal}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground rounded-xl border border-dashed border-slate-300 bg-white/80 p-4 text-center text-xs dark:border-zinc-700 dark:bg-zinc-900/80">
                                        Belum ada tahapan dalam alur ini.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default GroupedStepSections;
