import { cn } from '@/lib/utils';
import { Contract } from '@/pages/contracts/types';
import { resolveContractRequirements } from '@/pages/contracts/utils/requirements';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Check, ChevronDown, ChevronRight, CircleDot, ListChecks } from 'lucide-react';
import { useMemo } from 'react';

interface HeaderTaskListProps {
    contract: Contract;
    onNavigateTab?: (tab: string, subTab?: string) => void;
}

export function HeaderTaskList({ contract, onNavigateTab }: HeaderTaskListProps) {
    const isCurrentActor = contract?.is_current_actor ?? contract?.can_approve ?? false;

    const requirements = useMemo(() => {
        if (!isCurrentActor) {
            return { items: [], hasRequirements: false, allFilled: true, totalCount: 0, filledCount: 0 };
        }
        return resolveContractRequirements(contract);
    }, [contract, isCurrentActor]);

    if (!isCurrentActor || !requirements.hasRequirements) {
        return null;
    }

    const { items, allFilled, filledCount, totalCount } = requirements;

    return (
        <Popover className="relative inline-block">
            {({ open, close }) => (
                <>
                    <PopoverButton
                        className={cn(
                            'flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-all select-none focus:outline-none',
                            allFilled
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
                        )}
                        title="Klik untuk melihat checklist syarat"
                    >
                        <ListChecks size={13} className="shrink-0" />
                        <span>
                            {filledCount}/{totalCount} Syarat
                        </span>
                        <ChevronDown size={12} className={cn('opacity-60 transition-transform duration-200', open && 'rotate-180')} />
                    </PopoverButton>

                    <PopoverPanel
                        anchor="bottom start"
                        className="border-border bg-popover text-popover-foreground z-[999999] mt-1.5 w-72 origin-top-left rounded-lg border p-2 shadow-lg transition duration-150 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                        {/* Header */}
                        <div className="border-border/60 flex items-center justify-between border-b px-2 py-1.5">
                            <span className="text-foreground text-xs font-bold">Syarat Wajib</span>
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                    allFilled
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                                )}
                            >
                                {filledCount}/{totalCount} Terpenuhi
                            </span>
                        </div>

                        {/* Minimal List */}
                        <div className="custom-scrollbar max-h-64 space-y-0.5 overflow-y-auto py-1">
                            {items.map((item) => {
                                const isClickable = !!(item.targetTab && onNavigateTab);

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        disabled={!isClickable}
                                        onClick={() => {
                                            if (isClickable) {
                                                onNavigateTab(item.targetTab!, item.targetSubTab);
                                                close();
                                            }
                                        }}
                                        className={cn(
                                            'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                                            isClickable && 'hover:bg-muted cursor-pointer active:scale-[0.99]',
                                            item.isFilled ? 'text-foreground' : 'text-muted-foreground',
                                        )}
                                    >
                                        <div className="flex min-w-0 items-center gap-2 truncate">
                                            <div
                                                className={cn(
                                                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                                    item.isFilled
                                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                                        : 'border-muted-foreground/40 bg-muted/20 text-muted-foreground',
                                                )}
                                            >
                                                {item.isFilled ? <Check size={10} strokeWidth={3} /> : <CircleDot size={8} />}
                                            </div>
                                            <span className={cn('truncate text-xs', item.isFilled && 'font-medium')}>{item.label}</span>
                                        </div>

                                        {isClickable && <ChevronRight size={12} className="text-muted-foreground/60 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
}
