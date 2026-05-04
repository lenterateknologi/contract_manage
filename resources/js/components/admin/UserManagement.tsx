import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSelect } from '@/components/ui/forms/CompactSelect';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Fingerprint, Mail, Phone, Plus, ShieldAlert, Trash2, UserCircle } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface UserManagementProps {
    users: any;
    roles: any[];
    departments: any[];
    filters: any;
}

// Consistent color palette from name hash
const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-700',
];

const ROLE_COLORS: Record<string, string> = {
    Admin: 'bg-violet-100 text-violet-700',
    Manager: 'bg-blue-100 text-blue-700',
    Staff: 'bg-slate-100 text-slate-600',
    Reviewer: 'bg-amber-100 text-amber-700',
    Approver: 'bg-emerald-100 text-emerald-700',
};

function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const UserCell = ({ name, email }: Readonly<{ name: string; email: string }>) => (
    <div className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold', avatarColor(name))}>
            {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="text-foreground truncate text-sm leading-tight font-semibold">{name}</span>
            <span className="text-muted-foreground/60 mt-0.5 truncate text-xs leading-none font-medium">{email}</span>
        </div>
    </div>
);

const IdentityCell = ({ username, phone }: Readonly<{ username: string; phone?: string }>) => (
    <div className="flex flex-col gap-1">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
            <Fingerprint size={12} className="opacity-40" />
            {username}
        </div>
        {phone && (
            <div className="text-muted-foreground/60 flex items-center gap-1.5 text-xs font-medium tracking-tight">
                <Phone size={12} className="opacity-40" />
                {phone}
            </div>
        )}
    </div>
);

const PlacementCell = ({ departmentName, position }: Readonly<{ departmentName?: string; position?: string }>) => (
    <div className="flex flex-col gap-1">
        <span className="inline-block w-fit rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {departmentName || 'Global'}
        </span>
        <span className="text-muted-foreground/60 mt-0.5 text-xs font-medium">{position || 'Staf'}</span>
    </div>
);

const AuthorityCell = ({ role }: Readonly<{ role: string }>) => (
    <span
        className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600',
        )}
    >
        {role}
    </span>
);

const AccessCell = ({ isActive }: Readonly<{ isActive: boolean }>) => (
    <div className="flex items-center gap-2">
        <div className={cn('h-2 w-2 shrink-0 rounded-full', isActive ? 'bg-emerald-500' : 'bg-rose-400')} />
        <span className={cn('text-xs font-semibold', isActive ? 'text-emerald-600' : 'text-rose-500')}>{isActive ? 'Aktif' : 'Nonaktif'}</span>
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

    const filterConfig = useMemo(
        () => [
            {
                label: 'Role Akses',
                key: 'role',
                type: 'searchable',
                options: roles.map((r) => ({ label: r.name, value: r.name })),
            },
            {
                label: 'Departemen',
                key: 'department_id',
                type: 'searchable',
                options: departments.map((d) => ({ label: d.name, value: d.id })),
            },
        ],
        [roles, departments],
    );

    const handleFilterChange = (newFilters: Record<string, any>) => {
        router.get(
            globalThis.location.pathname,
            {
                ...filters,
                ...newFilters,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Pengguna',
                accessorKey: 'name',
                cell: (row) => <UserCell name={row.name} email={row.email} />,
            },
            {
                header: 'Identitas',
                accessorKey: 'username',
                cell: (row) => <IdentityCell username={row.username} phone={row.phone} />,
            },
            {
                header: 'Penempatan',
                accessorKey: 'department.name',
                cell: (row) => <PlacementCell departmentName={row.department?.name} position={row.position} />,
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
        ],
        [],
    );

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
                    editingUser &&
                    canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsConfirmOpen(true)}
                            className="h-9 rounded-xl border border-rose-500/10 px-4 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-500 hover:text-white active:scale-95"
                        >
                            <Trash2 size={15} className="mr-2" /> Hapus
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
                            },
                        });
                    }}
                    title="Hapus Data Pengguna"
                    description={`Apakah Anda yakin ingin menghapus user ${editingUser?.name}? Seluruh data akses dan riwayat aktivitas user ini akan dicabut.`}
                    confirmText="Hapus User"
                />
                <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                    {/* Main Column: 8 Columns */}
                    <div className="space-y-8 md:col-span-8">
                        {/* Section: Identitas & Otentikasi */}
                        <FormSection title="Identitas & Otentikasi" subtitle="Informasi dasar dan kredensial akses pengguna">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <CompactInput
                                    label="Nama Lengkap Sesuai KTP"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="NAMA LENGKAP"
                                    error={form.errors.name}
                                    containerClassName="md:col-span-2"
                                />
                                <CompactInput
                                    label="Username Akses"
                                    value={form.data.username}
                                    onChange={(e) => form.setData('username', e.target.value)}
                                    placeholder="USERNAME"
                                    error={form.errors.username}
                                />
                                <CompactInput
                                    label="Email Institusi"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    placeholder="user@company.com"
                                    error={form.errors.email}
                                />
                                <CompactInput
                                    label="Nomor Telepon"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    placeholder="08XX XXXX XXXX"
                                    error={form.errors.phone}
                                />
                                <CompactInput
                                    label={editingUser ? 'Reset Password (Opsional)' : 'Set Password Akun'}
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    error={form.errors.password}
                                />
                                <CompactInput
                                    label="Konfirmasi Password"
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    error={form.errors.password_confirmation}
                                />
                            </div>
                        </FormSection>

                        {/* Section: Jabatan & Otoritas */}
                        <FormSection title="Penempatan & Otoritas" subtitle="Struktur organisasi dan peran sistem">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <CompactSelect
                                    label="Role Akses"
                                    value={form.data.role}
                                    onChange={(v) => form.setData('role', String(v))}
                                    options={roles.map((r) => ({ label: r.name, value: r.name }))}
                                    error={form.errors.role}
                                />
                                <CompactSelect
                                    label="Unit / Departemen"
                                    value={form.data.department_id}
                                    onChange={(v) => form.setData('department_id', String(v))}
                                    options={departments.map((d) => ({ label: d.name, value: d.id }))}
                                    error={form.errors.department_id}
                                />
                                <CompactInput
                                    label="Jabatan Struktural"
                                    value={form.data.position}
                                    onChange={(e) => form.setData('position', e.target.value)}
                                    placeholder="CONTOH: KEPALA BAGIAN HUKUM"
                                    error={form.errors.position}
                                    containerClassName="md:col-span-2"
                                />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side Column: 4 Columns */}
                    <div className="flex flex-col gap-8 md:col-span-4">
                        <FormSection title="Status Akses">
                            <CompactSwitch
                                label="Akun Aktif"
                                description="Berikan akses masuk ke portal admin"
                                checked={form.data.is_active}
                                onCheckedChange={(c) => form.setData('is_active', c)}
                            />
                        </FormSection>

                        <div className="border-border bg-muted/30 group relative overflow-hidden rounded-2xl border p-6">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                                <UserCircle size={80} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 mb-4 flex items-center gap-3">
                                <span className="text-foreground text-xs font-bold tracking-wide">Preview Profil</span>
                            </div>

                            <div className="border-border relative z-10 flex flex-col items-center border-y border-dashed py-4">
                                <div className="bg-primary mb-4 flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-md">
                                    {form.data.name ? form.data.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-foreground px-4 text-center text-sm leading-tight font-semibold">
                                    {form.data.name || 'Nama Belum Diisi'}
                                </span>
                                <span className="text-muted-foreground/60 mt-1 px-4 text-center text-xs font-medium tracking-wide uppercase">
                                    {form.data.position || 'Jabatan Belum Diatur'}
                                </span>

                                <div className="border-border mt-4 flex w-full flex-col items-center gap-2 border-t pt-4">
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                                        <Mail size={13} />
                                        {form.data.email || 'Email Belum Set'}
                                    </div>
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                                        <ShieldAlert size={13} />
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
        <div className="border-border bg-card m-5 rounded-2xl border p-5 shadow-sm">
            <TableMasterData
                title="Database Pengguna"
                columns={columns}
                borderless={true}
                data={users.data || []}
                searchPlaceholder="Cari nama, email, atau username..."
                searchValue={filters.search || ''}
                onSearchChange={(v: string) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                filters={filterConfig as any}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                headerActions={
                    canCreate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                            className="border-border/40 bg-card text-foreground hover:bg-muted/60 hover:border-border/60 h-10 gap-2 rounded-xl border px-6 text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                        >
                            <Plus className="h-4 w-4" /> Tambah User
                        </Button>
                    )
                }
                onRowClick={openEdit}
                bulkActions={
                    canDelete
                        ? [
                              {
                                  label: 'Hapus Terpilih',
                                  icon: Trash2,
                                  variant: 'destructive',
                                  onClick: (ids: string[] | number[]) => {
                                      if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} user terpilih?`)) {
                                          router.post(
                                              '/admin/users/bulk-delete',
                                              { ids },
                                              {
                                                  onSuccess: () => showToast(`${ids.length} user telah dihapus`, 'success'),
                                              },
                                          );
                                      }
                                  },
                              },
                          ]
                        : undefined
                }
                pagination={{
                    currentPage: users.current_page || 1,
                    lastPage: users.last_page || 1,
                    total: users.total || 0,
                    from: users.from || 1,
                    to: users.to || 1,
                    perPage: users.per_page || 10,
                    onPageChange: (page: number) =>
                        router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (perPage: number) =>
                        router.get(
                            globalThis.location.pathname,
                            { ...filters, per_page: perPage, page: 1 },
                            { preserveState: true, preserveScroll: true },
                        ),
                }}
            />
        </div>
    );
}
