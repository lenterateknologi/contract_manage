import { useFloatingDropdown } from '@/hooks/use-floating-dropdown';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Lock, Search, X } from 'lucide-react';
import * as React from 'react';
import ReactDOM from 'react-dom';

export interface TreeSelectItem {
    id: string | number;
    name: string;
    code?: string | null;
    parent_id?: string | number | null;
}

interface TreeSelectProps {
    value: string | string[] | null | undefined;
    onValueChange: (value: any, parentId?: string | null) => void;
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
    showRootOption?: boolean;
    sortBy?: 'code' | 'name' | 'none';
    size?: 'default' | 'sm';
    allowClear?: boolean;
    rootOptionLabel?: string;
    disabledId?: string | number;
    align?: 'start' | 'center' | 'end';
}

interface TreeSearchInputProps {
    value: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

const TreeSearchInput = React.memo(function TreeSearchInput({
    value,
    onSearch,
    placeholder = 'Cari...',
    autoFocus = true,
}: TreeSearchInputProps) {
    const [localValue, setLocalValue] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(localValue);
        }, 200);
        return () => clearTimeout(timer);
    }, [localValue, onSearch]);

    React.useEffect(() => {
        if (autoFocus) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    return (
        <div className="flex items-center px-3 shrink-0 bg-background rounded-md border border-border">
            <Search size={14} className="mr-2 shrink-0 text-muted-foreground" />
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={e => setLocalValue(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                placeholder={placeholder}
                className="flex h-8 w-full bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground focus:outline-none"
            />
            {localValue && (
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        setLocalValue('');
                        onSearch('');
                        inputRef.current?.focus();
                    }}
                    className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0 ml-1"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
});

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
    defaultExpandAll = true,
    disableParentSelection = false,
    showRootOption = false,
    sortBy = 'code',
    size = 'default',
    allowClear = true,
    rootOptionLabel = 'Tanpa Parent (Jadikan Kategori Utama / Root)',
    disabledId,
    align = 'start',
}: TreeSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [filterTab, setFilterTab] = React.useState<'all' | 'selected'>('all');
    const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const isSmall = size === 'sm';

    const coords = useFloatingDropdown(containerRef, open, {
        align,
        preferredMaxHeight: 500,
    });

    // Handle outside click & escape key
    React.useEffect(() => {
        function handleClickOutside(e: MouseEvent | PointerEvent) {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (
                containerRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
            setSearch('');
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                setOpen(false);
                setSearch('');
            }
        }

        if (open) {
            document.addEventListener('pointerdown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown, true);
        }
        return () => {
            document.removeEventListener('pointerdown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [open]);

    // Value handling
    const selectedIds = React.useMemo(() => {
        if (Array.isArray(value)) return value.filter(v => v !== null && v !== undefined && v !== '').map(String);
        return (value !== null && value !== undefined && value !== '') ? [String(value)] : [];
    }, [value]);

    const isSelected = (id: string | number) => selectedIds.includes(String(id));

    // Prevent selecting current item or its descendants when editing hierarchy
    const isNodeDisabled = React.useCallback((nodeId: string | number): boolean => {
        if (!disabledId) return false;
        if (String(nodeId) === String(disabledId)) return true;
        
        let current = items.find(i => String(i.id) === String(nodeId));
        while (current && current.parent_id && String(current.parent_id) !== String(current.id)) {
            if (String(current.parent_id) === String(disabledId)) return true;
            current = items.find(i => String(i.id) === String(current.parent_id));
        }
        return false;
    }, [disabledId, items]);

    // Build N-level recursive tree with sort by code (asc)
    const treeData = React.useMemo(() => {
        const sortComparator = (a: any, b: any) => {
            if (sortBy === 'code') {
                const codeA = (a.code || a.name || '').toString().trim();
                const codeB = (b.code || b.name || '').toString().trim();
                return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
            }
            if (sortBy === 'name') {
                const nameA = (a.name || '').toString().trim();
                const nameB = (b.name || '').toString().trim();
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
            }
            return 0;
        };

        const buildNode = (parentId: string | null = null): any[] => {
            const children = items.filter(item => {
                if (parentId === null) return !item.parent_id || String(item.parent_id) === String(item.id);
                return String(item.parent_id) === parentId && String(item.parent_id) !== String(item.id);
            });

            if (sortBy !== 'none') {
                children.sort(sortComparator);
            }

            return children.map(child => ({
                ...child,
                children: buildNode(String(child.id))
            }));
        };
        
        let roots = buildNode(null);
        
        // Handle orphans
        if (roots.length === 0 && items.length > 0) {
            const allIds = new Set(items.map(i => String(i.id)));
            const orphans = items.filter(i => i.parent_id && !allIds.has(String(i.parent_id)));
            if (sortBy !== 'none') {
                orphans.sort(sortComparator);
            }
            roots = orphans.map(child => ({
                ...child,
                children: buildNode(String(child.id))
            }));
            
            if (roots.length === 0) {
                const fallbackItems = [...items];
                if (sortBy !== 'none') {
                    fallbackItems.sort(sortComparator);
                }
                roots = fallbackItems.map(i => ({...i, children: []}));
            }
        }
        
        return roots;
    }, [items, sortBy]);

    // Selection logic
    const handleSelect = (item: TreeSelectItem, closePopover?: () => void) => {
        const id = String(item.id);
        const pId = item.parent_id !== null && item.parent_id !== undefined ? String(item.parent_id) : null;

        if (!multiple) {
            onValueChange(id, pId);
            if (closePopover) {
                closePopover();
            }
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
            const currentlyFullySelected = isSelected(id) && descendantIds.every(dId => isSelected(dId));

            if (currentlyFullySelected) {
                newSelected = newSelected.filter(sid => sid !== id && !descendantIds.includes(sid));
            } else {
                if (!newSelected.includes(id)) newSelected.push(id);
                descendantIds.forEach(cid => {
                    if (!newSelected.includes(cid)) newSelected.push(cid);
                });
            }
        } else {
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

    // Filtering logic
    const filteredTree = React.useMemo(() => {
        const searchLower = search.toLowerCase().trim();

        const filterSubtree = (node: any): any | null => {
            const nId = String(node.id);
            const matchesSearch = !searchLower || node.name?.toLowerCase().includes(searchLower);
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

    const prevOpenRef = React.useRef(open);
    const prevSearchRef = React.useRef(search);
    const prevFilterTabRef = React.useRef(filterTab);

    // Auto expand parents if searching or if filterTab is selected or on initial open with defaultExpandAll
    React.useEffect(() => {
        const justOpened = open && !prevOpenRef.current;
        const searchChanged = search !== prevSearchRef.current;
        const filterTabChanged = filterTab !== prevFilterTabRef.current;

        prevOpenRef.current = open;
        prevSearchRef.current = search;
        prevFilterTabRef.current = filterTab;

        if (!open) return;

        if ((justOpened && defaultExpandAll) || (searchChanged && search.trim()) || filterTabChanged) {
            const newExpanded: Record<string, boolean> = {};
            const expandAll = (nodes: any[]) => {
                nodes.forEach(n => {
                    newExpanded[String(n.id)] = true;
                    if (n.children && n.children.length > 0) expandAll(n.children);
                });
            };
            expandAll(filteredTree);
            setExpandedParents(prev => ({ ...prev, ...newExpanded }));
        }
    }, [defaultExpandAll, filteredTree, search, filterTab, open]);

    const toggleParentExpansion = (pId: string, e?: React.MouseEvent | React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setExpandedParents(prev => ({
            ...prev,
            [pId]: !prev[pId]
        }));
    };

    // Recursive render function
    const renderTreeNodes = (nodes: any[], depth = 0, closePopover?: () => void) => {
        return nodes.map(node => {
            const nId = String(node.id);
            const isExpanded = !!expandedParents[nId];
            const hasChildren = node.children && node.children.length > 0;
            const isDisabled = isNodeDisabled(node.id);
            
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
                        {depth > 0 && (
                            <div className="absolute -left-[13px] top-1/2 w-3 h-0 border-t-2 border-primary/30 dark:border-primary/40 -translate-y-1/2" />
                        )}

                        <button
                            type="button"
                            disabled={isDisabled}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (isDisabled) return;
                                if (disableParentSelection && hasChildren) {
                                    toggleParentExpansion(nId, e);
                                } else {
                                    handleSelect(node, closePopover);
                                }
                            }}
                            className={cn(
                                "flex flex-1 items-center gap-2 py-1.5 text-left transition-colors rounded-sm",
                                isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                                isSmall ? "text-xs" : "text-sm",
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
                                        {fullySelected && <Check size={10} />}
                                        {!fullySelected && partiallySelected && <div className="h-1 w-1.5 rounded-sm bg-current" />}
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
                            <div className="flex flex-1 items-center gap-1.5 min-w-0">
                                {node.code && (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/60 shrink-0">
                                        {node.code}
                                    </span>
                                )}
                                <span className="truncate">{node.name}</span>
                                {isDisabled && (
                                    <span className="text-[10px] text-muted-foreground italic shrink-0 ml-1">
                                        (Kategori saat ini)
                                    </span>
                                )}
                            </div>
                        </button>

                        {hasChildren && (
                            <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleParentExpansion(nId, e);
                                }}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
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
                            {renderTreeNodes(node.children, depth + 1, closePopover)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const renderInnerDropdown = (closePopover?: () => void) => (
        <div className="flex flex-col text-popover-foreground w-full space-y-1.5 flex-1 min-h-0 overflow-hidden">
            {/* Search & Filter Header */}
            <div className="flex flex-col gap-1.5 pb-1 shrink-0">
                <TreeSearchInput
                    value={search}
                    onSearch={setSearch}
                    placeholder={searchPlaceholder}
                    autoFocus={open || inline}
                />

                {/* Filter Tabs (when multiple is enabled) */}
                {multiple && (
                    <div className="flex items-center justify-between bg-muted/50 p-1 rounded-md border border-border/50 text-xs shrink-0">
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

            <div 
                data-scroll-locked="allow"
                onWheel={(e) => e.stopPropagation()}
                className={cn("p-0.5", inline ? "w-full" : "flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] custom-scrollbar overscroll-contain")}
            >
                {!multiple && showRootOption && (!search.trim() || 'tanpa parent root kategori utama'.toLowerCase().includes(search.toLowerCase().trim())) && (
                    <div className="pb-1 mb-1 border-b border-border/60">
                        <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onValueChange(null, null);
                                if (closePopover) closePopover();
                            }}
                            className={cn(
                                "flex w-full items-center gap-2 py-1.5 px-3 text-left transition-colors rounded-sm cursor-pointer hover:bg-sidebar-accent/50",
                                isSmall ? "text-xs" : "text-sm",
                                selectedIds.length === 0
                                    ? "text-primary font-medium bg-primary/5"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all shrink-0",
                                selectedIds.length === 0
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-transparent"
                            )}>
                                {selectedIds.length === 0 && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                            </div>
                            <span className={cn(selectedIds.length === 0 ? "font-semibold text-primary" : "font-normal italic")}>
                                {rootOptionLabel}
                            </span>
                        </button>
                    </div>
                )}
                {filteredTree.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground italic">
                        {filterTab === 'selected' ? 'Belum ada tipe yang dipilih' : emptyText}
                    </div>
                ) : (
                    renderTreeNodes(filteredTree, 0, closePopover)
                )}
            </div>
        </div>
    );

    if (inline) {
        return (
            <div className="relative w-full space-y-2 border border-border rounded-xl p-3 bg-surface-base">
                {renderInnerDropdown()}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full space-y-1">
            <button
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
                    disabled && 'cursor-not-allowed bg-slate-100/70 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 shadow-none',
                    open && 'border-primary ring-1 ring-primary',
                    triggerClassName
                )}
            >
                <span className={cn('truncate', isSmall ? 'text-xs' : 'text-sm', selectedDisplay ? 'text-foreground font-normal' : 'text-muted-foreground font-normal')}>
                    {selectedDisplay || placeholder}
                </span>
                <div className="flex items-center shrink-0 ml-2">
                    {selectedDisplay && !disabled && allowClear && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onValueChange(multiple ? [] : null, null);
                            }}
                            className="p-0.5 mr-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
                            title="Hapus pilihan"
                        >
                            <X size={isSmall ? 12 : 13} />
                        </span>
                    )}
                    {disabled ? (
                        <Lock size={isSmall ? 13 : 14} className="text-slate-400 dark:text-zinc-500 opacity-70" />
                    ) : (
                        <ChevronDown size={15} className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
                    )}
                </div>
            </button>

            {open && coords && typeof document !== 'undefined' && ReactDOM.createPortal(
                <div
                    data-portal-dropdown="true"
                    ref={dropdownRef}
                    style={{
                        position: 'fixed',
                        top: coords.placement === 'top' ? undefined : `${coords.top}px`,
                        bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : undefined,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        maxHeight: `${coords.maxHeight}px`,
                        zIndex: 99999,
                        pointerEvents: 'auto',
                    }}
                    className="flex flex-col p-2 bg-white dark:bg-zinc-950 border border-border shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden pointer-events-auto"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {renderInnerDropdown(() => {
                        setOpen(false);
                        setSearch('');
                    })}
                </div>,
                (containerRef.current?.closest('[role="dialog"]') as HTMLElement) || document.body
            )}
        </div>
    );
}
