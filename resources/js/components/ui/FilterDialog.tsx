import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    types: { id: any; name: string }[];
    activeFilters: {
        status?: string[];
        contract_type_id?: string[];
    };
    onFilterChange: (filters: { status?: string[]; contract_type_id?: string[] }) => void;
    onClearAll: () => void;
}

const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Review', value: 'in_review' },
    { label: 'Revision', value: 'revision' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
];

/**
 * Standardized Filter Dialog
 * Matches the Professional style of ConfirmationModal.
 */
export function FilterDialog({
    open,
    onOpenChange,
    types,
    activeFilters,
    onFilterChange,
    onClearAll
}: FilterDialogProps) {
    const [localStatus, setLocalStatus] = useState<string[]>(activeFilters.status || []);
    const [localTypes, setLocalTypes] = useState<string[]>(activeFilters.contract_type_id || []);

    useEffect(() => {
        if (open) {
            setLocalStatus(activeFilters.status || []);
            setLocalTypes(activeFilters.contract_type_id || []);
        }
    }, [open, activeFilters]);

    const handleApply = () => {
        onFilterChange({
            status: localStatus,
            contract_type_id: localTypes,
        });
        onOpenChange(false);
    };

    const handleReset = () => {
        setLocalStatus([]);
        setLocalTypes([]);
        onClearAll();
        onOpenChange(false);
    };

    const toggleStatus = (value: string) => {
        setLocalStatus(prev => 
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    };

    const toggleType = (value: string) => {
        setLocalTypes(prev => 
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl gap-0">
                {/* Header Section */}
                <div className="p-8 text-center bg-white border-b border-slate-50">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-all duration-300">
                        <Filter className="h-8 w-8 stroke-[1.5]" />
                    </div>
                    
                    <h3 className="text-slate-900 mb-2 text-xl font-black uppercase tracking-tight">
                        Filter Kontrak
                    </h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.1em]">
                        Saring data berdasarkan status dan kategori
                    </p>
                </div>

                {/* Body Content */}
                <div className="p-8 space-y-10 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {/* Status Group */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status Kontrak</Label>
                            {localStatus.length > 0 && (
                                <Badge variant="secondary" className="h-5 px-3 text-[10px] bg-slate-900 text-white border-0 font-black rounded-full">{localStatus.length}</Badge>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {statusOptions.map((opt) => (
                                <div 
                                    key={opt.value} 
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border transition-all group cursor-pointer",
                                        localStatus.includes(opt.value) 
                                            ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200" 
                                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                                    )}
                                    onClick={() => toggleStatus(opt.value)}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                                        localStatus.includes(opt.value) ? "bg-white border-white" : "border-slate-300 bg-white"
                                    )}>
                                        {localStatus.includes(opt.value) && <Check className="h-2.5 w-2.5 text-slate-900 stroke-[4]" />}
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-tight">{opt.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Group */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipe Dokumen</Label>
                            {localTypes.length > 0 && (
                                <Badge variant="secondary" className="h-5 px-3 text-[10px] bg-slate-900 text-white border-0 font-black rounded-full">{localTypes.length}</Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {types.map((type) => (
                                <div 
                                    key={type.id} 
                                    className={cn(
                                        "px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                                        localTypes.includes(String(type.id)) 
                                            ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                                            : "bg-slate-50/50 border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                    )}
                                    onClick={() => toggleType(String(type.id))}
                                >
                                    {type.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions Section - Standardized with ConfirmationModal */}
                <div className="flex border-t border-slate-100 bg-white">
                    <button
                        onClick={handleReset}
                        className="text-rose-600 hover:bg-rose-50 flex-1 border-r border-slate-100 py-6 text-xs font-black uppercase tracking-[0.2em] transition-all active:bg-rose-100"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleApply}
                        className="text-slate-900 hover:bg-slate-50 flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] transition-all active:bg-slate-100"
                    >
                        Terapkan Filter
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
