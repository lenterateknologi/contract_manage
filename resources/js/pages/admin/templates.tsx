import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    Download,
    Edit2,
    File,
    FileText,
    Folder,
    FolderPlus,
    MoreHorizontal,
    MoreVertical,
    MoveHorizontal,
    Search,
    Trash2,
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

    const closeContextMenu = () => {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
    };

    // Computed Data
    const currentFolder = useMemo(() => folders.find((f) => f.id === currentFolderId), [folders, currentFolderId]);

    const filteredFolders = useMemo(
        () => folders.filter((f) => f.parent_id === currentFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [folders, currentFolderId, searchQuery],
    );

    const filteredTemplates = useMemo(
        () => templates.filter((t) => t.template_folder_id === currentFolderId && t.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [templates, currentFolderId, searchQuery],
    );

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

            <div className="bg-background flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Context Menu Hub */}
                <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 1000 }}>
                    <DropdownMenu open={contextMenu.isOpen} onOpenChange={closeContextMenu}>
                        <DropdownMenuTrigger asChild>
                            <div className="pointer-events-none h-1 w-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 shadow-xl">
                            {contextMenu.item?.type === 'background' ? (
                                <>
                                    <DropdownMenuItem onClick={() => setIsFolderModalOpen(true)}>
                                        <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload Template
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            if (!contextMenu.item) return;
                                            setSelectedItem(contextMenu.item);
                                            setNewFolderName(contextMenu.item.name);
                                            setIsRenameModalOpen(true);
                                        }}
                                    >
                                        <Edit2 className="mr-2 h-4 w-4" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            if (!contextMenu.item) return;
                                            setSelectedItem(contextMenu.item);
                                            setIsMoveModalOpen(true);
                                        }}
                                    >
                                        <MoveHorizontal className="mr-2 h-4 w-4" /> Move To...
                                    </DropdownMenuItem>
                                    {contextMenu.item?.type === 'template' && (
                                        <DropdownMenuItem asChild>
                                            <a href={route('admin.templates.download', contextMenu.item?.id)}>
                                                <Download className="mr-2 h-4 w-4" /> Download
                                            </a>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => {
                                            if (!contextMenu.item) return;
                                            setSelectedItem(contextMenu.item);
                                            setIsDeleteModalOpen(true);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Fixed Sidebar for Tree Navigation */}
                <div className="border-border bg-muted/10 w-64 shrink-0 overflow-y-auto border-r p-4 select-none">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Struktur Folder</h3>
                        <Button variant="ghost" size="icon" className="text-muted-foreground h-4 w-4" onClick={() => setIsFolderModalOpen(true)}>
                            <FolderPlus size={12} />
                        </Button>
                    </div>
                    <div className="space-y-0.5">
                        <div
                            className={cn(
                                'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                                currentFolderId === null ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
                            )}
                            onClick={() => setCurrentFolderId(null)}
                        >
                            <Folder
                                size={14}
                                className={
                                    currentFolderId === null ? 'fill-primary/20 text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                }
                            />
                            Root
                        </div>
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

                {/* Main Content Area */}
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* Toolbar */}
                    <div className="border-border bg-card flex h-14 shrink-0 items-center justify-between gap-4 border-b px-6">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => setCurrentFolderId(currentFolder?.parent_id || null)}
                                disabled={currentFolderId === null}
                            >
                                <ArrowLeft size={16} />
                            </Button>

                            <nav className="flex items-center overflow-hidden text-sm font-medium whitespace-nowrap">
                                <span
                                    className="hover:text-primary shrink-0 cursor-pointer transition-colors"
                                    onClick={() => setCurrentFolderId(null)}
                                >
                                    Templates
                                </span>
                                {folderPath.map((f, i) => (
                                    <React.Fragment key={f.id}>
                                        <ChevronRight size={14} className="text-muted-foreground/60 mx-1 shrink-0" />
                                        <span
                                            className={cn(
                                                'hover:text-primary cursor-pointer truncate transition-colors',
                                                i === folderPath.length - 1 ? 'text-primary' : 'text-foreground/80',
                                            )}
                                            onClick={() => setCurrentFolderId(f.id)}
                                        >
                                            {f.name}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative hidden w-40 md:block lg:w-48">
                                <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                                <Input
                                    type="search"
                                    placeholder="Cari..."
                                    className="bg-muted/30 focus-visible:ring-primary/20 h-8 border-none pl-8 text-xs ring-0 focus-visible:ring-1"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Button size="sm" variant="outline" className="h-8 gap-1.5 px-2 font-medium" onClick={() => setIsFolderModalOpen(true)}>
                                <FolderPlus size={14} />
                                <span className="hidden text-[11px] lg:inline">Folder</span>
                            </Button>

                            <Button
                                size="sm"
                                className="shadow-primary/20 h-8 gap-1.5 px-3 font-medium shadow-sm"
                                onClick={() => setIsUploadModalOpen(true)}
                            >
                                <Upload size={14} />
                                <span className="hidden text-[11px] lg:inline">Upload</span>
                            </Button>
                        </div>
                    </div>

                    {/* File List / Grid - Right Click Enabled Background */}
                    <div
                        className="bg-muted/5 relative flex-1 overflow-y-auto p-6"
                        onContextMenu={(e) => handleContextMenu(e, 'background', currentFolderId || 'root', 'Background')}
                    >
                        <div className="grid auto-rows-max grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {/* Folders First */}
                            {filteredFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className={cn(
                                        'group bg-card hover:border-primary/50 relative flex h-20 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all select-none hover:-translate-y-0.5 hover:shadow-xl',
                                        contextMenu.item?.id === folder.id && contextMenu.isOpen
                                            ? 'border-primary ring-primary/20 shadow-md ring-1'
                                            : '',
                                    )}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-500 shadow-sm">
                                        <Folder size={20} fill="currentColor" fillOpacity={0.1} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-foreground/90 truncate text-xs leading-tight font-bold tracking-tight">{folder.name}</h4>
                                        <p className="text-muted-foreground/60 text-[10px] font-medium">{folder.templates_count} items</p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e as any, 'folder', folder.id, folder.name);
                                        }}
                                    >
                                        <MoreVertical size={12} />
                                    </Button>
                                </div>
                            ))}

                            {/* Templates Next */}
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className={cn(
                                        'group bg-card hover:border-primary/50 relative cursor-default overflow-hidden rounded-xl border transition-all select-none hover:-translate-y-0.5 hover:shadow-xl',
                                        contextMenu.item?.id === template.id && contextMenu.isOpen
                                            ? 'border-primary ring-primary/20 shadow-md ring-1'
                                            : '',
                                    )}
                                    onContextMenu={(e) => handleContextMenu(e, 'template', template.id, template.name)}
                                >
                                    <div className="border-muted/50 flex items-center gap-3 border-b p-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-500 shadow-sm">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-xs leading-tight font-bold tracking-tight">{template.name}</h4>
                                            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase opacity-60">
                                                {template.file_type} • {formatSize(template.file_size)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleContextMenu(e as any, 'template', template.id, template.name);
                                            }}
                                        >
                                            <MoreHorizontal size={12} />
                                        </Button>
                                    </div>
                                    <div className="bg-muted/20 flex items-center justify-between px-3 py-1.5">
                                        <span className="text-muted-foreground/60 max-w-[80px] truncate text-[9px] font-medium">
                                            By {template.creator?.name || 'Admin'}
                                        </span>
                                        <a
                                            href={route('admin.templates.download', template.id)}
                                            className="text-primary hover:text-primary/80 text-[9px] font-black tracking-tighter transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            UNDUH
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {filteredFolders.length === 0 && filteredTemplates.length === 0 && (
                                <div className="text-muted-foreground border-muted col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-20 opacity-60 select-none">
                                    <Folder className="mb-3 h-10 w-10 opacity-10" />
                                    <p className="text-xs font-medium italic">Klik kanan di sini atau tekan 'Upload' untuk menambahkan konten</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="bg-destructive/10 text-destructive flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                                <AlertTriangle size={20} />
                            </div>
                            <DialogTitle className="text-base font-bold">Hapus {selectedItem?.type === 'folder' ? 'Folder' : 'Item'}</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs">
                            Apakah Anda yakin ingin menghapus <strong>"{selectedItem?.name}"</strong>?
                            {selectedItem?.type === 'folder' && ' Semua isi di dalam folder ini juga akan terhapus secara permanen.'}
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={() => setIsDeleteModalOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" size="sm" className="shadow-destructive/20 text-xs font-bold shadow-md" onClick={handleDelete}>
                            Hapus Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Move Dialog */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Pindahkan {selectedItem?.name}</DialogTitle>
                        <DialogDescription className="text-xs">Pilih folder tujuan untuk memindahkan item ini.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label className="text-muted-foreground mb-2 block px-1 text-[10px] font-bold tracking-widest uppercase">
                            Pilih Folder Tujuan
                        </Label>
                        <div className="bg-muted/10 overflow-hidden rounded-xl border">
                            <div className="h-60 overflow-y-auto p-2">
                                <div
                                    className={cn(
                                        'mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs',
                                        targetFolderId === null
                                            ? 'bg-primary text-primary-foreground shadow-primary/20 font-bold shadow-md'
                                            : 'hover:bg-muted font-medium transition-colors',
                                    )}
                                    onClick={() => setTargetFolderId(null)}
                                >
                                    <Folder size={14} className={targetFolderId === null ? 'fill-white/20' : 'text-muted-foreground'} />
                                    Root
                                </div>
                                {folders
                                    .filter((f) => f.id !== selectedItem?.id) // Prevent moving to self
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((folder) => (
                                        <div
                                            key={folder.id}
                                            className={cn(
                                                'mb-1 ml-2 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs',
                                                targetFolderId === folder.id
                                                    ? 'bg-primary text-primary-foreground shadow-primary/20 font-bold shadow-md'
                                                    : 'hover:bg-muted hover:border-muted-foreground/10 border border-transparent font-medium transition-colors',
                                            )}
                                            onClick={() => setTargetFolderId(folder.id)}
                                        >
                                            <Folder size={14} className={targetFolderId === folder.id ? 'fill-white/20' : 'text-muted-foreground'} />
                                            {folder.name}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={() => setIsMoveModalOpen(false)}>
                            Batal
                        </Button>
                        <Button size="sm" className="text-xs font-bold" onClick={handleMove}>
                            Pindahkan Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Creation Modal */}
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Buat Folder Baru</DialogTitle>
                        <DialogDescription className="text-xs">Masukkan nama folder untuk mengelompokkan template.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="name" className="text-muted-foreground mb-1.5 block px-1 text-[10px] font-bold tracking-widest uppercase">
                            Nama Folder
                        </Label>
                        <Input
                            id="name"
                            className="bg-muted/20 placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 h-10 rounded-xl border-none text-sm font-medium ring-0 focus-visible:ring-1"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="e.g. Perjanjian Kerja Sama"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={() => setIsFolderModalOpen(false)}>
                            Batal
                        </Button>
                        <Button size="sm" className="text-xs font-bold" onClick={handleCreateFolder}>
                            Simpan Folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Modal */}
            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Ganti Nama</DialogTitle>
                        <DialogDescription className="text-xs">Ubah nama untuk "{selectedItem?.name}".</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label
                            htmlFor="rename-input"
                            className="text-muted-foreground mb-1.5 block px-1 text-[10px] font-bold tracking-widest uppercase"
                        >
                            Nama Baru
                        </Label>
                        <Input
                            id="rename-input"
                            className="bg-muted/20 focus-visible:ring-primary/30 h-10 rounded-xl border-none text-sm font-medium ring-0 focus-visible:ring-1"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={() => setIsRenameModalOpen(false)}>
                            Batal
                        </Button>
                        <Button size="sm" className="text-xs font-bold" onClick={handleRename}>
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <form onSubmit={handleUploadTemplate}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">Upload Template</DialogTitle>
                            <DialogDescription className="text-xs">Tambahkan file baru ke dalam folder ini.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-1">
                                <Label htmlFor="tpl-name" className="text-muted-foreground px-1 text-[10px] font-bold tracking-widest uppercase">
                                    Nama Tampilan
                                </Label>
                                <Input
                                    id="tpl-name"
                                    className="bg-muted/20 placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 h-10 rounded-xl border-none text-sm font-medium ring-0 focus-visible:ring-1"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    placeholder="e.g. Kontrak Pihak Ketiga"
                                    required
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="tpl-desc" className="text-muted-foreground px-1 text-[10px] font-bold tracking-widest uppercase">
                                    Deskripsi (Opsional)
                                </Label>
                                <Input
                                    id="tpl-desc"
                                    className="bg-muted/20 placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 h-10 rounded-xl border-none text-sm font-medium ring-0 focus-visible:ring-1"
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="tpl-file" className="text-muted-foreground px-1 text-[10px] font-bold tracking-widest uppercase">
                                    Pilih File
                                </Label>
                                <div className="group/field border-muted-foreground/10 hover:border-primary/20 hover:bg-primary/5 relative cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all">
                                    <Input
                                        id="tpl-file"
                                        type="file"
                                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                        required
                                    />
                                    <div className="space-y-1">
                                        <Upload
                                            size={18}
                                            className="text-muted-foreground group-hover/field:text-primary mx-auto transition-colors"
                                        />
                                        <p className="group-hover/field:text-primary text-foreground/80 text-[10px] font-bold transition-colors">
                                            {uploadData.file ? uploadData.file.name : 'Klik atau seret file ke sini'}
                                        </p>
                                        <p className="text-muted-foreground/60 text-[9px] tracking-tighter uppercase">
                                            MAX 10MB • .DOCX, .PDF, .XLSX
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs font-semibold"
                                onClick={() => setIsUploadModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" size="sm" className="shadow-primary/20 text-xs font-bold shadow-md">
                                Mulai Unggah
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
