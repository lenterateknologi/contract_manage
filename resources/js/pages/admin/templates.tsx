import { Button } from '@/components/ui/base/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/overlays/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    File,
    FileText,
    Filter,
    Folder,
    FolderPlus,
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
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

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

    // Get unique file types from all templates for the filter dropdown
    const availableFileTypes = useMemo(() => {
        const types = new Set<string>();
        templates.forEach((t) => {
            if (t.file_type) types.add(t.file_type);
        });
        return Array.from(types).sort();
    }, [templates]);

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

    const handleMove = () => {
        if (!selectedItem) return;

        const url =
            selectedItem.type === 'folder' ? route('admin.templates.folders.move', selectedItem.id) : route('admin.templates.move', selectedItem.id);

        const data = selectedItem.type === 'folder' ? { parent_id: targetFolderId } : { template_folder_id: targetFolderId };

        router.patch(url, data, {
            onSuccess: () => {
                setIsMoveModalOpen(false);
                setSelectedItem(null);
                setTargetFolderId(null);
            },
        });
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

            <div className="font-inter flex h-[calc(100vh-64px)] overflow-hidden bg-white antialiased dark:bg-black">
                {/* Fixed Sidebar for Tree Navigation */}
                <div className="flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-black/[0.05] bg-black/[0.02] p-6 select-none dark:border-white/[0.05] dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between px-1">
                        <div className="space-y-1">
                            <h3 className="text-[11px] leading-none font-black tracking-[0.2em] text-black uppercase dark:text-white">
                                Struktur Folder
                            </h3>
                            <p className="text-[9px] font-bold tracking-widest text-black/30 uppercase dark:text-white/30">Hierarchy Explorer</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl bg-black text-white shadow-lg shadow-black/10 transition-all active:scale-95 dark:bg-white dark:text-black dark:shadow-white/5"
                            onClick={() => setIsFolderModalOpen(true)}
                        >
                            <Plus size={14} />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        <div
                            className={cn(
                                'group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-[11px] transition-all active:scale-[0.98]',
                                currentFolderId === null
                                    ? 'bg-black font-black text-white shadow-xl shadow-black/10 dark:bg-white dark:text-black dark:shadow-white/5'
                                    : 'font-bold tracking-tight text-black/40 uppercase hover:bg-black/[0.03] dark:text-white/40 dark:hover:bg-white/[0.03]',
                            )}
                            onClick={() => setCurrentFolderId(null)}
                        >
                            <Folder
                                size={14}
                                className={cn('transition-colors', currentFolderId === null ? 'fill-current' : 'text-black/20 dark:text-white/20')}
                            />
                            Repository Root
                        </div>
                        <div className="mt-4 space-y-1">
                            {folders
                                .filter((f) => !f.parent_id)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((folder) => (
                                    <FolderTreeItem
                                        key={folder.id}
                                        folder={folder}
                                        allFolders={folders}
                                        currentId={currentFolderId}
                                        onSelect={setCurrentFolderId}
                                        expandedFolders={expandedFolders}
                                        toggleFolder={toggleFolder}
                                    />
                                ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-black">
                    {/* Toolbar */}
                    <div className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-6 border-b border-black/[0.05] bg-white px-8 dark:border-white/[0.05] dark:bg-black">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-xl border border-black/[0.05] bg-black/[0.02] shadow-sm transition-all hover:bg-black hover:text-white active:scale-95 dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:bg-white dark:hover:text-black"
                                onClick={() => setCurrentFolderId(currentFolder?.parent_id || null)}
                                disabled={currentFolderId === null}
                            >
                                <ArrowLeft size={16} />
                            </Button>

                            <nav className="flex items-center overflow-hidden text-[11px] font-black tracking-widest whitespace-nowrap uppercase">
                                <span
                                    className="cursor-pointer text-black/30 transition-colors hover:text-black dark:text-white/30 dark:hover:text-white"
                                    onClick={() => setCurrentFolderId(null)}
                                >
                                    Assets
                                </span>
                                {folderPath.map((f, i) => (
                                    <React.Fragment key={f.id}>
                                        <ChevronRight size={14} className="mx-2 shrink-0 text-black/10 dark:text-white/10" />
                                        <span
                                            className={cn(
                                                'max-w-[150px] cursor-pointer truncate transition-colors',
                                                i === folderPath.length - 1
                                                    ? 'text-black dark:text-white'
                                                    : 'text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white',
                                            )}
                                            onClick={() => setCurrentFolderId(f.id)}
                                        >
                                            {f.name}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative hidden w-56 md:block">
                                <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                <Input
                                    type="search"
                                    placeholder="Cari item..."
                                    className="h-10 rounded-xl border-black/[0.08] bg-black/[0.03] pl-10 text-[11px] font-bold tracking-tight uppercase shadow-sm transition-all focus:border-black focus-visible:ring-0 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Filter Button */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            'h-10 gap-2 rounded-xl border-black/[0.1] px-4 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all active:scale-95 dark:border-white/[0.1]',
                                            fileTypeFilter && 'border-[var(--primary)] bg-[var(--primary)] text-white',
                                        )}
                                    >
                                        <Filter size={14} />
                                        <span className="hidden lg:inline">Filter</span>
                                        {fileTypeFilter && (
                                            <span
                                                className={cn(
                                                    'flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[9px] font-bold',
                                                    fileTypeFilter ? 'bg-white text-[var(--primary)]' : 'bg-[var(--primary)] text-white',
                                                )}
                                            >
                                                1
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="font-inter w-48">
                                    <DropdownMenuItem
                                        onClick={() => setFileTypeFilter(null)}
                                        className={cn(
                                            'text-[11px] font-bold uppercase',
                                            fileTypeFilter === null ? 'bg-black/[0.05] dark:bg-white/[0.05]' : '',
                                        )}
                                    >
                                        Semua Tipe File
                                    </DropdownMenuItem>
                                    {availableFileTypes.map((type) => (
                                        <DropdownMenuItem
                                            key={type}
                                            onClick={() => setFileTypeFilter(type)}
                                            className={cn(
                                                'text-[11px] font-bold uppercase',
                                                fileTypeFilter === type ? 'bg-black/[0.05] dark:bg-white/[0.05]' : '',
                                            )}
                                        >
                                            {type}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                size="sm"
                                variant="outline"
                                className="h-10 gap-2 rounded-xl border-black/[0.1] px-5 text-[10px] font-black tracking-[0.15em] uppercase shadow-sm transition-all hover:bg-black/[0.02] active:scale-95 dark:border-white/[0.1] dark:hover:bg-white/[0.02]"
                                onClick={() => setIsFolderModalOpen(true)}
                            >
                                <FolderPlus size={14} />
                                <span className="hidden lg:inline">New Folder</span>
                            </Button>

                            <Button
                                size="sm"
                                className="h-10 gap-2 rounded-xl border-none bg-black px-6 text-[10px] font-black tracking-[0.15em] text-white uppercase shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-95 dark:bg-white dark:text-black dark:shadow-white/5"
                                onClick={() => setIsUploadModalOpen(true)}
                            >
                                <Upload size={14} />
                                <span className="hidden lg:inline">Upload Asset</span>
                            </Button>
                        </div>
                    </div>

                    {/* File List / Grid - Right Click Enabled Background */}
                    <div
                        className="custom-scrollbar flex-1 overflow-y-auto bg-black/[0.01] p-8 dark:bg-white/[0.01]"
                        onContextMenu={(e) => handleContextMenu(e, 'background', currentFolderId || 'root', 'Background')}
                    >
                        <div className="grid auto-rows-max grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {/* Folders First */}
                            {filteredFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className={cn(
                                        'group relative flex h-24 cursor-pointer items-center gap-4 rounded-xl border border-black/[0.05] bg-white p-5 transition-all select-none hover:-translate-y-1 hover:border-black hover:shadow-2xl dark:border-white/[0.05] dark:bg-black/20 dark:hover:border-white',
                                        contextMenu.item?.id === folder.id && contextMenu.isOpen
                                            ? 'border-black shadow-2xl ring-black/5 dark:border-white dark:ring-white/5'
                                            : 'shadow-sm',
                                    )}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/[0.05] bg-black/[0.03] text-black/40 shadow-sm transition-all group-hover:bg-black group-hover:text-white dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white/40 dark:group-hover:bg-white dark:group-hover:text-black">
                                        <Folder size={22} fill="currentColor" fillOpacity={0.1} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="mb-1.5 truncate text-[13px] leading-none font-black tracking-tight text-black uppercase dark:text-white">
                                            {folder.name}
                                        </h4>
                                        <p className="text-[9px] leading-none font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
                                            {folder.templates_count} items
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e as any, 'folder', folder.id, folder.name);
                                        }}
                                    >
                                        <MoreVertical size={14} className="text-black/30 dark:text-white/30" />
                                    </Button>
                                </div>
                            ))}

                            {/* Templates Next */}
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className={cn(
                                        'group relative cursor-default overflow-hidden rounded-xl border border-black/[0.05] bg-white shadow-sm transition-all select-none hover:-translate-y-1 hover:border-black hover:shadow-2xl dark:border-white/[0.05] dark:bg-black/20 dark:hover:border-white',
                                        contextMenu.item?.id === template.id && contextMenu.isOpen
                                            ? 'border-black shadow-2xl ring-black/5 dark:border-white dark:ring-white/5'
                                            : '',
                                    )}
                                    onContextMenu={(e) => handleContextMenu(e, 'template', template.id, template.name)}
                                >
                                    <div className="flex items-center gap-4 p-5">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/[0.05] bg-black/[0.03] text-black/40 shadow-sm transition-all group-hover:bg-black group-hover:text-white dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white/40 dark:group-hover:bg-white dark:group-hover:text-black">
                                            <FileText size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="mb-1.5 truncate text-[13px] leading-none font-black tracking-tight text-black uppercase dark:text-white">
                                                {template.name}
                                            </h4>
                                            <p className="text-[9px] leading-none font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
                                                {template.file_type} • {formatSize(template.file_size)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleContextMenu(e as any, 'template', template.id, template.name);
                                            }}
                                        >
                                            <MoreHorizontal size={14} className="text-black/30 dark:text-white/30" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-black/[0.05] bg-black/[0.02] px-5 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
                                        <span className="max-w-[100px] truncate text-[9px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                                            By {template.creator?.name || 'System'}
                                        </span>
                                        <a
                                            href={route('admin.templates.download', template.id)}
                                            className="text-[9px] font-black tracking-[0.2em] text-black uppercase transition-all hover:opacity-70 dark:text-white"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {filteredFolders.length === 0 && filteredTemplates.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-30 select-none">
                                    <div className="mb-8 rounded-3xl border border-dashed border-black/[0.1] bg-black/[0.02] p-8 dark:border-white/[0.1] dark:bg-white/[0.02]">
                                        <Folder className="h-16 w-16 text-black/20 dark:text-white/20" strokeWidth={1} />
                                    </div>
                                    <p className="text-[11px] font-black tracking-[0.4em] text-black/40 uppercase dark:text-white/40">
                                        Repository is Empty
                                    </p>
                                    <p className="mt-4 text-[9px] font-bold tracking-widest text-black/20 uppercase italic dark:text-white/20">
                                        Right-click or use toolbar to initialize assets
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="overflow-hidden rounded-xl border-none bg-white p-8 shadow-2xl sm:max-w-[400px] dark:bg-black">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-inner dark:bg-red-950/20">
                            <AlertTriangle size={28} />
                        </div>
                        <DialogHeader className="p-0">
                            <DialogTitle className="mb-2 text-[16px] font-black tracking-tight text-black uppercase dark:text-white">
                                Delete {selectedItem?.type === 'folder' ? 'Folder' : 'Item'}?
                            </DialogTitle>
                            <DialogDescription className="max-w-[280px] text-[11px] leading-relaxed font-bold tracking-widest text-black/50 uppercase antialiased dark:text-white/50">
                                Apakah Anda yakin ingin menghapus <span className="font-black text-red-500">"{selectedItem?.name}"</span>?
                                {selectedItem?.type === 'folder' && ' Semua isi di dalamnya akan terhapus permanen.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-8 grid w-full grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-11 rounded-xl border-black/[0.08] text-[10px] font-black text-black/40 uppercase hover:bg-black/[0.02] dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.02]"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-11 rounded-xl bg-red-500 text-[10px] font-black uppercase shadow-xl shadow-red-500/20 transition-all hover:bg-red-600 active:scale-95"
                                onClick={handleDelete}
                            >
                                Delete Now
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Move Dialog */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl sm:max-w-[450px] dark:bg-black">
                    <DialogHeader className="bg-black p-8 text-white dark:bg-white dark:text-black">
                        <DialogTitle className="mb-1 text-[14px] font-black tracking-[0.2em] uppercase">Transfer Asset</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold tracking-widest text-white/50 uppercase antialiased dark:text-black/50">
                            Pilih folder tujuan untuk memindahkan <strong>{selectedItem?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                        <Label className="mb-3 block px-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40">
                            Destination Directory
                        </Label>
                        <div className="overflow-hidden rounded-xl border border-black/[0.05] bg-black/[0.02] dark:border-white/[0.05] dark:bg-white/[0.02]">
                            <div className="custom-scrollbar h-64 overflow-y-auto p-2">
                                <div
                                    className={cn(
                                        'mb-1 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold tracking-tight uppercase transition-all active:scale-[0.98]',
                                        targetFolderId === null
                                            ? 'bg-black text-white shadow-lg dark:bg-white dark:text-black'
                                            : 'text-black/40 hover:bg-black/[0.03] dark:text-white/40 dark:hover:bg-white/[0.03]',
                                    )}
                                    onClick={() => setTargetFolderId(null)}
                                >
                                    <Folder
                                        size={14}
                                        className={cn(
                                            'transition-colors',
                                            targetFolderId === null ? 'fill-current' : 'text-black/20 dark:text-white/20',
                                        )}
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
                                                'mb-1 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold tracking-tight uppercase transition-all active:scale-[0.98]',
                                                targetFolderId === folder.id
                                                    ? 'bg-black text-white shadow-lg dark:bg-white dark:text-black'
                                                    : 'text-black/40 hover:bg-black/[0.03] dark:text-white/40 dark:hover:bg-white/[0.03]',
                                            )}
                                            onClick={() => setTargetFolderId(folder.id)}
                                        >
                                            <Folder
                                                size={14}
                                                className={cn(
                                                    'transition-colors',
                                                    targetFolderId === folder.id ? 'fill-current' : 'text-black/20 dark:text-white/20',
                                                )}
                                            />
                                            {folder.name}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 px-8 pb-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 rounded-xl px-6 text-[10px] font-black text-black/40 uppercase hover:bg-black/[0.05] dark:text-white/40 dark:hover:bg-white/[0.05]"
                            onClick={() => setIsMoveModalOpen(false)}
                        >
                            Discard
                        </Button>
                        <Button
                            size="sm"
                            className="h-10 rounded-xl bg-black px-10 text-[10px] font-black text-white uppercase shadow-xl shadow-black/20 transition-all active:scale-95 dark:bg-white dark:text-black dark:shadow-white/10"
                            onClick={handleMove}
                        >
                            Confirm Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Creation Modal */}
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl sm:max-w-[420px] dark:bg-black">
                    <DialogHeader className="bg-black p-8 text-white dark:bg-white dark:text-black">
                        <DialogTitle className="mb-1 text-[14px] font-black tracking-[0.2em] uppercase">Create Directory</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold tracking-widest text-white/50 uppercase antialiased dark:text-black/50">
                            Initialize a new folder for template grouping.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                        <Label
                            htmlFor="name"
                            className="mb-3 block px-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40"
                        >
                            Directory Identifier
                        </Label>
                        <Input
                            id="name"
                            className="h-12 rounded-xl border-black/[0.08] bg-black/[0.03] text-sm font-bold shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="e.g. Perjanjian Kerja Sama"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-3 px-8 pb-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 rounded-xl px-6 text-[10px] font-black text-black/40 uppercase hover:bg-black/[0.05] dark:text-white/40 dark:hover:bg-white/[0.05]"
                            onClick={() => setIsFolderModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-10 rounded-xl bg-black px-10 text-[10px] font-black text-white uppercase shadow-xl shadow-black/20 transition-all active:scale-95 dark:bg-white dark:text-black dark:shadow-white/10"
                            onClick={handleCreateFolder}
                        >
                            Save Folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Modal */}
            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent className="overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl sm:max-w-[420px] dark:bg-black">
                    <DialogHeader className="bg-black p-8 text-white dark:bg-white dark:text-black">
                        <DialogTitle className="mb-1 text-[14px] font-black tracking-[0.2em] uppercase">Modify Identifier</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold tracking-widest text-white/50 uppercase antialiased dark:text-black/50">
                            Ubah nama untuk "<strong>{selectedItem?.name}</strong>".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                        <Label
                            htmlFor="rename-input"
                            className="mb-3 block px-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40"
                        >
                            New Identifier Name
                        </Label>
                        <Input
                            id="rename-input"
                            className="h-12 rounded-xl border-black/[0.08] bg-black/[0.03] text-sm font-bold shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-3 px-8 pb-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 rounded-xl px-6 text-[10px] font-black text-black/40 uppercase hover:bg-black/[0.05] dark:text-white/40 dark:hover:bg-white/[0.05]"
                            onClick={() => setIsRenameModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-10 rounded-xl bg-black px-10 text-[10px] font-black text-white uppercase shadow-xl shadow-black/20 transition-all active:scale-95 dark:bg-white dark:text-black dark:shadow-white/10"
                            onClick={handleRename}
                        >
                            Apply Change
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl sm:max-w-[450px] dark:bg-black">
                    <form onSubmit={handleUploadTemplate}>
                        <DialogHeader className="bg-black p-8 text-white dark:bg-white dark:text-black">
                            <DialogTitle className="mb-1 text-[14px] font-black tracking-[0.2em] uppercase">Asset Intake</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold tracking-widest text-white/50 uppercase antialiased dark:text-black/50">
                                Tambahkan file baru ke dalam repository.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5 p-8">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="tpl-name"
                                    className="px-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40"
                                >
                                    Display Name
                                </Label>
                                <Input
                                    id="tpl-name"
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] text-xs font-bold shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    placeholder="e.g. Kontrak Pihak Ketiga"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="tpl-desc"
                                    className="px-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40"
                                >
                                    Narrative (Optional)
                                </Label>
                                <Input
                                    id="tpl-desc"
                                    className="h-11 rounded-xl border-black/[0.08] bg-black/[0.03] text-xs font-bold shadow-sm transition-all focus:border-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-white"
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="tpl-file"
                                    className="px-1 text-[10px] font-black tracking-widest text-black/40 uppercase dark:text-white/40"
                                >
                                    Source File
                                </Label>
                                <div className="group/field relative cursor-pointer rounded-2xl border-2 border-dashed border-black/[0.1] p-6 text-center shadow-inner transition-all hover:border-black hover:bg-black/[0.02] dark:border-white/[0.1] dark:hover:border-white dark:hover:bg-white/[0.02]">
                                    <Input
                                        id="tpl-file"
                                        type="file"
                                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                        required
                                    />
                                    <div className="space-y-2">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.03] shadow-sm transition-all group-hover/field:bg-black group-hover/field:text-white dark:bg-white/[0.03] dark:group-hover/field:bg-white dark:group-hover/field:text-black">
                                            <Upload size={20} />
                                        </div>
                                        <p className="mx-auto max-w-[300px] truncate text-[11px] font-black tracking-tight text-black uppercase dark:text-white">
                                            {uploadData.file ? uploadData.file.name : 'Select or Drop File'}
                                        </p>
                                        <p className="text-[9px] font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
                                            MAX 10MB • DOCX, PDF, XLSX
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-3 px-8 pb-8">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-10 rounded-xl px-6 text-[10px] font-black text-black/40 uppercase hover:bg-black/[0.05] dark:text-white/40 dark:hover:bg-white/[0.05]"
                                onClick={() => setIsUploadModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="h-10 rounded-xl bg-black px-10 text-[10px] font-black text-white uppercase shadow-xl shadow-black/20 transition-all active:scale-95 dark:bg-white dark:text-black dark:shadow-white/10"
                            >
                                Confirm Intake
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function FolderTreeItem({ folder, allFolders, currentId, onSelect, expandedFolders, toggleFolder }: any) {
    const children = allFolders.filter((f: any) => f.parent_id === folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders[folder.id];
    const isSelected = currentId === folder.id;

    return (
        <div className="ml-1.5">
            <div
                className={cn(
                    'group flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 transition-all',
                    isSelected ? 'bg-primary/10 border-primary border-l-2' : 'hover:bg-muted',
                )}
                onClick={() => onSelect(folder.id)}
            >
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFolder(folder.id);
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown size={12} className="text-muted-foreground/60" />
                        ) : (
                            <ChevronRight size={12} className="text-muted-foreground/60" />
                        )
                    ) : (
                        <div className="w-[12px]" />
                    )}
                </div>
                <Folder
                    size={14}
                    className={cn(
                        'shrink-0 transition-colors',
                        isSelected ? 'text-primary fill-primary/10' : 'text-muted-foreground/40 group-hover:text-muted-foreground',
                    )}
                />
                <span
                    className={cn('truncate text-[11px] tracking-tight', isSelected ? 'text-primary font-bold' : 'text-muted-foreground font-medium')}
                >
                    {folder.name}
                </span>
            </div>

            {isExpanded && hasChildren && (
                <div className="border-muted-foreground/10 mt-0.5 ml-2 space-y-0.5 border-l pl-1">
                    {children
                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                        .map((child: any) => (
                            <FolderTreeItem
                                key={child.id}
                                folder={child}
                                allFolders={allFolders}
                                currentId={currentId}
                                onSelect={onSelect}
                                expandedFolders={expandedFolders}
                                toggleFolder={toggleFolder}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}
