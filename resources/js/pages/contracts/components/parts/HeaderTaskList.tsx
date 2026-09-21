import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { resolveContractRequirements } from '@/pages/contracts/utils/requirements';
import { Popover, PopoverButton, PopoverPanel, Portal } from '@headlessui/react';
import { CheckCircle2, ChevronDown, ListChecks, XCircle } from 'lucide-react';
import React, { useMemo } from 'react';

interface HeaderTaskListProps {
    contract: Contract;
    onNavigateTab?: (tab: string, subTab?: string) => void;
}

export function HeaderTaskList({ contract, onNavigateTab }: HeaderTaskListProps) {
    const requirements = useMemo(() => {
        return resolveContractRequirements(contract);
    }, [contract]);

    if (!requirements.hasRequirements) {
        return null;
    }

    const { items, allFilled, filledCount, totalCount } = requirements;
    const progressPercent = Math.round((filledCount / totalCount) * 100);

    return (
        <Popover className="relative inline-block">
            {({ open, close }) => (
                <>
                    <PopoverButton
                        className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-xs focus:outline-none select-none',
                            allFilled
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 animate-pulse-subtle'
                        )}
                        title="Klik untuk melihat checklist syarat wajib tahap ini"
                    >
                        <ListChecks size={14} className={allFilled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
                        <span>
                            {filledCount}/{totalCount} Syarat
                        </span>
                        <ChevronDown size={12} className={cn('transition-transform duration-200 opacity-70', open && 'rotate-180')} />
                    </PopoverButton>

                    <Portal>
                        <PopoverPanel
                            anchor="bottom end"
                            className="z-[999999] mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 shadow-2xl backdrop-blur-md focus:outline-none animate-in fade-in zoom-in-95 duration-150"
                        >
                            {/* Header Panel */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800/80">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        'p-1.5 rounded-lg',
                                        allFilled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    )}>
                                        <ListChecks size={15} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground leading-none">
                                            Checklist Syarat Wajib
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {contract.workflow_step ? `Tahap ${contract.workflow_step.step}: ${contract.workflow_step.name || contract.workflow_step.description || ''}` : 'Tahap Aktif'}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn(
                                    'text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider',
                                    allFilled
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                )}>
                                    {allFilled ? 'Lengkap' : `${totalCount - filledCount} Tertunda`}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="pt-2.5 pb-1">
                                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                                    <span>Kelengkapan Syarat</span>
                                    <span>{progressPercent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full transition-all duration-300 rounded-full',
                                            allFilled ? 'bg-emerald-500' : 'bg-amber-500'
                                        )}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Task List Items */}
                            <div className="mt-2.5 space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-0.5">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            if (item.targetTab && onNavigateTab) {
                                                onNavigateTab(item.targetTab, item.targetSubTab);
                                                close();
                                            }
                                        }}
                                        role={item.targetTab ? 'button' : undefined}
                                        tabIndex={item.targetTab ? 0 : undefined}
                                        className={cn(
                                            'flex items-center justify-between p-2 rounded-lg border text-xs transition-all',
                                            item.isFilled
                                                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                                                : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40 text-rose-900 dark:text-rose-300',
                                            item.targetTab && 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            {item.isFilled ? (
                                                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            ) : (
                                                <XCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                            )}
                                            <span className="font-semibold truncate text-[11px] leading-tight">
                                                {item.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className={cn(
                                                'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded',
                                                item.isFilled
                                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                            )}>
                                                {item.isFilled ? 'Selesai' : 'Belum'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer helper */}
                            {!allFilled && (
                                <p className="text-[10px] text-muted-foreground/80 mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-center">
                                    Klik salah satu syarat di atas untuk langsung menuju tab terkait.
                                </p>
                            )}
                        </PopoverPanel>
                    </Portal>
                </>
            )}
        </Popover>
    );
}
