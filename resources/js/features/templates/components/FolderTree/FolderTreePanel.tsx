import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { FolderTreeNode, TemplateFolder } from '../../types';
import { FolderTreeItem } from './FolderTreeItem';

const { Folder, FolderOpen, FolderPlus, FolderTree, Search, X } = Icons;

interface FolderTreePanelProps {
    folderTree: FolderTreeNode[];
    totalAllTemplates: number;
    currentFolderId: string | null;
    treeSearch: string;
    setTreeSearch: (val: string) => void;
    expandedFolderIds: Set<string>;
    onSelectFolder: (folderId: string | null) => void;
    onToggleExpand: (folderId: string, e?: React.MouseEvent) => void;
    onOpenContextMenu: (e: React.MouseEvent, folder: TemplateFolder | { id: null; name: string }) => void;
    canCreateFolder?: boolean;
    onOpenCreateFolder: (parentId?: string | null) => void;
}

export function FolderTreePanel({
    folderTree,
    totalAllTemplates,
    currentFolderId,
    treeSearch,
    setTreeSearch,
    expandedFolderIds,
    onSelectFolder,
    onToggleExpand,
    onOpenContextMenu,
    canCreateFolder,
    onOpenCreateFolder,
}: FolderTreePanelProps) {
    const isRootSelected = currentFolderId === null;

    // Filter tree nodes if treeSearch is active
    const filteredTree = useMemo(() => {
        if (!treeSearch.trim()) return folderTree;
        const q = treeSearch.toLowerCase();

        const filterNode = (node: FolderTreeNode): FolderTreeNode | null => {
            const matchesSelf = node.name.toLowerCase().includes(q);
            const filteredChildren = node.children.map(filterNode).filter(Boolean) as FolderTreeNode[];

            if (matchesSelf || filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren,
                };
            }
            return null;
        };

        return folderTree.map(filterNode).filter(Boolean) as FolderTreeNode[];
    }, [folderTree, treeSearch]);

    return (
        <div className="border-surface-border bg-surface-card flex h-full w-64 shrink-0 flex-col border-r">
            {/* Header with Search */}
            <div className="border-surface-border space-y-2 border-b p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <FolderTree size={14} className="text-primary" />
                        <span>Folder Explorer</span>
                    </div>
                    {canCreateFolder && (
                        <button
                            type="button"
                            onClick={() => onOpenCreateFolder(currentFolderId)}
                            className="text-primary hover:bg-primary/10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors"
                            title="Buat Folder Baru"
                        >
                            <FolderPlus size={14} />
                        </button>
                    )}
                </div>

                <div className="relative">
                    <Search size={12} className="text-text-desc absolute top-1/2 left-2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={treeSearch}
                        onChange={(e) => setTreeSearch(e.target.value)}
                        placeholder="Cari folder..."
                        className="border-surface-border bg-surface-muted/50 focus:border-primary focus:bg-surface-card h-7 w-full rounded-md border pr-6 pl-7 text-[11px] focus:outline-none"
                    />
                    {treeSearch && (
                        <button
                            onClick={() => setTreeSearch('')}
                            className="text-text-desc hover:text-text-main absolute top-1/2 right-1.5 -translate-y-1/2"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tree Navigation Container */}
            <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto p-2">
                {/* Root Repository Item */}
                <div
                    onClick={() => onSelectFolder(null)}
                    onContextMenu={(e) => onOpenContextMenu(e, { id: null, name: 'Root Repository' } as any)}
                    className={cn(
                        'group flex cursor-pointer items-center justify-between rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium transition-all select-none',
                        isRootSelected
                            ? 'bg-primary/10 text-primary border-primary/20 font-bold'
                            : 'text-text-main hover:bg-surface-muted/70 hover:text-text-main',
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        {isRootSelected ? (
                            <FolderOpen size={14} className="shrink-0 fill-amber-500 text-amber-500" />
                        ) : (
                            <Folder size={14} className="shrink-0 fill-amber-500 text-amber-500" />
                        )}
                        <span className="truncate text-[11.5px]">Root Repository</span>
                    </div>
                    <span
                        className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                            isRootSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-surface-muted text-text-desc group-hover:bg-surface-border/80',
                        )}
                    >
                        {totalAllTemplates}
                    </span>
                </div>

                {/* Sub-Folders Tree */}
                {filteredTree.map((node) => (
                    <FolderTreeItem
                        key={node.id}
                        node={node}
                        depth={0}
                        currentFolderId={currentFolderId}
                        expandedFolderIds={expandedFolderIds}
                        onSelectFolder={onSelectFolder}
                        onToggleExpand={onToggleExpand}
                        onOpenContextMenu={onOpenContextMenu}
                        canCreateFolder={canCreateFolder}
                        onQuickCreateSubfolder={onOpenCreateFolder}
                    />
                ))}

                {filteredTree.length === 0 && treeSearch && (
                    <div className="text-text-desc py-4 text-center text-[11px]">Folder tidak ditemukan</div>
                )}
            </div>

            {/* Quick Create Folder Footer */}
            {canCreateFolder && (
                <div className="border-surface-border border-t p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenCreateFolder(currentFolderId)}
                        className="text-primary hover:bg-primary/10 h-7 w-full justify-start gap-1.5 text-[11px] font-semibold"
                    >
                        <FolderPlus size={13} />
                        <span>+ Folder Baru</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
