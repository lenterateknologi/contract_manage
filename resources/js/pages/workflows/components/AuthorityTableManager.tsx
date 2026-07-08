import React, { useState } from 'react';
import { Plus, Trash2, Check, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialogs/Dialog';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';

interface AuthorityItem {
    id?: string;
    authority_type: string;
    role_id?: string | null;
    department_id?: string | null;
    division_id?: string | null;
    user_id?: string | null;
    company_group_id?: string | null;
    region_id?: string | null;
    use_initiator_property?: boolean;
    role_use_initiator?: boolean;
    department_use_initiator?: boolean;
    division_use_initiator?: boolean;
    company_group_use_initiator?: boolean;
    region_use_initiator?: boolean;
}

interface AuthorityTableManagerProps {
    authorities: AuthorityItem[];
    onChange: (authorities: AuthorityItem[]) => void;
    users: any[];
    roles: any[];
    departments: any[];
    divisions: any[];
    companyGroups: any[];
    regions: any[];
    title?: string;
    showCustom?: boolean;
    showCombinations?: boolean;
}

const SINGLE_TYPES = [
    { type: 'user', label: 'User' },
    { type: 'role', label: 'Role' },
    { type: 'department', label: 'Departemen' },
    { type: 'division', label: 'Divisi' },
    { type: 'company_group', label: 'Kelompok Perusahaan (Company Group)' },
    { type: 'region', label: 'Wilayah (Region)' },
];

const COMBINATION_TYPES = [
    { type: 'role-division', label: 'Role - Divisi' },
    { type: 'role-company_group', label: 'Role - Company Group' },
    { type: 'role-div-comp', label: 'Role - Divisi - Company Group' },
    { type: 'role-div-comp-reg', label: 'Role - Divisi - Company Group - Region' },
];

export default function AuthorityTableManager({
    authorities = [],
    onChange,
    users = [],
    roles = [],
    departments = [],
    divisions = [],
    companyGroups = [],
    regions = [],
    title = 'Otoritas Akses',
    showCustom = false,
    showCombinations = true,
}: AuthorityTableManagerProps) {
    const [selectedTypeForModal, setSelectedTypeForModal] = useState<string | null>(null);
    const [modalUseInitiator, setModalUseInitiator] = useState(false);
    const [modalRoleUseInit, setModalRoleUseInit] = useState(false);
    const [modalDeptUseInit, setModalDeptUseInit] = useState(false);
    const [modalDivUseInit, setModalDivUseInit] = useState(false);
    const [modalCompUseInit, setModalCompUseInit] = useState(false);
    const [modalRegUseInit, setModalRegUseInit] = useState(false);
    const [modalRoleId, setModalRoleId] = useState<string>('');
    const [modalDepartmentId, setModalDepartmentId] = useState<string>('');
    const [modalDivisionId, setModalDivisionId] = useState<string>('');
    const [modalUserId, setModalUserId] = useState<string>('');
    const [modalCompanyGroupId, setModalCompanyGroupId] = useState<string>('');
    const [modalRegionId, setModalRegionId] = useState<string>('');

    const openModal = (type: string) => {
        setSelectedTypeForModal(type);
        setModalUseInitiator(false);
        setModalRoleUseInit(false);
        setModalDeptUseInit(false);
        setModalDivUseInit(false);
        setModalCompUseInit(false);
        setModalRegUseInit(false);
        setModalRoleId('');
        setModalDepartmentId('');
        setModalDivisionId('');
        setModalUserId('');
        setModalCompanyGroupId('');
        setModalRegionId('');
    };

    const closeModal = () => {
        setSelectedTypeForModal(null);
    };

    const handleSave = () => {
        if (!selectedTypeForModal) return;

        const newAuth: AuthorityItem = {
            authority_type: selectedTypeForModal,
            use_initiator_property: modalUseInitiator,
            role_use_initiator: modalRoleUseInit,
            department_use_initiator: modalDeptUseInit,
            division_use_initiator: modalDivUseInit,
            company_group_use_initiator: modalCompUseInit,
            region_use_initiator: modalRegUseInit,
        };

        const type = selectedTypeForModal;

        // Populate fields based on type
        if (type === 'custom') newAuth.user_id = modalUserId || null;
        if (type === 'user') newAuth.user_id = modalUserId || null;
        if (type === 'role') newAuth.role_id = modalRoleId || null;
        if (type === 'department') newAuth.department_id = modalDepartmentId || null;
        if (type === 'division') newAuth.division_id = modalDivisionId || null;
        if (type === 'company_group') newAuth.company_group_id = modalCompanyGroupId || null;
        if (type === 'region') newAuth.region_id = modalRegionId || null;

        if (type === 'role-division') {
            newAuth.role_id = modalRoleId || null;
            newAuth.division_id = modalDivisionId || null;
        }
        if (type === 'role-company_group') {
            newAuth.role_id = modalRoleId || null;
            newAuth.company_group_id = modalCompanyGroupId || null;
        }
        if (type === 'role-div-comp') {
            newAuth.role_id = modalRoleId || null;
            newAuth.division_id = modalDivisionId || null;
            newAuth.company_group_id = modalCompanyGroupId || null;
        }
        if (type === 'role-div-comp-reg') {
            newAuth.role_id = modalRoleId || null;
            newAuth.division_id = modalDivisionId || null;
            newAuth.company_group_id = modalCompanyGroupId || null;
            newAuth.region_id = modalRegionId || null;
        }

        onChange([...authorities, newAuth]);
        closeModal();
    };

    const removeAuthority = (indexToRemove: number) => {
        onChange(authorities.filter((_, idx) => idx !== indexToRemove));
    };

    // Helper to get labels for display
    const getUserLabel = (id: string) => users.find(u => String(u.id) === id)?.name || id;
    const getRoleLabel = (id: string) => roles.find(r => String(r.id) === id || r.name === id)?.name || id;
    const getDeptLabel = (id: string) => departments.find(d => String(d.id) === id)?.name || id;
    const getDivLabel = (id: string) => divisions.find(d => String(d.id) === id)?.name || id;
    const getCompanyGroupLabel = (id: string) => companyGroups.find(cg => String(cg.id) === id)?.name || id;
    const getRegionLabel = (id: string) => regions.find(r => String(r.id) === id)?.name || id;

    const renderDataCell = (type: string) => {
        const matchingAuths = authorities.map((auth, idx) => ({ auth, idx })).filter(item => item.auth.authority_type === type);

        return (
            <div className="flex flex-wrap items-center gap-2">
                {matchingAuths.map(({ auth, idx }) => {
                    const parts: string[] = [];

                    if (auth.use_initiator_property) {
                        parts.push('Sesuai Inisiator');
                    } else {
                        if (auth.authority_type === 'custom' && auth.user_id) {
                            const customLabel = auth.user_id === 'initiator' ? 'INISIATOR' : auth.user_id === 'assigned_pic' ? 'PIC DITUGASKAN' : auth.user_id === 'creator' ? 'PEMBUAT' : auth.user_id;
                            parts.push(`Kustom: ${customLabel}`);
                        } else {
                            if (auth.user_id) parts.push(`User: ${getUserLabel(auth.user_id)}`);
                        }
                        if (auth.role_id) parts.push(`Role: ${getRoleLabel(auth.role_id)}`); else if (auth.role_use_initiator) parts.push('Role: Sesuai Inisiator');
                        if (auth.department_id) parts.push(`Dept: ${getDeptLabel(auth.department_id)}`); else if (auth.department_use_initiator) parts.push('Dept: Sesuai Inisiator');
                        if (auth.division_id) parts.push(`Divisi: ${getDivLabel(auth.division_id)}`); else if (auth.division_use_initiator) parts.push('Divisi: Sesuai Inisiator');
                        if (auth.company_group_id) parts.push(`Group: ${getCompanyGroupLabel(auth.company_group_id)}`); else if (auth.company_group_use_initiator) parts.push('Group: Sesuai Inisiator');
                        if (auth.region_id) parts.push(`Region: ${getRegionLabel(auth.region_id)}`); else if (auth.region_use_initiator) parts.push('Region: Sesuai Inisiator');
                    }

                    return (
                        <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        >
                            <span>{parts.join(' + ') || 'Semua'}</span>
                            <button
                                type="button"
                                onClick={() => removeAuthority(idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={() => openModal(type)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                    <Plus size={12} /> (tambah baru)
                </button>
            </div>
        );
    };

    const renderUseInitiatorCell = (type: string) => {
        const hasUseInitiator = authorities.some(auth => auth.authority_type === type && (auth.use_initiator_property || auth.role_use_initiator || auth.department_use_initiator || auth.division_use_initiator || auth.company_group_use_initiator || auth.region_use_initiator));
        if (hasUseInitiator) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    <Check size={10} /> Parsial/Ya
                </span>
            );
        }
        return <span className="text-xs text-slate-400 font-medium">-</span>;
    };

    const hasTypeSelect = (field: string) => {
        if (!selectedTypeForModal) return false;
        const type = selectedTypeForModal;

        if (field === 'use_initiator_property') return false;

        if (field === 'custom') return type === 'custom';
        if (field === 'user') return type === 'user';
        if (field === 'role') return ['role', 'role-division', 'role-company_group', 'role-div-comp', 'role-div-comp-reg'].includes(type);
        if (field === 'department') return type === 'department';
        if (field === 'division') return ['division', 'role-division', 'role-div-comp', 'role-div-comp-reg'].includes(type);
        if (field === 'company_group') return ['company_group', 'role-company_group', 'role-div-comp', 'role-div-comp-reg'].includes(type);
        if (field === 'region') return ['region', 'role-div-comp-reg'].includes(type);

        return false;
    };

    const singleTypes = showCustom
        ? [{ type: 'custom', label: 'Aktor Kustom' }, ...SINGLE_TYPES]
        : SINGLE_TYPES;

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <Shield size={14} className="text-primary" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {title}
                </h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Tipe Otoritas</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-2/3">Data Otoritas</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/12 text-center">Sesuai Inisiator</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {/* Single Section */}
                        <tr className="bg-slate-100/50 dark:bg-slate-900/20">
                            <td colSpan={3} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Tunggal
                            </td>
                        </tr>
                        {singleTypes.map(st => (
                            <tr key={st.type} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{st.label}</td>
                                <td className="px-4 py-3">{renderDataCell(st.type)}</td>
                                <td className="px-4 py-3 text-center">{renderUseInitiatorCell(st.type)}</td>
                            </tr>
                        ))}

                        {/* Combination Section */}
                        {showCombinations && (
                            <>
                                <tr className="bg-slate-100/50 dark:bg-slate-900/20">
                                    <td colSpan={3} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Kombinasi
                                    </td>
                                </tr>
                                {COMBINATION_TYPES.map(ct => (
                                    <tr key={ct.type} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{ct.label}</td>
                                        <td className="px-4 py-3">{renderDataCell(ct.type)}</td>
                                        <td className="px-4 py-3 text-center">{renderUseInitiatorCell(ct.type)}</td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Dialog */}
            <Dialog open={selectedTypeForModal !== null} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                            Tambah Otoritas: {selectedTypeForModal && [...SINGLE_TYPES, ...COMBINATION_TYPES].find(t => t.type === selectedTypeForModal)?.label}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Checkbox: Sesuai Inisiator */}
                        {hasTypeSelect('use_initiator_property') && (
                            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border dark:border-slate-800">
                                <Checkbox
                                    id="modal-use-init"
                                    checked={modalUseInitiator}
                                    onCheckedChange={(checked) => setModalUseInitiator(!!checked)}
                                />
                                <label
                                    htmlFor="modal-use-init"
                                    className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                                >
                                    Sesuai Inisiator (is_initiator / use_initiator_property)
                                </label>
                            </div>
                        )}

                        {/* Select Custom Actor */}
                        {hasTypeSelect('custom') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pilih Aktor Kustom</label>
                                <SearchableSelect
                                    value={modalUserId}
                                    onValueChange={setModalUserId}
                                    options={[
                                        { value: 'initiator', label: 'INISIATOR' },
                                        { value: 'assigned_pic', label: 'PIC DITUGASKAN' },
                                        { value: 'creator', label: 'PEMBUAT' }
                                    ]}
                                    placeholder="Pilih Aktor..."
                                />
                            </div>
                        )}

                        {/* Select User */}
                        {hasTypeSelect('user') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pilih User</label>
                                <SearchableSelect
                                    value={modalUserId}
                                    onValueChange={setModalUserId}
                                    options={users.map(u => ({ value: String(u.id), label: `${u.name} (${u.role})` }))}
                                    placeholder="Pilih User..."
                                />
                            </div>
                        )}

                        {/* Select Role */}
                        {hasTypeSelect('role') && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pilih Role</label>
                                    <div className="flex items-center gap-1.5">
                                        <label htmlFor="role-use-init" className="text-[10px] font-semibold text-slate-500 cursor-pointer">Sesuai Inisiator</label>
                                        <Checkbox id="role-use-init" checked={modalRoleUseInit} onCheckedChange={(v) => setModalRoleUseInit(!!v)} className="h-3.5 w-3.5 rounded-sm" />
                                    </div>
                                </div>
                                <SearchableSelect
                                    value={modalRoleId}
                                    onValueChange={setModalRoleId}
                                    options={roles.map(r => ({ value: String(r.id), label: r.name }))}
                                    placeholder="Pilih Role..."
                                />
                            </div>
                        )}

                        {/* Select Department */}
                        {hasTypeSelect('department') && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pilih Departemen</label>
                                    <div className="flex items-center gap-1.5">
                                        <label htmlFor="dept-use-init" className="text-[10px] font-semibold text-slate-500 cursor-pointer">Sesuai Inisiator</label>
                                        <Checkbox id="dept-use-init" checked={modalDeptUseInit} onCheckedChange={(v) => setModalDeptUseInit(!!v)} className="h-3.5 w-3.5 rounded-sm" />
                                    </div>
                                </div>
                                <SearchableSelect
                                    value={modalDepartmentId}
                                    onValueChange={setModalDepartmentId}
                                    options={departments.map(d => ({ value: String(d.id), label: d.name }))}
                                    placeholder="Pilih Departemen..."
                                />
                            </div>
                        )}

                        {/* Select Division */}
                        {hasTypeSelect('division') && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pilih Divisi</label>
                                    <div className="flex items-center gap-1.5">
                                        <label htmlFor="div-use-init" className="text-[10px] font-semibold text-slate-500 cursor-pointer">Sesuai Inisiator</label>
                                        <Checkbox id="div-use-init" checked={modalDivUseInit} onCheckedChange={(v) => setModalDivUseInit(!!v)} className="h-3.5 w-3.5 rounded-sm" />
                                    </div>
                                </div>
                                <SearchableSelect
                                    value={modalDivisionId}
                                    onValueChange={setModalDivisionId}
                                    options={divisions.map(d => ({ value: String(d.id), label: d.name }))}
                                    placeholder="Pilih Divisi..."
                                />
                            </div>
                        )}

                        {/* Select Company Group */}
                        {hasTypeSelect('company_group') && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pilih Company Group</label>
                                    <div className="flex items-center gap-1.5">
                                        <label htmlFor="comp-use-init" className="text-[10px] font-semibold text-slate-500 cursor-pointer">Sesuai Inisiator</label>
                                        <Checkbox id="comp-use-init" checked={modalCompUseInit} onCheckedChange={(v) => setModalCompUseInit(!!v)} className="h-3.5 w-3.5 rounded-sm" />
                                    </div>
                                </div>
                                <SearchableSelect
                                    value={modalCompanyGroupId}
                                    onValueChange={setModalCompanyGroupId}
                                    options={companyGroups.map(cg => ({ value: String(cg.id), label: cg.name }))}
                                    placeholder="Pilih Company Group..."
                                />
                            </div>
                        )}

                        {/* Select Region */}
                        {hasTypeSelect('region') && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pilih Wilayah (Region)</label>
                                    <div className="flex items-center gap-1.5">
                                        <label htmlFor="reg-use-init" className="text-[10px] font-semibold text-slate-500 cursor-pointer">Sesuai Inisiator</label>
                                        <Checkbox id="reg-use-init" checked={modalRegUseInit} onCheckedChange={(v) => setModalRegUseInit(!!v)} className="h-3.5 w-3.5 rounded-sm" />
                                    </div>
                                </div>
                                <SearchableSelect
                                    value={modalRegionId}
                                    onValueChange={setModalRegionId}
                                    options={regions.map(r => ({ value: String(r.id), label: r.name }))}
                                    placeholder="Pilih Region..."
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl h-10 text-xs font-bold">
                            Batal
                        </Button>
                        <Button type="button" onClick={handleSave} className="rounded-xl h-10 text-xs font-bold bg-primary text-white">
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
