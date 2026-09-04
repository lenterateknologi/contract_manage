/**
 * Utility to match a user against workflow pool configuration (both new combined and legacy formats)
 */
export function matchUserAgainstWorkflowPool(user: any, config: any, contract: any): boolean {
    if (!config || Object.keys(config).length === 0) return false;
    if (user && (user.is_used === false || user.is_used === 0 || String(user.is_used) === '0')) return false;

    // Handle legacy simple array format
    if (Array.isArray(config)) {
        if (config.length === 0) return false;
        return config.some((party: string) => {
            if (party === 'initiator') {
                const initId = contract?.initiator?.id || contract?.initiated_by_id;
                return initId && String(user.id) === String(initId);
            }
            if (party === 'creator') {
                const creatorId = contract?.creator?.id || contract?.created_by;
                return creatorId && String(user.id) === String(creatorId);
            }
            if (party === 'assigned_pic' || party === 'pic') {
                const picId = contract?.assigned_pic_id || contract?.assigned_pic?.id || contract?.assignedPic?.id || contract?.metadata?.assigned_pic_id;
                return picId && String(user.id) === String(picId);
            }
            // Fallback: treat as role name
            return user.role?.toLowerCase() === party.toLowerCase();
        });
    }

    const authorities = config.authorities || config.approver_authorities;
    if (authorities && Array.isArray(authorities)) {
        if (authorities.length === 0) return false;

        return authorities.some((auth: any) => {
            if (auth.authority_type === 'custom' || ['initiator', 'assigned_pic', 'creator'].includes(auth.authority_type)) {
                const actorType = auth.user_id || auth.authority_type;
                if (actorType === 'initiator') {
                    const initId = contract?.initiator?.id || contract?.initiated_by_id;
                    return initId && String(user.id) === String(initId);
                }
                if (actorType === 'assigned_pic') {
                    const picId = contract?.assigned_pic_id || contract?.assigned_pic?.id || contract?.assignedPic?.id || contract?.metadata?.assigned_pic_id;
                    return picId && String(user.id) === String(picId);
                }
                if (actorType === 'creator') {
                    const creatorId = contract?.creator?.id || contract?.created_by;
                    return creatorId && String(user.id) === String(creatorId);
                }
                return false;
            }

            if (auth.authority_type === 'user') {
                return String(user.id) === String(auth.user_id);
            }

            let matchesRole = true;
            let matchesDept = true;
            let matchesDiv = true;
            let matchesGroup = true;
            let matchesRegion = true;
            let hasFilters = false;

            let userRoleId = String(user.role_id || user.role || '');
            let userDeptId = String(user.department_id || user.department?.id || '');
            let userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
            let userCompId = String(user.company_id || user.company?.id || '');
            let userCgId = String(user.company_group_id || user.company?.company_group_id || '');
            let userRegionId = String(user.region_id || user.company?.region_id || '');

            if (auth.role_id) {
                const targetRoleStr = String(auth.role_id);
                matchesRole = targetRoleStr === userRoleId || 
                              auth.role?.name?.toLowerCase() === user.role?.toLowerCase() ||
                              targetRoleStr.toLowerCase() === user.role?.toLowerCase();
                hasFilters = true;
            } else if (auth.role_use_initiator) {
                const initRoleId = String(contract?.initiator?.role_id || contract?.initiator?.role || '');
                matchesRole = initRoleId === userRoleId || 
                              contract?.initiator?.role?.toLowerCase() === user.role?.toLowerCase();
                hasFilters = true;
            }

            if (auth.department_id) {
                matchesDept = String(auth.department_id) === userDeptId;
                hasFilters = true;
            } else if (auth.department_use_initiator) {
                const initDeptId = String(contract?.initiator?.department_id || contract?.initiator?.department?.id || '');
                matchesDept = initDeptId === userDeptId;
                hasFilters = true;
            }

            if (auth.division_id) {
                matchesDiv = String(auth.division_id) === userDivId;
                hasFilters = true;
            } else if (auth.division_use_initiator) {
                const initDivId = String(contract?.initiator?.division_id || contract?.initiator?.division?.id || contract?.initiator?.department?.division_id || '');
                matchesDiv = initDivId === userDivId;
                hasFilters = true;
            }

            if (auth.company_group_id) {
                matchesGroup = String(auth.company_group_id) === userCgId;
                hasFilters = true;
            } else if (auth.company_group_use_initiator) {
                const initCG = String(contract?.initiator?.company_group_id || contract?.initiator?.company?.company_group_id || '');
                matchesGroup = initCG === userCgId;
                hasFilters = true;
            }

            if (auth.company_id) {
                matchesGroup = matchesGroup && (String(auth.company_id) === userCompId);
                hasFilters = true;
            } else if (auth.company_use_initiator) {
                const initCompanyId = String(contract?.initiator?.company_id || contract?.initiator?.company?.id || '');
                matchesGroup = matchesGroup && (initCompanyId === userCompId);
                hasFilters = true;
            }

            if (auth.region_id) {
                matchesRegion = String(auth.region_id) === userRegionId;
                hasFilters = true;
            } else if (auth.region_use_initiator) {
                const initRegion = String(contract?.initiator?.region_id || contract?.initiator?.region?.id || contract?.initiator?.company?.region_id || '');
                matchesRegion = initRegion === userRegionId;
                hasFilters = true;
            }

            if (hasFilters) {
                return matchesRole && matchesDept && matchesDiv && matchesGroup && matchesRegion;
            }

            return false;
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
        const targetDivs = [...(config.divisions || [])].map(String);

        if (config.is_initiator_role && contract?.initiator?.role) {
            targetRoles.push(contract.initiator.role);
        }
        if (config.is_initiator_department) {
            const initDeptId = contract?.initiator?.department_id || contract?.initiator?.department?.id;
            if (initDeptId) {
                targetDepts.push(String(initDeptId));
            }
            const initDivId = contract?.initiator?.division_id || contract?.initiator?.division?.id;
            if (initDivId) {
                targetDivs.push(String(initDivId));
            }
        }

        // 1. Matches specific users
        if (targetUsers.map(String).includes(String(user.id))) return true;

        // 2. Matches custom actors
        if (customActors.includes('initiator')) {
            const initId = contract?.initiator?.id || contract?.initiated_by_id;
            if (initId && String(user.id) === String(initId)) return true;
        }
        if (customActors.includes('creator')) {
            const creatorId = contract?.creator?.id || contract?.created_by;
            if (creatorId && String(user.id) === String(creatorId)) return true;
        }
        if (customActors.includes('assigned_pic')) {
            const picId = contract?.assigned_pic_id || contract?.assigned_pic?.id || contract?.assignedPic?.id || contract?.metadata?.assigned_pic_id;
            if (picId && String(user.id) === String(picId)) return true;
        }

        // 3. Matches roles AND/OR departments/divisions
        const hasRoles = targetRoles.length > 0;
        const hasDepts = targetDepts.length > 0;
        const hasDivs = targetDivs.length > 0;

        let matchesRole = true;
        if (hasRoles) {
            matchesRole = targetRoles.some((r: string) =>
                r.toLowerCase() === user.role?.toLowerCase() ||
                String(r) === String(user.role_id)
            );
        }

        let matchesDept = true;
        if (hasDepts) {
            const userDeptId = user.department_id || user.department?.id;
            matchesDept = targetDepts.includes(String(userDeptId));
        }

        let matchesDiv = true;
        if (hasDivs) {
            const userDivId = user.division_id || user.division?.id;
            matchesDiv = targetDivs.includes(String(userDivId));
        }

        if (hasRoles || hasDepts || hasDivs) {
            return matchesRole && matchesDept && matchesDiv;
        }

        // If config is completely empty (no users, no custom, no roles, no departments, no divisions), default to false
        if (targetUsers.length === 0 && customActors.length === 0 && targetRoles.length === 0 && targetDepts.length === 0 && targetDivs.length === 0) {
            return false;
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

    if (config.type === 'all') return true;
    if (!config.type) return false;
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
