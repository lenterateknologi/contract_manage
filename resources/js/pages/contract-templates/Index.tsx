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
    ChevronRight,
    Download,
    Edit3,
    FileSpreadsheet,
    FileText,
    Folder,
    FolderInput,
    FolderPlus,
    MoreHorizontal,
    Trash2,
    Upload,
} from 'lucide-react';

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

export default function Templates({ folders, templates }: Props) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);

    // Dialog States
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Selection/Item States
    const [selectedItem, setSelectedItem] = useState<{ type: 'folder' | 'template'; id: string; name: string } | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [uploadData, setUploadData] = useState({ name: '', description: '', file: null as File | null });
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

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

        // If searching across all or viewing specific folder
        const folderRows: TableRowItem[] = folders
            .filter((f) => {
                if (q) {
                    return f.name.toLowerCase().includes(q);
                }
                return f.parent_id === currentFolderId;
            })
            .map((f) => ({
                id: f.id,
                itemType: 'folder',
                name: f.name,
                file_type: 'folder',
                templates_count: f.templates_count,
                raw: f,
            }));

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
                    folder_name: parentFolder ? parentFolder.name : 'Root',
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
    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        router.post(
            route('admin.templates.folders.store'),
            {
                name: newFolderName.trim(),
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
        if (!selectedItem || !newFolderName.trim()) return;

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
                },
            },
        );
    };

    const handleMove = () => {
        if (!selectedItem) return;
        const url = selectedItem.type === 'folder' ? route('admin.templates.folders.move', selectedItem.id) : route('admin.templates.move', selectedItem.id);
        const data = selectedItem.type === 'folder' ? { parent_id: targetFolderId } : { template_folder_id: targetFolderId };

        router.patch(url, data, {
            onSuccess: () => {
                setIsMoveModalOpen(false);
                setSelectedItem(null);
                setTargetFolderId(null);
            },
        });
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
                                <button
                                    type="button"
                                    onClick={() => setCurrentFolderId(row.id)}
                                    className="text-left font-semibold text-xs text-text-main hover:text-primary transition-colors cursor-pointer truncate max-w-md"
                                >
                                    {row.name}
                                </button>
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
                            <span className="font-semibold text-xs text-text-main truncate max-w-md">
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
                            {row.itemType === 'template' && (
                                <DropdownMenuItem asChild>
                                    <a
                                        href={route('admin.templates.download', row.id)}
                                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-text-main hover:bg-surface-muted rounded-md transition-colors cursor-pointer"
                                    >
                                        <Download size={13} className="text-primary" />
                                        <span>Download</span>
                                    </a>
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

    return (
        <>
            <Head title="Template Kontrak" />
            <MasterPageLayout>
                <FloatingPanel className="flex-1 min-w-0 flex flex-col">
                    <PageTable
                        standalone={false}
                        title="Template Kontrak"
                        subtitle="Kelola berkas templat kontrak, formulir, dan struktur folder dokumen"
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
                                        setNewFolderName('');
                                        setIsFolderModalOpen(true);
                                    }}
                                    className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                    <FolderPlus size={15} className="text-amber-500" />
                                    <span>Buat Folder</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        setUploadData({ name: '', description: '', file: null });
                                        setIsUploadModalOpen(true);
                                    }}
                                    className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                    <Upload size={15} />
                                    <span>Upload Template</span>
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
                            />
                        </div>
                    </PageTable>
                </FloatingPanel>
            </MasterPageLayout>

            {/* Buat Folder Modal */}
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
                    <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                        <DialogTitle className="text-sm font-bold text-text-main flex items-center gap-2">
                            <FolderPlus size={16} className="text-amber-500" /> Buat Folder Baru
                        </DialogTitle>
                        <DialogDescription className="text-text-desc mt-0.5 text-xs">
                            Tambahkan folder baru pada direktori saat ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5">
                        <Label htmlFor="folder-name-input" className="text-text-main mb-2 block text-xs font-semibold">
                            Nama Folder
                        </Label>
                        <Input
                            id="folder-name-input"
                            className="h-10 text-xs"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Contoh: Perjanjian Kerjasama (PKS)"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                            }}
                        />
                    </div>
                    <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-xs font-semibold"
                            onClick={() => setIsFolderModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="h-9 px-5 text-xs font-semibold"
                            onClick={handleCreateFolder}
                        >
                            Simpan Folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Template Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[460px]">
                    <form onSubmit={handleUploadTemplate}>
                        <DialogHeader className="bg-surface-muted/40 border-surface-border border-b p-5">
                            <DialogTitle className="text-sm font-bold text-text-main flex items-center gap-2">
                                <Upload size={16} className="text-primary" /> Unggah Template Kontrak
                            </DialogTitle>
                            <DialogDescription className="text-text-desc mt-0.5 text-xs">
                                Unggah dokumen templat (.docx, .pdf, .xlsx) ke repository.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 p-5">
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-name" className="text-text-main text-xs font-semibold">
                                    Nama Template <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="tpl-name"
                                    className="h-10 text-xs"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    placeholder="Contoh: Surat Perjanjian Vendor Standar"
                                    required
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-desc" className="text-text-main text-xs font-semibold">
                                    Deskripsi (Opsional)
                                </Label>
                                <Input
                                    id="tpl-desc"
                                    className="h-10 text-xs"
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                    placeholder="Keterangan singkat peruntukan template"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="tpl-file" className="text-text-main text-xs font-semibold">
                                    File Template <span className="text-rose-500">*</span>
                                </Label>
                                <div className="group/field border-surface-border hover:border-primary hover:bg-primary/5 relative cursor-pointer rounded-xl border border-dashed p-5 text-center transition-all">
                                    <Input
                                        id="tpl-file"
                                        type="file"
                                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            if (file && !uploadData.name) {
                                                const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                                                setUploadData({ ...uploadData, name: rawName, file });
                                            } else {
                                                setUploadData({ ...uploadData, file });
                                            }
                                        }}
                                        required
                                    />
                                    <div className="space-y-1.5">
                                        <div className="bg-surface-muted text-text-desc group-hover/field:bg-primary/10 group-hover/field:text-primary mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all">
                                            <Upload size={18} />
                                        </div>
                                        <p className="text-text-main mx-auto max-w-[300px] truncate text-xs font-semibold">
                                            {uploadData.file ? uploadData.file.name : 'Pilih atau Seret File di Sini'}
                                        </p>
                                        <p className="text-text-desc text-[10.5px]">
                                            Maksimal 10MB • DOCX, PDF, XLSX
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 px-4 text-xs font-semibold"
                                onClick={() => setIsUploadModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                className="h-9 px-5 text-xs font-semibold"
                            >
                                Konfirmasi Unggah
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Rename Modal */}
            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
                <DialogContent className="border-surface-border bg-surface-base overflow-hidden border p-0 shadow-2xl sm:max-w-[420px]">
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                            }}
                        />
                    </div>
                    <DialogFooter className="border-surface-border/60 gap-2 border-t px-5 py-3.5 bg-surface-card/30">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-xs font-semibold"
                            onClick={() => setIsRenameModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="h-9 px-5 text-xs font-semibold"
                            onClick={handleRename}
                        >
                            Terapkan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Move Modal */}
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
                                    <span>Repository Root (Utama)</span>
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
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="h-9 px-5 text-xs font-semibold"
                            onClick={handleMove}
                        >
                            Pindahkan Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
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
                            >
                                Batal
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                className="h-10 text-xs font-semibold"
                                onClick={handleDelete}
                            >
                                Hapus
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
