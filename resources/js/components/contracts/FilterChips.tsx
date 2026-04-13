import React from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContractType } from '@/types/contracts';

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
    handleFilterChange 
}: FilterChipsProps) {
    const hasStatus = Array.isArray(statusFilter) ? statusFilter.length > 0 : (statusFilter !== 'all' && statusFilter !== undefined);
    const hasType = Array.isArray(typeFilter) ? typeFilter.length > 0 : (typeFilter !== 'all' && typeFilter !== undefined);
    
    if (!hasStatus && !hasType) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Active Filters:</span>
            
            {Array.isArray(statusFilter) ? statusFilter.map(s => (
                <Badge key={`status-${s}`} variant="secondary" className="h-8 pl-2.5 pr-1 gap-1 border-slate-200 bg-white shadow-sm text-slate-600 font-medium hover:bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Status:</span>
                    <span className="text-[11px] whitespace-nowrap">{s === 'in_review' ? 'Dalam Tinjauan' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { 
                        const next = statusFilter.filter(v => v !== (s as any));
                        const val = next.length > 0 ? next : 'all';
                        setStatusFilter(val);
                        handleFilterChange({ status: val });
                    }}>
                        <Trash2 className="h-3 w-3 text-slate-400" />
                    </Button>
                </Badge>
            )) : (statusFilter !== 'all' && statusFilter !== undefined && (
                 <Badge variant="secondary" className="h-8 pl-2.5 pr-1 gap-1 border-slate-200 bg-white shadow-sm text-slate-600 font-medium hover:bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Status:</span>
                    <span className="text-[11px] whitespace-nowrap">{statusFilter === 'in_review' ? 'Dalam Tinjauan' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { setStatusFilter('all'); handleFilterChange({ status: 'all' }); }}>
                        <Trash2 className="h-3 w-3 text-slate-400" />
                    </Button>
                </Badge>
            ))}

            {Array.isArray(typeFilter) ? typeFilter.map(tId => {
                const type = types.find(t => t.id === tId);
                return (
                    <Badge key={`type-${tId}`} variant="secondary" className="h-8 pl-2.5 pr-1 gap-1 border-slate-200 bg-white shadow-sm text-slate-600 font-medium hover:bg-slate-50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Tipe:</span>
                        <span className="text-[11px] whitespace-nowrap">{type?.name || tId}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { 
                            const next = typeFilter.filter(v => v !== tId);
                            const val = next.length > 0 ? next : 'all';
                            setTypeFilter(val);
                            handleFilterChange({ contract_type_id: val });
                        }}>
                            <Trash2 className="h-3 w-3 text-slate-400" />
                        </Button>
                    </Badge>
                );
            }) : (typeFilter !== 'all' && typeFilter !== undefined && (
                <Badge variant="secondary" className="h-8 pl-2.5 pr-1 gap-1 border-slate-200 bg-white shadow-sm text-slate-600 font-medium hover:bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Tipe:</span>
                    <span className="text-[11px] whitespace-nowrap">{types.find(t => t.id === typeFilter)?.name || typeFilter}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { setTypeFilter('all'); handleFilterChange({ contract_type_id: 'all' }); }}>
                        <Trash2 className="h-3 w-3 text-slate-400" />
                    </Button>
                </Badge>
            ))}
            {advancedFilters?.rules?.map((rule: any) => (
                <Badge key={`adv-${rule.id}`} variant="secondary" className="h-8 pl-2.5 pr-1 gap-1 border-slate-200 bg-white shadow-sm text-slate-600 font-medium hover:bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">
                        {rule.field.split('.').pop()?.replace('_', ' ')}:
                    </span>
                    <span className="text-[11px] whitespace-nowrap">
                        {Array.isArray(rule.value) ? rule.value.join(' - ') : rule.value}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { 
                        if (setAdvancedFilters) {
                            const next = {
                                ...advancedFilters,
                                rules: advancedFilters.rules.filter((r: any) => r.id !== rule.id)
                            };
                            setAdvancedFilters(next);
                            handleFilterChange({ advanced_filters: next });
                        }
                    }}>
                        <Trash2 className="h-3 w-3 text-slate-400" />
                    </Button>
                </Badge>
            ))}
        </div>
    );
}
