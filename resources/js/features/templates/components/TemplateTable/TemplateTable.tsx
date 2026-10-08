import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/selection/DropdownMenu';
import { Column, DataTable } from '@/components/ui/tables/DataTable';
import { cn } from '@/lib/utils';
import React from 'react';
import { ContractTemplate, TableRowItem } from '../../types';
import { formatSize } from '../../utils/templateUtils';

const { Download, Edit3, Eye, EyeOff, FileText, Folder, FolderInput, FolderOpen, MoreHorizontal, Trash2 } = Icons;

interface TemplateTableProps {
    data: TableRowItem[];
    selectedRows: TableRowItem[];
    setSelectedRows: React.Dispatch<React.SetStateAction<TableRowItem[]>>;
    onRowClick?: (row: TableRowItem) => void;
    onRowDoubleClick: (row: TableRowItem) => void;
    onOpenContextMenu: (e: React.MouseEvent, row: TableRowItem) => void;
    onPreview: (template: ContractTemplate) => void;
    onDownload: (templateId: string) => void;
    onOpenFolder: (folderId: string) => void;
    onToggleVisibility: (item: TableRowItem) => void;
    onRename: (item: TableRowItem) => void;
    onMove: (item: TableRowItem) => void;
    onDelete: (item: TableRowItem) => void;
    canDownload?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canToggleVisibility?: boolean;
}

export function TemplateTable({
    data,
    selectedRows,
    setSelectedRows,
    onRowClick,
    onRowDoubleClick,
    onOpenContextMenu,
    onPreview,
    onDownload,
    onOpenFolder,
    onToggleVisibility,
    onRename,
    onMove,
    onDelete,
    canDownload,
    canEdit,
    canDelete,
    canToggleVisibility,
}: TemplateTableProps) {
    const columns: Column<TableRowItem>[] = [
        {
            header: 'Nama Dokumen / Folder',
            accessorKey: 'name',
            cell: (row) => {
                if (row.itemType === 'folder') {
                    return (
                        <div className="flex items-center gap-2.5 py-0.5">
                            <Folder size={18} className="shrink-0 fill-amber-500 text-amber-500" />
                            <div className="flex min-w-0 flex-col">
                                <span className="text-text-main group-hover:text-primary max-w-md truncate text-xs font-semibold transition-colors">
                                    {row.name}
                                </span>
                                <span className="text-text-desc text-[10.5px] font-medium">{row.templates_count || 0} item di dalam folder</span>
                            </div>
                        </div>
                    );
                }

                const isPdf = row.file_type === 'pdf';
                const isExcel = ['xls', 'xlsx'].includes(row.file_type);

                return (
                    <div className="flex items-center gap-2.5 py-0.5">
                        <FileText
                            size={18}
                            className={cn(
                                'shrink-0',
                                isPdf
                                    ? 'fill-rose-600/20 text-rose-600'
                                    : isExcel
                                      ? 'fill-emerald-600/20 text-emerald-600'
                                      : 'fill-blue-600/20 text-blue-600',
                            )}
                        />
                        <div className="flex min-w-0 flex-col">
                            <span className="text-text-main group-hover:text-primary max-w-md truncate text-xs font-semibold transition-colors">
                                {row.name}
                            </span>
                            {row.description ? (
                                <span className="text-text-desc max-w-md truncate text-[10.5px]">{row.description}</span>
                            ) : (
                                <span className="text-text-desc max-w-md truncate font-mono text-[10.5px]">{row.file_name}</span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Lokasi Folder',
            accessorKey: 'folder_name',
            className: 'w-44',
            cell: (row) => (
                <span className="text-text-desc text-xs font-medium">{row.itemType === 'folder' ? 'Sub-Folder' : row.folder_name || 'Root'}</span>
            ),
        },
        {
            header: 'Ukuran File',
            accessorKey: 'file_size',
            className: 'w-32',
            cell: (row) => (
                <span className="text-text-desc text-xs font-medium">{row.itemType === 'folder' ? '-' : formatSize(row.file_size || 0)}</span>
            ),
        },
        {
            header: 'Pengunggah',
            accessorKey: 'creator_name',
            className: 'w-36',
            cell: (row) => <span className="text-text-desc block truncate text-xs font-medium">{row.creator_name || '-'}</span>,
        },
        {
            header: 'Tanggal Dibuat / Upload',
            accessorKey: 'created_at',
            className: 'w-44',
            cell: (row) => {
                if (!row.created_at) return <span className="text-text-desc text-xs font-medium">-</span>;
                const dateObj = new Date(row.created_at);
                const formattedDate = dateObj.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                });
                const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                return (
                    <div className="flex flex-col">
                        <span className="text-text-main text-xs font-medium">{formattedDate}</span>
                        <span className="text-text-desc text-[10px]">{formattedTime} WIB</span>
                    </div>
                );
            },
        },
        {
            header: 'Status',
            accessorKey: 'is_visible',
            className: 'w-32 text-center',
            cell: (row) => {
                const isVisible = row.is_visible !== false;
                return (
                    <div className="flex items-center justify-center">
                        {canToggleVisibility ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleVisibility(row);
                                }}
                                className={cn(
                                    'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all',
                                    isVisible
                                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
                                        : 'border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400',
                                )}
                                title={`Klik untuk mengubah status menjadi ${isVisible ? 'Tersembunyi' : 'Tampil'}`}
                            >
                                {isVisible ? (
                                    <>
                                        <Eye size={12} className="shrink-0" />
                                        <span>Tampil</span>
                                    </>
                                ) : (
                                    <>
                                        <EyeOff size={12} className="shrink-0" />
                                        <span>Tersembunyi</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                                    isVisible
                                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
                                )}
                            >
                                {isVisible ? 'Tampil' : 'Tersembunyi'}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Aksi',
            accessorKey: 'id',
            className: 'w-20 text-center',
            cell: (row) => (
                <div
                    className="flex items-center justify-center"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-text-desc hover:text-text-main hover:bg-surface-muted h-7 w-7 p-0"
                            >
                                <MoreHorizontal size={15} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-surface-border z-[9999] w-48 p-1.5 shadow-xl">
                            {row.itemType === 'template' ? (
                                <>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPreview(row.raw);
                                        }}
                                        className="text-text-main hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                                    >
                                        <Eye size={13} className="text-primary" />
                                        <span>Buka / Pratinjau</span>
                                    </DropdownMenuItem>
                                    {canDownload && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDownload(row.id);
                                            }}
                                            className="text-text-main hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                                        >
                                            <Download size={13} className="text-emerald-500" />
                                            <span>Download</span>
                                        </DropdownMenuItem>
                                    )}
                                </>
                            ) : (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenFolder(row.id);
                                    }}
                                    className="text-text-main hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                                >
                                    <FolderOpen size={13} className="text-amber-500" />
                                    <span>Buka Folder</span>
                                </DropdownMenuItem>
                            )}
                            {canToggleVisibility && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleVisibility(row);
                                    }}
                                    className="text-text-main hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                                >
                                    {row.is_visible !== false ? (
                                        <>
                                            <EyeOff size={13} className="text-amber-500" />
                                            <span>Sembunyikan {row.itemType === 'folder' ? 'Folder' : 'Dokumen'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye size={13} className="text-emerald-500" />
                                            <span>Tampilkan {row.itemType === 'folder' ? 'Folder' : 'Dokumen'}</span>
                                        </>
                                    )}
                                </DropdownMenuItem>
                            )}
                            {canEdit && (
                                <>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRename(row);
                                        }}
                                        className="text-text-main hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                                    >
                                        <Edit3 size={13} className="text-amber-500" />
                                        <span>Ubah Nama</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMove(row);
                                        }}
                                        className="text-text-main hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                                    >
                                        <FolderInput size={13} className="text-blue-500" />
                                        <span>Pindahkan</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                            {canDelete && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(row);
                                    }}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                >
                                    <Trash2 size={13} className="text-rose-500" />
                                    <span>Hapus</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    return (
        <div className="flex-1 overflow-hidden">
            <DataTable<TableRowItem>
                data={data}
                columns={columns}
                selectedRows={selectedRows}
                onSelectedRowsChange={setSelectedRows}
                onRowClick={onRowClick}
                onRowDoubleClick={onRowDoubleClick}
                onRowContextMenu={onOpenContextMenu}
            />
        </div>
    );
}
