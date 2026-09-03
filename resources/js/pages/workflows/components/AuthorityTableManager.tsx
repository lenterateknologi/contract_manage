import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trash2, Plus, Shield, Pencil, Search, Users, CheckCircle2, XCircle, Info, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialogs/Dialog';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { cn } from '@/lib/utils';
interface AuthorityItem {
    id?: string;
    authority_type: string;
    role_id?: string | null;
    department_id?: string | null;
    division_id?: string | null;
    user_id?: string | null;
    company_group_id?: string | null;
    company_id?: string | null;
    region_id?: string | null;
    role_use_initiator?: boolean;
    department_use_initiator?: boolean;
    division_use_initiator?: boolean;
    company_group_use_initiator?: boolean;
    company_use_initiator?: boolean;
    region_use_initiator?: boolean;
}

interface AuthorityTableManagerProps {
    authorities: AuthorityItem[];
    onChange: (authorities: AuthorityItem[]) => void;
    users: any[];
    roles: any[];
    departments: any[];
    divisions?: any[];
    companyGroups: any[];
    companies?: any[];
    regions: any[];
    title?: string;
    showCustom?: boolean;
    showCombinations?: boolean;
    showInitiatorOption?: boolean;
    simulationContext?: {
        initiatorId?: string;
        picId?: string;
        creatorId?: string;
    };
    onOpenSimulationModal?: () => void;
}

export default function AuthorityTableManager({
    authorities = [],
    onChange,
    users = [],
    roles = [],
    departments = [],
    divisions = [],
    companyGroups = [],
    companies = [],
    regions = [],
    title = 'Otoritas Akses',
    showCustom = false,
    showCombinations = true,
    showInitiatorOption = true,
    simulationContext,
    onOpenSimulationModal,
}: AuthorityTableManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [isBulkEdit, setIsBulkEdit] = useState<boolean>(false);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // Sorting state
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Simulator dropdown state
    const [isSimOpen, setIsSimOpen] = useState(false);
    const [simSearch, setSimSearch] = useState('');
    const simRef = useRef<HTMLDivElement>(null);

    // Arrays for multi-select (for individuals)
    const [modalUserIds, setModalUserIds] = useState<string[]>([]);
    const [modalCustomIds, setModalCustomIds] = useState<string[]>([]);

    // Multi select for combinations
    const [modalRoleIds, setModalRoleIds] = useState<string[]>([]);
    const [modalDepartmentIds, setModalDepartmentIds] = useState<string[]>([]);
    const [modalDivisionIds, setModalDivisionIds] = useState<string[]>([]);
    const [modalCompanyGroupIds, setModalCompanyGroupIds] = useState<string[]>([]);
    const [modalCompanyIds, setModalCompanyIds] = useState<string[]>([]);
    const [modalRegionIds, setModalRegionIds] = useState<string[]>([]);
    
    // Per-dimension initiator flags
    const [roleUseInitiator, setRoleUseInitiator] = useState<boolean>(false);
    const [departmentUseInitiator, setDepartmentUseInitiator] = useState<boolean>(false);
    const [divisionUseInitiator, setDivisionUseInitiator] = useState<boolean>(false);
    const [companyGroupUseInitiator, setCompanyGroupUseInitiator] = useState<boolean>(false);
    const [companyUseInitiator, setCompanyUseInitiator] = useState<boolean>(false);
    const [regionUseInitiator, setRegionUseInitiator] = useState<boolean>(false);

    // Close simulator dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (simRef.current && !simRef.current.contains(e.target as Node)) {
                setIsSimOpen(false);
            }
        };
        if (isSimOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSimOpen]);

    // Filter only items where is_used is true (hardcode filter)
    const activeUsers = React.useMemo(() => (users || []).filter(u => u.is_used !== false && u.is_used !== 0 && String(u.is_used) !== '0'), [users]);
    const activeDepartments = React.useMemo(() => (departments || []).filter(d => d.is_used !== false && d.is_used !== 0 && String(d.is_used) !== '0'), [departments]);
    const activeDivisions = React.useMemo(() => (divisions || []).filter(d => d.is_used !== false && d.is_used !== 0 && String(d.is_used) !== '0'), [divisions]);
    const activeCompanyGroups = React.useMemo(() => (companyGroups || []).filter(cg => cg.is_used !== false && cg.is_used !== 0 && String(cg.is_used) !== '0'), [companyGroups]);
    const activeCompanies = React.useMemo(() => (companies || []).filter(c => c.is_used !== false && c.is_used !== 0 && String(c.is_used) !== '0'), [companies]);
    const activeRegions = React.useMemo(() => (regions || []).filter(r => r.is_used !== false && r.is_used !== 0 && String(r.is_used) !== '0'), [regions]);

    const handleIndividualChange = (type: 'user' | 'custom', val: string[]) => {
        if (type === 'custom') setModalCustomIds(val);
        if (type === 'user') setModalUserIds(val);

        if (val.length > 0) {
            setModalRoleIds([]);
            setModalDepartmentIds([]);
            setModalDivisionIds([]);
            setModalCompanyGroupIds([]);
            setModalCompanyIds([]);
            setModalRegionIds([]);
            setRoleUseInitiator(false);
            setDepartmentUseInitiator(false);
            setDivisionUseInitiator(false);
            setCompanyGroupUseInitiator(false);
            setCompanyUseInitiator(false);
            setRegionUseInitiator(false);
        }
    };

    const handleGroupChange = (type: string, val: string[]) => {
        if (type === 'role') setModalRoleIds(val);
        if (type === 'department') setModalDepartmentIds(val);
        if (type === 'division') setModalDivisionIds(val);
        if (type === 'company_group') setModalCompanyGroupIds(val);
        if (type === 'company') setModalCompanyIds(val);
        if (type === 'region') setModalRegionIds(val);

        if (val && val.length > 0) {
            setModalCustomIds([]);
            setModalUserIds([]);
        }
    };

    const openModal = () => {
        setEditIndex(null);
        setIsBulkEdit(false);
        setModalUserIds([]);
        setModalCustomIds([]);
        setModalRoleIds([]);
        setModalDepartmentIds([]);
        setModalDivisionIds([]);
        setModalCompanyGroupIds([]);
        setModalCompanyIds([]);
        setModalRegionIds([]);
        setRoleUseInitiator(false);
        setDepartmentUseInitiator(false);
        setDivisionUseInitiator(false);
        setCompanyGroupUseInitiator(false);
        setCompanyUseInitiator(false);
        setRegionUseInitiator(false);
        setIsModalOpen(true);
    };

    const openBulkEditModal = () => {
        if (selectedIndices.length === 0) return;
        setEditIndex(null);
        setIsBulkEdit(true);

        // Pre-fill with the first selected item values as initial template
        const firstAuth = authorities[selectedIndices[0]];
        setModalUserIds([]);
        setModalCustomIds([]);
        setModalRoleIds([]);
        setModalDepartmentIds([]);
        setModalDivisionIds([]);
        setModalCompanyGroupIds([]);
        setModalCompanyIds([]);
        setModalRegionIds([]);
        setRoleUseInitiator(false);
        setDepartmentUseInitiator(false);
        setDivisionUseInitiator(false);
        setCompanyGroupUseInitiator(false);
        setCompanyUseInitiator(false);
        setRegionUseInitiator(false);

        if (firstAuth) {
            if (firstAuth.authority_type === 'custom' && firstAuth.user_id) {
                setModalCustomIds([firstAuth.user_id]);
            } else if (firstAuth.authority_type === 'user' && firstAuth.user_id) {
                setModalUserIds([firstAuth.user_id]);
            } else {
                if (firstAuth.role_id) setModalRoleIds([firstAuth.role_id]);
                if (firstAuth.department_id) setModalDepartmentIds([firstAuth.department_id]);
                if (firstAuth.division_id) setModalDivisionIds([firstAuth.division_id]);
                if (firstAuth.company_group_id) setModalCompanyGroupIds([firstAuth.company_group_id]);
                if (firstAuth.company_id) setModalCompanyIds([firstAuth.company_id]);
                if (firstAuth.region_id) setModalRegionIds([firstAuth.region_id]);

                if (firstAuth.role_use_initiator) setRoleUseInitiator(true);
                if (firstAuth.department_use_initiator) setDepartmentUseInitiator(true);
                if (firstAuth.division_use_initiator) setDivisionUseInitiator(true);
                if (firstAuth.company_group_use_initiator) setCompanyGroupUseInitiator(true);
                if (firstAuth.company_use_initiator) setCompanyUseInitiator(true);
                if (firstAuth.region_use_initiator) setRegionUseInitiator(true);
            }
        }

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditIndex(null);
        setIsBulkEdit(false);
    };

    const editAuthority = (index: number) => {
        const auth = authorities[index];
        setEditIndex(index);
        setIsBulkEdit(false);
        
        // Reset fields first
        setModalUserIds([]);
        setModalCustomIds([]);
        setModalRoleIds([]);
        setModalDepartmentIds([]);
        setModalDivisionIds([]);
        setModalCompanyGroupIds([]);
        setModalCompanyIds([]);
        setModalRegionIds([]);
        setRoleUseInitiator(false);
        setDepartmentUseInitiator(false);
        setDivisionUseInitiator(false);
        setCompanyGroupUseInitiator(false);
        setCompanyUseInitiator(false);
        setRegionUseInitiator(false);

        if (auth.authority_type === 'custom' && auth.user_id) {
            setModalCustomIds([auth.user_id]);
        } else if (auth.authority_type === 'user' && auth.user_id) {
            setModalUserIds([auth.user_id]);
        } else {
            // Group combination
            if (auth.role_id) setModalRoleIds([auth.role_id]);
            if (auth.department_id) setModalDepartmentIds([auth.department_id]);
            if (auth.division_id) setModalDivisionIds([auth.division_id]);
            if (auth.company_group_id) setModalCompanyGroupIds([auth.company_group_id]);
            if (auth.company_id) setModalCompanyIds([auth.company_id]);
            if (auth.region_id) setModalRegionIds([auth.region_id]);
            
            if (auth.role_use_initiator) setRoleUseInitiator(true);
            if (auth.department_use_initiator) setDepartmentUseInitiator(true);
            if (auth.division_use_initiator) setDivisionUseInitiator(true);
            if (auth.company_group_use_initiator) setCompanyGroupUseInitiator(true);
            if (auth.company_use_initiator) setCompanyUseInitiator(true);
            if (auth.region_use_initiator) setRegionUseInitiator(true);
        }

        setIsModalOpen(true);
    };

    const handleSave = () => {
        const newAuths: AuthorityItem[] = [];

        // Save Individuals
        if (modalCustomIds.length > 0) {
            modalCustomIds.forEach(id => newAuths.push({ authority_type: 'custom', user_id: id }));
        }
        if (modalUserIds.length > 0) {
            modalUserIds.forEach(id => newAuths.push({ authority_type: 'user', user_id: id }));
        }

        // Save Group Combinations
        const hasAnyCombination =
            modalRoleIds.length > 0 ||
            modalDepartmentIds.length > 0 ||
            modalDivisionIds.length > 0 ||
            modalCompanyGroupIds.length > 0 ||
            modalCompanyIds.length > 0 ||
            modalRegionIds.length > 0 ||
            roleUseInitiator ||
            departmentUseInitiator ||
            divisionUseInitiator ||
            companyGroupUseInitiator ||
            companyUseInitiator ||
            regionUseInitiator;

        if (hasAnyCombination) {
            const roleList = roleUseInitiator ? [null] : (modalRoleIds.length > 0 ? modalRoleIds : [null]);
            const deptList = departmentUseInitiator ? [null] : (modalDepartmentIds.length > 0 ? modalDepartmentIds : [null]);
            const divList = divisionUseInitiator ? [null] : (modalDivisionIds.length > 0 ? modalDivisionIds : [null]);
            const cgList = companyGroupUseInitiator ? [null] : (modalCompanyGroupIds.length > 0 ? modalCompanyGroupIds : [null]);
            const compList = companyUseInitiator ? [null] : (modalCompanyIds.length > 0 ? modalCompanyIds : [null]);
            const regList = regionUseInitiator ? [null] : (modalRegionIds.length > 0 ? modalRegionIds : [null]);

            for (const r of roleList) {
                for (const d of deptList) {
                    for (const div of divList) {
                        for (const cg of cgList) {
                            for (const c of compList) {
                                for (const reg of regList) {
                                    newAuths.push({
                                        authority_type: 'group',
                                        role_id: r || undefined,
                                        department_id: d || undefined,
                                        division_id: div || undefined,
                                        company_group_id: cg || undefined,
                                        company_id: c || undefined,
                                        region_id: reg || undefined,
                                        role_use_initiator: roleUseInitiator,
                                        department_use_initiator: departmentUseInitiator,
                                        division_use_initiator: divisionUseInitiator,
                                        company_group_use_initiator: companyGroupUseInitiator,
                                        company_use_initiator: companyUseInitiator,
                                        region_use_initiator: regionUseInitiator,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        if (newAuths.length > 0) {
            if (isBulkEdit) {
                // Replace all selected indices with the newAuths
                const toReplaceSet = new Set(selectedIndices);
                const updated: AuthorityItem[] = [];
                let inserted = false;
                authorities.forEach((auth, idx) => {
                    if (toReplaceSet.has(idx)) {
                        if (!inserted) {
                            updated.push(...newAuths);
                            inserted = true;
                        }
                    } else {
                        updated.push(auth);
                    }
                });
                onChange(updated);
                setSelectedIndices([]);
            } else if (editIndex !== null) {
                // If editing single item
                const updated = [...authorities];
                updated.splice(editIndex, 1, ...newAuths);
                onChange(updated);
            } else {
                onChange([...authorities, ...newAuths]);
            }
        } else if (isBulkEdit) {
            // If cleared during bulk edit, remove selected items
            const toDeleteSet = new Set(selectedIndices);
            const remaining = authorities.filter((_, idx) => !toDeleteSet.has(idx));
            onChange(remaining);
            setSelectedIndices([]);
        } else if (editIndex !== null) {
            // If they cleared everything during edit, treat as remove
            const updated = [...authorities];
            updated.splice(editIndex, 1);
            onChange(updated);
        }
        
        closeModal();
    };

    const removeAuthority = (indexToRemove: number) => {
        onChange(authorities.filter((_, idx) => idx !== indexToRemove));
        setSelectedIndices(prev => prev.filter(idx => idx !== indexToRemove).map(idx => idx > indexToRemove ? idx - 1 : idx));
    };

    const formatUserDetail = (u: any) => {
        const pt = u.company?.name || u.company_name || '';
        const dept = u.department?.name || u.org_name || '';
        const role = u.role || '';
        const details = [role, pt, dept].filter(Boolean).join(' • ');
        return details ? `${u.name} (${details})` : u.name;
    };

    const getUserLabel = (id?: string) => {
        if (!id) return '-';
        const u = users.find(user => String(user.id) === id);
        return u ? formatUserDetail(u) : id;
    };
    const getRoleLabel = (id?: string) => {
        if (!id) return '-';
        return roles.find(r => String(r.id) === id || r.name === id)?.name || id;
    };
    const getDeptLabel = (id?: string) => {
        if (!id) return '-';
        return departments.find(d => String(d.id) === id)?.name || id;
    };
    const getDivLabel = (id?: string) => {
        if (!id) return '-';
        return divisions.find(d => String(d.id) === id)?.name || id;
    };
    const getCompanyGroupLabel = (id?: string) => {
        if (!id) return '-';
        return companyGroups.find(cg => String(cg.id) === id)?.name || id;
    };
    const getCompanyLabel = (id?: string) => {
        if (!id) return '-';
        return companies.find(c => String(c.id) === id)?.name || id;
    };
    const getRegionLabel = (id?: string) => {
        if (!id) return '-';
        return regions.find(r => String(r.id) === id)?.name || id;
    };

    const getCustomLabel = (id?: string) => {
        if (!id) return '-';
        if (id === 'initiator') return 'INISIATOR';
        if (id === 'assigned_pic') return 'PIC DITUGASKAN';
        if (id === 'creator') return 'PEMBUAT';
        return id;
    };

    // Pengguna simulasi untuk Inisiator, PIC, dan Creator jika disediakan
    const simInitiatorUser = useMemo(() => {
        if (!simulationContext?.initiatorId) return null;
        return activeUsers.find(u => String(u.id) === String(simulationContext.initiatorId)) || null;
    }, [simulationContext?.initiatorId, activeUsers]);

    const simPicUser = useMemo(() => {
        if (!simulationContext?.picId) return null;
        return activeUsers.find(u => String(u.id) === String(simulationContext.picId)) || null;
    }, [simulationContext?.picId, activeUsers]);

    const simCreatorUser = useMemo(() => {
        if (!simulationContext?.creatorId) return null;
        return activeUsers.find(u => String(u.id) === String(simulationContext.creatorId)) || null;
    }, [simulationContext?.creatorId, activeUsers]);

    // Helper untuk menghitung jumlah orang per baris aturan otoritas
    const getAuthorityUserCount = (auth?: AuthorityItem) => {
        if (!auth || !activeUsers || activeUsers.length === 0) return 0;
        if (auth.authority_type === 'custom') {
            const customType = auth.role_id || auth.user_id;
            if (customType === 'initiator') return simInitiatorUser ? 1 : 0;
            if (customType === 'assigned_pic') return simPicUser ? 1 : 0;
            if (customType === 'creator') return simCreatorUser ? 1 : 0;
            return 0;
        }
        if (auth.authority_type === 'user' && auth.user_id) {
            return activeUsers.some(u => String(u.id) === String(auth.user_id)) ? 1 : 0;
        }
        if (auth.authority_type === 'group' || !auth.authority_type) {
            return activeUsers.filter(user => {
                const userRoleId = String(user.role_id || user.role || '');
                const userDeptId = String(user.department_id || user.department?.id || '');
                const userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
                const userCompId = String(user.company_id || user.company?.id || '');
                const userCgId = String(user.company_group_id || user.company?.company_group_id || '');
                const userRegionId = String(user.region_id || user.company?.region_id || '');

                if (auth.role_use_initiator) {
                    if (simInitiatorUser) {
                        const initRoleId = String(simInitiatorUser.role_id || simInitiatorUser.role || '');
                        if (userRoleId !== initRoleId) return false;
                    }
                } else if (auth.role_id) {
                    const targetRole = roles.find(r => String(r.id) === String(auth.role_id) || r.name === auth.role_id);
                    const matchRoleId = targetRole ? String(targetRole.id) : String(auth.role_id);
                    const matchRoleName = targetRole ? targetRole.name.toLowerCase() : String(auth.role_id).toLowerCase();
                    const isRoleMatch = userRoleId === matchRoleId || userRoleId.toLowerCase() === matchRoleName;
                    if (!isRoleMatch) return false;
                }

                if (auth.department_use_initiator) {
                    if (simInitiatorUser) {
                        const initDeptId = String(simInitiatorUser.department_id || simInitiatorUser.department?.id || '');
                        if (userDeptId !== initDeptId) return false;
                    }
                } else if (auth.department_id) {
                    if (userDeptId !== String(auth.department_id)) return false;
                }

                if (auth.division_use_initiator) {
                    if (simInitiatorUser) {
                        const initDivId = String(simInitiatorUser.division_id || simInitiatorUser.division?.id || simInitiatorUser.department?.division_id || '');
                        if (userDivId !== initDivId) return false;
                    }
                } else if (auth.division_id) {
                    if (userDivId !== String(auth.division_id)) return false;
                }

                if (auth.company_group_use_initiator) {
                    if (simInitiatorUser) {
                        const initCgId = String(simInitiatorUser.company_group_id || simInitiatorUser.company?.company_group_id || '');
                        if (userCgId !== initCgId) return false;
                    }
                } else if (auth.company_group_id) {
                    if (userCgId !== String(auth.company_group_id)) return false;
                }

                if (auth.company_use_initiator) {
                    if (simInitiatorUser) {
                        const initCompId = String(simInitiatorUser.company_id || simInitiatorUser.company?.id || '');
                        if (userCompId !== initCompId) return false;
                    }
                } else if (auth.company_id) {
                    if (userCompId !== String(auth.company_id)) return false;
                }

                if (auth.region_use_initiator) {
                    if (simInitiatorUser) {
                        const initRegionId = String(simInitiatorUser.region_id || simInitiatorUser.company?.region_id || '');
                        if (userRegionId !== initRegionId) return false;
                    }
                } else if (auth.region_id) {
                    if (userRegionId !== String(auth.region_id)) return false;
                }

                return true;
            }).length;
        }
        return 0;
    };

    const toggleSort = (field: string) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else {
                setSortField(null);
                setSortDirection('asc');
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filtered and Sorted Authorities
    const filteredAuthorities = useMemo(() => {
        let result = (authorities || []).filter(Boolean).map((auth, index) => ({
            ...auth,
            auth,
            originalIndex: index,
        }));

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(item => {
                const auth = item.auth || item;
                if (!auth) return false;
                if (auth.authority_type === 'custom') {
                    const label = getCustomLabel(auth.role_id || undefined).toLowerCase();
                    return label.includes(q);
                }
                if (auth.authority_type === 'user') {
                    const u = users.find(x => String(x.id) === String(auth.user_id));
                    const name = (u?.name || auth.user_id || '').toLowerCase();
                    const email = (u?.email || '').toLowerCase();
                    const role = (u?.role || '').toLowerCase();
                    return name.includes(q) || email.includes(q) || role.includes(q);
                }
                if (auth.authority_type === 'group' || !auth.authority_type) {
                    const roleName = auth.role_use_initiator ? 'sesuai inisiator' : (getRoleLabel(auth.role_id || undefined) || '').toLowerCase();
                    const deptName = auth.department_use_initiator ? 'sesuai inisiator' : (getDeptLabel(auth.department_id || undefined) || '').toLowerCase();
                    const divName = auth.division_use_initiator ? 'sesuai inisiator' : (getDivLabel(auth.division_id || undefined) || '').toLowerCase();
                    const cgName = auth.company_group_use_initiator ? 'sesuai inisiator' : (getCompanyGroupLabel(auth.company_group_id || undefined) || '').toLowerCase();
                    const compName = auth.company_use_initiator ? 'sesuai inisiator' : (getCompanyLabel(auth.company_id || undefined) || '').toLowerCase();
                    const regName = auth.region_use_initiator ? 'sesuai inisiator' : (getRegionLabel(auth.region_id || undefined) || '').toLowerCase();

                    return roleName.includes(q) || deptName.includes(q) || divName.includes(q) ||
                           cgName.includes(q) || compName.includes(q) || regName.includes(q);
                }
                return false;
            });
        }

        if (sortField) {
            result.sort((a, b) => {
                let valA = '';
                let valB = '';

                if (sortField === 'type') {
                    valA = a.authority_type || 'group';
                    valB = b.authority_type || 'group';
                } else if (sortField === 'role') {
                    valA = a.role_use_initiator ? 'Sesuai Inisiator' : (getRoleLabel(a.role_id || undefined) || '');
                    valB = b.role_use_initiator ? 'Sesuai Inisiator' : (getRoleLabel(b.role_id || undefined) || '');
                } else if (sortField === 'department') {
                    valA = a.department_use_initiator ? 'Sesuai Inisiator' : (getDeptLabel(a.department_id || undefined) || '');
                    valB = b.department_use_initiator ? 'Sesuai Inisiator' : (getDeptLabel(b.department_id || undefined) || '');
                } else if (sortField === 'division') {
                    valA = a.division_use_initiator ? 'Sesuai Inisiator' : (getDivLabel(a.division_id || undefined) || '');
                    valB = b.division_use_initiator ? 'Sesuai Inisiator' : (getDivLabel(b.division_id || undefined) || '');
                } else if (sortField === 'companyGroup') {
                    valA = a.company_group_use_initiator ? 'Sesuai Inisiator' : (getCompanyGroupLabel(a.company_group_id || undefined) || '');
                    valB = b.company_group_use_initiator ? 'Sesuai Inisiator' : (getCompanyGroupLabel(b.company_group_id || undefined) || '');
                } else if (sortField === 'company') {
                    valA = a.company_use_initiator ? 'Sesuai Inisiator' : (getCompanyLabel(a.company_id || undefined) || '');
                    valB = b.company_use_initiator ? 'Sesuai Inisiator' : (getCompanyLabel(b.company_id || undefined) || '');
                } else if (sortField === 'region') {
                    valA = a.region_use_initiator ? 'Sesuai Inisiator' : (getRegionLabel(a.region_id || undefined) || '');
                    valB = b.region_use_initiator ? 'Sesuai Inisiator' : (getRegionLabel(b.region_id || undefined) || '');
                } else if (sortField === 'user') {
                    const uA = users.find(x => String(x.id) === String(a.user_id));
                    const uB = users.find(x => String(x.id) === String(b.user_id));
                    valA = uA?.name || '';
                    valB = uB?.name || '';
                } else if (sortField === 'userCount') {
                    const countA = getAuthorityUserCount(a);
                    const countB = getAuthorityUserCount(b);
                    return sortDirection === 'asc' ? countA - countB : countB - countA;
                }

                const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [authorities, searchQuery, sortField, sortDirection, users, roles, departments, divisions, companyGroups, companies, regions, getAuthorityUserCount]);

    const isAllFilteredSelected = filteredAuthorities.length > 0 && filteredAuthorities.every(f => selectedIndices.includes(f.originalIndex));

    const toggleSelectAll = () => {
        if (isAllFilteredSelected) {
            const currentFilteredSet = new Set(filteredAuthorities.map(f => f.originalIndex));
            setSelectedIndices(prev => prev.filter(idx => !currentFilteredSet.has(idx)));
        } else {
            const newIndices = Array.from(new Set([...selectedIndices, ...filteredAuthorities.map(f => f.originalIndex)]));
            setSelectedIndices(newIndices);
        }
    };

    const toggleSelectRow = (originalIndex: number) => {
        if (selectedIndices.includes(originalIndex)) {
            setSelectedIndices(prev => prev.filter(idx => idx !== originalIndex));
        } else {
            setSelectedIndices(prev => [...prev, originalIndex]);
        }
    };

    const handleBulkDelete = () => {
        if (selectedIndices.length === 0) return;
        const toDeleteSet = new Set(selectedIndices);
        const remaining = authorities.filter((_, idx) => !toDeleteSet.has(idx));
        onChange(remaining);
        setSelectedIndices([]);
    };

    // Evaluasi Pengguna yang Mendapatkan Akses (Simulasi Akses)
    const matchedUsers = useMemo(() => {
        if (!authorities || authorities.length === 0) return [];
        return activeUsers.filter((user) => {
            const userId = String(user.id);
            const userRoleId = String(user.role_id || user.role || '');
            const userDeptId = String(user.department_id || user.department?.id || '');
            const userDivId = String(user.division_id || user.division?.id || user.department?.division_id || '');
            const userCompId = String(user.company_id || user.company?.id || '');
            const userCgId = String(user.company_group_id || user.company?.company_group_id || '');
            const userRegionId = String(user.region_id || user.company?.region_id || '');

            return authorities.some((auth) => {
                // Custom Actor match (Initiator, Assigned PIC, Creator)
                if (auth.authority_type === 'custom') {
                    const customType = auth.role_id || auth.user_id;
                    if (customType === 'initiator' && simInitiatorUser) {
                        return String(simInitiatorUser.id) === userId;
                    }
                    if (customType === 'assigned_pic' && simPicUser) {
                        return String(simPicUser.id) === userId;
                    }
                    if (customType === 'creator' && simCreatorUser) {
                        return String(simCreatorUser.id) === userId;
                    }
                    return false;
                }

                // Personal direct user
                if (auth.authority_type === 'user' && auth.user_id) {
                    return String(auth.user_id) === userId;
                }

                // Group combination match
                if (auth.authority_type === 'group' || !auth.authority_type) {
                    // Cek Role
                    if (auth.role_use_initiator) {
                        if (simInitiatorUser) {
                            const initRoleId = String(simInitiatorUser.role_id || simInitiatorUser.role || '');
                            if (userRoleId !== initRoleId) return false;
                        }
                    } else if (auth.role_id) {
                        const targetRole = roles.find(r => String(r.id) === String(auth.role_id) || r.name === auth.role_id);
                        const matchRoleId = targetRole ? String(targetRole.id) : String(auth.role_id);
                        const matchRoleName = targetRole ? targetRole.name.toLowerCase() : String(auth.role_id).toLowerCase();
                        const isRoleMatch = userRoleId === matchRoleId || userRoleId.toLowerCase() === matchRoleName;
                        if (!isRoleMatch) return false;
                    }

                    // Cek Departemen
                    if (auth.department_use_initiator) {
                        if (simInitiatorUser) {
                            const initDeptId = String(simInitiatorUser.department_id || simInitiatorUser.department?.id || '');
                            if (userDeptId !== initDeptId) return false;
                        }
                    } else if (auth.department_id) {
                        if (userDeptId !== String(auth.department_id)) return false;
                    }

                    // Cek Divisi
                    if (auth.division_use_initiator) {
                        if (simInitiatorUser) {
                            const initDivId = String(simInitiatorUser.division_id || simInitiatorUser.division?.id || simInitiatorUser.department?.division_id || '');
                            if (userDivId !== initDivId) return false;
                        }
                    } else if (auth.division_id) {
                        if (userDivId !== String(auth.division_id)) return false;
                    }

                    // Cek Company Group
                    if (auth.company_group_use_initiator) {
                        if (simInitiatorUser) {
                            const initCgId = String(simInitiatorUser.company_group_id || simInitiatorUser.company?.company_group_id || '');
                            if (userCgId !== initCgId) return false;
                        }
                    } else if (auth.company_group_id) {
                        if (userCgId !== String(auth.company_group_id)) return false;
                    }

                    // Cek Perusahaan PT
                    if (auth.company_use_initiator) {
                        if (simInitiatorUser) {
                            const initCompId = String(simInitiatorUser.company_id || simInitiatorUser.company?.id || '');
                            if (userCompId !== initCompId) return false;
                        }
                    } else if (auth.company_id) {
                        if (userCompId !== String(auth.company_id)) return false;
                    }

                    // Cek Wilayah
                    if (auth.region_use_initiator) {
                        if (simInitiatorUser) {
                            const initRegionId = String(simInitiatorUser.region_id || simInitiatorUser.company?.region_id || '');
                            if (userRegionId !== initRegionId) return false;
                        }
                    } else if (auth.region_id) {
                        if (userRegionId !== String(auth.region_id)) return false;
                    }

                    return true;
                }
                return false;
            });
        });
    }, [authorities, activeUsers, roles, simInitiatorUser, simPicUser, simCreatorUser]);

    const filteredSimUsers = useMemo(() => {
        if (!simSearch.trim()) return matchedUsers;
        const q = simSearch.toLowerCase();
        return matchedUsers.filter(u => {
            const name = (u.name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const role = (u.role || '').toLowerCase();
            const pt = (u.company?.name || u.company_name || '').toLowerCase();
            const dept = (u.department?.name || u.org_name || '').toLowerCase();
            return name.includes(q) || email.includes(q) || role.includes(q) || pt.includes(q) || dept.includes(q);
        });
    }, [matchedUsers, simSearch]);

    const renderSortIcon = (field: string) => {
        if (sortField !== field) {
            return <ArrowUpDown size={11} className="opacity-40 hover:opacity-100 transition-opacity ml-1" />;
        }
        return sortDirection === 'asc' ? (
            <ArrowUp size={11} className="text-white font-bold ml-1" />
        ) : (
            <ArrowDown size={11} className="text-white font-bold ml-1" />
        );
    };

    return (
        <div className="space-y-4 w-full min-w-0">
            {/* Banner Status Simulasi Aktor Terpilih */}
            {(simInitiatorUser || simPicUser || simCreatorUser) && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs flex-wrap justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                            <Info size={13} className="text-indigo-600 dark:text-indigo-400" />
                            Simulasi Aktif:
                        </span>
                        {simInitiatorUser && (
                            <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 text-[11px]">
                                <span className="font-bold text-slate-500 dark:text-slate-400">Inisiator:</span> {simInitiatorUser.name}
                            </span>
                        )}
                        {simPicUser && (
                            <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-[11px]">
                                <span className="font-bold text-slate-500 dark:text-slate-400">PIC:</span> {simPicUser.name}
                            </span>
                        )}
                        {simCreatorUser && (
                            <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 text-[11px]">
                                <span className="font-bold text-slate-500 dark:text-slate-400">Pembuat:</span> {simCreatorUser.name}
                            </span>
                        )}
                    </div>
                    {onOpenSimulationModal && (
                        <button
                            type="button"
                            onClick={onOpenSimulationModal}
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                            Ubah Simulasi
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/90 dark:bg-zinc-800/90 p-3 rounded-xl gap-3">
                <div className="flex items-center gap-2">
                    <Shield size={14} className="text-primary shrink-0" />
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                            {title}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Simulasi Akses Dropdown */}
                    <div className="relative" ref={simRef}>
                        <button
                            type="button"
                            onClick={() => setIsSimOpen(!isSimOpen)}
                            className={cn(
                                "h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-none shrink-0",
                                matchedUsers.length > 0
                                    ? "bg-white dark:bg-zinc-900 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50"
                                    : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                            )}
                            title="Klik untuk melihat simulasi pengguna yang memiliki akses"
                        >
                            <Users size={13} className={matchedUsers.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
                            <span>Simulasi Akses:</span>
                            <span className={cn(
                                "px-1.5 py-0.2 rounded-full font-bold text-[11px]",
                                matchedUsers.length > 0 ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-slate-200 dark:bg-zinc-800 text-slate-600"
                            )}>
                                {matchedUsers.length}
                            </span>
                            <ChevronDown size={13} className={cn("transition-transform duration-200 text-slate-400", isSimOpen && "rotate-180")} />
                        </button>

                        {isSimOpen && (
                            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-80 max-w-[90vw] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                                <div className="p-2.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50">
                                    <div className="flex items-center justify-between pb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                                Simulasi Pengguna Berhak
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            {matchedUsers.length} Total
                                        </span>
                                    </div>
                                    <div className="relative mt-1">
                                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={simSearch}
                                            onChange={(e) => setSimSearch(e.target.value)}
                                            placeholder="Cari nama, role, PT..."
                                            className="w-full h-7 pl-7 pr-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md outline-none focus:border-primary transition-all text-slate-800 dark:text-zinc-200"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-100 dark:divide-zinc-800/50 text-xs">
                                    {filteredSimUsers.length === 0 ? (
                                        <div className="py-6 text-center text-slate-400 dark:text-zinc-500">
                                            <Users size={20} className="mx-auto mb-1 opacity-40" />
                                            <p className="text-[11px]">
                                                {matchedUsers.length === 0 ? 'Belum ada pengguna yang cocok dengan aturan otoritas ini.' : 'Tidak ditemukan pengguna yang cocok dengan pencarian.'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredSimUsers.map((u: any) => (
                                            <div key={u.id} className="py-2 px-2 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-md transition-colors">
                                                <div className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center justify-between">
                                                    <span>{u.name}</span>
                                                    {u.role && (
                                                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                                                            {u.role}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                    {u.email && <span>{u.email}</span>}
                                                    {(u.company?.name || u.company_name) && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-primary font-medium">{u.company?.name || u.company_name}</span>
                                                        </>
                                                    )}
                                                    {(u.department?.name || u.org_name) && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{u.department?.name || u.org_name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedIndices.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1 rounded-lg animate-in fade-in-0 shadow-sm shrink-0">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {selectedIndices.length} dipilih
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openBulkEditModal}
                                className="h-7 text-xs px-2.5 bg-white dark:bg-zinc-800 hover:bg-slate-100 text-primary border-primary/30 rounded-md flex items-center gap-1 shadow-none"
                            >
                                <Pencil size={12} /> Ubah
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="h-7 text-xs px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md flex items-center gap-1 shadow-none"
                            >
                                <Trash2 size={12} /> Hapus
                            </Button>
                        </div>
                    )}

                    <div className="relative flex items-center flex-1 sm:flex-initial min-w-[120px]">
                        <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari otoritas..."
                            className="h-8 pl-8 pr-3 text-xs bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-100 rounded-lg outline-none focus:border-primary transition-all w-full sm:w-44 focus:sm:w-52"
                        />
                    </div>
                    <Button variant="primary" size="sm" onClick={openModal} className="h-8 text-xs rounded-lg px-3 shadow-none shrink-0">
                        <Plus size={14} className="mr-1" /> Tambah
                    </Button>
                </div>
            </div>

            <div className="rounded-[8px] border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 overflow-x-auto w-full max-w-full custom-scrollbar">
                {authorities.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-zinc-400 text-sm">
                        Belum ada otoritas yang ditambahkan.
                    </div>
                ) : filteredAuthorities.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-zinc-400 text-sm">
                        Tidak ada otoritas yang sesuai dengan pencarian "{searchQuery}".
                    </div>
                ) : (
                    <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                        <thead className="bg-primary text-white border-b border-primary/20 dark:bg-zinc-800/90 dark:border-zinc-700/80 dark:text-zinc-200 select-none">
                            <tr>
                                <th className="px-3 py-3 w-8 text-center">
                                    <Checkbox
                                        checked={isAllFilteredSelected}
                                        onCheckedChange={toggleSelectAll}
                                        className="h-4 w-4 border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                                    />
                                </th>
                                <th
                                    onClick={() => toggleSort('authority_type')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span>Tipe</span>
                                        {renderSortIcon('authority_type')}
                                    </div>
                                </th>
                                {showCustom && (
                                    <th
                                        onClick={() => toggleSort('custom')}
                                        className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <span>Aktor Kustom</span>
                                            {renderSortIcon('custom')}
                                        </div>
                                    </th>
                                )}
                                <th
                                    onClick={() => toggleSort('user')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span>Pengguna</span>
                                        {renderSortIcon('user')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('role')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span>Role</span>
                                        {renderSortIcon('role')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('department')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span>Departemen</span>
                                        {renderSortIcon('department')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('division')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span>Divisi</span>
                                        {renderSortIcon('division')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('company_group')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span>Company Group</span>
                                        {renderSortIcon('company_group')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('company')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span>Perusahaan PT</span>
                                        {renderSortIcon('company')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('region')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span>Wilayah</span>
                                        {renderSortIcon('region')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => toggleSort('userCount')}
                                    className="px-3.5 py-3 font-bold uppercase tracking-wider text-center text-white dark:text-zinc-200 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center justify-center">
                                        <span>Pengguna</span>
                                        {renderSortIcon('userCount')}
                                    </div>
                                </th>
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-center text-white dark:text-zinc-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredAuthorities.map((row) => {
                                const auth = row.auth || row;
                                const originalIndex = row.originalIndex;
                                const isSelected = selectedIndices.includes(originalIndex);
                                const userCount = getAuthorityUserCount(auth);
                                return (
                                    <tr
                                        key={originalIndex}
                                        className={cn(
                                            "transition-colors",
                                            isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
                                        )}
                                    >
                                        <td className="px-3 py-2.5 text-center">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelectRow(originalIndex)}
                                                className="h-4 w-4"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                                                    {auth.authority_type}
                                                </span>
                                            </div>
                                        </td>
                                        {showCustom && (
                                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                                {auth.authority_type === 'custom' ? (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="font-semibold text-xs text-slate-800 dark:text-zinc-200">
                                                            {getCustomLabel(auth.role_id || auth.user_id)}
                                                        </span>
                                                        {(auth.role_id === 'initiator' || auth.user_id === 'initiator') && simInitiatorUser && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200/60">
                                                                <span className="font-bold">Sim:</span> {simInitiatorUser.name}
                                                            </span>
                                                        )}
                                                        {(auth.role_id === 'assigned_pic' || auth.user_id === 'assigned_pic') && simPicUser && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                                                <span className="font-bold">Sim:</span> {simPicUser.name}
                                                            </span>
                                                        )}
                                                        {(auth.role_id === 'creator' || auth.user_id === 'creator') && simCreatorUser && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60">
                                                                <span className="font-bold">Sim:</span> {simCreatorUser.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                        )}
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                            {auth.authority_type === 'user' ? getUserLabel(auth.user_id) : '-'}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                            {auth.role_use_initiator ? (
                                                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] uppercase font-bold text-primary">Sesuai Inisiator</span>
                                            ) : getRoleLabel(auth.role_id)}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                            {auth.department_use_initiator ? (
                                                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] uppercase font-bold text-primary">Sesuai Inisiator</span>
                                            ) : getDeptLabel(auth.department_id)}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                            {auth.division_use_initiator ? (
                                                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] uppercase font-bold text-primary">Sesuai Inisiator</span>
                                            ) : getDivLabel(auth.division_id)}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                            {auth.company_group_use_initiator ? (
                                                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] uppercase font-bold text-primary">Sesuai Inisiator</span>
                                            ) : getCompanyGroupLabel(auth.company_group_id)}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                            {auth.company_use_initiator ? (
                                                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] uppercase font-bold text-primary">Sesuai Inisiator</span>
                                            ) : getCompanyLabel(auth.company_id)}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                            {auth.region_use_initiator ? (
                                                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] uppercase font-bold text-primary">Sesuai Inisiator</span>
                                            ) : getRegionLabel(auth.region_id)}
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={cn(
                                                "inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full text-[11px] min-w-6",
                                                userCount > 0
                                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                                            )}>
                                                {userCount}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => editAuthority(originalIndex)}
                                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors inline-flex"
                                                    title="Ubah"
                                                >
                                                    <Pencil size={14} />
                                                 </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAuthority(originalIndex)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors inline-flex"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-3xl w-[90vw] max-w-3xl h-[85vh] max-h-[85vh] border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 overflow-hidden rounded-[12px] border p-0 shadow-2xl flex flex-col">
                    <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[12px] shrink-0">
                        <div className="flex items-center gap-3 z-10 pr-10">
                            <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                <Shield size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                    {isBulkEdit ? `Ubah (${selectedIndices.length}) Otoritas` : editIndex !== null ? 'Ubah Otoritas Akses' : 'Tambah Otoritas Akses'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                    {isBulkEdit ? `Terapkan perubahan nilai ke ${selectedIndices.length} otoritas yang dipilih` : editIndex !== null ? 'Perbarui kriteria atau kombinasi akses otoritas' : 'Atur hak akses berdasarkan pengguna atau kombinasi organisasi'}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-900 flex-1 overflow-y-auto space-y-6 pb-24">
                        {/* Kategori Individu */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary font-bold text-[10px]">1</span>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                    Tipe Pilih User (Personal)
                                </h3>
                            </div>
                            <div className="space-y-4 pt-1">
                                {showCustom && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Aktor Kustom</label>
                                        <SearchableMultiSelect
                                            values={modalCustomIds}
                                            onValuesChange={(val) => handleIndividualChange('custom', val)}
                                            options={[
                                                { value: 'initiator', label: 'INISIATOR' },
                                                { value: 'assigned_pic', label: 'PIC DITUGASKAN' },
                                                { value: 'creator', label: 'PEMBUAT' }
                                            ]}
                                            placeholder="Pilih Aktor..."
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Spesifik Pengguna (User)</label>
                                    <SearchableMultiSelect
                                        values={modalUserIds}
                                        onValuesChange={(val) => handleIndividualChange('user', val)}
                                        options={activeUsers.map(u => ({ value: String(u.id), label: formatUserDetail(u) }))}
                                        placeholder="Pilih Pengguna..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kategori Kombinasi */}
                        {showCombinations && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary font-bold text-[10px]">2</span>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                        Tipe Kombinasi Organisasi
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Role</label>
                                            {showInitiatorOption && (
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        id="role_initiator"
                                                        checked={roleUseInitiator}
                                                        onCheckedChange={(c) => {
                                                            setRoleUseInitiator(!!c);
                                                            if (c) {
                                                                setModalRoleIds([]);
                                                                setModalCustomIds([]);
                                                                setModalUserIds([]);
                                                            }
                                                        }}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                    <label htmlFor="role_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                                </div>
                                            )}
                                        </div>
                                        <SearchableMultiSelect
                                            values={modalRoleIds}
                                            onValuesChange={(vals) => handleGroupChange('role', vals)}
                                            options={roles.map(r => ({ value: String(r.id), label: r.name }))}
                                            placeholder="Semua Role..."
                                            disabled={showInitiatorOption && roleUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Departemen</label>
                                            {showInitiatorOption && (
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        id="dept_initiator"
                                                        checked={departmentUseInitiator}
                                                        onCheckedChange={(c) => {
                                                            setDepartmentUseInitiator(!!c);
                                                            if (c) {
                                                                setModalDepartmentIds([]);
                                                                setModalCustomIds([]);
                                                                setModalUserIds([]);
                                                            }
                                                        }}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                    <label htmlFor="dept_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                                </div>
                                            )}
                                        </div>
                                        <SearchableMultiSelect
                                            values={modalDepartmentIds}
                                            onValuesChange={(vals) => handleGroupChange('department', vals)}
                                            options={activeDepartments.map(d => ({ value: String(d.id), label: d.name }))}
                                            placeholder="Semua Departemen..."
                                            disabled={showInitiatorOption && departmentUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Divisi</label>
                                            {showInitiatorOption && (
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        id="div_initiator"
                                                        checked={divisionUseInitiator}
                                                        onCheckedChange={(c) => {
                                                            setDivisionUseInitiator(!!c);
                                                            if (c) {
                                                                setModalDivisionIds([]);
                                                                setModalCustomIds([]);
                                                                setModalUserIds([]);
                                                            }
                                                        }}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                    <label htmlFor="div_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                                </div>
                                            )}
                                        </div>
                                        <SearchableMultiSelect
                                            values={modalDivisionIds}
                                            onValuesChange={(vals) => handleGroupChange('division', vals)}
                                            options={activeDivisions.map(div => ({ value: String(div.id), label: div.name }))}
                                            placeholder="Semua Divisi..."
                                            disabled={showInitiatorOption && divisionUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Company Group</label>
                                            {showInitiatorOption && (
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        id="cg_initiator"
                                                        checked={companyGroupUseInitiator}
                                                        onCheckedChange={(c) => {
                                                            setCompanyGroupUseInitiator(!!c);
                                                            if (c) {
                                                                setModalCompanyGroupIds([]);
                                                                setModalCustomIds([]);
                                                                setModalUserIds([]);
                                                            }
                                                        }}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                    <label htmlFor="cg_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                                </div>
                                            )}
                                        </div>
                                        <SearchableMultiSelect
                                            values={modalCompanyGroupIds}
                                            onValuesChange={(vals) => handleGroupChange('company_group', vals)}
                                            options={activeCompanyGroups.map(cg => ({ value: String(cg.id), label: cg.name }))}
                                            placeholder="Semua Company Group..."
                                            disabled={showInitiatorOption && companyGroupUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Perusahaan PT</label>
                                            {showInitiatorOption && (
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        id="company_initiator"
                                                        checked={companyUseInitiator}
                                                        onCheckedChange={(c) => {
                                                            setCompanyUseInitiator(!!c);
                                                            if (c) {
                                                                setModalCompanyIds([]);
                                                                setModalCustomIds([]);
                                                                setModalUserIds([]);
                                                            }
                                                        }}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                    <label htmlFor="company_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                                </div>
                                            )}
                                        </div>
                                        <SearchableMultiSelect
                                            values={modalCompanyIds}
                                            onValuesChange={(vals) => handleGroupChange('company', vals)}
                                            options={activeCompanies.map(c => ({ value: String(c.id), label: c.name }))}
                                            placeholder="Semua Perusahaan PT..."
                                            disabled={showInitiatorOption && companyUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Wilayah</label>
                                            {showInitiatorOption && (
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox
                                                        id="region_initiator"
                                                        checked={regionUseInitiator}
                                                        onCheckedChange={(c) => {
                                                            setRegionUseInitiator(!!c);
                                                            if (c) {
                                                                setModalRegionIds([]);
                                                                setModalCustomIds([]);
                                                                setModalUserIds([]);
                                                            }
                                                        }}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                    <label htmlFor="region_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                                </div>
                                            )}
                                        </div>
                                        <SearchableMultiSelect
                                            values={modalRegionIds}
                                            onValuesChange={(vals) => handleGroupChange('region', vals)}
                                            options={activeRegions.map(r => ({ value: String(r.id), label: r.name }))}
                                            placeholder="Semua Wilayah..."
                                            disabled={showInitiatorOption && regionUseInitiator}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-2 rounded-b-[8px]">
                        <Button type="button" variant="outline" onClick={closeModal} className="rounded-lg h-9 px-4 text-xs font-semibold">
                            Batal
                        </Button>
                        <Button type="button" onClick={handleSave} className="rounded-lg h-9 px-4 text-xs font-semibold bg-primary text-white hover:bg-primary/95 shadow-sm">
                            {editIndex !== null ? 'Simpan' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
