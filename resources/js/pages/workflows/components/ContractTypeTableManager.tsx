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

    return (
        <div className="space-y-4 w-full">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800 gap-2">
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 cursor-pointer select-none hover:opacity-80 transition-opacity"
                >
                    <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                        title={isExpanded ? "Minimize" : "Expand"}
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <LayoutTemplate size={14} className="text-primary" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {contractTypeIds.length} Terpilih
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    {isExpanded && (
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800 text-[11px] font-medium">
                            <button
                                type="button"
                                onClick={() => setFilterMode('all')}
                                className={cn(
                                    "px-2.5 py-1 rounded-md transition-all",
                                    filterMode === 'all'
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                Semua ({contractTypes.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterMode('selected')}
                                className={cn(
                                    "px-2.5 py-1 rounded-md transition-all",
                                    filterMode === 'selected'
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                Terpilih ({contractTypeIds.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterMode('unselected')}
                                className={cn(
                                    "px-2.5 py-1 rounded-md transition-all",
                                    filterMode === 'unselected'
                                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                Belum Terpilih ({Math.max(0, contractTypes.length - contractTypeIds.length)})
                            </button>
                        </div>
                    )}

                    {!isExpanded && selectedNames.length > 0 && (
                        <div 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex flex-wrap gap-1 max-w-md justify-end cursor-pointer select-none"
                        >
                            {selectedNames.slice(0, 3).map((name, idx) => (
                                <span key={idx} className="text-[10px] bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2 py-0.5 rounded-md font-medium truncate max-w-[150px]">
                                    {name}
                                </span>
                            ))}
                            {selectedNames.length > 3 && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium">
                                    +{selectedNames.length - 3} lainnya
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
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
            )}
        </div>
    );
}
