import { Button } from '@/components/ui/buttons/Button';
import { Column, DataTable } from '@/components/ui/tables/DataTable';
import { useToast } from '@/components/ui/feedback/Toast';
import { CompactInput } from '@/components/ui/inputs/CompactInput';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface RoleManagementProps {
    roles: any;
    filters: any;
}

const ROLE_PALETTE = [
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-info/10 text-info dark:bg-info/20 dark:text-info',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
];

function roleColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return ROLE_PALETTE[Math.abs(h) % ROLE_PALETTE.length];
}

export function RoleManagement({ roles, filters }: Readonly<RoleManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canDelete } = usePermissions('ADMIN_ROLES');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        name: '',
        description: '',
    });

    const filterConfig = useMemo(
        () => [
            {
                label: 'Tanggal Registrasi',
                key: 'created',
                type: 'date-range',
            },
        ],
        [],
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
                header: 'Nama Role / Jabatan',
                accessorKey: 'name',
                cell: (row) => (
                    <div className="flex items-center gap-3 select-none">
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-200 select-none',
                                roleColor(row.name),
                            )}
                        >
                            <ShieldCheck size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-text-main text-sm leading-tight font-semibold tracking-wide select-none">{row.name}</span>
                            <span className="text-text-desc/80 mt-0.5 text-xs font-medium">
                                Terdaftar: {new Date(row.created_at).toLocaleDateString('id-ID')}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                header: 'Deskripsi Otoritas',
                accessorKey: 'description',
                cell: (row) =>
                    row.description ? (
                        <span className="text-text-desc block max-w-sm truncate text-sm leading-tight font-medium">{row.description}</span>
                    ) : (
                        <span className="text-text-soft/30 text-sm leading-none font-medium italic">—</span>
                    ),
            },
        ],
        [],
    );

    const openCreate = () => {
        setEditingRole(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (role: any) => {
        setEditingRole(role);
        form.setData({
            name: role.name,
            description: role.description || '',
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingRole(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingRole ? 'Data role diperbarui' : 'Role baru berhasil dibuat', 'success');
            },
        };
        if (editingRole) form.put(`/admin/roles/${editingRole.id}`, options);
        else form.post('/admin/roles', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingRole ? 'Update Parameter Role' : 'Registrasi Role Baru'}
                subtitle={editingRole ? 'Konfigurasi parameter otorisasi sistem' : 'Definisikan kategori otorisasi baru'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingRole}
                headerActions={
                    editingRole &&
                    canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsConfirmOpen(true)}
                            className="border-danger/20 text-danger hover:bg-danger h-10 rounded-xl border px-4 text-xs font-bold transition-all duration-200 select-none hover:text-white active:scale-95"
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
                        router.delete(`/admin/roles/${editingRole.id}`, {
                            onSuccess: () => {
                                closeForm();
                                showToast('Role telah dihapus', 'success');
                            },
                        });
                    }}
                    title="Hapus Role Otoritas"
                    description={`Apakah Anda yakin ingin menghapus role ${editingRole?.name}? Seluruh mapping hak akses untuk role ini akan dihapus permanen.`}
                    confirmText="Hapus Role"
                />
                <div className="animate-in fade-in grid w-full grid-cols-1 gap-16 duration-300 select-none lg:grid-cols-2">
                    {/* Side 1: Primary Configuration */}
                    <div className="space-y-12">
                        <FormSection title="Identitas Otoritas" subtitle="Nama jabatan dan penjelasan peran dalam ekosistem sistem">
                            <div className="grid grid-cols-1 gap-y-10">
                                <CompactInput
                                    label="Nama Jabatan / Role"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="CONTOH: LEGAL MANAGER"
                                    error={form.errors.name}
                                    icon={ShieldCheck}
                                />
                                <div className="space-y-1.5">
                                    <CompactInput
                                        label="Penjelasan Fungsi"
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="TULISKAN DESKRIPSI TANGGUNG JAWAB ROLE INI SECARA MENDALAM..."
                                        error={form.errors.description}
                                    />
                                </div>
                            </div>
                        </FormSection>
                    </div>

                    {/* Side 2: Information & Authority Hub */}
                    <div className="space-y-12">
                        <div className="group relative overflow-hidden rounded-[2rem] border-2 border-dashed border-black/[0.03] p-10 transition-all duration-200 select-none hover:bg-black/[0.01] dark:border-white/[0.03] dark:hover:bg-white/[0.01]">
                            <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity duration-200 group-hover:opacity-10">
                                <ShieldCheck size={100} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 mb-6 flex items-center gap-3">
                                <span className="text-text-main text-[10px] font-semibold tracking-widest uppercase opacity-60">
                                    Authority Architecture
                                </span>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <p className="text-text-desc text-[11px] leading-relaxed font-semibold">
                                    Role ini menentukan hak akses dasar pengguna terhadap modul-modul sistem. Gunakan menu
                                    <span className="text-primary font-bold"> Pemetaan Hak Akses </span>
                                    untuk mengatur konfigurasi izin (Read, Create, Update, Delete) secara spesifik sesuai tanggung jawab struktural.
                                </p>
                                <div className="bg-primary/5 border-primary/10 flex w-fit items-center gap-2 rounded-xl border px-4 py-2">
                                    <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                                    <span className="text-primary text-[9px] font-semibold tracking-widest uppercase">Parameter Otoritas Aktif</span>
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
            title="Database Role & Otoritas"
            columns={columns}
            borderless={true}
            data={roles.data || []}
            searchPlaceholder="Cari role..."
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
                        className="border-surface-border bg-surface-base text-text-main hover:bg-surface-muted/60 hover:border-surface-border h-10 gap-2 rounded-xl border px-5 text-xs font-bold tracking-wide shadow-sm transition-all duration-200 select-none hover:shadow-md"
                    >
                        <Plus size={15} className="text-primary" /> Tambah Role
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
                                if (confirm(`Hapus ${ids.length} role terpilih?`)) {
                                    router.post(
                                        '/admin/roles/bulk-delete',
                                        { ids },
                                        {
                                            onSuccess: () => showToast(`${ids.length} role telah dihapus`, 'success'),
                                        },
                                    );
                                }
                            },
                        },
                    ]
                    : undefined
            }
            pagination={{
                currentPage: roles.current_page || 1,
                lastPage: roles.last_page || 1,
                total: roles.total || 0,
                from: roles.from || 1,
                to: roles.to || 1,
                perPage: roles.per_page || 10,
                onPageChange: (page: number) =>
                    router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                onPerPageChange: (pp: number) =>
                    router.get(globalThis.location.pathname, { ...filters, per_page: pp, page: 1 }, { preserveState: true, preserveScroll: true }),
            }}
        />
    );
}
