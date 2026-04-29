import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export function usePermissions(moduleCode?: string) {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.permissions || {};

    if (!moduleCode) {
        return {
            permissions,
            can: (code: string, action: 'read' | 'create' | 'update' | 'delete') => {
                return !!permissions[code]?.[action];
            }
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
        canRead: modulePerms.read,
        canCreate: modulePerms.create,
        canUpdate: modulePerms.update,
        canDelete: modulePerms.delete,
        canApprove: (modulePerms as any).approve,
        canBulkApprove: (modulePerms as any).bulk_approve,
        canBulkDelete: (modulePerms as any).bulk_delete,
    };
}
