import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

    // Sync local state with props when dialog opens
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
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl">
                <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Filter className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Filter Kontrak</DialogTitle>
                            <p className="text-xs text-slate-500 font-medium">Saring data berdasarkan status dan kategori</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
                    {/* Status Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status Kontrak</Label>
                            {localStatus.length > 0 && (
                                <Badge variant="secondary" className="h-5 px-2 text-[10px] bg-primary text-primary-foreground border-0 font-bold">{localStatus.length}</Badge>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {statusOptions.map((opt) => (
                                <div 
                                    key={opt.value} 
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white cursor-pointer hover:border-primary/30 hover:bg-slate-50 transition-all group",
                                        localStatus.includes(opt.value) && "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                                    )}
                                    onClick={() => toggleStatus(opt.value)}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                        localStatus.includes(opt.value) ? "bg-primary border-primary shadow-sm" : "border-slate-300 bg-white group-hover:border-slate-400"
                                    )}>
                                        {localStatus.includes(opt.value) && <Check className="h-3 w-3 text-white stroke-[3]" />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-semibold transition-colors",
                                        localStatus.includes(opt.value) ? "text-slate-900" : "text-slate-600"
                                    )}>{opt.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    {/* Type Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipe Dokumen</Label>
                            {localTypes.length > 0 && (
                                <Badge variant="secondary" className="h-5 px-2 text-[10px] bg-primary text-primary-foreground border-0 font-bold">{localTypes.length}</Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {types.map((type) => (
                                <div 
                                    key={type.id} 
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all",
                                        localTypes.includes(String(type.id)) 
                                            ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20" 
                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                                    )}
                                    onClick={() => toggleType(String(type.id))}
                                >
                                    {type.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 gap-3 sm:gap-0">
                    <Button 
                        variant="ghost" 
                        onClick={handleReset}
                        className="text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-5"
                    >
                        Reset All
                    </Button>
                    <div className="flex-1" />
                    <Button 
                        onClick={handleApply}
                        className="h-11 px-8 text-xs font-bold uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                    >
                        Terapkan Filter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
