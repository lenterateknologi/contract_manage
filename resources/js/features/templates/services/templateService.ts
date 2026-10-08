import { router } from '@inertiajs/react';

export const templateService = {
    // ── Folder Operations ──────────────────────────────────────────────
    createFolder: (
        data: { name: string; parent_id?: string | null },
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.post(route('admin.templates.folders.store'), data, {
            preserveScroll: true,
            ...options,
        });
    },

    updateFolder: (
        folderId: string,
        data: { name: string },
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.put(route('admin.templates.folders.update', folderId), data, {
            preserveScroll: true,
            ...options,
        });
    },

    deleteFolder: (
        folderId: string,
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.delete(route('admin.templates.folders.destroy', folderId), {
            preserveScroll: true,
            ...options,
        });
    },

    moveFolder: (
        folderId: string,
        parentId: string | null,
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.patch(
            route('admin.templates.folders.move', folderId),
            { parent_id: parentId },
            {
                preserveScroll: true,
                ...options,
            },
        );
    },

    toggleFolderVisibility: (
        folderId: string,
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.patch(
            route('admin.templates.folders.toggle-visibility', folderId),
            {},
            {
                preserveScroll: true,
                ...options,
            },
        );
    },

    // ── Template Document Operations ───────────────────────────────────
    storeTemplate: (
        formData: FormData,
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.post(route('admin.templates.store'), formData, {
            preserveScroll: true,
            ...options,
        });
    },

    updateTemplate: (
        templateId: string,
        data: { name: string; description?: string | null },
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.put(route('admin.templates.update', templateId), data, {
            preserveScroll: true,
            ...options,
        });
    },

    deleteTemplate: (
        templateId: string,
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.delete(route('admin.templates.destroy', templateId), {
            preserveScroll: true,
            ...options,
        });
    },

    moveTemplate: (
        templateId: string,
        folderId: string | null,
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.patch(
            route('admin.templates.move', templateId),
            { template_folder_id: folderId },
            {
                preserveScroll: true,
                ...options,
            },
        );
    },

    toggleTemplateVisibility: (
        templateId: string,
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.patch(
            route('admin.templates.toggle-visibility', templateId),
            {},
            {
                preserveScroll: true,
                ...options,
            },
        );
    },

    downloadTemplate: (templateId: string) => {
        window.location.href = route('admin.templates.download', templateId);
    },

    // ── Bulk Operations ────────────────────────────────────────────────
    bulkDelete: (
        data: { folder_ids?: string[]; template_ids?: string[] },
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.post(route('admin.templates.bulk-destroy'), data, {
            preserveScroll: true,
            ...options,
        });
    },

    bulkMove: (
        data: { folder_ids?: string[]; template_ids?: string[]; target_folder_id: string | null },
        options?: { onSuccess?: () => void; onError?: (errors: any) => void; onFinish?: () => void },
    ) => {
        router.post(route('admin.templates.bulk-move'), data, {
            preserveScroll: true,
            ...options,
        });
    },
};
