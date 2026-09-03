import React, { useState, useMemo } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/dialogs/Popover';
import { Badge } from '@/components/ui/feedback/Badge';
import { Button } from '@/components/ui/buttons/Button';
import { UserCheck, Users, Search, Shield, Sparkles, User, Building2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepEligibleUsersPopoverProps {
    step: any;
    idx: number;
    users?: any[];
    roles?: any[];
    departments?: any[];
    divisions?: any[];
    companyGroups?: any[];
    companies?: any[];
    regions?: any[];
    simulationContext?: {
        initiatorId?: string;
        picId?: string;
        creatorId?: string;
    };
    onOpenSimulationModal?: () => void;
}

export function StepEligibleUsersPopover({
    step,
    idx,
    users = [],
    roles = [],
    departments = [],
    divisions = [],
    companyGroups = [],
    companies = [],
    regions = [],
    simulationContext,
    onOpenSimulationModal,
}: StepEligibleUsersPopoverProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Helper untuk mengambil nama Departemen & Divisi pengguna
    const getDeptName = (u: any) => {
        if (!u) return null;
        return u.department?.name || departments.find((d: any) => String(d.id) === String(u.department_id))?.name || null;
    };

    const getDivName = (u: any) => {
        if (!u) return null;
        return u.division?.name || divisions.find((d: any) => String(d.id) === String(u.division_id || u.department?.division_id))?.name || null;
    };

    // Pengguna simulasi untuk Inisiator, PIC, dan Creator jika ada di context simulasi
    const simInitiatorUser = useMemo(() => {
        if (!simulationContext?.initiatorId) return null;
        return users.find((u: any) => String(u.id) === String(simulationContext.initiatorId)) || null;
    }, [simulationContext?.initiatorId, users]);

    const simPicUser = useMemo(() => {
        if (!simulationContext?.picId) return null;
        return users.find((u: any) => String(u.id) === String(simulationContext.picId)) || null;
    }, [simulationContext?.picId, users]);

    const simCreatorUser = useMemo(() => {
        if (!simulationContext?.creatorId) return null;
        return users.find((u: any) => String(u.id) === String(simulationContext.creatorId)) || null;
    }, [simulationContext?.creatorId, users]);

    // Analisis kriteria akses tahap berdasarkan Otoritas Aktor di tab Konfigurasi Langkah
    const { eligibleUsers, dynamicRoles, criteriaSummary } = useMemo(() => {
        const matchedUsersMap = new Map<string, { user: any; reasons: string[] }>();
        const dynamicList: { type: string; label: string; description: string; activeUser?: any }[] = [];
        const criteriaParts: string[] = [];

        const authorities: any[] = step.approver_authorities || [];
        const cfg = step.approver_config || {};

        // 1. Prioritas: Cek jika menggunakan Tabel Otoritas Aktor (approver_authorities)
        if (authorities && authorities.length > 0) {
            authorities.forEach((auth: any) => {
                if (auth.authority_type === 'custom') {
                    const customType = auth.role_id || auth.user_id || auth.authority_type;
                    if (customType === 'initiator') {
                        criteriaParts.push('Inisiator');
                        dynamicList.push({
                            type: 'initiator',
                            label: 'Inisiator Kontrak',
                            description: 'Pengguna yang menginisiasi pengajuan kontrak.',
                            activeUser: simInitiatorUser,
                        });
                        if (simInitiatorUser) {
                            const existing = matchedUsersMap.get(String(simInitiatorUser.id)) || { user: simInitiatorUser, reasons: [] };
                            existing.reasons.push('Inisiator (Simulasi)');
                            matchedUsersMap.set(String(simInitiatorUser.id), existing);
                        }
                    } else if (customType === 'assigned_pic') {
                        criteriaParts.push('PIC Ditugaskan');
                        dynamicList.push({
                            type: 'assigned_pic',
                            label: 'PIC Ditugaskan',
                            description: 'Pengguna yang ditugaskan sebagai PIC kontrak.',
                            activeUser: simPicUser,
                        });
                        if (simPicUser) {
                            const existing = matchedUsersMap.get(String(simPicUser.id)) || { user: simPicUser, reasons: [] };
                            existing.reasons.push('PIC Ditugaskan (Simulasi)');
                            matchedUsersMap.set(String(simPicUser.id), existing);
                        }
                    } else if (customType === 'creator') {
                        criteriaParts.push('Pembuat Kontrak');
                        dynamicList.push({
                            type: 'creator',
                            label: 'Pembuat Kontrak',
                            description: 'Pengguna yang membuat draf kontrak.',
                            activeUser: simCreatorUser,
                        });
                        if (simCreatorUser) {
                            const existing = matchedUsersMap.get(String(simCreatorUser.id)) || { user: simCreatorUser, reasons: [] };
                            existing.reasons.push('Pembuat Kontrak (Simulasi)');
                            matchedUsersMap.set(String(simCreatorUser.id), existing);
                        }
                    } else if (customType === 'atasan') {
                        criteriaParts.push('Atasan Langsung');
                        dynamicList.push({
                            type: 'atasan',
                            label: 'Atasan Langsung',
                            description: 'Atasan langsung dari inisiator pengajuan kontrak.',
                        });
                    }
                } else if (auth.authority_type === 'user' && auth.user_id) {
                    const u = users.find((user: any) => String(user.id) === String(auth.user_id));
                    if (u) {
                        criteriaParts.push(`User: ${u.name}`);
                        const existing = matchedUsersMap.get(String(u.id)) || { user: u, reasons: [] };
                        existing.reasons.push('User Spesifik');
                        matchedUsersMap.set(String(u.id), existing);
                    }
                } else {
                    // Authority Type Group / Filter Aturan Role & Unit
                    const hasFilters = Boolean(
                        auth.role_id ||
                        auth.role_use_initiator ||
                        auth.department_id ||
                        auth.department_use_initiator ||
                        auth.division_id ||
                        auth.division_use_initiator ||
                        auth.company_group_id ||
                        auth.company_group_use_initiator ||
                        auth.company_id ||
                        auth.company_use_initiator ||
                        auth.region_id ||
                        auth.region_use_initiator
                    );

                    if (hasFilters) {
                        const ruleParts: string[] = [];
                        if (auth.role_use_initiator) ruleParts.push('Role Inisiator');
                        else if (auth.role_id) {
                            const rName = roles.find((r: any) => String(r.id) === String(auth.role_id) || r.name === auth.role_id)?.name || auth.role_id;
                            ruleParts.push(`Role: ${rName}`);
                        }

                        if (auth.department_use_initiator) ruleParts.push('Unit Inisiator');
                        else if (auth.department_id) {
                            const dName = departments.find((d: any) => String(d.id) === String(auth.department_id))?.name || auth.department_id;
                            ruleParts.push(`Unit: ${dName}`);
                        }

                        if (ruleParts.length > 0) criteriaParts.push(ruleParts.join(' & '));

                        users.forEach((user: any) => {
                            const userRoleId = String(user.role_id || user.role || '');
                            const userDeptId = String(user.department_id || user.department?.id || '');
                            const userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
                            const userCompId = String(user.company_id || user.company?.id || '');
                            const userCgId = String(user.company_group_id || user.company?.company_group_id || '');
                            const userRegionId = String(user.region_id || user.company?.region_id || '');

                            let match = true;

                            if (auth.role_use_initiator) {
                                if (!simInitiatorUser) match = false;
                                else {
                                    const initRoleId = String(simInitiatorUser.role_id || simInitiatorUser.role || '');
                                    if (userRoleId !== initRoleId) match = false;
                                }
                            } else if (auth.role_id) {
                                const targetRole = roles.find((r: any) => String(r.id) === String(auth.role_id) || r.name === auth.role_id);
                                const matchRoleId = targetRole ? String(targetRole.id) : String(auth.role_id);
                                const matchRoleName = targetRole ? targetRole.name.toLowerCase() : String(auth.role_id).toLowerCase();
                                const isRoleMatch = userRoleId === matchRoleId || userRoleId.toLowerCase() === matchRoleName;
                                if (!isRoleMatch) match = false;
                            }

                            if (match && auth.department_use_initiator) {
                                if (!simInitiatorUser) match = false;
                                else {
                                    const initDeptId = String(simInitiatorUser.department_id || simInitiatorUser.department?.id || '');
                                    if (userDeptId !== initDeptId) match = false;
                                }
                            } else if (match && auth.department_id) {
                                if (userDeptId !== String(auth.department_id)) match = false;
                            }

                            if (match && auth.division_use_initiator) {
                                if (!simInitiatorUser) match = false;
                                else {
                                    const initDivId = String(simInitiatorUser.division_id || simInitiatorUser.division?.id || '');
                                    if (userDivId !== initDivId) match = false;
                                }
                            } else if (match && auth.division_id) {
                                if (userDivId !== String(auth.division_id)) match = false;
                            }

                            if (match && auth.company_group_use_initiator) {
                                if (!simInitiatorUser) match = false;
                                else {
                                    const initCg = String(simInitiatorUser.company_group_id || '');
                                    if (userCgId !== initCg) match = false;
                                }
                            } else if (match && auth.company_group_id) {
                                if (userCgId !== String(auth.company_group_id)) match = false;
                            }

                            if (match && auth.company_use_initiator) {
                                if (!simInitiatorUser) match = false;
                                else {
                                    const initC = String(simInitiatorUser.company_id || '');
                                    if (userCompId !== initC) match = false;
                                }
                            } else if (match && auth.company_id) {
                                if (userCompId !== String(auth.company_id)) match = false;
                            }

                            if (match && auth.region_use_initiator) {
                                if (!simInitiatorUser) match = false;
                                else {
                                    const initR = String(simInitiatorUser.region_id || '');
                                    if (userRegionId !== initR) match = false;
                                }
                            } else if (match && auth.region_id) {
                                if (userRegionId !== String(auth.region_id)) match = false;
                            }

                            if (match) {
                                const existing = matchedUsersMap.get(String(user.id)) || { user, reasons: [] };
                                existing.reasons.push(ruleParts.join(' & ') || 'Aturan Otoritas Sesuai');
                                matchedUsersMap.set(String(user.id), existing);
                            }
                        });
                    }
                }
            });
        } else {
            // 2. Fallback jika approver_authorities belum diisi, periksa approver_config atau approver_type
            const customActors = cfg.custom || (['initiator', 'assigned_pic', 'creator'].includes(step.approver_type) ? [step.approver_type] : []);
            const explicitUsers = cfg.users && cfg.users.length > 0 
                ? cfg.users 
                : (step.approver_type === 'user' ? (step.user_ids || []) : []);
            const targetRoles: string[] = cfg.roles && cfg.roles.length > 0 
                ? cfg.roles 
                : (step.approver_type === 'role' ? (step.role || []) : []);
            const targetDepts: string[] = cfg.departments && cfg.departments.length > 0 
                ? cfg.departments 
                : (step.approver_type === 'role' ? (step.department_ids || []) : []);

            const hasAnyConfig = customActors.length > 0 || explicitUsers.length > 0 || targetRoles.length > 0 || targetDepts.length > 0;

            if (hasAnyConfig) {
                if (customActors.includes('initiator')) {
                    criteriaParts.push('Inisiator');
                    dynamicList.push({
                        type: 'initiator',
                        label: 'Inisiator Kontrak',
                        description: 'Pengguna yang menginisiasi pengajuan kontrak.',
                        activeUser: simInitiatorUser,
                    });
                    if (simInitiatorUser) {
                        const existing = matchedUsersMap.get(String(simInitiatorUser.id)) || { user: simInitiatorUser, reasons: [] };
                        existing.reasons.push('Inisiator (Simulasi)');
                        matchedUsersMap.set(String(simInitiatorUser.id), existing);
                    }
                }

                if (customActors.includes('assigned_pic')) {
                    criteriaParts.push('PIC Ditugaskan');
                    dynamicList.push({
                        type: 'assigned_pic',
                        label: 'PIC Ditugaskan',
                        description: 'Pengguna yang ditugaskan sebagai PIC kontrak.',
                        activeUser: simPicUser,
                    });
                    if (simPicUser) {
                        const existing = matchedUsersMap.get(String(simPicUser.id)) || { user: simPicUser, reasons: [] };
                        existing.reasons.push('PIC Ditugaskan (Simulasi)');
                        matchedUsersMap.set(String(simPicUser.id), existing);
                    }
                }

                if (customActors.includes('creator')) {
                    criteriaParts.push('Pembuat Kontrak');
                    dynamicList.push({
                        type: 'creator',
                        label: 'Pembuat Kontrak',
                        description: 'Pengguna yang membuat draf kontrak.',
                        activeUser: simCreatorUser,
                    });
                    if (simCreatorUser) {
                        const existing = matchedUsersMap.get(String(simCreatorUser.id)) || { user: simCreatorUser, reasons: [] };
                        existing.reasons.push('Pembuat Kontrak (Simulasi)');
                        matchedUsersMap.set(String(simCreatorUser.id), existing);
                    }
                }

                if (customActors.includes('atasan')) {
                    criteriaParts.push('Atasan Langsung');
                    dynamicList.push({
                        type: 'atasan',
                        label: 'Atasan Langsung',
                        description: 'Atasan langsung dari inisiator pengajuan kontrak.',
                    });
                }

                if (explicitUsers.length > 0) {
                    criteriaParts.push(`${explicitUsers.length} User Spesifik`);
                    explicitUsers.forEach((userId: any) => {
                        const u = users.find((user: any) => String(user.id) === String(userId));
                        if (u) {
                            const existing = matchedUsersMap.get(String(u.id)) || { user: u, reasons: [] };
                            existing.reasons.push('User Ditugaskan Langsung');
                            matchedUsersMap.set(String(u.id), existing);
                        }
                    });
                }

                if (targetRoles.length > 0 || targetDepts.length > 0) {
                    if (targetRoles.length > 0) criteriaParts.push(`Role: ${targetRoles.join(', ')}`);
                    if (targetDepts.length > 0) {
                        const pool = divisions.length > 0 ? divisions : departments;
                        const deptNames = targetDepts.map((id: string) => pool.find((d: any) => String(d.id) === String(id))?.name || id);
                        criteriaParts.push(`Unit: ${deptNames.join(', ')}`);
                    }

                    users.forEach((u: any) => {
                        let roleMatch = targetRoles.length === 0;
                        let deptMatch = targetDepts.length === 0;

                        if (targetRoles.length > 0) {
                            const userRole = (u.role || '').toLowerCase();
                            const userRolesList = Array.isArray(u.roles) 
                                ? u.roles.map((r: any) => (typeof r === 'string' ? r : r.name || '').toLowerCase()) 
                                : [];
                            
                            roleMatch = targetRoles.some((r: string) => {
                                const lowR = r.toLowerCase();
                                return userRole === lowR || userRolesList.includes(lowR);
                            });
                        }

                        if (targetDepts.length > 0) {
                            const uDeptId = String(u.department_id || u.division_id || '');
                            deptMatch = targetDepts.some((dId: string) => String(dId) === uDeptId);
                        }

                        if (roleMatch && deptMatch) {
                            const existing = matchedUsersMap.get(String(u.id)) || { user: u, reasons: [] };
                            const reasons: string[] = [];
                            if (targetRoles.length > 0) reasons.push(`Role (${u.role || 'Sesuai'})`);
                            if (targetDepts.length > 0) reasons.push('Divisi Sesuai');
                            existing.reasons.push(reasons.join(' & '));
                            matchedUsersMap.set(String(u.id), existing);
                        }
                    });
                }
            }
        }

        if (criteriaParts.length === 0) {
            criteriaParts.push('Belum ada aktor / otoritas yang dikonfigurasi');
        }

        return {
            eligibleUsers: Array.from(matchedUsersMap.values()),
            dynamicRoles: dynamicList,
            criteriaSummary: criteriaParts.join(' • ') || '—',
        };
    }, [
        step.approver_authorities,
        step.approver_config,
        step.approver_type,
        step.role,
        step.department_ids,
        step.user_ids,
        users,
        roles,
        departments,
        divisions,
        simInitiatorUser,
        simPicUser,
        simCreatorUser,
    ]);

    // Filter daftar pengguna berdasarkan pencarian
    const filteredEligibleUsers = useMemo(() => {
        if (!searchQuery.trim()) return eligibleUsers;
        const q = searchQuery.toLowerCase();
        return eligibleUsers.filter(({ user }) => {
            const name = (user.name || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const role = (user.role || '').toLowerCase();
            const dept = (getDeptName(user) || '').toLowerCase();
            const div = (getDivName(user) || '').toLowerCase();
            return name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q) || div.includes(q);
        });
    }, [eligibleUsers, searchQuery, departments, divisions]);

    const totalCount = eligibleUsers.length;

    return (
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
            <Popover className="relative">
                {({ close }) => (
                    <>
                        <PopoverTrigger
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "relative flex h-7 items-center justify-center gap-1 px-1.5 rounded-md transition-all cursor-pointer select-none",
                                totalCount > 0
                                    ? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                            title={`Daftar Pengguna Berhak Akses (${totalCount} orang)`}
                        >
                            <UserCheck size={12} />
                            {totalCount > 0 && (
                                <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-md bg-indigo-600 dark:bg-indigo-500 text-[9.5px] font-medium text-white shadow-2xs leading-none">
                                    {totalCount}
                                </span>
                            )}
                        </PopoverTrigger>

                        <PopoverContent
                            align="end"
                            className="w-84 sm:w-96 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 shadow-2xl space-y-2.5 z-[9999]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                                <div className="flex items-center gap-1.5">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <Users size={13} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-slate-900 dark:text-zinc-100 leading-none">
                                            Pengguna Berhak Akses
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">
                                            Tahap #{step.step || idx + 1}
                                        </span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 rounded-md border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                                    {totalCount} Pengguna
                                </Badge>
                            </div>

                            {/* Kriteria Akses Singkat */}
                            <div className="rounded-lg bg-slate-50 dark:bg-zinc-900 p-2 border border-slate-100 dark:border-zinc-800 text-[11px] space-y-1">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                    <Shield size={10} className="text-primary" />
                                    <span>Kriteria Otoritas Aktor</span>
                                </div>
                                <p className="text-slate-800 dark:text-zinc-200 leading-snug font-medium line-clamp-2">
                                    {criteriaSummary}
                                </p>
                            </div>

                            {/* Info Peran Dinamis (Inisiator / PIC / Atasan) */}
                            {dynamicRoles.length > 0 && (
                                <div className="space-y-1.5 pt-0.5">
                                    {dynamicRoles.map((dr, dIdx) => (
                                        <div
                                            key={dIdx}
                                            className="flex items-start justify-between gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px]"
                                        >
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                                    <span className="font-medium text-amber-900 dark:text-amber-300">
                                                        {dr.label}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                    {dr.description}
                                                </p>
                                                {dr.activeUser && (
                                                    <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-medium pt-0.5 space-y-0.5">
                                                        <div className="flex items-center gap-1">
                                                            <UserCheck size={11} />
                                                            <span>Terpilih: {dr.activeUser.name}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-muted-foreground pl-3.5">
                                                            {dr.activeUser.role && <span>{dr.activeUser.role}</span>}
                                                            {getDeptName(dr.activeUser) && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>Unit: {getDeptName(dr.activeUser)}</span>
                                                                </>
                                                            )}
                                                            {getDivName(dr.activeUser) && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>Divisi: {getDivName(dr.activeUser)}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {!dr.activeUser && onOpenSimulationModal && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        close();
                                                        onOpenSimulationModal();
                                                    }}
                                                    className="h-6 text-[10px] px-2 font-medium text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10 shrink-0 cursor-pointer"
                                                >
                                                    Simulasi
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Search Box */}
                            {totalCount > 4 && (
                                <div className="relative">
                                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari nama, role, unit, atau divisi..."
                                        className="w-full h-8 pl-8 pr-3 text-[11px] rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                                    />
                                </div>
                            )}

                            {/* User List */}
                            <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar p-0.5">
                                {filteredEligibleUsers.length === 0 ? (
                                    <div className="py-6 text-center text-muted-foreground space-y-1">
                                        <User size={20} className="mx-auto opacity-40" />
                                        <p className="text-xs font-medium">
                                            {searchQuery ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna yang berhak akses'}
                                        </p>
                                        <p className="text-[10px]">
                                            {searchQuery 
                                                ? 'Coba gunakan kata kunci lain' 
                                                : 'Atur aktor & otoritas di tab Konfigurasi Langkah untuk memberi hak akses'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredEligibleUsers.map(({ user, reasons }, uIdx) => {
                                        const deptName = getDeptName(user);
                                        const divName = getDivName(user);

                                        return (
                                            <div
                                                key={user.id || uIdx}
                                                className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-800 transition-colors"
                                            >
                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-[10.5px] font-medium border border-border/50 uppercase mt-0.5">
                                                        {(user.name || user.email || 'U').substring(0, 2)}
                                                    </div>
                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                        <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate leading-tight">
                                                            {user.name}
                                                        </p>
                                                        
                                                        {/* Role & Email */}
                                                        <p className="text-[10px] text-muted-foreground truncate leading-tight">
                                                            {user.role || 'User'} {user.email && <span className="opacity-70">({user.email})</span>}
                                                        </p>

                                                        {/* Department & Division */}
                                                        {(deptName || divName) && (
                                                            <div className="flex flex-wrap items-center gap-1 text-[9.5px] text-slate-500 dark:text-zinc-400 pt-0.5">
                                                                {deptName && (
                                                                    <span className="inline-flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded text-[9px] border border-slate-200/50 dark:border-zinc-700/50">
                                                                        <Building2 size={9} className="text-primary/70 shrink-0" />
                                                                        <span className="truncate max-w-[130px]">{deptName}</span>
                                                                    </span>
                                                                )}
                                                                {divName && (
                                                                    <span className="inline-flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded text-[9px] border border-slate-200/50 dark:border-zinc-700/50">
                                                                        <Briefcase size={9} className="text-indigo-500/70 shrink-0" />
                                                                        <span className="truncate max-w-[130px]">{divName}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-0.5 shrink-0 pt-0.5">
                                                    {reasons.map((r, rIdx) => (
                                                        <Badge
                                                            key={rIdx}
                                                            variant="secondary"
                                                            className="text-[9px] font-medium px-1.5 py-0.2 rounded-md border-border/50 text-muted-foreground max-w-[110px] truncate"
                                                        >
                                                            {r}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-muted-foreground">
                                <span>Total {totalCount} orang berhak akses</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => close()}
                                    className="h-6 px-2 text-[10.5px] font-medium"
                                >
                                    Tutup
                                </Button>
                            </div>
                        </PopoverContent>
                    </>
                )}
            </Popover>
        </div>
    );
}
