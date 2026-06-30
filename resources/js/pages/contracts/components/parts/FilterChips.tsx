import { Badge } from '@/components/ui/feedback/Badge';
import { Button } from '@/components/ui/buttons/Button';
import { ContractType } from '@/pages/contracts/types';
import { Trash2 } from 'lucide-react';

interface FilterChipsProps {
    statusFilter: any;
    typeFilter: any;
    types: ContractType[];
    setStatusFilter: (v: any) => void;
    setTypeFilter: (v: any) => void;
    advancedFilters?: any;
    setAdvancedFilters?: (v: any) => void;
    handleFilterChange: (fs: any) => void;
}

export function FilterChips({
    statusFilter,
    typeFilter,
    types,
    setStatusFilter,
    setTypeFilter,
    advancedFilters,
    setAdvancedFilters,
    handleFilterChange,
}: FilterChipsProps) {
    const hasStatus = Array.isArray(statusFilter) ? statusFilter.length > 0 : statusFilter !== 'all' && statusFilter !== undefined;
    const hasType = Array.isArray(typeFilter) ? typeFilter.length > 0 : typeFilter !== 'all' && typeFilter !== undefined;

    if (!hasStatus && !hasType) return null;

    return (
        <div className="border-border mt-1 flex flex-wrap items-center gap-2 border-t pt-1">
            <span className="text-muted-foreground mr-1 text-[10px] font-semibold uppercase">Active Filters:</span>

            {Array.isArray(statusFilter)
                ? statusFilter.map((s) => (
                    <Badge
                        key={`status-${s}`}
                        variant="secondary"
                        className="border-border bg-card text-foreground hover:bg-muted h-8 gap-1 pr-1 pl-2.5 font-medium shadow-sm"
                    >
                        <span className="text-muted-foreground mr-1 text-[10px] font-bold uppercase">Status:</span>
                        <span className="text-[11px] whitespace-nowrap">
                            {s === 'in_review' ? 'Dalam Tinjauan' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => {
                                const next = statusFilter.filter((v) => v !== (s as any));
                                const val = next.length > 0 ? next : 'all';
                                setStatusFilter(val);
                                handleFilterChange({ status: val });
                            }}
                        >
                            <Trash2 className="text-muted-foreground h-3 w-3" />
                        </Button>
                    </Badge>
                ))
                : statusFilter !== 'all' &&
                statusFilter !== undefined && (
                    <Badge
                        variant="secondary"
                        className="border-border bg-card text-foreground hover:bg-muted h-8 gap-1 pr-1 pl-2.5 font-medium shadow-sm"
                    >
                        <span className="text-muted-foreground mr-1 text-[10px] font-bold uppercase">Status:</span>
                        <span className="text-[11px] whitespace-nowrap">
                            {statusFilter === 'in_review' ? 'Dalam Tinjauan' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => {
                                setStatusFilter('all');
                                handleFilterChange({ status: 'all' });
                            }}
                        >
                            <Trash2 className="h-3 w-3 text-slate-400" />
                        </Button>
                    </Badge>
                )}

            {Array.isArray(typeFilter)
                ? typeFilter.map((tId) => {
                    const type = types.find((t) => t.id === tId);
                    return (
                        <Badge
                            key={`type-${tId}`}
                            variant="secondary"
                            className="border-border bg-card text-foreground hover:bg-muted h-8 gap-1 pr-1 pl-2.5 font-medium shadow-sm"
                        >
                            <span className="text-muted-foreground mr-1 text-[10px] font-bold uppercase">Tipe:</span>
                            <span className="text-[11px] whitespace-nowrap">{type?.name || tId}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                onClick={() => {
                                    const next = typeFilter.filter((v) => v !== tId);
                                    const val = next.length > 0 ? next : 'all';
                                    setTypeFilter(val);
                                    handleFilterChange({ contract_type_id: val });
                                }}
                            >
                                <Trash2 className="h-3 w-3 text-slate-400" />
                            </Button>
                        </Badge>
                    );
                })
                : typeFilter !== 'all' &&
                typeFilter !== undefined && (
                    <Badge
                        variant="secondary"
                        className="border-border bg-card text-foreground hover:bg-muted h-8 gap-1 pr-1 pl-2.5 font-medium shadow-sm"
                    >
                        <span className="text-muted-foreground mr-1 text-[10px] font-bold uppercase">Tipe:</span>
                        <span className="text-[11px] whitespace-nowrap">{types.find((t) => t.id === typeFilter)?.name || typeFilter}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => {
                                setTypeFilter('all');
                                handleFilterChange({ contract_type_id: 'all' });
                            }}
                        >
                            <Trash2 className="h-3 w-3 text-slate-400" />
                        </Button>
                    </Badge>
                )}
            {advancedFilters?.rules?.map((rule: any) => (
                <Badge
                    key={`adv-${rule.id}`}
                    variant="secondary"
                    className="border-border bg-card text-foreground hover:bg-muted h-8 gap-1 pr-1 pl-2.5 font-medium shadow-sm"
                >
                    <span className="text-muted-foreground mr-1 text-[10px] font-bold uppercase">
                        {rule.field.split('.').pop()?.replace('_', ' ')}:
                    </span>
                    <span className="text-[11px] whitespace-nowrap">{Array.isArray(rule.value) ? rule.value.join(' - ') : rule.value}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => {
                            if (setAdvancedFilters) {
                                const next = {
                                    ...advancedFilters,
                                    rules: advancedFilters.rules.filter((r: any) => r.id !== rule.id),
                                };
                                setAdvancedFilters(next);
                                handleFilterChange({ advanced_filters: next });
                            }
                        }}
                    >
                        <Trash2 className="h-3 w-3 text-slate-400" />
                    </Button>
                </Badge>
            ))}
        </div>
    );
}
