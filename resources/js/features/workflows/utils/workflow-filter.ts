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
                const picId =
                    contract?.assigned_pic_id || contract?.assigned_pic?.id || contract?.assignedPic?.id || contract?.metadata?.assigned_pic_id;
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
            if (
                auth.authority_type === 'custom' ||
                ['initiator', 'assigned_pic', 'creator', 'adhoc_approvers', 'adhoc'].includes(auth.authority_type)
            ) {
                const actorType = auth.user_id || auth.authority_type;
                if (actorType === 'initiator') {
                    const initId = contract?.initiator?.id || contract?.initiated_by_id;
                    return initId && String(user.id) === String(initId);
                }
                if (actorType === 'assigned_pic') {
                    const picId =
                        contract?.assigned_pic_id || contract?.assigned_pic?.id || contract?.assignedPic?.id || contract?.metadata?.assigned_pic_id;
                    return picId && String(user.id) === String(picId);
                }
                if (actorType === 'creator') {
                    const creatorId = contract?.creator?.id || contract?.created_by;
                    return creatorId && String(user.id) === String(creatorId);
                }
                if (actorType === 'adhoc_approvers' || actorType === 'adhoc') {
                    const adhocApprovals = (contract?.approvals || []).filter(
                        (a: any) =>
                            (a.role === 'Persetujuan Tambahan' || a.role === 'Ad-Hoc Approver') &&
                            String(a.workflow_step_id) === String(contract?.workflow_step_id),
                    );
                    return adhocApprovals.some((a: any) => String(a.user_id) === String(user.id));
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
            let matchesOrgGroup = true;
            let matchesLocation = true;
            let hasFilters = false;

            const userRoleId = String(user.role_id || user.role || '');
            const userDeptId = String(user.department_id || user.department?.id || '');
            const userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
            const userLocId = String(user.location_id || user.idlocation || user.location?.id || '');
            const userCompId = String(user.company_id || user.company?.id || '');
            const userCgId = String(user.company_group_id || user.company?.company_group_id || '');
            const userRegionId = String(user.region_id || user.company?.region_id || '');
            const userOrgGroupUuid = String(user.organization_group_id || user.department?.organization_group_id || '');
            const userOrgGroupId = String(user.department?.idorg_group || user.idorg_group || userOrgGroupUuid || '');

            if (auth.role_id) {
                const targetRoleStr = String(auth.role_id);
                matchesRole =
                    targetRoleStr === userRoleId ||
                    auth.role?.name?.toLowerCase() === user.role?.toLowerCase() ||
                    targetRoleStr.toLowerCase() === user.role?.toLowerCase();
                hasFilters = true;
            } else if (auth.role_use_initiator) {
                const initRoleId = String(contract?.initiator?.role_id || contract?.initiator?.role || '');
                matchesRole = initRoleId === userRoleId || contract?.initiator?.role?.toLowerCase() === user.role?.toLowerCase();
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
                const initDivId = String(
                    contract?.initiator?.division_id || contract?.initiator?.division?.id || contract?.initiator?.department?.division_id || '',
                );
                matchesDiv = initDivId === userDivId;
                hasFilters = true;
            }

            if (auth.location_id) {
                const targetLocStr = String(auth.location_id);
                const userLocName = (user.location_name || user.location?.name || '').toLowerCase().trim();
                matchesLocation =
                    targetLocStr === userLocId || auth.location?.name?.toLowerCase() === userLocName || targetLocStr.toLowerCase() === userLocName;
                hasFilters = true;
            } else if (auth.location_use_initiator) {
                const initLocId = String(
                    contract?.initiator?.location_id || contract?.initiator?.idlocation || contract?.initiator?.location?.id || '',
                );
                const initLocName = (contract?.initiator?.location_name || contract?.initiator?.location?.name || '').toLowerCase().trim();
                const userLocName = (user.location_name || user.location?.name || '').toLowerCase().trim();
                matchesLocation = (initLocId && userLocId && initLocId === userLocId) || (initLocName && userLocName && initLocName === userLocName);
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
                matchesGroup = matchesGroup && String(auth.company_id) === userCompId;
                hasFilters = true;
            } else if (auth.company_use_initiator) {
                const initCompanyId = String(contract?.initiator?.company_id || contract?.initiator?.company?.id || '');
                matchesGroup = matchesGroup && initCompanyId === userCompId;
                hasFilters = true;
            }

            if (auth.region_id) {
                matchesRegion = String(auth.region_id) === userRegionId;
                hasFilters = true;
            } else if (auth.region_use_initiator) {
                const initRegion = String(
                    contract?.initiator?.region_id || contract?.initiator?.region?.id || contract?.initiator?.company?.region_id || '',
                );
                matchesRegion = initRegion === userRegionId;
                hasFilters = true;
            }

            if (auth.organization_group_id) {
                const targetOgId = String(auth.organization_group_id);
                const targetOgName = (auth.organizationGroup?.name || auth.organization_group?.name || '').toLowerCase().trim();
                const targetIdOrgGroup =
                    auth.organizationGroup?.idorg_group !== undefined && auth.organizationGroup?.idorg_group !== null
                        ? String(auth.organizationGroup.idorg_group)
                        : auth.organization_group?.idorg_group !== undefined && auth.organization_group?.idorg_group !== null
                          ? String(auth.organization_group.idorg_group)
                          : null;

                const userIdOrgGroup =
                    user.department?.idorg_group !== undefined && user.department?.idorg_group !== null
                        ? String(user.department.idorg_group)
                        : user.idorg_group !== undefined && user.idorg_group !== null
                          ? String(user.idorg_group)
                          : '';
                const userOrgGroupName = (user.org_group_name || user.department?.org_group_name || '').toLowerCase().trim();

                matchesOrgGroup =
                    (userOrgGroupUuid !== '' && targetOgId === userOrgGroupUuid) ||
                    targetOgId === userOrgGroupId ||
                    (targetIdOrgGroup !== null && targetIdOrgGroup === userIdOrgGroup) ||
                    (targetOgName && targetOgName === userOrgGroupName) ||
                    targetOgId === userIdOrgGroup;
                hasFilters = true;
            } else if (auth.organization_group_use_initiator) {
                const initOrgGroupId = String(
                    contract?.initiator?.department?.organization_group_id || contract?.initiator?.organization_group_id || '',
                );
                const initIdOrgGroup =
                    contract?.initiator?.department?.idorg_group !== undefined && contract?.initiator?.department?.idorg_group !== null
                        ? String(contract?.initiator?.department.idorg_group)
                        : contract?.initiator?.idorg_group !== undefined && contract?.initiator?.idorg_group !== null
                          ? String(contract?.initiator?.idorg_group)
                          : '';
                const initOrgGroupName = (contract?.initiator?.org_group_name || contract?.initiator?.department?.org_group_name || '')
                    .toLowerCase()
                    .trim();

                const userIdOrgGroup =
                    user.department?.idorg_group !== undefined && user.department?.idorg_group !== null
                        ? String(user.department.idorg_group)
                        : user.idorg_group !== undefined && user.idorg_group !== null
                          ? String(user.idorg_group)
                          : '';
                const userOrgGroupName = (user.org_group_name || user.department?.org_group_name || '').toLowerCase().trim();

                matchesOrgGroup = Boolean(
                    (initOrgGroupId && userOrgGroupId && initOrgGroupId === userOrgGroupId) ||
                    (initIdOrgGroup && userIdOrgGroup && initIdOrgGroup === userIdOrgGroup) ||
                    (initOrgGroupName && userOrgGroupName && initOrgGroupName === userOrgGroupName),
                );
                hasFilters = true;
            }

            if (hasFilters) {
                return matchesRole && matchesDept && matchesDiv && matchesLocation && matchesGroup && matchesRegion && matchesOrgGroup;
            }

            return false;
        });
    }

    const hasNewConfig = config.custom !== undefined || config.users !== undefined || config.roles !== undefined || config.departments !== undefined;

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
            matchesRole = targetRoles.some((r: string) => r.toLowerCase() === user.role?.toLowerCase() || String(r) === String(user.role_id));
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
        if (
            targetUsers.length === 0 &&
            customActors.length === 0 &&
            targetRoles.length === 0 &&
            targetDepts.length === 0 &&
            targetDivs.length === 0
        ) {
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

// ponytail: evaluate step execution / skip status based on simulation vendor
export function evaluateStepExecutionStatus(step: any, vendor: any): { isSkipped: boolean; reason?: string } {
    if (!step || !vendor) {
        return { isSkipped: false };
    }

    // Step tidak aktif atau opsional di-skip
    if (step.is_active === false) {
        return { isSkipped: true, reason: 'Tahap non-aktif' };
    }

    const conditions: Array<{ key: string; operator: string; value: string; logic?: 'AND' | 'OR' }> = [];

    if (Array.isArray(step.meta?.conditions) && step.meta.conditions.length > 0) {
        step.meta.conditions.forEach((c: any) => {
            if (c.key) {
                conditions.push({
                    key: c.key.trim(),
                    operator: c.operator || 'truthy',
                    value: (c.value ?? '').toString().trim(),
                    logic: c.logic === 'OR' || c.connector === 'OR' ? 'OR' : 'AND',
                });
            }
        });
    } else if (step.meta?.condition_key) {
        conditions.push({
            key: step.meta.condition_key.trim(),
            operator: step.meta.condition_operator || 'truthy',
            value: (step.meta.condition_value ?? '').toString().trim(),
            logic: 'AND',
        });
    } else if (step.condition_expression && step.condition_expression !== 'METADATA_KEY') {
        const expr = String(step.condition_expression).trim();
        const tokens = expr.split(/(\s*\|\|\s*|\s*&&\s*)/);
        let curLogic: 'AND' | 'OR' = 'AND';
        for (const token of tokens) {
            const t = token.trim();
            if (t === '||') curLogic = 'OR';
            else if (t === '&&') curLogic = 'AND';
            else if (t) {
                let matched = false;
                for (const op of ['==', '!=', '>', '<', 'contains']) {
                    if (t.includes(` ${op} `)) {
                        const [k, ...vParts] = t.split(` ${op} `);
                        conditions.push({ key: k.trim(), operator: op, value: vParts.join(` ${op} `).trim(), logic: curLogic });
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    conditions.push({ key: t, operator: 'truthy', value: '', logic: curLogic });
                }
            }
        }
    }

    if (conditions.length === 0) {
        return { isSkipped: false };
    }

    const resolveVal = (key: string): any => {
        const k = key.toLowerCase();
        if (k === 'contract.has_tax' || k === 'has_tax' || k === 'vendor.is_pkp' || k === 'is_pkp') {
            return Boolean(vendor.is_pkp);
        }
        if (k === 'meta_p2_pkp_status' || k === 'pkp_status') {
            return vendor.pkp_status || (vendor.is_pkp ? 'PKP' : 'NON PKP');
        }
        if (k === 'vendor.code' || k === 'vendor_code') {
            return vendor.code || '';
        }
        if (k === 'vendor.name' || k === 'vendor_name' || k === 'meta_p2_entity') {
            return vendor.name || '';
        }
        if (k === 'vendor.npwp' || k === 'npwp') {
            return vendor.npwp || '';
        }
        return undefined;
    };

    let hasRelevantVendorCondition = false;
    let accumulated: boolean | null = null;
    let prevLogic: 'AND' | 'OR' = 'AND';

    for (const cond of conditions) {
        const val = resolveVal(cond.key);
        if (val !== undefined) {
            hasRelevantVendorCondition = true;
        }

        // Jika kondisi tidak terkait vendor, jangan skip karena data lain belum tentu falsy di runtime
        if (val === undefined) {
            continue;
        }

        let passed = false;
        const op = cond.operator || 'truthy';
        const expected = cond.value;

        if (op === 'truthy') {
            const falsy = [false, 'false', 0, '0', '', null, undefined, 'tidak', 'no', 'off', 'non pkp', 'non-pkp', '-'];
            passed = typeof val === 'string' ? !falsy.includes(val.toLowerCase().trim()) : !falsy.includes(val);
        } else if (op === '==') {
            const valStr = typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val);
            passed =
                valStr.toLowerCase() === expected.toLowerCase() ||
                (['true', '1', 'yes', 'pkp'].includes(expected.toLowerCase()) && ['true', '1', 'on', 'yes', 'pkp'].includes(valStr.toLowerCase())) ||
                (['false', '0', 'no', 'non pkp'].includes(expected.toLowerCase()) && ['false', '0', 'off', 'no', 'non pkp', 'non-pkp', ''].includes(valStr.toLowerCase()));
        } else if (op === '!=') {
            const valStr = typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val);
            const isMatch =
                valStr.toLowerCase() === expected.toLowerCase() ||
                (['true', '1', 'yes', 'pkp'].includes(expected.toLowerCase()) && ['true', '1', 'on', 'yes', 'pkp'].includes(valStr.toLowerCase())) ||
                (['false', '0', 'no', 'non pkp'].includes(expected.toLowerCase()) && ['false', '0', 'off', 'no', 'non pkp', 'non-pkp', ''].includes(valStr.toLowerCase()));
            passed = !isMatch;
        } else if (op === 'contains') {
            passed = String(val).toLowerCase().includes(String(expected).toLowerCase());
        }

        if (accumulated === null) {
            accumulated = passed;
        } else {
            accumulated = prevLogic === 'OR' ? accumulated || passed : accumulated && passed;
        }
        prevLogic = cond.logic || 'AND';
    }

    if (hasRelevantVendorCondition && accumulated === false) {
        return { isSkipped: true, reason: `Dilewati (Skipped): Vendor "${vendor.name}" (${vendor.pkp_status || (vendor.is_pkp ? 'PKP' : 'NON PKP')}) tidak memenuhi syarat tahap ini.` };
    }

    return { isSkipped: false };
}

