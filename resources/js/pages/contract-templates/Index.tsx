import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { DataTable, Column } from '@/components/ui/tables/DataTable';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import { FilterCategory } from '@/components/ui/navigation/PageFilter';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialogs/Dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    Download,
    Edit3,
    ExternalLink,
    Eye,
    FileSpreadsheet,
    FileText,
    Folder,
    FolderInput,
    FolderOpen,
    FolderPlus,
    FolderTree,
    Layers,
    Loader2,
    MoreHorizontal,
    Search,
    Trash2,
    Upload,
} from 'lucide-react';

interface TemplateFolder {
    id: string;
    parent_id: string | null;
    name: string;
    templates_count?: number;
}

interface ContractTemplate {
    id: string;
    template_folder_id: string | null;
    name: string;
    description: string | null;
    file_path: string;
    file_name: string;
    file_size: number;
    file_type: string;
    creator?: { name: string };
    folder?: { name: string };
    created_at?: string;
}

interface Props {
    folders: TemplateFolder[];
    templates: ContractTemplate[];
}

interface TableRowItem {
    id: string;
    itemType: 'folder' | 'template';
    name: string;
    description?: string | null;
    file_type: string;
    file_size?: number;
    file_name?: string;
    templates_count?: number;
    creator_name?: string;
    folder_name?: string;
    raw: any;
}

interface FolderTreeNode extends TemplateFolder {
    children: FolderTreeNode[];
    totalTemplatesCount: number;
}

export default function Templates({ folders = [], templates = [] }: Props) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
    const [treeSearch, setTreeSearch] = useState('');
    const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

    // Dialog States
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);
    const [dragDropTargetFolder, setDragDropTargetFolder] = useState<{ id: string | null; name: string }>({
        id: null,
        name: 'Repository Root',
    });

    // Drag and Drop States
    const [isDragging, setIsDragging] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);

    // Form Loading States
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selection/Item States
    const [selectedRows, setSelectedRows] = useState<TableRowItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<{ type: 'folder' | 'template'; id: string; name: string } | null>(null);
    const [folderFormParentId, setFolderFormParentId] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [uploadData, setUploadData] = useState({
        name: '',
        description: '',
        folderId: null as string | null,
        file: null as File | null,
    });
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

    // Bulk Action Modal States
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
    const [bulkTargetFolderId, setBulkTargetFolderId] = useState<string | null>(null);

    // Custom Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        target:
            | { type: 'folder'; folder: TemplateFolder }
            | { type: 'template'; template: ContractTemplate }
            | { type: 'root' };
    } | null>(null);

    // Close custom context menu on any global click or scroll
    React.useEffect(() => {
        const handleGlobalClose = () => setContextMenu(null);
        window.addEventListener('click', handleGlobalClose);
        window.addEventListener('scroll', handleGlobalClose, true);
        return () => {
            window.removeEventListener('click', handleGlobalClose);
            window.removeEventListener('scroll', handleGlobalClose, true);
        };
    }, []);

    // Helpers
    const formatSize = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFolderPath = (folderId: string | null): TemplateFolder[] => {
        const path: TemplateFolder[] = [];
        let currId = folderId;
        while (currId) {
            const f = folders.find((folder) => folder.id === currId);
            if (f) {
                path.unshift(f);
                currId = f.parent_id;
            } else break;
        }
        return path;
    };

    const currentFolder = useMemo(() => folders.find((f) => f.id === currentFolderId), [folders, currentFolderId]);
    const folderPath = useMemo(() => getFolderPath(currentFolderId), [folders, currentFolderId]);

    // Build Folder Tree Hierarchy
    const folderTree = useMemo(() => {
        const buildNode = (parentId: string | null): FolderTreeNode[] => {
            return folders
                .filter((f) => f.parent_id === parentId)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((folder) => {
                    const children = buildNode(folder.id);
                    const directTemplateCount = templates.filter((t) => t.template_folder_id === folder.id).length;
                    const childTemplatesCount = children.reduce((acc, c) => acc + c.totalTemplatesCount, 0);
                    return {
                        ...folder,
                        children,
                        totalTemplatesCount: directTemplateCount + childTemplatesCount,
                    };
                });
        };
        return buildNode(null);
    }, [folders, templates]);

    const rootTemplatesCount = useMemo(() => {
        return templates.filter((t) => !t.template_folder_id).length;
    }, [templates]);

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
    React.useEffect(() => {
        if (currentFolderId) {
            const path = getFolderPath(currentFolderId);
            setExpandedFolderIds((prev) => {
                const next = new Set(prev);
                path.forEach((f) => next.add(f.id));
                return next;
            });
        }
    }, [currentFolderId]);

    // Available File Types for Filter
    const availableFileTypes = useMemo(() => {
        const types = new Set<string>();
        templates.forEach((t) => {
            if (t.file_type) types.add(t.file_type.toLowerCase());
        });
        return Array.from(types).sort();
    }, [templates]);

    const filterCategories: FilterCategory[] = useMemo(
        () => [
            {
                key: 'file_type',
                label: 'Tipe Dokumen',
                type: 'multiselect',
                options: [
                    { label: 'FOLDER', value: 'folder' },
                    ...availableFileTypes.map((type) => ({
                        label: type.toUpperCase(),
                        value: type,
                    })),
                ],
            },
        ],
        [availableFileTypes],
    );

    // Filtered data combined into a unified list
    const processedRows = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();

        const folderRows: TableRowItem[] = folders
            .filter((f) => {
                if (q) {
                    return f.name.toLowerCase().includes(q);
                }
                return f.parent_id === currentFolderId;
            })
            .map((f) => {
                const directCount = templates.filter((t) => t.template_folder_id === f.id).length;
                return {
                    id: f.id,
                    itemType: 'folder',
                    name: f.name,
                    file_type: 'folder',
                    templates_count: directCount,
                    raw: f,
                };
            });

        const templateRows: TableRowItem[] = templates
            .filter((t) => {
                const matchesFolder = q ? true : t.template_folder_id === currentFolderId;
                const matchesSearch = q
                    ? t.name.toLowerCase().includes(q) ||
                      (t.description && t.description.toLowerCase().includes(q)) ||
                      (t.file_name && t.file_name.toLowerCase().includes(q))
                    : true;
                return matchesFolder && matchesSearch;
            })
            .map((t) => {
                const parentFolder = folders.find((f) => f.id === t.template_folder_id);
                return {
                    id: t.id,
                    itemType: 'template',
                    name: t.name,
                    description: t.description,
                    file_type: t.file_type?.toLowerCase() || 'docx',
                    file_size: t.file_size,
                    file_name: t.file_name,
                    creator_name: t.creator?.name || '-',
                    folder_name: parentFolder ? parentFolder.name : 'Root Repository',
                    raw: t,
                };
            });

        let all = [...folderRows, ...templateRows];

        if (fileTypeFilter.length > 0) {
            all = all.filter((r) => fileTypeFilter.includes(r.file_type));
        }

        return all;
    }, [folders, templates, currentFolderId, searchQuery, fileTypeFilter]);

    // Actions
    const handleCreateFolder = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newFolderName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        router.post(
            route('admin.templates.folders.store'),
            {
                name: newFolderName.trim(),
                parent_id: folderFormParentId,
            },
            {
                onSuccess: () => {
                    setNewFolderName('');
                    setIsFolderModalOpen(false);
                    setIsSubmitting(false);
                    if (folderFormParentId) {
                        setExpandedFolderIds((prev) => new Set(prev).add(folderFormParentId));
                    }
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleUploadTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.name.trim() || !uploadData.file || isSubmitting) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', uploadData.name.trim());
        formData.append('description', uploadData.description || '');
        if (uploadData.folderId) {
            formData.append('template_folder_id', uploadData.folderId);
        }
        formData.append('file', uploadData.file);

        router.post(route('admin.templates.store'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setUploadData({ name: '', description: '', folderId: null, file: null });
                setIsUploadModalOpen(false);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Direct Drag-and-Drop file uploader
    const handleFilesDropped = (droppedFiles: FileList | File[]) => {
        const filesArray = Array.from(droppedFiles);
        if (filesArray.length === 0 || isSubmitting) return;

        // Upload files
        setIsSubmitting(true);
        filesArray.forEach((file) => {
            const defaultName = file.name.replace(/\.[^/.]+$/, '');
            const formData = new FormData();
            formData.append('name', defaultName);
            formData.append('description', '');
            if (currentFolderId) {
                formData.append('template_folder_id', currentFolderId);
            }
            formData.append('file', file);

            router.post(route('admin.templates.store'), formData, {
                forceFormData: true,
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        });
    };

    const handleDelete = () => {
        if (!selectedItem || isSubmitting) return;

        setIsSubmitting(true);
        const url =
            selectedItem.type === 'folder'
                ? route('admin.templates.folders.destroy', selectedItem.id)
                : route('admin.templates.destroy', selectedItem.id);

        router.delete(url, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedItem(null);
                setIsSubmitting(false);
                if (selectedItem.type === 'folder' && currentFolderId === selectedItem.id) {
                    setCurrentFolderId(null);
                }
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleRename = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!selectedItem || !newFolderName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const url =
            selectedItem.type === 'folder'
                ? route('admin.templates.folders.update', selectedItem.id)
                : route('admin.templates.update', selectedItem.id);

        router.put(
            url,
            { name: newFolderName.trim() },
            {
                onSuccess: () => {
                    setNewFolderName('');
                    setIsRenameModalOpen(false);
                    setSelectedItem(null);
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleMove = () => {
        if (!selectedItem || isSubmitting) return;

        setIsSubmitting(true);
        const url =
            selectedItem.type === 'folder'
                ? route('admin.templates.folders.move', selectedItem.id)
                : route('admin.templates.move', selectedItem.id);
        const data =
            selectedItem.type === 'folder'
                ? { parent_id: targetFolderId }
                : { template_folder_id: targetFolderId };

        router.patch(url, data, {
            onSuccess: () => {
                setIsMoveModalOpen(false);
                setSelectedItem(null);
                setTargetFolderId(null);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    // Bulk Handlers
    const handleBulkDelete = () => {
        if (selectedRows.length === 0 || isSubmitting) return;

        setIsSubmitting(true);
        const folder_ids = selectedRows.filter((r) => r.itemType === 'folder').map((r) => r.id);
        const template_ids = selectedRows.filter((r) => r.itemType === 'template').map((r) => r.id);

        router.post(
            route('admin.templates.bulk-destroy'),
            { folder_ids, template_ids },
            {
                onSuccess: () => {
                    setIsBulkDeleteModalOpen(false);
                    setSelectedRows([]);
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleBulkMove = () => {
        if (selectedRows.length === 0 || isSubmitting) return;

        setIsSubmitting(true);
        const folder_ids = selectedRows.filter((r) => r.itemType === 'folder').map((r) => r.id);
        const template_ids = selectedRows.filter((r) => r.itemType === 'template').map((r) => r.id);

        router.post(
            route('admin.templates.bulk-move'),
            {
                target_folder_id: bulkTargetFolderId,
                folder_ids,
                template_ids,
            },
            {
                onSuccess: () => {
                    setIsBulkMoveModalOpen(false);
                    setSelectedRows([]);
                    setBulkTargetFolderId(null);
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    // Table Columns Configuration
    const columns: Column<TableRowItem>[] = [
        {
            header: 'Nama Dokumen / Folder',
            accessorKey: 'name',
            cell: (row) => {
                if (row.itemType === 'folder') {
                    return (
                        <div className="flex items-center gap-3 py-0.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-400">
                                <Folder size={18} className="fill-current opacity-80" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors truncate max-w-md">
                                    {row.name}
                                </span>
                                <span className="text-[10.5px] text-text-desc font-medium">
                                    {row.templates_count || 0} item di dalam folder
                                </span>
                            </div>
                        </div>
                    );
                }

                const isPdf = row.file_type === 'pdf';
                const isExcel = ['xls', 'xlsx'].includes(row.file_type);

                return (
                    <div className="flex items-center gap-3 py-0.5">
                        <div
                            className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                                isPdf
                                    ? 'bg-rose-50 text-rose-600 border-rose-200/70 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-400'
                                    : isExcel
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-400'
                                    : 'bg-blue-50 text-blue-600 border-blue-200/70 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-400',
                            )}
                        >
                            <FileText size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors truncate max-w-md">
                                {row.name}
                            </span>
                            {row.description ? (
                                <span className="text-[10.5px] text-text-desc truncate max-w-md">
                                    {row.description}
                                </span>
                            ) : (
                                <span className="text-[10.5px] text-text-desc font-mono truncate max-w-md">
                                    {row.file_name}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Tipe',
            accessorKey: 'file_type',
            className: 'w-32',
            cell: (row) => {
                if (row.itemType === 'folder') {
                    return (
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-tight bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 uppercase">
                            Folder
                        </span>
                    );
                }

                const isPdf = row.file_type === 'pdf';
                const isExcel = ['xls', 'xlsx'].includes(row.file_type);

                return (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-tight border uppercase',
                            isPdf
                                ? 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                                : isExcel
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                                : 'bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
                        )}
                    >
                        {row.file_type}
                    </span>
                );
            },
        },
        {
            header: 'Lokasi Folder',
            accessorKey: 'folder_name',
            className: 'w-44',
            cell: (row) => (
                <span className="text-xs text-text-desc font-medium">
                    {row.itemType === 'folder' ? 'Sub-Folder' : row.folder_name || 'Root'}
                </span>
            ),
        },
        {
            header: 'Ukuran File',
            accessorKey: 'file_size',
            className: 'w-32',
            cell: (row) => (
                <span className="text-xs text-text-desc font-medium">
                    {row.itemType === 'folder' ? '-' : formatSize(row.file_size || 0)}
                </span>
            ),
        },
        {
            header: 'Pengunggah',
            accessorKey: 'creator_name',
            className: 'w-40',
            cell: (row) => (
                <span className="text-xs text-text-desc font-medium">
                    {row.itemType === 'folder' ? '-' : row.creator_name || '-'}
                </span>
            ),
        },
        {
            header: 'Aksi',
            accessorKey: 'id',
            className: 'w-20 text-center',
            cell: (row) => (
                <div className="flex items-center justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-text-desc hover:text-text-main hover:bg-surface-muted transition-all cursor-pointer"
                            >
                                <MoreHorizontal size={15} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 p-1.5 shadow-xl border-surface-border">
                            {row.itemType === 'template' ? (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => setPreviewTemplate(row.raw)}
                                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted rounded-md transition-colors cursor-pointer"
                                    >
                                        <Eye size={13} className="text-primary" />
                                        <span>Buka / Pratinjau</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={route('admin.templates.download', row.id)}
                                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted rounded-md transition-colors cursor-pointer"
                                        >
                                            <Download size={13} className="text-emerald-500" />
                                            <span>Download</span>
                                        </a>
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => setCurrentFolderId(row.id)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted rounded-md transition-colors cursor-pointer"
                                >
                                    <FolderOpen size={13} className="text-amber-500" />
                                    <span>Buka Folder</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedItem({ type: row.itemType, id: row.id, name: row.name });
                                    setNewFolderName(row.name);
                                    setIsRenameModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted rounded-md transition-colors cursor-pointer"
                            >
                                <Edit3 size={13} className="text-amber-500" />
                                <span>Ubah Nama</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedItem({ type: row.itemType, id: row.id, name: row.name });
                                    setTargetFolderId(row.itemType === 'folder' ? row.raw.parent_id : row.raw.template_folder_id);
                                    setIsMoveModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted rounded-md transition-colors cursor-pointer"
                            >
                                <FolderInput size={13} className="text-blue-500" />
                                <span>Pindahkan</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedItem({ type: row.itemType, id: row.id, name: row.name });
                                    setIsDeleteModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors cursor-pointer"
                            >
                                <Trash2 size={13} className="text-rose-500" />
                                <span>Hapus</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];
    // Recursive Tree Node Renderer for Left Sidebar
    const renderFolderTreeNode = (node: FolderTreeNode, depth = 0) => {
        const isSelected = currentFolderId === node.id;
        const isExpanded = expandedFolderIds.has(node.id);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.id} className="select-none">
                <div
                    onClick={() => setCurrentFolderId(node.id)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            target: { type: 'folder', folder: node },
                        });
                    }}
                    className={cn(
                        'group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium transition-all cursor-pointer border border-transparent',
                        isSelected
                            ? 'bg-primary/10 text-primary font-bold border-primary/20 shadow-xs'
                            : 'text-text-main hover:bg-surface-muted/70 hover:text-text-main',
                    )}
                    style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
                >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={(e) => toggleFolderExpand(node.id, e)}
                                className="h-4 w-4 shrink-0 flex items-center justify-center rounded text-text-desc hover:text-text-main hover:bg-surface-border/50 transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown size={13} />
                                ) : (
                                    <ChevronRight size={13} />
                                )}
                            </button>
                        ) : (
                            <span className="w-4 shrink-0" />
                        )}

                        {isSelected || isExpanded ? (
                            <FolderOpen size={14} className="shrink-0 text-amber-500 fill-amber-500/20" />
                        ) : (
                            <Folder size={14} className="shrink-0 text-amber-500/90" />
                        )}

                        <span className="truncate text-[11.5px]">{node.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span
                            className={cn(
                                'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                                isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-surface-muted text-text-desc group-hover:bg-surface-border/80',
                            )}
                        >
                            {node.totalTemplatesCount}
                        </span>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button
                                    type="button"
                                    className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-text-desc hover:text-text-main hover:bg-surface-border/60 transition-opacity"
                                >
                                    <MoreHorizontal size={12} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40 p-1 shadow-lg border-surface-border">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDragDropTargetFolder({
                                            id: node.id,
                                            name: node.name,
                                        });
                                        setIsUploadModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-primary cursor-pointer font-semibold"
                                >
                                    <Upload size={13} className="text-primary" />
                                    <span>Upload Dokumen</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFolderFormParentId(node.id);
                                        setNewFolderName('');
                                        setIsFolderModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-text-main cursor-pointer"
                                >
                                    <FolderPlus size={13} className="text-amber-500" />
                                    <span>Buat Sub-Folder</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedItem({ type: 'folder', id: node.id, name: node.name });
                                        setNewFolderName(node.name);
                                        setIsRenameModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-text-main cursor-pointer"
                                >
                                    <Edit3 size={13} className="text-amber-500" />
                                    <span>Ubah Nama</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedItem({ type: 'folder', id: node.id, name: node.name });
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                    <Trash2 size={13} className="text-rose-500" />
                                    <span>Hapus Folder</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Render children recursively if expanded */}
                {hasChildren && isExpanded && (
                    <div className="space-y-0.5 mt-0.5 border-l border-surface-border/40 ml-4 pl-1">
                        {node.children.map((child) => renderFolderTreeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title="Template Kontrak" />
            <MasterPageLayout>
                {/* ── LEFT SIDEBAR: FOLDER TREE MAP NAVIGATION ── */}
                <FloatingPanel className="w-72 shrink-0 border-r border-surface-border bg-surface-card/50 flex flex-col h-full overflow-hidden">
                    {/* Header Sidebar */}
                    <div className="p-3.5 border-b border-surface-border flex items-center justify-between bg-surface-muted/20 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50">
                                <FolderTree size={14} />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-text-main">Direktori Folder</h3>
                                <p className="text-[10px] text-text-desc font-medium">Pohon struktur templat</p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setFolderFormParentId(currentFolderId);
                                setNewFolderName('');
                                setIsFolderModalOpen(true);
                            }}
                            className="h-7 w-7 rounded-lg text-text-desc hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="Buat Sub-Folder Baru"
                        >
                            <FolderPlus size={15} />
                        </Button>
                    </div>

                    {/* Filter / Search Tree */}
                    <div className="p-2 border-b border-surface-border/60 shrink-0">
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-desc" />
                            <Input
                                value={treeSearch}
                                onChange={(e) => setTreeSearch(e.target.value)}
                                placeholder="Cari folder..."
                                className="h-7.5 pl-8 pr-2.5 text-[11px] rounded-md bg-surface-base"
                            />
                        </div>
                    </div>

                    {/* Tree Content List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {/* Root Repository Item */}
                        <div
                            onClick={() => setCurrentFolderId(null)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    target: { type: 'root' },
                                });
                            }}
                            className={cn(
                                'group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium transition-all cursor-pointer border border-transparent select-none',
                                currentFolderId === null
                                    ? 'bg-primary/10 text-primary font-bold border-primary/20 shadow-xs'
                                    : 'text-text-main hover:bg-surface-muted/70',
                            )}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Layers size={14} className={cn('shrink-0', currentFolderId === null ? 'text-primary' : 'text-text-desc')} />
                                <span className="truncate text-[11.5px]">Semua / Repository Root</span>
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                                    currentFolderId === null
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-surface-muted text-text-desc group-hover:bg-surface-border/80',
                                )}
                            >
                                {totalAllTemplates}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="my-1 border-t border-surface-border/50" />

                        {/* Folders Tree Nodes */}
                        {folderTree.length === 0 ? (
                            <div className="py-6 text-center text-[11px] text-text-desc">
                                Belum ada folder.
                            </div>
                        ) : (
                            folderTree
                                .filter((node) => !treeSearch || node.name.toLowerCase().includes(treeSearch.toLowerCase()) || node.children.some(c => c.name.toLowerCase().includes(treeSearch.toLowerCase())))
                                .map((node) => renderFolderTreeNode(node))
                        )}
                    </div>

                    {/* Footer Stats Sidebar */}
                    <div className="p-2.5 border-t border-surface-border bg-surface-muted/30 text-[10.5px] text-text-desc flex items-center justify-between shrink-0">
                        <span>{folders.length} Folder</span>
                        <span>{totalAllTemplates} Total Dokumen</span>
                    </div>
                </FloatingPanel>

                {/* ── RIGHT MAIN PANEL: TEMPLATES TABLE CONTENT ── */}
                <FloatingPanel
                    onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragCounter((prev) => prev + 1);
                        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                            setIsDragging(true);
                        }
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragCounter((prev) => {
                            const next = prev - 1;
                            if (next <= 0) setIsDragging(false);
                            return Math.max(0, next);
                        });
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        setDragCounter(0);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleFilesDropped(e.dataTransfer.files);
                        }
                    }}
                    className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative"
                >
                    {/* Drag and Drop Active Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-xl m-2 animate-in fade-in duration-150 pointer-events-none">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl mb-3 animate-bounce">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-sm font-bold text-text-main">
                                Lepaskan file di sini untuk upload
                            </h3>
                            <p className="text-xs text-text-desc mt-1">
                                Dokumen akan di-upload ke: <strong className="text-primary">{currentFolder ? `Folder "${currentFolder.name}"` : 'Repository Root'}</strong>
                            </p>
                        </div>
                    )}

                    <PageTable
                        standalone={false}
                        title="Template Kontrak"
                        subtitle={
                            currentFolder
                                ? `Direktori: ${folderPath.map((f) => f.name).join(' / ')}`
                                : 'Kelola berkas templat kontrak, formulir, dan struktur folder dokumen'
                        }
                        icon={FileSpreadsheet}
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Cari nama template, folder, atau berkas..."
                        filters={filterCategories}
                        activeFilters={{ file_type: fileTypeFilter }}
                        onFilterChange={(keyOrObj, val) => {
                            if (typeof keyOrObj === 'string' && keyOrObj === 'file_type') {
                                setFileTypeFilter(Array.isArray(val) ? val : [val]);
                            } else if (typeof keyOrObj === 'object' && keyOrObj.file_type) {
                                setFileTypeFilter(Array.isArray(keyOrObj.file_type) ? keyOrObj.file_type : [keyOrObj.file_type]);
                            }
                        }}
                        onResetFilters={() => setFileTypeFilter([])}
                        totalResults={processedRows.length}
                        actions={
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFolderFormParentId(currentFolderId);
                                        setNewFolderName('');
                                        setIsFolderModalOpen(true);
                                    }}
                                    className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                    <FolderPlus size={15} className="text-amber-500" />
                                    <span>{currentFolderId ? 'Buat Sub-Folder' : 'Buat Folder'}</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        setDragDropTargetFolder({
                                            id: currentFolderId,
                                            name: currentFolder ? currentFolder.name : 'Repository Root',
                                        });
                                        setIsUploadModalOpen(true);
                                    }}
                                    className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                    <Upload size={15} />
                                    <span>Upload Dokumen</span>
                                </Button>
                            </div>
                        }
                    >
                        {/* Folder Breadcrumbs Navigation Trail */}
                        <div className="flex items-center justify-between border-b border-surface-border bg-surface-card/40 px-5 py-2.5 text-xs text-text-desc shrink-0">
                            <div className="flex items-center gap-2 min-w-0 overflow-x-auto custom-scrollbar">
                                {currentFolderId !== null && (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentFolderId(currentFolder?.parent_id || null)}
                                        className="inline-flex items-center gap-1 rounded-md bg-surface-muted hover:bg-surface-border px-2 py-1 text-[11px] font-semibold text-text-main transition-colors cursor-pointer mr-1 shrink-0"
                                        title="Kembali ke Folder Sebelumnya"
                                    >
                                        <ArrowLeft size={12} />
                                        <span>Kembali</span>
                                    </button>
                                )}

                                <div className="flex items-center gap-1.5 font-medium shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentFolderId(null)}
                                        className={cn(
                                            'hover:text-primary transition-colors flex items-center gap-1 cursor-pointer',
                                            currentFolderId === null ? 'text-primary font-bold' : 'text-text-desc',
                                        )}
                                    >
                                        <Folder size={13} className="text-amber-500" />
                                        <span>Repository Root</span>
                                    </button>

                                    {folderPath.map((folder, idx) => (
                                        <React.Fragment key={folder.id}>
                                            <ChevronRight size={11} className="text-text-desc/60 shrink-0" />
                                            <button
                                                type="button"
                                                onClick={() => setCurrentFolderId(folder.id)}
                                                className={cn(
                                                    'hover:text-primary truncate max-w-[140px] transition-colors cursor-pointer',
                                                    idx === folderPath.length - 1 ? 'text-primary font-bold' : 'text-text-desc',
                                                )}
                                            >
                                                {folder.name}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            <span className="text-[11px] font-semibold text-text-desc shrink-0 pl-2">
                                {processedRows.length} item ditampilkan
                            </span>
                        </div>

                        {/* Standard Master Data Table */}
                        <div className="flex-1 min-h-0 overflow-auto">
                            <DataTable
                                columns={columns}
                                data={processedRows}
                                borderless={true}
                                selectedRows={selectedRows}
                                onSelectionChange={setSelectedRows}
                                bulkActions={
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setBulkTargetFolderId(null);
                                                setIsBulkMoveModalOpen(true);
                                            }}
                                            className="h-7.5 gap-1 px-2.5 text-[11px] font-semibold bg-surface-card hover:bg-surface-muted"
                                        >
                                            <FolderInput size={13} className="text-blue-500" />
                                            <span>Pindahkan ({selectedRows.length})</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setIsBulkDeleteModalOpen(true)}
                                            className="h-7.5 gap-1 px-2.5 text-[11px] font-semibold"
                                        >
                                            <Trash2 size={13} />
                                            <span>Hapus ({selectedRows.length})</span>
                                        </Button>
                                    </div>
                                }
                                onRowClick={(row) => {
                                    if (row.itemType === 'folder') {
                                        setCurrentFolderId(row.id);
                                    } else {
                                        setPreviewTemplate(row.raw);
                                    }
                                }}
                                onRowContextMenu={(row, e) => {
                                    if (row.itemType === 'folder') {
                                        setContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            target: { type: 'folder', folder: row.raw },
                                        });
                                    } else {
                                        setContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            target: { type: 'template', template: row.raw },
                                        });
                                    }
                                }}
                            />
                        </div>
                    </PageTable>
                </FloatingPanel>
            </MasterPageLayout>

            {/* ── MODAL: BUAT FOLDER / SUB-FOLDER ── */}
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[440px]">
                    <form onSubmit={handleCreateFolder}>
                        <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                            <DialogTitle className="text-sm font-bold text-text-main flex items-center gap-2">
                                <FolderPlus size={16} className="text-amber-500" />
                                <span>{folderFormParentId ? 'Buat Sub-Folder Baru' : 'Buat Folder Baru'}</span>
                            </DialogTitle>
                            <DialogDescription className="text-text-desc mt-0.5 text-xs">
                                Tambahkan folder atau sub-folder untuk mengelompokkan template kontrak.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 p-5">
                            <div className="grid gap-1.5">
                                <Label htmlFor="folder-parent" className="text-text-main text-xs font-semibold">
                                    Lokasi Induk Folder (Parent)
                                </Label>
                                <select
                                    id="folder-parent"
                                    value={folderFormParentId || ''}
                                    onChange={(e) => setFolderFormParentId(e.target.value || null)}
                                    className="h-9 w-full rounded-lg border border-surface-border bg-surface-card px-3 text-xs text-text-main outline-none focus:border-primary"
                                >
                                    <option value="">Repository Root (Folder Utama)</option>
                                    {folders
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((f) => (
                                            <option key={f.id} value={f.id}>
                                                📁 {f.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="folder-name-input" className="text-text-main text-xs font-semibold">
                                    Nama Folder <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="folder-name-input"
                                    className="h-10 text-xs"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Contoh: Perjanjian Kerjasama (PKS)"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 px-4 text-xs font-semibold"
                                onClick={() => setIsFolderModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                className="h-9 px-5 text-xs font-semibold"
                                disabled={!newFolderName.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin mr-1.5" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>Simpan Folder</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── MODAL: UPLOAD DOKUMEN TEMPLATE (DROPZONE & FORM INTEGRATED) ── */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[500px]">
                    <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                        <DialogTitle className="text-sm font-bold text-text-main flex items-center gap-2">
                            <Upload size={16} className="text-primary" />
                            <span>Upload Dokumen Template</span>
                        </DialogTitle>
                        <DialogDescription className="text-text-desc mt-0.5 text-xs">
                            File yang dimasukkan akan otomatis di-upload ke: <strong className="text-primary">{dragDropTargetFolder.name}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-5 space-y-4">
                        <div className="grid gap-1.5">
                            <Label className="text-text-main text-xs font-semibold">
                                Folder Tujuan Upload
                            </Label>
                            <select
                                value={dragDropTargetFolder.id || ''}
                                onChange={(e) => {
                                    const selectedId = e.target.value || null;
                                    const found = folders.find((f) => f.id === selectedId);
                                    setDragDropTargetFolder({
                                        id: selectedId,
                                        name: found ? found.name : 'Repository Root',
                                    });
                                }}
                                className="h-9 w-full rounded-lg border border-surface-border bg-surface-card px-3 text-xs text-text-main outline-none focus:border-primary"
                            >
                                <option value="">Repository Root (Tanpa Folder)</option>
                                {folders
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((f) => (
                                        <option key={f.id} value={f.id}>
                                            📁 {f.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Drop Zone Box */}
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'copy';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    const filesArray = Array.from(e.dataTransfer.files);
                                    setIsSubmitting(true);
                                    setIsUploadModalOpen(false);
                                    filesArray.forEach((file) => {
                                        const defaultName = file.name.replace(/\.[^/.]+$/, '');
                                        const formData = new FormData();
                                        formData.append('name', defaultName);
                                        formData.append('description', '');
                                        if (dragDropTargetFolder.id) {
                                            formData.append('template_folder_id', dragDropTargetFolder.id);
                                        }
                                        formData.append('file', file);

                                        router.post(route('admin.templates.store'), formData, {
                                            forceFormData: true,
                                            onFinish: () => {
                                                setIsSubmitting(false);
                                            },
                                        });
                                    });
                                }
                            }}
                            className="group border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 relative"
                        >
                            <input
                                type="file"
                                multiple
                                accept=".docx,.doc,.pdf,.xls,.xlsx,.txt,.rtf,.odt,.ods,.csv"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const filesArray = Array.from(e.target.files);
                                        setIsSubmitting(true);
                                        setIsUploadModalOpen(false);
                                        filesArray.forEach((file) => {
                                            const defaultName = file.name.replace(/\.[^/.]+$/, '');
                                            const formData = new FormData();
                                            formData.append('name', defaultName);
                                            formData.append('description', '');
                                            if (dragDropTargetFolder.id) {
                                                formData.append('template_folder_id', dragDropTargetFolder.id);
                                            }
                                            formData.append('file', file);

                                            router.post(route('admin.templates.store'), formData, {
                                                forceFormData: true,
                                                onFinish: () => {
                                                    setIsSubmitting(false);
                                                },
                                            });
                                        });
                                    }
                                }}
                            />
                            <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                <Upload size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-text-main">
                                    Seret & Jatuhkan File di Sini
                                </h4>
                                <p className="text-xs text-text-desc mt-1">
                                    atau <span className="text-primary font-semibold underline">klik untuk memilih dari komputer</span>
                                </p>
                            </div>
                            <p className="text-[11px] text-text-desc/70">
                                Mendukung multi-file: .docx, .doc, .pdf, .xls, .xlsx (maks 20MB per file)
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-xs font-semibold"
                            onClick={() => setIsUploadModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── MODAL: UBAH NAMA ── */}
            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
                    <form onSubmit={handleRename}>
                        <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                            <DialogTitle className="text-sm font-bold text-text-main flex items-center gap-2">
                                <Edit3 size={16} className="text-amber-500" /> Ubah Nama
                            </DialogTitle>
                            <DialogDescription className="text-text-desc mt-0.5 text-xs">
                                Ubah nama untuk "{selectedItem?.name}".
                            </DialogDescription>
                        </DialogHeader>
                        <div className="p-5">
                            <Label htmlFor="rename-input" className="text-text-main mb-2 block text-xs font-semibold">
                                Nama Baru
                            </Label>
                            <Input
                                id="rename-input"
                                className="h-10 text-xs"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 px-4 text-xs font-semibold"
                                onClick={() => setIsRenameModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                className="h-9 px-5 text-xs font-semibold"
                                disabled={!newFolderName.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin mr-1.5" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>Terapkan Perubahan</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── MODAL: PINDAHKAN FOLDER / TEMPLATE ── */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[450px]">
                    <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                        <DialogTitle className="text-sm font-bold text-text-main flex items-center gap-2">
                            <FolderInput size={16} className="text-blue-500" /> Pindahkan Dokumen / Folder
                        </DialogTitle>
                        <DialogDescription className="text-text-desc mt-0.5 text-xs">
                            Pilih folder tujuan untuk <strong>{selectedItem?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5">
                        <Label className="text-text-main mb-2 block text-xs font-semibold">
                            Folder Tujuan
                        </Label>
                        <div className="border-surface-border bg-surface-card/50 overflow-hidden rounded-xl border">
                            <div className="custom-scrollbar max-h-56 overflow-y-auto p-1.5 space-y-1">
                                <button
                                    type="button"
                                    className={cn(
                                        'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer text-left',
                                        targetFolderId === null
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-text-main hover:bg-surface-muted',
                                    )}
                                    onClick={() => setTargetFolderId(null)}
                                >
                                    <Folder size={14} className={cn(targetFolderId === null ? 'fill-current' : 'text-amber-500')} />
                                    <span>Repository Root (Folder Utama)</span>
                                </button>
                                {folders
                                    .filter((f) => f.id !== selectedItem?.id)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((folder) => (
                                        <button
                                            key={folder.id}
                                            type="button"
                                            className={cn(
                                                'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer text-left',
                                                targetFolderId === folder.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-text-main hover:bg-surface-muted',
                                            )}
                                            onClick={() => setTargetFolderId(folder.id)}
                                        >
                                            <Folder size={14} className={cn(targetFolderId === folder.id ? 'fill-current' : 'text-amber-500')} />
                                            <span className="truncate">{folder.name}</span>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-xs font-semibold"
                            onClick={() => setIsMoveModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="h-9 px-5 text-xs font-semibold"
                            onClick={handleMove}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin mr-1.5" />
                                    <span>Memindahkan...</span>
                                </>
                            ) : (
                                <span>Pindahkan Sekarang</span>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── MODAL: HAPUS KONFIRMASI ── */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden rounded-2xl border p-6 shadow-2xl sm:max-w-[400px]">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                            <AlertTriangle size={24} />
                        </div>
                        <DialogHeader className="p-0 text-center">
                            <DialogTitle className="text-text-main text-base font-bold">
                                Hapus {selectedItem?.type === 'folder' ? 'Folder' : 'Template'}?
                            </DialogTitle>
                            <DialogDescription className="text-text-desc mt-1 text-xs">
                                Apakah Anda yakin ingin menghapus <strong className="text-rose-600">"{selectedItem?.name}"</strong>?
                                {selectedItem?.type === 'folder' && ' Seluruh template di dalamnya akan ikut terhapus permanen.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 text-xs font-semibold"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                className="h-10 text-xs font-semibold"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Menghapus...' : 'Hapus'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ── MODAL: BULK DELETE KONFIRMASI ── */}
            <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden rounded-2xl border p-6 shadow-2xl sm:max-w-[420px]">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                            <AlertTriangle size={24} />
                        </div>
                        <DialogHeader className="p-0 text-center">
                            <DialogTitle className="text-text-main text-base font-bold">
                                Hapus {selectedRows.length} Item Terpilih?
                            </DialogTitle>
                            <DialogDescription className="text-text-desc mt-1 text-xs">
                                Anda akan menghapus <strong>{selectedRows.filter(r => r.itemType === 'folder').length} folder</strong> dan <strong>{selectedRows.filter(r => r.itemType === 'template').length} dokumen template</strong>. Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 text-xs font-semibold"
                                onClick={() => setIsBulkDeleteModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                className="h-10 text-xs font-semibold"
                                onClick={handleBulkDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin mr-1.5" />
                                        <span>Menghapus...</span>
                                    </>
                                ) : (
                                    `Hapus (${selectedRows.length})`
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── MODAL: BULK PINDAHKAN ── */}
            <Dialog open={isBulkMoveModalOpen} onOpenChange={setIsBulkMoveModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[450px]">
                    <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                        <DialogTitle className="text-sm font-bold text-text-main flex items-center gap-2">
                            <FolderInput size={16} className="text-blue-500" /> Pindahkan {selectedRows.length} Item Terpilih
                        </DialogTitle>
                        <DialogDescription className="text-text-desc mt-0.5 text-xs">
                            Pilih folder tujuan untuk memindahkan {selectedRows.length} item yang dipilih.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5">
                        <Label className="text-text-main mb-2 block text-xs font-semibold">
                            Folder Tujuan
                        </Label>
                        <div className="border-surface-border bg-surface-card/50 overflow-hidden rounded-xl border">
                            <div className="custom-scrollbar max-h-56 overflow-y-auto p-1.5 space-y-1">
                                <button
                                    type="button"
                                    className={cn(
                                        'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer text-left',
                                        bulkTargetFolderId === null
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-text-main hover:bg-surface-muted',
                                    )}
                                    onClick={() => setBulkTargetFolderId(null)}
                                >
                                    <Folder size={14} className={cn(bulkTargetFolderId === null ? 'fill-current' : 'text-amber-500')} />
                                    <span>Repository Root (Folder Utama)</span>
                                </button>
                                {folders
                                    .filter((f) => !selectedRows.some((r) => r.itemType === 'folder' && r.id === f.id))
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((folder) => (
                                        <button
                                            key={folder.id}
                                            type="button"
                                            className={cn(
                                                'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer text-left',
                                                bulkTargetFolderId === folder.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-text-main hover:bg-surface-muted',
                                            )}
                                            onClick={() => setBulkTargetFolderId(folder.id)}
                                        >
                                            <Folder size={14} className={cn(bulkTargetFolderId === folder.id ? 'fill-current' : 'text-amber-500')} />
                                            <span className="truncate">{folder.name}</span>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-xs font-semibold"
                            onClick={() => setIsBulkMoveModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="h-9 px-5 text-xs font-semibold"
                            onClick={handleBulkMove}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin mr-1.5" />
                                    <span>Memindahkan...</span>
                                </>
                            ) : (
                                <span>Pindahkan ({selectedRows.length})</span>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── CUSTOM RIGHT-CLICK CONTEXT MENU ── */}
            {contextMenu && (
                <div
                    style={{
                        top: `${Math.min(contextMenu.y, window.innerHeight - 220)}px`,
                        left: `${Math.min(contextMenu.x, window.innerWidth - 200)}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="fixed z-50 min-w-[190px] overflow-hidden rounded-xl border border-surface-border bg-surface-base/95 backdrop-blur-md p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none"
                >
                    {contextMenu.target.type === 'root' ? (
                        <>
                            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-desc border-b border-surface-border/50 mb-1">
                                Repository Root
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setContextMenu(null);
                                    setFolderFormParentId(null);
                                    setNewFolderName('');
                                    setIsFolderModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <FolderPlus size={14} className="text-amber-500" />
                                <span>Buat Folder Baru</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setContextMenu(null);
                                    setDragDropTargetFolder({
                                        id: null,
                                        name: 'Repository Root',
                                    });
                                    setIsUploadModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer text-left"
                            >
                                <Upload size={14} className="text-primary" />
                                <span>Upload Dokumen di Sini</span>
                            </button>
                        </>
                    ) : contextMenu.target.type === 'folder' ? (
                        <>
                            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-desc border-b border-surface-border/50 mb-1 truncate max-w-[170px]">
                                📁 {contextMenu.target.folder.name}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const folderId = (contextMenu.target as any).folder.id;
                                    setContextMenu(null);
                                    setCurrentFolderId(folderId);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <FolderOpen size={14} className="text-amber-500" />
                                <span>Buka Folder</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const folder = (contextMenu.target as any).folder;
                                    setContextMenu(null);
                                    setFolderFormParentId(folder.id);
                                    setNewFolderName('');
                                    setIsFolderModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <FolderPlus size={14} className="text-amber-500" />
                                <span>Buat Sub-Folder</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const folder = (contextMenu.target as any).folder;
                                    setContextMenu(null);
                                    setDragDropTargetFolder({
                                        id: folder.id,
                                        name: folder.name,
                                    });
                                    setIsUploadModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer text-left"
                            >
                                <Upload size={14} className="text-primary" />
                                <span>Upload Dokumen ke Folder Ini</span>
                            </button>
                            <div className="my-1 border-t border-surface-border/50" />
                            <button
                                type="button"
                                onClick={() => {
                                    const folder = (contextMenu.target as any).folder;
                                    setContextMenu(null);
                                    setSelectedItem({ type: 'folder', id: folder.id, name: folder.name });
                                    setNewFolderName(folder.name);
                                    setIsRenameModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <Edit3 size={14} className="text-amber-500" />
                                <span>Ubah Nama</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const folder = (contextMenu.target as any).folder;
                                    setContextMenu(null);
                                    setSelectedItem({ type: 'folder', id: folder.id, name: folder.name });
                                    setTargetFolderId(folder.parent_id || null);
                                    setIsMoveModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <FolderInput size={14} className="text-blue-500" />
                                <span>Pindahkan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const folder = (contextMenu.target as any).folder;
                                    setContextMenu(null);
                                    setSelectedItem({ type: 'folder', id: folder.id, name: folder.name });
                                    setIsDeleteModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                            >
                                <Trash2 size={14} className="text-rose-500" />
                                <span>Hapus Folder</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-desc border-b border-surface-border/50 mb-1 truncate max-w-[170px]">
                                📄 {contextMenu.target.template.name}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const tpl = (contextMenu.target as any).template;
                                    setContextMenu(null);
                                    setPreviewTemplate(tpl);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <Eye size={14} className="text-primary" />
                                <span>Buka / Pratinjau</span>
                            </button>
                            <a
                                href={route('admin.templates.download', (contextMenu.target as any).template.id)}
                                onClick={() => setContextMenu(null)}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <Download size={14} className="text-emerald-500" />
                                <span>Download Dokumen</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => {
                                    const tpl = (contextMenu.target as any).template;
                                    setContextMenu(null);
                                    setSelectedItem({ type: 'template', id: tpl.id, name: tpl.name });
                                    setNewFolderName(tpl.name);
                                    setIsRenameModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <Edit3 size={14} className="text-amber-500" />
                                <span>Ubah Nama</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const tpl = (contextMenu.target as any).template;
                                    setContextMenu(null);
                                    setSelectedItem({ type: 'template', id: tpl.id, name: tpl.name });
                                    setTargetFolderId(tpl.template_folder_id || null);
                                    setIsMoveModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted transition-colors cursor-pointer text-left"
                            >
                                <FolderInput size={14} className="text-blue-500" />
                                <span>Pindahkan</span>
                            </button>
                            <div className="my-1 border-t border-surface-border/50" />
                            <button
                                type="button"
                                onClick={() => {
                                    const tpl = (contextMenu.target as any).template;
                                    setContextMenu(null);
                                    setSelectedItem({ type: 'template', id: tpl.id, name: tpl.name });
                                    setIsDeleteModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                            >
                                <Trash2 size={14} className="text-rose-500" />
                                <span>Hapus Dokumen</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── MODAL: PRATINJAU / DETAIL DOKUMEN TEMPLATE ── */}
            <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[700px] max-h-[88vh] flex flex-col">
                    <DialogHeader className="bg-surface-muted/40 border-surface-border border-b px-5 py-4 shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-sm font-bold text-text-main flex items-center gap-2 truncate max-w-lg">
                                <FileText size={16} className="text-primary shrink-0" />
                                <span className="truncate">{previewTemplate?.name}</span>
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-text-desc mt-0.5 text-xs truncate">
                            {previewTemplate?.file_name} • {formatSize(previewTemplate?.file_size || 0)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                        {previewTemplate?.file_type?.toLowerCase() === 'pdf' ? (
                            <div className="w-full h-[450px] rounded-xl border border-surface-border overflow-hidden bg-surface-muted/30">
                                <iframe
                                    src={`/storage/${previewTemplate.file_path}`}
                                    className="w-full h-full border-none"
                                    title={previewTemplate.name}
                                />
                            </div>
                        ) : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(previewTemplate?.file_type?.toLowerCase() || '') ? (
                            <div className="w-full flex items-center justify-center p-4 rounded-xl border border-surface-border bg-surface-muted/20">
                                <img
                                    src={`/storage/${previewTemplate?.file_path}`}
                                    alt={previewTemplate?.name}
                                    className="max-h-[420px] max-w-full rounded-lg object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-surface-border bg-surface-muted/10 text-center gap-3">
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                    <FileSpreadsheet size={28} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-text-main">{previewTemplate?.name}</h4>
                                    <p className="text-xs text-text-desc mt-1 max-w-sm">
                                        Berkas bertipe <span className="font-mono font-bold uppercase text-text-main">.{previewTemplate?.file_type}</span> tidak mendukung pratinjau inline langsung di browser. Silakan unduh untuk melihat isinya.
                                    </p>
                                </div>
                                <a
                                    href={previewTemplate ? route('admin.templates.download', previewTemplate.id) : '#'}
                                    className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-colors mt-2"
                                >
                                    <Download size={14} />
                                    <span>Download File ({formatSize(previewTemplate?.file_size || 0)})</span>
                                </a>
                            </div>
                        )}

                        {previewTemplate?.description && (
                            <div className="rounded-xl border border-surface-border/70 bg-surface-card/60 p-3.5 space-y-1">
                                <span className="text-[11px] font-bold uppercase text-text-desc tracking-wider">Keterangan Dokumen</span>
                                <p className="text-xs text-text-main leading-relaxed">{previewTemplate.description}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 text-xs font-semibold"
                            onClick={() => setPreviewTemplate(null)}
                        >
                            Tutup
                        </Button>
                        {previewTemplate && (
                            <a
                                href={route('admin.templates.download', previewTemplate.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
                            >
                                <Download size={14} />
                                <span>Download File</span>
                            </a>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
