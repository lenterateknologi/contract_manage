import React, { useState } from "react";
import { LayoutTemplate, ChevronDown, ChevronUp } from "lucide-react";
import { TreeSelect } from "@/components/ui/selection/TreeSelect";
import { Badge } from "@/components/ui/feedback/Badge";
import { cn } from "@/lib/utils";

interface ContractTypeTableManagerProps {
    title?: string;
    contractTypeIds: string[];
    onChange: (vals: string[]) => void;
    contractTypes: any[];
}

export default function ContractTypeTableManager({
    title = "Kategori Kontrak",
    contractTypeIds,
    onChange,
    contractTypes,
}: ContractTypeTableManagerProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'unselected'>(
        contractTypeIds.length > 0 ? 'selected' : 'all'
    );

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

    const selectedNames = React.useMemo(() => {
        return contractTypeIds
            .map((id) => contractTypes.find((t) => String(t.id) === String(id))?.name)
            .filter(Boolean);
    }, [contractTypeIds, contractTypes]);

    const handleSelectAll = () => {
        const allIds = contractTypes.map((t) => String(t.id));
        onChange(Array.from(new Set([...contractTypeIds, ...allIds])));
    };

    const handleClearAll = () => {
        onChange([]);
    };

    return (
        <div className="space-y-3 w-full h-full flex flex-col">
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between border-b border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/90 dark:bg-zinc-800/90 backdrop-blur-xs pb-2.5 pt-1 px-3 rounded-xl gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <LayoutTemplate size={14} className="text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                        {title}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border-0">
                        {contractTypeIds.length} Terpilih
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-2 py-0.5 text-[10px] font-bold uppercase rounded text-primary hover:underline transition-all cursor-pointer"
                    >
                        Pilih Semua
                    </button>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="px-2 py-0.5 text-[10px] font-bold uppercase rounded text-rose-500 hover:underline transition-all cursor-pointer"
                    >
                        Bersihkan
                    </button>

                    <div className="flex bg-slate-200/60 dark:bg-zinc-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 text-[11px] font-medium">
                        <button
                            type="button"
                            onClick={() => setFilterMode('all')}
                            className={cn(
                                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                                filterMode === 'all'
                                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs font-semibold"
                                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            Semua ({contractTypes.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode('selected')}
                            className={cn(
                                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                                filterMode === 'selected'
                                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs font-semibold"
                                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            Terpilih ({contractTypeIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode('unselected')}
                            className={cn(
                                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                                filterMode === 'unselected'
                                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs font-semibold"
                                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            Belum Terpilih ({Math.max(0, contractTypes.length - contractTypeIds.length)})
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-1 flex-1 w-full min-h-0">
                <TreeSelect
                    value={contractTypeIds}
                    onValueChange={(newIds) => onChange(Array.from(new Set(newIds)))}
                    items={filteredContractTypes.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        parent_id: t.parent_id
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
