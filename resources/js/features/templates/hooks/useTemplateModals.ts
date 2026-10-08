import { useState } from 'react';
import { ContractTemplate, TableRowItem, TemplateFolder } from '../types';

export function useTemplateModals() {
    // Selection state
    const [selectedRows, setSelectedRows] = useState<TableRowItem[]>([]);

    // Folder Modal State
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [folderFormParentId, setFolderFormParentId] = useState<string | null>(null);
    const [folderFormName, setFolderFormName] = useState('');

    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadName, setUploadName] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');

    // Rename Modal State
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [renameTarget, setRenameTarget] = useState<{ type: 'folder' | 'template'; id: string; name: string; description?: string | null } | null>(null);
    const [renameName, setRenameName] = useState('');
    const [renameDescription, setRenameDescription] = useState('');

    // Move Modal State
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [moveTarget, setMoveTarget] = useState<{ type: 'folder' | 'template'; id: string; name: string } | null>(null);
    const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'folder' | 'template'; id: string; name: string } | null>(null);

    // Preview Modal State
    const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);

    // Bulk Modals
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
    const [bulkTargetFolderId, setBulkTargetFolderId] = useState<string | null>(null);

    // Submitting status
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openCreateFolder = (parentId: string | null = null) => {
        setFolderFormParentId(parentId);
        setFolderFormName('');
        setIsFolderModalOpen(true);
    };

    const openUpload = (targetFolderId: string | null = null) => {
        setUploadTargetFolderId(targetFolderId);
        setUploadFile(null);
        setUploadName('');
        setUploadDescription('');
        setIsUploadModalOpen(true);
    };

    const openRename = (target: { type: 'folder' | 'template'; id: string; name: string; description?: string | null }) => {
        setRenameTarget(target);
        setRenameName(target.name);
        setRenameDescription(target.description || '');
        setIsRenameModalOpen(true);
    };

    const openMove = (target: { type: 'folder' | 'template'; id: string; name: string }) => {
        setMoveTarget(target);
        setMoveTargetFolderId(null);
        setIsMoveModalOpen(true);
    };

    const openDelete = (target: { type: 'folder' | 'template'; id: string; name: string }) => {
        setDeleteTarget(target);
        setIsDeleteModalOpen(true);
    };

    return {
        selectedRows,
        setSelectedRows,
        isFolderModalOpen,
        setIsFolderModalOpen,
        folderFormParentId,
        setFolderFormParentId,
        folderFormName,
        setFolderFormName,
        openCreateFolder,
        isUploadModalOpen,
        setIsUploadModalOpen,
        uploadTargetFolderId,
        setUploadTargetFolderId,
        uploadFile,
        setUploadFile,
        uploadName,
        setUploadName,
        uploadDescription,
        setUploadDescription,
        openUpload,
        isRenameModalOpen,
        setIsRenameModalOpen,
        renameTarget,
        setRenameTarget,
        renameName,
        setRenameName,
        renameDescription,
        setRenameDescription,
        openRename,
        isMoveModalOpen,
        setIsMoveModalOpen,
        moveTarget,
        setMoveTarget,
        moveTargetFolderId,
        setMoveTargetFolderId,
        openMove,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        deleteTarget,
        setDeleteTarget,
        openDelete,
        previewTemplate,
        setPreviewTemplate,
        isBulkDeleteModalOpen,
        setIsBulkDeleteModalOpen,
        isBulkMoveModalOpen,
        setIsBulkMoveModalOpen,
        bulkTargetFolderId,
        setBulkTargetFolderId,
        isSubmitting,
        setIsSubmitting,
    };
}
