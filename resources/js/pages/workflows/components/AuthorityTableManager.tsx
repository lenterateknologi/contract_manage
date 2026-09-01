import React, { useState } from 'react';
import { Trash2, Plus, Shield, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialogs/Dialog';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';
interface AuthorityItem {
    id?: string;
    authority_type: string;
    role_id?: string | null;
    department_id?: string | null;
    user_id?: string | null;
    company_group_id?: string | null;
    company_id?: string | null;
    region_id?: string | null;
    role_use_initiator?: boolean;
    department_use_initiator?: boolean;
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
}

export default function AuthorityTableManager({
    authorities = [],
    onChange,
    users = [],
    roles = [],
    departments = [],
    companyGroups = [],
    companies = [],
    regions = [],
    title = 'Otoritas Akses',
    showCustom = false,
    showCombinations = true,
}: AuthorityTableManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);

    // Arrays for multi-select (for individuals)
    const [modalUserIds, setModalUserIds] = useState<string[]>([]);
    const [modalCustomIds, setModalCustomIds] = useState<string[]>([]);

    // Single select for combinations
    const [modalRoleId, setModalRoleId] = useState<string>('');
    const [modalDepartmentId, setModalDepartmentId] = useState<string>('');
    const [modalCompanyGroupId, setModalCompanyGroupId] = useState<string>('');
    const [modalCompanyId, setModalCompanyId] = useState<string>('');
    const [modalRegionId, setModalRegionId] = useState<string>('');
    
    // Per-dimension initiator flags
    const [roleUseInitiator, setRoleUseInitiator] = useState<boolean>(false);
    const [departmentUseInitiator, setDepartmentUseInitiator] = useState<boolean>(false);
    const [companyGroupUseInitiator, setCompanyGroupUseInitiator] = useState<boolean>(false);
    const [companyUseInitiator, setCompanyUseInitiator] = useState<boolean>(false);
    const [regionUseInitiator, setRegionUseInitiator] = useState<boolean>(false);

    // Filter only items where is_used is true (hardcode filter)
    const activeUsers = React.useMemo(() => (users || []).filter(u => u.is_used !== false && u.is_used !== 0 && String(u.is_used) !== '0'), [users]);
    const activeDepartments = React.useMemo(() => (departments || []).filter(d => d.is_used !== false && d.is_used !== 0 && String(d.is_used) !== '0'), [departments]);
    const activeCompanyGroups = React.useMemo(() => (companyGroups || []).filter(cg => cg.is_used !== false && cg.is_used !== 0 && String(cg.is_used) !== '0'), [companyGroups]);
    const activeCompanies = React.useMemo(() => (companies || []).filter(c => c.is_used !== false && c.is_used !== 0 && String(c.is_used) !== '0'), [companies]);
    const activeRegions = React.useMemo(() => (regions || []).filter(r => r.is_used !== false && r.is_used !== 0 && String(r.is_used) !== '0'), [regions]);

    const handleIndividualChange = (type: 'user' | 'custom', val: string[]) => {
        if (type === 'custom') setModalCustomIds(val);
        if (type === 'user') setModalUserIds(val);

        if (val.length > 0) {
            setModalRoleId('');
            setModalDepartmentId('');
            setModalCompanyGroupId('');
            setModalCompanyId('');
            setModalRegionId('');
            setRoleUseInitiator(false);
            setDepartmentUseInitiator(false);
            setCompanyGroupUseInitiator(false);
            setCompanyUseInitiator(false);
            setRegionUseInitiator(false);
        }
    };

    const handleGroupChange = (type: string, val: string) => {
        if (type === 'role') setModalRoleId(val);
        if (type === 'department') setModalDepartmentId(val);
        if (type === 'company_group') setModalCompanyGroupId(val);
        if (type === 'company') setModalCompanyId(val);
        if (type === 'region') setModalRegionId(val);

        if (val) {
            setModalCustomIds([]);
            setModalUserIds([]);
        }
    };

    const openModal = () => {
        setEditIndex(null);
        setModalUserIds([]);
        setModalCustomIds([]);
        setModalRoleId('');
        setModalDepartmentId('');
        setModalCompanyGroupId('');
        setModalCompanyId('');
        setModalRegionId('');
        setRoleUseInitiator(false);
        setDepartmentUseInitiator(false);
        setCompanyGroupUseInitiator(false);
        setCompanyUseInitiator(false);
        setRegionUseInitiator(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditIndex(null);
    };

    const editAuthority = (index: number) => {
        const auth = authorities[index];
        setEditIndex(index);
        
        // Reset fields first
        setModalUserIds([]);
        setModalCustomIds([]);
        setModalRoleId('');
        setModalDepartmentId('');
        setModalCompanyGroupId('');
        setModalCompanyId('');
        setModalRegionId('');
        setRoleUseInitiator(false);
        setDepartmentUseInitiator(false);
        setCompanyGroupUseInitiator(false);
        setCompanyUseInitiator(false);
        setRegionUseInitiator(false);

        if (auth.authority_type === 'custom' && auth.user_id) {
            setModalCustomIds([auth.user_id]);
        } else if (auth.authority_type === 'user' && auth.user_id) {
            setModalUserIds([auth.user_id]);
        } else {
            // Group combination
            if (auth.role_id) setModalRoleId(auth.role_id);
            if (auth.department_id) setModalDepartmentId(auth.department_id);
            if (auth.company_group_id) setModalCompanyGroupId(auth.company_group_id);
            if (auth.company_id) setModalCompanyId(auth.company_id);
            if (auth.region_id) setModalRegionId(auth.region_id);
            
            if (auth.role_use_initiator) setRoleUseInitiator(true);
            if (auth.department_use_initiator) setDepartmentUseInitiator(true);
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

        // Save Group Combination
        if (modalRoleId || modalDepartmentId || modalCompanyGroupId || modalCompanyId || modalRegionId || roleUseInitiator || departmentUseInitiator || companyGroupUseInitiator || companyUseInitiator || regionUseInitiator) {
            newAuths.push({
                authority_type: 'group',
                role_id: modalRoleId || undefined,
                department_id: modalDepartmentId || undefined,
                company_group_id: modalCompanyGroupId || undefined,
                company_id: modalCompanyId || undefined,
                region_id: modalRegionId || undefined,
                role_use_initiator: roleUseInitiator,
                department_use_initiator: departmentUseInitiator,
                company_group_use_initiator: companyGroupUseInitiator,
                company_use_initiator: companyUseInitiator,
                region_use_initiator: regionUseInitiator,
            });
        }

        if (newAuths.length > 0) {
            if (editIndex !== null) {
                // If editing, we replace the item at editIndex with the newAuths (could be multiple if they added more users)
                const updated = [...authorities];
                updated.splice(editIndex, 1, ...newAuths);
                onChange(updated);
            } else {
                onChange([...authorities, ...newAuths]);
            }
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
        const u = users.find(x => String(x.id) === id);
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

    const filteredAuthorities = React.useMemo(() => {
        if (!searchQuery.trim()) return authorities.map((auth, index) => ({ auth, originalIndex: index }));
        const q = searchQuery.toLowerCase().trim();
        return authorities
            .map((auth, index) => ({ auth, originalIndex: index }))
            .filter(({ auth }) => {
                const typeMatch = auth.authority_type?.toLowerCase().includes(q);
                const userMatch = getUserLabel(auth.user_id || undefined).toLowerCase().includes(q);
                const roleMatch = (auth.role_use_initiator ? 'sesuai inisiator' : getRoleLabel(auth.role_id || undefined)).toLowerCase().includes(q);
                const deptMatch = (auth.department_use_initiator ? 'sesuai inisiator' : getDeptLabel(auth.department_id || undefined)).toLowerCase().includes(q);
                const cgMatch = (auth.company_group_use_initiator ? 'sesuai inisiator' : getCompanyGroupLabel(auth.company_group_id || undefined)).toLowerCase().includes(q);
                const compMatch = (auth.company_use_initiator ? 'sesuai inisiator' : getCompanyLabel(auth.company_id || undefined)).toLowerCase().includes(q);
                const regMatch = (auth.region_use_initiator ? 'sesuai inisiator' : getRegionLabel(auth.region_id || undefined)).toLowerCase().includes(q);
                return typeMatch || userMatch || roleMatch || deptMatch || cgMatch || compMatch || regMatch;
            });
    }, [authorities, searchQuery, users, roles, departments, companyGroups, companies, regions]);

    return (
        <div className="space-y-4 w-full">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/90 dark:bg-zinc-800/90 p-3 rounded-xl gap-3">
                <div className="flex items-center gap-2">
                    <Shield size={14} className="text-primary" />
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                            {title}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                        <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari otoritas..."
                            className="h-8 pl-8 pr-3 text-xs bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-100 rounded-lg outline-none focus:border-primary transition-all w-48 focus:w-60"
                        />
                    </div>
                    <Button variant="primary" size="sm" onClick={openModal} className="h-8 text-xs rounded-lg px-3 shadow-none">
                        <Plus size={14} className="mr-1" /> Tambah Otoritas
                    </Button>
                </div>
            </div>

            <div className="rounded-[8px] border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 overflow-hidden overflow-x-auto">
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
                        <thead className="bg-primary text-white border-b border-primary/20 dark:bg-zinc-800/90 dark:border-zinc-700/80 dark:text-zinc-200">
                            <tr>
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200">Tipe</th>
                                {showCustom && <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200">Aktor Kustom</th>}
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200">User</th>
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200">Role</th>
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200">Departemen</th>
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200">Company Group</th>
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200">Perusahaan PT</th>
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-white dark:text-zinc-200">Wilayah</th>
                                <th className="px-3.5 py-3 font-bold uppercase tracking-wider text-center text-white dark:text-zinc-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredAuthorities.map(({ auth, originalIndex }) => (
                                <tr key={originalIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                    <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                                                {auth.authority_type}
                                            </span>
                                        </div>
                                    </td>
                                    {showCustom && (
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                                            {auth.authority_type === 'custom' ? getCustomLabel(auth.user_id) : '-'}
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
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-2xl border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 overflow-hidden rounded-[8px] border p-0 shadow-2xl">
                    <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[8px]">
                        <div className="flex items-center gap-3 z-10 pr-10">
                            <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                                <Shield size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                    {editIndex !== null ? 'Ubah Otoritas Akses' : 'Tambah Otoritas Akses'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                    {editIndex !== null ? 'Perbarui kriteria atau kombinasi akses otoritas' : 'Atur hak akses berdasarkan pengguna atau kombinasi organisasi'}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-900 max-h-[75vh] overflow-y-auto space-y-6">
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
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Pengguna (User)</label>
                                    <SearchableMultiSelect
                                        values={modalUserIds}
                                        onValuesChange={(val) => handleIndividualChange('user', val)}
                                        options={(activeUsers || []).map(u => ({ value: String(u.id), label: formatUserDetail(u) }))}
                                        placeholder="Pilih User..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Kategori Grup */}
                        {(showCombinations !== false) && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary font-bold text-[10px]">2</span>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                        Tipe Kombinasi (Group & Organisasi)
                                    </h3>
                                </div>
                                <div className="space-y-4 pt-1">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Role</label>
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    id="role_initiator"
                                                    checked={roleUseInitiator}
                                                    onCheckedChange={(c) => {
                                                        setRoleUseInitiator(!!c);
                                                        if (c) {
                                                            setModalRoleId('');
                                                            setModalCustomIds([]);
                                                            setModalUserIds([]);
                                                        }
                                                    }}
                                                    className="h-3.5 w-3.5"
                                                />
                                                <label htmlFor="role_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                            </div>
                                        </div>
                                        <SearchableSelect
                                            value={modalRoleId}
                                            onValueChange={(val) => handleGroupChange('role', val)}
                                            options={roles.map(r => ({ value: String(r.id), label: r.name }))}
                                            placeholder="Semua Role..."
                                            disabled={roleUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Departemen</label>
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    id="dept_initiator"
                                                    checked={departmentUseInitiator}
                                                    onCheckedChange={(c) => {
                                                        setDepartmentUseInitiator(!!c);
                                                        if (c) {
                                                            setModalDepartmentId('');
                                                            setModalCustomIds([]);
                                                            setModalUserIds([]);
                                                        }
                                                    }}
                                                    className="h-3.5 w-3.5"
                                                />
                                                <label htmlFor="dept_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                            </div>
                                        </div>
                                        <SearchableSelect
                                            value={modalDepartmentId}
                                            onValueChange={(val) => handleGroupChange('department', val)}
                                            options={activeDepartments.map(d => ({ value: String(d.id), label: d.name }))}
                                            placeholder="Semua Departemen..."
                                            disabled={departmentUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Company Group</label>
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    id="cg_initiator"
                                                    checked={companyGroupUseInitiator}
                                                    onCheckedChange={(c) => {
                                                        setCompanyGroupUseInitiator(!!c);
                                                        if (c) {
                                                            setModalCompanyGroupId('');
                                                            setModalCustomIds([]);
                                                            setModalUserIds([]);
                                                        }
                                                    }}
                                                    className="h-3.5 w-3.5"
                                                />
                                                <label htmlFor="cg_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                            </div>
                                        </div>
                                        <SearchableSelect
                                            value={modalCompanyGroupId}
                                            onValueChange={(val) => handleGroupChange('company_group', val)}
                                            options={activeCompanyGroups.map(cg => ({ value: String(cg.id), label: cg.name }))}
                                            placeholder="Semua Company Group..."
                                            disabled={companyGroupUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Perusahaan PT</label>
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    id="company_initiator"
                                                    checked={companyUseInitiator}
                                                    onCheckedChange={(c) => {
                                                        setCompanyUseInitiator(!!c);
                                                        if (c) {
                                                            setModalCompanyId('');
                                                            setModalCustomIds([]);
                                                            setModalUserIds([]);
                                                        }
                                                    }}
                                                    className="h-3.5 w-3.5"
                                                />
                                                <label htmlFor="company_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                            </div>
                                        </div>
                                        <SearchableSelect
                                            value={modalCompanyId}
                                            onValueChange={(val) => handleGroupChange('company', val)}
                                            options={activeCompanies.map(c => ({ value: String(c.id), label: c.name }))}
                                            placeholder="Semua Perusahaan PT..."
                                            disabled={companyUseInitiator}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Wilayah</label>
                                            <div className="flex items-center gap-1.5">
                                                <Checkbox
                                                    id="region_initiator"
                                                    checked={regionUseInitiator}
                                                    onCheckedChange={(c) => {
                                                        setRegionUseInitiator(!!c);
                                                        if (c) {
                                                            setModalRegionId('');
                                                            setModalCustomIds([]);
                                                            setModalUserIds([]);
                                                        }
                                                    }}
                                                    className="h-3.5 w-3.5"
                                                />
                                                <label htmlFor="region_initiator" className="text-[11px] text-slate-500 font-medium cursor-pointer">Sesuai Inisiator</label>
                                            </div>
                                        </div>
                                        <SearchableSelect
                                            value={modalRegionId}
                                            onValueChange={(val) => handleGroupChange('region', val)}
                                            options={activeRegions.map(r => ({ value: String(r.id), label: r.name }))}
                                            placeholder="Semua Wilayah..."
                                            disabled={regionUseInitiator}
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
                            {editIndex !== null ? 'Perbarui Otoritas' : 'Simpan Otoritas'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
