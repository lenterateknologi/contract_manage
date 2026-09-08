import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function usePermissions(moduleCode?: string) {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.permissions || {};
    const isAdmin = auth.user?.role === 'Super Admin' || auth.user?.role === 'Admin' || !!(auth.user as any)?.is_admin;

    if (!moduleCode) {
        return {
            permissions,
            can: (code: string, action: 'read' | 'create' | 'update' | 'delete') => {
                if (isAdmin) return true;
                return !!permissions[code]?.[action];
            },
            isAdmin,
        };
    }

    const modulePerms = permissions[moduleCode] || {
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
    };
}
