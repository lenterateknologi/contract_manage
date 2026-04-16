import React, { useState, useEffect } from 'react';
import {
    Filter,
    Plus,
    X,
    Search,
    Trash2,
    Save,
    History,
    CheckCircle2,
    ChevronDown,
    Calendar as CalendarIcon,
    ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export type FilterRule = {
    id: string;
    field: string;
    operator: string;
    value: any;
};

export type AdvancedFilters = {
    conjunction: 'AND' | 'OR';
    match_type: 'exact' | 'partial';
    rules: FilterRule[];
};

interface AdvancedSearchProps {
    fields: { label: string; value: string; type: 'text' | 'select' | 'date' | 'number'; options?: { label: string; value: any }[] }[];
    onApply: (filters: AdvancedFilters) => void;
    initialFilters?: AdvancedFilters;
    storageKey?: string;
}

export function AdvancedSearch({ fields, onApply, initialFilters, storageKey = 'advanced_search_history' }: AdvancedSearchProps) {
    const [open, setOpen] = useState(false);
    const [filters, setFilters] = useState<AdvancedFilters>(initialFilters || {
        conjunction: 'AND',
        match_type: 'partial',
        rules: []
    });

    const [history, setHistory] = useState<AdvancedFilters[]>([]);
    const [savedSearches, setSavedSearches] = useState<{ name: string; filters: AdvancedFilters }[]>([]);

    useEffect(() => {
        const storedHistory = localStorage.getItem(storageKey);
        if (storedHistory) setHistory(JSON.parse(storedHistory));

        const storedSaved = localStorage.getItem(`${storageKey}_saved`);
        if (storedSaved) setSavedSearches(JSON.parse(storedSaved));
    }, [storageKey]);

    const addRule = () => {
        const id = Math.random().toString(36).substr(2, 9);
        const firstField = fields[0];
        setFilters(prev => ({
            ...prev,
            rules: [...prev.rules, { id, field: firstField.value, operator: '=', value: '' }]
        }));
    };

    const removeRule = (id: string) => {
        setFilters(prev => ({
            ...prev,
            rules: prev.rules.filter(r => r.id !== id)
        }));
    };

    const updateRule = (id: string, updates: Partial<FilterRule>) => {
        setFilters(prev => ({
            ...prev,
            rules: prev.rules.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
    };

    const handleApply = () => {
        onApply(filters);
        setOpen(false);

        // Save to history
        if (filters.rules.length > 0) {
            const newHistory = [filters, ...history.slice(0, 9)];
            setHistory(newHistory);
            localStorage.setItem(storageKey, JSON.stringify(newHistory));
        }
    };

    const handleSave = () => {
        const name = prompt('Enter a name for this search:');
        if (name) {
            const newSaved = [...savedSearches, { name, filters }];
            setSavedSearches(newSaved);
            localStorage.setItem(`${storageKey}_saved`, JSON.stringify(newSaved));
        }
    };

    const clearAll = () => {
        setFilters({
            conjunction: 'AND',
            match_type: 'partial',
            rules: []
        });
    };

    const activeRulesCount = filters.rules.length;

    const getOperatorsForField = (fieldValue: string) => {
        const field = fields.find(f => f.value === fieldValue);
        if (!field) return [];

        const common = [
            { label: 'Equals', value: '=' },
            { label: 'Not Equals', value: '!=' }
        ];

        if (field.type === 'text') {
            return [
                ...common,
                { label: 'Contains', value: 'contains' },
                { label: 'Starts With', value: 'starts_with' },
                { label: 'Ends With', value: 'ends_with' }
            ];
        }

        if (field.type === 'number' || field.type === 'date') {
            return [
                ...common,
                { label: 'Greater Than', value: '>' },
                { label: 'Less Than', value: '<' },
                { label: 'Between', value: 'between' }
            ];
        }

        if (field.type === 'select') {
            return [
                ...common,
                { label: 'In', value: 'in' },
                { label: 'Not In', value: 'not_in' }
            ];
        }

        return common;
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 px-3 gap-2 border-slate-200 font-bold text-[11px] uppercase tracking-wider shadow-sm bg-white">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    Advanced Search
                    {activeRulesCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-0">
                            {activeRulesCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[600px] p-0 overflow-hidden rounded-xl border-slate-200 shadow-xl">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Advanced Search Builder</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Create complex filters for your data</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={filters.conjunction}
                            onValueChange={(v: any) => setFilters(prev => ({ ...prev, conjunction: v }))}
                        >
                            <SelectTrigger className="h-8 w-24 text-[10px] font-bold uppercase bg-white border-slate-200">
                                <SelectValue placeholder="AND" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AND">Match All (AND)</SelectItem>
                                <SelectItem value="OR">Match Any (OR)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.match_type}
                        onValueChange={(v: any) => setFilters(prev => ({ ...prev, match_type: v }))}
                        >
                            <SelectTrigger className="h-8 w-24 text-[10px] font-bold uppercase bg-white border-slate-200">
                                <SelectValue placeholder="Partial" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="partial">Partial Match</SelectItem>
                                <SelectItem value="exact">Exact Match</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-4 flex flex-col gap-3">
                    {filters.rules.map((rule, index) => {
                        const fieldDef = fields.find(f => f.value === rule.field);
                        const operators = getOperatorsForField(rule.field);

                        return (
                            <div key={rule.id} className="group relative flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex-none text-[10px] font-black text-slate-300 w-6">
                                    {index === 0 ? '#' : filters.conjunction}
                                </div>
                                <div className="grid grid-cols-3 gap-2 flex-grow">
                                    <Select
                                        value={rule.field}
                                        onValueChange={(v) => updateRule(rule.id, { field: v, operator: '=', value: '' })}
                                    >
                                        <SelectTrigger className="h-9 text-[12px] bg-white border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fields.map(f => (
                                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={rule.operator}
                                        onValueChange={(v) => updateRule(rule.id, { operator: v })}
                                    >
                                        <SelectTrigger className="h-9 text-[12px] bg-white border-slate-200 uppercase font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {operators.map(op => (
                                                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="relative">
                                        {rule.operator === 'between' ? (
                                            <div className="flex gap-1">
                                                <Input
                                                    type={fieldDef?.type === 'date' ? 'date' : 'number'}
                                                    placeholder="From"
                                                    className="h-9 text-[12px] border-slate-200 focus:ring-primary/20"
                                                    value={Array.isArray(rule.value) ? rule.value[0] : ''}
                                                    onChange={(e) => updateRule(rule.id, { value: [e.target.value, Array.isArray(rule.value) ? rule.value[1] : ''] })}
                                                />
                                                <Input
                                                    type={fieldDef?.type === 'date' ? 'date' : 'number'}
                                                    placeholder="To"
                                                    className="h-9 text-[12px] border-slate-200 focus:ring-primary/20"
                                                    value={Array.isArray(rule.value) ? rule.value[1] : ''}
                                                    onChange={(e) => updateRule(rule.id, { value: [Array.isArray(rule.value) ? rule.value[0] : '', e.target.value] })}
                                                />
                                            </div>
                                        ) : fieldDef?.type === 'select' ? (
                                            <Select
                                                value={rule.value}
                                                onValueChange={(v) => updateRule(rule.id, { value: v })}
                                            >
                                                <SelectTrigger className="h-9 text-[12px] bg-white border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fieldDef.options?.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                type={fieldDef?.type === 'date' ? 'date' : fieldDef?.type === 'number' ? 'number' : 'text'}
                                                className="h-9 text-[12px] border-slate-200 focus:ring-primary/20"
                                                placeholder="Value..."
                                                value={rule.value}
                                                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                            />
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => removeRule(rule.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}

                    {filters.rules.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <Search className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-500">No filter rules yet</p>
                            <p className="text-xs text-slate-400 mb-4">Add a rule to start filtering your contracts</p>
                            <Button variant="outline" size="sm" onClick={addRule} className="h-8 border-dashed gap-1.5 font-bold uppercase text-[10px]">
                                <Plus className="h-3 w-3" /> Add First Rule
                            </Button>
                        </div>
                    )}

                    {filters.rules.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={addRule}
                            className="h-9 self-start mt-2 border border-dashed border-slate-200 bg-white hover:bg-slate-50 text-primary gap-2 font-bold uppercase text-[10px] w-full"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Another Rule
                        </Button>
                    )}
                </div>

                <Separator className="bg-slate-200" />

                <div className="p-4 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="h-9 px-3 text-[10px] font-bold uppercase text-slate-400 hover:text-red-500"
                        >
                            Reset
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSave}
                            disabled={filters.rules.length === 0}
                            className="h-9 px-3 text-[10px] font-bold uppercase text-slate-500 gap-1.5"
                        >
                            <Save className="h-3.5 w-3.5" /> Save Search
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="h-9 px-6 text-[11px] font-bold uppercase border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApply}
                            className="h-9 px-8 text-[11px] font-bold uppercase shadow-lg shadow-primary/20"
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>

                {(history.length > 0 || savedSearches.length > 0) && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-4">
                            {savedSearches.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                        <Save className="h-3 w-3" /> Saved Searches
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {savedSearches.map((s, i) => (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                className="cursor-pointer hover:bg-slate-200 text-[10px] font-medium py-1 px-2 border-slate-200"
                                                onClick={() => setFilters(s.filters)}
                                            >
                                                {s.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {history.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                                        <History className="h-3 w-3" /> Recent Searches
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {history.map((h, i) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-slate-100 text-[10px] font-medium py-1 px-2 border-slate-200 bg-white"
                                                onClick={() => setFilters(h)}
                                            >
                                                Search {i + 1}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function HighlightingCell({ text, search }: { text: string; search: string }) {
    if (!search) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => (
                part.toLowerCase() === search.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            ))}
        </span>
    );
}
