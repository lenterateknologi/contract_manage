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
    value: string;
    onValueChange: (value: string, parentId: string) => void;
    items: TreeSelectItem[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    triggerClassName?: string;
}

export function TreeSelect({
    value,
    onValueChange,
    items = [],
    placeholder = 'Pilih Klasifikasi / Jenis Kontrak',
    searchPlaceholder = 'Cari...',
    emptyText = 'Tidak ada hasil',
    triggerClassName,
}: TreeSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});
    const [isMounted, setIsMounted] = React.useState(false);
    const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
    
    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        setIsMounted(true);
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

    // Find currently selected child and its parent
    const selectedChild = React.useMemo(() => {
        return items.find((item) => String(item.id) === value && isChildItem(item));
    }, [items, value]);

    const selectedParent = React.useMemo(() => {
        if (!selectedChild) return null;
        return items.find((item) => String(item.id) === String(selectedChild.parent_id));
    }, [items, selectedChild]);

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

    // Calculate popup coordinates relative to viewport and scroll offset
    const updateCoords = React.useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, []);

    React.useEffect(() => {
        if (open) {
            updateCoords();
            // Listen to window size changes and nested scroll movements
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
        }
        return () => {
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [open, updateCoords]);

    // Close on outside click
    React.useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                // Check if target is inside the portal dropdown container
                const portalDropdown = document.getElementById('tree-select-portal-dropdown');
                if (portalDropdown && portalDropdown.contains(e.target as Node)) {
                    return;
                }
                setOpen(false);
                setSearch('');
            }
        }
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const toggleParent = (pId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedParents(prev => ({
            ...prev,
            [pId]: !prev[pId]
        }));
    };

    const dropdownContent = open && isMounted && coords.width > 0 && (
        <div
            id="tree-select-portal-dropdown"
            style={{
                position: 'absolute',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                zIndex: 9999,
            }}
            className="border-sidebar-border bg-sidebar mt-1 max-h-[300px] flex flex-col overflow-hidden rounded-lg border shadow-xl animate-in fade-in slide-in-from-top-1 duration-100"
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

                        return (
                            <div key={pId} className="flex flex-col">
                                {/* Parent row (clickable to expand/collapse) */}
                                <button
                                    type="button"
                                    onClick={(e) => toggleParent(pId, e)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-bold uppercase tracking-tight text-sidebar-foreground/75 hover:bg-sidebar-accent/40 rounded-md transition-colors"
                                >
                                    <span>{p.name}</span>
                                    {hasChildren && (
                                        <span className="p-0.5 rounded-sm hover:bg-sidebar-accent/60">
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </span>
                                    )}
                                </button>

                                {/* Child list */}
                                {hasChildren && isExpanded && (
                                    <div className="mt-0.5 space-y-0.5 pl-4 border-l border-sidebar-border/30 ml-4 mb-1">
                                        {children.map(c => {
                                            const cId = String(c.id);
                                            const isSelected = String(value) === cId;
                                            return (
                                                <button
                                                    key={cId}
                                                    type="button"
                                                    onClick={() => {
                                                        onValueChange(cId, pId);
                                                        setOpen(false);
                                                        setSearch('');
                                                    }}
                                                    className={cn(
                                                        'flex w-full items-center justify-between px-3 py-2 text-left text-[12px] rounded-md transition-all',
                                                        isSelected
                                                            ? 'bg-sidebar-primary/10 text-sidebar-primary font-semibold'
                                                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/30'
                                                    )}
                                                >
                                                    <span>{c.name}</span>
                                                    {isSelected && <Check size={12} className="text-sidebar-primary shrink-0 ml-2" />}
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
                onClick={() => {
                    const nextOpen = !open;
                    setOpen(nextOpen);
                    setSearch('');
                    if (nextOpen && buttonRef.current) {
                        const rect = buttonRef.current.getBoundingClientRect();
                        setCoords({
                            top: rect.bottom + window.scrollY,
                            left: rect.left + window.scrollX,
                            width: rect.width,
                        });
                    }
                }}
                className={cn(
                    'border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground focus:ring-sidebar-primary flex min-h-10 w-full items-center justify-between rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-all outline-none focus:ring-1 text-left',
                    open && 'ring-sidebar-primary ring-1 border-sidebar-primary',
                    triggerClassName
                )}
            >
                <span className={cn(selectedChild ? 'text-black dark:text-white font-semibold' : 'text-sidebar-foreground/60')}>
                    {selectedChild && selectedParent ? (
                        <span className="flex items-center gap-1.5">
                            <span className="opacity-60 font-normal">{selectedParent.name}</span>
                            <span className="opacity-40">/</span>
                            <span>{selectedChild.name}</span>
                        </span>
                    ) : (
                        placeholder
                    )}
                </span>
                <ChevronDown size={14} className={cn("text-sidebar-foreground/60 shrink-0 ml-2 transition-transform duration-200", open && "rotate-180")} />
            </button>

            {open && isMounted && coords.width > 0 && createPortal(dropdownContent, document.body)}
        </div>
    );
}
