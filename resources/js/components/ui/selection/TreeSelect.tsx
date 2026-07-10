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
}: TreeSelectProps) {
    const [open, setOpen] = React.useState(inline);
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

    // Filtering logic
    const filteredTree = React.useMemo(() => {
        if (!search.trim()) return treeData;

        const searchLower = search.toLowerCase();

        const filterNode = (node: any): any | null => {
            const matchesSearch = node.name.toLowerCase().includes(searchLower);
            const filteredChildren = (node.children || []).map(filterNode).filter(Boolean);
            
            if (matchesSearch || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        };

        return treeData.map(filterNode).filter(Boolean);
    }, [treeData, search]);

    // Auto expand parents if searching or if defaultExpandAll is true
    React.useEffect(() => {
        if (search.trim() || defaultExpandAll) {
            const newExpanded: Record<string, boolean> = {};
            const expandAll = (nodes: any[]) => {
                nodes.forEach(n => {
                    newExpanded[String(n.id)] = true;
                    if (n.children) expandAll(n.children);
                });
            };
            expandAll(filteredTree);
            
            if (defaultExpandAll && !search.trim()) {
                // If just defaulting, we might want to merge or just set
                setExpandedParents(prev => ({...prev, ...newExpanded}));
            } else {
                setExpandedParents(newExpanded);
            }
        }
    }, [search, filteredTree, defaultExpandAll]);

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
                <div key={nId} className="flex flex-col">
                    <div 
                        className="group flex w-full items-center gap-1 rounded-md hover:bg-sidebar-accent/40 pr-2"
                        style={{ paddingLeft: `${depth * 12}px` }}
                    >
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
                                "flex flex-1 items-center gap-2 py-2 text-left text-[11px] uppercase tracking-tight transition-colors",
                                depth === 0 ? "font-bold px-3" : "font-semibold px-2",
                                fullySelected ? "text-sidebar-primary" : "text-sidebar-foreground/80"
                            )}
                        >
                            {(!disableParentSelection || !hasChildren) && (
                                multiple ? (
                                    <div className={cn(
                                        "flex h-3.5 w-3.5 items-center justify-center rounded border transition-all",
                                        fullySelected 
                                            ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground" 
                                            : partiallySelected 
                                                ? "border-sidebar-primary bg-sidebar-primary/20 text-sidebar-primary"
                                                : "border-sidebar-border bg-transparent group-hover:border-sidebar-foreground/30"
                                    )}>
                                        {fullySelected ? <Check size={10} /> : partiallySelected ? <div className="h-1 w-1.5 rounded-sm bg-current" /> : null}
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all",
                                        fullySelected 
                                            ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground" 
                                            : "border-sidebar-border bg-transparent group-hover:border-sidebar-foreground/30"
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
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                            >
                                <ChevronDown 
                                    size={14} 
                                    className={cn("transition-transform duration-200", isExpanded ? "" : "-rotate-90")} 
                                />
                            </button>
                        )}
                    </div>

                    {isExpanded && hasChildren && (
                        <div className="flex flex-col border-l border-sidebar-border/30 ml-[22px] border-dashed">
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
                "border-sidebar-border bg-sidebar mt-1 flex flex-col overflow-hidden rounded-lg border",
                inline ? "relative max-h-[600px]" : "absolute left-0 right-0 top-full z-50 max-h-[400px] shadow-xl animate-in fade-in slide-in-from-top-1 duration-100"
            )}
        >
            <div className="relative border-b border-sidebar-border/50 bg-sidebar-accent/10 px-3 py-2">
                <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-sidebar-foreground/40" />
                <input
                    autoFocus={!inline}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-8 w-full bg-transparent pl-8 pr-3 text-[12px] text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/30 border border-sidebar-border/50 rounded-md focus:border-sidebar-primary/50"
                />
            </div>

            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                {filteredTree.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-sidebar-foreground/40 italic">{emptyText}</div>
                ) : (
                    renderTreeNodes(filteredTree)
                )}
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="relative w-full">
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
            )}

            {dropdownContent}
        </div>
    );
}
