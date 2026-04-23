import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Folder, 
    File, 
    MoreVertical, 
    Upload, 
    FolderPlus, 
    Download, 
    Trash2, 
    ChevronRight, 
    ChevronDown, 
    Search,
    FileText,
    MoreHorizontal,
    ArrowLeft,
    Edit2,
    MoveHorizontal,
    ExternalLink,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

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
    const [selectedItem, setSelectedItem] = useState<{ type: 'folder' | 'template' | 'background', id: string, name: string } | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [uploadData, setUploadData] = useState({ name: '', description: '', file: null as File | null });
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        isOpen: boolean;
        item: { type: 'folder' | 'template' | 'background', id: string, name: string } | null;
    }>({ x: 0, y: 0, isOpen: false, item: null });

    const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'template' | 'background', id: string, name: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            isOpen: true,
            item: { type, id, name }
        });
    };

    const closeContextMenu = () => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    // Computed Data
    const currentFolder = useMemo(() => folders.find(f => f.id === currentFolderId), [folders, currentFolderId]);
    
    const filteredFolders = useMemo(() => 
        folders.filter(f => f.parent_id === currentFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [folders, currentFolderId, searchQuery]
    );

    const filteredTemplates = useMemo(() => 
        templates.filter(t => t.template_folder_id === currentFolderId && t.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [templates, currentFolderId, searchQuery]
    );

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreateFolder = () => {
        if (!newFolderName) return;
        router.post(route('admin.templates.folders.store'), {
            name: newFolderName,
            parent_id: currentFolderId
        }, {
            onSuccess: () => {
                setNewFolderName('');
                setIsFolderModalOpen(false);
            }
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
            }
        });
    };

    const handleDelete = () => {
        if (!selectedItem) return;
        
        const url = selectedItem.type === 'folder' 
            ? route('admin.templates.folders.destroy', selectedItem.id)
            : route('admin.templates.destroy', selectedItem.id);
            
        router.delete(url, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedItem(null);
            }
        });
    };

    const handleRename = () => {
        if (!selectedItem || !newFolderName) return;
        
        const url = selectedItem.type === 'folder'
            ? route('admin.templates.folders.update', selectedItem.id)
            : route('admin.templates.update', selectedItem.id);
            
        router.put(url, { name: newFolderName }, {
            onSuccess: () => {
                setNewFolderName('');
                setIsRenameModalOpen(false);
                setSelectedItem(null);
            }
        });
    };

    const handleMove = () => {
        if (!selectedItem) return;
        
        const url = selectedItem.type === 'folder'
            ? route('admin.templates.folders.move', selectedItem.id)
            : route('admin.templates.move', selectedItem.id);
            
        const data = selectedItem.type === 'folder'
            ? { parent_id: targetFolderId }
            : { template_folder_id: targetFolderId };

        router.patch(url, data, {
            onSuccess: () => {
                setIsMoveModalOpen(false);
                setSelectedItem(null);
                setTargetFolderId(null);
            }
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
            const f = folders.find(folder => folder.id === currId);
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
            
            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
                {/* Context Menu Hub */}
                <div 
                    style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 1000 }}
                >
                    <DropdownMenu open={contextMenu.isOpen} onOpenChange={closeContextMenu}>
                        <DropdownMenuTrigger asChild>
                           <div className="w-1 h-1 pointer-events-none" />
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
                                    <DropdownMenuItem onClick={() => {
                                        if (!contextMenu.item) return;
                                        setSelectedItem(contextMenu.item);
                                        setNewFolderName(contextMenu.item.name);
                                        setIsRenameModalOpen(true);
                                    }}>
                                        <Edit2 className="mr-2 h-4 w-4" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        if (!contextMenu.item) return;
                                        setSelectedItem(contextMenu.item);
                                        setIsMoveModalOpen(true);
                                    }}>
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
                 <div className="w-64 border-r border-border bg-muted/10 p-4 overflow-y-auto shrink-0 select-none">
                     <div className="flex items-center justify-between mb-4 px-2">
                          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Struktur Folder</h3>
                          <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground" onClick={() => setIsFolderModalOpen(true)}>
                             <FolderPlus size={12} />
                          </Button>
                     </div>
                    <div className="space-y-0.5">
                        <div 
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors group",
                                currentFolderId === null ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                            )}
                            onClick={() => setCurrentFolderId(null)}
                        >
                            <Folder size={14} className={currentFolderId === null ? "fill-primary/20 text-primary" : "text-muted-foreground group-hover:text-foreground"} />
                            Root
                        </div>
                        {folders.filter(f => !f.parent_id).sort((a,b) => a.name.localeCompare(b.name)).map(folder => (
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
                <div className="flex-1 flex flex-col min-w-0">
                     {/* Toolbar */}
                     <div className="h-14 border-b border-border px-6 flex items-center justify-between gap-4 bg-card shrink-0">
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
                            
                            <nav className="flex items-center text-sm font-medium overflow-hidden whitespace-nowrap">
                                <span 
                                    className="cursor-pointer hover:text-primary transition-colors shrink-0" 
                                    onClick={() => setCurrentFolderId(null)}
                                >
                                    Templates
                                </span>
                                 {folderPath.map((f, i) => (
                                     <React.Fragment key={f.id}>
                                         <ChevronRight size={14} className="mx-1 text-muted-foreground/60 shrink-0" />
                                         <span 
                                             className={cn(
                                                 "cursor-pointer hover:text-primary transition-colors truncate",
                                                 i === folderPath.length - 1 ? "text-primary" : "text-foreground/80"
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
                            <div className="relative w-40 lg:w-48 hidden md:block">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    type="search" 
                                    placeholder="Cari..." 
                                    className="pl-8 h-8 text-xs bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 px-2 font-medium" onClick={() => setIsFolderModalOpen(true)}>
                                <FolderPlus size={14} />
                                <span className="hidden lg:inline text-[11px]">Folder</span>
                            </Button>
                            
                            <Button size="sm" className="h-8 gap-1.5 px-3 font-medium shadow-sm shadow-primary/20" onClick={() => setIsUploadModalOpen(true)}>
                                <Upload size={14} />
                                <span className="hidden lg:inline text-[11px]">Upload</span>
                            </Button>
                        </div>
                    </div>

                    {/* File List / Grid - Right Click Enabled Background */}
                    <div 
                        className="flex-1 overflow-y-auto p-6 bg-muted/5 relative"
                        onContextMenu={(e) => handleContextMenu(e, 'background', currentFolderId || 'root', 'Background')}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max">
                            {/* Folders First */}
                            {filteredFolders.map(folder => (
                                <div 
                                    key={folder.id}
                                    className={cn(
                                        "group relative bg-card h-20 border rounded-xl p-3 flex items-center gap-3 hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer select-none",
                                        contextMenu.item?.id === folder.id && contextMenu.isOpen ? "border-primary ring-1 ring-primary/20 shadow-md" : ""
                                    )}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                                >
                                     <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 shrink-0 shadow-sm border border-blue-500/20">
                                         <Folder size={20} fill="currentColor" fillOpacity={0.1} />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <h4 className="font-bold text-xs truncate leading-tight tracking-tight text-foreground/90">{folder.name}</h4>
                                         <p className="text-[10px] font-medium text-muted-foreground/60">{folder.templates_count} items</p>
                                     </div>
                                    
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, 'folder', folder.id, folder.name); }}
                                    >
                                        <MoreVertical size={12} />
                                    </Button>
                                </div>
                            ))}

                            {/* Templates Next */}
                            {filteredTemplates.map(template => (
                                <div 
                                    key={template.id}
                                    className={cn(
                                        "group relative bg-card border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-default select-none",
                                        contextMenu.item?.id === template.id && contextMenu.isOpen ? "border-primary ring-1 ring-primary/20 shadow-md" : ""
                                    )}
                                    onContextMenu={(e) => handleContextMenu(e, 'template', template.id, template.name)}
                                >
                                    <div className="p-3 flex items-center gap-3 border-b border-muted/50">
                                         <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 shrink-0 shadow-sm border border-orange-500/20">
                                             <FileText size={20} />
                                         </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-xs truncate leading-tight tracking-tight">{template.name}</h4>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase opacity-60 tracking-wider">
                                                {template.file_type} • {formatSize(template.file_size)}
                                            </p>
                                        </div>
                                         <Button 
                                             variant="ghost" 
                                             size="icon" 
                                             className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity text-muted-foreground"
                                             onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, 'template', template.id, template.name); }}
                                         >
                                             <MoreHorizontal size={12} />
                                         </Button>
                                    </div>
                                     <div className="px-3 py-1.5 bg-muted/20 flex justify-between items-center">
                                         <span className="text-[9px] font-medium text-muted-foreground/60 truncate max-w-[80px]">By {template.creator?.name || 'Admin'}</span>
                                         <a 
                                             href={route('admin.templates.download', template.id)} 
                                             className="text-[9px] font-black text-primary hover:text-primary/80 transition-colors tracking-tighter"
                                             onClick={(e) => e.stopPropagation()}
                                         >
                                             UNDUH
                                         </a>
                                     </div>
                                </div>
                            ))}

                            {filteredFolders.length === 0 && filteredTemplates.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-3xl opacity-60 select-none">
                                    <Folder className="h-10 w-10 mb-3 opacity-10" />
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
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <DialogTitle className="text-base font-bold">Hapus {selectedItem?.type === 'folder' ? 'Folder' : 'Item'}</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs">
                             Apakah Anda yakin ingin menghapus <strong>"{selectedItem?.name}"</strong>? 
                             {selectedItem?.type === 'folder' && " Semua isi di dalam folder ini juga akan terhapus secara permanen."}
                             Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" className="font-semibold text-xs" onClick={() => setIsDeleteModalOpen(false)}>Batal</Button>
                        <Button variant="destructive" size="sm" className="font-bold text-xs shadow-md shadow-destructive/20" onClick={handleDelete}>Hapus Sekarang</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Move Dialog */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Pindahkan {selectedItem?.name}</DialogTitle>
                        <DialogDescription className="text-xs">
                            Pilih folder tujuan untuk memindahkan item ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block px-1">Pilih Folder Tujuan</Label>
                        <div className="border rounded-xl bg-muted/10 overflow-hidden">
                            <div className="h-60 p-2 overflow-y-auto">
                                <div 
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs mb-1",
                                        targetFolderId === null ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20" : "hover:bg-muted font-medium transition-colors"
                                    )}
                                    onClick={() => setTargetFolderId(null)}
                                >
                                    <Folder size={14} className={targetFolderId === null ? "fill-white/20" : "text-muted-foreground"} />
                                    Root
                                </div>
                                {folders
                                    .filter(f => f.id !== selectedItem?.id) // Prevent moving to self
                                    .sort((a,b) => a.name.localeCompare(b.name))
                                    .map(folder => (
                                        <div 
                                            key={folder.id}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs mb-1 ml-2",
                                                targetFolderId === folder.id ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20" : "hover:bg-muted font-medium transition-colors border border-transparent hover:border-muted-foreground/10"
                                            )}
                                            onClick={() => setTargetFolderId(folder.id)}
                                        >
                                            <Folder size={14} className={targetFolderId === folder.id ? "fill-white/20" : "text-muted-foreground"} />
                                            {folder.name}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" className="font-semibold text-xs" onClick={() => setIsMoveModalOpen(false)}>Batal</Button>
                        <Button size="sm" className="font-bold text-xs" onClick={handleMove}>Pindahkan Sekarang</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Creation Modal */}
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Buat Folder Baru</DialogTitle>
                        <DialogDescription className="text-xs">
                             Masukkan nama folder untuk mengelompokkan template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Nama Folder</Label>
                        <Input 
                            id="name" 
                            className="h-10 text-sm font-medium rounded-xl bg-muted/20 border-none ring-0 placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                            value={newFolderName} 
                            onChange={e => setNewFolderName(e.target.value)} 
                            placeholder="e.g. Perjanjian Kerja Sama"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" className="font-semibold text-xs" onClick={() => setIsFolderModalOpen(false)}>Batal</Button>
                        <Button size="sm" className="font-bold text-xs" onClick={handleCreateFolder}>Simpan Folder</Button>
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
                        <Label htmlFor="rename-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Nama Baru</Label>
                        <Input 
                            id="rename-input" 
                            className="h-10 text-sm font-medium rounded-xl bg-muted/20 border-none ring-0 focus-visible:ring-1 focus-visible:ring-primary/30"
                            value={newFolderName} 
                            onChange={e => setNewFolderName(e.target.value)} 
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" className="font-semibold text-xs" onClick={() => setIsRenameModalOpen(false)}>Batal</Button>
                        <Button size="sm" className="font-bold text-xs" onClick={handleRename}>Simpan Perubahan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <form onSubmit={handleUploadTemplate}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">Upload Template</DialogTitle>
                            <DialogDescription className="text-xs">
                                Tambahkan file baru ke dalam folder ini.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-1">
                                <Label htmlFor="tpl-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Nama Tampilan</Label>
                                <Input 
                                    id="tpl-name" 
                                    className="h-10 text-sm font-medium rounded-xl bg-muted/20 border-none ring-0 placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                    value={uploadData.name} 
                                    onChange={e => setUploadData({...uploadData, name: e.target.value})} 
                                    placeholder="e.g. Kontrak Pihak Ketiga"
                                    required
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="tpl-desc" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Deskripsi (Opsional)</Label>
                                <Input 
                                    id="tpl-desc" 
                                    className="h-10 text-sm font-medium rounded-xl bg-muted/20 border-none ring-0 placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                                    value={uploadData.description} 
                                    onChange={e => setUploadData({...uploadData, description: e.target.value})} 
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="tpl-file" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Pilih File</Label>
                                <div className="relative group/field border-2 border-dashed border-muted-foreground/10 rounded-2xl p-4 hover:border-primary/20 hover:bg-primary/5 transition-all text-center cursor-pointer">
                                    <Input 
                                        id="tpl-file" 
                                        type="file" 
                                        className="h-full w-full absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={e => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                                        required
                                    />
                                    <div className="space-y-1">
                                         <Upload size={18} className="mx-auto text-muted-foreground group-hover/field:text-primary transition-colors" />
                                          <p className="text-[10px] font-bold group-hover/field:text-primary transition-colors text-foreground/80">
                                              {uploadData.file ? uploadData.file.name : "Klik atau seret file ke sini"}
                                          </p>
                                          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-tighter">MAX 10MB • .DOCX, .PDF, .XLSX</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" className="font-semibold text-xs" onClick={() => setIsUploadModalOpen(false)}>Batal</Button>
                            <Button type="submit" size="sm" className="font-bold text-xs shadow-md shadow-primary/20">Mulai Unggah</Button>
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
                    "flex items-center gap-1 px-1.5 py-1 rounded-md cursor-pointer transition-all group",
                    isSelected ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted"
                )}
                onClick={() => onSelect(folder.id)}
            >
                <div onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}>
                    {hasChildren ? (
                        isExpanded ? <ChevronDown size={12} className="text-muted-foreground/60" /> : <ChevronRight size={12} className="text-muted-foreground/60" />
                    ) : (
                        <div className="w-[12px]" />
                    )}
                </div>
                <Folder 
                    size={14} 
                    className={cn(
                        "shrink-0 transition-colors", 
                        isSelected ? "text-primary fill-primary/10" : "text-muted-foreground/40 group-hover:text-muted-foreground"
                    )} 
                />
                <span className={cn("truncate text-[11px] tracking-tight", isSelected ? "text-primary font-bold" : "text-muted-foreground font-medium")}>
                    {folder.name}
                </span>
            </div>
            
            {isExpanded && hasChildren && (
                <div className="ml-2 pl-1 border-l border-muted-foreground/10 space-y-0.5 mt-0.5">
                    {children.sort((a:any, b:any) => a.name.localeCompare(b.name)).map((child: any) => (
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
