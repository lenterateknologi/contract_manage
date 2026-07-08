import * as React from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TreeSelectItem {
    id: string | number;
    name: string;
    parent_id?: string | number | null;
}

interface TreeSelectProps {
    value: string | string[];
    onValueChange: (value: any, parentId?: string) => void;
    items: TreeSelectItem[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    triggerClassName?: string;
    multiple?: boolean;
    disabled?: boolean;
    parentSelectsChildrenOnly?: boolean;
}

export function TreeSelect({
    value,
    onValueChange,
    items = [],
    placeholder = 'Pilih Klasifikasi / Jenis Kontrak',
    searchPlaceholder = 'Cari...',
    emptyText = 'Tidak ada hasil',
    triggerClassName,
    multiple = false,
    disabled = false,
    parentSelectsChildrenOnly = false,
}: TreeSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});
    const [isMounted, setIsMounted] = React.useState(false);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        setIsMounted(true);
        // Handle clicking outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to identify if an item is a parent
    const isParentItem = (item: TreeSelectItem) => {
        return !item.parent_id || String(item.parent_id) === String(item.id);
    };

    // Helper to identify if an item is a child
    const isChildItem = (item: TreeSelectItem) => {
        return !!item.parent_id && String(item.parent_id) !== String(item.id);
    };

    // Group items into Parents and Children
    const parents = React.useMemo(() => items.filter(isParentItem), [items]);

    const childrenByParent = React.useMemo(() => {
        const groups: Record<string, TreeSelectItem[]> = {};
        items.forEach((item) => {
            if (isChildItem(item)) {
                const pId = String(item.parent_id);
                if (!groups[pId]) groups[pId] = [];
                groups[pId].push(item);
            }
        });
        return groups;
    }, [items]);

    // Value handling
    const selectedIds = React.useMemo(() => {
        if (Array.isArray(value)) return value.map(String);
        return value ? [String(value)] : [];
    }, [value]);

    const isSelected = (id: string | number) => selectedIds.includes(String(id));

    const isParentFullySelected = (pId: string) => {
        const children = childrenByParent[pId] || [];
        if (children.length === 0) return isSelected(pId);
        return children.every(c => isSelected(c.id));
    };

    const isParentPartiallySelected = (pId: string) => {
        const children = childrenByParent[pId] || [];
        if (children.length === 0) return false;
        const selectedChildren = children.filter(c => isSelected(c.id));
        return selectedChildren.length > 0 && selectedChildren.length < children.length;
    };

    // Selection logic
    const handleSelect = (item: TreeSelectItem) => {
        const id = String(item.id);
        const pId = String(item.parent_id);

        if (!multiple) {
            onValueChange(id, pId);
            setOpen(false);
            return;
        }

        let newSelected = [...selectedIds];
        const isParent = isParentItem(item);

        if (isParent) {
            const children = childrenByParent[id] || [];
            const currentlyFullySelected = isParentFullySelected(id);

            if (currentlyFullySelected) {
                // Deselect parent and all children
                newSelected = newSelected.filter(sid => sid !== id && !children.some(c => String(c.id) === sid));
            } else {
                // Select parent and all children
                if (!newSelected.includes(id) && !parentSelectsChildrenOnly) newSelected.push(id);
                children.forEach(c => {
                    const cid = String(c.id);
                    if (!newSelected.includes(cid)) newSelected.push(cid);
                });
            }
        } else {
            // Child selection
            if (newSelected.includes(id)) {
                newSelected = newSelected.filter(sid => sid !== id);
            } else {
                newSelected.push(id);
            }
        }

        onValueChange(newSelected);
    };

    // Find currently selected items for display
    const selectedDisplay = React.useMemo(() => {
        if (multiple) {
            if (selectedIds.length === 0) return null;
            if (selectedIds.length === 1) {
                const item = items.find(i => String(i.id) === selectedIds[0]);
                return item ? item.name : `${selectedIds.length} terpilih`;
            }
            return `${selectedIds.length} terpilih`;
        }
        
        const item = items.find((item) => String(item.id) === String(value));
        if (!item) return null;
        
        const parent = items.find(p => String(p.id) === String(item.parent_id));
        return (
            <span className="flex items-center gap-1.5">
                {parent && parent.id !== item.id && (
                    <>
                        <span className="opacity-60 font-normal">{parent.name}</span>
                        <span className="opacity-40">/</span>
                    </>
                )}
                <span>{item.name}</span>
            </span>
        );
    }, [items, value, selectedIds, multiple]);

    // Search and filter logic
    const filteredHierarchy = React.useMemo(() => {
        if (!search.trim()) return { parents, childrenByParent };

        const searchLower = search.toLowerCase();

        // Filter children matching query
        const matchingChildren = items.filter(
            (item) => isChildItem(item) && item.name.toLowerCase().includes(searchLower)
        );

        // Filter parents matching query
        const matchingParents = parents.filter(
            (p) => p.name.toLowerCase().includes(searchLower)
        );

        // Build a filtered list of parents to display
        const finalParents = parents.filter((p) => {
            const pId = String(p.id);
            const hasMatchingChild = matchingChildren.some(c => String(c.parent_id) === pId);
            const parentMatches = matchingParents.some(mp => String(mp.id) === pId);
            return hasMatchingChild || parentMatches;
        });

        const finalChildrenByParent: Record<string, TreeSelectItem[]> = {};
        finalParents.forEach((p) => {
            const pId = String(p.id);
            const parentMatches = matchingParents.some(mp => String(mp.id) === pId);
            const allChildren = childrenByParent[pId] || [];

            if (parentMatches) {
                // If parent matches, show all its children
                finalChildrenByParent[pId] = allChildren;
            } else {
                // If only child matches, show only matching children
                finalChildrenByParent[pId] = allChildren.filter(c =>
                    c.name.toLowerCase().includes(searchLower)
                );
            }
        });

        return { parents: finalParents, childrenByParent: finalChildrenByParent };
    }, [parents, childrenByParent, items, search]);

    // Auto expand parents if searching
    React.useEffect(() => {
        if (search.trim()) {
            const newExpanded: Record<string, boolean> = {};
            filteredHierarchy.parents.forEach((p) => {
                newExpanded[String(p.id)] = true;
            });
            setExpandedParents(newExpanded);
        }
    }, [search, filteredHierarchy.parents]);

    const toggleParentExpansion = (pId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedParents(prev => ({
            ...prev,
            [pId]: !prev[pId]
        }));
    };

    const dropdownContent = open && (
        <div
            id="tree-select-dropdown"
            className="absolute left-0 right-0 top-full z-50 border-sidebar-border bg-sidebar mt-1 max-h-[400px] flex flex-col overflow-hidden rounded-lg border shadow-xl animate-in fade-in slide-in-from-top-1 duration-100"
        >
            {/* Search input */}
            <div className="relative border-b border-sidebar-border/50 bg-sidebar-accent/10 px-3 py-2">
                <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-sidebar-foreground/40" />
                <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-8 w-full bg-transparent pl-8 pr-3 text-[12px] text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/30 border border-sidebar-border/50 rounded-md focus:border-sidebar-primary/50"
                />
            </div>

            {/* Option list */}
            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                {filteredHierarchy.parents.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-sidebar-foreground/40 italic">{emptyText}</div>
                ) : (
                    filteredHierarchy.parents.map(p => {
                        const pId = String(p.id);
                        const isExpanded = !!expandedParents[pId];
                        const children = filteredHierarchy.childrenByParent[pId] || [];
                        const hasChildren = children.length > 0;
                        
                        const fullySelected = isParentFullySelected(pId);
                        const partiallySelected = isParentPartiallySelected(pId);

                        return (
                            <div key={pId} className="flex flex-col">
                                {/* Parent row */}
                                <div className="group flex w-full items-center gap-1 rounded-md hover:bg-sidebar-accent/40 pr-2">
                                    {/* Selection Area */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            if (!multiple && hasChildren) {
                                                toggleParentExpansion(pId, e);
                                            } else {
                                                handleSelect(p);
                                            }
                                        }}
                                        className={cn(
                                            "flex flex-1 items-center gap-2 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-tight transition-colors",
                                            fullySelected && (multiple || !hasChildren) ? "text-sidebar-primary" : "text-sidebar-foreground/75"
                                        )}
                                    >
                                        {!(!multiple && hasChildren) && (
                                            <div className={cn(
                                                "flex h-3.5 w-3.5 items-center justify-center rounded border transition-all",
                                                fullySelected ? "bg-sidebar-primary border-sidebar-primary text-white" : 
                                                partiallySelected ? "bg-sidebar-primary/20 border-sidebar-primary text-sidebar-primary" :
                                                "bg-transparent border-sidebar-border group-hover:border-sidebar-foreground/30"
                                            )}>
                                                {fullySelected && <Check size={10} strokeWidth={4} />}
                                                {!fullySelected && partiallySelected && <div className="h-0.5 w-2 bg-current rounded-full" />}
                                            </div>
                                        )}
                                        <span>{p.name}</span>
                                    </button>

                                    {/* Expansion Toggle */}
                                    {hasChildren && (
                                        <button
                                            type="button"
                                            onClick={(e) => toggleParentExpansion(pId, e)}
                                            className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/40 transition-all"
                                        >
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                    )}
                                </div>

                                {/* Child list */}
                                {hasChildren && isExpanded && (
                                    <div className="mt-0.5 space-y-0.5 pl-4 border-l border-sidebar-border/30 ml-6 mb-1">
                                        {children.map(c => {
                                            const cId = String(c.id);
                                            const childSelected = isSelected(cId);
                                            return (
                                                <button
                                                    key={cId}
                                                    type="button"
                                                    onClick={() => handleSelect(c)}
                                                    className={cn(
                                                        'flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] rounded-md transition-all group/child',
                                                        childSelected
                                                            ? 'bg-sidebar-primary/10 text-sidebar-primary font-semibold'
                                                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/30'
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex h-3 w-3 items-center justify-center rounded border transition-all",
                                                        childSelected ? "bg-sidebar-primary border-sidebar-primary text-white" : "bg-transparent border-sidebar-border group-hover/child:border-sidebar-foreground/30"
                                                    )}>
                                                        {childSelected && <Check size={8} strokeWidth={4} />}
                                                    </div>
                                                    <span>{c.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setOpen(!open);
                        setSearch('');
                    }
                }}
                className={cn(
                    'flex min-h-[44px] w-full items-center justify-between rounded-lg border border-border bg-surface-base px-4 py-2 text-left text-sm font-semibold text-foreground transition-all outline-none',
                    !disabled && 'cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary',
                    disabled && 'bg-slate-50 border-slate-200 text-slate-500 opacity-50 cursor-not-allowed shadow-none',
                    triggerClassName
                )}
            >
                <span className={cn(selectedDisplay ? 'text-black dark:text-white font-semibold' : 'text-sidebar-foreground/60')}>
                    {selectedDisplay || placeholder}
                </span>
                <ChevronDown size={14} className={cn("text-sidebar-foreground/60 shrink-0 ml-2 transition-transform duration-200", open && "rotate-180")} />
            </button>

            {dropdownContent}
        </div>
    );
}
