import { Icons } from '@/components/ui';
import { cn } from '@/lib/utils';
import React from 'react';
import { FolderTreeNode, TemplateFolder } from '../../types';

const { ChevronDown, ChevronRight, Folder, FolderOpen, FolderPlus, MoreHorizontal } = Icons;

interface FolderTreeItemProps {
    node: FolderTreeNode;
    depth?: number;
    currentFolderId: string | null;
    expandedFolderIds: Set<string>;
    onSelectFolder: (folderId: string | null) => void;
    onToggleExpand: (folderId: string, e?: React.MouseEvent) => void;
    onOpenContextMenu: (e: React.MouseEvent, folder: TemplateFolder) => void;
    canCreateFolder?: boolean;
    onQuickCreateSubfolder?: (parentId: string) => void;
}

export function FolderTreeItem({
    node,
    depth = 0,
    currentFolderId,
    expandedFolderIds,
    onSelectFolder,
    onToggleExpand,
    onOpenContextMenu,
    canCreateFolder,
    onQuickCreateSubfolder,
}: FolderTreeItemProps) {
    const isSelected = currentFolderId === node.id;
    const isExpanded = expandedFolderIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                onClick={() => onSelectFolder(node.id)}
                onContextMenu={(e) => onOpenContextMenu(e, node)}
                className={cn(
                    'group flex cursor-pointer items-center justify-between rounded-lg border border-transparent px-2 py-1.5 text-xs font-medium transition-all',
                    isSelected
                        ? 'bg-primary/10 text-primary border-primary/20 font-bold'
                        : 'text-text-main hover:bg-surface-muted/70 hover:text-text-main',
                )}
                style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
            >
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(e) => onToggleExpand(node.id, e)}
                            className="text-text-desc hover:text-text-main hover:bg-surface-border/50 flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors"
                        >
                            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                    ) : (
                        <span className="w-4 shrink-0" />
                    )}

                    {isSelected || isExpanded ? (
                        <FolderOpen size={14} className="shrink-0 fill-amber-500 text-amber-500" />
                    ) : (
                        <Folder size={14} className="shrink-0 fill-amber-500 text-amber-500" />
                    )}

                    <span className="truncate text-[11.5px]">{node.name}</span>
                </div>

                <div className="ml-1 flex shrink-0 items-center gap-1">
                    <span
                        className={cn(
                            'py-0.2 rounded-full px-1.5 text-[10px] font-semibold',
                            isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-surface-muted text-text-desc group-hover:bg-surface-border/80',
                        )}
                    >
                        {node.totalTemplatesCount}
                    </span>

                    {canCreateFolder && onQuickCreateSubfolder && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuickCreateSubfolder(node.id);
                            }}
                            className="text-text-desc hover:text-primary opacity-0 transition-opacity group-hover:opacity-100"
                            title="Buat Sub-folder"
                        >
                            <FolderPlus size={13} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={(e) => onOpenContextMenu(e, node)}
                        className="text-text-desc hover:text-text-main opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <MoreHorizontal size={13} />
                    </button>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="space-y-0.5">
                    {node.children.map((child) => (
                        <FolderTreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            currentFolderId={currentFolderId}
                            expandedFolderIds={expandedFolderIds}
                            onSelectFolder={onSelectFolder}
                            onToggleExpand={onToggleExpand}
                            onOpenContextMenu={onOpenContextMenu}
                            canCreateFolder={canCreateFolder}
                            onQuickCreateSubfolder={onQuickCreateSubfolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
