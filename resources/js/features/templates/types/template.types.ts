export interface TemplateFolder {
    id: string;
    parent_id: string | null;
    name: string;
    is_visible?: boolean;
    templates_count?: number;
    creator?: { name: string };
    created_at?: string;
    updated_at?: string;
}

export interface ContractTemplate {
    id: string;
    template_folder_id: string | null;
    name: string;
    description: string | null;
    file_path: string;
    file_name: string;
    file_size: number;
    file_type: string;
    is_visible?: boolean;
    creator?: { name: string };
    folder?: { name: string };
    created_at?: string;
    updated_at?: string;
}

export interface TemplatePermissions {
    canRead?: boolean;
    canDownload?: boolean;
    canUpload?: boolean;
    canCreateFolder?: boolean;
    canEdit?: boolean;
    canToggleVisibility?: boolean;
    canDelete?: boolean;
}

export interface TemplatesPageProps {
    folders: TemplateFolder[];
    templates: ContractTemplate[];
    permissions?: TemplatePermissions;
    breadcrumbs?: any[];
}

export interface TableRowItem {
    id: string;
    itemType: 'folder' | 'template';
    name: string;
    description?: string | null;
    file_type: string;
    file_size?: number;
    file_name?: string;
    is_visible?: boolean;
    templates_count?: number;
    creator_name?: string;
    folder_name?: string;
    created_at?: string;
    updated_at?: string;
    raw: TemplateFolder | ContractTemplate | any;
}

export interface FolderTreeNode extends TemplateFolder {
    children: FolderTreeNode[];
    totalTemplatesCount: number;
}
