import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function usePermissions(moduleCodeOrRoute?: string) {
    const { auth } = usePage<SharedData>().props;
    const pageUrl = typeof window !== 'undefined' ? window.location.pathname : '';
    const lookupKey = moduleCodeOrRoute || pageUrl;
    const permissions = auth?.permissions || {};
    const isAdmin = Boolean((auth?.user as any)?.is_admin);

    const modulePerms = (lookupKey ? permissions[lookupKey] : null) || {
        read: false,
        create: false,
        update: false,
        delete: false,
        approve: false,
        bulk_approve: false,
        bulk_delete: false,
    };

    return {
        canRead: isAdmin || !!modulePerms.read,
        canCreate: isAdmin || !!modulePerms.create,
        canUpdate: isAdmin || !!modulePerms.update,
        canDelete: isAdmin || !!modulePerms.delete,
        canApprove: isAdmin || !!(modulePerms as any).approve,
        canBulkApprove: isAdmin || !!(modulePerms as any).bulk_approve,
        canBulkDelete: isAdmin || !!(modulePerms as any).bulk_delete,
        isAdmin,
        permissions,
        can: (codeOrRoute: string, action: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'bulk_approve' | 'bulk_delete') => {
            if (isAdmin) return true;
            return !!permissions[codeOrRoute]?.[action];
        },
    };
}
