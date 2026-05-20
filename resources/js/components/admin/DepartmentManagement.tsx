import { useToast } from '@/components/contracts/Toast';
import { Button } from '@/components/ui/base/Button';
import { Column, TableMasterData } from '@/components/ui/data/TableMasterData';
import { CompactInput } from '@/components/ui/forms/CompactInput';
import { CompactSwitch } from '@/components/ui/forms/CompactSwitch';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { FormSection, ManagementForm } from './ManagementForm';

interface DepartmentManagementProps {
    departments: any;
    filters: any;
}

const DEPT_COLORS = [
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
];

function deptColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return DEPT_COLORS[Math.abs(h) % DEPT_COLORS.length];
}

const DeptCell = ({ name, code }: Readonly<{ name: string; code: string }>) => (
    <div className="flex items-center gap-3 select-none">
        <div
            className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200 select-none',
                deptColor(name),
            )}
        >
            <Building2 size={18} />
        </div>
        <div className="flex min-w-0 flex-col">
            <span className="mb-0.5 truncate text-sm leading-tight font-bold tracking-wide text-slate-900 dark:text-slate-100">{name}</span>
            <div className="text-muted-foreground/80 flex items-center gap-1.5 font-mono text-xs leading-none font-semibold dark:text-slate-400">
                {code}
            </div>
        </div>
    </div>
);

const DescriptionCell = ({ description }: Readonly<{ description?: string }>) => (
    <span className="text-muted-foreground line-clamp-1 max-w-[300px] text-sm font-medium tracking-wide dark:text-slate-300/80">
        {description || '—'}
    </span>
);

const VisibilityCell = ({ isActive }: Readonly<{ isActive: boolean }>) => (
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

export function DepartmentManagement({ departments, filters }: Readonly<DepartmentManagementProps>) {
    const { showToast } = useToast();
    const { canCreate, canUpdate, canDelete } = usePermissions('ADMIN_DEPTS');
    const [isFormView, setIsFormView] = React.useState(false);
    const [editingDept, setEditingDept] = React.useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const form = useForm({
        code: '',
        name: '',
        description: '',
        is_active: true as boolean,
    });

    const filterConfig = useMemo(
        () => [
            {
                label: 'Status Visibilitas',
                key: 'is_active',
                options: [
                    { label: 'Visible (Aktif)', value: 'true' },
                    { label: 'Hidden (Nonaktif)', value: 'false' },
                ],
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
                header: 'Departemen / Unit',
                accessorKey: 'name',
                cell: (row) => <DeptCell name={row.name} code={row.code} />,
            },
            {
                header: 'Deskripsi',
                accessorKey: 'description',
                cell: (row) => <DescriptionCell description={row.description} />,
            },
            {
                header: 'Visibilitas',
                accessorKey: 'is_active',
                cell: (row) => <VisibilityCell isActive={row.is_active} />,
            },
        ],
        [],
    );

    const openCreate = () => {
        setEditingDept(null);
        form.reset();
        setIsFormView(true);
    };

    const openEdit = (dept: any) => {
        setEditingDept(dept);
        form.setData({
            code: dept.code || '',
            name: dept.name,
            description: dept.description || '',
            is_active: !!dept.is_active,
        });
        setIsFormView(true);
    };

    const closeForm = () => {
        setIsFormView(false);
        setEditingDept(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeForm();
                showToast(editingDept ? 'Departemen diperbarui' : 'Departemen baru ditambahkan', 'success');
            },
        };
        if (editingDept) form.put(`/admin/departments/${editingDept.id}`, options);
        else form.post('/admin/departments', options);
    };

    if (isFormView) {
        return (
            <ManagementForm
                title={editingDept ? 'Update Master Departemen' : 'Registrasi Master Departemen'}
                subtitle={editingDept ? 'Pengaturan detail unit organisasi' : 'Registrasi divisi atau unit organisasi'}
                onClose={closeForm}
                onSave={handleSubmit}
                processing={form.processing}
                isDirty={form.isDirty}
                isEdit={!!editingDept}
                headerActions={
                    editingDept &&
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
                        router.delete(`/admin/departments/${editingDept.id}`, {
                            onSuccess: () => {
                                closeForm();
                                showToast('Departemen telah dihapus', 'success');
                            },
                        });
                    }}
                    title="Konfirmasi Penghapusan"
                    description={`Apakah Anda yakin ingin menghapus departemen ${editingDept?.name}? Tindakan ini tidak dapat dibatalkan.`}
                    confirmText="Hapus Departemen"
                />
                <div className="animate-in fade-in grid grid-cols-1 gap-8 duration-200 select-none md:grid-cols-12">
                    {/* Main Column: 8 Columns */}
                    <div className="space-y-8 md:col-span-8">
                        <FormSection title="Data Organisasi" subtitle="Identitas unik dan deskripsi unit kerja">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <CompactInput
                                    label="Kode / Singkatan"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    placeholder="CONTOH: IT"
                                    error={form.errors.code}
                                />
                                <CompactInput
                                    label="Nama Unit Struktural"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="NAMA LENGKAP DIVISI"
                                    error={form.errors.name}
                                    containerClassName="md:col-span-2"
                                />
                                <CompactInput
                                    label="Keterangan Fungsi"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="TULISKAN DESKRIPSI UNIT KERJA INI..."
                                    error={form.errors.description}
                                    containerClassName="md:col-span-3"
                                />
                            </div>
                        </FormSection>
                    </div>

                    {/* Side Column: 4 Columns */}
                    <div className="flex flex-col gap-8 md:col-span-4">
                        <FormSection title="Status Visibilitas">
                            <CompactSwitch
                                label="Unit Terlihat"
                                description="Tampilkan unit ini di seluruh aplikasi"
                                checked={form.data.is_active}
                                onCheckedChange={(c) => form.setData('is_active', c)}
                            />
                        </FormSection>

                        <div className="border-border/80 bg-muted/20 group relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all duration-200 select-none dark:border-slate-800/80 dark:bg-slate-900/40">
                            <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity duration-200 group-hover:opacity-10">
                                <Building2 size={80} strokeWidth={1} />
                            </div>

                            <div className="relative z-10 mb-4 flex items-center gap-3">
                                <span className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-slate-100">Arsitektur Unit</span>
                            </div>

                            <p className="text-muted-foreground relative z-10 text-xs leading-relaxed font-medium dark:text-slate-400">
                                Departemen digunakan untuk mengelompokkan pengguna dan menentukan keterlibatan dalam alur persetujuan (Workflow)
                                secara otomatis.
                            </p>
                        </div>
                    </div>
                </div>
            </ManagementForm>
        );
    }

    return (
        <div className="bg-card/40 border-border/60 animate-in fade-in m-5 rounded-2xl border p-6 shadow-sm backdrop-blur-sm duration-200 select-none dark:border-slate-800/60 dark:bg-slate-900/20">
            <TableMasterData
                title="Database Unit / Departemen"
                columns={columns}
                borderless={true}
                data={departments.data || []}
                searchPlaceholder="Cari departemen..."
                searchValue={filters.search || ''}
                onSearchChange={(v: string) =>
                    router.get(globalThis.location.pathname, { ...filters, search: v, page: 1 }, { preserveState: true, replace: true })
                }
                filters={filterConfig as any}
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                headerActions={
                    canUpdate && (
                        <Button
                            variant="white"
                            onClick={openCreate}
                            className="border-border bg-card text-foreground hover:bg-muted/60 hover:border-border h-10 gap-2 rounded-xl border px-5 text-xs font-bold tracking-wide shadow-sm transition-all duration-200 select-none hover:shadow-md dark:bg-slate-900/60 dark:hover:bg-slate-800/60"
                        >
                            <Plus size={15} className="text-primary" /> Tambah Unit
                        </Button>
                    )
                }
                onRowClick={openEdit}
                bulkActions={
                    canUpdate
                        ? [
                              {
                                  label: 'Hapus Terpilih',
                                  icon: Trash2,
                                  variant: 'destructive',
                                  onClick: (ids: string[] | number[]) => {
                                      if (confirm(`Hapus ${ids.length} departemen terpilih?`)) {
                                          router.post(
                                              '/admin/departments/bulk-delete',
                                              { ids },
                                              {
                                                  onSuccess: () => showToast(`${ids.length} departemen telah dihapus`, 'success'),
                                              },
                                          );
                                      }
                                  },
                              },
                          ]
                        : undefined
                }
                pagination={{
                    currentPage: departments.current_page || 1,
                    lastPage: departments.last_page || 1,
                    total: departments.total || 0,
                    from: departments.from || 1,
                    to: departments.to || 1,
                    perPage: departments.per_page || 10,
                    onPageChange: (page: number) =>
                        router.get(globalThis.location.pathname, { ...filters, page }, { preserveState: true, preserveScroll: true }),
                    onPerPageChange: (pp: number) =>
                        router.get(
                            globalThis.location.pathname,
                            { ...filters, per_page: pp, page: 1 },
                            { preserveState: true, preserveScroll: true },
                        ),
                }}
            />
        </div>
    );
}
