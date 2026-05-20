import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
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

const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
];

const ROLE_COLORS: Record<string, string> = {
    Admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 border border-violet-500/20',
    Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-500/20',
    Staff: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-500/20',
    Reviewer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-500/20',
    Approver: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-500/20',
};

function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const UserCell = ({ name, email }: Readonly<{ name: string; email: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm backdrop-blur-sm transition-all duration-200',
                avatarColor(name),
            )}
        >
            {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm leading-tight font-bold tracking-wide text-slate-900 dark:text-slate-100">{name}</span>
            <span className="text-muted-foreground/80 mt-0.5 truncate text-xs leading-none font-medium dark:text-slate-400">{email}</span>
        </div>
    </div>
);

const IdentityCell = ({ username, phone }: Readonly<{ username: string; phone?: string }>) => (
    <div className="flex flex-col gap-1 select-none">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wide dark:text-slate-300">
            <Fingerprint size={12} className="text-primary opacity-60" />
            {username}
        </div>
        {phone && (
            <div className="text-muted-foreground/60 flex items-center gap-1.5 text-xs font-medium tracking-tight dark:text-slate-400">
                <Phone size={12} className="opacity-40" />
                {phone}
            </div>
        )}
    </div>
);

const PlacementCell = ({ departmentName, position }: Readonly<{ departmentName?: string; position?: string }>) => (
    <div className="flex flex-col gap-1 select-none">
        <span className="inline-block w-fit rounded-xl border border-indigo-500/20 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur-md dark:bg-indigo-900/30 dark:text-indigo-400">
            {departmentName || 'Global'}
        </span>
        <span className="text-muted-foreground mt-0.5 pl-1 text-xs font-medium dark:text-slate-400/80">{position || 'Staf'}</span>
    </div>
);

const AuthorityCell = ({ role }: Readonly<{ role: string }>) => (
    <span
        className={cn(
            'inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold tracking-wide shadow-sm backdrop-blur-sm select-none',
            ROLE_COLORS[role] ?? 'border border-slate-500/20 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        )}
    >
        {role}
    </span>
);

const AccessCell = ({ isActive }: Readonly<{ isActive: boolean }>) => (
    <div className="flex items-center gap-2 select-none">
        <div className={cn('h-2 w-2 shrink-0 rounded-full', isActive ? 'animate-pulse bg-emerald-500' : 'bg-rose-400')} />
        <span
            className={cn(
                'text-xs font-bold tracking-wide',
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400',
            )}
        >
            {isActive ? 'Aktif' : 'Nonaktif'}
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
                            className="h-10 rounded-xl border border-rose-500/20 px-4 text-xs font-bold text-rose-500 transition-all duration-200 select-none hover:bg-rose-500 hover:text-white active:scale-95 dark:hover:bg-rose-500/20"
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
                <div className="animate-in fade-in grid grid-cols-1 gap-8 duration-200 select-none md:grid-cols-12">
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
                                <div className="space-y-2">
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                                        Role Akses
                                    </label>
                                    <Select value={form.data.role} onValueChange={(v: string) => form.setData('role', String(v))}>
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={r.name} className="py-2.5 text-xs font-bold uppercase">
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.role && (
                                        <p className="mt-1 text-[10px] font-bold tracking-tight text-rose-500 uppercase">{form.errors.role}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-bold uppercase dark:text-white/60">
                                        Unit / Departemen
                                    </label>
                                    <Select
                                        value={String(form.data.department_id)}
                                        onValueChange={(v: string) => form.setData('department_id', String(v))}
                                    >
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-primary/10 rounded-xl bg-white shadow-2xl dark:bg-black">
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)} className="py-2.5 text-xs font-bold uppercase">
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.department_id && (
                                        <p className="mt-1 text-[10px] font-bold tracking-tight text-rose-500 uppercase">
                                            {form.errors.department_id}
                                        </p>
                                    )}
                                </div>
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

                        <div className="border-border/80 bg-muted/20 group relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-200 select-none dark:border-slate-800/80 dark:bg-slate-900/40">
                            <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity duration-200 group-hover:opacity-10">
                                <UserCircle size={80} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 mb-4 flex items-center gap-3">
                                <span className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-slate-100">Preview Profil</span>
                            </div>

                            <div className="border-border/60 relative z-10 flex flex-col items-center border-y border-dashed py-4 select-none dark:border-slate-800/60">
                                <div className="bg-primary mb-4 flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-md">
                                    {form.data.name ? form.data.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="px-4 text-center text-sm leading-tight font-bold tracking-wide text-slate-900 dark:text-slate-100">
                                    {form.data.name || 'Nama Belum Diisi'}
                                </span>
                                <span className="text-muted-foreground/80 mt-1 px-4 text-center text-xs font-bold tracking-wider uppercase dark:text-slate-400">
                                    {form.data.position || 'Jabatan Belum Diatur'}
                                </span>

                                <div className="border-border/40 mt-4 flex w-full flex-col items-center gap-2 border-t pt-4 dark:border-slate-800/40">
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium dark:text-slate-300">
                                        <Mail size={13} className="text-primary" />
                                        {form.data.email || 'Email Belum Set'}
                                    </div>
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-bold dark:text-slate-300">
                                        <ShieldAlert size={13} className="text-primary" />
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
        <div className="bg-card/40 border-border/60 animate-in fade-in m-5 rounded-2xl border p-6 shadow-sm backdrop-blur-sm duration-200 select-none dark:border-slate-800/60 dark:bg-slate-900/20">
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
                            className="border-border bg-card text-foreground hover:bg-muted/60 hover:border-border h-10 gap-2 rounded-xl border px-5 text-xs font-bold tracking-wide shadow-sm transition-all duration-200 select-none hover:shadow-md dark:bg-slate-900/60 dark:hover:bg-slate-800/60"
                        >
                            <Plus className="text-primary h-4 w-4" /> Tambah User
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
