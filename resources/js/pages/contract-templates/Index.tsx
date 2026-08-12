import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/inputs/Input';
import { Label } from '@/components/ui/forms/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { SideFilterCard, FilterCategory } from '@/components/ui/selection/SideFilterCard';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import {
    AlertTriangle,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    ChevronsDown,
    ChevronsUp,
    File,
    FileText,
    Filter,
    Folder,
    FolderPlus,
    LayoutGrid,
    List,
    MoreHorizontal,
    MoreVertical,
    Plus,
    Search,
    Upload,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface TemplateFolder {
    id: string;
    parent_id: string | null;
    name: string;
    templates_count: number;
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
}

interface Props {
    folders: TemplateFolder[];
    templates: ContractTemplate[];
}

export default function Templates({ folders, templates }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Dialog States
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Selection/Item States
    const [selectedItem, setSelectedItem] = useState<{ type: 'folder' | 'template' | 'background'; id: string; name: string } | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [uploadData, setUploadData] = useState({ name: '', description: '', file: null as File | null });
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        isOpen: boolean;
        item: { type: 'folder' | 'template' | 'background'; id: string; name: string } | null;
    }>({ x: 0, y: 0, isOpen: false, item: null });

    const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'template' | 'background', id: string, name: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            isOpen: true,
            item: { type, id, name },
        });
    };

    // Computed Data
    const currentFolder = useMemo(() => folders.find((f) => f.id === currentFolderId), [folders, currentFolderId]);

    const filteredFolders = useMemo(
        () => folders.filter((f) => f.parent_id === currentFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [folders, currentFolderId, searchQuery],
    );

    const filteredTemplates = useMemo(
        () =>
            templates.filter(
                (t) =>
                    t.template_folder_id === currentFolderId &&
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    (fileTypeFilter ? t.file_type === fileTypeFilter : true),
            ),
        [templates, currentFolderId, searchQuery, fileTypeFilter],
    );

    const [isRightFilterOpen, setIsRightFilterOpen] = useState(false);

    // Get unique file types from all templates for the filter dropdown
    const availableFileTypes = useMemo(() => {
        const types = new Set<string>();
        templates.forEach((t) => {
            if (t.file_type) types.add(t.file_type);
        });
        return Array.from(types).sort();
    }, [templates]);

    const filterCategories: FilterCategory[] = useMemo(
        () => [
            {
                key: 'file_type',
                label: 'Tipe File',
                type: 'multiselect',
                options: availableFileTypes.map((type) => ({
                    label: type.toUpperCase(),
                    value: type,
                })),
            },
        ],
        [availableFileTypes],
    );

    const expandAllFolders = () => {
        const expanded: Record<string, boolean> = {};
        folders.forEach((f) => {
            expanded[f.id] = true;
        });
        setExpandedFolders(expanded);
    };

    const collapseAllFolders = () => {
        setExpandedFolders({});
    };

    const toggleFolder = (id: string) => {
        setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreateFolder = () => {
        if (!newFolderName) return;
        router.post(
            route('admin.templates.folders.store'),
            {
                name: newFolderName,
                parent_id: currentFolderId,
            },
            {
                onSuccess: () => {
                    setNewFolderName('');
                    setIsFolderModalOpen(false);
                },
            },
        );
    };

    const handleDirectFileUpload = (file: File, folderId: string | null) => {
        const formData = new FormData();
        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        formData.append('name', fileNameWithoutExt);
        formData.append('description', 'Uploaded via Drag & Drop');
        formData.append('template_folder_id', folderId || '');
        formData.append('file', file);

        router.post(route('admin.templates.store'), formData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleUploadTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.name || !uploadData.file) return;

        const formData = new FormData();
        formData.append('name', uploadData.name);
        formData.append('description', uploadData.description);
        formData.append('template_folder_id', currentFolderId || '');
        formData.append('file', uploadData.file);

        router.post(route('admin.templates.store'), formData, {
            onSuccess: () => {
                setUploadData({ name: '', description: '', file: null });
                setIsUploadModalOpen(false);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedItem) return;

        const url =
            selectedItem.type === 'folder'
                ? route('admin.templates.folders.destroy', selectedItem.id)
                : route('admin.templates.destroy', selectedItem.id);

        router.delete(url, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedItem(null);
            },
        });
    };

    const handleRename = () => {
        if (!selectedItem || !newFolderName) return;

        const url =
            selectedItem.type === 'folder'
                ? route('admin.templates.folders.update', selectedItem.id)
                : route('admin.templates.update', selectedItem.id);

        router.put(
            url,
            { name: newFolderName },
            {
                onSuccess: () => {
                    setNewFolderName('');
                    setIsRenameModalOpen(false);
                    setSelectedItem(null);
                },
            },
        );
    };

    const handleMoveItem = (type: 'folder' | 'template', itemId: string, destinationFolderId: string | null) => {
        const url = type === 'folder' ? route('admin.templates.folders.move', itemId) : route('admin.templates.move', itemId);
        const data = type === 'folder' ? { parent_id: destinationFolderId } : { template_folder_id: destinationFolderId };

        router.patch(url, data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleMove = () => {
        if (!selectedItem) return;
        handleMoveItem(selectedItem.type as 'folder' | 'template', selectedItem.id, targetFolderId);
        setIsMoveModalOpen(false);
        setSelectedItem(null);
        setTargetFolderId(null);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    const folderPath = getFolderPath(currentFolderId);

    return (
        <>
            <Head title="Template Kontrak" />

            <MasterPageLayout>
                {/* Floating Left Sidebar for Tree Navigation */}
                <div
                    className={cn(
                        'flex flex-col shrink-0 rounded-2xl border border-border bg-card dark:bg-zinc-900/95 overflow-hidden transition-all duration-300',
                        isSidebarCollapsed ? 'w-14 p-3 gap-3 items-center' : 'w-72 p-5 gap-5',
                    )}
                >
                    <div className={cn('flex items-center w-full', isSidebarCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between px-1')}>
                        {!isSidebarCollapsed && (
                            <div className="space-y-0.5">
                                <h3 className="text-xs font-bold text-text-main tracking-tight">Struktur Folder</h3>
                                <p className="text-[10px] text-text-soft uppercase tracking-wider">Hierarchy Explorer</p>
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            {!isSidebarCollapsed && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg text-text-soft hover:text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                                        onClick={expandAllFolders}
                                        title="Expand All Folder"
                                    >
                                        <ChevronsDown size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg text-text-soft hover:text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                                        onClick={collapseAllFolders}
                                        title="Minimize / Collapse All Folder"
                                    >
                                        <ChevronsUp size={14} />
                                    </Button>
                                </>
                            )}
                            {/* Soft Amber Minimize Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/60 dark:border-amber-800/60 transition-all shadow-2xs"
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                title={isSidebarCollapsed ? 'Buka Struktur Folder' : 'Minimize Sidebar'}
                            >
                                <ChevronRight
                                    size={14}
                                    className={cn('transition-transform duration-300', isSidebarCollapsed ? 'rotate-0' : 'rotate-180')}
                                />
                            </Button>
                        </div>
                    </div>

                    {!isSidebarCollapsed ? (
                        <div
                            className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1 w-full"
                            onContextMenu={(e) => handleContextMenu(e, 'background', currentFolderId || 'root', 'Struktur Folder')}
                        >
                            <div
                                className={cn(
                                    'group flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs transition-all active:scale-[0.98]',
                                    currentFolderId === null
                                        ? 'bg-slate-200/80 dark:bg-zinc-800 border-slate-300/80 dark:border-zinc-700 text-slate-950 dark:text-zinc-100 shadow-2xs font-extrabold'
                                        : 'border-transparent text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-foreground font-medium',
                                )}
                                onClick={() => setCurrentFolderId(null)}
                                onContextMenu={(e) => handleContextMenu(e, 'background', 'root', 'Repository Root')}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const itemData = e.dataTransfer.getData('text/plain');
                                    if (!itemData) return;
                                    try {
                                        const parsed = JSON.parse(itemData);
                                        if (parsed.id) {
                                            handleMoveItem(parsed.type, parsed.id, null);
                                        }
                                    } catch (err) {}
                                }}
                            >
                                <Folder
                                    size={15}
                                    className={cn('transition-colors', currentFolderId === null ? 'text-primary fill-primary/20' : 'text-text-soft')}
                                />
                                Repository Root
                            </div>
                            <div className="mt-2 pl-1.5 space-y-0.5">
                                {folders
                                    .filter((f) => !f.parent_id)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((folder, idx, arr) => (
                                        <FolderTreeItem
                                            key={folder.id}
                                            folder={folder}
                                            allFolders={folders}
                                            currentId={currentFolderId}
                                            onSelect={setCurrentFolderId}
                                            expandedFolders={expandedFolders}
                                            toggleFolder={toggleFolder}
                                            isLast={idx === arr.length - 1}
                                            onContextMenu={handleContextMenu}
                                            onMoveItem={handleMoveItem}
                                            onDirectFileUpload={handleDirectFileUpload}
                                        />
                                    ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 w-full pt-2">
                            <Button
                                variant={currentFolderId === null ? 'primary' : 'ghost'}
                                size="icon"
                                className="h-9 w-9 rounded-xl"
                                onClick={() => setCurrentFolderId(null)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const itemData = e.dataTransfer.getData('text/plain');
                                    if (!itemData) return;
                                    try {
                                        const parsed = JSON.parse(itemData);
                                        if (parsed.id) {
                                            handleMoveItem(parsed.type, parsed.id, null);
                                        }
                                    } catch (err) {}
                                }}
                                title="Repository Root"
                            >
                                <Folder size={16} />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Floating Main Content Area */}
                <FloatingPanel className="flex flex-col flex-1 min-w-0">
                    {/* Floating Header Toolbar */}
                    <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-6 bg-card dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Button
                                variant="white"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-lg border border-border shadow-2xs disabled:opacity-40"
                                onClick={() => setCurrentFolderId(currentFolder?.parent_id || null)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const itemData = e.dataTransfer.getData('text/plain');
                                    if (!itemData) return;
                                    try {
                                        const parsed = JSON.parse(itemData);
                                        if (parsed.id) {
                                            handleMoveItem(parsed.type, parsed.id, currentFolder?.parent_id || null);
                                        }
                                    } catch (err) {}
                                }}
                                disabled={currentFolderId === null}
                                title="Kembali ke Folder Induk"
                            >
                                <ArrowLeft size={14} className="text-text-soft" />
                            </Button>

                            <nav className="flex items-center gap-1.5 overflow-hidden text-xs">
                                <button
                                    className={cn(
                                        'hover:text-primary transition-colors flex items-center gap-1 font-medium',
                                        currentFolderId === null ? 'text-primary font-semibold' : 'text-text-soft',
                                    )}
                                    onClick={() => setCurrentFolderId(null)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const itemData = e.dataTransfer.getData('text/plain');
                                        if (!itemData) return;
                                        try {
                                            const parsed = JSON.parse(itemData);
                                            if (parsed.id) {
                                                handleMoveItem(parsed.type, parsed.id, null);
                                            }
                                        } catch (err) {}
                                    }}
                                >
                                    <Folder size={14} /> Repository Root
                                </button>

                                {folderPath.map((folder, idx) => (
                                    <React.Fragment key={folder.id}>
                                        <ChevronRight size={12} className="text-text-soft shrink-0" />
                                        <button
                                            className={cn(
                                                'hover:text-primary truncate max-w-[120px] transition-colors font-medium',
                                                idx === folderPath.length - 1 ? 'text-primary font-semibold' : 'text-text-soft',
                                            )}
                                            onClick={() => setCurrentFolderId(folder.id)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const itemData = e.dataTransfer.getData('text/plain');
                                                if (!itemData) return;
                                                try {
                                                    const parsed = JSON.parse(itemData);
                                                    if (parsed.id && parsed.id !== folder.id) {
                                                        handleMoveItem(parsed.type, parsed.id, folder.id);
                                                    }
                                                } catch (err) {}
                                            }}
                                        >
                                            {folder.name}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative hidden w-56 md:block">
                                <Search className="text-text-soft absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 z-10 pointer-events-none" />
                                <Input
                                    type="search"
                                    variant="filled"
                                    placeholder="Cari asset..."
                                    className="h-9 rounded-lg border-border pl-9 text-xs font-normal transition-all shadow-2xs"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* View Switcher: Grid / List */}
                            <div className="flex items-center rounded-lg border border-border bg-slate-100/80 dark:bg-zinc-800/80 p-0.5 shadow-2xs">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'h-7 w-7 rounded-md transition-all',
                                        viewMode === 'grid'
                                            ? 'bg-card text-primary shadow-xs font-semibold'
                                            : 'text-text-soft hover:text-text-main hover:bg-slate-200/50 dark:hover:bg-zinc-700/50',
                                    )}
                                    onClick={() => setViewMode('grid')}
                                    title="Tampilan Grid"
                                >
                                    <LayoutGrid size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'h-7 w-7 rounded-md transition-all',
                                        viewMode === 'list'
                                            ? 'bg-card text-primary shadow-xs font-semibold'
                                            : 'text-text-soft hover:text-text-main hover:bg-slate-200/50 dark:hover:bg-zinc-700/50',
                                    )}
                                    onClick={() => setViewMode('list')}
                                    title="Tampilan List"
                                >
                                    <List size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* File List / Grid */}
                    <div
                        className="custom-scrollbar flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-zinc-950/30"
                        onContextMenu={(e) => handleContextMenu(e, 'background', currentFolderId || 'root', 'Background')}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                Array.from(e.dataTransfer.files).forEach((file) => {
                                    handleDirectFileUpload(file, currentFolderId);
                                });
                                return;
                            }
                            const itemData = e.dataTransfer.getData('text/plain');
                            if (!itemData) return;
                            try {
                                const parsed = JSON.parse(itemData);
                                if (parsed.id && parsed.type) {
                                    handleMoveItem(parsed.type, parsed.id, currentFolderId);
                                }
                            } catch (err) {}
                        }}
                    >
                        <div
                            className={cn(
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5'
                                    : 'grid auto-rows-max grid-cols-1 gap-2.5',
                            )}
                        >
                            {/* Folders First */}
                            {filteredFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folder.id }));
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                            Array.from(e.dataTransfer.files).forEach((file) => {
                                                handleDirectFileUpload(file, folder.id);
                                            });
                                            return;
                                        }
                                        const itemData = e.dataTransfer.getData('text/plain');
                                        if (!itemData) return;
                                        try {
                                            const parsed = JSON.parse(itemData);
                                            if (parsed.id && parsed.id !== folder.id) {
                                                handleMoveItem(parsed.type, parsed.id, folder.id);
                                            }
                                        } catch (err) {}
                                    }}
                                    className={cn(
                                        'group border-border bg-card dark:bg-zinc-900/90 hover:bg-slate-50 dark:hover:bg-zinc-800/70 hover:border-slate-300 dark:hover:border-zinc-700 relative cursor-grab active:cursor-grabbing rounded-xl border transition-all duration-150 select-none shadow-2xs',
                                        viewMode === 'grid' ? 'flex flex-col p-4 items-start justify-between min-h-[110px]' : 'flex h-14 items-center gap-3 px-4 py-3',
                                        contextMenu.item?.id === folder.id && contextMenu.isOpen ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/40' : '',
                                    )}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                                >
                                    {viewMode === 'grid' ? (
                                        <>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 transition-all">
                                                    <Folder size={18} className="fill-current" fillOpacity={0.15} />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-slate-200/60 dark:hover:bg-zinc-700 h-7 w-7 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleContextMenu(e as any, 'folder', folder.id, folder.name);
                                                    }}
                                                >
                                                    <MoreVertical size={14} className="text-text-soft" />
                                                </Button>
                                            </div>
                                            <div className="mt-3 min-w-0 w-full">
                                                <h4 className="text-text-main truncate text-xs font-semibold leading-tight">{folder.name}</h4>
                                                <p className="text-text-soft text-[10px] font-medium tracking-wide uppercase mt-1">
                                                    {folder.templates_count} items
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 transition-all">
                                                <Folder size={16} className="fill-current" fillOpacity={0.15} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-text-main truncate text-xs font-semibold leading-tight">{folder.name}</h4>
                                                <p className="text-text-soft text-[10px] font-medium tracking-wide uppercase mt-0.5">
                                                    {folder.templates_count} items
                                                </p>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:bg-slate-200/60 dark:hover:bg-zinc-700 h-7 w-7 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleContextMenu(e as any, 'folder', folder.id, folder.name);
                                                }}
                                            >
                                                <MoreVertical size={14} className="text-text-soft" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ))}

                            {/* Templates Next */}
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'template', id: template.id }));
                                    }}
                                    className={cn(
                                        'group border-border bg-card dark:bg-zinc-900/90 hover:bg-slate-50 dark:hover:bg-zinc-800/70 hover:border-slate-300 dark:hover:border-zinc-700 relative cursor-grab active:cursor-grabbing rounded-xl border transition-all duration-150 select-none shadow-2xs',
                                        viewMode === 'grid' ? 'flex flex-col p-4 items-start justify-between min-h-[120px]' : 'flex h-14 items-center gap-3 px-4 py-3',
                                        contextMenu.item?.id === template.id && contextMenu.isOpen ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/40' : '',
                                    )}
                                    onContextMenu={(e) => handleContextMenu(e, 'template', template.id, template.name)}
                                >
                                    {viewMode === 'grid' ? (
                                        <>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="bg-slate-100 dark:bg-zinc-800 text-text-main group-hover:bg-primary/10 group-hover:text-primary flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-all">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <a
                                                        href={route('admin.templates.download', template.id)}
                                                        className="text-primary text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Download
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-slate-200/60 dark:hover:bg-zinc-700 h-7 w-7 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleContextMenu(e as any, 'template', template.id, template.name);
                                                        }}
                                                    >
                                                        <MoreHorizontal size={14} className="text-text-soft" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-3 min-w-0 w-full">
                                                <h4 className="text-text-main truncate text-xs font-semibold leading-tight">{template.name}</h4>
                                                <p className="text-text-soft text-[10px] font-medium tracking-wide uppercase mt-1">
                                                    {template.file_type} • {formatSize(template.file_size)}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-slate-100 dark:bg-zinc-800 text-text-main group-hover:bg-primary/10 group-hover:text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border transition-all">
                                                <FileText size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-text-main truncate text-xs font-semibold leading-tight">{template.name}</h4>
                                                <p className="text-text-soft text-[10px] font-medium tracking-wide uppercase mt-0.5">
                                                    {template.file_type} • {formatSize(template.file_size)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <a
                                                    href={route('admin.templates.download', template.id)}
                                                    className="text-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Download
                                                </a>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-slate-200/60 dark:hover:bg-zinc-700 h-7 w-7 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleContextMenu(e as any, 'template', template.id, template.name);
                                                    }}
                                                >
                                                    <MoreHorizontal size={14} className="text-text-soft" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {filteredFolders.length === 0 && filteredTemplates.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-24 opacity-75 select-none">
                                    <div className="border-border bg-card dark:bg-zinc-900 mb-4 rounded-2xl border border-dashed p-6 shadow-2xs">
                                        <Folder className="text-text-soft h-12 w-12" strokeWidth={1.25} />
                                    </div>
                                    <p className="text-text-main text-xs font-bold tracking-wide uppercase">Repository Kosong</p>
                                    <p className="text-text-soft mt-1 text-[11px] font-normal italic">
                                        Klik kanan atau gunakan toolbar untuk menambahkan item
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </FloatingPanel>

                {/* Floating Right Sidebar for Filter on Templates Page */}
                <FloatingPanel padded shrink>
                    <SideFilterCard
                        categories={filterCategories}
                        activeFilters={{ file_type: fileTypeFilter ? [fileTypeFilter] : [] }}
                        onFilterChange={(keyOrObj, value) => {
                            if (typeof keyOrObj === 'string' && keyOrObj === 'file_type') {
                                const selectedArr = Array.isArray(value) ? value : [];
                                setFileTypeFilter(selectedArr.length > 0 ? selectedArr[0] : null);
                            }
                        }}
                        onReset={() => setFileTypeFilter(null)}
                        totalResults={filteredFolders.length + filteredTemplates.length}
                        defaultExpanded={false}
                    />
                </FloatingPanel>
            </MasterPageLayout>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="bg-card border-border overflow-hidden rounded-xl border p-8 shadow-2xl sm:max-w-[400px]">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30">
                            <AlertTriangle size={28} />
                        </div>
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-foreground mb-2 text-base font-normal tracking-tight">
                                Hapus {selectedItem?.type === 'folder' ? 'Folder' : 'Item'}?
                            </DialogTitle>
                            <DialogDescription className="text-text-main max-w-[280px] text-xs leading-relaxed font-normal">
                                Apakah Anda yakin ingin menghapus <span className="font-normal text-rose-500">"{selectedItem?.name}"</span>?
                                {selectedItem?.type === 'folder' && ' Semua isi di dalamnya akan terhapus permanen.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-8 grid w-full grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border bg-card hover:bg-muted h-11 rounded-xl text-xs font-normal"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-11 rounded-xl bg-rose-600 text-xs font-normal uppercase transition-all hover:bg-rose-700 active:scale-95"
                                onClick={handleDelete}
                            >
                                Hapus Sekarang
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Move Dialog */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="border-border bg-card overflow-hidden border p-0 shadow-2xl sm:max-w-[450px]">
                    <DialogHeader className="bg-muted/40 border-border border-b p-6">
                        <DialogTitle className="text-base font-normal">Pindahkan Asset</DialogTitle>
                        <DialogDescription className="text-text-main mt-1 text-xs font-normal">
                            Pilih folder tujuan untuk memindahkan <strong>{selectedItem?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <Label className="text-text-main mb-3 block text-xs font-normal tracking-wide">Folder Tujuan</Label>
                        <div className="border-border bg-muted/10 overflow-hidden rounded-xl border">
                            <div className="custom-scrollbar h-64 overflow-y-auto p-2">
                                <div
                                    className={cn(
                                        'mb-1 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-normal transition-all active:scale-[0.98]',
                                        targetFolderId === null
                                            ? 'bg-primary text-primary-foreground font-normal'
                                            : 'text-text-main hover:bg-muted hover:text-foreground',
                                    )}
                                    onClick={() => setTargetFolderId(null)}
                                >
                                    <Folder
                                        size={16}
                                        className={cn('transition-colors', targetFolderId === null ? 'fill-current' : 'text-text-main')}
                                    />
                                    Repository Root
                                </div>
                                {folders
                                    .filter((f) => f.id !== selectedItem?.id) // Prevent moving to self
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((folder) => (
                                        <div
                                            key={folder.id}
                                            className={cn(
                                                'mb-1 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-normal transition-all active:scale-[0.98]',
                                                targetFolderId === folder.id
                                                    ? 'bg-primary text-primary-foreground font-normal'
                                                    : 'text-text-main hover:bg-muted hover:text-foreground',
                                            )}
                                            onClick={() => setTargetFolderId(folder.id)}
                                        >
                                            <Folder
                                                size={16}
                                                className={cn(
                                                    'transition-colors',
                                                    targetFolderId === folder.id ? 'fill-current' : 'text-text-main',
                                                )}
                                            />
                                            {folder.name}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="border-border/10 gap-3 border-t px-6 pt-4 pb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted h-10 rounded-xl px-4 text-xs font-normal"
                            onClick={() => setIsMoveModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-6 text-xs font-normal shadow-sm transition-all active:scale-95"
                            onClick={handleMove}
                        >
                            Pindahkan Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="border-border bg-card overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
                    <DialogHeader className="bg-muted/40 border-border border-b p-6">
                        <DialogTitle className="text-base font-normal">Buat Folder</DialogTitle>
                        <DialogDescription className="text-text-main mt-1 text-xs font-normal">
                            Tambahkan folder baru untuk mengelompokkan template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <Label htmlFor="name" className="text-text-main mb-3 block text-xs font-normal tracking-wide">
                            Nama Folder
                        </Label>
                        <Input
                            id="name"
                            className="border-border bg-muted/20 focus-visible:ring-primary focus-visible:border-primary h-11 rounded-xl border text-sm font-normal shadow-sm transition-all focus-visible:ring-1"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Contoh: Perjanjian Kerja Sama"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="border-border/10 gap-3 border-t px-6 pt-4 pb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted h-10 rounded-xl px-4 text-xs font-normal"
                            onClick={() => setIsFolderModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-6 text-xs font-normal transition-all active:scale-95"
                            onClick={handleCreateFolder}
                        >
                            Simpan Folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Modal */}
            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent className="border-border bg-card overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
                    <DialogHeader className="bg-muted/40 border-border border-b p-6">
                        <DialogTitle className="text-base font-normal">Ubah Nama</DialogTitle>
                        <DialogDescription className="text-text-main mt-1 text-xs font-normal">
                            Ubah nama untuk "<strong>{selectedItem?.name}</strong>".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <Label htmlFor="rename-input" className="text-text-main mb-3 block text-xs font-normal tracking-wide">
                            Nama Baru
                        </Label>
                        <Input
                            id="rename-input"
                            className="border-border bg-muted/20 focus-visible:ring-primary focus-visible:border-primary h-11 rounded-xl border text-sm font-normal shadow-sm transition-all focus-visible:ring-1"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="border-border/10 gap-3 border-t px-6 pt-4 pb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted h-10 rounded-xl px-4 text-xs font-normal"
                            onClick={() => setIsRenameModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-6 text-xs font-normal transition-all active:scale-95"
                            onClick={handleRename}
                        >
                            Terapkan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="border-border bg-card overflow-hidden border p-0 shadow-2xl sm:max-w-[450px]">
                    <form onSubmit={handleUploadTemplate}>
                        <DialogHeader className="bg-muted/40 border-border border-b p-6">
                            <DialogTitle className="text-base font-normal">Unggah Asset</DialogTitle>
                            <DialogDescription className="text-text-main mt-1 text-xs font-normal">
                                Tambahkan file baru ke dalam repository.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 p-6">
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-name" className="text-text-main text-xs font-normal tracking-wide">
                                    Nama Tampilan
                                </Label>
                                <Input
                                    id="tpl-name"
                                    className="border-border bg-muted/20 focus-visible:ring-primary focus-visible:border-primary h-11 rounded-xl border text-xs font-normal shadow-sm transition-all focus-visible:ring-1"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    placeholder="Contoh: Kontrak Pihak Ketiga"
                                    required
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-desc" className="text-text-main text-xs font-normal tracking-wide">
                                    Deskripsi (Opsional)
                                </Label>
                                <Input
                                    id="tpl-desc"
                                    className="border-border bg-muted/20 focus-visible:ring-primary focus-visible:border-primary h-11 rounded-xl border text-xs font-normal shadow-sm transition-all focus-visible:ring-1"
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-file" className="text-text-main text-xs font-normal tracking-wide">
                                    File Sumber
                                </Label>
                                <div className="group/field border-border hover:border-primary hover:bg-primary/5 relative cursor-pointer rounded-2xl border border-dashed p-6 text-center shadow-inner transition-all">
                                    <Input
                                        id="tpl-file"
                                        type="file"
                                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                        required
                                    />
                                    <div className="space-y-2">
                                        <div className="bg-muted text-text-main group-hover/field:bg-primary/10 group-hover/field:text-primary mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition-all">
                                            <Upload size={18} />
                                        </div>
                                        <p className="text-foreground mx-auto max-w-[300px] truncate text-xs font-normal">
                                            {uploadData.file ? uploadData.file.name : 'Pilih atau Seret File di Sini'}
                                        </p>
                                        <p className="text-text-main text-[10px] font-normal tracking-wide uppercase">
                                            MAX 10MB • DOCX, PDF, XLSX
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="border-border/10 gap-3 border-t px-6 pt-4 pb-6">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="hover:bg-muted h-10 rounded-xl px-4 text-xs font-normal"
                                onClick={() => setIsUploadModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-6 text-xs font-normal transition-all active:scale-95"
                            >
                                Konfirmasi Unggah
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Custom Floating File Explorer Context Menu Popup */}
            {contextMenu.isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-transparent"
                        onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu((prev) => ({ ...prev, isOpen: false }));
                        }}
                    />
                    <div
                        style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                        className="fixed z-50 w-52 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {contextMenu.item?.type === 'background' ? (
                            <>
                                <div className="px-2 py-1 text-[10px] font-bold text-text-soft uppercase tracking-wider">
                                    File Explorer
                                </div>
                                <button
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                    onClick={() => {
                                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                                        setIsFolderModalOpen(true);
                                    }}
                                >
                                    <FolderPlus size={14} className="text-primary" /> Folder Baru
                                </button>
                                <button
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                    onClick={() => {
                                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                                        setIsUploadModalOpen(true);
                                    }}
                                >
                                    <Upload size={14} className="text-primary" /> Upload Asset
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="px-2 py-1 text-[10px] font-bold text-text-soft uppercase tracking-wider truncate">
                                    {contextMenu.item?.name}
                                </div>
                                <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                                {contextMenu.item?.type === 'folder' && (
                                    <button
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                        onClick={() => {
                                            if (contextMenu.item?.id) {
                                                setCurrentFolderId(contextMenu.item.id);
                                            }
                                            setContextMenu((prev) => ({ ...prev, isOpen: false }));
                                        }}
                                    >
                                        <Folder size={14} className="text-primary" /> Buka Folder
                                    </button>
                                )}
                                {contextMenu.item?.type === 'template' && (
                                    <a
                                        href={route('admin.templates.download', contextMenu.item.id)}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                        onClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                                    >
                                        <Upload size={14} className="text-primary rotate-180" /> Download
                                    </a>
                                )}
                                <button
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                    onClick={() => {
                                        if (contextMenu.item) {
                                            setSelectedItem(contextMenu.item);
                                            setNewFolderName(contextMenu.item.name);
                                            setIsRenameModalOpen(true);
                                        }
                                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                                    }}
                                >
                                    <FileText size={14} className="text-text-soft" /> Ubah Nama
                                </button>
                                <button
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                    onClick={() => {
                                        if (contextMenu.item) {
                                            setSelectedItem(contextMenu.item);
                                            setIsMoveModalOpen(true);
                                        }
                                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                                    }}
                                >
                                    <FolderPlus size={14} className="text-text-soft" /> Pindahkan
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                                <button
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    onClick={() => {
                                        if (contextMenu.item) {
                                            setSelectedItem(contextMenu.item);
                                            setIsDeleteModalOpen(true);
                                        }
                                        setContextMenu((prev) => ({ ...prev, isOpen: false }));
                                    }}
                                >
                                    <AlertTriangle size={14} /> Hapus
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </>
    );
}

function FolderTreeItem({ folder, allFolders, currentId, onSelect, expandedFolders, toggleFolder, isLast = false, onContextMenu, onMoveItem, onDirectFileUpload }: any) {
    const children = allFolders.filter((f: any) => f.parent_id === folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders[folder.id];
    const isSelected = currentId === folder.id;

    return (
        <div className="relative pl-4">
            {/* Vertical Guide Line shifted to left-2 */}
            <div className={cn(
                "absolute left-2 top-0 w-[1.5px] bg-slate-300 dark:bg-zinc-700",
                isLast ? "h-3.5" : "h-full"
            )} />

            {/* Horizontal branch connector line */}
            <div className="absolute left-2 top-3.5 w-2.5 h-[1.5px] bg-slate-300 dark:bg-zinc-700" />
            
            <div
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folder.id }));
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDirectFileUpload) {
                        Array.from(e.dataTransfer.files).forEach((file) => {
                            onDirectFileUpload(file, folder.id);
                        });
                        return;
                    }
                    const itemData = e.dataTransfer.getData('text/plain');
                    if (!itemData) return;
                    try {
                        const parsed = JSON.parse(itemData);
                        if (parsed.id && parsed.id !== folder.id && onMoveItem) {
                            onMoveItem(parsed.type, parsed.id, folder.id);
                        }
                    } catch (err) {}
                }}
                className={cn(
                    'group flex cursor-grab active:cursor-grabbing items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-all select-none leading-none my-0.5 border',
                    isSelected 
                        ? 'bg-slate-200/80 dark:bg-zinc-800 border-slate-300/80 dark:border-zinc-700 text-slate-950 dark:text-zinc-100 shadow-2xs font-extrabold' 
                        : 'border-transparent text-text-main hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-foreground font-medium',
                )}
                onClick={() => onSelect(folder.id)}
                onContextMenu={(e) => onContextMenu && onContextMenu(e, 'folder', folder.id, folder.name)}
            >
                <div
                    className={cn(
                        "p-0.5 rounded transition-colors",
                        isSelected ? "hover:bg-slate-300/50 dark:hover:bg-zinc-700/80 text-slate-950 dark:text-zinc-100" : "hover:bg-slate-200/70 dark:hover:bg-zinc-700/70 text-text-soft"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) toggleFolder(folder.id);
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown size={12} className={isSelected ? "text-slate-900 dark:text-zinc-100" : "text-text-soft"} />
                        ) : (
                            <ChevronRight size={12} className={isSelected ? "text-slate-900 dark:text-zinc-100" : "text-text-soft"} />
                        )
                    ) : (
                        <div className="w-[12px]" />
                    )}
                </div>
                <Folder
                    size={14}
                    className={cn(
                        'shrink-0 transition-colors',
                        isSelected ? 'text-primary fill-primary/20 font-bold' : 'text-text-soft group-hover:text-primary',
                    )}
                />
                <span className="truncate tracking-tight">
                    {folder.name}
                </span>
                {folder.templates_count > 0 && (
                    <span className={cn(
                        "ml-auto text-[9px] font-medium px-1 py-0.2 rounded transition-colors",
                        isSelected
                            ? "bg-slate-300/60 dark:bg-zinc-700 text-slate-950 dark:text-zinc-100 font-extrabold"
                            : "bg-slate-100 dark:bg-zinc-800/80 text-text-soft"
                    )}>
                        {folder.templates_count}
                    </span>
                )}
            </div>

            {isExpanded && hasChildren && (
                <div className="relative ml-2 pl-0.5 my-0.5">
                    {children
                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                        .map((child: any, idx: number) => (
                            <FolderTreeItem
                                key={child.id}
                                folder={child}
                                allFolders={allFolders}
                                currentId={currentId}
                                onSelect={onSelect}
                                expandedFolders={expandedFolders}
                                toggleFolder={toggleFolder}
                                isLast={idx === children.length - 1}
                                onContextMenu={onContextMenu}
                                onMoveItem={onMoveItem}
                                onDirectFileUpload={onDirectFileUpload}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}
