/**
 * Utility to match a user against workflow pool configuration (both new combined and legacy formats)
 */
export function matchUserAgainstWorkflowPool(user: any, config: any, contract: any): boolean {
    if (!config) return true;

    // Handle legacy simple array format
    if (Array.isArray(config)) {
        return config.some((party: string) => {
            if (party === 'initiator') return String(user.id) === String(contract?.initiator?.id);
            if (party === 'assigned_pic' || party === 'pic') {
                const picId = contract?.assigned_pic_id || contract?.metadata?.assigned_pic_id;
                return picId && String(user.id) === String(picId);
            }
            // Fallback: treat as role name
            return user.role?.toLowerCase() === party.toLowerCase();
        });
    }

    const hasNewConfig = (
        config.custom !== undefined ||
        config.users !== undefined ||
        config.roles !== undefined ||
        config.departments !== undefined
    );

    if (hasNewConfig) {
        const targetUsers = config.users || [];
        const customActors = config.custom || [];
        const targetRoles = [...(config.roles || [])];
        const targetDepts = [...(config.departments || [])].map(String);

        if (config.is_initiator_role && contract?.initiator?.role) {
            targetRoles.push(contract.initiator.role);
        }
        if (config.is_initiator_department) {
            const initDeptId = contract?.initiator?.department_id || contract?.initiator?.department?.id;
            if (initDeptId) {
                targetDepts.push(String(initDeptId));
            }
        }

        // 1. Matches specific users
        if (targetUsers.map(String).includes(String(user.id))) return true;

        // 2. Matches custom actors
        if (customActors.includes('initiator') && contract?.initiator?.id && String(user.id) === String(contract.initiator.id)) return true;
        if (customActors.includes('assigned_pic')) {
            const picId = contract?.assigned_pic_id || contract?.metadata?.assigned_pic_id;
            if (picId && String(user.id) === String(picId)) return true;
        }

        // 3. Matches roles AND/OR departments
        const hasRoles = targetRoles.length > 0;
        const hasDepts = targetDepts.length > 0;

        if (hasRoles && hasDepts) {
            const matchesRole = targetRoles.some((r: string) => r.toLowerCase() === user.role?.toLowerCase());
            const userDeptId = user.department_id || user.department?.id;
            const matchesDept = targetDepts.includes(String(userDeptId));
            return matchesRole && matchesDept;
        } else if (hasRoles) {
            return targetRoles.some((r: string) => r.toLowerCase() === user.role?.toLowerCase());
        } else if (hasDepts) {
            const userDeptId = user.department_id || user.department?.id;
            return targetDepts.includes(String(userDeptId));
        }

        // If config is completely empty (no users, no custom, no roles, no departments), default to true
        if (targetUsers.length === 0 && customActors.length === 0 && targetRoles.length === 0 && targetDepts.length === 0) {
            return true;
        }

        return false;
    }

    // Legacy/Step requirement fallback
    if (config.type === undefined && (config.roles !== undefined || config.department_ids !== undefined || config.department_id !== undefined)) {
        const nextDeptIds = config.department_ids || (config.department_id ? [config.department_id] : []);
        const matchesDept = nextDeptIds.length === 0 || nextDeptIds.includes(user.department_id || user.department?.id);
        const nextRoles = config.roles || [];
        const matchesRole = nextRoles.length === 0 || nextRoles.some((r: string) => r.toLowerCase() === user.role?.toLowerCase());
        return matchesDept && matchesRole;
    }

    if (!config.type || config.type === 'all') return true;
    if (config.type === 'user') {
        const allowedUserIds = (config.user_ids || []).map(String);
        return allowedUserIds.includes(String(user.id));
    }
    if (config.type === 'role') {
        const targetRoles = config.roles || [];
        const matchesRole = targetRoles.length === 0 || targetRoles.some((r: string) => r.toLowerCase() === user.role?.toLowerCase());
        const targetDeptIds = (config.department_ids || []).map(String);
        const userDeptId = user.department_id || user.department?.id;
        return (targetDeptIds.length === 0 || targetDeptIds.includes(String(userDeptId))) && matchesRole;
    }

    return false;
}
