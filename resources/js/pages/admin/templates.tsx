import { Button } from '@/components/ui/base/Button';
import { Input } from '@/components/ui/base/Input';
import { Label } from '@/components/ui/base/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/overlays/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/overlays/DropdownMenu';
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

            <div className="bg-background flex h-[calc(100vh-64px)] overflow-hidden antialiased">
                {/* Fixed Sidebar for Tree Navigation */}
                <div className="border-border bg-card/40 flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r p-6 select-none">
                    <div className="flex items-center justify-between px-1">
                        <div className="space-y-1">
                            <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">Struktur Folder</h3>
                            <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">Hierarchy Explorer</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 rounded-xl shadow-sm transition-all active:scale-95"
                            onClick={() => setIsFolderModalOpen(true)}
                        >
                            <Plus size={14} />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        <div
                            className={cn(
                                'group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm transition-all active:scale-[0.98]',
                                currentFolderId === null
                                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium tracking-tight',
                            )}
                            onClick={() => setCurrentFolderId(null)}
                        >
                            <Folder
                                size={16}
                                className={cn('transition-colors', currentFolderId === null ? 'fill-current' : 'text-muted-foreground/60')}
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
                <div className="bg-background flex min-w-0 flex-1 flex-col">
                    {/* Toolbar */}
                    <div className="border-border bg-background sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-6 border-b px-8">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-border bg-card hover:bg-muted hover:text-foreground h-10 w-10 shrink-0 rounded-xl border shadow-sm disabled:opacity-50"
                                onClick={() => setCurrentFolderId(currentFolder?.parent_id || null)}
                                disabled={currentFolderId === null}
                            >
                                <ArrowLeft size={16} />
                            </Button>

                            <nav className="flex items-center overflow-hidden text-xs font-semibold tracking-wide whitespace-nowrap">
                                <span
                                    className="text-muted-foreground/80 hover:text-foreground cursor-pointer uppercase transition-colors"
                                    onClick={() => setCurrentFolderId(null)}
                                >
                                    Assets
                                </span>
                                {folderPath.map((f, i) => (
                                    <React.Fragment key={f.id}>
                                        <ChevronRight size={14} className="text-muted-foreground/40 mx-2 shrink-0" />
                                        <span
                                            className={cn(
                                                'max-w-[150px] cursor-pointer truncate uppercase transition-colors',
                                                i === folderPath.length - 1
                                                    ? 'text-foreground font-bold'
                                                    : 'text-muted-foreground/80 hover:text-foreground font-semibold',
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
                                <Search className="text-muted-foreground/60 absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2" />
                                <Input
                                    type="search"
                                    placeholder="Cari item..."
                                    className="border-border bg-card focus-visible:ring-primary focus-visible:border-primary h-10 rounded-xl border pl-10 text-xs font-medium transition-all focus-visible:ring-1"
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
                                            'border-border hover:bg-muted h-10 gap-2 rounded-xl border px-4 text-xs font-semibold active:scale-95',
                                            fileTypeFilter &&
                                                'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-none',
                                        )}
                                    >
                                        <Filter size={14} />
                                        <span className="hidden lg:inline">Filter</span>
                                        {fileTypeFilter && (
                                            <span className="bg-background text-foreground flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[10px] font-bold">
                                                1
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                        onClick={() => setFileTypeFilter(null)}
                                        className={cn('cursor-pointer text-xs font-medium', fileTypeFilter === null ? 'bg-muted' : '')}
                                    >
                                        Semua Tipe File
                                    </DropdownMenuItem>
                                    {availableFileTypes.map((type) => (
                                        <DropdownMenuItem
                                            key={type}
                                            onClick={() => setFileTypeFilter(type)}
                                            className={cn('cursor-pointer text-xs font-medium', fileTypeFilter === type ? 'bg-muted' : '')}
                                        >
                                            {type}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                size="sm"
                                variant="outline"
                                className="border-border bg-card hover:bg-muted h-10 gap-2 rounded-xl border px-4 text-xs font-bold transition-all active:scale-95"
                                onClick={() => setIsFolderModalOpen(true)}
                            >
                                <FolderPlus size={14} />
                                <span className="hidden lg:inline">New Folder</span>
                            </Button>

                            <Button
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 gap-2 rounded-xl px-4 text-xs font-bold shadow-sm transition-all active:scale-95"
                                onClick={() => setIsUploadModalOpen(true)}
                            >
                                <Upload size={14} />
                                <span className="hidden lg:inline">Upload Asset</span>
                            </Button>
                        </div>
                    </div>

                    {/* File List / Grid - Right Click Enabled Background */}
                    <div
                        className="custom-scrollbar bg-muted/20 flex-1 overflow-y-auto p-8"
                        onContextMenu={(e) => handleContextMenu(e, 'background', currentFolderId || 'root', 'Background')}
                    >
                        <div className="grid auto-rows-max grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {/* Folders First */}
                            {filteredFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className={cn(
                                        'group border-border bg-card hover:border-border/80 relative flex h-24 cursor-pointer items-center gap-4 rounded-xl border p-5 transition-all select-none hover:-translate-y-0.5 hover:shadow-md',
                                        contextMenu.item?.id === folder.id && contextMenu.isOpen ? 'border-primary ring-primary ring-1' : 'shadow-sm',
                                    )}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                                >
                                    <div className="border-border bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all">
                                        <Folder size={20} fill="currentColor" fillOpacity={0.1} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-foreground mb-1 truncate text-sm font-bold">{folder.name}</h4>
                                        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                            {folder.templates_count} items
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-muted h-8 w-8 shrink-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e as any, 'folder', folder.id, folder.name);
                                        }}
                                    >
                                        <MoreVertical size={14} className="text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}

                            {/* Templates Next */}
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className={cn(
                                        'group border-border bg-card hover:border-border/80 relative cursor-default overflow-hidden rounded-xl border shadow-sm transition-all select-none hover:-translate-y-0.5 hover:shadow-md',
                                        contextMenu.item?.id === template.id && contextMenu.isOpen ? 'border-primary ring-primary ring-1' : '',
                                    )}
                                    onContextMenu={(e) => handleContextMenu(e, 'template', template.id, template.name)}
                                >
                                    <div className="flex items-center gap-4 p-5">
                                        <div className="border-border bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-foreground mb-1 truncate text-sm font-bold">{template.name}</h4>
                                            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                                {template.file_type} • {formatSize(template.file_size)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-muted h-8 w-8 shrink-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleContextMenu(e as any, 'template', template.id, template.name);
                                            }}
                                        >
                                            <MoreHorizontal size={14} className="text-muted-foreground" />
                                        </Button>
                                    </div>
                                    <div className="border-border bg-muted/30 flex items-center justify-between border-t px-5 py-3">
                                        <span className="text-muted-foreground/80 max-w-[100px] truncate text-xs font-medium">
                                            Oleh {template.creator?.name || 'System'}
                                        </span>
                                        <a
                                            href={route('admin.templates.download', template.id)}
                                            className="text-primary text-xs font-bold transition-all hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {filteredFolders.length === 0 && filteredTemplates.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-70 select-none">
                                    <div className="border-border bg-muted/30 mb-6 rounded-3xl border border-dashed p-8">
                                        <Folder className="text-muted-foreground/30 h-16 w-16" strokeWidth={1} />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-bold tracking-wide uppercase">Repository Kosong</p>
                                    <p className="text-muted-foreground/60 mt-2 text-xs font-medium tracking-normal italic">
                                        Klik kanan atau gunakan toolbar untuk menambahkan item
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="bg-card border-border overflow-hidden rounded-xl border p-8 shadow-2xl sm:max-w-[400px]">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30">
                            <AlertTriangle size={28} />
                        </div>
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-foreground mb-2 text-base font-bold tracking-tight">
                                Hapus {selectedItem?.type === 'folder' ? 'Folder' : 'Item'}?
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground max-w-[280px] text-xs leading-relaxed font-medium">
                                Apakah Anda yakin ingin menghapus <span className="font-bold text-rose-500">"{selectedItem?.name}"</span>?
                                {selectedItem?.type === 'folder' && ' Semua isi di dalamnya akan terhapus permanen.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-8 grid w-full grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border bg-card hover:bg-muted h-11 rounded-xl text-xs font-bold"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-11 rounded-xl bg-rose-600 text-xs font-bold uppercase transition-all hover:bg-rose-700 active:scale-95"
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
                        <DialogTitle className="text-base font-bold">Pindahkan Asset</DialogTitle>
                        <DialogDescription className="text-muted-foreground/80 mt-1 text-xs font-medium">
                            Pilih folder tujuan untuk memindahkan <strong>{selectedItem?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <Label className="text-muted-foreground mb-3 block text-xs font-bold tracking-wide">Folder Tujuan</Label>
                        <div className="border-border bg-muted/10 overflow-hidden rounded-xl border">
                            <div className="custom-scrollbar h-64 overflow-y-auto p-2">
                                <div
                                    className={cn(
                                        'mb-1 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]',
                                        targetFolderId === null
                                            ? 'bg-primary text-primary-foreground font-semibold'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                    onClick={() => setTargetFolderId(null)}
                                >
                                    <Folder
                                        size={16}
                                        className={cn('transition-colors', targetFolderId === null ? 'fill-current' : 'text-muted-foreground/60')}
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
                                                'mb-1 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]',
                                                targetFolderId === folder.id
                                                    ? 'bg-primary text-primary-foreground font-semibold'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                            )}
                                            onClick={() => setTargetFolderId(folder.id)}
                                        >
                                            <Folder
                                                size={16}
                                                className={cn(
                                                    'transition-colors',
                                                    targetFolderId === folder.id ? 'fill-current' : 'text-muted-foreground/60',
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
                            className="hover:bg-muted h-10 rounded-xl px-4 text-xs font-bold"
                            onClick={() => setIsMoveModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-6 text-xs font-bold shadow-sm transition-all active:scale-95"
                            onClick={handleMove}
                        >
                            Pindahkan Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Creation Modal */}
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="border-border bg-card overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
                    <DialogHeader className="bg-muted/40 border-border border-b p-6">
                        <DialogTitle className="text-base font-bold">Buat Folder</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1 text-xs font-medium">
                            Tambahkan folder baru untuk mengelompokkan template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <Label htmlFor="name" className="text-muted-foreground mb-3 block text-xs font-bold tracking-wide">
                            Nama Folder
                        </Label>
                        <Input
                            id="name"
                            className="border-border bg-muted/20 focus-visible:ring-primary focus-visible:border-primary h-11 rounded-xl border text-sm font-medium shadow-sm transition-all focus-visible:ring-1"
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
                            className="hover:bg-muted h-10 rounded-xl px-4 text-xs font-bold"
                            onClick={() => setIsFolderModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-6 text-xs font-bold transition-all active:scale-95"
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
                        <DialogTitle className="text-base font-bold">Ubah Nama</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1 text-xs font-medium">
                            Ubah nama untuk "<strong>{selectedItem?.name}</strong>".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <Label htmlFor="rename-input" className="text-muted-foreground mb-3 block text-xs font-bold tracking-wide">
                            Nama Baru
                        </Label>
                        <Input
                            id="rename-input"
                            className="border-border bg-muted/20 focus-visible:ring-primary focus-visible:border-primary h-11 rounded-xl border text-sm font-medium shadow-sm transition-all focus-visible:ring-1"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="border-border/10 gap-3 border-t px-6 pt-4 pb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted h-10 rounded-xl px-4 text-xs font-bold"
                            onClick={() => setIsRenameModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-6 text-xs font-bold transition-all active:scale-95"
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
                            <DialogTitle className="text-base font-bold">Unggah Asset</DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1 text-xs font-medium">
                                Tambahkan file baru ke dalam repository.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 p-6">
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-name" className="text-muted-foreground text-xs font-bold tracking-wide">
                                    Nama Tampilan
                                </Label>
                                <Input
                                    id="tpl-name"
                                    className="border-border bg-muted/20 focus-visible:ring-primary focus-visible:border-primary h-11 rounded-xl border text-xs font-medium shadow-sm transition-all focus-visible:ring-1"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    placeholder="Contoh: Kontrak Pihak Ketiga"
                                    required
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-desc" className="text-muted-foreground text-xs font-bold tracking-wide">
                                    Deskripsi (Opsional)
                                </Label>
                                <Input
                                    id="tpl-desc"
                                    className="border-border bg-muted/20 focus-visible:ring-primary focus-visible:border-primary h-11 rounded-xl border text-xs font-medium shadow-sm transition-all focus-visible:ring-1"
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-file" className="text-muted-foreground text-xs font-bold tracking-wide">
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
                                        <div className="bg-muted text-muted-foreground group-hover/field:bg-primary/10 group-hover/field:text-primary mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition-all">
                                            <Upload size={18} />
                                        </div>
                                        <p className="text-foreground mx-auto max-w-[300px] truncate text-xs font-bold">
                                            {uploadData.file ? uploadData.file.name : 'Pilih atau Seret File di Sini'}
                                        </p>
                                        <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
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
                                className="hover:bg-muted h-10 rounded-xl px-4 text-xs font-bold"
                                onClick={() => setIsUploadModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-6 text-xs font-bold transition-all active:scale-95"
                            >
                                Konfirmasi Unggah
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
                    'group flex cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs transition-all select-none',
                    isSelected ? 'bg-primary/10 border-primary border-l-2' : 'hover:bg-muted/60',
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
                            <ChevronDown size={14} className="text-muted-foreground/60" />
                        ) : (
                            <ChevronRight size={14} className="text-muted-foreground/60" />
                        )
                    ) : (
                        <div className="w-[14px]" />
                    )}
                </div>
                <Folder
                    size={16}
                    className={cn(
                        'shrink-0 transition-colors',
                        isSelected ? 'text-primary fill-primary/10' : 'text-muted-foreground/40 group-hover:text-muted-foreground',
                    )}
                />
                <span className={cn('truncate text-xs tracking-tight', isSelected ? 'text-primary font-bold' : 'text-muted-foreground font-medium')}>
                    {folder.name}
                </span>
            </div>

            {isExpanded && hasChildren && (
                <div className="border-border mt-0.5 ml-2.5 space-y-0.5 border-l pl-1">
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
