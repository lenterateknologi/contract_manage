import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface FilterPillsProps {
    filters?: {
        label: string;
        key: string;
        options: { label: string; value: any }[];
    }[];
    activeFilters: Record<string, any>;
    onRemove: (key: string, value: any) => void;
    onClearAll: () => void;
    // Compatibility for old usages
    types?: any[]; 
}

export function FilterPills({
    filters = [],
    activeFilters,
    onRemove,
    onClearAll,
    types = []
}: FilterPillsProps) {
    const pills: { key: string; label: string; value: any; category: string }[] = [];

    // Use provided filters definition if available
    if (filters.length > 0) {
        filters.forEach(filter => {
            const values = Array.isArray(activeFilters[filter.key])
                ? activeFilters[filter.key]
                : (activeFilters[filter.key] ? [activeFilters[filter.key]] : []);

            values.forEach((val: any) => {
                const option = filter.options.find(opt => String(opt.value) === String(val));
                if (option) {
                    pills.push({
                        key: filter.key,
                        label: option.label,
                        value: val,
                        category: filter.label
                    });
                }
            });
        });
    } else {
        // Fallback/Compatibility logic for status and contract_type_id
        if (activeFilters.status) {
            const statuses = Array.isArray(activeFilters.status) ? activeFilters.status : [activeFilters.status];
            statuses.forEach((s: string) => {
                pills.push({ key: 'status', label: s.replace('_', ' '), value: s, category: 'Status' });
            });
        }
        if (activeFilters.contract_type_id && types.length > 0) {
            const tids = Array.isArray(activeFilters.contract_type_id) ? activeFilters.contract_type_id : [activeFilters.contract_type_id];
            tids.forEach((tid: string) => {
                const t = types.find(x => String(x.id) === String(tid));
                if (t) pills.push({ key: 'contract_type_id', label: t.name, value: tid, category: 'Tipe' });
            });
        }
    }

    if (pills.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-100 bg-white/50">
            <div className="flex items-center gap-1.5 mr-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <SlidersHorizontal className="h-3 w-3" />
                <span>Aktif:</span>
            </div>
            
            {pills.map((pill, idx) => (
                <Badge 
                    key={`${pill.key}-${pill.value}-${idx}`}
                    variant="secondary"
                    className="h-7 pl-2 pr-1 gap-1 border-slate-200 bg-slate-100/50 hover:bg-slate-200/50 transition-colors text-[10px] font-bold uppercase tracking-tight text-slate-600 rounded-lg group"
                >
                    <span className="text-slate-400 font-medium mr-0.5">{pill.category}:</span>
                    {pill.label}
                    <button 
                        onClick={() => onRemove(pill.key, pill.value)}
                        className="p-0.5 rounded-md hover:bg-white hover:text-red-500 transition-all ml-1"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}

            <button 
                onClick={onClearAll}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:underline uppercase tracking-tight ml-auto"
            >
                Hapus Semua
            </button>
        </div>
    );
}
