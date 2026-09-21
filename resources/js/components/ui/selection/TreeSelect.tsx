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
    inline?: boolean;
    defaultExpandAll?: boolean;
    disableParentSelection?: boolean;
    size?: 'default' | 'sm';
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
    inline = false,
    defaultExpandAll = false,
    disableParentSelection = false,
    size = 'default',
}: TreeSelectProps) {
    const [open, setOpen] = React.useState(inline);
    const [search, setSearch] = React.useState('');
    const [filterTab, setFilterTab] = React.useState<'all' | 'selected'>('all');
    const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});
    const [isMounted, setIsMounted] = React.useState(false);
    const isSmall = size === 'sm';

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

    // Value handling
    const selectedIds = React.useMemo(() => {
        if (Array.isArray(value)) return value.map(String);
        return value ? [String(value)] : [];
    }, [value]);

    const isSelected = (id: string | number) => selectedIds.includes(String(id));

    // Build N-level recursive tree
    const treeData = React.useMemo(() => {
        const buildNode = (parentId: string | null = null): any[] => {
            // Find items belonging to this parentId
            const children = items.filter(item => {
                if (parentId === null) return !item.parent_id || String(item.parent_id) === String(item.id);
                return String(item.parent_id) === parentId && String(item.parent_id) !== String(item.id);
            });
            return children.map(child => ({
                ...child,
                children: buildNode(String(child.id))
            }));
        };
        
        let roots = buildNode(null);
        
        // Handle orphans (items whose parent is not in the list)
        if (roots.length === 0 && items.length > 0) {
            const allIds = new Set(items.map(i => String(i.id)));
            const orphans = items.filter(i => i.parent_id && !allIds.has(String(i.parent_id)));
            roots = orphans.map(child => ({
                ...child,
                children: buildNode(String(child.id))
            }));
            
            if (roots.length === 0) {
                roots = items.map(i => ({...i, children: []}));
            }
        }
        
        return roots;
    }, [items]);

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
        
        // Helper to get all descendants IDs
        const getAllDescendantIds = (node: any): string[] => {
            let ids: string[] = [];
            if (node.children) {
                node.children.forEach((c: any) => {
                    ids.push(String(c.id));
                    ids = [...ids, ...getAllDescendantIds(c)];
                });
            }
            return ids;
        };

        // Find the node in tree to get its children
        const findNode = (nodes: any[], targetId: string): any => {
            for (const n of nodes) {
                if (String(n.id) === targetId) return n;
                if (n.children) {
                    const found = findNode(n.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        const node = findNode(treeData, id);
        const descendantIds = node ? getAllDescendantIds(node) : [];
        const hasChildren = descendantIds.length > 0;

        if (hasChildren) {
            // Check if fully selected
            const currentlyFullySelected = isSelected(id) && descendantIds.every(dId => isSelected(dId));

            if (currentlyFullySelected) {
                // Deselect parent and all descendants
                newSelected = newSelected.filter(sid => sid !== id && !descendantIds.includes(sid));
            } else {
                // Select parent and all descendants
                if (!newSelected.includes(id)) newSelected.push(id);
                descendantIds.forEach(cid => {
                    if (!newSelected.includes(cid)) newSelected.push(cid);
                });
            }
        } else {
            // Leaf selection
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
            
            // Map IDs to names
            const names = selectedIds.map(id => {
                const item = items.find(i => String(i.id) === id);
                return item ? item.name : id;
            });
            
            if (names.length <= 2) return names.join(', ');
            return `${names.slice(0, 2).join(', ')} +${names.length - 2} lagi`;
        } else {
            if (selectedIds.length === 0) return null;
            const item = items.find(i => String(i.id) === selectedIds[0]);
            if (!item) return selectedIds[0];
            
            const pathNames = [item.name];
            let current = item;
            
            // Traverse up to find all ancestors
            while (current && current.parent_id && String(current.parent_id) !== String(current.id)) {
                const parent = items.find((i: any) => String(i.id) === String(current.parent_id));
                if (parent && String(parent.id) !== String(current.id)) {
                    pathNames.unshift(parent.name);
                    current = parent;
                } else {
                    break;
                }
            }
            
            return pathNames.join(' - ');
        }
    }, [selectedIds, multiple, items]);

    // Filtering logic (Preserve full parent-to-child hierarchy on search and selected tab)
    const filteredTree = React.useMemo(() => {
        const searchLower = search.toLowerCase().trim();

        const filterSubtree = (node: any): any | null => {
            const nId = String(node.id);
            const matchesSearch = !searchLower || node.name?.toLowerCase().includes(searchLower);

            // If selected only mode is on, check if self or any descendant is selected
            const isNodeSelected = selectedIds.includes(nId);

            const filteredChildren = (node.children || [])
                .map(filterSubtree)
                .filter(Boolean);

            if (filterTab === 'selected') {
                if (isNodeSelected || filteredChildren.length > 0) {
                    if (matchesSearch || filteredChildren.length > 0) {
                        return {
                            ...node,
                            children: filteredChildren,
                        };
                    }
                }
                return null;
            }

            // Normal search mode
            if (matchesSearch) {
                return node;
            }

            if (filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren,
                };
            }

            return null;
        };

        return treeData.map(filterSubtree).filter(Boolean);
    }, [treeData, search, filterTab, selectedIds]);

    // Auto expand parents if searching or if filterTab is selected or defaultExpandAll
    React.useEffect(() => {
        if (search.trim() || filterTab === 'selected' || defaultExpandAll) {
            const newExpanded: Record<string, boolean> = {};
            const expandAll = (nodes: any[]) => {
                nodes.forEach(n => {
                    newExpanded[String(n.id)] = true;
                    if (n.children) expandAll(n.children);
                });
            };
            expandAll(filteredTree);
            setExpandedParents(prev => ({...prev, ...newExpanded}));
        }
    }, [search, filteredTree, filterTab, defaultExpandAll]);

    const toggleParentExpansion = (pId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedParents(prev => ({
            ...prev,
            [pId]: !prev[pId]
        }));
    };

    // Recursive render function
    const renderTreeNodes = (nodes: any[], depth = 0) => {
        return nodes.map(node => {
            const nId = String(node.id);
            const isExpanded = !!expandedParents[nId];
            const hasChildren = node.children && node.children.length > 0;
            
            let fullySelected = false;
            let partiallySelected = false;
            
            if (multiple && hasChildren) {
                const getAllDescendantIds = (n: any): string[] => {
                    let ids: string[] = [];
                    if (n.children) {
                        n.children.forEach((c: any) => {
                            ids.push(String(c.id));
                            ids = [...ids, ...getAllDescendantIds(c)];
                        });
                    }
                    return ids;
                };
                const descendantIds = getAllDescendantIds(node);
                const selectedDescendants = descendantIds.filter(dId => isSelected(dId));
                
                fullySelected = isSelected(nId) && selectedDescendants.length === descendantIds.length;
                partiallySelected = isSelected(nId) || selectedDescendants.length > 0;
            } else {
                fullySelected = isSelected(nId);
            }

            return (
                <div key={nId} className="flex flex-col relative">
                    <div 
                        className="group flex w-full items-center gap-1 rounded-md hover:bg-sidebar-accent/40 pr-2 relative"
                        style={{ paddingLeft: depth === 0 ? '0px' : '6px' }}
                    >
                        {/* Horizontal Connector Line (Line X) for child items */}
                        {depth > 0 && (
                            <div className="absolute -left-[13px] top-1/2 w-3 h-0 border-t-2 border-primary/30 dark:border-primary/40 -translate-y-1/2" />
                        )}

                        <button
                            type="button"
                            onClick={(e) => {
                                if (disableParentSelection && hasChildren) {
                                    toggleParentExpansion(nId, e as any);
                                } else {
                                    handleSelect(node);
                                }
                            }}
                            className={cn(
                                "flex flex-1 items-center gap-2 py-1.5 text-left text-sm transition-colors rounded-sm cursor-pointer",
                                depth === 0 ? "font-semibold px-3" : "font-medium px-2",
                                fullySelected ? "text-primary font-medium" : "text-popover-foreground/80"
                            )}
                        >
                            {(!disableParentSelection || !hasChildren) && (
                                multiple ? (
                                    <div className={cn(
                                        "flex h-3.5 w-3.5 items-center justify-center rounded border transition-all shrink-0",
                                        fullySelected 
                                            ? "border-primary bg-primary text-primary-foreground" 
                                            : partiallySelected 
                                                ? "border-primary bg-primary/20 text-primary"
                                                : "border-border bg-transparent group-hover:border-foreground/30"
                                    )}>
                                        {fullySelected ? <Check size={10} /> : partiallySelected ? <div className="h-1 w-1.5 rounded-sm bg-current" /> : null}
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all shrink-0",
                                        fullySelected 
                                            ? "border-primary bg-primary text-primary-foreground" 
                                            : "border-border bg-transparent group-hover:border-foreground/30"
                                    )}>
                                        {fullySelected && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                                    </div>
                                )
                            )}
                            <span className="flex-1 truncate">{node.name}</span>
                        </button>

                        {hasChildren && (
                            <button
                                type="button"
                                onClick={(e) => toggleParentExpansion(nId, e)}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                            >
                                <ChevronDown 
                                    size={14} 
                                    className={cn("transition-transform duration-200", isExpanded ? "" : "-rotate-90")} 
                                />
                            </button>
                        )}
                    </div>

                    {isExpanded && hasChildren && (
                        <div className="flex flex-col border-l-2 border-primary/30 dark:border-primary/40 ml-[18px] pl-3 my-0.5 space-y-0.5">
                            {renderTreeNodes(node.children, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const dropdownContent = (open || inline) && (
        <div
            id="tree-select-dropdown"
            className={cn(
                "flex flex-col text-popover-foreground",
                inline ? "w-full space-y-2" : "absolute left-0 right-0 top-full z-50 mt-1 max-h-[380px] overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 p-2"
            )}
        >
            {/* Search & Filter Header */}
            <div className="flex flex-col gap-1.5 pb-1">
                <div className={cn(
                    "flex items-center px-3 shrink-0 bg-background rounded-md border border-border",
                    inline && "sticky top-0 z-10"
                )}>
                    <Search size={14} className="mr-2 shrink-0 text-muted-foreground" />
                    <input
                        autoFocus={!inline}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="flex h-9 w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>

                {/* Filter Tabs (when multiple is enabled) */}
                {multiple && (
                    <div className="flex items-center justify-between bg-muted/50 p-1 rounded-md border border-border/50 text-xs">
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterTab('all');
                                }}
                                className={cn(
                                    "px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer",
                                    filterTab === 'all'
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterTab('selected');
                                }}
                                className={cn(
                                    "px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                                    filterTab === 'selected'
                                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span>Hanya Terpilih</span>
                                <span className={cn(
                                    "px-1.5 py-0.2 rounded-full text-[10px]",
                                    filterTab === 'selected' ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                )}>
                                    {selectedIds.length}
                                </span>
                            </button>
                        </div>

                        {selectedIds.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onValueChange([]);
                                }}
                                className="text-[11px] text-rose-500 hover:text-rose-600 hover:underline px-1.5 cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className={cn("p-0.5", inline ? "w-full" : "flex-1 overflow-y-auto max-h-[280px] [scrollbar-width:thin] custom-scrollbar")}>
                {filteredTree.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground italic">
                        {filterTab === 'selected' ? 'Belum ada tipe yang dipilih' : emptyText}
                    </div>
                ) : (
                    renderTreeNodes(filteredTree)
                )}
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="relative w-full space-y-1">
            {!inline && (
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
                        'flex w-full items-center justify-between rounded-lg border border-border bg-surface-base font-normal ring-offset-background transition-all outline-hidden text-left',
                        isSmall ? 'h-9 px-3 text-xs' : 'h-10 px-3.5 py-2 text-sm',
                        !disabled && 'cursor-pointer hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary',
                        disabled && 'cursor-not-allowed opacity-50 bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-500',
                        open && 'border-primary ring-1 ring-primary',
                        triggerClassName
                    )}
                >
                    <span className={cn('truncate', isSmall ? 'text-xs' : 'text-sm', selectedDisplay ? 'text-foreground font-normal' : 'text-muted-foreground font-normal')}>
                        {selectedDisplay || placeholder}
                    </span>
                    <ChevronDown size={15} className={cn('text-muted-foreground shrink-0 ml-2 transition-transform duration-200', open && 'rotate-180')} />
                </button>
            )}

            {/* Selected badges for multi-selection in TreeSelect */}
            {multiple && !inline && selectedIds.length > 0 && !disabled && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedIds.map(id => {
                        const item = items.find(i => String(i.id) === id);
                        const label = item ? item.name : id;
                        return (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 max-w-full"
                            >
                                <span className="truncate max-w-[220px]">{label}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newSelected = selectedIds.filter(sid => sid !== id);
                                        onValueChange(newSelected);
                                    }}
                                    className="hover:bg-primary/20 rounded-full p-0.5 cursor-pointer text-primary transition-colors shrink-0"
                                    title="Hapus tipe ini"
                                >
                                    <Check size={10} className="hidden" />
                                    <span className="font-bold text-xs leading-none">×</span>
                                </button>
                            </span>
                        );
                    })}
                    {selectedIds.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onValueChange([]);
                            }}
                            className="text-[10.5px] font-medium text-rose-500 hover:text-rose-600 hover:underline px-1.5 py-0.5 cursor-pointer"
                        >
                            Hapus Semua ({selectedIds.length})
                        </button>
                    )}
                </div>
            )}

            {dropdownContent}
        </div>
    );
}
