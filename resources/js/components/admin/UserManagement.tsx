import { ManagementForm, FormDangerZone, FormSection } from './ManagementForm';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSelect } from '@/components/ui/forms/CompactSelect';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { router, useForm } from '@inertiajs/react';
import { Fingerprint, Mail, Phone, Plus, ShieldAlert, Trash2, UserCircle } from 'lucide-react';
import React, { useMemo } from 'react';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { Button } from '@/components/ui/base/Button';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/contracts/Toast';

interface UserManagementProps {
    users: any;
    roles: any[];
    departments: any[];
    filters: any;
}

const UserCell = ({ name, email }: Readonly<{ name: string; email: string }>) => (
    <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-black dark:text-white flex items-center justify-center font-black text-[11px] shrink-0 border border-black/[0.05] dark:border-white/[0.05]">
            {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
            <span className="font-bold text-black dark:text-white text-[13px] truncate leading-tight">
                {name}
            </span>
            <span className="text-[10px] font-bold text-black/40 dark:text-white/40 truncate leading-none uppercase tracking-widest mt-1">
                {email}
            </span>
        </div>
    </div>
);

const IdentityCell = ({ username, phone }: Readonly<{ username: string; phone?: string }>) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest">
            <Fingerprint size={10} className="text-black/30 dark:text-white/30" />
            {username}
        </div>
        {phone && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/40 dark:text-white/40 tracking-tight uppercase">
                <Phone size={10} className="text-black/30 dark:text-white/30" />
                {phone}
            </div>
        )}
    </div>
);

const PlacementCell = ({ departmentName, position }: Readonly<{ departmentName?: string; position?: string }>) => (
    <div className="flex flex-col gap-1">
        <span className="text-[11px] font-black text-black dark:text-white uppercase tracking-wider">
            {departmentName || 'GLOBAL'}
        </span>
        <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">
            {position || 'STAF'}
        </span>
    </div>
);

const AuthorityCell = ({ role }: Readonly<{ role: string }>) => (
    <span className="text-[10px] font-black tracking-[0.15em] text-black/60 dark:text-white/60 uppercase">
        {role}
    </span>
);

const AccessCell = ({ isActive }: Readonly<{ isActive: boolean }>) => (
    <div className="flex items-center gap-2">
        <div className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isActive ? "bg-black dark:bg-white" : "bg-black/20 dark:bg-white/20"
        )} />
        <span className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            isActive ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
        )}>
            {isActive ? 'AKTIF' : 'SUSPENDED'}
        </span>
    </div>
);

export function UserManagement({ users, roles, departments, filters }: Readonly<UserManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canDelete } = usePermissions('ADMIN_USERS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        email: '',
        username: '',
        role: roles?.[0]?.name || 'Staff',
        department_id: '',
        position: '',
        phone: '',
        is_active: true as boolean,
        password: '',
        password_confirmation: '',
    });

    const filterConfig = useMemo(() => [
        {
            label: 'Role Akses',
            key: 'role',
            type: 'searchable',
            options: roles.map(r => ({ label: r.name, value: r.name }))
        },
        {
            label: 'Departemen',
            key: 'department_id',
            type: 'searchable',
            options: departments.map(d => ({ label: d.name, value: d.id }))
        }
    ], [roles, departments]);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(globalThis.location.pathname, { 
            ...filters, 
            ...newFilters, 
            page: 1 
        }, { preserveState: true, replace: true });
    };

    const columns = useMemo<Column<any>[]>(() => [
        {
            header: 'Pengguna',
            accessorKey: 'name',
            sortable: true,
            cell: (row) => <UserCell name={row.name} email={row.email} />
        },
        {
            header: 'Identitas',
            accessorKey: 'username',
            cell: (row) => <IdentityCell username={row.username} phone={row.phone} />
        },
        {
            header: 'Penempatan',
            accessorKey: 'department.name',
            cell: (row) => <PlacementCell departmentName={row.department?.name} position={row.position} />
        },
        {
            header: 'Otoritas',
            accessorKey: 'role',
            cell: (row) => <AuthorityCell role={row.role} />,
        },
        {
            header: 'Akses',
            accessorKey: 'is_active',
            cell: (row) => <AccessCell isActive={row.is_active} />,
        },
    ], []);

    const openCreate = () => {
        setEditingUser(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (user: any) => {
        setEditingUser(user);
        form.setData({
            name: user.name,
            email: user.email,
            username: user.username || '',
            role: user.role,
            department_id: user.department_id ? String(user.department_id) : '',
            position: user.position || '',
            phone: user.phone || '',
            is_active: !!user.is_active,
            password: '',
            password_confirmation: '',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingUser(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingUser ? 'Akses user telah diperbarui' : 'User baru telah ditambahkan', 'success');
            },
        };
        if (editingUser) {
            form.put(`/admin/users/${editingUser.id}`, options);
        } else {
            form.post('/admin/users', options);
        }
    };

    const handleDelete = () => {
        setIsConfirmOpen(true);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingUser ? 'Edit Detail Pengguna' : 'Registrasi User Baru'}
                subtitle={editingUser ? 'Personal data dan pengaturan akses' : 'Masukan data otentikasi user'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingUser}
                headerActions={
                    editingUser && canDelete && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsConfirmOpen(true)}
                            className="h-8 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/10 active:scale-95"
                        >
                            <Trash2 size={14} className="mr-2" /> Hapus Akun
                        </Button>
                    )
                }
            >
                <ConfirmationModal 
                    open={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        setIsConfirmOpen(false);
                        router.delete(`/admin/users/${editingUser.id}`, { 
                            onSuccess: () => {
                                closeForm();
                                showToast('User telah dihapus dari sistem', 'success');
                            }
                        });
                    }}
                    title="Hapus Data Pengguna"
                    description={`Apakah Anda yakin ingin menghapus user ${editingUser?.name}? Seluruh data akses dan riwayat aktivitas user ini akan dicabut.`}
                    confirmText="Hapus User"
                />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Main Column: 8 Columns */}
                    <div className="md:col-span-8 space-y-8">
                        {/* Section: Identitas & Otentikasi */}
                        <FormSection 
                            title="Identitas & Otentikasi" 
                            subtitle="Informasi dasar dan kredensial akses pengguna"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CompactInput 
                                    label="Nama Lengkap Sesuai KTP"
                                    value={form.data.name}
                                    onChange={e => form.setData('name', e.target.value)}
                                    placeholder="NAMA LENGKAP"
                                    error={form.errors.name}
                                    containerClassName="md:col-span-2"
                                />
                                <CompactInput 
                                    label="Username Akses"
                                    value={form.data.username}
                                    onChange={e => form.setData('username', e.target.value)}
                                    placeholder="USERNAME"
                                    error={form.errors.username}
                                />
                                <CompactInput 
                                    label="Email Institusi"
                                    type="email"
                                    value={form.data.email}
                                    onChange={e => form.setData('email', e.target.value)}
                                    placeholder="user@company.com"
                                    error={form.errors.email}
                                />
                                <CompactInput 
                                    label="Nomor Telepon"
                                    value={form.data.phone}
                                    onChange={e => form.setData('phone', e.target.value)}
                                    placeholder="08XX XXXX XXXX"
                                    error={form.errors.phone}
                                />
                                <CompactInput 
                                    label={editingUser ? 'Reset Password (Opsional)' : 'Set Password Akun'}
                                    type="password"
                                    value={form.data.password}
                                    onChange={e => form.setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    error={form.errors.password}
                                />
                                <CompactInput 
                                    label="Konfirmasi Password"
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={e => form.setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    error={form.errors.password_confirmation}
                                />
                            </div>
                        </FormSection>

                        {/* Section: Jabatan & Otoritas */}
                        <FormSection 
                            title="Penempatan & Otoritas" 
                            subtitle="Struktur organisasi dan peran sistem"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CompactSelect 
                                    label="Role Akses"
                                    value={form.data.role}
                                    onChange={v => form.setData('role', String(v))}
                                    options={roles.map(r => ({ label: r.name, value: r.name }))}
                                    error={form.errors.role}
                                />
                                <CompactSelect 
                                    label="Unit / Departemen"
                                    value={form.data.department_id}
                                    onChange={v => form.setData('department_id', String(v))}
                                    options={departments.map(d => ({ label: d.name, value: d.id }))}
                                    error={form.errors.department_id}
                                />
                                <CompactInput 
                                    label="Jabatan Struktural"
                                    value={form.data.position}
                                    onChange={e => form.setData('position', e.target.value)}
                                    placeholder="CONTOH: KEPALA BAGIAN HUKUM"
                                    error={form.errors.position}
                                    containerClassName="md:col-span-2"
                                />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side Column: 4 Columns */}
                    <div className="md:col-span-4 flex flex-col gap-8">
                        <FormSection title="Status Akses">
                            <CompactSwitch 
                                label="Akun Aktif"
                                description="Berikan akses masuk ke portal admin"
                                checked={form.data.is_active}
                                onCheckedChange={c => form.setData('is_active', c)}
                            />
                        </FormSection>

                        <div className="border border-primary/10 dark:border-white/10 p-8 bg-primary/[0.02] dark:bg-white/[0.02] rounded-2xl shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <UserCircle size={80} strokeWidth={1} />
                            </div>
                            
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary dark:text-white">Preview Profil</span>
                            </div>

                            <div className="flex flex-col items-center py-6 border-y border-primary/5 dark:border-white/5 border-dashed relative z-10">
                                <div className="w-20 h-20 bg-primary dark:bg-white text-white dark:text-primary flex items-center justify-center font-black text-3xl mb-6 rounded-2xl shadow-xl shadow-primary/10 dark:shadow-white/5">
                                    {form.data.name ? form.data.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-[15px] font-black uppercase text-center leading-tight tracking-tight text-primary dark:text-white px-4">
                                    {form.data.name || 'Nama Belum Diisi'}
                                </span>
                                <span className="text-[10px] font-bold text-primary dark:text-white uppercase mt-2 tracking-widest px-4 text-center">
                                    {form.data.position || 'Jabatan Belum Diatur'}
                                </span>
                                
                                <div className="mt-8 pt-6 border-t border-primary/5 dark:border-white/5 w-full flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/60 dark:text-white/60">
                                        <Mail size={12} strokeWidth={3} />
                                        {form.data.email || 'Email Belum Set'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/60 dark:text-white/60">
                                        <ShieldAlert size={12} strokeWidth={3} />
                                        {form.data.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <DataTable
            title="Database Pengguna"
            columns={columns}
            data={users.data || []}
            searchPlaceholder="Cari nama, email, atau username..."
            searchValue={filters.search || ''}
            onSearchChange={(v: string) => router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })}
            filters={filterConfig as any}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            headerActions={
                canCreate && (
                    <Button 
                        variant="primary"
                        onClick={openCreate} 
                        className="h-10 px-8 shadow-xl active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Registrasi User Baru
                    </Button>
                )
            }
            onRowClick={openEdit}
            bulkActions={canDelete ? [
                {
                    label: 'Hapus Terpilih',
                    icon: Trash2,
                    variant: 'destructive',
                    onClick: (ids: string[] | number[]) => {
                        if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} user terpilih?`)) {
                            router.post('/admin/users/bulk-delete', { ids }, {
                                onSuccess: () => showToast(`${ids.length} user telah dihapus`, 'success')
                            });
                        }
                    }
                }
            ] : undefined}
            pagination={{
                currentPage: users.current_page || 1,
                lastPage: users.last_page || 1,
                total: users.total || 0,
                from: users.from || 1,
                to: users.to || 1,
                perPage: users.per_page || 10,
                onPageChange: (page: number) => router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (perPage: number) => router.get(globalThis.location.pathname, { ...filters, per_page: perPage, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
