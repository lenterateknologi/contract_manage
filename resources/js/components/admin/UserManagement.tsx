import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { Modal } from '@/components/ui/overlays/Modal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet, Fingerprint, Mail, Phone, Plus, ShieldAlert, Trash2, Upload, UserCircle, Check, Loader2 } from 'lucide-react';
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
    'bg-info/10 text-info dark:bg-info/20 dark:text-info',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
];

const ROLE_COLORS: Record<string, string> = {
    Admin: 'bg-role-admin-bg text-role-admin-text border border-role-admin-text/20',
    Manager: 'bg-role-manager-bg text-role-manager-text border border-role-manager-text/20',
    Staff: 'bg-role-staff-bg text-role-staff-text border border-role-staff-text/20',
    Reviewer: 'bg-role-reviewer-bg text-role-reviewer-text border border-role-reviewer-text/20',
    Approver: 'bg-role-approver-bg text-role-approver-text border border-role-approver-text/20',
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
            <span className="truncate text-sm leading-tight font-bold tracking-wide text-text-main">{name}</span>
            <span className="text-text-desc mt-0.5 truncate text-xs leading-none font-medium">{email}</span>
        </div>
    </div>
);

const IdentityCell = ({ username, phone }: Readonly<{ username: string; phone?: string }>) => (
    <div className="flex flex-col gap-1 select-none">
        <div className="text-text-desc flex items-center gap-1.5 text-xs font-bold tracking-wide">
            <Fingerprint size={12} className="text-primary opacity-60" />
            {username}
        </div>
        {phone && (
            <div className="text-text-soft flex items-center gap-1.5 text-xs font-medium tracking-tight">
                <Phone size={12} className="opacity-40" />
                {phone}
            </div>
        )}
    </div>
);

const PlacementCell = ({ departmentName, position }: Readonly<{ departmentName?: string; position?: string }>) => (
    <div className="flex flex-col gap-1 select-none">
        <span className="inline-block w-fit rounded-xl border border-primary/20 bg-primary-muted px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur-md">
            {departmentName || 'Global'}
        </span>
        <span className="text-text-desc mt-0.5 pl-1 text-xs font-medium">{position || 'Staf'}</span>
    </div>
);

const AuthorityCell = ({ role }: Readonly<{ role: string }>) => (
    <span
        className={cn(
            'inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold tracking-wide shadow-sm backdrop-blur-sm select-none',
            ROLE_COLORS[role] ?? 'border border-text-soft/20 bg-secondary text-text-desc',
        )}
    >
        {role}
    </span>
);

const AccessCell = ({ isActive }: Readonly<{ isActive: boolean }>) => (
    <div className="flex items-center gap-2 select-none">
        <div className={cn('h-2 w-2 shrink-0 rounded-full', isActive ? 'animate-pulse bg-success' : 'bg-danger')} />
        <span
            className={cn(
                'text-xs font-bold tracking-wide',
                isActive ? 'text-success' : 'text-danger',
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
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
    const [dragActive, setDragActive] = React.useState(false);

    const importForm = useForm({
        file: null as File | null,
    });

    const handleExportExcel = () => {
        window.location.href = '/admin/users/export';
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                importForm.setData('file', file);
            } else {
                showToast('Hanya file Excel (.xlsx, .xls) yang diperbolehkan.', 'danger');
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                importForm.setData('file', file);
            } else {
                showToast('Hanya file Excel (.xlsx, .xls) yang diperbolehkan.', 'danger');
            }
        }
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importForm.data.file) return;

        importForm.post('/admin/users/import', {
            onSuccess: () => {
                setIsImportModalOpen(false);
                importForm.reset();
                showToast('Data karyawan berhasil diimpor.', 'success');
            },
            onError: (errors) => {
                showToast(errors.error || 'Gagal mengimpor data.', 'danger');
            }
        });
    };

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
                            className="border-danger/20 text-danger hover:bg-danger hover:text-white"
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
                                    <label className="text-text-desc flex items-center gap-2 text-[10px] font-bold uppercase">
                                        Role Akses
                                    </label>
                                    <Select value={form.data.role} onValueChange={(v: string) => form.setData('role', String(v))}>
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-surface-border rounded-xl bg-surface-base shadow-2xl">
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={r.name} className="py-2.5 text-xs font-bold uppercase">
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.role && (
                                        <p className="mt-1 text-[10px] font-bold tracking-tight text-danger uppercase">{form.errors.role}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-text-desc flex items-center gap-2 text-[10px] font-bold uppercase">
                                        Unit / Departemen
                                    </label>
                                    <Select
                                        value={String(form.data.department_id)}
                                        onValueChange={(v: string) => form.setData('department_id', String(v))}
                                    >
                                        <SelectTrigger className="border-primary/10 bg-primary/5 focus:border-primary h-10 rounded-xl text-xs font-bold transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-surface-border rounded-xl bg-surface-base shadow-2xl">
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)} className="py-2.5 text-xs font-bold uppercase">
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.department_id && (
                                        <p className="mt-1 text-[10px] font-bold tracking-tight text-danger uppercase">
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

                        <div className="border-surface-border/80 bg-surface-muted/20 group relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-200 select-none">
                            <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity duration-200 group-hover:opacity-10">
                                <UserCircle size={80} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 mb-4 flex items-center gap-3">
                                <span className="text-xs font-bold tracking-wider text-text-main uppercase">Preview Profil</span>
                            </div>

                            <div className="border-surface-border/60 relative z-10 flex flex-col items-center border-y border-dashed py-4 select-none">
                                <div className="bg-primary mb-4 flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-md">
                                    {form.data.name ? form.data.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="px-4 text-center text-sm leading-tight font-bold tracking-wide text-text-main">
                                    {form.data.name || 'Nama Belum Diisi'}
                                </span>
                                <span className="text-text-desc/80 mt-1 px-4 text-center text-xs font-bold tracking-wider uppercase">
                                    {form.data.position || 'Jabatan Belum Diatur'}
                                </span>

                                <div className="border-surface-border/40 mt-4 flex w-full flex-col items-center gap-2 border-t pt-4">
                                    <div className="text-text-desc flex items-center gap-2 text-xs font-medium">
                                        <Mail size={13} className="text-primary" />
                                        {form.data.email || 'Email Belum Set'}
                                    </div>
                                    <div className="text-text-desc flex items-center gap-2 text-xs font-bold">
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
        <div className="bg-surface-base/40 border-surface-border/60 animate-in fade-in m-5 rounded-2xl border p-6 shadow-sm backdrop-blur-sm duration-200 select-none">
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
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="white"
                            onClick={handleExportExcel}
                        >
                            <Download className="text-success h-4 w-4" /> Export Excel
                        </Button>
                        {canCreate && (
                            <>
                                <Button
                                    type="button"
                                    variant="white"
                                    onClick={() => setIsImportModalOpen(true)}
                                >
                                    <Upload className="text-primary h-4 w-4" /> Import Excel
                                </Button>
                                <Button
                                    type="button"
                                    variant="white"
                                    onClick={openCreate}
                                >
                                    <Plus className="text-primary h-4 w-4" /> Tambah User
                                </Button>
                            </>
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

            {canCreate && (
                <Modal
                    isOpen={isImportModalOpen}
                    onClose={() => {
                        setIsImportModalOpen(false);
                        importForm.reset();
                    }}
                    title={
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold tracking-wider text-text-main uppercase">Import Database Karyawan</h3>
                                <p className="mt-0.5 text-[10px] font-medium text-text-soft uppercase">Perbarui & tambah data karyawan secara massal</p>
                            </div>
                        </div>
                    }
                    maxWidth="md"
                >
                    <form onSubmit={handleImportSubmit} className="space-y-5 text-left mt-4">
                        {(importForm.errors as any).error && (
                            <div className="flex items-start gap-2.5 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-[11px] font-bold text-danger uppercase leading-normal">
                                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <span className="block font-black">Kesalahan Impor:</span>
                                    <span className="block mt-0.5 font-medium whitespace-pre-wrap">{(importForm.errors as any).error}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[9px] font-black text-text-soft uppercase">Petunjuk Format & Template</span>
                            </div>
                            <div className="rounded-2xl border border-surface-border bg-surface-muted p-4">
                                <p className="text-[10px] font-medium text-text-desc leading-relaxed uppercase">
                                    Sistem menggunakan format 3 worksheet dengan validasi departemen otomatis menggunakan VLOOKUP. Gunakan tombol di bawah ini untuk mengunduh database saat ini sebagai template acuan pengisian.
                                </p>
                                <Button
                                    type="button"
                                    variant="white"
                                    onClick={handleExportExcel}
                                    className="mt-3 h-8 gap-2 rounded-xl border border-surface-border bg-surface-base px-3 text-[10px] font-bold uppercase transition-all select-none hover:bg-surface-muted"
                                >
                                    <Download size={12} className="text-success" /> Unduh Template Database
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="px-1 text-[9px] font-black text-text-soft uppercase">
                                File Dokumen Excel <span className="text-danger">*</span>
                            </label>
                            <div 
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                className="relative"
                            >
                                <input 
                                    type="file" 
                                    id="import-excel-file" 
                                    className="hidden" 
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    disabled={importForm.processing} 
                                />

                                {!importForm.data.file ? (
                                    <label
                                        htmlFor="import-excel-file"
                                        className={cn(
                                            "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-200 select-none",
                                            dragActive 
                                                ? "border-primary bg-primary/5" 
                                                : "border-surface-border bg-surface-muted/20 hover:border-primary hover:bg-primary/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform duration-200 hover:scale-110",
                                            dragActive ? "bg-primary text-white" : "bg-primary/10 text-primary"
                                        )}>
                                            <Upload size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-text-main uppercase">
                                                Tarik & Lepas File Excel di Sini
                                            </h4>
                                            <p className="mt-1 text-[9px] font-bold tracking-wider text-text-soft uppercase">
                                                Atau klik untuk menelusuri penyimpanan lokal
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-surface-border bg-surface-base px-3 py-1 text-[8px] font-bold text-text-soft uppercase">
                                            Format: .xlsx atau .xls (Maks. 5MB)
                                        </div>
                                    </label>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-success/20 bg-success/[0.02] p-8 text-center select-none">
                                        <div className="flex h-14 w-14 animate-bounce items-center justify-center rounded-2xl bg-success/10 text-success shadow-inner">
                                            <FileSpreadsheet size={26} />
                                        </div>
                                        <div className="max-w-[320px]">
                                            <h4 className="text-[10px] font-black tracking-wider text-success uppercase">
                                                File Excel Terpilih
                                            </h4>
                                            <p className="mx-auto mt-2 max-w-[280px] truncate rounded-xl border border-surface-border bg-surface-base px-3 py-1 text-xs font-black text-text-main uppercase">
                                                {importForm.data.file.name}
                                            </p>
                                            <p className="mt-1.5 text-[9px] font-bold text-text-soft uppercase">
                                                Ukuran: {(importForm.data.file.size / 1024).toFixed(1)} KB • Tipe: Excel Document
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            type="button"
                                            onClick={() => importForm.setData('file', null)}
                                            className="mt-2 h-8 rounded-xl bg-danger/5 px-4 text-[9px] font-black text-danger uppercase transition-all hover:bg-danger/10 hover:underline"
                                        >
                                            Ganti File
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-surface-border pt-6">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                    setIsImportModalOpen(false);
                                    importForm.reset();
                                }}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={importForm.processing || !importForm.data.file}
                                className="px-8 shadow-primary/20"
                            >
                                {importForm.processing ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Memproses Impor...
                                    </>
                                ) : (
                                    <>
                                        <Check size={12} />
                                        Mulai Impor
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
