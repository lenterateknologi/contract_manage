import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FilterPillsProps {
    activeFilters: {
        status?: string[];
        contract_type_id?: string[];
    };
    types: { id: any; name: string }[];
    onRemove: (key: 'status' | 'contract_type_id', value: string) => void;
    onClearAll: () => void;
}

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    in_review: 'In Review',
    revision: 'Revision',
    approved: 'Approved',
    rejected: 'Rejected'
};

export function FilterPills({ activeFilters, types, onRemove, onClearAll }: FilterPillsProps) {
    const hasFilters = (activeFilters.status?.length || 0) > 0 || (activeFilters.contract_type_id?.length || 0) > 0;

    if (!hasFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 py-3 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Active Filters:</span>
            
            {activeFilters.status?.map(val => (
                <Badge 
                    key={`status-${val}`} 
                    variant="secondary" 
                    className="pl-2 pr-1 py-1 gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 rounded-full"
                >
                    Status: {statusLabels[val] || val}
                    <button 
                        onClick={() => onRemove('status', val)}
                        className="hover:bg-slate-300 rounded-full p-0.5 transition-colors"
                    >
                        <X size={12} />
                    </button>
                </Badge>
            ))}

            {activeFilters.contract_type_id?.map(val => {
                const typeName = types.find(t => String(t.id) === val)?.name || val;
                return (
                    <Badge 
                        key={`type-${val}`} 
                        variant="secondary" 
                        className="pl-2 pr-1 py-1 gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 rounded-full"
                    >
                        Type: {typeName}
                        <button 
                            onClick={() => onRemove('contract_type_id', val)}
                            className="hover:bg-slate-300 rounded-full p-0.5 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </Badge>
                );
            })}

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearAll}
                className="h-7 px-2 text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-tight"
            >
                Clear All
            </Button>
        </div>
    );
}
