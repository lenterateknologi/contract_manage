import { Icons } from '@/components/ui';
import { Button } from '@/components/ui/buttons/Button';
import { FloatingPanel } from '@/components/ui/navigation/FloatingPanel';
import { MasterPageLayout } from '@/components/ui/navigation/MasterPageLayout';
import { FilterCategory } from '@/components/ui/navigation/PageFilter';
import { PageTable } from '@/components/ui/navigation/PageTable';
import { usePermissions } from '@/hooks/use-permissions';
import { Head } from '@inertiajs/react';
import React, { useMemo } from 'react';
import { DragDropOverlay } from '../components/DragDropOverlay/DragDropOverlay';
import { FolderTreePanel } from '../components/FolderTree/FolderTreePanel';
import { BulkDeleteModal, BulkMoveModal } from '../components/Modals/BulkActionModals';
import { DeleteModal } from '../components/Modals/DeleteModal';
import { FolderModal } from '../components/Modals/FolderModal';
import { MoveModal } from '../components/Modals/MoveModal';
import { PreviewModal } from '../components/Modals/PreviewModal';
import { RenameModal } from '../components/Modals/RenameModal';
import { UploadModal } from '../components/Modals/UploadModal';
import { TemplateTable } from '../components/TemplateTable/TemplateTable';
import { useTemplateModals } from '../hooks/useTemplateModals';
import { useTemplateNavigation } from '../hooks/useTemplateNavigation';
import { templateService } from '../services/templateService';
import { TableRowItem, TemplatesPageProps } from '../types';

const { ArrowLeft, ChevronRight, FolderInput, FolderOpen, FolderPlus, Trash2, Upload } = Icons;

export default function TemplatesPage({ folders = [], templates = [], permissions }: Readonly<TemplatesPageProps>) {
    const systemPerms = usePermissions('ADMIN_TEMPLATES');
    const canDownload = permissions?.canDownload ?? systemPerms.canRead;
    const canUpload = permissions?.canUpload ?? systemPerms.canCreate;
    const canCreateFolder = permissions?.canCreateFolder ?? systemPerms.canCreate;
    const canCreate = canUpload || canCreateFolder;
    const canEdit = permissions?.canEdit ?? systemPerms.canUpdate;
    const canUpdate = canEdit;
    const canToggleVisibility = permissions?.canToggleVisibility ?? canUpdate;
    const canDelete = permissions?.canDelete ?? systemPerms.canDelete;
    const canBulkDelete = canDelete && systemPerms.canBulkDelete;

    const nav = useTemplateNavigation(folders, templates);
    const modals = useTemplateModals();

    // Drag and drop states
    const [isDragging, setIsDragging] = React.useState(false);
    const dragCounterRef = React.useRef(0);

    const handleFilesDropped = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const filesArray = Array.from(files);

        filesArray.forEach((file) => {
            const defaultName = file.name.replace(/\.[^/.]+$/, '');
            const formData = new FormData();
            formData.append('name', defaultName);
            formData.append('description', '');
            if (nav.currentFolderId) {
                formData.append('template_folder_id', nav.currentFolderId);
            }
            formData.append('file', file);

            templateService.storeTemplate(formData);
        });
    };

    const filterCategories: FilterCategory[] = useMemo(
        () => [
            {
                key: 'file_type',
                label: 'Tipe Dokumen',
                type: 'multiselect',
                options: [
                    { label: 'FOLDER', value: 'folder' },
                    ...nav.availableFileTypes.map((type) => ({
                        label: type.toUpperCase(),
                        value: type,
                    })),
                ],
            },
            {
                key: 'visibility',
                label: 'Status Visibilitas',
                type: 'multiselect',
                options: [
                    { label: 'Tampil', value: 'visible' },
                    { label: 'Tersembunyi', value: 'hidden' },
                ],
            },
        ],
        [nav.availableFileTypes],
    );

    const activeFilterCount = nav.fileTypeFilter.length + nav.visibilityFilter.length;

    const handleFilterChange = (key: string, values: string[]) => {
        if (key === 'file_type') {
            nav.setFileTypeFilter(values);
        } else if (key === 'visibility') {
            nav.setVisibilityFilter(values);
        }
    };

    const handleClearAllFilters = () => {
        nav.setFileTypeFilter([]);
        nav.setVisibilityFilter([]);
        nav.setSearchQuery('');
    };

    return (
        <>
            <Head title="Template Kontrak" />
            <MasterPageLayout>
                {/* ── LEFT SIDEBAR: FOLDER TREE MAP NAVIGATION ── */}
                <FloatingPanel className="border-surface-border bg-surface-card/50 flex h-full w-72 shrink-0 flex-col overflow-hidden border-r">
                    <FolderTreePanel
                        folderTree={nav.folderTree}
                        totalAllTemplates={nav.totalAllTemplates}
                        currentFolderId={nav.currentFolderId}
                        treeSearch={nav.treeSearch}
                        setTreeSearch={nav.setTreeSearch}
                        expandedFolderIds={nav.expandedFolderIds}
                        onSelectFolder={(id) => nav.setCurrentFolderId(id)}
                        onToggleExpand={nav.toggleFolderExpand}
                        onOpenContextMenu={(e, folder) => {
                            if (folder.id) {
                                modals.openRename({ type: 'folder', id: folder.id, name: folder.name });
                            }
                        }}
                        canCreateFolder={canCreateFolder}
                        onOpenCreateFolder={(parentId) => modals.openCreateFolder(parentId || null)}
                    />
                </FloatingPanel>

                {/* ── RIGHT MAIN PANEL: TEMPLATES TABLE CONTENT ── */}
                <FloatingPanel
                    onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dragCounterRef.current += 1;
                        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                            setIsDragging(true);
                        }
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
                        if (dragCounterRef.current === 0) {
                            setIsDragging(false);
                        }
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dragCounterRef.current = 0;
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleFilesDropped(e.dataTransfer.files);
                        }
                    }}
                    className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden"
                >
                    <DragDropOverlay isDragging={isDragging} folderName={nav.currentFolder?.name || 'Root Repository'} />

                    <PageTable
                        title={nav.currentFolder ? nav.currentFolder.name : 'Repository Template Kontrak'}
                        description={
                            nav.currentFolder
                                ? `Berisi berkas template dan sub-folder di dalam folder ${nav.currentFolder.name}.`
                                : 'Kelola dokumen baku, format perjanjian hukum, dan berkas acuan kontrak.'
                        }
                        searchPlaceholder="Cari template atau folder..."
                        searchValue={nav.searchQuery}
                        onSearchChange={nav.setSearchQuery}
                        filterCategories={filterCategories}
                        filterValues={{
                            file_type: nav.fileTypeFilter,
                            visibility: nav.visibilityFilter,
                        }}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearAllFilters}
                        activeFilterCount={activeFilterCount}
                        actions={
                            <div className="flex items-center gap-2">
                                {canUpload && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => modals.openUpload(nav.currentFolderId)}
                                        className="h-8.5 gap-1.5 px-3 text-xs font-semibold shadow-xs"
                                    >
                                        <Upload size={14} />
                                        <span>Upload Dokumen</span>
                                    </Button>
                                )}
                                {canCreateFolder && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => modals.openCreateFolder(nav.currentFolderId)}
                                        className="h-8.5 gap-1.5 px-3 text-xs font-semibold"
                                    >
                                        <FolderPlus size={14} />
                                        <span>Folder Baru</span>
                                    </Button>
                                )}
                            </div>
                        }
                    >
                        {/* Breadcrumbs Navigation Bar */}
                        <div className="border-surface-border bg-surface-muted/30 flex items-center justify-between border-b px-4 py-2 text-xs">
                            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => nav.setCurrentFolderId(null)}
                                    className="text-text-desc hover:text-primary flex items-center gap-1 font-medium transition-colors"
                                >
                                    <FolderOpen size={13} className="text-amber-500" />
                                    <span>Root</span>
                                </button>
                                {nav.folderPath.map((f, idx) => (
                                    <React.Fragment key={f.id}>
                                        <ChevronRight size={12} className="text-text-desc shrink-0" />
                                        <button
                                            type="button"
                                            onClick={() => nav.setCurrentFolderId(f.id)}
                                            className={
                                                idx === nav.folderPath.length - 1
                                                    ? 'text-text-main font-bold'
                                                    : 'text-text-desc hover:text-primary font-medium transition-colors'
                                            }
                                        >
                                            {f.name}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>
                            {nav.currentFolder && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => nav.setCurrentFolderId(nav.currentFolder?.parent_id || null)}
                                    className="text-text-desc hover:text-text-main h-6 gap-1 px-2 text-[11px]"
                                >
                                    <ArrowLeft size={12} />
                                    <span>Kembali</span>
                                </Button>
                            )}
                        </div>

                        {/* Bulk Action Toolbar */}
                        {modals.selectedRows.length > 0 && (
                            <div className="bg-primary/10 border-primary/20 animate-in fade-in flex items-center justify-between border-b px-4 py-2 text-xs">
                                <span className="text-primary font-bold">{modals.selectedRows.length} item dipilih</span>
                                <div className="flex items-center gap-2">
                                    {canEdit && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => modals.setIsBulkMoveModalOpen(true)}
                                            className="h-7 gap-1 px-2.5 text-xs font-semibold"
                                        >
                                            <FolderInput size={13} className="text-blue-500" />
                                            <span>Pindahkan</span>
                                        </Button>
                                    )}
                                    {canBulkDelete && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => modals.setIsBulkDeleteModalOpen(true)}
                                            className="h-7 gap-1 px-2.5 text-xs font-semibold"
                                        >
                                            <Trash2 size={13} />
                                            <span>Hapus</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Table View */}
                        <TemplateTable
                            data={nav.filteredTableData}
                            selectedRows={modals.selectedRows}
                            setSelectedRows={modals.setSelectedRows}
                            onRowDoubleClick={(row) => {
                                if (row.itemType === 'folder') {
                                    nav.setCurrentFolderId(row.id);
                                } else {
                                    modals.setPreviewTemplate(row.raw);
                                }
                            }}
                            onOpenContextMenu={(e, row) => {
                                // context menu action
                            }}
                            onPreview={(template) => modals.setPreviewTemplate(template)}
                            onDownload={(id) => templateService.downloadTemplate(id)}
                            onOpenFolder={(id) => nav.setCurrentFolderId(id)}
                            onToggleVisibility={(item) => {
                                if (item.itemType === 'folder') {
                                    templateService.toggleFolderVisibility(item.id);
                                } else {
                                    templateService.toggleTemplateVisibility(item.id);
                                }
                            }}
                            onRename={(item) => modals.openRename({ type: item.itemType, id: item.id, name: item.name, description: item.description })}
                            onMove={(item) => modals.openMove({ type: item.itemType, id: item.id, name: item.name })}
                            onDelete={(item) => modals.openDelete({ type: item.itemType, id: item.id, name: item.name })}
                            canDownload={canDownload}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            canToggleVisibility={canToggleVisibility}
                        />
                    </PageTable>
                </FloatingPanel>
            </MasterPageLayout>

            {/* Modals */}
            <FolderModal
                isOpen={modals.isFolderModalOpen}
                onOpenChange={modals.setIsFolderModalOpen}
                parentId={modals.folderFormParentId}
                folders={folders}
            />

            <UploadModal
                isOpen={modals.isUploadModalOpen}
                onOpenChange={modals.setIsUploadModalOpen}
                currentFolderId={modals.uploadTargetFolderId}
                folders={folders}
            />

            <RenameModal
                isOpen={modals.isRenameModalOpen}
                onOpenChange={modals.setIsRenameModalOpen}
                target={modals.renameTarget}
            />

            <MoveModal
                isOpen={modals.isMoveModalOpen}
                onOpenChange={modals.setIsMoveModalOpen}
                target={modals.moveTarget}
                folders={folders}
            />

            <DeleteModal
                isOpen={modals.isDeleteModalOpen}
                onOpenChange={modals.setIsDeleteModalOpen}
                target={modals.deleteTarget}
            />

            <PreviewModal
                template={modals.previewTemplate}
                onClose={() => modals.setPreviewTemplate(null)}
                canDownload={canDownload}
                onDownload={(id) => templateService.downloadTemplate(id)}
            />

            <BulkDeleteModal
                isOpen={modals.isBulkDeleteModalOpen}
                onOpenChange={modals.setIsBulkDeleteModalOpen}
                selectedRows={modals.selectedRows}
                onSuccess={() => modals.setSelectedRows([])}
            />

            <BulkMoveModal
                isOpen={modals.isBulkMoveModalOpen}
                onOpenChange={modals.setIsBulkMoveModalOpen}
                selectedRows={modals.selectedRows}
                folders={folders}
                onSuccess={() => modals.setSelectedRows([])}
            />
        </>
    );
}
