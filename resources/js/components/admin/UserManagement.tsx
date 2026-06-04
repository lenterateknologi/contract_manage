import { Button } from '@/components/ui/base/Button';
import { Column, DataTable } from '@/components/ui/data/DataTable';
import { ExcelActions } from '@/components/ui/data/ExcelActions';
import { useToast } from '@/components/ui/feedback/Toast';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { avatarColor, cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Briefcase, Building2, CheckCircle2, Fingerprint, Lock, Mail, Phone, Plus, ShieldAlert, Trash2, User } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface UserManagementProps {
    users: any;
    roles: any[];
    departments: any[];
    companies?: any[];
    filters: any;
}

const ROLE_COLORS: Record<string, string> = {
    Admin: 'bg-role-admin-bg text-role-admin-text border border-role-admin-text/20',
    Manager: 'bg-role-manager-bg text-role-manager-text border border-role-manager-text/20',
    Staff: 'bg-role-staff-bg text-role-staff-text border border-role-staff-text/20',
    Reviewer: 'bg-role-reviewer-bg text-role-reviewer-text border border-role-reviewer-text/20',
    Approver: 'bg-role-approver-bg text-role-approver-text border border-role-approver-text/20',
};

const UserCell = ({ name, email }: Readonly<{ name: string; email: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold shadow-sm backdrop-blur-sm transition-all duration-200',
                avatarColor(name),
            )}
        >
            {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="text-text-main mb-0.5 truncate text-sm leading-tight font-semibold tracking-wide transition-transform duration-200 group-hover:translate-x-1">
                {name}
            </span>
            <span className="text-text-desc truncate text-xs font-medium tracking-tight lowercase">{email}</span>
        </div>
    </div>
);

export function UserManagement({ users, roles, departments, companies = [], filters }: Readonly<UserManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_USERS');
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role: roles[0]?.name || '',
        department_id: departments[0]?.id || '',
        company_id: companies[0]?.id || '',
        position: '',
        is_active: true as boolean,
    });

    // --- Deep Linking Support ---
    React.useEffect(() => {
        if (filters.action === 'create') {
            openCreate();
        } else if (filters.action === 'edit' && filters.id) {
            const user = users.data.find((u: any) => u.id === filters.id);
            if (user) openEdit(user);
        }
    }, [filters.action, filters.id, users.data]);

    const filterConfig = useMemo(
        () => [
            {
                label: 'Role Akses',
                key: 'role',
                type: 'choice',
                options: roles.map((r) => ({ label: r.name, value: r.name })),
            },
            {
                label: 'Unit / Departemen',
                key: 'department_id',
                type: 'searchable',
                options: departments.map((d) => ({ label: d.name, value: d.id })),
            },
            {
                label: 'Perusahaan / Company',
                key: 'company_id',
                type: 'searchable',
                options: companies.map((c) => ({ label: c.name, value: c.id })),
            },
        ],
        [roles, departments, companies],
    );

    const columns = useMemo<Column<any>[]>(
        () => [
            {
                header: 'Identitas Pengguna',
                accessorKey: 'name',
                sortable: true,
                cell: (row) => <UserCell name={row.name} email={row.email} />,
            },
            {
                header: 'Jabatan & Otoritas',
                accessorKey: 'role',
                cell: (row) => (
                    <div className="flex flex-col gap-1.5 select-none">
                        <span className="text-text-main text-xs font-semibold tracking-wide uppercase">{row.position || '—'}</span>
                        <div
                            className={cn(
                                'w-fit rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase shadow-sm ring-1 ring-black/[0.03]',
                                ROLE_COLORS[row.role] || 'bg-surface-muted text-text-desc',
                            )}
                        >
                            {row.role}
                        </div>
                    </div>
                ),
            },
            {
                header: 'Penempatan',
                accessorKey: 'department_id',
                cell: (row) => (
                    <div className="flex flex-col gap-1 select-none">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary flex h-5 w-5 items-center justify-center rounded shadow-inner">
                                <Building2 size={10} />
                            </div>
                            <span className="text-text-main text-[10px] font-bold tracking-tight uppercase">
                                {row.department?.name || 'No Dept'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-surface-muted/50 text-text-desc flex h-5 w-5 items-center justify-center rounded">
                                <Fingerprint size={10} />
                            </div>
                            <span className="text-text-desc text-[9px] font-semibold tracking-tight uppercase italic">
                                {row.company?.name || 'No Company'}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                header: 'Akses',
                accessorKey: 'is_active',
                className: 'text-right',
                cell: (row) => (
                    <div className="flex items-center justify-end gap-2 select-none">
                        <div className={cn('h-1.5 w-1.5 rounded-full', row.is_active ? 'bg-success animate-pulse' : 'bg-surface-muted')} />
                        <span
                            className={cn(
                                'text-[10px] font-black tracking-widest uppercase transition-colors duration-200 select-none',
                                row.is_active ? 'text-text-main' : 'text-text-desc',
                            )}
                        >
                            {row.is_active ? 'Aktif' : 'Terblokir'}
                        </span>
                    </div>
                ),
            },
        ],
        [],
    );

    const openCreate = () => {
        setEditingUser(null);
        form.reset();
        setIsEditorOpen(true);
    };

    const openEdit = (u: any) => {
        setEditingUser(u);
        form.setData({
            name: u.name,
            username: u.username,
            email: u.email,
            phone: u.phone || '',
            password: '',
            password_confirmation: '',
            role: u.role,
            department_id: u.department_id || '',
            company_id: u.company_id || '',
            position: u.position || '',
            is_active: !!u.is_active,
        });
        setIsEditorOpen(true);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsEditorOpen(false);
                setEditingUser(null);
                form.reset();
                showToast(`Data pengguna ${form.data.name} berhasil diperbarui`, 'success');
            },
            onError: (err: any) => {
                console.error(err);
                showToast('Gagal memproses data pengguna. Silakan periksa kembali input Anda.', 'danger');
            },
        };
        if (editingUser) form.put(route('admin.users.update', editingUser.id), options);
        else form.post(route('admin.users.store'), options);
    };

    const handleImport = (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        router.post(route('admin.users.import'), fd, {
            onSuccess: () => showToast('Data pengguna berhasil diimpor', 'success'),
        });
    };

    if (isEditorOpen) {
        const isEdit = !!editingUser;
        return (
            <ManagementForm
                title={isEdit ? 'Profil Otoritas Pengguna' : 'Registrasi Pengguna Baru'}
                subtitle={
                    isEdit
                        ? `Mengelola parameter akses dan identitas untuk ${form.data.name}`
                        : 'Mendaftarkan personil baru ke dalam sistem administrasi absah'
                }
                onClose={() => {
                    setIsEditorOpen(false);
                    setEditingUser(null);
                    // Clear deep-link filters
                    if (filters.action || filters.id) {
                        router.get(
                            globalThis.location.pathname,
                            { ...filters, action: undefined, id: undefined },
                            { preserveState: true, replace: true },
                        );
                    }
                }}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={isEdit}
                headerActions={
                    isEdit &&
                    canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsConfirmOpen(true)}
                            className="border-danger/10 text-danger hover:bg-danger px-4 text-xs transition-all hover:text-white active:scale-95"
                        >
                            <Trash2 size={15} className="mr-2" /> Hapus Akun
                        </Button>
                    )
                }
            >
                <ConfirmationModal
                    open={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        setIsConfirmOpen(false);
                        router.delete(route('admin.users.destroy', editingUser.id), {
                            onSuccess: () => {
                                setIsEditorOpen(false);
                                setEditingUser(null);
                                showToast('Akun pengguna telah dihapus secara permanen', 'success');
                            },
                        });
                    }}
                    title="Eliminasi Akun Pengguna"
                    description={`Apakah Anda yakin ingin menghapus akun "${editingUser?.name}" secara permanen? Seluruh riwayat audit akan tetap tersimpan namun akses akan diputus.`}
                    confirmText="Ya, Hapus Permanen"
                />

                <div className="animate-in fade-in grid w-full grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2">
                    {/* Side 1: Primary Configuration */}
                    <div className="space-y-12">
                        {/* Section: Identitas & Otentikasi */}
                        <FormSection title="Identitas & Otentikasi" subtitle="Informasi dasar dan kredensial akses pengguna">
                            <div className="grid grid-cols-1 gap-y-10">
                                <CompactInput
                                    label="Nama Lengkap Sesuai KTP"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="NAMA LENGKAP"
                                    error={form.errors.name}
                                    icon={User}
                                />
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <CompactInput
                                        label="Username Akses"
                                        value={form.data.username}
                                        onChange={(e) => form.setData('username', e.target.value)}
                                        placeholder="USERNAME"
                                        error={form.errors.username}
                                        icon={Fingerprint}
                                    />
                                    <CompactInput
                                        label="Email Institusi"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        placeholder="user@company.com"
                                        error={form.errors.email}
                                        icon={Mail}
                                    />
                                </div>
                                <CompactInput
                                    label="Nomor Telepon"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    placeholder="08XX XXXX XXXX"
                                    error={form.errors.phone}
                                    icon={Phone}
                                />
                                <div className="grid grid-cols-1 gap-8 border-t border-black/[0.03] pt-10 md:grid-cols-2 dark:border-white/[0.03]">
                                    <CompactInput
                                        label={editingUser ? 'Reset Password (Opsional)' : 'Set Password Akun'}
                                        type="password"
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        error={form.errors.password}
                                        icon={Lock}
                                    />
                                    <CompactInput
                                        label="Konfirmasi Password"
                                        type="password"
                                        value={form.data.password_confirmation}
                                        onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        error={form.errors.password_confirmation}
                                        icon={CheckCircle2}
                                    />
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    {/* Side 2: Organization & Meta */}
                    <div className="space-y-12">
                        {/* Section: Jabatan & Otoritas */}
                        <FormSection title="Penempatan & Otoritas" subtitle="Struktur organisasi dan peran sistem">
                            <div className="grid grid-cols-1 gap-y-10">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-2.5">
                                        <label className="text-primary/60 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase dark:text-white/60">
                                            <ShieldAlert size={12} className="opacity-50" /> Role Akses
                                        </label>
                                        <Select value={form.data.role} onValueChange={(v: string) => form.setData('role', String(v))}>
                                            <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-11 rounded-xl text-xs font-bold shadow-sm ring-1 ring-black/[0.03] transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-surface-border bg-surface-base rounded-xl shadow-2xl">
                                                {roles.map((r) => (
                                                    <SelectItem
                                                        key={r.id}
                                                        value={r.name}
                                                        className="py-3 text-xs font-bold text-black uppercase dark:text-white"
                                                    >
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.role && (
                                            <p className="text-danger mt-1.5 text-[10px] font-bold tracking-tight uppercase">{form.errors.role}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-primary/60 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase dark:text-white/60">
                                            <Building2 size={12} className="opacity-50" /> Unit / Departemen
                                        </label>
                                        <Select
                                            value={String(form.data.department_id)}
                                            onValueChange={(v: string) => form.setData('department_id', String(v))}
                                        >
                                            <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-11 rounded-xl text-xs font-bold shadow-sm ring-1 ring-black/[0.03] transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-surface-border bg-surface-base rounded-xl shadow-2xl">
                                                {departments.map((d) => (
                                                    <SelectItem
                                                        key={d.id}
                                                        value={String(d.id)}
                                                        className="py-3 text-xs font-bold text-black uppercase dark:text-white"
                                                    >
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.department_id && (
                                            <p className="text-danger mt-1.5 text-[10px] font-bold tracking-tight uppercase">
                                                {form.errors.department_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-primary/60 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase dark:text-white/60">
                                        <Building2 size={12} className="opacity-50" /> Perusahaan / Company
                                    </label>
                                    <Select
                                        value={String(form.data.company_id)}
                                        onValueChange={(v: string) => form.setData('company_id', String(v))}
                                    >
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-11 rounded-xl text-xs font-bold shadow-sm ring-1 ring-black/[0.03] transition-all">
                                            <SelectValue placeholder="PILIH PERUSAHAAN" />
                                        </SelectTrigger>
                                        <SelectContent className="border-surface-border bg-surface-base rounded-xl shadow-2xl">
                                            {companies.map((c) => (
                                                <SelectItem
                                                    key={c.id}
                                                    value={String(c.id)}
                                                    className="py-3 text-xs font-bold text-black uppercase dark:text-white"
                                                >
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.company_id && (
                                        <p className="text-danger mt-1.5 text-[10px] font-bold tracking-tight uppercase">
                                            {form.errors.company_id}
                                        </p>
                                    )}

                                    {/* Auto-populated Info Section */}
                                    {form.data.company_id && (
                                        <div className="bg-surface-muted/30 mt-4 flex flex-col gap-4 rounded-xl border border-black/[0.03] p-4 dark:border-white/[0.03]">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-primary/10 text-primary flex h-5 w-5 items-center justify-center rounded">
                                                        <User size={10} className="opacity-50" />
                                                    </div>
                                                    <span className="text-[10px] font-bold tracking-tight text-slate-500 uppercase">
                                                        Company Group
                                                    </span>
                                                </div>
                                                <span className="text-text-main text-[10px] font-black tracking-widest uppercase">
                                                    {companies.find((c) => c.id === form.data.company_id)?.group?.name || '—'}
                                                </span>
                                            </div>
                                            <div className="h-px w-full bg-black/[0.03] dark:bg-white/[0.03]" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-primary/10 text-primary flex h-5 w-5 items-center justify-center rounded">
                                                        <Fingerprint size={10} className="opacity-50" />
                                                    </div>
                                                    <span className="text-[10px] font-bold tracking-tight text-slate-500 uppercase">
                                                        Region / Wilayah
                                                    </span>
                                                </div>
                                                <span className="text-text-main text-[10px] font-black tracking-widest uppercase">
                                                    {companies.find((c) => c.id === form.data.company_id)?.region?.name || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <CompactInput
                                    label="Jabatan Struktural"
                                    value={form.data.position}
                                    onChange={(e) => form.setData('position', e.target.value)}
                                    placeholder="CONTOH: KEPALA BAGIAN HUKUM"
                                    error={form.errors.position}
                                    icon={Briefcase}
                                />
                            </div>
                        </FormSection>

                        <div className="grid grid-cols-1 items-start">
                            <div className="space-y-10">
                                <FormSection title="Status Akses">
                                    <CompactSwitch
                                        label="Akun Aktif"
                                        description="Berikan akses masuk ke portal admin"
                                        checked={form.data.is_active}
                                        onCheckedChange={(c) => form.setData('is_active', c)}
                                    />
                                </FormSection>

                                <div className="animate-in fade-in flex gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-sm duration-300 dark:bg-amber-500/10">
                                    <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-500" />
                                    <p className="text-[10px] leading-relaxed font-semibold tracking-tight text-amber-700/80 uppercase">
                                        Perubahan parameter otoritas akan berdampak pada hak akses navigasi dan aksi pengguna secara langsung.
                                    </p>
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
            title="Registri Otoritas Pengguna"
            columns={columns}
            borderless={true}
            data={users.data || []}
            searchPlaceholder="Cari pengguna berdasarkan nama, email, atau jabatan..."
            searchValue={filters.search || ''}
            onSearchChange={(v: string) =>
                router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
            }
            filters={filterConfig as any}
            activeFilters={filters}
            onFilterChange={(newFilters: any) => {
                router.get(globalThis.location.pathname, { ...filters, ...newFilters, page: 1 }, { preserveState: true, replace: true });
            }}
            headerActions={
                <div className="flex items-center gap-2">
                    <ExcelActions exportRoute="admin.users.export" importRoute="admin.users.import" label="Pengguna" onImport={handleImport} />
                    {canCreate && (
                        <Button variant="white" onClick={openCreate}>
                            <Plus size={15} className="text-primary" /> Tambah Pengguna
                        </Button>
                    )}
                </div>
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
                                  if (confirm(`Apakah Anda yakin ingin menghapus ${ids.length} akun pengguna terpilih?`)) {
                                      router.post(
                                          route('admin.users.bulk-destroy'),
                                          { ids },
                                          {
                                              onSuccess: () => showToast(`${ids.length} akun pengguna telah dihapus`, 'success'),
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
                onPerPageChange: (pp: number) =>
                    router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
