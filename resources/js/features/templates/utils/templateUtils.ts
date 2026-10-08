import { ContractTemplate, FolderTreeNode, TemplateFolder } from '../types';

export const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFolderPath = (folderId: string | null, folderMap: Map<string, TemplateFolder>): TemplateFolder[] => {
    const path: TemplateFolder[] = [];
    let currId = folderId;
    while (currId) {
        const f = folderMap.get(currId);
        if (f) {
            path.unshift(f);
            currId = f.parent_id;
        } else {
            break;
        }
    }
    return path;
};

export const buildFolderTree = (
    folders: TemplateFolder[],
    templatesByFolder: Map<string | null, ContractTemplate[]>,
): FolderTreeNode[] => {
    const childrenMap = new Map<string | null, TemplateFolder[]>();
    folders.forEach((f) => {
        const pid = f.parent_id;
        const existing = childrenMap.get(pid);
        if (existing) existing.push(f);
        else childrenMap.set(pid, [f]);
    });

    const buildNode = (parentId: string | null): FolderTreeNode[] => {
        const childFolders = childrenMap.get(parentId) || [];
        return childFolders
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((folder) => {
                const children = buildNode(folder.id);
                const directTemplateCount = (templatesByFolder.get(folder.id) || []).length;
                const childTemplatesCount = children.reduce((acc, c) => acc + c.totalTemplatesCount, 0);
                return {
                    ...folder,
                    children,
                    totalTemplatesCount: directTemplateCount + childTemplatesCount,
                };
            });
    };

    return buildNode(null);
};
