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
    Filter,
    Folder,
    FolderPlus,
    MoreHorizontal,
    MoreVertical,
    MoveHorizontal,
    Plus,
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
        () => templates.filter((t) => 
            t.template_folder_id === currentFolderId && 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (fileTypeFilter ? t.file_type === fileTypeFilter : true)
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

            <div className="bg-white dark:bg-black flex h-[calc(100vh-64px)] overflow-hidden antialiased font-inter">
                {/* Fixed Sidebar for Tree Navigation */}
                <div className="border-r border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02] w-72 shrink-0 overflow-y-auto p-6 select-none flex flex-col gap-6">
                    <div className="flex items-center justify-between px-1">
                        <div className="space-y-1">
                            <h3 className="text-black dark:text-white text-[11px] font-black tracking-[0.2em] uppercase leading-none">Struktur Folder</h3>
                            <p className="text-black/30 dark:text-white/30 text-[9px] font-bold uppercase tracking-widest">Hierarchy Explorer</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/5 active:scale-95 transition-all" onClick={() => setIsFolderModalOpen(true)}>
                            <Plus size={14} />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        <div
                            className={cn(
                                'group flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[11px] transition-all border border-transparent active:scale-[0.98]',
                                currentFolderId === null 
                                    ? 'bg-black dark:bg-white text-white dark:text-black font-black shadow-xl shadow-black/10 dark:shadow-white/5' 
                                    : 'text-black/40 dark:text-white/40 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] font-bold uppercase tracking-tight'
                            )}
                            onClick={() => setCurrentFolderId(null)}
                        >
                            <Folder
                                size={14}
                                className={cn(
                                    "transition-colors",
                                    currentFolderId === null ? 'fill-current' : 'text-black/20 dark:text-white/20'
                                )}
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
                    <div className="border-b border-black/[0.05] dark:border-white/[0.05] bg-white dark:bg-black flex h-20 shrink-0 items-center justify-between gap-6 px-8 sticky top-0 z-20">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all active:scale-95 shadow-sm"
                                onClick={() => setCurrentFolderId(currentFolder?.parent_id || null)}
                                disabled={currentFolderId === null}
                            >
                                <ArrowLeft size={16} />
                            </Button>

                            <nav className="flex items-center overflow-hidden text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                                <span
                                    className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                                    onClick={() => setCurrentFolderId(null)}
                                >
                                    Assets
                                </span>
                                {folderPath.map((f, i) => (
                                    <React.Fragment key={f.id}>
                                        <ChevronRight size={14} className="text-black/10 dark:text-white/10 mx-2 shrink-0" />
                                        <span
                                            className={cn(
                                                'cursor-pointer truncate transition-colors max-w-[150px]',
                                                i === folderPath.length - 1 ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white',
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
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/30 dark:text-white/30" />
                                <Input
                                    type="search"
                                    placeholder="Cari item..."
                                    className="h-10 border-black/[0.08] dark:border-white/[0.08] focus:border-black dark:focus:border-white rounded-xl bg-black/[0.03] dark:bg-white/[0.03] pl-10 text-[11px] font-bold uppercase tracking-tight focus-visible:ring-0 transition-all shadow-sm"
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
                                            "h-10 gap-2 px-4 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest border-black/[0.1] dark:border-white/[0.1] rounded-xl shadow-sm",
                                            fileTypeFilter && "bg-[var(--primary)] text-white border-[var(--primary)]"
                                        )}
                                    >
                                        <Filter size={14} />
                                        <span className="hidden lg:inline">Filter</span>
                                        {fileTypeFilter && (
                                            <span className={cn(
                                                "flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[9px] font-bold",
                                                fileTypeFilter ? "bg-white text-[var(--primary)]" : "bg-[var(--primary)] text-white"
                                            )}>
                                                1
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 font-inter">
                                    <DropdownMenuItem
                                        onClick={() => setFileTypeFilter(null)}
                                        className={cn("text-[11px] font-bold uppercase", fileTypeFilter === null ? "bg-black/[0.05] dark:bg-white/[0.05]" : "")}
                                    >
                                        Semua Tipe File
                                    </DropdownMenuItem>
                                    {availableFileTypes.map((type) => (
                                        <DropdownMenuItem
                                            key={type}
                                            onClick={() => setFileTypeFilter(type)}
                                            className={cn("text-[11px] font-bold uppercase", fileTypeFilter === type ? "bg-black/[0.05] dark:bg-white/[0.05]" : "")}
                                        >
                                            {type}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button size="sm" variant="outline" className="h-10 gap-2 px-5 rounded-xl border-black/[0.1] dark:border-white/[0.1] text-[10px] font-black uppercase tracking-[0.15em] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:scale-95 transition-all shadow-sm" onClick={() => setIsFolderModalOpen(true)}>
                                <FolderPlus size={14} />
                                <span className="hidden lg:inline">New Folder</span>
                            </Button>

                            <Button
                                size="sm"
                                className="h-10 gap-2 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-[0.15em] hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-black/10 dark:shadow-white/5 border-none"
                                onClick={() => setIsUploadModalOpen(true)}
                            >
                                <Upload size={14} />
                                <span className="hidden lg:inline">Upload Asset</span>
                            </Button>
                        </div>
                    </div>

                    {/* File List / Grid - Right Click Enabled Background */}
                    <div
                        className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/[0.01] dark:bg-white/[0.01]"
                        onContextMenu={(e) => handleContextMenu(e, 'background', currentFolderId || 'root', 'Background')}
                    >
                        <div className="grid auto-rows-max grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {/* Folders First */}
                            {filteredFolders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className={cn(
                                        'group bg-white dark:bg-black/20 hover:border-black dark:hover:border-white relative flex h-24 cursor-pointer items-center gap-4 rounded-xl border border-black/[0.05] dark:border-white/[0.05] p-5 transition-all select-none hover:shadow-2xl hover:-translate-y-1',
                                        contextMenu.item?.id === folder.id && contextMenu.isOpen
                                            ? 'border-black dark:border-white ring-black/5 dark:ring-white/5 shadow-2xl'
                                            : 'shadow-sm',
                                    )}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] text-black/40 dark:text-white/40 shadow-sm group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                                        <Folder size={22} fill="currentColor" fillOpacity={0.1} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-black dark:text-white truncate text-[13px] font-black uppercase tracking-tight leading-none mb-1.5">{folder.name}</h4>
                                        <p className="text-black/30 dark:text-white/30 text-[9px] font-bold uppercase tracking-widest leading-none">{folder.templates_count} items</p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-opacity"
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
                                        'group bg-white dark:bg-black/20 hover:border-black dark:hover:border-white relative cursor-default overflow-hidden rounded-xl border border-black/[0.05] dark:border-white/[0.05] transition-all select-none hover:shadow-2xl hover:-translate-y-1 shadow-sm',
                                        contextMenu.item?.id === template.id && contextMenu.isOpen
                                            ? 'border-black dark:border-white ring-black/5 dark:ring-white/5 shadow-2xl'
                                            : '',
                                    )}
                                    onContextMenu={(e) => handleContextMenu(e, 'template', template.id, template.name)}
                                >
                                    <div className="flex items-center gap-4 p-5">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] text-black/40 dark:text-white/40 shadow-sm group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                                            <FileText size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-black dark:text-white truncate text-[13px] font-black uppercase tracking-tight leading-none mb-1.5">{template.name}</h4>
                                            <p className="text-black/30 dark:text-white/30 text-[9px] font-bold uppercase tracking-widest leading-none">
                                                {template.file_type} • {formatSize(template.file_size)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleContextMenu(e as any, 'template', template.id, template.name);
                                            }}
                                        >
                                            <MoreHorizontal size={14} className="text-black/30 dark:text-white/30" />
                                        </Button>
                                    </div>
                                    <div className="bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between px-5 py-3">
                                        <span className="text-black/40 dark:text-white/40 max-w-[100px] truncate text-[9px] font-bold uppercase tracking-widest">
                                            By {template.creator?.name || 'System'}
                                        </span>
                                        <a
                                            href={route('admin.templates.download', template.id)}
                                            className="text-black dark:text-white hover:opacity-70 text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {filteredFolders.length === 0 && filteredTemplates.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-30 select-none">
                                    <div className="p-8 rounded-3xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/[0.1] dark:border-white/[0.1] mb-8">
                                        <Folder className="h-16 w-16 text-black/20 dark:text-white/20" strokeWidth={1} />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-black/40 dark:text-white/40">Repository is Empty</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-black/20 dark:text-white/20 mt-4 italic">Right-click or use toolbar to initialize assets</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px] p-8 rounded-xl border-none shadow-2xl bg-white dark:bg-black overflow-hidden">
                    <div className="flex flex-col items-center text-center">
                        <div className="h-14 w-14 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                            <AlertTriangle size={28} />
                        </div>
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-[16px] font-black uppercase tracking-tight text-black dark:text-white mb-2">Delete {selectedItem?.type === 'folder' ? 'Folder' : 'Item'}?</DialogTitle>
                            <DialogDescription className="text-black/50 dark:text-white/50 text-[11px] font-bold uppercase tracking-widest leading-relaxed antialiased max-w-[280px]">
                                Apakah Anda yakin ingin menghapus <span className="text-red-500 font-black">"{selectedItem?.name}"</span>?
                                {selectedItem?.type === 'folder' && ' Semua isi di dalamnya akan terhapus permanen.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 w-full gap-3 mt-8">
                            <Button variant="outline" size="sm" className="rounded-xl h-11 font-black uppercase text-[10px] border-black/[0.08] dark:border-white/[0.08] text-black/40 dark:text-white/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                            <Button variant="destructive" size="sm" className="rounded-xl h-11 font-black uppercase text-[10px] bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-95 transition-all" onClick={handleDelete}>Delete Now</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Move Dialog */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white dark:bg-black">
                    <DialogHeader className="bg-black dark:bg-white p-8 text-white dark:text-black">
                        <DialogTitle className="text-[14px] font-black uppercase tracking-[0.2em] mb-1">Transfer Asset</DialogTitle>
                        <DialogDescription className="text-white/50 dark:text-black/50 text-[10px] font-bold uppercase tracking-widest antialiased">Pilih folder tujuan untuk memindahkan <strong>{selectedItem?.name}</strong>.</DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                        <Label className="text-black/40 dark:text-white/40 mb-3 block px-1 text-[10px] font-black tracking-widest uppercase">
                            Destination Directory
                        </Label>
                        <div className="bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden rounded-xl border border-black/[0.05] dark:border-white/[0.05]">
                            <div className="h-64 overflow-y-auto p-2 custom-scrollbar">
                                <div
                                    className={cn(
                                        'mb-1 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-tight transition-all active:scale-[0.98]',
                                        targetFolderId === null
                                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                            : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03] text-black/40 dark:text-white/40',
                                    )}
                                    onClick={() => setTargetFolderId(null)}
                                >
                                    <Folder size={14} className={cn("transition-colors", targetFolderId === null ? 'fill-current' : 'text-black/20 dark:text-white/20')} />
                                    Repository Root
                                </div>
                                {folders
                                    .filter((f) => f.id !== selectedItem?.id) // Prevent moving to self
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((folder) => (
                                        <div
                                            key={folder.id}
                                            className={cn(
                                                'mb-1 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-tight transition-all active:scale-[0.98]',
                                                targetFolderId === folder.id
                                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03] text-black/40 dark:text-white/40',
                                            )}
                                            onClick={() => setTargetFolderId(folder.id)}
                                        >
                                            <Folder size={14} className={cn("transition-colors", targetFolderId === folder.id ? 'fill-current' : 'text-black/20 dark:text-white/20')} />
                                            {folder.name}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-8 pb-8 gap-3">
                        <Button variant="ghost" size="sm" className="px-6 rounded-xl font-black uppercase text-[10px] h-10 text-black/40 dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]" onClick={() => setIsMoveModalOpen(false)}>
                            Discard
                        </Button>
                        <Button size="sm" className="px-10 rounded-xl font-black uppercase text-[10px] h-10 bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/20 dark:shadow-white/10 active:scale-95 transition-all" onClick={handleMove}>
                            Confirm Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Creation Modal */}
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white dark:bg-black">
                    <DialogHeader className="bg-black dark:bg-white p-8 text-white dark:text-black">
                        <DialogTitle className="text-[14px] font-black uppercase tracking-[0.2em] mb-1">Create Directory</DialogTitle>
                        <DialogDescription className="text-white/50 dark:text-black/50 text-[10px] font-bold uppercase tracking-widest antialiased">Initialize a new folder for template grouping.</DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                        <Label htmlFor="name" className="text-black/40 dark:text-white/40 mb-3 block px-1 text-[10px] font-black tracking-widest uppercase">
                            Directory Identifier
                        </Label>
                        <Input
                            id="name"
                            className="h-12 bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.08] rounded-xl font-bold text-sm focus:border-black dark:focus:border-white transition-all shadow-sm"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="e.g. Perjanjian Kerja Sama"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="px-8 pb-8 gap-3">
                        <Button variant="ghost" size="sm" className="px-6 rounded-xl font-black uppercase text-[10px] h-10 text-black/40 dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]" onClick={() => setIsFolderModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" className="px-10 rounded-xl font-black uppercase text-[10px] h-10 bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/20 dark:shadow-white/10 active:scale-95 transition-all" onClick={handleCreateFolder}>
                            Save Folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Modal */}
            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white dark:bg-black">
                    <DialogHeader className="bg-black dark:bg-white p-8 text-white dark:text-black">
                        <DialogTitle className="text-[14px] font-black uppercase tracking-[0.2em] mb-1">Modify Identifier</DialogTitle>
                        <DialogDescription className="text-white/50 dark:text-black/50 text-[10px] font-bold uppercase tracking-widest antialiased">Ubah nama untuk "<strong>{selectedItem?.name}</strong>".</DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                        <Label
                            htmlFor="rename-input"
                            className="text-black/40 dark:text-white/40 mb-3 block px-1 text-[10px] font-black tracking-widest uppercase"
                        >
                            New Identifier Name
                        </Label>
                        <Input
                            id="rename-input"
                            className="h-12 bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.08] rounded-xl font-bold text-sm focus:border-black dark:focus:border-white transition-all shadow-sm"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="px-8 pb-8 gap-3">
                        <Button variant="ghost" size="sm" className="px-6 rounded-xl font-black uppercase text-[10px] h-10 text-black/40 dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]" onClick={() => setIsRenameModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" className="px-10 rounded-xl font-black uppercase text-[10px] h-10 bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/20 dark:shadow-white/10 active:scale-95 transition-all" onClick={handleRename}>
                            Apply Change
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white dark:bg-black">
                    <form onSubmit={handleUploadTemplate}>
                        <DialogHeader className="bg-black dark:bg-white p-8 text-white dark:text-black">
                            <DialogTitle className="text-[14px] font-black uppercase tracking-[0.2em] mb-1">Asset Intake</DialogTitle>
                            <DialogDescription className="text-white/50 dark:text-black/50 text-[10px] font-bold uppercase tracking-widest antialiased">Tambahkan file baru ke dalam repository.</DialogDescription>
                        </DialogHeader>
                        <div className="p-8 space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="tpl-name" className="text-black/40 dark:text-white/40 px-1 text-[10px] font-black tracking-widest uppercase">
                                    Display Name
                                </Label>
                                <Input
                                    id="tpl-name"
                                    className="h-11 bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.08] rounded-xl font-bold text-xs focus:border-black dark:focus:border-white transition-all shadow-sm"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    placeholder="e.g. Kontrak Pihak Ketiga"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tpl-desc" className="text-black/40 dark:text-white/40 px-1 text-[10px] font-black tracking-widest uppercase">
                                    Narrative (Optional)
                                </Label>
                                <Input
                                    id="tpl-desc"
                                    className="h-11 bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.08] rounded-xl font-bold text-xs focus:border-black dark:focus:border-white transition-all shadow-sm"
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tpl-file" className="text-black/40 dark:text-white/40 px-1 text-[10px] font-black tracking-widest uppercase">
                                    Source File
                                </Label>
                                <div className="group/field border-black/[0.1] dark:border-white/[0.1] hover:border-black dark:hover:border-white hover:bg-black/[0.02] dark:hover:bg-white/[0.02] relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all shadow-inner">
                                    <Input
                                        id="tpl-file"
                                        type="file"
                                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                        required
                                    />
                                    <div className="space-y-2">
                                        <div className="h-12 w-12 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl flex items-center justify-center mx-auto group-hover/field:bg-black dark:group-hover/field:bg-white group-hover/field:text-white dark:group-hover/field:text-black transition-all shadow-sm">
                                            <Upload size={20} />
                                        </div>
                                        <p className="text-black dark:text-white text-[11px] font-black uppercase tracking-tight truncate max-w-[300px] mx-auto">
                                            {uploadData.file ? uploadData.file.name : 'Select or Drop File'}
                                        </p>
                                        <p className="text-black/30 dark:text-white/30 text-[9px] font-bold uppercase tracking-widest">
                                            MAX 10MB • DOCX, PDF, XLSX
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="px-8 pb-8 gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="px-6 rounded-xl font-black uppercase text-[10px] h-10 text-black/40 dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                                onClick={() => setIsUploadModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" className="px-10 rounded-xl font-black uppercase text-[10px] h-10 bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/20 dark:shadow-white/10 active:scale-95 transition-all">
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
