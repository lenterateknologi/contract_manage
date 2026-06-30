import React, { useState } from 'react';
import {
    Filter,
    X,
    Calendar as CalendarIcon,
    ChevronDown,
    Search,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { Badge } from '@/components/ui/feedback/Badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { Label } from '@/components/ui/forms/Label';
import { Separator } from '@/components/ui/utilities/Separator';
import { cn } from '@/lib/utils';
import { AdvancedFilters } from '@/types/filters';

interface SimpleFiltersProps {
    types: { id: any; name: string }[];
    onApply: (filters: { status?: any[]; type?: any[]; date_range?: [string, string]; value_range?: [number, number] }) => void;
    onAdvancedApply?: (filters: AdvancedFilters) => void;
    currentFilters: {
        status?: any[];
        type?: any[];
        date_from?: string;
        date_to?: string;
        min_amount?: number;
        max_amount?: number;
    };
    placeholder?: string;
    primaryAction?: React.ReactNode;
}

const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Review', value: 'in_review' },
    { label: 'Revision', value: 'revision' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
];

export function SimpleFilters({
    types,
    onApply,
    onAdvancedApply,
    currentFilters,
    placeholder = "Cari...",
    primaryAction
}: SimpleFiltersProps) {
    const [open, setOpen] = useState(false);

    // Local state for the filter form
    const [status, setStatus] = useState<any[]>(currentFilters.status || []);
    const [typeIds, setTypeIds] = useState<any[]>(currentFilters.type || []);
    const [dateFrom, setDateFrom] = useState(currentFilters.date_from || '');
    const [dateTo, setDateTo] = useState(currentFilters.date_to || '');

    const handleApply = () => {
        // Map to standard filters
        onApply({
            status: status.length > 0 ? status : [],
            type: typeIds.length > 0 ? typeIds : [],
            date_range: (dateFrom || dateTo) ? [dateFrom, dateTo] : undefined
        });

        // Map to AdvancedFilters format for backend query engine
        if (onAdvancedApply) {
            const rules: any[] = [];

            if (status.length > 0) {
                rules.push({
                    id: 'f-status',
                    field: 'status',
                    operator: 'in',
                    value: status
                });
            }

            if (typeIds.length > 0) {
                rules.push({
                    id: 'f-type',
                    field: 'contract_type_id',
                    operator: 'in',
                    value: typeIds
                });
            }

            if (dateFrom) {
                rules.push({
                    id: 'f-date-from',
                    field: 'created_at',
                    operator: '>=',
                    value: dateFrom
                });
            }

            if (dateTo) {
                rules.push({
                    id: 'f-date-to',
                    field: 'created_at',
                    operator: '<=',
                    value: dateTo
                });
            }

            onAdvancedApply({
                conjunction: 'AND',
                match_type: 'partial',
                rules
            });
        }

        setOpen(false);
    };

    const handleReset = () => {
        setStatus([]);
        setTypeIds([]);
        setDateFrom('');
        setDateTo('');
        onApply({ status: [], type: [] });
        if (onAdvancedApply) {
            onAdvancedApply({ conjunction: 'AND', match_type: 'partial', rules: [] });
        }
        setOpen(false);
    };

    const toggleStatus = (val: string) => {
        setStatus(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
    };

    const toggleType = (val: any) => {
        setTypeIds(prev => prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]);
    };

    const activeCount = status.length + typeIds.length + (dateFrom || dateTo ? 1 : 0);

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "h-10 px-3 gap-2 border-border font-bold text-[11px] uppercase  shadow-sm bg-background transition-all",
                            activeCount > 0 && "border-primary/50 bg-primary/5 text-primary"
                        )}
                    >
                        <Filter className={cn("h-3.5 w-3.5", activeCount > 0 ? "text-primary" : "text-muted-foreground")} />
                        Filter
                        {activeCount > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-0">
                                {activeCount}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[320px] p-0 overflow-hidden rounded-xl border-border shadow-xl bg-card" align="start">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
                        <h3 className="text-xs font-bold text-foreground uppercase ">Filter Kontrak</h3>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setOpen(false)}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <div className="p-4 flex flex-col gap-5 max-h-[450px] overflow-y-auto">
                        {/* Status Section */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-semibold uppercase  text-muted-foreground">Status Kontrak</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {statusOptions.map((opt) => (
                                    <div
                                        key={opt.value}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background cursor-pointer hover:border-primary/30 transition-all",
                                            status.includes(opt.value) && "border-primary/50 bg-primary/5"
                                        )}
                                        onClick={() => toggleStatus(opt.value)}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                            status.includes(opt.value) ? "bg-primary border-primary" : "border-border"
                                        )}>
                                            {status.includes(opt.value) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                                        </div>
                                        <span className="text-[11px] font-medium text-foreground/80">{opt.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Tipe Section */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-semibold uppercase  text-muted-foreground">Tipe Kontrak</Label>
                            <div className="flex flex-wrap gap-2">
                                {types.map((type) => (
                                    <Badge
                                        key={type.id}
                                        variant={typeIds.includes(type.id) ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer px-2.5 py-1 text-[10px] font-bold uppercase transition-all",
                                            !typeIds.includes(type.id) && "hover:bg-muted border-border text-muted-foreground"
                                        )}
                                        onClick={() => toggleType(type.id)}
                                    >
                                        {type.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Tanggal Section */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-semibold uppercase  text-muted-foreground">Rentang Tanggal</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Dari</span>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="h-8 text-[11px] border-border bg-background/50 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Sampai</span>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="h-8 text-[11px] border-border bg-background/50 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-muted/50 border-t border-border flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-[10px] font-bold uppercase text-muted-foreground hover:text-destructive"
                        >
                            Reset All
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApply}
                            className="h-9 px-6 text-[10px] font-bold uppercase shadow-lg shadow-primary/20"
                        >
                            Apply Filters
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {primaryAction && (
                <div className="shrink-0">
                    {primaryAction}
                </div>
            )}
        </div>
    );
}
