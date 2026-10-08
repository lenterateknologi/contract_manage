import React, { useEffect, useMemo, useState } from 'react';
import { ContractTemplate, TableRowItem, TemplateFolder } from '../types';
import { buildFolderTree, getFolderPath } from '../utils/templateUtils';

export function useTemplateNavigation(folders: TemplateFolder[] = [], templates: ContractTemplate[] = []) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
    const [visibilityFilter, setVisibilityFilter] = useState<string[]>([]);
    const [treeSearch, setTreeSearch] = useState('');
    const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

    // O(1) Lookup Maps
    const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

    const templatesByFolder = useMemo(() => {
        const map = new Map<string | null, ContractTemplate[]>();
        templates.forEach((t) => {
            const key = t.template_folder_id;
            const existing = map.get(key);
            if (existing) existing.push(t);
            else map.set(key, [t]);
        });
        return map;
    }, [templates]);

    const currentFolder = useMemo(() => (currentFolderId ? folderMap.get(currentFolderId) || null : null), [folderMap, currentFolderId]);
    const folderPath = useMemo(() => getFolderPath(currentFolderId, folderMap), [currentFolderId, folderMap]);

    // Build Folder Tree Hierarchy
    const folderTree = useMemo(() => buildFolderTree(folders, templatesByFolder), [folders, templatesByFolder]);

    const totalAllTemplates = templates.length;

    // Toggle expand/collapse tree node
    const toggleFolderExpand = (folderId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setExpandedFolderIds((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Auto-expand path when currentFolderId changes
    useEffect(() => {
        if (currentFolderId) {
            const path = getFolderPath(currentFolderId, folderMap);
            setExpandedFolderIds((prev) => {
                const next = new Set(prev);
                path.forEach((f) => next.add(f.id));
                return next;
            });
        }
    }, [currentFolderId, folderMap]);

    // Available File Types for Filter
    const availableFileTypes = useMemo(() => {
        const types = new Set<string>();
        templates.forEach((t) => {
            if (t.file_type) types.add(t.file_type.toLowerCase());
        });
        return Array.from(types).sort();
    }, [templates]);

    // Table Data for Current Folder
    const tableData: TableRowItem[] = useMemo(() => {
        const currentSubFolders = folders.filter((f) => f.parent_id === currentFolderId);
        const currentTemplates = templatesByFolder.get(currentFolderId) || [];

        const folderItems: TableRowItem[] = currentSubFolders.map((f) => {
            const directTemplateCount = (templatesByFolder.get(f.id) || []).length;
            return {
                id: f.id,
                itemType: 'folder',
                name: f.name,
                file_type: 'folder',
                is_visible: f.is_visible,
                templates_count: directTemplateCount,
                creator_name: f.creator?.name,
                created_at: f.created_at,
                updated_at: f.updated_at,
                raw: f,
            };
        });

        const templateItems: TableRowItem[] = currentTemplates.map((t) => ({
            id: t.id,
            itemType: 'template',
            name: t.name,
            description: t.description,
            file_type: t.file_type,
            file_size: t.file_size,
            file_name: t.file_name,
            is_visible: t.is_visible,
            creator_name: t.creator?.name,
            folder_name: t.folder?.name,
            created_at: t.created_at,
            updated_at: t.updated_at,
            raw: t,
        }));

        return [...folderItems, ...templateItems];
    }, [folders, templatesByFolder, currentFolderId]);

    // Filtered Table Data
    const filteredTableData = useMemo(() => {
        return tableData.filter((item) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = item.name.toLowerCase().includes(q);
                const matchDesc = item.description?.toLowerCase().includes(q);
                const matchFileName = item.file_name?.toLowerCase().includes(q);
                if (!matchName && !matchDesc && !matchFileName) return false;
            }

            if (fileTypeFilter.length > 0) {
                if (!fileTypeFilter.includes(item.file_type.toLowerCase())) return false;
            }

            if (visibilityFilter.length > 0) {
                const isVisibleStr = item.is_visible ? 'visible' : 'hidden';
                if (!visibilityFilter.includes(isVisibleStr)) return false;
            }

            return true;
        });
    }, [tableData, searchQuery, fileTypeFilter, visibilityFilter]);

    return {
        currentFolderId,
        setCurrentFolderId,
        searchQuery,
        setSearchQuery,
        fileTypeFilter,
        setFileTypeFilter,
        visibilityFilter,
        setVisibilityFilter,
        treeSearch,
        setTreeSearch,
        expandedFolderIds,
        setExpandedFolderIds,
        toggleFolderExpand,
        folderMap,
        templatesByFolder,
        currentFolder,
        folderPath,
        folderTree,
        totalAllTemplates,
        availableFileTypes,
        tableData,
        filteredTableData,
    };
}
