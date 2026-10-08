import { Badge } from '@/components/ui/feedback/Badge';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { cn } from '@/lib/utils';
import { LayoutTemplate } from 'lucide-react';
import React, { useState } from 'react';

interface ContractTypeTableManagerProps {
    title?: string;
    contractTypeIds: string[];
    onChange: (vals: string[]) => void;
    contractTypes: any[];
}

export default function ContractTypeTableManager({
    title = 'Kategori Kontrak',
    contractTypeIds,
    onChange,
    contractTypes,
}: ContractTypeTableManagerProps) {
    const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'unselected'>(contractTypeIds.length > 0 ? 'selected' : 'all');

    const selectedSet = React.useMemo(() => {
        return new Set(contractTypeIds.map(String));
    }, [contractTypeIds]);

    const filteredContractTypes = React.useMemo(() => {
        if (filterMode === 'selected') {
            return contractTypes.filter((t) => selectedSet.has(String(t.id)));
        }
        if (filterMode === 'unselected') {
            return contractTypes.filter((t) => !selectedSet.has(String(t.id)));
        }
        return contractTypes;
    }, [contractTypes, filterMode, selectedSet]);

    const handleSelectAll = () => {
        const allIds = contractTypes.map((t) => String(t.id));
        onChange(Array.from(new Set([...contractTypeIds, ...allIds])));
    };

    const handleClearAll = () => {
        onChange([]);
    };

    return (
        <div className="flex h-full w-full flex-col space-y-3">
            <div className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border-b border-slate-200/80 bg-slate-100/90 px-3 pt-1 pb-2.5 backdrop-blur-xs dark:border-zinc-700/80 dark:bg-zinc-800/90">
                <div className="flex items-center gap-2">
                    <LayoutTemplate size={14} className="text-primary" />
                    <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase dark:text-zinc-100">{title}</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary rounded-full border-0 px-2 py-0.5 text-[10px] font-bold">
                        {contractTypeIds.length} Terpilih
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-primary cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-all hover:underline"
                    >
                        Pilih Semua
                    </button>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold text-rose-500 uppercase transition-all hover:underline"
                    >
                        Bersihkan
                    </button>

                    <div className="flex rounded-xl border border-slate-200/80 bg-slate-200/60 p-1 text-[11px] font-medium dark:border-zinc-700/80 dark:bg-zinc-900/60">
                        <button
                            type="button"
                            onClick={() => setFilterMode('all')}
                            className={cn(
                                'cursor-pointer rounded-lg px-2.5 py-1 transition-all',
                                filterMode === 'all'
                                    ? 'bg-white font-semibold text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                            )}
                        >
                            Semua ({contractTypes.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode('selected')}
                            className={cn(
                                'cursor-pointer rounded-lg px-2.5 py-1 transition-all',
                                filterMode === 'selected'
                                    ? 'bg-white font-semibold text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                            )}
                        >
                            Terpilih ({contractTypeIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode('unselected')}
                            className={cn(
                                'cursor-pointer rounded-lg px-2.5 py-1 transition-all',
                                filterMode === 'unselected'
                                    ? 'bg-white font-semibold text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                            )}
                        >
                            Belum Terpilih ({Math.max(0, contractTypes.length - contractTypeIds.length)})
                        </button>
                    </div>
                </div>
            </div>

            <div className="min-h-0 w-full flex-1 pt-1">
                <TreeSelect
                    value={contractTypeIds}
                    onValueChange={(newIds) => onChange(Array.from(new Set(newIds)))}
                    items={filteredContractTypes.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        parent_id: t.parent_id,
                    }))}
                    placeholder="Pilih Kategori Kontrak..."
                    searchPlaceholder="Cari kategori kontrak..."
                    multiple={true}
                    inline={true}
                    defaultExpandAll={true}
                    triggerClassName="min-h-10 rounded-xl"
                />
            </div>
        </div>
    );
}
